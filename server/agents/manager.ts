import { createSession, killSession, getSession } from "./sdk";
import type { AgentCallbacks } from "./sdk";
import * as storage from "../storage";
import { broadcast } from "../websocket";
import { isGitRepo, createWorktree, mergeWorktree, cleanupWorktree } from "../worktree";
import type { AgentState, ConversationEntry, RespondToAgentRequest } from "../../shared/types";

function makeCallbacks(agentId: string): AgentCallbacks {
  return {
    onStateChange: async (state: string, currentTask?: string) => {
      const updates: Partial<{ state: AgentState; currentTask: string }> = {
        state: state as AgentState,
      };
      if (currentTask) updates.currentTask = currentTask;
      await storage.updateAgent(agentId, updates);
      broadcast({
        type: "agent:state",
        agentId,
        state: state as AgentState,
        currentTask,
      });
    },

    onMessage: async (entry: ConversationEntry) => {
      await storage.appendConversation(agentId, entry);
      broadcast({ type: "agent:message", agentId, entry });
    },

    onQuestion: async (question) => {
      await storage.updateAgent(agentId, {
        state: "waiting_input",
        pendingQuestion: question,
        pendingPermission: null,
      });
      broadcast({ type: "agent:question", agentId, question });
    },

    onPermission: async (permission) => {
      await storage.updateAgent(agentId, {
        state: "waiting_permission",
        pendingPermission: permission,
        pendingQuestion: null,
      });
      broadcast({ type: "agent:permission", agentId, permission });
    },

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
            try {
              await cleanupWorktree(building.projectPath, agent.worktreePath, agent.branchName);
            } catch (err: any) {
              console.error(`[worktree] cleanup failed for ${agentId}:`, err);
            }
            await storage.updateAgent(agentId, {
              mergeStatus: "merged",
              mergeCommitSha: result.mergeCommitSha || null,
              worktreePath: null,
            });
            broadcast({ type: "agent:merged", agentId });
          } else {
            broadcast({ type: "agent:merge-failed", agentId, error: result.error || "Merge conflict" });
          }
        }
      }
    },

    onError: async (error: string) => {
      await storage.updateAgent(agentId, {
        state: "error",
        error,
        completedAt: new Date().toISOString(),
        pendingQuestion: null,
        pendingPermission: null,
      });
      broadcast({ type: "agent:error", agentId, error });
    },

    onSessionId: async (sdkSessionId: string) => {
      await storage.updateAgent(agentId, { sdkSessionId });
    },
  };
}

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
      // Fall back to direct cwd
    }
  }

  const callbacks = makeCallbacks(agent.id);
  createSession(agent.id, agentCwd, initialPrompt, callbacks, customSystemPrompt);

  return agent.id;
}

/**
 * Re-spawn a session for an agent whose SDK query has ended.
 * Uses the saved SDK session ID to resume with full conversation context.
 */
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
    agent.sdkSessionId || undefined // Resume previous conversation
  );
}

export async function respondToAgent(
  agentId: string,
  request: RespondToAgentRequest
) {
  const agent = storage.getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  // Log the user response
  let userContent: string;
  if (request.type === "answer") {
    userContent = Object.entries(request.answers || {})
      .map(([q, a]) => `${q}: ${a}`)
      .join("\n");
  } else if (request.type === "permission") {
    userContent = request.approved ? "Approved" : "Denied";
  } else {
    userContent = request.message || "";
  }

  const entry: ConversationEntry = {
    timestamp: new Date().toISOString(),
    role: "user",
    content: userContent,
  };
  await storage.appendConversation(agentId, entry);
  broadcast({ type: "agent:message", agentId, entry });

  // Clear pending state
  await storage.updateAgent(agentId, {
    pendingQuestion: null,
    pendingPermission: null,
  });

  let session = getSession(agentId);

  // If session ended (agent completed/errored), re-spawn for follow-up messages
  if (!session && request.type === "message" && request.message) {
    respawnSession(agentId, request.message);
    return;
  }

  if (!session) {
    throw new Error(`No active session for agent ${agentId}`);
  }

  switch (request.type) {
    case "answer":
      session.respondToQuestion(request.answers || {});
      break;
    case "permission":
      session.respondToPermission(request.approved ?? false);
      break;
    case "message":
      session.sendMessage(request.message || "");
      break;
  }
}

export async function killAgent(agentId: string) {
  killSession(agentId);
  await storage.updateAgent(agentId, {
    state: "completed",
    completedAt: new Date().toISOString(),
    pendingQuestion: null,
    pendingPermission: null,
  });
  broadcast({ type: "agent:completed", agentId });
}
