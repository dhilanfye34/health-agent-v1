// src/agent/coach/api/reminder.ts

import { client } from '../lib/slack_utils';

export async function POST() {
	const userId = process.env.AUTHORIZED_USER_ID;

	if (!userId) {
		console.error('Missing AUTHORIZED_USER_ID');
		return new Response('Unauthorized', { status: 401 });
	}

	// Pick a random motivational message
	const messages = [
		"⏰ Stand up and stretch!",
		"🚶‍♂️ Quick 5-min walk break.",
		"💧 8 oz of water right now.",
		"🧘 60-second box-breathing: in-4, hold-4, out-4.",
		"🔥 20 desk push-ups?",
		"🧎‍♂️ 30-sec plank—core switch-on!"
	];

	const message = messages[Math.floor(Math.random() * messages.length)];

	try {
		await client.chat.postMessage({
			channel: userId,
			text: message ?? "",
		});

		return new Response('Reminder sent!', { status: 200 });
	} catch (err) {
		console.error('Slack message failed:', err);
		return new Response('Failed to send reminder', { status: 500 });
	}
}

