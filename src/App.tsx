import { useState, useEffect } from "react";
import type { Building, Agent } from "@shared/types";
import { login, checkAuth, getBuilding } from "./lib/api";
import { useWebSocket } from "./hooks/useWebSocket";
import { useBuildings } from "./hooks/useBuildings";
import TownScene from "./components/town/TownScene";
import NewBuilding from "./components/panels/NewBuilding";
import BuildingDetail from "./components/panels/BuildingDetail";
import QuickResponse from "./components/panels/QuickResponse";
import PixelButton from "./components/ui/PixelButton";
import PixelInput from "./components/ui/PixelInput";
import PixelText from "./components/ui/PixelText";


type Panel =
  | { type: "none" }
  | { type: "newBuilding" }
  | { type: "buildingDetail"; building: Building }
  | { type: "quickResponse"; agent: Agent };

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

  // Check if already authenticated via cookie on mount
  useEffect(() => {
    checkAuth().then((ok) => {
      setAuthed(ok);
      setChecking(false);
    });
  }, []);
  const { lastEvent, connected } = useWebSocket(authed);
  const { buildings, refetch } = useBuildings(lastEvent);
  const [panel, setPanel] = useState<Panel>({ type: "none" });
  const [agentsByBuilding, setAgentsByBuilding] = useState<Record<string, Agent[]>>({});

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
        onBuildClick={(building) =>
          setPanel({ type: "buildingDetail", building })
        }
        onBubbleClick={(agent) => setPanel({ type: "quickResponse", agent })}
        onNewBuilding={() => setPanel({ type: "newBuilding" })}
        connected={connected}
      />

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
          lastEvent={lastEvent}
          onClose={() => setPanel({ type: "none" })}
          onAgentBubbleClick={(agent) =>
            setPanel({ type: "quickResponse", agent })
          }
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
    </div>
  );
}
