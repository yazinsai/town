import { query } from "@anthropic-ai/claude-agent-sdk";
import type {
  SDKMessage,
  SDKAssistantMessage,
  SDKResultMessage,
  SDKUserMessage,
  Query,
} from "@anthropic-ai/claude-agent-sdk";
import type { ConversationEntry, PendingQuestion, PendingPermission } from "../../shared/types";

export interface AgentCallbacks {
  onStateChange: (state: string, currentTask?: string) => void;
  onMessage: (entry: ConversationEntry) => void;
  onQuestion: (question: PendingQuestion) => void;
  onPermission: (permission: PendingPermission) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  onSessionId: (sessionId: string) => void;
}

interface PendingResolver {
  resolve: (msg: SDKUserMessage) => void;
}

export interface AgentSession {
  agentId: string;
  queryInstance: Query;
  abortController: AbortController;
  sendMessage: (message: string) => void;
  respondToQuestion: (answers: Record<string, string>) => void;
  respondToPermission: (approved: boolean) => void;
  kill: () => void;
}

const sessions = new Map<string, AgentSession>();

export function getSession(agentId: string): AgentSession | undefined {
  return sessions.get(agentId);
}

export function createSession(
  agentId: string,
  cwd: string,
  initialPrompt: string,
  callbacks: AgentCallbacks,
  customSystemPrompt?: string,
  resumeSessionId?: string
): AgentSession {
  const abortController = new AbortController();
  let sessionId = resumeSessionId || "";

  // Build system prompt — always append town-specific instructions
  const townInstructions = [
    "You are running inside Claude Town, a visual agent orchestrator.",
    "The user interacts with you through a simplified UI — not a terminal.",
    "When you have a plan or proposal, use AskUserQuestion to present it and get approval before implementing.",
    "Include clear options like 'Approve and proceed' and 'Revise the plan'.",
    "Do NOT assume the user can see or interact with terminal-style permission prompts.",
  ].join("\n");

  const appendText = customSystemPrompt
    ? `${townInstructions}\n\n${customSystemPrompt}`
    : townInstructions;

  const systemPrompt: { type: "preset"; preset: "claude_code"; append: string } = {
    type: "preset" as const,
    preset: "claude_code" as const,
    append: appendText,
  };

  // Build query options
  const queryOptions: Record<string, unknown> = {
    cwd,
    systemPrompt,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    tools: { type: "preset", preset: "claude_code" },
    settingSources: ["user", "project"],
    abortController,
    stderr: (data: string) => {
      console.error(`[agent:${agentId.slice(0, 8)}] ${data}`);
    },
  };

  // Resume previous conversation if we have a session ID
  if (resumeSessionId) {
    queryOptions.resume = resumeSessionId;
  }

  // Start the query
  const q = query({
    prompt: initialPrompt,
    options: queryOptions as any,
  });

  // Process messages in background
  (async () => {
    try {
      callbacks.onStateChange("busy", initialPrompt);

      for await (const message of q) {
        if (abortController.signal.aborted) break;

        handleMessage(message, agentId, callbacks, () => sessionId);

        // Capture session ID for resume support
        if (!sessionId && "session_id" in message && message.session_id) {
          sessionId = message.session_id;
          callbacks.onSessionId(sessionId);
        }
      }

      // Query completed naturally — don't call onComplete here,
      // it's already called from the result handler in handleMessage
    } catch (err: any) {
      if (err.name === "AbortError" || abortController.signal.aborted) {
        callbacks.onComplete();
      } else {
        callbacks.onError(err.message || "Unknown error");
      }
    } finally {
      sessions.delete(agentId);
    }
  })();

  const session: AgentSession = {
    agentId,
    queryInstance: q,
    abortController,
    sendMessage: (_message: string) => {
      // In resume mode, follow-ups create a new session via manager.respawnSession
      // This is kept for AskUserQuestion responses during an active query
      console.warn(`[agent:${agentId.slice(0, 8)}] sendMessage not supported in resume mode`);
    },
    respondToQuestion: (answers: Record<string, string>) => {
      callbacks.onStateChange("busy");
      // For AskUserQuestion during an active query, we can't push messages
      // The manager will respawn with the answer as a new prompt
      const answerText = Object.entries(answers)
        .map(([q, a]) => `${q}: ${a}`)
        .join("\n");
      console.warn(`[agent:${agentId.slice(0, 8)}] respondToQuestion: ${answerText}`);
    },
    respondToPermission: (approved: boolean) => {
      callbacks.onStateChange("busy");
      console.warn(`[agent:${agentId.slice(0, 8)}] respondToPermission: ${approved}`);
    },
    kill: () => {
      abortController.abort();
      q.return(undefined);
      sessions.delete(agentId);
    },
  };

  sessions.set(agentId, session);
  return session;
}

