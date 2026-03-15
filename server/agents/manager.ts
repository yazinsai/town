import { createSession, killSession, getSession } from "./sdk";
import type { AgentCallbacks } from "./sdk";
import * as storage from "../storage";
import { broadcast } from "../websocket";
import { handleCaretaker } from "../caretaker";
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

      // Try caretaker first — if it handles it, skip broadcasting speech bubble
      const handled = await handleCaretaker(agentId, "question");
      if (!handled) {
        broadcast({ type: "agent:question", agentId, question });
      }
    },

    onPermission: async (permission) => {
      await storage.updateAgent(agentId, {
        state: "waiting_permission",
        pendingPermission: permission,
        pendingQuestion: null,
      });

      // Try caretaker first
      const handled = await handleCaretaker(agentId, "permission");
      if (!handled) {
        broadcast({ type: "agent:permission", agentId, permission });
      }
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
          const result = await mergeWorktree(building.projectPath, agent.branchName, building.id, agent.worktreePath);
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
 * Uses the saved SDK session ID to resume with full conversation context,
 * but only if the worktree is still intact. After merge/discard/revert the
 * session was tied to the (now-deleted) worktree path and can't be resumed.
 */
async function respawnSession(agentId: string, message: string) {
  const agent = storage.getAgent(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const building = storage.getBuilding(agent.buildingId);
  if (!building) throw new Error(`Building ${agent.buildingId} not found`);

  // Use worktree path if available, otherwise fall back to project path
  const cwd = agent.worktreePath || building.projectPath;

  // Can only resume if the worktree is still intact (cwd matches the original session)
  // After merge/discard/revert the worktree is deleted and the SDK session
  // was tied to that path — resuming with a different cwd causes exit code 1
  const canResume = !!agent.worktreePath && !!agent.sdkSessionId;

  let prompt = message;
  if (!canResume && agent.sdkSessionId) {
    // Build context from conversation history so the agent isn't starting blind
    const conversation = await storage.getConversation(agentId);
    const contextLines: string[] = [
      `You are continuing work on a project. Here is the previous conversation summary:`,
      `Original task: ${agent.initialPrompt}`,
    ];
    // Include last few meaningful messages for context (skip tool calls)
    const recentMessages = conversation
      .filter((e) => e.role === "assistant" || e.role === "user")
      .slice(-6);
    if (recentMessages.length > 0) {
      contextLines.push("", "Recent conversation:");
      for (const msg of recentMessages) {
        contextLines.push(`[${msg.role}]: ${msg.content.slice(0, 500)}`);
      }
    }
    contextLines.push("", `New user message: ${message}`);
    prompt = contextLines.join("\n");
  }

  const callbacks = makeCallbacks(agentId);
  createSession(
    agentId,
    cwd,
    prompt,
    callbacks,
    agent.customSystemPrompt || undefined,
    canResume ? agent.sdkSessionId! : undefined
  );
}

export async function respondToAgent(
  agentId: string,
  request: RespondToAgentRequest,
  source?: "user" | "caretaker"
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
    role: source || "user",
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
    await respawnSession(agentId, request.message);
    return;
  }

  if (!session) {
    throw new Error(`No active session for agent ${agentId}`);
  }

  // If agent has a pending question and user sends a freeform message,
  // convert it to an answer so it unblocks the waiting promise
  if (request.type === "message" && agent.pendingQuestion) {
    const answers: Record<string, string> = {};
    for (const q of agent.pendingQuestion.questions) {
      answers[q.question] = request.message || "";
    }
    session.respondToQuestion(answers);
    return;
  }

  // If agent has a pending permission and user sends a freeform message,
  // interpret it as approval/denial
  if (request.type === "message" && agent.pendingPermission) {
    const msg = (request.message || "").toLowerCase();
    const denied = msg.includes("deny") || msg.includes("reject") || msg.includes("no");
    session.respondToPermission(!denied);
    return;
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
