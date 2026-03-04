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
