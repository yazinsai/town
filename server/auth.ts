import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getDeviceToken, createDeviceToken, touchDeviceToken } from "./storage";

const TOWN_PASSWORD = process.env.TOWN_PASSWORD || "claude2024";
const COOKIE_NAME = "town_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function authMiddleware(c: Context, next: Next) {
  // Check URL param — first-time login via QR code
  const urlPassword = c.req.query("p");
  if (urlPassword === TOWN_PASSWORD) {
    const device = await createDeviceToken();
    setCookie(c, COOKIE_NAME, device.token, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
    });
    await next();
    return;
  }

  // Check cookie — returning device
  const cookie = getCookie(c, COOKIE_NAME);
  if (cookie) {
    const device = getDeviceToken(cookie);
    if (device) {
      touchDeviceToken(cookie);
      await next();
      return;
    }
  }

  // Not authenticated
  const accept = c.req.header("accept") || "";
  const isApi =
    c.req.path.startsWith("/api/") ||
    accept.includes("application/json");

  if (isApi) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.html(loginPage(), 401);
}

function loginPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Claude Town - Login</title>
  <style>
    body { font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; color: #e0e0e0; }
    .login { text-align: center; padding: 2rem; border: 2px solid #c8a96e; border-radius: 8px; background: #16213e; }
    h1 { color: #c8a96e; }
    input { padding: 0.5rem 1rem; font-family: monospace; font-size: 1rem; border: 1px solid #c8a96e; background: #1a1a2e; color: #e0e0e0; border-radius: 4px; }
    button { padding: 0.5rem 1.5rem; font-family: monospace; font-size: 1rem; background: #c8a96e; color: #1a1a2e; border: none; border-radius: 4px; cursor: pointer; margin-left: 0.5rem; }
    button:hover { background: #d4b87a; }
  </style>
</head>
<body>
  <div class="login">
    <h1>Claude Town</h1>
    <p>Enter the town password</p>
    <form onsubmit="window.location.href='/?p='+document.getElementById('pw').value;return false;">
      <input id="pw" type="password" placeholder="Password" autofocus />
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}
