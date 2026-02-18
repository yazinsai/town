import { Hono } from "hono";
import * as storage from "../storage";
import { respondToAgent, killAgent } from "../agents/manager";
import { saveImages, buildPromptWithImages } from "../images";
import type { RespondToAgentRequest } from "../../shared/types";

const app = new Hono();

// Get agent state
app.get("/:id", (c) => {
  const agent = storage.getAgent(c.req.param("id"));
  if (!agent) return c.json({ error: "Agent not found" }, 404);
  return c.json(agent);
});

// Send input to agent
app.post("/:id/respond", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);

    const body = await c.req.json<RespondToAgentRequest>();
    if (!body.type) {
      return c.json({ error: "type is required (answer, permission, or message)" }, 400);
    }

    // Handle images: save to disk and append paths to message
    if (body.images && body.images.length > 0 && body.type === "message" && body.message) {
      const building = storage.getBuilding(agent.buildingId);
      if (building) {
        const paths = saveImages(body.images, building.projectPath);
        body.message = buildPromptWithImages(body.message, paths);
      }
    }

    await respondToAgent(agent.id, body);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Kill agent
app.post("/:id/kill", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);

    await killAgent(agent.id);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Get conversation log
app.get("/:id/conversation", async (c) => {
  const agent = storage.getAgent(c.req.param("id"));
  if (!agent) return c.json({ error: "Agent not found" }, 404);

  const conversation = await storage.getConversation(agent.id);
  return c.json(conversation);
});

export default app;
