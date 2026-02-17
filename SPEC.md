# Claude Town — Spec

A pixel art old-western town that visualizes and orchestrates Claude AI agent sessions across projects. Buildings represent projects, floors represent agent instances, and speech bubbles surface agents waiting for input.

---

## Core Metaphor

| Concept | Visual | Meaning |
|---------|--------|---------|
| Building | Pixel art western building | A project (e.g. `~/ai/projects/my-app`) |
| Floor | Horizontal section of a building | A single Claude agent instance |
| Person on floor | Pixel character working | Agent is busy (actively executing) |
| Speech bubble | Bubble above building | Agent is idle / waiting for user input |
| Building sign | Text on the building | Project name |
| Building style | Saloon, bank, general store, etc. | User-chosen when creating |

Multiple agents on the same project share one building (multi-floor). Each floor shows one agent.

---

## Architecture

### Agent Orchestration

The town app **is** the orchestrator. It uses the **Claude Agent SDK** (TypeScript) to spawn, manage, and communicate with agents. No external Claude Code CLI sessions — everything runs through the SDK.

Each agent gets:
- Full tool access (file read/write, bash, web search)
- Full MCP server access (same as the user's Claude Code setup — GSC, Trigger.dev, Context7, etc.)
- The project directory's `CLAUDE.md` as base system prompt, with optional per-agent overrides/appends
- Permission model: full access by default (restriction capabilities deferred to post-MVP)

### State Detection

Agent states to surface:
| State | Visual | Description |
|-------|--------|-------------|
| **Busy** | Character working, animated | Agent is actively executing tools/thinking |
| **Idle** | Character standing still | Agent finished its turn, waiting for next instruction |
| **Waiting for input** | Speech bubble with `?` | Agent asked a question (AskUserQuestion) |
| **Waiting for permission** | Speech bubble with `!` | Agent needs tool approval |
| **Completed** | Lights off / "closed" sign | Agent finished all work |
| **Error** | Red indicator | Agent crashed or hit an error |

All idle/waiting states show a speech bubble. The bubble icon/color differentiates the type.

### Tech Stack

- **Backend**: Node.js + Express (or Hono) — handles agent lifecycle, WebSocket connections, API
- **Frontend**: React + Vite SPA — pixel art rendering, real-time updates via WebSocket
- **Agent SDK**: `@anthropic-ai/claude-code` (Claude Agent SDK for TypeScript)
- **Rendering**: HTML/CSS sprites — div-based pixel art, CSS animations. Architected so canvas (PixiJS) can replace later if needed
- **Storage**: File-based JSON (`~/.claude-town/` or project-local `data/`)
- **Real-time**: WebSocket for live state updates between server and all connected clients
- **Deployment**: Dokku at `town.whhite.com`
- **Auth**: Simple password protection (single shared password, stored as env var)

---

## Features

### 1. Town View (Main Screen)

The primary UI. A pixel art western town landscape showing all active buildings.

- Horizontal scrollable town scene with dirt road, sky, ambient details
- Buildings arranged along the road, sized proportionally to number of agent floors
- Each building shows:
  - Project name on the sign
  - Number of floors = number of agents
  - Visual indicators for each agent's state
  - Speech bubbles floating above when agents need attention
- Clicking a building opens the **Building Detail View**
- Clicking a speech bubble opens the **Quick Response Panel**
- "Build New" button (hammer icon) to create a new building/agent
- Mobile-responsive — usable on phone screens

### 2. Building Detail View

Expanded view when clicking a building.

- Shows all floors/agents for that project
- Each floor displays:
  - Agent name/ID
  - Current state (busy/idle/waiting/done)
  - Brief summary of what the agent is currently doing
  - Expandable full conversation log (streaming)
- Actions:
  - Send a message to any agent on any floor
  - Add a new floor (spawn another agent on this project)
  - Archive/remove the building (user decides when to clean up)
  - Kill an individual agent

### 3. Quick Response Panel

Opened by clicking a speech bubble. Minimal overlay for fast responses.

- Shows the agent's question/prompt
- If Claude asked a multiple-choice question (AskUserQuestion with options): renders **clickable buttons** for each option
- Always shows a **text input box** underneath for freeform responses
- For permission requests: **Approve / Deny** buttons
- Submitting a response sends input directly back to the agent via the SDK
- Panel dismisses after responding, agent resumes work

### 4. New Building Flow

Creating a new agent/project from the town UI.

1. Click "Build New" button
2. **Select or enter project path** (e.g. `~/ai/projects/my-app`) — with autocomplete from `~/ai/projects/`
3. **Choose building style** from a set of pixel art western building sprites (saloon, bank, sheriff office, general store, hotel, etc.)
4. **Write initial prompt** — the task/instruction for the agent
5. **Optional: custom system prompt** — override or append to the project's CLAUDE.md
6. Click "Build" — building appears in town, agent starts working

### 5. Conversation View

Accessible from the Building Detail View by expanding a floor.

- **Summary mode** (default): Brief description of progress, key milestones, current task
- **Full log mode** (expandable): Complete conversation history with:
  - Agent messages (what Claude said/did)
  - Tool calls and results (collapsible)
  - User responses
  - Timestamps
- Streaming updates — new messages appear in real-time

### 6. Mobile Experience

Full control from phone/tablet.

- Responsive pixel art town (horizontal scroll, pinch-to-zoom)
- All features accessible: spawn agents, respond to questions, view logs, manage buildings
- Push notifications (future enhancement) for speech bubble events
- Touch-friendly buttons and inputs

---

## Data Model

### Building (Project)

```json
{
  "id": "uuid",
  "name": "my-app",
  "projectPath": "/Users/rock/ai/projects/my-app",
  "buildingStyle": "saloon",
  "createdAt": "2026-02-17T...",
  "agents": ["agent-uuid-1", "agent-uuid-2"]
}
```

### Agent (Floor)

```json
{
  "id": "uuid",
  "buildingId": "building-uuid",
  "state": "busy | idle | waiting_input | waiting_permission | completed | error",
  "currentTask": "Implementing auth flow",
  "initialPrompt": "Add JWT authentication to the Express API",
  "customSystemPrompt": null,
  "conversationLog": "path/to/conversation.jsonl",
  "createdAt": "2026-02-17T...",
  "completedAt": null
}
```

### Conversation Entry

```json
{
  "timestamp": "2026-02-17T...",
  "role": "assistant | user | tool_call | tool_result | system",
  "content": "...",
  "metadata": {}
}
```

---

## Agent Lifecycle

```
[User creates building]
  → Agent spawned via Claude Agent SDK
  → State: busy
  → Agent works autonomously

[Agent needs input]
  → State: waiting_input / waiting_permission
  → Speech bubble appears on building
  → User clicks bubble, responds
  → Response sent to agent via SDK
  → State: busy (resumes)

[Agent finishes]
  → State: completed
  → Building shows "closed" visual
  → Building persists until user archives it

[Agent errors]
  → State: error
  → Red indicator on building
  → User can view error, retry, or kill
```

---

## Visual Design

### Style
- **Pixel art, old western theme** — 16-bit aesthetic
- Earth tones: dusty browns, warm oranges, muted blues for sky
- Dirt road running horizontally through the town
- Sky with subtle gradient (can add day/night cycle later)

### Building Sprites (HTML/CSS)
- Each building type is a set of CSS-drawn pixel art elements
- Buildings scale vertically with number of floors
- Available styles: Saloon, Bank, Sheriff Office, General Store, Hotel, Blacksmith, Church, Post Office
- Signs rendered as text overlaid on wooden sign sprites

### Animation (MVP — Minimal)
- Speech bubbles: fade in/out with slight bounce
- Busy indicator: small animated dots or spinning gear
- Idle characters: subtle breathing/blinking animation
- Building construction: brief "building" animation when spawning new agent
- Designed for layering richer animations later (tumbleweeds, smoke, people walking)

### Responsive Layout
- Desktop: Full town panorama, buildings side-by-side
- Tablet: Slightly compressed, 2-3 buildings visible at a time
- Phone: 1-2 buildings visible, swipe to scroll, panels slide up from bottom

---

## API Routes

### REST API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth` | Authenticate with password |
| GET | `/api/buildings` | List all buildings |
| POST | `/api/buildings` | Create new building + spawn agent |
| GET | `/api/buildings/:id` | Get building details |
| DELETE | `/api/buildings/:id` | Archive/remove building |
| POST | `/api/buildings/:id/agents` | Spawn new agent on building |
| GET | `/api/agents/:id` | Get agent state + summary |
| POST | `/api/agents/:id/respond` | Send input to agent |
| POST | `/api/agents/:id/kill` | Kill agent |
| GET | `/api/agents/:id/conversation` | Get conversation log |
| GET | `/api/projects` | List available project directories |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `agent:state` | Server → Client | Agent state changed |
| `agent:message` | Server → Client | New conversation entry |
| `agent:question` | Server → Client | Agent is asking a question |
| `agent:completed` | Server → Client | Agent finished |
| `agent:error` | Server → Client | Agent errored |
| `building:created` | Server → Client | New building appeared |
| `building:removed` | Server → Client | Building archived |

---

## Security

- Password auth via env var `TOWN_PASSWORD`
- Session token (JWT or simple token) after auth, stored in cookie
- WebSocket connections authenticated via token
- Agent file access scoped to specified project directories
- API key for Anthropic stored server-side as env var
- No agent credentials exposed to frontend

---

## File Structure

```
town/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server/
│   ├── index.ts              # Express/Hono server entry
│   ├── auth.ts               # Password auth middleware
│   ├── routes/
│   │   ├── buildings.ts      # Building CRUD
│   │   ├── agents.ts         # Agent management
│   │   └── projects.ts       # List available projects
│   ├── agents/
│   │   ├── manager.ts        # Agent lifecycle management
│   │   ├── sdk.ts            # Claude Agent SDK integration
│   │   └── state.ts          # State tracking + persistence
│   ├── websocket.ts          # WebSocket server
│   └── storage.ts            # File-based JSON storage
├── src/
│   ├── main.tsx              # React entry
│   ├── App.tsx               # Router + auth wrapper
│   ├── components/
│   │   ├── town/
│   │   │   ├── TownScene.tsx       # Main town panorama
│   │   │   ├── Building.tsx        # Individual building component
│   │   │   ├── SpeechBubble.tsx    # Speech bubble overlay
│   │   │   ├── Road.tsx            # Ground/road element
│   │   │   └── Sky.tsx             # Sky background
│   │   ├── panels/
│   │   │   ├── QuickResponse.tsx   # Speech bubble response panel
│   │   │   ├── BuildingDetail.tsx  # Building expanded view
│   │   │   ├── NewBuilding.tsx     # Create building flow
│   │   │   └── ConversationLog.tsx # Full conversation view
│   │   ├── sprites/
│   │   │   ├── Saloon.tsx          # Building style components
│   │   │   ├── Bank.tsx
│   │   │   ├── SheriffOffice.tsx
│   │   │   ├── GeneralStore.tsx
│   │   │   └── ...
│   │   └── ui/
│   │       ├── PixelButton.tsx
│   │       ├── PixelInput.tsx
│   │       └── PixelText.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts        # WebSocket connection
│   │   ├── useBuildings.ts        # Building state
│   │   └── useAgent.ts            # Agent state
│   ├── styles/
│   │   ├── pixels.css             # Pixel art base styles
│   │   └── animations.css         # CSS animations
│   └── lib/
│       ├── api.ts                 # REST API client
│       └── types.ts               # Shared TypeScript types
├── data/                          # JSON storage (gitignored)
│   ├── buildings.json
│   └── agents/
│       ├── {agent-id}.json
│       └── {agent-id}.conversation.jsonl
├── Dockerfile                     # For dokku deployment
└── .env                           # ANTHROPIC_API_KEY, TOWN_PASSWORD
```

---

## Deferred (Post-MVP)

- Cost tracking per agent (token usage, estimated dollars)
- Per-agent permission restrictions
- Agent-to-agent communication
- Day/night cycle animation
- Tumbleweeds, smoke, ambient character animations
- Push notifications for mobile
- Ghost town / graveyard for archived buildings
- Budget caps per agent/global
- Canvas rendering upgrade (PixiJS) if HTML/CSS hits limits
