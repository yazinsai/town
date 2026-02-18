import { useState, useEffect, useCallback, useRef } from "react";
import type { Building, Agent } from "@shared/types";
import { login, checkAuth, getBuilding, getTrashedBuildings } from "./lib/api";
import { useWebSocket } from "./hooks/useWebSocket";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { useBuildings } from "./hooks/useBuildings";
import TownScene from "./components/town/TownScene";
import NewBuilding from "./components/panels/NewBuilding";
import BuildingDetail from "./components/panels/BuildingDetail";
import QuickResponse from "./components/panels/QuickResponse";
import TrashPanel from "./components/panels/TrashPanel";
import PixelButton from "./components/ui/PixelButton";
import PixelInput from "./components/ui/PixelInput";
import PixelText from "./components/ui/PixelText";

const SEEN_AGENTS_KEY = "claude-town-seen-agents";

function loadSeenAgents(): Set<string> {
  try {
    const stored = localStorage.getItem(SEEN_AGENTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenAgents(set: Set<string>) {
  localStorage.setItem(SEEN_AGENTS_KEY, JSON.stringify([...set]));
}


type Panel =
  | { type: "none" }
  | { type: "newBuilding" }
  | { type: "buildingDetail"; building: Building; focusedAgentId?: string }
  | { type: "quickResponse"; agent: Agent }
  | { type: "trash" };

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#2C1810",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          padding: "32px",
          border: "3px solid #8B4513",
        }}
      >
        <PixelText variant="h1" color="#F4E4C1">
          CLAUDE TOWN
        </PixelText>
        <PixelText variant="small" color="#A0826A">
          Enter the password, partner
        </PixelText>
        <PixelInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {error && (
          <PixelText variant="small" color="#F44336">
            Wrong password, stranger
          </PixelText>
        )}
        <PixelButton type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "..." : "ENTER"}
        </PixelButton>
      </form>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already authenticated via cookie or auto-login via ?p= URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");

    async function init() {
      if (p) {
        const ok = await login(p);
        if (ok) {
          params.delete("p");
          const clean = params.toString();
          window.history.replaceState({}, "", window.location.pathname + (clean ? `?${clean}` : ""));
          setAuthed(true);
          setChecking(false);
          return;
        }
      }
      const ok = await checkAuth();
      setAuthed(ok);
      setChecking(false);
    }

    init();
  }, []);
  const { lastEvent, connected } = useWebSocket(authed);
  const { muted, toggleMute } = useSoundEffects(lastEvent);
  const { buildings, refetch } = useBuildings(lastEvent, authed);
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [agentsByBuilding, setAgentsByBuilding] = useState<Record<string, Agent[]>>({});
  const [seenAgents, setSeenAgents] = useState(() => loadSeenAgents());
  const [trashCount, setTrashCount] = useState(0);

  const markAgentSeen = useCallback((agentId: string) => {
    setSeenAgents((prev) => {
      if (prev.has(agentId)) return prev;
      const next = new Set(prev);
      next.add(agentId);
      saveSeenAgents(next);
      return next;
    });
  }, []);

  const refreshTrashCount = useCallback(async () => {
    try {
      const trashed = await getTrashedBuildings();
      setTrashCount(trashed.length);
    } catch {
      setTrashCount(0);
    }
  }, []);

  // Fetch trash count on mount
  useEffect(() => {
    if (authed) refreshTrashCount();
  }, [authed, refreshTrashCount]);

  // Refresh trash count on building:removed and building:restored events
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "building:removed" || lastEvent.type === "building:restored") {
      refreshTrashCount();
    }
  }, [lastEvent, refreshTrashCount]);

  // Auto-mark already-terminal agents as seen on first load
  const initialLoadDone = useRef(false);

  // Fetch agent details for all buildings
  useEffect(() => {
    if (!authed || buildings.length === 0) return;

    async function fetchAgents() {
      const results: Record<string, Agent[]> = {};
      await Promise.all(
        buildings.map(async (b) => {
          try {
            const detail = await getBuilding(b.id);
            results[b.id] = detail.agentDetails || [];
          } catch {
            results[b.id] = [];
          }
        })
      );
      setAgentsByBuilding(results);

      // On first load, auto-mark completed/error agents as seen
      // so only NEW state transitions show bubbles
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        const terminalIds = Object.values(results)
          .flat()
          .filter((a) => a.state === "completed" || a.state === "error")
          .map((a) => a.id);
        if (terminalIds.length > 0) {
          setSeenAgents((prev) => {
            const next = new Set(prev);
            terminalIds.forEach((id) => next.add(id));
            saveSeenAgents(next);
            return next;
          });
        }
      }
    }

    fetchAgents();
  }, [authed, buildings]);

  // Update agent details on WS events
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "agent:state" ||
      lastEvent.type === "agent:question" ||
      lastEvent.type === "agent:permission" ||
      lastEvent.type === "agent:completed" ||
      lastEvent.type === "agent:error"
    ) {
      // Re-fetch all agents (simple approach)
      const fetchAll = async () => {
        const results: Record<string, Agent[]> = {};
        await Promise.all(
          buildings.map(async (b) => {
            try {
              const detail = await getBuilding(b.id);
              results[b.id] = detail.agentDetails || [];
            } catch {
              results[b.id] = [];
            }
          })
        );
        setAgentsByBuilding(results);
      };
      fetchAll();
    }
  }, [lastEvent, buildings]);

  if (checking) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#2C1810", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PixelText variant="h2" color="#F4E4C1">Loading...</PixelText>
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <div style={{ position: "relative" }}>
      <TownScene
        buildings={buildings}
        agents={agentsByBuilding}
        seenAgents={seenAgents}
        onBuildClick={(building) =>
          setPanel({ type: "buildingDetail", building })
        }
        onBubbleClick={(agent, building) => {
          if (agent.state === "completed") markAgentSeen(agent.id);
          setPanel({ type: "buildingDetail", building, focusedAgentId: agent.id });
        }}
        onNewBuilding={() => setPanel({ type: "newBuilding" })}
        connected={connected}
        muted={muted}
        onToggleMute={toggleMute}
      />

      {trashCount > 0 && (
        <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 80 }}>
          <PixelButton variant="ghost" onClick={() => setPanel({ type: "trash" })}>
            TRASH ({trashCount})
          </PixelButton>
        </div>
      )}

      {/* Overlay backdrop for panels */}
      {panel.type !== "none" && (
        <div
          onClick={() => setPanel({ type: "none" })}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 90,
          }}
        />
      )}

      {/* Panels */}
      {panel.type === "newBuilding" && (
        <NewBuilding
          onClose={() => setPanel({ type: "none" })}
          onCreated={() => {
            setPanel({ type: "none" });
            refetch();
          }}
        />
      )}

      {panel.type === "buildingDetail" && (
        <BuildingDetail
          building={panel.building}
          focusedAgentId={panel.focusedAgentId}
          lastEvent={lastEvent}
          onClose={() => setPanel({ type: "none" })}
          onAgentBubbleClick={(agent) =>
            setPanel({ type: "quickResponse", agent })
          }
          onAgentSeen={markAgentSeen}
          onDeleted={() => {
            setPanel({ type: "none" });
            refetch();
          }}
        />
      )}

      {panel.type === "quickResponse" && (
        <QuickResponse
          agent={panel.agent}
          onClose={() => setPanel({ type: "none" })}
        />
      )}

      {panel.type === "trash" && (
        <TrashPanel
          onClose={() => setPanel({ type: "none" })}
          onRestored={() => {
            setPanel({ type: "none" });
            refetch();
            refreshTrashCount();
          }}
        />
      )}
    </div>
  );
}
