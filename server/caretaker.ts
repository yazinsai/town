import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKAssistantMessage, SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { spawn } from "child_process";
import * as storage from "./storage";
import { broadcast } from "./websocket";
import type {
  Agent,
  Building,
  Caretaker,
  ConversationEntry,
  PendingQuestion,
  PendingPermission,
  RespondToAgentRequest,
} from "../shared/types";

// ---------------------------------------------------------------------------
// 1. Building queue — sequential execution per building
// ---------------------------------------------------------------------------

const buildingQueues = new Map<string, Promise<void>>();

function enqueue(buildingId: string, fn: () => Promise<void>): Promise<void> {
  const prev = buildingQueues.get(buildingId) ?? Promise.resolve();
  const next = prev.then(fn, fn); // run even if previous rejected
  buildingQueues.set(buildingId, next);
  // Clean up when the chain settles
  next.finally(() => {
    if (buildingQueues.get(buildingId) === next) {
      buildingQueues.delete(buildingId);
    }
  });
  return next;
}

// ---------------------------------------------------------------------------
// 2. Prompt builder
// ---------------------------------------------------------------------------

interface PromptContext {
  building: Building;
  caretaker: Caretaker;
  agent: Agent;
  question: PendingQuestion | null;
  permission: PendingPermission | null;
  recentConversation: ConversationEntry[];
}

function buildPrompt(ctx: PromptContext): string {
  const lines: string[] = [];

  lines.push(`You are the caretaker for the project "${ctx.building.name}".`);
  lines.push(`Your job is to automatically handle agent questions and permission requests on behalf of the project owner.`);
  lines.push("");

  // Owner instructions
  if (ctx.caretaker.instructions) {
    lines.push("## Owner's Instructions");
    lines.push(ctx.caretaker.instructions);
    lines.push("");
  }

  // Agent info
  lines.push(`## Agent`);
  lines.push(`Task: ${ctx.agent.currentTask || ctx.agent.initialPrompt}`);
  lines.push("");

  // What the agent is asking
  if (ctx.question) {
    lines.push("## Agent Question");
    for (const q of ctx.question.questions) {
      lines.push(`**${q.header || "Question"}**: ${q.question}`);
      if (q.options.length > 0) {
        lines.push("Options:");
        for (const opt of q.options) {
          lines.push(`  - ${opt.label}${opt.description ? `: ${opt.description}` : ""}`);
        }
      }
    }
    lines.push("");
  }

  if (ctx.permission) {
    lines.push("## Permission Request");
    lines.push(`Tool: ${ctx.permission.toolName}`);
    lines.push(`Input: ${JSON.stringify(ctx.permission.input, null, 2)}`);
    lines.push("");
    lines.push("Should this tool use be approved or denied?");
    lines.push("");
  }

  // Recent conversation context
  if (ctx.recentConversation.length > 0) {
    lines.push("## Recent Conversation (last entries for context)");
    for (const entry of ctx.recentConversation) {
      const prefix = entry.role === "assistant" ? "Agent" : entry.role === "user" ? "User" : entry.role;
      lines.push(`[${prefix}]: ${entry.content}`);
    }
    lines.push("");
  }

  // Response instructions
  lines.push("## How to Respond");
  lines.push("Respond with your answer directly. Be concise.");
  if (ctx.question) {
    lines.push("If the question has options, pick the best option label.");
  }
  if (ctx.permission) {
    lines.push('Say "approve" to allow the tool use or "deny" to reject it.');
  }
  lines.push("");
  lines.push("If you are unsure, or the question requires the project owner's personal judgment,");
  lines.push("start your response with [ESCALATE] followed by a brief reason why.");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 3. Response parser
// ---------------------------------------------------------------------------

interface ParsedResponse {
  action: "respond" | "escalate";
  // For questions with answers
  answers?: Record<string, string>;
  // For permissions
  approved?: boolean;
  // Explanation
  reason?: string;
  summary: string;
}

function parseResponse(
  raw: string,
  question: PendingQuestion | null,
  permission: PendingPermission | null
): ParsedResponse {
  const trimmed = raw.trim();

  // Check for escalation
  if (trimmed.startsWith("[ESCALATE]")) {
    const reason = trimmed.replace("[ESCALATE]", "").trim();
    return {
      action: "escalate",
      reason: reason || "Caretaker chose to escalate to owner",
      summary: reason || "Escalated to owner",
    };
  }

  // Permission response
  if (permission) {
    const lower = trimmed.toLowerCase();
    const approved = lower.includes("approve");
    return {
      action: "respond",
      approved,
      reason: trimmed,
      summary: approved ? "Approved" : "Denied",
    };
  }

  // Question response — match option labels
  if (question) {
    const answers: Record<string, string> = {};
    for (const q of question.questions) {
      if (q.options.length > 0) {
        // Try to match an option label in the response
        const matched = q.options.find((opt) =>
          trimmed.toLowerCase().includes(opt.label.toLowerCase())
        );
        answers[q.question] = matched ? matched.label : trimmed;
      } else {
        answers[q.question] = trimmed;
      }
    }
    return {
      action: "respond",
      answers,
      summary: trimmed.length > 100 ? trimmed.slice(0, 100) + "..." : trimmed,
    };
  }

  // Fallback
  return {
    action: "respond",
    summary: trimmed.length > 100 ? trimmed.slice(0, 100) + "..." : trimmed,
  };
}

// ---------------------------------------------------------------------------
// 4. Claude backend
// ---------------------------------------------------------------------------

async function queryClaudeBackend(prompt: string, cwd: string): Promise<string> {
  const q = query({
    prompt,
    options: {
      cwd,
      maxTurns: 1,
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: "You are a caretaker AI. Respond concisely to the question. Do not use tools.",
      },
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      tools: { type: "preset", preset: "claude_code" },
      settingSources: ["user", "project"],
    } as any,
  });

  const texts: string[] = [];
  for await (const message of q) {
    if (message.type === "assistant") {
      const assistantMsg = message as SDKAssistantMessage;
      for (const block of assistantMsg.message.content) {
        if (block.type === "text") {
          texts.push(block.text);
        }
      }
    } else if (message.type === "result") {
      const result = message as SDKResultMessage;
      if (result.subtype === "success" && result.result) {
        texts.push(result.result);
      }
    }
  }

  return texts.join("\n").trim();
}

