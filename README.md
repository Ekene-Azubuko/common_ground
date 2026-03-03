# Common Ground

A real-time AI debate platform where AI agents customized with different personas argue any topic. Watch Socrates question Trump, see Nietzsche debate Gandhi, or create your own personas and pit them against each other.

## Features

- **AI vs AI Debates** — Watch two AI personas debate any topic in real-time with streaming responses
- **Human vs AI Mode** — Argue against an AI persona yourself
- **Built-in Personas** — Socrates, Trump, Nietzsche, Gandhi, Hitchens, Marx, Cleopatra, Obama
- **Custom Personas** — Create your own debaters with custom styles and backgrounds
- **Live Scoring** — AI judge scores each exchange and tracks momentum
- **Hot Take Moments** — Highlights when a debater lands a particularly strong point
- **Convergence Detection** — AI detects when debaters start finding common ground
- **Steer/Inject** — Pause the debate and inject moderator directions to pivot the conversation

## Tech Stack

- **Frontend**: React + Vite + Zustand (state management)
- **Backend**: Flask + Python
- **AI**: Claude (Anthropic) for debate generation and judging


## Quick Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Anthropic API key

### 1. Clone and install

```bash
git clone <repo-url>
cd common_ground
```

### 2. Backend setup

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `server/` directory:

```env
ANTHROPIC_API_KEY=your-api-key-here
```

### 3. Frontend setup

```bash
cd client
npm install
```

### 4. Run the app

**Terminal 1 — Backend:**
```bash
cd server
source venv/bin/activate
flask run
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open http://localhost:5173

## Configuration

Key settings in `server/project/config.py`:

| Setting | Default | Description |
|---------|---------|-------------|
| `DEBATE_MODEL` | `claude-haiku` | Model for debate responses |
| `JUDGE_MODEL` | `claude-haiku` | Model for scoring |
| `MAX_ROUNDS` | `15` | Maximum turns per debate |
| `CONVERGE_CHECK_START` | `6` | Round to start checking for convergence |

### Production Mode

Set `FLASK_ENV=production` to enable:
- Rate limiting (5 debates/day per user)
- Disable replay saving

```bash
FLASK_ENV=production flask run
```

## Project Structure

```
common_ground/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/          # useDebate, useStream, etc.
│       ├── lib/            # API client, config
│       └── store/          # Zustand state
└── server/                 # Flask backend
    └── project/
        ├── routes/         # API endpoints
        ├── services/       # LLM, TTS, storage
        ├── prompts/        # System prompts for personas
        └── models/         # Pydantic schemas
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/debate/turn` | Stream a debate turn |
| POST | `/api/debate/steer` | Inject moderator direction |
| GET | `/api/debate/personas` | List available personas |
| POST | `/api/judge/score` | Score an exchange |
| POST | `/api/judge/converge` | Check for convergence |
| POST | `/api/replay/save` | Save a completed debate |
| GET | `/api/replay/:id` | Load a saved debate |

## More info

- **Audio disabled** — Text-to-speech functionality (ElevenLabs/OpenAI) is currently disabled. The infrastructure exists but voice IDs are placeholders. Uncomment the audio code in `useDebate.js` when ready.
- **In-memory rate limiting** — Rate limits are stored in memory, so they reset on server restart. Use Redis for persistent limits in production.
- **Local replay storage** — Replays are saved as JSON files. For production, consider a database.

## License

MIT
