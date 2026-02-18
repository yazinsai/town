# Worktree Isolation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give each agent its own git worktree so agents can't collide, with auto-merge on completion and undo support.

**Architecture:** New `server/worktree.ts` module handles all git worktree operations. The agent manager creates a worktree before spawning the SDK session and auto-merges on completion. Three new API endpoints expose manual merge, discard, and revert. Frontend shows merge/discard/undo buttons on completed agents.

**Tech Stack:** Git worktrees, Bun shell (`Bun.spawn`), existing Hono API, React frontend

---

### Task 1: Add worktree fields to the Agent type

**Files:**
- Modify: `shared/types.ts:10-17` (Agent interface)
- Modify: `shared/types.ts:107-116` (WSEvent type)

**Step 1: Add new fields to Agent interface**

In `shared/types.ts`, add four fields to the `Agent` interface after `pendingPermission`:

```typescript
export interface Agent {
  id: string;
  buildingId: string;
  state: AgentState;
  currentTask: string;
  initialPrompt: string;
  customSystemPrompt: string | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  sdkSessionId: string | null;
  // For waiting states
  pendingQuestion: PendingQuestion | null;
  pendingPermission: PendingPermission | null;
  // Worktree isolation
  worktreePath: string | null;
  branchName: string | null;
  mergeStatus: "pending" | "merged" | "discarded" | "reverted" | null;
  mergeCommitSha: string | null;
}
```

**Step 2: Add new WebSocket events**

Add these to the `WSEvent` union in the same file:

```typescript
  | { type: "agent:merged"; agentId: string }
  | { type: "agent:merge-failed"; agentId: string; error: string }
  | { type: "agent:discarded"; agentId: string }
  | { type: "agent:reverted"; agentId: string }
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Errors in files that create Agent objects without the new fields (storage.ts) — that's expected, we fix it in Task 2.

**Step 4: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add worktree fields to Agent type"
```

---

### Task 2: Update storage to handle new Agent fields

**Files:**
- Modify: `server/storage.ts:188-212` (createAgent function)

**Step 1: Add default values for new fields in createAgent**

In `server/storage.ts`, update the `createAgent` function to include the new fields with null defaults:

```typescript
export async function createAgent(
  data: Omit<Agent, "id" | "createdAt" | "completedAt" | "error" | "sdkSessionId" | "pendingQuestion" | "pendingPermission" | "worktreePath" | "branchName" | "mergeStatus" | "mergeCommitSha">
): Promise<Agent> {
  const agent: Agent = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    sdkSessionId: null,
    pendingQuestion: null,
    pendingPermission: null,
    worktreePath: null,
    branchName: null,
    mergeStatus: null,
    mergeCommitSha: null,
    ...data,
  };
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile (or only unrelated warnings).

**Step 3: Commit**

```bash
git add server/storage.ts
git commit -m "feat: add worktree field defaults in storage"
```

---

### Task 3: Create the worktree module

**Files:**
- Create: `server/worktree.ts`

**Step 1: Create `server/worktree.ts` with all git operations**

This is the core module. It handles: detecting git repos, creating worktrees, merging, discarding, and reverting.

```typescript
import { $ } from "bun";

// Per-building merge lock — ensures sequential merges
const mergeLocks = new Map<string, Promise<void>>();

export interface WorktreeInfo {
  worktreePath: string;
  branchName: string;
}

export interface MergeResult {
  success: boolean;
  mergeCommitSha?: string;
  error?: string;
}

/**
 * Check if a directory is a git repository.
 */
