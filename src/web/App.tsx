import { type ChangeEvent, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;

const EXAMPLE_MESSAGES = [
	"What's my recovery score today?",
	"Log workout: 30 min cycling",
	"How did I sleep last night?",
	"Show my recent workouts",
	"What's my current strain level?",
] as const;

interface CoachResponse {
	body: string | Record<string, any>;
	status?: number;
	contentType?: string;
}

export function App() {
	const [message, setMessage] = useState('');
	const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const sendMessage = useCallback(async (msg: string) => {
		if (!msg.trim()) return;
		
		setIsLoading(true);
		try {
			const res = await fetch('/api/coach', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: msg }),
			});
			
			const contentType = res.headers.get('content-type');
			if (contentType?.includes('application/json')) {
				const data = await res.json();
				setCoachResponse({ body: data, status: res.status, contentType: 'json' });
			} else {
				const text = await res.text();
				setCoachResponse({ body: text, status: res.status, contentType: 'text' });
			}
		} catch (err) {
			setCoachResponse({ body: '⚠️ Failed to reach the coach', status: 500, contentType: 'text' });
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSendMessage = useCallback(async () => {
		await sendMessage(message);
	}, [message, sendMessage]);

	const handleExampleClick = useCallback(async (exampleMessage: string) => {
		setMessage(exampleMessage);
		await sendMessage(exampleMessage);
	}, [sendMessage]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	}, [handleSendMessage]);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-8 relative text-center">
					<div className="text-6xl mb-4">💪</div>

					<h1 className="text-5xl font-thin">Health Coach</h1>

					<p className="text-gray-400 text-lg">
						Your personal <span className="italic font-serif text-emerald-400">AI fitness assistant</span> powered by WHOOP
					</p>
				</div>

				{/* Chat Interface */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
					<div className="items-center flex flex-wrap gap-1.5 text-sm">
						Ask about your
						<span className="text-emerald-400 font-medium">recovery</span>,
						<span className="text-blue-400 font-medium">sleep</span>,
						<span className="text-orange-400 font-medium">strain</span>,
						or log a workout
					</div>

					<div className="flex gap-3">
						<textarea
							className="flex-1 text-sm bg-gray-950 border border-gray-800 rounded-md text-white resize-none py-3 px-4 min-h-[80px] focus:outline-emerald-500 focus:outline-2 focus:outline-offset-2 z-10"
							disabled={isLoading}
							onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.currentTarget.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask your health coach anything..."
							rows={3}
							value={message}
						/>
						
						<div className="relative group z-0">
							<div className="absolute inset-0 bg-linear-to-r from-emerald-700 via-teal-500 to-cyan-600 rounded-lg blur-xl opacity-75 group-hover:blur-2xl group-hover:opacity-100 transition-all duration-700" />
							<div className="absolute inset-0 bg-emerald-500/50 rounded-lg blur-3xl opacity-50" />

							<button
								className="relative h-full font-semibold text-white px-6 py-2 bg-gray-950 rounded-lg shadow-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isLoading || !message.trim()}
								onClick={handleSendMessage}
								type="button"
							>
								{isLoading ? '...' : 'Send'}
							</button>
						</div>
					</div>

					{/* Example Messages */}
					<div className="flex flex-wrap gap-2">
						{EXAMPLE_MESSAGES.map((example) => (
							<button
								key={example}
								type="button"
								disabled={isLoading}
								onClick={() => handleExampleClick(example)}
								className="text-xs bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5 text-gray-400 hover:text-white hover:border-emerald-600 hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
							>
								{example}
							</button>
						))}
					</div>

					{/* Response */}
					{isLoading ? (
						<div
							className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-4 px-4 animate-pulse"
						>
							🤔 Thinking...
						</div>
					) : coachResponse?.body ? (
						<div className="flex flex-col gap-3">
							<div className="text-sm bg-gray-950 border border-emerald-900 rounded-md text-emerald-400 py-4 px-4 whitespace-pre-wrap">
								{typeof coachResponse.body === 'string' 
									? coachResponse.body 
									: JSON.stringify(coachResponse.body, null, 2)}
							</div>
						</div>
					) : (
						<div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-4 px-4">
							Coach response will appear here
						</div>
					)}
				</div>

				{/* Features Section */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">Features</h3>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[
							{
								icon: '❤️',
								title: 'WHOOP Integration',
								description: 'Get your recovery score, HRV, sleep quality, and strain data',
							},
							{
								icon: '🏋️',
								title: 'Workout Logging',
								description: 'Track your workouts with activity type, duration, and notes',
							},
							{
								icon: '💬',
								title: 'Slack Integration',
								description: 'Interact with your coach directly from Slack DMs or channels',
							},
						].map((feature) => (
							<div key={feature.title} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
								<div className="text-2xl mb-2">{feature.icon}</div>
								<h4 className="text-white text-sm font-medium mb-1">{feature.title}</h4>
								<p className="text-gray-500 text-xs">{feature.description}</p>
							</div>
						))}
					</div>
				</div>

				{/* Next Steps */}
				<div className="bg-black border border-gray-900 rounded-lg p-8">
					<h3 className="text-white text-xl font-normal leading-none m-0 mb-6">Setup</h3>

					<div className="flex flex-col gap-4 text-sm">
						{[
							{
								step: '1',
								title: 'Configure Environment',
								text: 'Set SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, WHOOP_ACCESS_TOKEN, and DATABASE_URL',
							},
							{
								step: '2',
								title: 'Set up Slack App',
								text: 'Point your Slack app\'s Event Subscriptions URL to /api/coach/slack',
							},
							{
								step: '3',
								title: 'Connect WHOOP',
								text: 'Get your WHOOP API access token from the developer portal',
							},
							WORKBENCH_PATH
								? {
									step: '4',
									title: (
										<>
											Try{' '}
											<a href={WORKBENCH_PATH} className="underline text-emerald-400">
												Workbench
											</a>
										</>
									),
									text: 'Test the coach agent directly in the dev UI',
								}
								: null,
						]
							.filter((step): step is NonNullable<typeof step> => Boolean(step))
							.map((step) => (
								<div key={step.step} className="flex gap-3 items-start">
									<div className="flex items-center justify-center size-6 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 text-xs font-medium shrink-0">
										{step.step}
									</div>
									<div>
										<h4 className="text-white font-medium">{step.title}</h4>
										<p className="text-gray-500 text-xs">{step.text}</p>
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
