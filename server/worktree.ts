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
  const result =
    await $`git -C ${projectPath} rev-parse --is-inside-work-tree`
      .quiet()
      .nothrow();
  return result.exitCode === 0;
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
  const branchName = `agent/${agentId}`;
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
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const chainedPromise = existing.then(() => lockPromise);
  mergeLocks.set(buildingId, chainedPromise);

  try {
    await existing; // Wait for any prior merge on this building

    const mergeResult =
      await $`git -C ${projectPath} merge --no-ff -m ${"merge: " + branchName} ${branchName}`
        .quiet()
        .nothrow();

    if (mergeResult.exitCode !== 0) {
      // Abort the failed merge
      await $`git -C ${projectPath} merge --abort`.quiet().nothrow();
      return { success: false, error: mergeResult.stderr.toString() };
    }

    // Get the merge commit SHA
    const shaResult =
      await $`git -C ${projectPath} rev-parse HEAD`.quiet();
    const mergeCommitSha = shaResult.text().trim();

    return { success: true, mergeCommitSha };
  } catch (err: any) {
    // Abort on unexpected error
    await $`git -C ${projectPath} merge --abort`.quiet().nothrow();
    return { success: false, error: err.message };
  } finally {
    releaseLock!();
    // Clean up lock if nothing else is queued after us
    if (mergeLocks.get(buildingId) === chainedPromise) mergeLocks.delete(buildingId);
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
  await $`git -C ${projectPath} worktree remove ${worktreePath} --force`
    .quiet()
    .nothrow();
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
  await $`git -C ${projectPath} worktree remove ${worktreePath} --force`
    .quiet()
    .nothrow();
  await $`git -C ${projectPath} branch -D ${branchName}`.quiet().nothrow();
}

/**
 * Revert a merge commit (undo an agent's merged work).
 */
export async function revertMerge(
  projectPath: string,
  mergeCommitSha: string
): Promise<{ success: boolean; error?: string }> {
  const result =
    await $`git -C ${projectPath} revert -m 1 --no-edit ${mergeCommitSha}`
      .quiet()
      .nothrow();

  if (result.exitCode !== 0) {
    await $`git -C ${projectPath} revert --abort`.quiet().nothrow();
    return { success: false, error: result.stderr.toString() };
  }
  return { success: true };
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
      // Non-fatal — agent can still work without symlinks
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
