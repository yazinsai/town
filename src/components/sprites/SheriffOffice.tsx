import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface SheriffOfficeProps {
  agents: { state: AgentState }[];
}

export default function SheriffOffice({ agents }: SheriffOfficeProps) {
  const floors = agents.length;
  const baseHeight = 80;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#B8956A",
          border: "2px solid #8B7340",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Plank lines */}
        {Array.from({ length: Math.floor(totalHeight / 14) }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${i * 14}px`,
              left: 0,
              right: 0,
              height: "1px",
              background: "rgba(0,0,0,0.1)",
            }}
          />
        ))}

        {/* Sign with star */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#8B7340",
            padding: "3px 6px",
            border: "1px solid #6B5530",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "5px",
            color: "#F4E4C1",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <span style={{ color: "#E8C55A", fontSize: "7px" }}>*</span>
          SHERIFF
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
                  background: "#8B7340",
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
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#8B7340" />
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#8B7340" />
            </div>
          </div>
        ))}

        {/* Door */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "24px",
            height: "26px",
            background: "#6B5530",
            border: "2px solid #4A3A20",
          }}
        />

        {/* Bars on one window (it's a jail!) */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            width: "16px",
            height: "14px",
            background: "#555",
            border: "2px solid #333",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 0,
                left: `${2 + i * 5}px`,
                width: "1px",
                height: "100%",
                background: "#888",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
