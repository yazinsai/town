import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface PostOfficeProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function PostOffice({ agents, name }: PostOfficeProps) {
  const floors = agents.length;
  const baseHeight = 80;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Flag pole */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          left: "16px",
          width: "2px",
          height: "24px",
          background: "#8B7340",
        }}
      >
        {/* Flag */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "2px",
            width: "12px",
            height: "8px",
            background: "#B33030",
            border: "1px solid #8B1818",
          }}
        />
      </div>

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#C4A67A",
          border: "2px solid #9A7A50",
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
            background: "#9A7A50",
            padding: "3px 6px",
            border: "1px solid #7A5A30",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "5px",
            color: "#F4E4C1",
            whiteSpace: "nowrap",
          }}
        >
          {name || "POST"}
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
                  background: "#9A7A50",
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
              <FloorWindow state={agent.state} width={20} height={14} borderColor="#9A7A50" />
              <FloorWindow state={agent.state} width={20} height={14} borderColor="#9A7A50" />
            </div>
          </div>
        ))}

        {/* Mail slot / service window */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "30px",
            height: "4px",
            background: "#7A5A30",
            border: "1px solid #5A3A10",
          }}
        />

        {/* Door */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "24px",
            height: "26px",
            background: "#7A5A30",
            border: "2px solid #5A3A10",
          }}
        >
          {/* Door handle */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "4px",
              width: "3px",
              height: "3px",
              background: "#D4C990",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* Cornice / decorative top trim */}
      <div
        style={{
          position: "absolute",
          top: "-4px",
          left: "-2px",
          width: "124px",
          height: "6px",
          background: "#9A7A50",
          border: "1px solid #7A5A30",
        }}
      />
    </div>
  );
}
