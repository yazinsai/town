import { v4 as uuidv4 } from "uuid";
import type { Building, Agent, ConversationEntry, TrashedBuilding } from "../shared/types";

const DATA_DIR = "./data";
const BUILDINGS_FILE = `${DATA_DIR}/buildings.json`;
const AGENTS_DIR = `${DATA_DIR}/agents`;
const TRASH_DIR = `${DATA_DIR}/trash`;
const TRASH_MANIFEST = `${TRASH_DIR}/manifest.json`;
const TRASH_AGENTS_DIR = `${TRASH_DIR}/agents`;

// In-memory cache
let buildings: Map<string, Building> = new Map();
let agents: Map<string, Agent> = new Map();
let trash: Map<string, TrashedBuilding> = new Map();

// Persistence helpers

async function ensureDirs() {
  const fs = await import("fs");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AGENTS_DIR)) fs.mkdirSync(AGENTS_DIR, { recursive: true });
  if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true });
  if (!fs.existsSync(TRASH_AGENTS_DIR)) fs.mkdirSync(TRASH_AGENTS_DIR, { recursive: true });
}

async function saveBuildings() {
  const data = JSON.stringify(Array.from(buildings.values()), null, 2);
  await Bun.write(BUILDINGS_FILE, data);
}

async function saveAgent(agent: Agent) {
  const path = `${AGENTS_DIR}/${agent.id}.json`;
  await Bun.write(path, JSON.stringify(agent, null, 2));
}

async function saveTrash() {
  const data = JSON.stringify(Array.from(trash.values()), null, 2);
  await Bun.write(TRASH_MANIFEST, data);
}

async function deleteAgentFile(agentId: string) {
  const path = `${AGENTS_DIR}/${agentId}.json`;
  const file = Bun.file(path);
  if (await file.exists()) {
    const fs = await import("fs");
    fs.unlinkSync(path);
  }
  // Also remove conversation log
  const convPath = `${AGENTS_DIR}/${agentId}.conversation.jsonl`;
  const convFile = Bun.file(convPath);
  if (await convFile.exists()) {
    const fs = await import("fs");
    fs.unlinkSync(convPath);
  }
}

// Initialization

export async function initStorage() {
  await ensureDirs();

  // Load buildings
  const buildingsFile = Bun.file(BUILDINGS_FILE);
  if (await buildingsFile.exists()) {
    try {
      const data: Building[] = await buildingsFile.json();
      buildings = new Map(data.map((b) => [b.id, b]));
    } catch {
      buildings = new Map();
    }
  }

  // Load agents
  const fs = await import("fs");
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f: string) => f.endsWith(".json"));
  for (const file of agentFiles) {
    try {
      const agent: Agent = await Bun.file(`${AGENTS_DIR}/${file}`).json();
      agents.set(agent.id, agent);
    } catch {
      // Skip corrupt files
    }
  }

  // Load trash
  const trashFile = Bun.file(TRASH_MANIFEST);
  if (await trashFile.exists()) {
    try {
      const data: TrashedBuilding[] = await trashFile.json();
      trash = new Map(data.map((t) => [t.buildingId, t]));
    } catch {
      trash = new Map();
    }
  }

  console.log(`Loaded ${buildings.size} buildings, ${agents.size} agents, ${trash.size} trashed`);
}

// Building CRUD

export function getBuildings(): Building[] {
  return Array.from(buildings.values());
}

export function getBuilding(id: string): Building | undefined {
  return buildings.get(id);
}

export async function createBuilding(
  data: Omit<Building, "id" | "createdAt" | "agents">
): Promise<Building> {
  const building: Building = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    agents: [],
    ...data,
  };
  buildings.set(building.id, building);
  await saveBuildings();
  return building;
}

export async function updateBuilding(
  id: string,
  updates: Partial<Building>
): Promise<Building | undefined> {
  const building = buildings.get(id);
  if (!building) return undefined;
  Object.assign(building, updates);
  buildings.set(id, building);
  await saveBuildings();
  return building;
}

