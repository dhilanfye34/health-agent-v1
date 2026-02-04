/**
 * Health Coach Agent: A Slack-integrated fitness assistant that connects to WHOOP
 * for health metrics, logs workouts, and provides AI-powered fitness advice.
 * 
 * Migrated from v0 to v1 Agentuity SDK.
 */
import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';

import { generateResponse } from './generate_response';
import { POST as sendReminder } from './api/reminder';
import { verifyRequest, getBotId } from './lib/slack_utils';
import { handleNewAssistantMessage } from './lib/handle_messages';
import { handleAppMention } from './lib/handle_app_mention';

// Input schema - supports multiple payload types
export const AgentInput = s.object({
	// Raw body for Slack Events API and dev-mode
	rawBody: s.string().optional().describe('Raw request body text'),
	// Parsed payload for structured requests
	payload: s.any().optional().describe('Parsed JSON payload from request'),
	// Headers for Slack signature verification
	headers: s.record(s.string(), s.any()).optional().describe('Request headers'),
	// Direct message for dev-mode/simple invocation
	message: s.string().optional().describe('Direct message for LLM response'),
	// Cron trigger flag
	cron: s.boolean().optional().describe('Whether this is a cron trigger'),
});

export type CoachInput = s.infer<typeof AgentInput>;

// Output schema
export const AgentOutput = s.object({
	// Response body
	body: s.any().describe('Response body'),
	// HTTP status code
	status: s.number().optional().describe('HTTP status code'),
	// Content type
	contentType: s.string().optional().describe('Response content type'),
});

export type CoachOutput = s.infer<typeof AgentOutput>;

// Welcome message for the agent
export const welcome = () => ({
	welcome:
		"Hey! I'm your personal health coach. I can log workouts, share your WHOOP recovery, and keep you moving 💪",
});

const agent = createAgent('coach', {
	description: 'Personal health coach that integrates with Slack and WHOOP for fitness tracking and advice',
	schema: {
		input: AgentInput,
		output: AgentOutput,
	},
	handler: async (ctx, input) => {
		try {
			const { rawBody, payload, headers, message, cron } = input;

			// 1. Direct message mode (simple invocation)
			if (message) {
				const reply = await generateResponse([{ role: 'user', content: message }]);
				return { body: reply, status: 200, contentType: 'text' as const };
			}

			// 2. Cron trigger
			if (cron || (rawBody && rawBody.includes('"cron"'))) {
				const r = await sendReminder();
				return { body: await r.text(), status: r.status, contentType: 'text' as const };
			}

			// 3. If we have a payload, process Slack events
			if (payload) {
				// 3a. Slack URL-verification
				if (payload.type === 'url_verification') {
					return { body: { challenge: payload.challenge }, status: 200, contentType: 'json' as const };
				}

				// 3b. Slack Events API
				if (payload.event) {
					// Signature verification (if headers provided)
					if (headers && rawBody) {
						const hdrs = new Headers();
						Object.entries(headers).forEach(([k, v]) => 
							hdrs.set(k, Array.isArray(v) ? (v[0] ?? '') : (v ?? ''))
						);

						await verifyRequest({
							request: new Request('https://dummy', { headers: hdrs }),
							rawBody,
						});
					}

					const evt = payload.event;
					const botUserId = await getBotId();
					const allowedUser = process.env.AUTHORIZED_USER_ID;

					// 3c. @-mentions (channels or DMs)
					if (evt.type === 'app_mention') {
						if (allowedUser && evt.user !== allowedUser) {
							return { body: 'ignored', status: 200, contentType: 'text' as const };
						}
						await handleAppMention(evt as any);
						return { body: 'ok', status: 200, contentType: 'text' as const };
					}

					// 3d. Direct messages to the bot
					if (
						evt.type === 'message' &&
						evt.channel_type === 'im' &&
						!evt.bot_id // ignore other bots
					) {
						if (allowedUser && evt.user !== allowedUser) {
							return { body: 'ignored', status: 200, contentType: 'text' as const };
						}
						await handleNewAssistantMessage(evt as any, botUserId);
						return { body: 'ok', status: 200, contentType: 'text' as const };
					}

					return { body: 'ignored', status: 200, contentType: 'text' as const };
				}
			}

			// 4. Empty or cron ping without explicit flag
			if (!rawBody) {
				const r = await sendReminder();
				return { body: await r.text(), status: r.status, contentType: 'text' as const };
			}

			// 5. Dev-mode free text, LLM
			const reply = await generateResponse([{ role: 'user', content: rawBody }]);
			return { body: reply, status: 200, contentType: 'text' as const };

		} catch (err) {
			ctx.logger.error('top-level error', err);
			return { body: '⚠️ internal error', status: 500, contentType: 'text' as const };
		}
	},
});

export default agent;

