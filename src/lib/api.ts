import type {
  Building,
  Agent,
  CreateBuildingRequest,
  SpawnAgentRequest,
  RespondToAgentRequest,
  ConversationEntry,
  TrashedBuilding,
} from "@shared/types";

let authenticated = false;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) {
      authenticated = false;
    }
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });
    if (!res.ok) return false;
    authenticated = true;
    return true;
  } catch {
    return false;
  }
}

export function isAuthenticated(): boolean {
  return authenticated;
}

export async function checkAuth(): Promise<boolean> {
  try {
    await apiFetch("/health");
    authenticated = true;
    return true;
  } catch {
    return false;
  }
}

export async function getBuildings(): Promise<Building[]> {
  return apiFetch<Building[]>("/buildings");
}

export async function createBuilding(
  req: CreateBuildingRequest
): Promise<{ building: Building; agentId: string }> {
  return apiFetch<{ building: Building; agentId: string }>("/buildings", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getBuilding(
  id: string
): Promise<Building & { agentDetails: Agent[] }> {
  return apiFetch<Building & { agentDetails: Agent[] }>(`/buildings/${id}`);
}

export async function deleteBuilding(id: string): Promise<void> {
  return apiFetch<void>(`/buildings/${id}`, { method: "DELETE" });
}

export async function spawnAgent(
  buildingId: string,
  req: SpawnAgentRequest
): Promise<{ agentId: string }> {
  return apiFetch<{ agentId: string }>(`/buildings/${buildingId}/agents`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getAgent(id: string): Promise<Agent> {
  return apiFetch<Agent>(`/agents/${id}`);
}

export async function respondToAgent(
  id: string,
  req: RespondToAgentRequest
): Promise<void> {
  return apiFetch<void>(`/agents/${id}/respond`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function killAgent(id: string): Promise<void> {
  return apiFetch<void>(`/agents/${id}/kill`, { method: "POST" });
}

export async function getConversation(
  id: string
): Promise<ConversationEntry[]> {
  return apiFetch<ConversationEntry[]>(`/agents/${id}/conversation`);
}

export interface ProjectInfo {
  name: string;
  path: string;
}

export async function getProjects(query?: string): Promise<ProjectInfo[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiFetch<ProjectInfo[]>(`/projects${params}`);
}

export async function getTrashedBuildings(): Promise<TrashedBuilding[]> {
  return apiFetch<TrashedBuilding[]>("/trash");
}

export async function restoreBuilding(id: string): Promise<{ building: Building }> {
  return apiFetch<{ building: Building }>(`/trash/${id}/restore`, { method: "POST" });
}

export async function permanentDeleteTrash(id: string): Promise<void> {
  return apiFetch<void>(`/trash/${id}`, { method: "DELETE" });
}