function handleMessage(
  message: SDKMessage,
  agentId: string,
  callbacks: AgentCallbacks,
  getSessionId: () => string
) {
  switch (message.type) {
    case "system": {
      if (message.subtype === "init") {
        callbacks.onMessage({
          timestamp: new Date().toISOString(),
          role: "system",
          content: `Session initialized. Model: ${message.model}`,
          metadata: { tools: message.tools },
        });
      }
      break;
    }

    case "assistant": {
      const assistantMsg = message as SDKAssistantMessage;
      const betaMessage = assistantMsg.message;

      // Process content blocks
      for (const block of betaMessage.content) {
        if (block.type === "text") {
          callbacks.onMessage({
            timestamp: new Date().toISOString(),
            role: "assistant",
            content: block.text,
          });
        } else if (block.type === "tool_use") {
          // Check for AskUserQuestion
          if (block.name === "AskUserQuestion") {
            const input = block.input as any;
            callbacks.onStateChange("waiting_input");
            callbacks.onQuestion({
              questions: (input.questions || []).map((q: any) => ({
                question: q.question || "",
                header: q.header || "",
                options: (q.options || []).map((o: any) => ({
                  label: o.label || "",
                  description: o.description || "",
                })),
                multiSelect: q.multiSelect || false,
              })),
            });
          } else if (block.name === "ExitPlanMode") {
            // Plan approval — surface as a question so user can approve/reject
            callbacks.onStateChange("waiting_input");
            callbacks.onQuestion({
              questions: [{
                question: "The agent has a plan ready. Approve it?",
                header: "Plan",
                options: [
                  { label: "Approve", description: "Proceed with the plan as described" },
                  { label: "Reject", description: "Send the agent back to revise" },
                ],
                multiSelect: false,
              }],
            });
          } else if (block.name === "EnterPlanMode") {
            // Just log it — agent is entering plan mode
            callbacks.onMessage({
              timestamp: new Date().toISOString(),
              role: "tool_call",
              content: "EnterPlanMode",
              metadata: { toolName: block.name, input: block.input, toolUseId: block.id },
            });
            callbacks.onStateChange("busy", "Planning...");
          } else {
            // Regular tool use
            callbacks.onMessage({
              timestamp: new Date().toISOString(),
              role: "tool_call",
              content: `${block.name}`,
              metadata: {
                toolName: block.name,
                input: block.input,
                toolUseId: block.id,
              },
            });
          }
        }
      }
      break;
    }

    case "result": {
      const result = message as SDKResultMessage;
      if (result.subtype === "success") {
        callbacks.onMessage({
          timestamp: new Date().toISOString(),
          role: "assistant",
          content: result.result || "Task completed.",
          metadata: {
            costUsd: result.total_cost_usd,
            numTurns: result.num_turns,
            durationMs: result.duration_ms,
          },
        });
        // In streaming input mode, the for-await loop never ends on its own
        // because the generator keeps waiting for more messages.
        // The result message IS the signal that the agent finished its task.
        callbacks.onComplete();
      } else {
        const errors = "errors" in result ? result.errors : [];
        callbacks.onError(errors.join("; ") || `Error: ${result.subtype}`);
      }
      break;
    }
  }
}

export function killSession(agentId: string) {
  const session = sessions.get(agentId);
  if (session) {
    session.kill();
  }
}
