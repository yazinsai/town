import { useState, useEffect, useRef } from "react";
import type { Building, Agent, WSEvent } from "@shared/types";
import { getBuilding, spawnAgent, killAgent, deleteBuilding, respondToAgent, mergeAgent, discardAgent, revertAgent } from "../../lib/api";
import { useAgent } from "../../hooks/useAgent";
import { useImageAttachments } from "../../hooks/useImageAttachments";
import { ImageThumbnails, AttachButton, HiddenFileInput } from "../ui/ImageAttachments";
import ConversationLog from "./ConversationLog";
import PixelButton from "../ui/PixelButton";
import PixelInput from "../ui/PixelInput";
import PixelText from "../ui/PixelText";

interface BuildingDetailProps {
  building: Building;
  focusedAgentId?: string;
  lastEvent: WSEvent | null;
  onClose: () => void;
  onAgentBubbleClick: (agent: Agent) => void;
  onAgentSeen: (agentId: string) => void;
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
  initialExpanded = false,
  lastEvent,
  onBubbleClick,
  onAgentSeen,
}: {
  agent: Agent;
  initialExpanded?: boolean;
  lastEvent: WSEvent | null;
  onBubbleClick: (agent: Agent) => void;
  onAgentSeen: (agentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { agent: liveAgent, conversation } = useAgent(
    expanded ? agent.id : null,
    lastEvent
  );
  const displayAgent = liveAgent || agent;
  const stateInfo = stateLabels[displayAgent.state] || stateLabels.idle;
  const style = floorStyles[displayAgent.state] || defaultFloorStyle;
  const isFinished = displayAgent.state === "completed" || displayAgent.state === "error";

  const {
    images, fileInputRef,
    removeImage, clearImages, openFilePicker, bindPaste,
    handleFileInputChange,
  } = useImageAttachments();

  useEffect(() => {
    return bindPaste(inputRef.current);
  }, [bindPaste, expanded]);

  async function handleSendMessage() {
    if (!msg.trim() || sending) return;
    setSending(true);
    try {
      await respondToAgent(agent.id, {
        type: "message",
        message: msg,
        images: images.length > 0 ? images : undefined,
      });
      setMsg("");
      clearImages();
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
      <div
        className={
          displayAgent.state === "waiting_input" || displayAgent.state === "waiting_permission"
            ? "animate-accent-pulse"
            : undefined
        }
        style={{ width: "4px", background: style.accent, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            if (next && displayAgent.state === "completed") onAgentSeen(agent.id);
          }}
          style={{ padding: "8px", cursor: "pointer" }}
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
                    width: "8px", height: "8px", background: stateInfo.color, flexShrink: 0,
                    boxShadow: displayAgent.state === "busy" ? `0 0 6px ${stateInfo.color}` : "none",
                  }}
                />
              )}
              <PixelText variant="small" color={stateInfo.color}>{stateInfo.label}</PixelText>
            </div>
            <PixelText variant="small" color="#5C3317">{expanded ? "v" : ">"}</PixelText>
          </div>
          <PixelText
            variant="small"
            color={style.textColor}
            style={{
              lineHeight: "12px",
              ...(isFinished && { textDecoration: "line-through", textDecorationColor: style.accent }),
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
            }}
          >
            {displayAgent.initialPrompt}
          </PixelText>
        </div>

        {expanded && (
          <div style={{ borderTop: `1px solid ${style.border}` }}>
            <ConversationLog
              entries={[
                {
                  timestamp: displayAgent.createdAt || new Date().toISOString(),
                  role: "user" as const,
                  content: displayAgent.initialPrompt,
                },
                ...conversation,
              ]}
              agentId={agent.id}
              isWaitingInput={displayAgent.state === "waiting_input"}
            />

            {/* Message input */}
            <div style={{ padding: "8px", borderTop: `1px solid ${style.border}` }}>
              {images.length > 0 && (
                <ImageThumbnails images={images} onRemove={removeImage} />
              )}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <PixelInput
                    ref={inputRef}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Send feedback..."
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    style={{ paddingRight: "28px" }}
                  />
                  <div style={{ position: "absolute", right: "2px", top: "50%", transform: "translateY(-50%)" }}>
                    <AttachButton onClick={openFilePicker} hasImages={images.length > 0} />
                  </div>
                </div>
                <PixelButton onClick={handleSendMessage} disabled={sending}>
                  {sending ? "..." : "SEND"}
                </PixelButton>
              </div>
              <HiddenFileInput inputRef={fileInputRef} onChange={handleFileInputChange} />
            </div>

            {/* Actions */}
            <div style={{ padding: "0 8px 8px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              {(displayAgent.state === "waiting_input" || displayAgent.state === "waiting_permission") && (
                <PixelButton onClick={() => onBubbleClick(displayAgent)}>RESPOND</PixelButton>
              )}
              {!isFinished && (
                <PixelButton variant="danger" onClick={async () => { await killAgent(agent.id); }}>KILL</PixelButton>
              )}

              {/* Worktree merge/discard actions */}
              {displayAgent.mergeStatus === "pending" && isFinished && (
                <>
                  <PixelButton onClick={async () => {
                    try { await mergeAgent(agent.id); } catch (err: any) { alert(`Merge failed: ${err.message}`); }
                  }}>MERGE</PixelButton>
                  <PixelButton variant="danger" onClick={async () => {
                    if (!window.confirm("Discard this agent's changes? This cannot be undone.")) return;
                    try { await discardAgent(agent.id); } catch (err: any) { alert(`Discard failed: ${err.message}`); }
                  }}>DISCARD</PixelButton>
                </>
              )}
              {displayAgent.mergeStatus === "merged" && (
                <PixelButton variant="danger" onClick={async () => {
                  if (!window.confirm("Undo this merge? The agent's changes will be reverted.")) return;
                  try { await revertAgent(agent.id); } catch (err: any) { alert(`Revert failed: ${err.message}`); }
                }}>UNDO MERGE</PixelButton>
              )}

              {/* Merge status indicator */}
              {displayAgent.mergeStatus && (
                <PixelText variant="small" color={
                  displayAgent.mergeStatus === "merged" ? "#4CAF50" :
                  displayAgent.mergeStatus === "reverted" ? "#FF9800" :
                  displayAgent.mergeStatus === "discarded" ? "#9E9E9E" :
                  "#D2B48C"
                }>
                  {displayAgent.mergeStatus === "merged" ? "MERGED" :
                   displayAgent.mergeStatus === "reverted" ? "REVERTED" :
                   displayAgent.mergeStatus === "discarded" ? "DISCARDED" :
                   "UNMERGED"}
                </PixelText>
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
  focusedAgentId,
  lastEvent,
  onClose,
  onAgentBubbleClick,
  onAgentSeen,
  onDeleted,
}: BuildingDetailProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [spawning, setSpawning] = useState(false);
  const [showSpawnInput, setShowSpawnInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const spawnInputRef = useRef<HTMLInputElement>(null);

  const {
    images: spawnImages, fileInputRef: spawnFileRef,
    removeImage: spawnRemoveImage, clearImages: spawnClearImages,
    openFilePicker: spawnOpenPicker, bindPaste: spawnBindPaste,
    handleFileInputChange: spawnHandleFileChange,
  } = useImageAttachments();

  useEffect(() => {
    return spawnBindPaste(spawnInputRef.current);
  }, [spawnBindPaste]);

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

  useEffect(() => { fetchDetail(); }, [building.id]);

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "agent:state" ||
      lastEvent.type === "agent:completed" ||
      lastEvent.type === "agent:error" ||
      lastEvent.type === "agent:merged" ||
      lastEvent.type === "agent:merge-failed" ||
      lastEvent.type === "agent:discarded" ||
      lastEvent.type === "agent:reverted"
    ) {
      fetchDetail();
    }
  }, [lastEvent]);

  async function handleSpawn() {
    if (!newPrompt.trim()) return;
    setSpawning(true);
    try {
      await spawnAgent(building.id, {
        initialPrompt: newPrompt,
        images: spawnImages.length > 0 ? spawnImages : undefined,
      });
      setNewPrompt("");
      spawnClearImages();
      setShowSpawnInput(false);
      fetchDetail();
    } catch (err) {
      console.error("Failed to spawn agent:", err);
    } finally {
      setSpawning(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Demolish "${building.name}"? This will kill all agents and delete the building.`)) return;
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
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#2C1810", border: "3px solid #8B4513", borderBottom: "none",
        padding: "16px", zIndex: 100, maxHeight: "85vh", overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <PixelText variant="h2">{building.name.toUpperCase()}</PixelText>
        <PixelButton variant="ghost" onClick={onClose}>X</PixelButton>
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
          <PixelText variant="small" color="#5C3317">Loading...</PixelText>
        ) : agents.length === 0 ? (
          <PixelText variant="small" color="#5C3317">No agents yet</PixelText>
        ) : (
          agents.map((agent) => (
            <AgentFloor
              key={agent.id}
              agent={agent}
              initialExpanded={agent.id === focusedAgentId}
              lastEvent={lastEvent}
              onBubbleClick={onAgentBubbleClick}
              onAgentSeen={onAgentSeen}
            />
          ))
        )}
      </div>

      {/* Add new floor */}
      {showSpawnInput && (
        <div style={{ marginBottom: "12px" }}>
          {spawnImages.length > 0 && (
            <ImageThumbnails images={spawnImages} onRemove={spawnRemoveImage} />
          )}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <PixelInput
                ref={spawnInputRef}
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="New agent task..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSpawn();
                  if (e.key === "Escape") { setShowSpawnInput(false); setNewPrompt(""); spawnClearImages(); }
                }}
                style={{ paddingRight: "28px" }}
              />
              <div style={{ position: "absolute", right: "2px", top: "50%", transform: "translateY(-50%)" }}>
                <AttachButton onClick={spawnOpenPicker} hasImages={spawnImages.length > 0} />
              </div>
            </div>
            <PixelButton onClick={handleSpawn} disabled={spawning}>
              {spawning ? "..." : "+ FLOOR"}
            </PixelButton>
            <PixelButton variant="ghost" onClick={() => { setShowSpawnInput(false); setNewPrompt(""); spawnClearImages(); }}>
              X
            </PixelButton>
          </div>
          <HiddenFileInput inputRef={spawnFileRef} onChange={spawnHandleFileChange} />
        </div>
      )}

      <div style={{ display: "flex", gap: "6px" }}>
        {!showSpawnInput && (
          <PixelButton onClick={() => { setShowSpawnInput(true); setTimeout(() => spawnInputRef.current?.focus(), 0); }}>
            + FLOOR
          </PixelButton>
        )}
        <PixelButton variant="danger" onClick={handleDelete}>DEMOLISH</PixelButton>
      </div>
    </div>
  );
}
