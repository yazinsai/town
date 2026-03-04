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
