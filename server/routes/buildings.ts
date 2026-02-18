import { Hono } from "hono";
import { existsSync, mkdirSync } from "fs";
import { normalize } from "path";
import * as storage from "../storage";
import { createAgent, killAgent } from "../agents/manager";
import { broadcast } from "../websocket";
import { saveImages, buildPromptWithImages } from "../images";
import { PROJECTS_ROOT } from "./projects";
import type { CreateBuildingRequest, SpawnAgentRequest } from "../../shared/types";

const app = new Hono();

// List all buildings with agent summaries
app.get("/", (c) => {
  const buildings = storage.getBuildings();
  const result = buildings.map((b) => ({
    ...b,
    agentSummaries: b.agents.map((aid) => {
      const agent = storage.getAgent(aid);
      return agent
        ? { id: agent.id, state: agent.state, currentTask: agent.currentTask }
        : { id: aid, state: "unknown", currentTask: "" };
    }),
  }));
  return c.json(result);
});

// Create building + spawn first agent
app.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateBuildingRequest>();

    if (!body.name || !body.projectPath || !body.initialPrompt) {
      return c.json({ error: "name, projectPath, and initialPrompt are required" }, 400);
    }

    if (!existsSync(body.projectPath)) {
      // Allow creating new project dirs that are direct children of PROJECTS_ROOT
      const normalized = normalize(body.projectPath);
      if (normalized.startsWith(PROJECTS_ROOT + "/") && !normalized.slice(PROJECTS_ROOT.length + 1).includes("/")) {
        mkdirSync(normalized, { recursive: true });
      } else {
        return c.json({ error: `Project path does not exist: ${body.projectPath}` }, 400);
      }
    }

    const building = await storage.createBuilding({
      name: body.name,
      projectPath: body.projectPath,
      buildingStyle: body.buildingStyle || "saloon",
    });

    // Handle images
    let prompt = body.initialPrompt;
    if (body.images && body.images.length > 0) {
      const paths = saveImages(body.images, body.projectPath);
      prompt = buildPromptWithImages(prompt, paths);
    }

    // Spawn first agent
    const agentId = await createAgent(
      building.id,
      prompt,
      body.projectPath,
      body.customSystemPrompt
    );

    const updated = storage.getBuilding(building.id);
    broadcast({ type: "building:created", building: updated || building });

    return c.json({ building: updated || building, agentId }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Get building details with agents
app.get("/:id", (c) => {
  const building = storage.getBuilding(c.req.param("id"));
  if (!building) return c.json({ error: "Building not found" }, 404);

  const agents = storage.getAgentsByBuilding(building.id);
  return c.json({ ...building, agentDetails: agents });
});

// Delete building
app.delete("/:id", async (c) => {
  const building = storage.getBuilding(c.req.param("id"));
  if (!building) return c.json({ error: "Building not found" }, 404);

  // Kill active agents
  for (const agentId of building.agents) {
    try {
      await killAgent(agentId);
    } catch {
      // Agent might already be dead
    }
  }

  await storage.trashBuilding(building.id);
  broadcast({ type: "building:removed", buildingId: building.id });

  return c.json({ success: true });
});

// Spawn new agent on building
app.post("/:id/agents", async (c) => {
  try {
    const building = storage.getBuilding(c.req.param("id"));
    if (!building) return c.json({ error: "Building not found" }, 404);

    const body = await c.req.json<SpawnAgentRequest>();
    if (!body.initialPrompt) {
      return c.json({ error: "initialPrompt is required" }, 400);
    }

    // Handle images
    let prompt = body.initialPrompt;
    if (body.images && body.images.length > 0) {
      const paths = saveImages(body.images, building.projectPath);
      prompt = buildPromptWithImages(prompt, paths);
    }

    const agentId = await createAgent(
      building.id,
      prompt,
      building.projectPath,
      body.customSystemPrompt
    );

    return c.json({ agentId }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
