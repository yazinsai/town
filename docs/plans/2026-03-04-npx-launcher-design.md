# npx claude-town — Launcher & npm Package

## Goal

Make Claude Town installable and runnable via `npx claude-town`. One command to boot the server, open the browser, and start managing agents.

## Architecture

### CLI Launcher (`bin/claude-town.mjs`)

A thin Node-compatible script (because `npx` runs with Node):

1. Parse CLI args: `--port`, `--no-open`, `--password`
2. Check if `bun` is installed — if not, print install instructions and exit
3. Resolve the path to `server/index.ts` within the package
4. Spawn `bun server/index.ts` with env vars (`PORT`, `TOWN_PASSWORD`, `NODE_ENV=production`)
5. Handle Ctrl+C gracefully (forward signal to child)

### Startup Banner (server-side)

The server itself (not the CLI) prints the startup banner. This means `bun run dev`, `bun run start`, and `npx claude-town` all show the same output:

```
  ╔══════════════════════════════════════╗
  ║          Welcome to Claude Town      ║
  ╚══════════════════════════════════════╝

  ▄▄▄▄▄▄▄  ▄  ▄▄▄ ▄▄▄▄▄▄▄
  █ ...QR code... █

  Scan to open on your phone (same Wi-Fi network)

  Local:   http://localhost:3000
  Network: http://192.168.1.42:3000

  ── About ──────────────────────────────
  Runs entirely on your machine
  Uses your Claude Code subscription (no API key needed)
  Working directory: /Users/you/project
    Folders inside are accessible to agents
    You can also use absolute paths in the app
  Must stay connected to the internet
  Agents can read your environment variables
  ────────────────────────────────────────

  Ctrl+C to stop
```

- QR code points to the network URL for quick mobile access
- LAN IP auto-detected via `os.networkInterfaces()`
- `qrcode` package moved from devDependencies to dependencies

### Data Directory

Change from `./data` (relative, gets wiped on package update) to `~/.claude-town/`:

```
~/.claude-town/
├── buildings.json
├── agents/
├── trash/
└── devices.json
```

The `DATA_DIR` in `storage.ts` becomes configurable, defaulting to `~/.claude-town/` in production and `./data` in development.

### Package Configuration

```json
{
  "name": "claude-town",
  "version": "0.1.0",
  "private": false,
  "bin": { "claude-town": "bin/claude-town.mjs" },
  "files": ["bin/", "server/", "shared/", "dist/", "package.json", "README.md"],
  "scripts": {
    "prepublishOnly": "vite build"
  }
}
```

### Static File Serving

In production, the server serves pre-built frontend from `dist/` relative to the package root (not cwd). The path resolution in `server/index.ts` needs to use `import.meta.dir` or similar to find the `dist/` folder within the installed package.

### README Rewrite

Rewrite for open-source audience:
- Lead with `npx claude-town` as the primary install method
- Keep the personality and pixel art theme
- Add requirements section (Bun, Claude Code, git)
- Add CLI options documentation
- Keep the "how it works" visual explanation
- Add development section for contributors

## What Ships in the npm Package

```
claude-town/
├── bin/claude-town.mjs     # CLI launcher (Node-compatible)
├── server/                 # Bun server source
├── shared/                 # Shared TypeScript types
├── dist/                   # Pre-built React frontend
├── package.json
└── README.md
```

## Requirements for Users

- **Bun** — server runtime (uses Bun.serve, Bun.file, etc.)
- **Claude Code** subscription — Agent SDK authenticates through it, no API key needed
- **git** — for worktree isolation per agent

## CLI Options

```
npx claude-town [options]

Options:
  --port <number>     Port to run on (default: 3000)
  --no-open           Don't auto-open browser
  --password <string> Set town password (default: random)
  --data-dir <path>   Data directory (default: ~/.claude-town)
```
