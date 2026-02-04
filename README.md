# Health Coach Agent 🏋️

A personal AI health coach that integrates with **Slack** and **WHOOP** to track your fitness, log workouts, and provide AI-powered coaching advice.

## Features

- **WHOOP Integration** — Fetches your real-time recovery score, HRV, sleep metrics, and daily strain
- **Slack Bot** — Chat with your coach via DMs or @mentions in channels
- **Workout Logging** — Track workouts with activity type, duration, and notes
- **Motivational Reminders** — Scheduled nudges for movement breaks, hydration, and micro-workouts
- **AI-Powered Advice** — GPT-4o-mini analyzes your WHOOP data to give personalized training recommendations

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/) + [Agentuity](https://agentuity.dev)
- **AI**: [OpenAI GPT-4o-mini](https://openai.com/) via Vercel AI SDK
- **Database**: [Neon PostgreSQL](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Integrations**: [Slack Web API](https://api.slack.com/), [WHOOP API](https://developer.whoop.com/)
- **Frontend**: React 19 + Tailwind CSS

## Project Structure

```
health-agent-v1/
├── src/
│   ├── agent/coach/          # Health coach agent
│   │   ├── index.ts          # Agent definition & handler
│   │   ├── generate_response.ts  # LLM response generation
│   │   ├── tools.ts          # AI tools (WHOOP fetch, workout log)
│   │   ├── api/
│   │   │   └── reminder.ts   # Motivational reminder logic
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle schema (workouts table)
│   │   │   ├── connection.ts # Neon DB connection
│   │   │   └── ops.ts        # Database operations
│   │   └── lib/
│   │       ├── slack_utils.ts    # Slack client & verification
│   │       ├── whoop_utils.ts    # WHOOP API helpers
│   │       ├── handle_messages.ts    # DM handler
│   │       └── handle_app_mention.ts # @mention handler
│   ├── api/
│   │   └── index.ts          # API routes
│   └── web/                  # React frontend
├── agentuity.json            # Agentuity config
├── package.json
└── tsconfig.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/coach` | Welcome message & endpoint list |
| `POST` | `/api/coach` | Send a direct message to the coach |
| `POST` | `/api/coach/slack` | Slack Events API webhook |
| `GET/POST` | `/api/coach/reminder` | Trigger a motivational reminder |

## Environment Variables

Create a `.env` file:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
AUTHORIZED_USER_ID=U...        # Your Slack user ID (optional, restricts access)

# WHOOP
WHOOP_ACCESS_TOKEN=...
WHOOP_USER_ID=...

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...
```

## Commands

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Type check
bun typecheck

# Build for production
bun run build

# Deploy to Agentuity cloud
bun run deploy

# Database migrations
bun run db:generate   # Generate migrations
bun run db:push       # Push schema to database
```

## Usage Examples

### Chat with your coach in Slack

> **You:** How's my recovery today?  
> **Coach:** Your recovery is at 78% 💚 with an HRV of 45ms. You're good to push today — maybe a strength session or interval run!

> **You:** Log workout: 30 min cycling  
> **Coach:** ✅ Logged! 30 min of cycling — nice work! 🚴

> **You:** What were my last workouts?  
> **Coach:** Here are your last 3 workouts:  
> • Cycling — 30 min (on 2/3/2026)  
> • Running — 45 min (on 2/1/2026)  
> • Strength — 60 min (on 1/30/2026)

### Motivational Reminders

The `/api/coach/reminder` endpoint sends random motivational nudges:
- ⏰ Stand up and stretch!
- 🚶‍♂️ Quick 5-min walk break
- 💧 8 oz of water right now
- 🧘 60-second box-breathing
- 🔥 20 desk push-ups?
- 🧎‍♂️ 30-sec plank—core switch-on!

## Slack App Setup

1. Create a new Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Event Subscriptions** and set the request URL to `https://your-deployment.agentuity.run/api/coach/slack`
3. Subscribe to bot events: `app_mention`, `message.im`
4. Enable **OAuth & Permissions** with scopes: `chat:write`, `im:history`, `app_mentions:read`
5. Install the app to your workspace and copy the Bot Token

## WHOOP API Setup

1. Create a developer account at [developer.whoop.com](https://developer.whoop.com/)
2. Create an OAuth app and authorize access to your account
3. Generate an access token with scopes: `read:recovery`, `read:sleep`, `read:cycles`

## License

Apache-2.0
