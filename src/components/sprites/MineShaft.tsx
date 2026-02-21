import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface MineShaftProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function MineShaft({ agents, name }: MineShaftProps) {
  const floors = agents.length;
  const baseHeight = 76;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Timber A-frame top */}
      <div
        style={{
          position: "relative",
          width: "120px",
          height: "24px",
        }}
      >
        {/* Triangle */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "60px solid transparent",
            borderRight: "60px solid transparent",
            borderBottom: "24px solid #4A3828",
            margin: "0 auto",
          }}
        />
        {/* Crossbeam */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "10px",
            right: "10px",
            height: "4px",
            background: "#5C4432",
            border: "1px solid #2E2018",
          }}
        />
      </div>

      {/* Hanging lantern */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      >
        {/* Wire */}
        <div
          style={{
            width: "1px",
            height: "10px",
            background: "#666",
            margin: "0 auto",
          }}
        />
        {/* Lantern body */}
        <div
          style={{
            width: "6px",
            height: "8px",
            background: "#E8A040",
            margin: "0 auto",
            boxShadow: "0 0 8px 3px rgba(232,160,64,0.4)",
          }}
        />
      </div>

      {/* Main building body */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#4A3828",
          border: "2px solid #2E2018",
          borderTop: "none",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Plank lines - wider 14px spacing for rough-hewn look */}
        {Array.from({ length: Math.floor(totalHeight / 14) }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${i * 14}px`,
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
            background: "#2E2018",
            padding: "3px 6px",
            border: "1px solid #1A1008",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "5px",
            color: "#E8A040",
            whiteSpace: "nowrap",
          }}
        >
          {name || "MINE"}
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
                top: `${24 + f * floorHeight}px`,
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
                  top: `${24 + f * floorHeight}px`,
                  left: "4px",
                  right: "4px",
                  height: "2px",
                  background: "#2E2018",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: `${24 + f * floorHeight}px`,
                left: "10px",
                right: "10px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#2E2018" />
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#2E2018" />
            </div>
          </div>
        ))}

        {/* Dark mine entrance at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "34px",
            height: "28px",
            background: "#0A0806",
            borderRadius: "8px 8px 0 0",
            border: "2px solid #1A1008",
            borderBottom: "none",
          }}
        />
      </div>

      {/* Ore cart detail - positioned outside bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          right: "-4px",
        }}
      >
        {/* Rails */}
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            left: "-4px",
            width: "28px",
            height: "2px",
            background: "#666",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            left: "-4px",
            width: "28px",
            height: "0",
            borderBottom: "1px solid #888",
          }}
        />
        {/* Cart body - trapezoid via border trick */}
        <div
          style={{
            position: "absolute",
            bottom: "6px",
            left: "2px",
            width: "12px",
            height: "8px",
            background: "#5C4432",
            border: "1px solid #3A2818",
            borderBottom: "2px solid #3A2818",
          }}
        />
        {/* Ore pile on top of cart */}
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "4px",
            width: "8px",
            height: "4px",
            background: "#8A7A5A",
            borderRadius: "3px 3px 0 0",
          }}
        />
        {/* Left wheel */}
        <div
          style={{
            position: "absolute",
            bottom: "3px",
            left: "2px",
            width: "5px",
            height: "5px",
            background: "#444",
            borderRadius: "50%",
            border: "1px solid #333",
          }}
        />
        {/* Right wheel */}
        <div
          style={{
            position: "absolute",
            bottom: "3px",
            left: "12px",
            width: "5px",
            height: "5px",
            background: "#444",
            borderRadius: "50%",
            border: "1px solid #333",
          }}
        />
      </div>
    </div>
  );
}
