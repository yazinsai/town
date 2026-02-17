import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface GeneralStoreProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function GeneralStore({ agents, name }: GeneralStoreProps) {
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
          background: "#6B7B5A",
          border: "2px solid #4A5A3A",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Sign */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#4A5A3A",
            padding: "3px 6px",
            border: "1px solid #3A4A2A",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#E8D5B7",
            whiteSpace: "nowrap",
          }}
        >
          {name || "STORE"}
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
                  background: "#4A5A3A",
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
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <FloorWindow state={agent.state} width={22} height={14} borderColor="#4A5A3A" />
              <FloorWindow state={agent.state} width={22} height={14} borderColor="#4A5A3A" />
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
            width: "22px",
            height: "26px",
            background: "#3A4A2A",
            border: "2px solid #2A3A1A",
          }}
        />
      </div>

      {/* Awning */}
      <div
        style={{
          position: "absolute",
          top: `${totalHeight - 32}px`,
          left: "-4px",
          width: "128px",
          height: "8px",
          background:
            "repeating-linear-gradient(to right, #8B3A1A 0px, #8B3A1A 8px, #CD853F 8px, #CD853F 16px)",
          border: "1px solid #5C2510",
        }}
      />
    </div>
  );
}