export async function isGitRepo(projectPath: string): Promise<boolean> {
  try {
    const result = await $`git -C ${projectPath} rev-parse --is-inside-work-tree`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Create a worktree for an agent.
 * - Creates branch agent/<shortId> off HEAD
 * - Adds worktree at <projectPath>/.worktrees/<agentId>
 * - Symlinks node_modules, .env files
 */
export async function createWorktree(
  projectPath: string,
  agentId: string
): Promise<WorktreeInfo> {
  const shortId = agentId.slice(0, 8);
  const branchName = `agent/${shortId}`;
  const worktreePath = `${projectPath}/.worktrees/${agentId}`;

  // Create the .worktrees directory if needed
  const fs = await import("fs");
  const worktreesDir = `${projectPath}/.worktrees`;
  if (!fs.existsSync(worktreesDir)) {
    fs.mkdirSync(worktreesDir, { recursive: true });
  }

  // Ensure .worktrees is in .gitignore
  await ensureGitignore(projectPath, ".worktrees/");

  // Create branch off current HEAD
  await $`git -C ${projectPath} branch ${branchName}`.quiet();

  // Create worktree
  await $`git -C ${projectPath} worktree add ${worktreePath} ${branchName}`.quiet();

  // Symlink shared directories/files
  await symlinkShared(projectPath, worktreePath);

  return { worktreePath, branchName };
}

/**
 * Merge an agent's branch into main (sequential per building).
 * Uses --no-ff to always create a merge commit for easy revert.
 */
export async function mergeWorktree(
  projectPath: string,
  branchName: string,
  buildingId: string
): Promise<MergeResult> {
  // Acquire per-building lock
  const existing = mergeLocks.get(buildingId) || Promise.resolve();
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => { releaseLock = resolve; });
  mergeLocks.set(buildingId, existing.then(() => lockPromise));

  try {
    await existing; // Wait for any prior merge on this building

    // Merge into main from the main worktree (projectPath)
    const mergeResult = await $`git -C ${projectPath} merge --no-ff -m ${"merge: " + branchName} ${branchName}`.quiet();

    if (mergeResult.exitCode !== 0) {
      // Abort the failed merge
      await $`git -C ${projectPath} merge --abort`.quiet().nothrow();
      return { success: false, error: mergeResult.stderr.toString() };
    }

    // Get the merge commit SHA
    const shaResult = await $`git -C ${projectPath} rev-parse HEAD`.quiet();
    const mergeCommitSha = shaResult.text().trim();

    return { success: true, mergeCommitSha };
  } catch (err: any) {
    // Abort on unexpected error
    await $`git -C ${projectPath} merge --abort`.quiet().nothrow();
    return { success: false, error: err.message };
  } finally {
    releaseLock!();
    // Clean up lock if nothing is queued
    const current = mergeLocks.get(buildingId);
    if (current === lockPromise) mergeLocks.delete(buildingId);
  }
}

/**
 * Clean up a worktree and its branch after successful merge.
 */
export async function cleanupWorktree(
  projectPath: string,
  worktreePath: string,
  branchName: string
): Promise<void> {
  await $`git -C ${projectPath} worktree remove ${worktreePath} --force`.quiet().nothrow();
  await $`git -C ${projectPath} branch -d ${branchName}`.quiet().nothrow();
}

/**
 * Discard an agent's worktree and branch entirely.
 */
export async function discardWorktree(
  projectPath: string,
  worktreePath: string,
  branchName: string
): Promise<void> {
  await $`git -C ${projectPath} worktree remove ${worktreePath} --force`.quiet().nothrow();
  await $`git -C ${projectPath} branch -D ${branchName}`.quiet().nothrow();
}

/**
 * Revert a merge commit (undo an agent's merged work).
 */
export async function revertMerge(
  projectPath: string,
  mergeCommitSha: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await $`git -C ${projectPath} revert -m 1 --no-edit ${mergeCommitSha}`.quiet();
    if (result.exitCode !== 0) {
      await $`git -C ${projectPath} revert --abort`.quiet().nothrow();
      return { success: false, error: result.stderr.toString() };
    }
    return { success: true };
  } catch (err: any) {
    await $`git -C ${projectPath} revert --abort`.quiet().nothrow();
    return { success: false, error: err.message };
  }
}

/**
 * Symlink shared dirs/files from main checkout to worktree.
 */
async function symlinkShared(
  projectPath: string,
  worktreePath: string
): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");

  const toSymlink = [
    "node_modules",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];

  for (const name of toSymlink) {
    const src = path.join(projectPath, name);
    const dst = path.join(worktreePath, name);

    if (!fs.existsSync(src)) continue;
    if (fs.existsSync(dst)) continue; // Already exists in worktree (tracked file)

    try {
      fs.symlinkSync(src, dst);
    } catch {
      // Non-fatal — agent can still work
    }
  }
}

/**
 * Ensure a pattern is in .gitignore.
 */
async function ensureGitignore(
  projectPath: string,
  pattern: string
): Promise<void> {
  const fs = await import("fs");
  const gitignorePath = `${projectPath}/.gitignore`;

  let content = "";
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, "utf-8");
  }

  if (!content.split("\n").some((line) => line.trim() === pattern)) {
    const newline = content.endsWith("\n") || content === "" ? "" : "\n";
    fs.appendFileSync(gitignorePath, `${newline}${pattern}\n`);
  }
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add server/worktree.ts
git commit -m "feat: add worktree module for git isolation"
```

---

### Task 4: Integrate worktree creation into agent spawning

**Files:**
- Modify: `server/agents/manager.ts:73-96` (createAgent function)
- Modify: `server/agents/manager.ts:102-118` (respawnSession function)

**Step 1: Update `createAgent` to set up worktree before SDK session**

Replace the `createAgent` function in `server/agents/manager.ts`:

```typescript
import { isGitRepo, createWorktree } from "../worktree";

