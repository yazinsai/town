# npx claude-town — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Claude Town runnable via `npx claude-town` with a startup banner showing QR code, network URLs, and usage notes.

**Architecture:** Thin Node CLI bin script checks for Bun, spawns the server. Server itself prints the startup banner with QR code and info. Data directory moves to `~/.claude-town/` for persistence across updates. Pre-built frontend ships in the package via `prepublishOnly`.

**Tech Stack:** Bun, Hono, qrcode (terminal), os.networkInterfaces()

---

### Task 1: Add startup banner to server

The server should print a welcome banner on startup with QR code, local/network URLs, and usage notes. This applies to all run modes (dev, production, npx).

**Files:**
- Create: `server/banner.ts`
- Modify: `server/index.ts:95-103`
- Modify: `package.json` (move `qrcode` from devDependencies to dependencies)

**Step 1: Move qrcode to dependencies in package.json**

Change `package.json`: move `"qrcode": "^1.5.4"` from `devDependencies` to `dependencies`.

**Step 2: Create `server/banner.ts`**

```typescript
import QRCode from "qrcode";
import { networkInterfaces } from "os";

function getNetworkUrl(port: number): string | null {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return `http://${net.address}:${port}`;
      }
    }
  }
  return null;
}

export async function printBanner(port: number, cwd: string) {
  const localUrl = `http://localhost:${port}`;
  const networkUrl = getNetworkUrl(port);
  const qrTarget = networkUrl || localUrl;

  let qr = "";
  try {
    qr = await QRCode.toString(qrTarget, { type: "terminal", small: true });
  } catch {
    // QR generation failed — skip it
  }

  const lines = [
    "",
    "  ╔══════════════════════════════════════╗",
    "  ║        Welcome to Claude Town        ║",
    "  ╚══════════════════════════════════════╝",
    "",
  ];

  if (qr) {
    lines.push(...qr.split("\n").map((l) => "  " + l));
    lines.push("");
    lines.push("  Scan to open on your phone (same Wi-Fi network)");
    lines.push("");
  }

  lines.push(`  Local:   ${localUrl}`);
  if (networkUrl) {
    lines.push(`  Network: ${networkUrl}`);
  }

  lines.push("");
  lines.push("  ── About ──────────────────────────────────");
  lines.push("  Runs entirely on your machine");
  lines.push("  Uses your Claude Code subscription (no API key needed)");
  lines.push(`  Working directory: ${cwd}`);
  lines.push("    Folders inside are accessible to agents");
  lines.push("    You can also use absolute paths in the app");
  lines.push("  Must stay connected to the internet");
  lines.push("  Agents can read your environment variables");
  lines.push("  ───────────────────────────────────────────");
  lines.push("");
  lines.push("  Ctrl+C to stop");
  lines.push("");

  console.log(lines.join("\n"));
}
```

**Step 3: Wire banner into `server/index.ts`**

Replace the current `console.log` at line 103 with:

```typescript
import { printBanner } from "./banner";

