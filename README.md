# Claude Town

A pixel art old-western town for visualizing and orchestrating [Claude AI](https://claude.ai) agent sessions. Built on the [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents/claude-agent-sdk).

Buildings are projects. Floors are agents. Speech bubbles mean an agent needs your attention.

![Claude Town](https://img.shields.io/badge/pixel_art-western_town-8B4513)

## How it works

| Town concept | What it represents |
|---|---|
| Building | A project directory (e.g. `~/projects/my-app`) |
| Floor | A single Claude agent working on that project |
| Speech bubble | Agent is waiting for your input |
| Window glow | Agent state — yellow = busy, dark = done, pulsing = waiting |

Each agent gets full Claude Code capabilities: file read/write, bash, web search, and all your MCP servers. You interact through the town UI instead of a terminal.

## Setup

```bash
# Clone
git clone https://github.com/yazinsai/town.git
cd town

# Install
bun install

# Configure
cp .env.example .env
# Edit .env — set TOWN_PASSWORD (default: claude2024)
# Your Anthropic API key is picked up from ~/.claude/ automatically

# Run
bun run dev
```

Open http://localhost:5173

## Usage

1. Click **+** to create a new building
2. Pick a project path, building style, and write an initial prompt
3. The agent starts working — watch the windows glow
4. If a speech bubble appears, click it to respond
5. Click any building to expand it — see conversation logs, send feedback, spawn more agents

## Architecture

```
Frontend (React 19 + Vite)     Backend (Hono + Bun)
  ├── Town scene                 ├── Claude Agent SDK sessions
  ├── Building sprites           ├── File-based JSON storage
  ├── Panel overlays             ├── WebSocket broadcasts
  └── WebSocket client           └── REST API
```

- **Real-time**: WebSocket pushes state changes, messages, and events to all connected clients
- **Session resume**: When you send feedback to a completed agent, it resumes with full conversation context via the SDK's `resume` option
- **State-aware visuals**: Building windows reflect agent state (flickering = busy, boarded up = done, pulsing = waiting)

## Stack

- **Runtime**: [Bun](https://bun.sh)
- **Backend**: [Hono](https://hono.dev)
- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Agents**: [@anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- **Font**: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)

## License

MIT