export async function createAgent(
  buildingId: string,
  initialPrompt: string,
  cwd: string,
  customSystemPrompt?: string
): Promise<string> {
  const agent = await storage.createAgent({
    buildingId,
    state: "busy",
    currentTask: initialPrompt,
    initialPrompt,
    customSystemPrompt: customSystemPrompt || null,
  });

  const building = storage.getBuilding(buildingId);
  if (building) {
    broadcast({ type: "building:created", building });
  }

  // Set up worktree if project is a git repo
  let agentCwd = cwd;
  if (await isGitRepo(cwd)) {
    try {
      const wt = await createWorktree(cwd, agent.id);
      await storage.updateAgent(agent.id, {
        worktreePath: wt.worktreePath,
        branchName: wt.branchName,
        mergeStatus: "pending",
      });
      agentCwd = wt.worktreePath;
    } catch (err: any) {
      console.error(`[worktree] Failed to create worktree for ${agent.id}: ${err.message}`);
      // Fall back to direct cwd — don't block agent creation
    }
  }

  const callbacks = makeCallbacks(agent.id);
  createSession(agent.id, agentCwd, initialPrompt, callbacks, customSystemPrompt);

  return agent.id;
}
```

**Step 2: Update `respawnSession` to use worktree path**

```typescript
function respawnSession(agentId: string, message: string) {
  const agent = storage.getAgent(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const building = storage.getBuilding(agent.buildingId);
  if (!building) throw new Error(`Building ${agent.buildingId} not found`);

  // Use worktree path if available, otherwise fall back to project path
  const cwd = agent.worktreePath || building.projectPath;

  const callbacks = makeCallbacks(agentId);
  createSession(
    agentId,
    cwd,
    message,
    callbacks,
    agent.customSystemPrompt || undefined,
    agent.sdkSessionId || undefined
  );
}
```

**Step 3: Verify it compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add server/agents/manager.ts
git commit -m "feat: create worktree when spawning agents"
```

---

### Task 5: Add auto-merge on agent completion

**Files:**
- Modify: `server/agents/manager.ts:7-71` (makeCallbacks function)

**Step 1: Update `onComplete` callback to auto-merge**

Import the merge and cleanup functions at the top of manager.ts (add to existing import):

```typescript
import { isGitRepo, createWorktree, mergeWorktree, cleanupWorktree } from "../worktree";
```

Then update the `onComplete` callback inside `makeCallbacks`:

```typescript
    onComplete: async () => {
      await storage.updateAgent(agentId, {
        state: "completed",
        completedAt: new Date().toISOString(),
        pendingQuestion: null,
        pendingPermission: null,
      });
      broadcast({ type: "agent:completed", agentId });

      // Auto-merge worktree branch into main
      const agent = storage.getAgent(agentId);
      if (agent?.worktreePath && agent?.branchName && agent.mergeStatus === "pending") {
        const building = storage.getBuilding(agent.buildingId);
        if (building) {
          const result = await mergeWorktree(building.projectPath, agent.branchName, building.id);
          if (result.success) {
            await cleanupWorktree(building.projectPath, agent.worktreePath, agent.branchName);
            await storage.updateAgent(agentId, {
              mergeStatus: "merged",
              mergeCommitSha: result.mergeCommitSha || null,
              worktreePath: null, // Cleaned up
            });
            broadcast({ type: "agent:merged", agentId });
          } else {
            // Leave worktree intact for manual merge
            broadcast({ type: "agent:merge-failed", agentId, error: result.error || "Merge conflict" });
          }
        }
      }
    },
```

**Step 2: Verify it compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add server/agents/manager.ts
git commit -m "feat: auto-merge worktree on agent completion"
```

---

### Task 6: Add merge/discard/revert API endpoints

**Files:**
- Modify: `server/routes/agents.ts`

**Step 1: Add three new endpoints**

Add these imports at the top of `server/routes/agents.ts`:

```typescript
import { mergeWorktree, cleanupWorktree, discardWorktree, revertMerge } from "../worktree";
import { broadcast } from "../websocket";
```

Add these routes after the existing conversation route (before `export default app`):

```typescript
// Manual merge (for failed auto-merge or killed agents)
app.post("/:id/merge", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);
    if (agent.mergeStatus !== "pending") {
      return c.json({ error: `Cannot merge: status is ${agent.mergeStatus}` }, 400);
    }
    if (!agent.branchName) {
      return c.json({ error: "Agent has no worktree branch" }, 400);
    }

    const building = storage.getBuilding(agent.buildingId);
    if (!building) return c.json({ error: "Building not found" }, 404);

    const result = await mergeWorktree(building.projectPath, agent.branchName, building.id);
    if (!result.success) {
      return c.json({ error: result.error || "Merge failed" }, 409);
    }

    if (agent.worktreePath) {
      await cleanupWorktree(building.projectPath, agent.worktreePath, agent.branchName);
    }

    await storage.updateAgent(agent.id, {
      mergeStatus: "merged",
      mergeCommitSha: result.mergeCommitSha || null,
      worktreePath: null,
    });
    broadcast({ type: "agent:merged", agentId: agent.id });

    return c.json({ success: true, mergeCommitSha: result.mergeCommitSha });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Discard worktree and branch
app.post("/:id/discard", async (c) => {
  try {
    const agent = storage.getAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "Agent not found" }, 404);
    if (agent.mergeStatus !== "pending") {
      return c.json({ error: `Cannot discard: status is ${agent.mergeStatus}` }, 400);
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
    if (agent.mergeStatus !== "merged") {
      return c.json({ error: `Cannot revert: status is ${agent.mergeStatus}` }, 400);
    }
    if (!agent.mergeCommitSha) {
      return c.json({ error: "No merge commit SHA to revert" }, 400);
    }

    const building = storage.getBuilding(agent.buildingId);
    if (!building) return c.json({ error: "Building not found" }, 404);

    const result = await revertMerge(building.projectPath, agent.mergeCommitSha);
    if (!result.success) {
      return c.json({ error: result.error || "Revert failed" }, 409);
    }

    await storage.updateAgent(agent.id, { mergeStatus: "reverted" });
    broadcast({ type: "agent:reverted", agentId: agent.id });

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
```

**Step 2: Verify it compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add server/routes/agents.ts
git commit -m "feat: add merge/discard/revert API endpoints"
```

---

### Task 7: Add API client functions

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add three new API functions**

Add at the end of `src/lib/api.ts` (before any closing export):

```typescript
export async function mergeAgent(id: string): Promise<{ mergeCommitSha?: string }> {
  return apiFetch<{ mergeCommitSha?: string }>(`/agents/${id}/merge`, { method: "POST" });
}

export async function discardAgent(id: string): Promise<void> {
  return apiFetch<void>(`/agents/${id}/discard`, { method: "POST" });
}

export async function revertAgent(id: string): Promise<void> {
  return apiFetch<void>(`/agents/${id}/revert`, { method: "POST" });
}
```

**Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add merge/discard/revert API client functions"
```

---

### Task 8: Add worktree action buttons to the UI

**Files:**
- Modify: `src/components/panels/BuildingDetail.tsx:42-212` (AgentFloor component)

**Step 1: Import the new API functions**

Update the import line at the top of `BuildingDetail.tsx`:

```typescript
import { getBuilding, spawnAgent, killAgent, deleteBuilding, respondToAgent, mergeAgent, discardAgent, revertAgent } from "../../lib/api";
```

**Step 2: Add worktree action buttons in the AgentFloor component**

Find the `{/* Actions */}` section (around line 198-206). Replace it with:

```typescript
            {/* Actions */}
            <div style={{ padding: "0 8px 8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(displayAgent.state === "waiting_input" || displayAgent.state === "waiting_permission") && (
                <PixelButton onClick={() => onBubbleClick(displayAgent)}>RESPOND</PixelButton>
              )}
              {!isFinished && (
                <PixelButton variant="danger" onClick={async () => { await killAgent(agent.id); }}>KILL</PixelButton>
              )}

              {/* Worktree merge/discard actions */}
              {displayAgent.mergeStatus === "pending" && isFinished && (
                <>
                  <PixelButton onClick={async () => {
                    try { await mergeAgent(agent.id); } catch (err: any) { alert(`Merge failed: ${err.message}`); }
                  }}>MERGE</PixelButton>
                  <PixelButton variant="danger" onClick={async () => {
                    if (!window.confirm("Discard this agent's changes? This cannot be undone.")) return;
                    try { await discardAgent(agent.id); } catch (err: any) { alert(`Discard failed: ${err.message}`); }
                  }}>DISCARD</PixelButton>
                </>
              )}
              {displayAgent.mergeStatus === "merged" && (
                <PixelButton variant="danger" onClick={async () => {
                  if (!window.confirm("Undo this merge? The agent's changes will be reverted.")) return;
                  try { await revertAgent(agent.id); } catch (err: any) { alert(`Revert failed: ${err.message}`); }
                }}>UNDO MERGE</PixelButton>
              )}

              {/* Merge status indicator */}
              {displayAgent.mergeStatus && (
                <PixelText variant="small" color={
                  displayAgent.mergeStatus === "merged" ? "#4CAF50" :
                  displayAgent.mergeStatus === "reverted" ? "#FF9800" :
                  displayAgent.mergeStatus === "discarded" ? "#9E9E9E" :
                  "#D2B48C"
                } style={{ alignSelf: "center" }}>
                  {displayAgent.mergeStatus === "merged" ? "MERGED" :
                   displayAgent.mergeStatus === "reverted" ? "REVERTED" :
                   displayAgent.mergeStatus === "discarded" ? "DISCARDED" :
                   "UNMERGED"}
                </PixelText>
              )}
            </div>
```

**Step 3: Update the fetchDetail effect to also respond to merge/discard/revert events**

In the `BuildingDetail` component (around line 254-259), update the event listener:

```typescript
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "agent:state" ||
      lastEvent.type === "agent:completed" ||
      lastEvent.type === "agent:error" ||
      lastEvent.type === "agent:merged" ||
      lastEvent.type === "agent:merge-failed" ||
      lastEvent.type === "agent:discarded" ||
      lastEvent.type === "agent:reverted"
    ) {
      fetchDetail();
    }
  }, [lastEvent]);