// ... after Bun.serve():
await printBanner(server.port, process.cwd());
```

Remove the old: `console.log(\`Claude Town server running on http://localhost:${server.port}\`);`

**Step 4: Run `bun run dev:server` and verify banner prints**

Expected: banner with QR code, URLs, and info notes appear in terminal.

**Step 5: Commit**

```bash
git add server/banner.ts server/index.ts package.json
git commit -m "feat: add startup banner with QR code and usage notes"
```

---

### Task 2: Make data directory configurable

Move data storage from `./data` (relative) to `~/.claude-town/` by default for production. Keep `./data` for development.

**Files:**
- Modify: `server/storage.ts:1-18`

**Step 1: Update DATA_DIR logic in `server/storage.ts`**

Replace the hardcoded paths at the top:

```typescript
import { homedir } from "os";
import { join } from "path";

function resolveDataDir(): string {
  // Explicit override
  if (process.env.CLAUDE_TOWN_DATA_DIR) return process.env.CLAUDE_TOWN_DATA_DIR;
  // Development: use local ./data
  if (process.env.NODE_ENV !== "production") return "./data";
  // Production: use ~/.claude-town
  return join(homedir(), ".claude-town");
}

const DATA_DIR = resolveDataDir();
const BUILDINGS_FILE = join(DATA_DIR, "buildings.json");
const AGENTS_DIR = join(DATA_DIR, "agents");
const TRASH_DIR = join(DATA_DIR, "trash");
const TRASH_MANIFEST = join(TRASH_DIR, "manifest.json");
const TRASH_AGENTS_DIR = join(TRASH_DIR, "agents");
const DEVICES_FILE = join(DATA_DIR, "devices.json");
```

**Step 2: Run `bun run dev:server` and verify it still uses `./data`**

Expected: `Loaded N buildings, N agents...` from `./data`.

**Step 3: Test production mode**

```bash
NODE_ENV=production bun server/index.ts
```

Expected: creates `~/.claude-town/` and loads from there.

**Step 4: Commit**

```bash
git add server/storage.ts
git commit -m "feat: configurable data directory, defaults to ~/.claude-town in production"
```

---

### Task 3: Update projects route to use cwd instead of hardcoded path

Currently `PROJECTS_ROOT` is hardcoded to `~/ai/projects`. For public use, default to the current working directory.

**Files:**
- Modify: `server/routes/projects.ts:8`

**Step 1: Change PROJECTS_ROOT**

Replace:
```typescript
export const PROJECTS_ROOT = join(homedir(), "ai", "projects");
```

With:
```typescript
export const PROJECTS_ROOT = process.env.CLAUDE_TOWN_PROJECTS_ROOT || process.cwd();
```

**Step 2: Verify it works**

Start server from a project directory and check that `/api/projects` lists directories in cwd.

**Step 3: Commit**

```bash
git add server/routes/projects.ts
git commit -m "feat: default projects root to cwd instead of hardcoded path"
```

---

### Task 4: Fix static file serving for npm package

When installed via npm, the `dist/` folder is inside the package, not the cwd. The server needs to resolve the path relative to the package root.

**Files:**
- Modify: `server/index.ts:77-80`

**Step 1: Update static file serving path**

Replace the production static serving block:

```typescript
if (process.env.NODE_ENV === "production") {
  const pkgRoot = new URL("..", import.meta.url).pathname;
  const distPath = join(pkgRoot, "dist");
  app.use("/*", serveStatic({ root: distPath }));
  app.get("*", serveStatic({ path: join(distPath, "index.html") }));
}
```

Add `import { join } from "path";` at the top if not already imported.

**Step 2: Build frontend and test**

```bash
bun run build
NODE_ENV=production bun server/index.ts
```

Expected: visiting http://localhost:3000 serves the React app.

**Step 3: Commit**

```bash
git add server/index.ts
git commit -m "fix: resolve dist path relative to package root for npm installs"
```

---

### Task 5: Create CLI bin script

Create the Node-compatible launcher that `npx` will execute.

**Files:**
- Create: `bin/claude-town.mjs`

**Step 1: Create `bin/claude-town.mjs`**

```javascript
#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = join(__dirname, "..");

// Parse args
const args = process.argv.slice(2);
let port = "3000";
let noOpen = false;
let password = "";
let dataDir = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" && args[i + 1]) { port = args[++i]; }
  else if (args[i] === "--no-open") { noOpen = true; }
  else if (args[i] === "--password" && args[i + 1]) { password = args[++i]; }
  else if (args[i] === "--data-dir" && args[i + 1]) { dataDir = args[++i]; }
  else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
  Usage: claude-town [options]

  Options:
    --port <number>     Port to run on (default: 3000)
    --no-open           Don't auto-open browser
    --password <string> Set town password (default: auto-generated)
    --data-dir <path>   Data directory (default: ~/.claude-town)
    -h, --help          Show this help
`);
    process.exit(0);
  }
}

// Check for bun
try {
  execSync("bun --version", { stdio: "ignore" });
} catch {
  console.error(`
  Claude Town requires Bun to run.

  Install it:  curl -fsSL https://bun.sh/install | bash

  Then try again: npx claude-town
`);
  process.exit(1);
}

// Build env
const env = {
  ...process.env,
  NODE_ENV: "production",
  PORT: port,
};
if (password) env.TOWN_PASSWORD = password;
if (dataDir) env.CLAUDE_TOWN_DATA_DIR = dataDir;

// Spawn bun server
const serverPath = join(pkgRoot, "server", "index.ts");
const child = spawn("bun", [serverPath], {
  env,
  stdio: "inherit",
  cwd: process.cwd(),
});

// Auto-open browser
if (!noOpen) {
  setTimeout(() => {
    const url = `http://localhost:${port}`;
    const cmd = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start"
      : "xdg-open";
    try { execSync(`${cmd} ${url}`, { stdio: "ignore" }); } catch {}
  }, 1500);
}

