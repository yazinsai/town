import { useState, useEffect } from "react";
import type { Building, Agent, WSEvent } from "@shared/types";
import { getBuilding, spawnAgent, killAgent, deleteBuilding, respondToAgent } from "../../lib/api";
import { useAgent } from "../../hooks/useAgent";
import ConversationLog from "./ConversationLog";
import PixelButton from "../ui/PixelButton";
import PixelInput from "../ui/PixelInput";
import PixelText from "../ui/PixelText";

interface BuildingDetailProps {
  building: Building;
  lastEvent: WSEvent | null;
  onClose: () => void;
  onAgentBubbleClick: (agent: Agent) => void;
  onDeleted: () => void;
}

const stateLabels: Record<string, { label: string; color: string }> = {
  busy: { label: "WORKING", color: "#4CAF50" },
  idle: { label: "IDLE", color: "#9E9E9E" },
  waiting_input: { label: "WAITING", color: "#FF9800" },
  waiting_permission: { label: "PERMIT?", color: "#F44336" },
  completed: { label: "COMPLETE", color: "#6A8A6A" },
  error: { label: "FAILED", color: "#F44336" },
};

const floorStyles: Record<string, { accent: string; border: string; bg: string; textColor: string; dim?: boolean }> = {
  busy: { accent: "#4CAF50", border: "#3A5C2A", bg: "rgba(76,175,80,0.06)", textColor: "#C0A878" },
  idle: { accent: "#9E9E9E", border: "#5C3317", bg: "rgba(92,51,23,0.15)", textColor: "#A0826A" },
  waiting_input: { accent: "#FF9800", border: "#8B6B14", bg: "rgba(255,152,0,0.06)", textColor: "#C0A878" },
  waiting_permission: { accent: "#F44336", border: "#8B2020", bg: "rgba(244,67,54,0.06)", textColor: "#C0A878" },
  completed: { accent: "#5A6A50", border: "#3A3530", bg: "rgba(30,28,25,0.4)", textColor: "#6A6050", dim: true },
  error: { accent: "#B33", border: "#5A1515", bg: "rgba(80,15,15,0.12)", textColor: "#9A6A5A" },
};

const defaultFloorStyle = floorStyles.idle;

