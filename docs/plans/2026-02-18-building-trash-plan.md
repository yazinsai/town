# Building Trash/Archive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Demolished buildings go to a 48-hour trash instead of being permanently deleted, with full agent/conversation preservation and a UI to restore them.

**Architecture:** New trash storage layer alongside existing building/agent storage. Trash manifest persisted as JSON. Hourly purge timer + startup purge. New Hono route file for trash API. New React panel for trash UI.

**Tech Stack:** Bun, Hono, React, existing pixel UI components

---

### Task 1: Add types

**Files:**
- Modify: `shared/types.ts`

**Step 1: Add TrashedBuilding type and WSEvent variant**

In `shared/types.ts`, add after the `Agent` interface:

```ts
export interface TrashedBuilding {
  buildingId: string;
  trashedAt: string; // ISO 8601
  building: Building;
  agents: Agent[];
}
```

Add to the `WSEvent` union:
```ts
| { type: "building:restored"; building: Building }
```

**Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add TrashedBuilding type and building:restored WS event"
```

---

### Task 2: Add trash storage layer

**Files:**
- Modify: `server/storage.ts`

**Step 1: Add trash state and persistence**

Add at the top alongside existing constants:
```ts
const TRASH_DIR = `${DATA_DIR}/trash`;
const TRASH_MANIFEST = `${TRASH_DIR}/manifest.json`;
const TRASH_AGENTS_DIR = `${TRASH_DIR}/agents`;
```

Add in-memory state:
```ts
let trash: Map<string, TrashedBuilding> = new Map();
```

Add to `ensureDirs()`:
```ts
if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true });
if (!fs.existsSync(TRASH_AGENTS_DIR)) fs.mkdirSync(TRASH_AGENTS_DIR, { recursive: true });
```

Add persistence helpers:
```ts
async function saveTrash() {
  const data = JSON.stringify(Array.from(trash.values()), null, 2);
  await Bun.write(TRASH_MANIFEST, data);
}
```

**Step 2: Load trash in initStorage**

After loading agents, add:
```ts
const trashFile = Bun.file(TRASH_MANIFEST);
if (await trashFile.exists()) {
  try {
    const data: TrashedBuilding[] = await trashFile.json();
    trash = new Map(data.map((t) => [t.buildingId, t]));
  } catch {
    trash = new Map();
  }
}
```

Update the log line to include trash count.

**Step 3: Add trash CRUD functions**

```ts
export function getTrashedBuildings(): TrashedBuilding[] {
  return Array.from(trash.values());
}