export async function trashBuilding(id: string): Promise<boolean> {
  const building = buildings.get(id);
  if (!building) return false;

  // Collect agents
  const buildingAgents: Agent[] = [];
  for (const agentId of building.agents) {
    const agent = agents.get(agentId);
    if (agent) buildingAgents.push(agent);
  }

  // Copy agent files to trash
  const fs = await import("fs");
  for (const agentId of building.agents) {
    const srcJson = `${AGENTS_DIR}/${agentId}.json`;
    const srcConv = `${AGENTS_DIR}/${agentId}.conversation.jsonl`;
    const dstJson = `${TRASH_AGENTS_DIR}/${agentId}.json`;
    const dstConv = `${TRASH_AGENTS_DIR}/${agentId}.conversation.jsonl`;

    if (fs.existsSync(srcJson)) fs.copyFileSync(srcJson, dstJson);
    if (fs.existsSync(srcConv)) fs.copyFileSync(srcConv, dstConv);
  }

  // Add to trash
  trash.set(id, {
    buildingId: id,
    trashedAt: new Date().toISOString(),
    building,
    agents: buildingAgents,
  });
  await saveTrash();

  // Remove from active storage
  for (const agentId of building.agents) {
    agents.delete(agentId);
    await deleteAgentFile(agentId);
  }
  buildings.delete(id);
  await saveBuildings();

  return true;
}

// Agent CRUD

export function getAgent(id: string): Agent | undefined {
  return agents.get(id);
}

export function getAgentsByBuilding(buildingId: string): Agent[] {
  return Array.from(agents.values()).filter((a) => a.buildingId === buildingId);
}

export async function createAgent(
  data: Omit<Agent, "id" | "createdAt" | "completedAt" | "error" | "sdkSessionId" | "pendingQuestion" | "pendingPermission">
): Promise<Agent> {
  const agent: Agent = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    sdkSessionId: null,
    pendingQuestion: null,
    pendingPermission: null,
    ...data,
  };
  agents.set(agent.id, agent);
  await saveAgent(agent);

  // Add to building
  const building = buildings.get(agent.buildingId);
  if (building) {
    building.agents.push(agent.id);
    await saveBuildings();
  }

  return agent;
}

export async function updateAgent(
  id: string,
  updates: Partial<Agent>
): Promise<Agent | undefined> {
  const agent = agents.get(id);
  if (!agent) return undefined;
  Object.assign(agent, updates);
  agents.set(id, agent);
  await saveAgent(agent);
  return agent;
}

// Trash CRUD

export function getTrashedBuildings(): TrashedBuilding[] {
  return Array.from(trash.values());
}

export function getTrashedBuilding(id: string): TrashedBuilding | undefined {
  return trash.get(id);
}

export async function restoreBuilding(id: string): Promise<Building | undefined> {
  const trashed = trash.get(id);
  if (!trashed) return undefined;

  // Restore building
  buildings.set(trashed.building.id, trashed.building);
  await saveBuildings();

  // Restore agents — move files back from trash
  const fs = await import("fs");
  for (const agent of trashed.agents) {
    agents.set(agent.id, agent);

    const srcJson = `${TRASH_AGENTS_DIR}/${agent.id}.json`;
    const srcConv = `${TRASH_AGENTS_DIR}/${agent.id}.conversation.jsonl`;
    const dstJson = `${AGENTS_DIR}/${agent.id}.json`;
    const dstConv = `${AGENTS_DIR}/${agent.id}.conversation.jsonl`;

    if (fs.existsSync(srcJson)) {
      fs.copyFileSync(srcJson, dstJson);
      fs.unlinkSync(srcJson);
    }
    if (fs.existsSync(srcConv)) {
      fs.copyFileSync(srcConv, dstConv);
      fs.unlinkSync(srcConv);
    }
  }

  // Remove from trash
  trash.delete(id);
  await saveTrash();

  return trashed.building;
}

export async function permanentDeleteTrash(id: string): Promise<boolean> {
  const trashed = trash.get(id);
  if (!trashed) return false;

  const fs = await import("fs");
  for (const agent of trashed.agents) {
    const jsonPath = `${TRASH_AGENTS_DIR}/${agent.id}.json`;
    const convPath = `${TRASH_AGENTS_DIR}/${agent.id}.conversation.jsonl`;
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
    if (fs.existsSync(convPath)) fs.unlinkSync(convPath);
  }

  trash.delete(id);
  await saveTrash();
  return true;
}

const TRASH_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function purgeExpiredTrash(): Promise<number> {
  const now = Date.now();
  let purged = 0;
  for (const [id, entry] of trash) {
    if (now - new Date(entry.trashedAt).getTime() > TRASH_TTL_MS) {
      await permanentDeleteTrash(id);
      purged++;
    }
  }
  return purged;
}

// Conversation log

export async function appendConversation(agentId: string, entry: ConversationEntry) {
  const path = `${AGENTS_DIR}/${agentId}.conversation.jsonl`;
  const line = JSON.stringify(entry) + "\n";
  const fs = await import("fs");
  fs.appendFileSync(path, line);
}

export async function getConversation(agentId: string): Promise<ConversationEntry[]> {
  const path = `${AGENTS_DIR}/${agentId}.conversation.jsonl`;
  const file = Bun.file(path);
  if (!(await file.exists())) return [];

  const text = await file.text();
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
