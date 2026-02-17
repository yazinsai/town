import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface SaloonProps {
  agents: { state: AgentState }[];
}

export default function Saloon({ agents }: SaloonProps) {
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
          background: "#8B3A1A",
          border: "2px solid #5C2510",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Horizontal plank lines */}
        {Array.from({ length: Math.floor(totalHeight / 12) }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${i * 12}px`,
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
            background: "#5C2510",
            padding: "3px 6px",
            border: "1px solid #3E1809",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#F4E4C1",
            whiteSpace: "nowrap",
          }}
        >
          SALOON
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
            {/* Floor divider line */}
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${20 + f * floorHeight}px`,
                  left: "4px",
                  right: "4px",
                  height: "2px",
                  background: "#5C2510",
                }}
              />
            )}
            {/* Windows */}
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
              <FloorWindow state={agent.state} width={16} height={16} borderColor="#5C2510" />
              <FloorWindow state={agent.state} width={16} height={16} borderColor="#5C2510" />
            </div>
          </div>
        ))}

        {/* Swinging doors */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "30px",
            height: "20px",
            display: "flex",
            gap: "2px",
          }}
        >
          <div style={{ flex: 1, background: "#6B2A12", border: "1px solid #3E1809" }} />
          <div style={{ flex: 1, background: "#6B2A12", border: "1px solid #3E1809" }} />
        </div>
      </div>

      {/* Porch overhang */}
      <div
        style={{
          width: "130px",
          height: "6px",
          background: "#6B2A12",
          border: "2px solid #3E1809",
          marginLeft: "-5px",
          marginTop: "-2px",
        }}
      />
    </div>
  );
}
