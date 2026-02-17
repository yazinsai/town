import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface HotelProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function Hotel({ agents, name }: HotelProps) {
  const floors = agents.length;
  const baseHeight = 85;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#A0522D",
          border: "2px solid #6B3410",
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
            background: "#6B3410",
            padding: "3px 8px",
            border: "1px solid #4A2208",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#F5DEB3",
            whiteSpace: "nowrap",
          }}
        >
          {name || "HOTEL"}
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

        {/* Floor dividers + windows + balcony */}
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
                  background: "#6B3410",
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
              <FloorWindow state={agent.state} width={14} height={14} borderColor="#6B3410" />
              <FloorWindow state={agent.state} width={14} height={14} borderColor="#6B3410" />
              <FloorWindow state={agent.state} width={14} height={14} borderColor="#6B3410" />
            </div>
            {/* Balcony railing */}
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${18 + f * floorHeight}px`,
                  left: "-2px",
                  right: "-2px",
                  height: "4px",
                  borderBottom: "2px solid #8B6914",
                  borderLeft: "2px solid #8B6914",
                  borderRight: "2px solid #8B6914",
                }}
              />
            )}
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
            height: "28px",
            background: "#4A2208",
            border: "2px solid #2E1505",
          }}
        >
          {/* Door window */}
          <div
            style={{
              position: "absolute",
              top: "3px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "10px",
              height: "8px",
              background: "#6A5A3A",
              border: "1px solid #2E1505",
            }}
          />
        </div>
      </div>

      {/* Top balcony/veranda overhang */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "-4px",
          width: "128px",
          height: "6px",
          background: "#6B3410",
          border: "1px solid #4A2208",
        }}
      />
    </div>
  );
}