// ---------------------------------------------------------------------------
// 5. Codex backend
// ---------------------------------------------------------------------------

async function queryCodexBackend(prompt: string, cwd: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("codex", ["exec", "--full-auto", prompt], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Codex timed out after 2 minutes"));
    }, 2 * 60 * 1000);

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Codex exited with code ${code}: ${stderr}`));
        return;
      }

      // Parse stdout — actual response is after the "codex" marker line
      const lines = stdout.split("\n");
      let startIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toLowerCase() === "codex") {
          startIdx = i + 1;
          break;
        }
      }

      // Strip the "tokens used" footer
      let endIdx = lines.length;
      for (let i = lines.length - 1; i >= startIdx; i--) {
        if (lines[i].match(/tokens?\s+used/i)) {
          endIdx = i;
          break;
        }
      }

      const response = lines.slice(startIdx, endIdx).join("\n").trim();
      resolve(response || stdout.trim());
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// 6. Main handler
// ---------------------------------------------------------------------------

/**
 * Attempts to handle a pending agent question or permission via the building's
 * caretaker. Returns `true` if the caretaker will handle it (asynchronously),
 * `false` if no caretaker is configured/enabled.
 */
export function handleCaretaker(
  agentId: string,
  type: "question" | "permission"
): boolean {
  const agent = storage.getAgent(agentId);
  if (!agent) return false;

  const building = storage.getBuilding(agent.buildingId);
  if (!building) return false;

  const caretaker = building.caretaker;
  if (!caretaker || !caretaker.enabled) return false;

  // Determine working directory
  const cwd = agent.worktreePath || building.projectPath;

  // Fire and forget — the queue handles serialization
  enqueue(building.id, async () => {
    try {
      // Re-fetch agent state — it may have been answered while queued
      const freshAgent = storage.getAgent(agentId);
      if (!freshAgent) return;

      const question = type === "question" ? freshAgent.pendingQuestion : null;
      const permission = type === "permission" ? freshAgent.pendingPermission : null;

      // If the pending state was already cleared (user answered), skip
      if (type === "question" && !question) return;
      if (type === "permission" && !permission) return;

      // Get recent conversation for context
      const conversation = await storage.getConversation(agentId);
      const recentConversation = conversation.slice(-10);

      // Build prompt
      const prompt = buildPrompt({
        building,
        caretaker,
        agent: freshAgent,
        question,
        permission,
        recentConversation,
      });

      // Invoke model
      let responseText: string;
      if (caretaker.model === "codex") {
        responseText = await queryCodexBackend(prompt, cwd);
      } else {
        responseText = await queryClaudeBackend(prompt, cwd);
      }

      // Parse response
      const parsed = parseResponse(responseText, question, permission);

      if (parsed.action === "respond") {
        // Build the respondToAgent request
        const request: RespondToAgentRequest = { type: "answer" };
        if (type === "permission") {
          request.type = "permission";
          request.approved = parsed.approved;
        } else if (parsed.answers) {
          request.type = "answer";
          request.answers = parsed.answers;
        }

        // Dynamic import to avoid circular dependency
        const { respondToAgent } = await import("./agents/manager");
        await respondToAgent(agentId, request, "caretaker");

        broadcast({
          type: "caretaker:responded",
          agentId,
          buildingId: building.id,
          summary: parsed.summary,
        });
      } else {
        // Escalate — leave the speech bubble for the owner
        broadcast({
          type: "caretaker:escalated",
          agentId,
          buildingId: building.id,
          reason: parsed.reason || "Caretaker escalated to owner",
        });

        // Re-broadcast the original event so the speech bubble appears
        const currentAgent = storage.getAgent(agentId);
        if (currentAgent) {
          if (type === "question" && currentAgent.pendingQuestion) {
            broadcast({ type: "agent:question", agentId, question: currentAgent.pendingQuestion });
          } else if (type === "permission" && currentAgent.pendingPermission) {
            broadcast({ type: "agent:permission", agentId, permission: currentAgent.pendingPermission });
          }
        }
      }
    } catch (err: any) {
      // On error, silently escalate — the speech bubble stays for the owner
      console.error(`[caretaker] Error handling ${type} for agent ${agentId}:`, err.message);
      broadcast({
        type: "caretaker:escalated",
        agentId,
        buildingId: building.id,
        reason: `Caretaker error: ${err.message}`,
      });

      // Re-broadcast the original event so the speech bubble appears
      const errorAgent = storage.getAgent(agentId);
      if (errorAgent) {
        if (type === "question" && errorAgent.pendingQuestion) {
          broadcast({ type: "agent:question", agentId, question: errorAgent.pendingQuestion });
        } else if (type === "permission" && errorAgent.pendingPermission) {
          broadcast({ type: "agent:permission", agentId, permission: errorAgent.pendingPermission });
        }
      }
    }
  });

  return true;
}