```

**Step 4: Verify it compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 5: Commit**

```bash
git add src/components/panels/BuildingDetail.tsx
git commit -m "feat: add merge/discard/undo buttons to agent floors"
```

---

### Task 9: Handle worktree cleanup when trashing buildings

**Files:**
- Modify: `server/routes/buildings.ts:87-104` (delete building route)

**Step 1: Discard pending worktrees before trashing**

Update the delete route to clean up worktrees. Add import at top:

```typescript
import { discardWorktree } from "../worktree";
```

Update the delete handler to discard worktrees before killing agents:

```typescript
// Delete building
app.delete("/:id", async (c) => {
  const building = storage.getBuilding(c.req.param("id"));
  if (!building) return c.json({ error: "Building not found" }, 404);

  // Kill active agents and discard pending worktrees
  for (const agentId of building.agents) {
    try {
      const agent = storage.getAgent(agentId);
      if (agent?.worktreePath && agent?.branchName && agent.mergeStatus === "pending") {
        await discardWorktree(building.projectPath, agent.worktreePath, agent.branchName);
      }
      await killAgent(agentId);
    } catch {
      // Agent might already be dead
    }
  }

  await storage.trashBuilding(building.id);
  broadcast({ type: "building:removed", buildingId: building.id });

  return c.json({ success: true });
});
```

**Step 2: Verify it compiles**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add server/routes/buildings.ts
git commit -m "feat: discard worktrees when trashing buildings"
```

