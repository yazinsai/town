export type BuildingStyle =
  | "saloon"
  | "bank"
  | "sheriff"
  | "general-store"
  | "hotel"
  | "masjid"
  | "blacksmith"
  | "post-office";

export type AgentState =
  | "busy"
  | "idle"
  | "waiting_input"
  | "waiting_permission"
  | "completed"
  | "error";

export interface Building {
  id: string;
  name: string;
  projectPath: string;
  buildingStyle: BuildingStyle;
  createdAt: string;
  agents: string[];
}

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

export interface TrashedBuilding {
  buildingId: string;
  trashedAt: string; // ISO 8601
  building: Building;
  agents: Agent[];
}

export interface PendingQuestion {
  questions: Array<{
    question: string;
    header: string;
    options: Array<{ label: string; description: string }>;
    multiSelect: boolean;
  }>;
}

export interface PendingPermission {
  toolName: string;
  input: unknown;
}

export interface ConversationEntry {
  timestamp: string;
  role: "assistant" | "user" | "tool_call" | "tool_result" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ImageAttachment {
  name: string;
  mediaType: string;
  data: string; // base64
}

// API request/response types
export interface CreateBuildingRequest {
  name: string;
  projectPath: string;
  buildingStyle: BuildingStyle;
  initialPrompt: string;
  customSystemPrompt?: string;
  images?: ImageAttachment[];
}

export interface RespondToAgentRequest {
  type: "answer" | "permission" | "message";
  // For answer type — maps question text to answer
  answers?: Record<string, string>;
  // For permission type
  approved?: boolean;
  // For message type
  message?: string;
  // Optional image attachments
  images?: ImageAttachment[];
}

export interface SpawnAgentRequest {
  initialPrompt: string;
  customSystemPrompt?: string;
  images?: ImageAttachment[];
}

// WebSocket event types
export type WSEvent =
  | { type: "agent:state"; agentId: string; state: AgentState; currentTask?: string }
  | { type: "agent:message"; agentId: string; entry: ConversationEntry }
  | { type: "agent:question"; agentId: string; question: PendingQuestion }
  | { type: "agent:permission"; agentId: string; permission: PendingPermission }
  | { type: "agent:completed"; agentId: string }
  | { type: "agent:error"; agentId: string; error: string }
  | { type: "agent:merged"; agentId: string }
  | { type: "agent:merge-failed"; agentId: string; error: string }
  | { type: "agent:discarded"; agentId: string }
  | { type: "agent:reverted"; agentId: string }
  | { type: "building:created"; building: Building }
  | { type: "building:removed"; buildingId: string }
  | { type: "building:restored"; building: Building };