function AgentFloor({
  agent,
  lastEvent,
  onBubbleClick,
}: {
  agent: Agent;
  lastEvent: WSEvent | null;
  onBubbleClick: (agent: Agent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const { agent: liveAgent, conversation } = useAgent(
    expanded ? agent.id : null,
    lastEvent
  );
  const displayAgent = liveAgent || agent;
  const stateInfo = stateLabels[displayAgent.state] || stateLabels.idle;
  const style = floorStyles[displayAgent.state] || defaultFloorStyle;
  const isFinished = displayAgent.state === "completed" || displayAgent.state === "error";

  async function handleSendMessage() {
    if (!msg.trim() || sending) return;
    setSending(true);
    try {
      await respondToAgent(agent.id, { type: "message", message: msg });
      setMsg("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        border: `2px solid ${style.border}`,
        background: style.bg,
        marginBottom: "8px",
        opacity: style.dim ? 0.65 : 1,
        transition: "opacity 0.3s",
      }}
    >
      {/* Left accent bar */}
      <div
        className={
          displayAgent.state === "waiting_input" || displayAgent.state === "waiting_permission"
            ? "animate-accent-pulse"
            : undefined
        }
        style={{
          width: "4px",
          background: style.accent,
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: "8px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isFinished ? (
                <PixelText variant="small" color={stateInfo.color} style={{ opacity: 0.7 }}>
                  {displayAgent.state === "completed" ? "[OK]" : "[!!]"}
                </PixelText>
              ) : (
                <div
                  className={displayAgent.state === "busy" ? "animate-bob" : undefined}
                  style={{
                    width: "8px",
                    height: "8px",
                    background: stateInfo.color,
                    flexShrink: 0,
                    boxShadow: displayAgent.state === "busy"
                      ? `0 0 6px ${stateInfo.color}`
                      : "none",
                  }}
                />
              )}
              <PixelText variant="small" color={stateInfo.color}>
                {stateInfo.label}
              </PixelText>
            </div>
            <PixelText variant="small" color="#5C3317">
              {expanded ? "v" : ">"}
            </PixelText>
          </div>
          <PixelText
            variant="small"
            color={style.textColor}
            style={{
              lineHeight: "12px",
              ...(isFinished && { textDecoration: "line-through", textDecorationColor: style.accent }),
              ...(!expanded && {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }),
            }}
          >
            {displayAgent.currentTask || displayAgent.initialPrompt}
          </PixelText>
        </div>

        {expanded && (
          <div style={{ borderTop: `1px solid ${style.border}` }}>
            <ConversationLog entries={conversation} />

            {/* Message input */}
            <div
              style={{
                padding: "8px",
                display: "flex",
                gap: "6px",
                borderTop: `1px solid ${style.border}`,
              }}
            >
              <PixelInput
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Send feedback..."
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                style={{ flex: 1 }}
              />
              <PixelButton onClick={handleSendMessage} disabled={sending}>
                {sending ? "..." : "SEND"}
              </PixelButton>
            </div>

            {/* Actions */}
            <div
              style={{
                padding: "0 8px 8px",
                display: "flex",
                gap: "6px",
              }}
            >
              {(displayAgent.state === "waiting_input" ||
                displayAgent.state === "waiting_permission") && (
                <PixelButton onClick={() => onBubbleClick(displayAgent)}>
                  RESPOND
                </PixelButton>
              )}
              {!isFinished && (
                <PixelButton
                  variant="danger"
                  onClick={async () => {
                    await killAgent(agent.id);
                  }}
                >
                  KILL
                </PixelButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuildingDetail({
  building,
  lastEvent,
  onClose,
  onAgentBubbleClick,
  onDeleted,
}: BuildingDetailProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [spawning, setSpawning] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchDetail() {
    try {
      const data = await getBuilding(building.id);
      setAgents(data.agentDetails || []);
    } catch (err) {
      console.error("Failed to fetch building:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
  }, [building.id]);

  // Re-fetch on relevant events
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "agent:state" ||
      lastEvent.type === "agent:completed" ||
      lastEvent.type === "agent:error"
    ) {
      fetchDetail();
    }
  }, [lastEvent]);

  async function handleSpawn() {
    if (!newPrompt.trim()) return;
    setSpawning(true);
    try {
      await spawnAgent(building.id, { initialPrompt: newPrompt });
      setNewPrompt("");
      fetchDetail();
    } catch (err) {
      console.error("Failed to spawn agent:", err);
    } finally {
      setSpawning(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteBuilding(building.id);
      onDeleted();
    } catch (err) {
      console.error("Failed to delete building:", err);
    }
  }

  return (
    <div
      className="animate-slide-up"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#2C1810",
        border: "3px solid #8B4513",
        borderBottom: "none",
        padding: "16px",
        zIndex: 100,
        maxHeight: "85vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <PixelText variant="h2">{building.name.toUpperCase()}</PixelText>
        <PixelButton variant="ghost" onClick={onClose}>
          X
        </PixelButton>
      </div>

      <PixelText variant="small" color="#A0826A" style={{ marginBottom: "16px" }}>
        {building.projectPath}
      </PixelText>

      {/* Agent floors */}
      <div style={{ marginBottom: "12px" }}>
        <PixelText variant="body" color="#D2B48C" style={{ marginBottom: "8px" }}>
          FLOORS ({agents.length})
        </PixelText>

        {loading ? (
          <PixelText variant="small" color="#5C3317">
            Loading...
          </PixelText>
        ) : agents.length === 0 ? (
          <PixelText variant="small" color="#5C3317">
            No agents yet
          </PixelText>
        ) : (
          agents.map((agent) => (
            <AgentFloor
              key={agent.id}
              agent={agent}
              lastEvent={lastEvent}
              onBubbleClick={onAgentBubbleClick}
            />
          ))
        )}
      </div>

      {/* Add new floor */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <PixelInput
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          placeholder="New agent task..."
          onKeyDown={(e) => e.key === "Enter" && handleSpawn()}
          style={{ flex: 1 }}
        />
        <PixelButton onClick={handleSpawn} disabled={spawning}>
          {spawning ? "..." : "+ FLOOR"}
        </PixelButton>
      </div>

      {/* Delete building */}
      <PixelButton variant="danger" onClick={handleDelete}>
        DEMOLISH
      </PixelButton>
    </div>
  );
}
