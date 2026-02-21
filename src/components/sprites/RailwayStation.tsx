import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface RailwayStationProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function RailwayStation({ agents, name }: RailwayStationProps) {
  const floors = agents.length;
  const baseHeight = 78;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Steam whistle on roof */}
      <div
        style={{
          position: "absolute",
          top: "-28px",
          left: "54px",
          width: "6px",
          height: "10px",
          background: "#5A5A5A",
          border: "1px solid #3A3A3A",
          zIndex: 2,
        }}
      >
        {/* Smoke puff */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "-3px",
            width: "10px",
            height: "8px",
            background: "rgba(200,200,200,0.5)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-12px",
            left: "-1px",
            width: "7px",
            height: "6px",
            background: "rgba(200,200,200,0.3)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Pitched roof (triangle) */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "60px solid transparent",
          borderRight: "60px solid transparent",
          borderBottom: "20px solid #7B4A2A",
          margin: "0 auto",
        }}
      />

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#7B4A2A",
          border: "2px solid #4A2A14",
          borderTop: "none",
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
            background: "#4A2A14",
            padding: "3px 6px",
            border: "1px solid #3A1A0A",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "5px",
            color: "#F4E4C1",
            whiteSpace: "nowrap",
          }}
        >
          {name || "STATION"}
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
            {/* Floor divider line */}
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${22 + f * floorHeight}px`,
                  left: "4px",
                  right: "4px",
                  height: "2px",
                  background: "#4A2A14",
                }}
              />
            )}
            {/* Windows */}
            <div
              style={{
                position: "absolute",
                top: `${22 + f * floorHeight + (f > 0 ? 2 : 0)}px`,
                left: "10px",
                right: "10px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#4A2A14" />
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#4A2A14" />
            </div>
          </div>
        ))}

        {/* Ticket window */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "22px",
            height: "16px",
            background: "#2A1A0A",
            border: "2px solid #4A2A14",
          }}
        >
          {/* Glass pane (lighter inner rectangle) */}
          <div
            style={{
              position: "absolute",
              top: "2px",
              left: "2px",
              right: "2px",
              bottom: "2px",
              background: "rgba(140,180,200,0.3)",
              border: "1px solid #4A2A14",
            }}
          />
        </div>

        {/* Door */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "24px",
            height: "22px",
            background: "#5A3218",
            border: "2px solid #3A1A0A",
          }}
        >
          {/* Door handle */}
          <div
            style={{
              position: "absolute",
              top: "9px",
              right: "4px",
              width: "3px",
              height: "3px",
              background: "#F4E4C1",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* Platform awning (wider bar underneath building) */}
      <div
        style={{
          width: "134px",
          height: "6px",
          background: "#5A3218",
          border: "2px solid #3A1A0A",
          marginLeft: "-7px",
        }}
      />

      {/* Railroad tracks */}
      <div
        style={{
          width: "134px",
          height: "12px",
          marginLeft: "-7px",
          position: "relative",
        }}
      >
        {/* Left rail */}
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: "0",
            width: "100%",
            height: "2px",
            background: "#6A6A6A",
          }}
        />
        {/* Right rail */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "0",
            width: "100%",
            height: "2px",
            background: "#6A6A6A",
          }}
        />
        {/* Ties (vertical wooden crossbars) */}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={`tie-${i}`}
            style={{
              position: "absolute",
              top: "0",
              left: `${6 + i * 15}px`,
              width: "6px",
              height: "12px",
              background: "#5A3A1A",
              border: "1px solid #3A2A0A",
            }}
          />
        ))}
      </div>
    </div>
  );
}