---

### Task 10: Handle WebSocket events for merge status in useWebSocket

**Files:**
- Modify: `src/hooks/useWebSocket.ts` (if it filters events)
- Modify: `src/App.tsx` (if it handles events for refetch)

**Step 1: Check if useWebSocket or App.tsx filters WSEvent types**

Read both files. The new WS event types (`agent:merged`, `agent:merge-failed`, `agent:discarded`, `agent:reverted`) should flow through. If `useWebSocket.ts` just passes through raw events, no change needed. If `App.tsx` has event type checks for refetching, add the new types.

**Step 2: Update App.tsx event handling if needed**

In `App.tsx`, find where `lastEvent` triggers re-fetches. Add the new merge-related event types so the building list updates when merges happen.

**Step 3: Verify it compiles and test manually**

Run: `cd /Users/rock/ai/projects/town && bunx tsc --noEmit`
Expected: Clean compile.

**Step 4: Commit**

```bash
git add src/hooks/useWebSocket.ts src/App.tsx
git commit -m "feat: handle merge-related WebSocket events in frontend"
```

---

### Task 11: Manual end-to-end test

**Step 1: Start the dev server**

Run: `cd /Users/rock/ai/projects/town && bun run dev`

**Step 2: Test the full flow**

1. Create a building pointing to a git repo project
2. Spawn an agent with a simple task (e.g. "Create a file called test.txt with hello world")
3. Verify the agent creates a worktree (check `.worktrees/` dir in the project)
4. Wait for agent to complete
5. Verify auto-merge happened (check git log in the project)
6. Test "Undo Merge" button — verify `git revert` creates a revert commit
7. Spawn another agent, kill it mid-work
8. Verify "Merge" and "Discard" buttons appear
9. Test "Discard" — verify worktree and branch are cleaned up
10. Test on a non-git project — verify it falls back to current behavior

**Step 3: Commit any fixes found during testing**
