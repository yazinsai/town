import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { createBunWebSocket } from "hono/bun";
import { cors } from "hono/cors";
import { authMiddleware } from "./auth";
import { addClient, removeClient } from "./websocket";
import { initStorage } from "./storage";
import buildingRoutes from "./routes/buildings";
import agentRoutes from "./routes/agents";
import projectRoutes from "./routes/projects";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const app = new Hono();

// CORS for dev
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Login endpoint — before auth middleware
app.post("/api/auth/login", async (c) => {
  const { password } = await c.req.json<{ password: string }>();
  const TOWN_PASSWORD = process.env.TOWN_PASSWORD || "claude2024";
  if (password === TOWN_PASSWORD) {
    const { setCookie } = await import("hono/cookie");
    setCookie(c, "town_auth", TOWN_PASSWORD, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
    });
    return c.json({ ok: true });
  }
  return c.json({ error: "Invalid password" }, 401);
});

// Auth middleware for API and pages
app.use("/api/*", authMiddleware);

// WebSocket endpoint (before static files)
app.get(
  "/ws",
  upgradeWebSocket((c) => ({
    onOpen(event, ws) {
      addClient(ws.raw as any);
    },
    onClose(event, ws) {
      removeClient(ws.raw as any);
    },
    onMessage(event, ws) {
      // Handle ping/pong or future client messages
    },
  }))
);

// API routes
app.route("/api/buildings", buildingRoutes);
app.route("/api/agents", agentRoutes);
app.route("/api/projects", projectRoutes);

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Serve SPA static files in production
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

// Initialize storage on startup
await initStorage();

const port = parseInt(process.env.PORT || "3000");

const server = Bun.serve({
  port,
  fetch: app.fetch,
  websocket,
});

console.log(`Claude Town server running on http://localhost:${server.port}`);

// Clean shutdown
function shutdown() {
  console.log("Shutting down server...");
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