export function getTrashedBuilding(id: string): TrashedBuilding | undefined {
  return trash.get(id);
}
```

**Step 4: Add trashBuilding function**

Replace the existing `removeBuilding` with a `trashBuilding` that:
1. Reads the building from active storage
2. Collects all agent data (including conversation logs)
3. Copies agent files (.json and .conversation.jsonl) to `data/trash/agents/`
4. Creates a TrashedBuilding entry with `trashedAt: new Date().toISOString()`
5. Removes building + agents from active storage (deletes active agent files)
6. Saves both trash manifest and buildings

```ts
export async function trashBuilding(id: string): Promise<boolean> {
  const building = buildings.get(id);
  if (!building) return false;

  // Collect agents with conversation data
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
```

**Step 5: Add restoreBuilding function**

```ts
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
```

**Step 6: Add permanentDeleteTrash function**

```ts
export async function permanentDeleteTrash(id: string): Promise<boolean> {
  const trashed = trash.get(id);
  if (!trashed) return false;

  // Delete agent files from trash
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
```

**Step 7: Add purgeExpiredTrash function**

```ts
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
```

**Step 8: Commit**

```bash
git add server/storage.ts
git commit -m "feat: add trash storage layer with archive, restore, and auto-purge"
```

---

### Task 3: Add trash API routes

**Files:**
- Create: `server/routes/trash.ts`
- Modify: `server/index.ts`

**Step 1: Create trash route file**

```ts
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
```

**Step 2: Register route and add purge timer in server/index.ts**

Add import:
```ts
import trashRoutes from "./routes/trash";
```

Add route alongside existing ones:
```ts
app.route("/api/trash", trashRoutes);
```

After `await initStorage()`, add startup purge + timer:
```ts
import { purgeExpiredTrash } from "./storage";

// Purge expired trash on startup
const purged = await purgeExpiredTrash();
if (purged > 0) console.log(`Purged ${purged} expired trashed buildings`);

// Purge expired trash every hour
setInterval(async () => {
  const n = await purgeExpiredTrash();
  if (n > 0) console.log(`Purged ${n} expired trashed buildings`);
}, 60 * 60 * 1000);
```

**Step 3: Update DELETE /buildings/:id to use trashBuilding**

In `server/routes/buildings.ts`, change `storage.removeBuilding` to `storage.trashBuilding`:
```ts
await storage.trashBuilding(building.id);
```

**Step 4: Commit**

```bash
git add server/routes/trash.ts server/routes/buildings.ts server/index.ts
git commit -m "feat: add trash API routes and auto-purge timer"
```

---

### Task 4: Add frontend API functions

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add trash API functions**

```ts
import type { TrashedBuilding } from "@shared/types";

export async function getTrashedBuildings(): Promise<TrashedBuilding[]> {
  return apiFetch<TrashedBuilding[]>("/trash");
}

export async function restoreBuilding(id: string): Promise<{ building: Building }> {
  return apiFetch<{ building: Building }>(`/trash/${id}/restore`, { method: "POST" });
}

export async function permanentDeleteTrash(id: string): Promise<void> {
  return apiFetch<void>(`/trash/${id}`, { method: "DELETE" });
}
```

**Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add trash API client functions"
```

---

### Task 5: Add Trash panel UI

**Files:**
- Create: `src/components/panels/TrashPanel.tsx`

**Step 1: Create the trash panel**

The panel should:
- Fetch trashed buildings on mount via `getTrashedBuildings()`
- Show each trashed building: name, building style, time remaining (computed from `trashedAt` + 48h - now), RESTORE button
- RESTORE calls `restoreBuilding(id)` then fires `onRestored()` callback
- Match the existing panel aesthetic: `#2C1810` bg, `#8B4513` borders, pixel components
- Use `PixelButton`, `PixelText` from existing UI components

Time remaining display: calculate `48h - (Date.now() - trashedAt)`, show as "Xh Ym left"

**Step 2: Commit**

```bash
git add src/components/panels/TrashPanel.tsx
git commit -m "feat: add trash panel UI component"
```

---

### Task 6: Wire trash into App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/useBuildings.ts`

**Step 1: Add trash panel type to Panel union**

```ts
| { type: "trash" }
```

**Step 2: Add trash state and handle building:restored**

In `useBuildings.ts`, add handling for `building:restored` event (same as `building:created` — insert/replace in the list).

In `App.tsx`:
- Add state: `const [trashCount, setTrashCount] = useState(0)`
- Fetch trash count on mount and after demolish/restore
- Add a "TRASH (n)" `PixelButton` in the UI (near the bottom or top bar) that opens the trash panel, only visible when `trashCount > 0`
- Render `<TrashPanel>` when `panel.type === "trash"`, with `onRestored` callback that closes panel + refetches buildings + updates trash count

**Step 3: Commit**

```bash
git add src/App.tsx src/hooks/useBuildings.ts src/components/panels/TrashPanel.tsx
git commit -m "feat: wire trash panel into main app with restore flow"
```

---

### Task 7: Verify end-to-end

**Step 1: Start the dev server**

```bash
cd /Users/rock/ai/projects/town && bun run dev
```

**Step 2: Manual verification checklist**

- Create a building, then demolish it — should disappear from town
- TRASH indicator should appear showing count
- Open trash panel — building should be listed with time remaining
- Click RESTORE — building reappears in town
- Trash count goes to 0, trash button disappears

**Step 3: Final commit if any fixes needed**
