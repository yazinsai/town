#!/usr/bin/env bun
// Exposes local Vite dev server via named Cloudflare tunnel + QR code

import QRCode from "qrcode";

const VITE_PORT = 5173;
const TOWN_PASSWORD = process.env.TOWN_PASSWORD || "claude2024";
const TUNNEL_URL = "https://town.whhite.com";

const url = `${TUNNEL_URL}?p=${encodeURIComponent(TOWN_PASSWORD)}`;
const qr = await QRCode.toString(url, { type: "terminal", small: true });
console.log("\n" + qr);
console.log(`  📱 Scan to open: ${url}\n`);

const proc = Bun.spawn(
  ["cloudflared", "tunnel", "run", "--url", `http://localhost:${VITE_PORT}`, "claude-town"],
  { stderr: "pipe", stdout: "inherit" }
);

const reader = proc.stderr.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  process.stderr.write(decoder.decode(value, { stream: true }));
}
