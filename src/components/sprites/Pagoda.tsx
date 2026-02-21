import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface PagodaProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function Pagoda({ agents, name }: PagodaProps) {
  const floors = agents.length;
  const baseHeight = 80;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Finial / spire */}
      <div
        style={{
          position: "absolute",
          top: "-24px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "4px",
          height: "10px",
          background: "#C9A84C",
          borderRadius: "2px 2px 0 0",
        }}
      />

      {/* Curved top roof tier */}
      <div
        style={{
          position: "absolute",
          top: "-14px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70px",
          height: "14px",
          background: "#8B1A1A",
          borderRadius: "0 0 8px 8px",
          border: "2px solid #6A1010",
          borderTop: "none",
        }}
      />

      {/* Paper lantern left */}
      <div
        style={{
          position: "absolute",
          top: "-6px",
          left: "16px",
          width: "8px",
          height: "10px",
          background: "#E85040",
          borderRadius: "50%",
          boxShadow: "0 0 6px 2px rgba(232,80,64,0.5)",
        }}
      />

      {/* Paper lantern right */}
      <div
        style={{
          position: "absolute",
          top: "-6px",
          right: "16px",
          width: "8px",
          height: "10px",
          background: "#E85040",
          borderRadius: "50%",
          boxShadow: "0 0 6px 2px rgba(232,80,64,0.5)",
        }}
      />

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#C41E1E",
          border: "2px solid #8B1A1A",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Gold decorative band at top */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            height: "3px",
            background: "#C9A84C",
          }}
        />

        {/* Sign */}
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#8B1A1A",
            padding: "3px 6px",
            border: "1px solid #C9A84C",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#C9A84C",
            whiteSpace: "nowrap",
          }}
        >
          {name || "PAGODA"}
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
                top: `${22 + f * floorHeight}px`,
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
            {/* Floor divider as mini roof overhang */}
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${20 + f * floorHeight}px`,
                  left: "-4px",
                  right: "-4px",
                  height: "4px",
                  background: "#8B1A1A",
                  borderRadius: "0 0 4px 4px",
                }}
              />
            )}
            {/* Windows */}
            <div
              style={{
                position: "absolute",
                top: `${24 + f * floorHeight}px`,
                left: "14px",
                right: "14px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={14} height={14} borderColor="#8B1A1A" />
              <FloorWindow state={agent.state} width={14} height={14} borderColor="#8B1A1A" />
            </div>
          </div>
        ))}

        {/* Arched entrance with gold border */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "26px",
            height: "28px",
            background: "#6A1010",
            border: "2px solid #C9A84C",
            borderRadius: "13px 13px 0 0",
            borderBottom: "none",
          }}
        />

        {/* Gold base trim */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "3px",
            background: "#C9A84C",
          }}
        />
      </div>

      {/* Base curved roof overhang */}
      <div
        style={{
          width: "130px",
          height: "6px",
          background: "#8B1A1A",
          borderRadius: "0 0 6px 6px",
          marginLeft: "-5px",
          marginTop: "-2px",
          border: "2px solid #6A1010",
          borderTop: "none",
        }}
      />
    </div>
  );
}
