#!/usr/bin/env bun
// Exposes local Vite dev server via named Cloudflare tunnel + QR code

import QRCode from "qrcode";

const VITE_PORT = 5173;
const TOWN_PASSWORD = process.env.TOWN_PASSWORD || "claude2024";
const TUNNEL_NAME = process.env.TUNNEL_NAME || "claude-town";
const TUNNEL_DOMAIN = process.env.TUNNEL_DOMAIN;

if (!TUNNEL_DOMAIN) {
  console.error("  ❌ TUNNEL_DOMAIN is not set. Add it to .env (e.g. TUNNEL_DOMAIN=mytown.example.com)");
  process.exit(1);
}

const TUNNEL_URL = `https://${TUNNEL_DOMAIN}`;
const url = `${TUNNEL_URL}?p=${encodeURIComponent(TOWN_PASSWORD)}`;
const qr = await QRCode.toString(url, { type: "terminal", small: true });
console.log("\n" + qr);
console.log(`  📱 Scan to open: ${url}\n`);

const proc = Bun.spawn(
  ["cloudflared", "tunnel", "run", "--url", `http://localhost:${VITE_PORT}`, TUNNEL_NAME],
  { stderr: "pipe", stdout: "inherit" }
);

const reader = proc.stderr.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  process.stderr.write(decoder.decode(value, { stream: true }));
}
