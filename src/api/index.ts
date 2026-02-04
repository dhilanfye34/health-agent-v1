/**
 * API routes for the Health Coach agent.
 * Routes handle Slack webhooks, cron triggers, and direct message invocations.
 */

import { createRouter, validator } from '@agentuity/runtime';
import coach, { AgentOutput } from '../agent/coach';
import { s } from '@agentuity/schema';

const api = createRouter();

// Schema for direct message endpoint
export const MessageSchema = s.object({
	message: s.string().describe('Message to send to the health coach'),
});

// Schema for Slack webhook endpoint (passthrough)
export const SlackWebhookSchema = s.object({
	rawBody: s.string().optional(),
	payload: s.any().optional(),
	headers: s.record(s.string(), s.any()).optional(),
});

/**
 * POST /coach - Send a direct message to the health coach
 * Simple endpoint for testing or direct integration
 */
api.post('/coach', validator({ input: MessageSchema, output: AgentOutput }), async (c) => {
	const { message } = c.req.valid('json');
	const result = await coach.run({ message });
	
	if (result.contentType === 'json') {
		return c.json(result.body);
	}
	return c.text(String(result.body));
});

/**
 * POST /coach/slack - Slack Events API webhook
 * Receives events from Slack and processes them
 */
api.post('/coach/slack', async (c) => {
	const rawBody = await c.req.text();
	let payload: any = null;
	
	try {
		payload = JSON.parse(rawBody);
	} catch {
		// Non-JSON body (dev-mode ping text)
	}

	// Extract headers for signature verification
	const headers: Record<string, string> = {};
	c.req.raw.headers.forEach((value, key) => {
		headers[key] = value;
	});

	const result = await coach.run({
		rawBody,
		payload,
		headers,
	});

	if (result.contentType === 'json') {
		return c.json(result.body);
	}
	return c.text(String(result.body));
});

/**
 * POST /coach/reminder - Cron trigger endpoint
 * Sends a motivational reminder to the authorized user
 */
api.post('/coach/reminder', async (c) => {
	const result = await coach.run({ cron: true });
	return c.text(String(result.body));
});

/**
 * GET /coach/reminder - Alternative cron trigger (for GET-based cron services)
 */
api.get('/coach/reminder', async (c) => {
	const result = await coach.run({ cron: true });
	return c.text(String(result.body));
});

/**
 * GET /coach - Welcome message / health check
 */
api.get('/coach', (c) => {
	return c.json({
		welcome: "Hey! I'm your personal health coach. I can log workouts, share your WHOOP recovery, and keep you moving 💪",
		endpoints: {
			'POST /api/coach': 'Send a message to the health coach',
			'POST /api/coach/slack': 'Slack Events API webhook',
			'POST /api/coach/reminder': 'Trigger a motivational reminder',
		},
	});
});

export default api;
