import { Hono } from "hono";
import * as storage from "../storage";
import { respondToAgent, killAgent } from "../agents/manager";
import { saveImages, buildPromptWithImages } from "../images";
import { mergeWorktree, cleanupWorktree, discardWorktree, revertMerge } from "../worktree";
import { broadcast } from "../websocket";
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

// Manual merge (for failed auto-merge or killed agents)
app.post("/:id/merge", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);

    if (agent.mergeStatus !== "pending" || !agent.branchName) {
      return c.json({ error: "Agent has no pending merge" }, 400);
    }

    const building = storage.getBuilding(agent.buildingId);
    if (!building) return c.json({ error: "Building not found" }, 404);

    const result = await mergeWorktree(building.projectPath, agent.branchName, building.id);
    if (!result.success) {
      return c.json({ error: result.error }, 409);
    }

    if (agent.worktreePath) {
      await cleanupWorktree(building.projectPath, agent.worktreePath, agent.branchName);
    }

    await storage.updateAgent(agent.id, {
      mergeStatus: "merged",
      mergeCommitSha: result.mergeCommitSha ?? null,
      worktreePath: null,
    });

    broadcast({ type: "agent:merged", agentId: agent.id });
    return c.json({ success: true, mergeCommitSha: result.mergeCommitSha });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Discard worktree + branch
app.post("/:id/discard", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);

    if (agent.mergeStatus !== "pending") {
      return c.json({ error: "Agent has no pending merge to discard" }, 400);
    }

    const building = storage.getBuilding(agent.buildingId);
    if (!building) return c.json({ error: "Building not found" }, 404);

    if (agent.worktreePath && agent.branchName) {
      await discardWorktree(building.projectPath, agent.worktreePath, agent.branchName);
    }

    await storage.updateAgent(agent.id, {
      mergeStatus: "discarded",
      worktreePath: null,
      branchName: null,
    });

    broadcast({ type: "agent:discarded", agentId: agent.id });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Revert a completed merge
app.post("/:id/revert", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);

    if (agent.mergeStatus !== "merged" || !agent.mergeCommitSha) {
      return c.json({ error: "Agent has no merged commit to revert" }, 400);
    }

    const building = storage.getBuilding(agent.buildingId);
    if (!building) return c.json({ error: "Building not found" }, 404);

    const result = await revertMerge(building.projectPath, agent.mergeCommitSha);
    if (!result.success) {
      return c.json({ error: result.error }, 409);
    }

    await storage.updateAgent(agent.id, { mergeStatus: "reverted" });

    broadcast({ type: "agent:reverted", agentId: agent.id });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
