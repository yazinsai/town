# Worktree Isolation: Per-Agent Git Workspaces

## Problem

Multiple agents working on the same project can collide — editing the same files, stepping on each other's changes. There's no isolation between agents on the same building, and no way to cleanly discard an agent's work.

## Solution

Each agent gets its own git worktree. When spawned, a new branch + worktree is created off `main`. The agent works in the worktree directory. When it completes, the branch auto-merges to `main`. If unwanted, the merge can be reverted or the worktree discarded.

## Lifecycle

```
Spawn Agent
  ├─ git branch agent/<short-id> (off main)
  ├─ git worktree add <projectPath>/.worktrees/<agentId> agent/<short-id>
  ├─ Symlink node_modules, .env from main checkout
  └─ SDK session runs with cwd = worktree path

Agent Completes Successfully
  ├─ Auto-merge branch into main (--no-ff, sequential per building)
  ├─ Store mergeCommitSha on agent
  ├─ Remove worktree + branch
  └─ mergeStatus = "merged"

Auto-Merge Fails (conflict)
  ├─ mergeStatus = "pending"
  ├─ User sees "Merge" button + conflict warning
  └─ User resolves and retries, or discards

Agent Killed by User
  ├─ mergeStatus = "pending"
  └─ User sees "Merge" or "Discard" buttons

User Clicks "Undo Merge"
  ├─ git revert -m 1 <mergeCommitSha>
  └─ mergeStatus = "reverted"

User Clicks "Discard"
  ├─ git worktree remove + git branch -D
  └─ mergeStatus = "discarded"
```

## Data Model Changes

Three new fields on `Agent`:

```typescript
interface Agent {
  // ... existing fields ...
  worktreePath: string | null;      // e.g. "/Users/rock/ai/projects/myapp/.worktrees/abc123"
  branchName: string | null;        // e.g. "agent/abc123"
  mergeStatus: "pending" | "merged" | "discarded" | "reverted" | null;
  mergeCommitSha: string | null;    // SHA of the --no-ff merge commit, for undo
}
```

`null` values indicate a non-git project or legacy agent.

No changes to `Building` — `projectPath` remains the canonical main checkout.

## New Module: `server/worktree.ts`

Core functions:

- `isGitRepo(projectPath)` — check if project is a git repo
- `createWorktree(projectPath, agentId)` — create branch + worktree + symlinks, return `{ worktreePath, branchName }`
- `mergeWorktree(projectPath, branchName)` — merge branch into main with `--no-ff`, return `{ success, mergeCommitSha?, error? }`
- `discardWorktree(projectPath, worktreePath, branchName)` — remove worktree + delete branch
- `revertMerge(projectPath, mergeCommitSha)` — `git revert -m 1 <sha>`

### Sequential Merge Lock

A `Map<buildingId, Promise>` ensures only one merge per building at a time. Second merge waits for the first to complete. This prevents conflicts from concurrent merges.

### Symlinked Files

After creating the worktree, symlink these from the main checkout:
- `node_modules/`
- `.env` (and `.env.*` variants)
- Any other heavy untracked directories (configurable)

This avoids duplicate installs and keeps worktrees lightweight.

## Changes to Existing Files

### `server/agents/manager.ts`

**`createAgent()`** — before creating the SDK session:
```
if (isGitRepo(cwd)) {
  const wt = await createWorktree(cwd, agent.id)
  store worktreePath + branchName on agent
  cwd = wt.worktreePath
}
createSession(agent.id, cwd, ...)
```

**`respawnSession()`** — use `agent.worktreePath || building.projectPath` as cwd.

**`onComplete` callback** — after marking agent completed, trigger auto-merge:
```
if (agent.worktreePath && agent.branchName) {
  const result = await mergeWorktree(building.projectPath, agent.branchName)
  if (result.success) {
    update agent: mergeStatus = "merged", mergeCommitSha = result.sha
    cleanup worktree
  } else {
    update agent: mergeStatus = "pending"
    broadcast merge failure notification
  }
}
```

### `server/routes/agents.ts`

New endpoints:
- `POST /api/agents/:id/merge` — manual merge (for failed auto-merge or killed agents)
- `POST /api/agents/:id/discard` — delete worktree + branch
- `POST /api/agents/:id/revert` — undo a completed merge

### `shared/types.ts`

- Add `worktreePath`, `branchName`, `mergeStatus`, `mergeCommitSha` to `Agent`
- Add `MergeStatus` type
- Add WebSocket events: `agent:merged`, `agent:merge-failed`, `agent:discarded`, `agent:reverted`

### `src/components/panels/BuildingDetail.tsx`

For completed agents with worktree data:
- `mergeStatus === "merged"` → show "Undo Merge" button (with warning if other agents merged after)
- `mergeStatus === "pending"` → show prominent "Merge" button + "Discard" button
- `mergeStatus === "discarded"` or `"reverted"` → show status label, no actions

### `src/lib/api.ts`

Add: `mergeAgent(id)`, `discardAgent(id)`, `revertAgent(id)`

## Edge Cases

| Scenario | Handling |
|---|---|
| Project isn't a git repo | Skip worktree, agent works directly in projectPath (current behavior) |
| Agent runs git commands | They execute in the worktree, which has its own branch. Safe. |
| Two agents edit the same file | Each has their own worktree copy. Sequential merge handles conflicts. |
| Server restarts mid-agent | Worktree persists on disk. Agent state loaded from storage with worktreePath. |
| Merge conflict on auto-merge | mergeStatus stays "pending", user notified, can resolve or discard. |
| Undo merge when later agents merged on top | Show warning "N agents merged after this". Revert only undoes this agent's changes. |
| Trashing a building | Discard all pending worktrees for that building's agents before trashing. |
| node_modules changes (agent runs npm install) | Symlink means install happens in main checkout's node_modules, affecting all agents. Acceptable trade-off. |

## Non-Goals

- View diff UI (can always use git CLI)
- Per-agent containerization
- Custom merge strategies
