import { Hono } from "hono";
import * as storage from "../storage";
import { broadcast } from "../websocket";

const app = new Hono();

// List trashed buildings
app.get("/", (c) => {
  const trashed = storage.getTrashedBuildings();
  return c.json(trashed);
});

// Restore a trashed building
app.post("/:id/restore", async (c) => {
  const building = await storage.restoreBuilding(c.req.param("id"));
  if (!building) return c.json({ error: "Not found in trash" }, 404);

  broadcast({ type: "building:restored", building });
  return c.json({ building });
});

// Permanently delete from trash
app.delete("/:id", async (c) => {
  const ok = await storage.permanentDeleteTrash(c.req.param("id"));
  if (!ok) return c.json({ error: "Not found in trash" }, 404);
  return c.json({ success: true });
});

export default app;
