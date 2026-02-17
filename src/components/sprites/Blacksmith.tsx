import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface BlacksmithProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function Blacksmith({ agents, name }: BlacksmithProps) {
  const floors = agents.length;
  const baseHeight = 75;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Chimney */}
      <div
        style={{
          position: "absolute",
          top: "-16px",
          right: "14px",
          width: "14px",
          height: "20px",
          background: "#555",
          border: "2px solid #333",
        }}
      >
        {/* Smoke wisps */}
        <div
          style={{
            position: "absolute",
            top: "-6px",
            left: "3px",
            width: "4px",
            height: "4px",
            background: "rgba(150,150,150,0.5)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "6px",
            width: "3px",
            height: "3px",
            background: "rgba(150,150,150,0.3)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#5A4030",
          border: "2px solid #3A2818",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Plank lines */}
        {Array.from({ length: Math.floor(totalHeight / 10) }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${i * 10}px`,
              left: 0,
              right: 0,
              height: "1px",
              background: "rgba(0,0,0,0.15)",
            }}
          />
        ))}

        {/* Sign */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#3A2818",
            padding: "3px 6px",
            border: "1px solid #2A1808",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "5px",
            color: "#E8A040",
            whiteSpace: "nowrap",
          }}
        >
          {name || "SMITH"}
        </div>

        {/* Floor overlays for completed/error */}
        {agents.map((agent, f) => {
          const overlayBg =
            agent.state === "completed" ? "rgba(0,0,0,0.25)" :
            agent.state === "error" ? "rgba(100,0,0,0.15)" : null;
          if (!overlayBg) return null;
          return (
            <div
              key={`ov-${f}`}
              style={{
                position: "absolute",
                top: `${20 + f * floorHeight}px`,
                left: 0,
                right: 0,
                height: `${floorHeight}px`,
                background: overlayBg,
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* Floor dividers + windows */}
        {agents.map((agent, f) => (
          <div key={f}>
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${20 + f * floorHeight}px`,
                  left: "4px",
                  right: "4px",
                  height: "2px",
                  background: "#3A2818",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: `${22 + f * floorHeight}px`,
                left: "10px",
                right: "10px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={18} height={14} borderColor="#3A2818" />
              <FloorWindow state={agent.state} width={18} height={14} borderColor="#3A2818" />
            </div>
          </div>
        ))}

        {/* Open forge area */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "10px",
            width: "36px",
            height: "24px",
            background: "#2A1808",
            border: "2px solid #1A0A00",
          }}
        >
          {/* Forge glow */}
          <div
            style={{
              position: "absolute",
              bottom: "2px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "16px",
              height: "8px",
              background: "#E85020",
              boxShadow: "0 0 6px 2px rgba(232,80,32,0.4)",
              borderRadius: "2px 2px 0 0",
            }}
          />
        </div>

        {/* Anvil */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            right: "20px",
            width: "16px",
            height: "10px",
            background: "#666",
            border: "1px solid #444",
            borderBottom: "none",
            borderRadius: "2px 6px 0 0",
          }}
        />
      </div>
    </div>
  );
}
