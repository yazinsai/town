#!/usr/bin/env bun
// Exposes local Vite dev server via Cloudflare quick tunnel + QR code

import QRCode from "qrcode";

const VITE_PORT = 5173;
const TOWN_PASSWORD = process.env.TOWN_PASSWORD || "claude2024";
const URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

const proc = Bun.spawn(
  ["cloudflared", "tunnel", "--url", `http://localhost:${VITE_PORT}`],
  { stderr: "pipe", stdout: "inherit" }
);

const reader = proc.stderr.getReader();
const decoder = new TextDecoder();
let buffer = "";
let urlFound = false;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  process.stderr.write(chunk);

  if (!urlFound) {
    buffer += chunk;
    const match = buffer.match(URL_PATTERN);
    if (match) {
      urlFound = true;
      buffer = "";
      const url = `${match[0]}?p=${encodeURIComponent(TOWN_PASSWORD)}`;
      const qr = await QRCode.toString(url, { type: "terminal", small: true });
      console.log("\n" + qr);
      console.log(`  📱 Scan to open: ${url}\n`);
    }
  }
}