// Forward signals
process.on("SIGINT", () => { child.kill("SIGINT"); });
process.on("SIGTERM", () => { child.kill("SIGTERM"); });
child.on("exit", (code) => { process.exit(code ?? 0); });
```

**Step 2: Make it executable**

```bash
chmod +x bin/claude-town.mjs
```

**Step 3: Test locally**

```bash
node bin/claude-town.mjs --port 3001 --no-open
```

Expected: server starts on port 3001, banner prints.

**Step 4: Commit**

```bash
git add bin/claude-town.mjs
git commit -m "feat: add CLI launcher for npx claude-town"
```

---

### Task 6: Update package.json for npm publishing

Remove `private`, add `bin`, `files`, `prepublishOnly`, and other npm metadata.

**Files:**
- Modify: `package.json`

**Step 1: Update package.json**

Apply these changes:

1. Remove `"private": true`
2. Add `"bin": { "claude-town": "bin/claude-town.mjs" }`
3. Add `"files": ["bin/", "server/", "shared/", "dist/", "README.md"]`
4. Add to scripts: `"prepublishOnly": "vite build"`
5. Add metadata:
   ```json
   "description": "A pixel art western town where your AI agents live and work. Visual orchestrator for the Claude Agent SDK.",
   "license": "MIT",
   "repository": {
     "type": "git",
     "url": "https://github.com/yazinsai/claude-town"
   },
   "keywords": ["claude", "agent", "sdk", "ai", "pixel-art", "orchestrator", "claude-code"],
   "engines": {
     "bun": ">=1.0.0"
   }
   ```

**Step 2: Verify with `npm pack --dry-run`**

```bash
npm pack --dry-run
```

Expected: lists only the files in the `files` array.

**Step 3: Commit**

```bash
git add package.json
git commit -m "feat: configure package.json for npm publishing"
```

---

### Task 7: Rewrite README for open-source audience

**Files:**
- Modify: `README.md`

**Step 1: Rewrite README**

Keep the personality and pixel art theme. New structure:

1. Hero banner + tagline (keep existing)
2. **Quick start** — `npx claude-town` front and center
3. **Requirements** — Bun, Claude Code, git
4. **How it works** — visual explanation (keep existing building states table)
5. **CLI options** — `--port`, `--no-open`, `--password`, `--data-dir`
6. **The stack** — (keep existing table)
7. **Building styles** — (keep existing)
8. **Development** — for contributors: `git clone`, `bun install`, `bun run dev`
9. Footer

Key changes from current README:
- Replace the "Get it running" section (git clone + bun install) with `npx claude-town`
- Move the git clone instructions to a "Development" section at the bottom
- Add requirements section noting Bun + Claude Code subscription
- Add CLI options section
- Remove `.env.example` setup from quickstart (password auto-generates, no API key needed)

**Step 2: Review the README renders correctly**

Read through to check formatting, links, and flow.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for npx claude-town quickstart"
```

---

### Task 8: Add .npmignore and verify package contents

Ensure dev-only files don't ship in the npm package.

**Files:**
- Create: `.npmignore`

**Step 1: Create `.npmignore`**

```
src/
scripts/
docs/
data/
static/
.env*
.gitignore
tsconfig.json
vite.config.ts
SPEC.md
*.tgz
.claude*
```

Note: We use `.npmignore` alongside `files` in package.json for belt-and-suspenders safety.

**Step 2: Build and pack**

```bash
bun run build
npm pack --dry-run
```

Verify: only `bin/`, `server/`, `shared/`, `dist/`, `README.md`, `package.json` are listed.

**Step 3: Commit**

```bash
git add .npmignore
git commit -m "chore: add .npmignore for clean npm package"
```

---

### Task 9: End-to-end test

**Step 1: Build the package**

```bash
bun run build
npm pack
```

**Step 2: Install and run from a temp directory**

```bash
cd /tmp
mkdir test-town && cd test-town
npm install ~/ai/projects/town/claude-town-0.1.0.tgz
npx claude-town --no-open --port 4000
```

Expected: banner prints with QR, server starts on :4000, data goes to `~/.claude-town/`.

**Step 3: Verify frontend loads**

```bash
curl -s http://localhost:4000 | head -20
```

Expected: HTML with React app.

**Step 4: Clean up**

```bash
cd ~ && rm -rf /tmp/test-town
```

No commit needed — this is validation only.
