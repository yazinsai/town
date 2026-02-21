import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface ClockTowerProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function ClockTower({ agents, name }: ClockTowerProps) {
  const floors = agents.length;
  const baseHeight = 95;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Bell housing with pointed roof */}
      <div
        style={{
          position: "absolute",
          top: "-22px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {/* Pointed roof (triangle) */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderBottom: "12px solid #4A2208",
            margin: "0 auto",
          }}
        />
        {/* Bell housing body */}
        <div
          style={{
            width: "32px",
            height: "10px",
            background: "#7A3B10",
            border: "1px solid #4A2208",
            borderTop: "none",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Golden bell */}
          <div
            style={{
              width: "8px",
              height: "7px",
              background: "#C9A84C",
              borderRadius: "0 0 4px 4px",
              border: "1px solid #A08030",
              borderTop: "none",
            }}
          />
        </div>
      </div>

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#B5651D",
          border: "2px solid #7A3B10",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Brick pattern (horizontal lines) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 6px, rgba(74,34,8,0.2) 6px, rgba(74,34,8,0.2) 8px)",
            pointerEvents: "none",
          }}
        />

        {/* Clock face */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "24px",
            height: "24px",
            background: "#F4E4C1",
            border: "3px solid #4A2208",
            borderRadius: "50%",
          }}
        >
          {/* Hour hand */}
          <div
            style={{
              position: "absolute",
              bottom: "50%",
              left: "50%",
              width: "2px",
              height: "8px",
              background: "#4A2208",
              transformOrigin: "bottom center",
              transform: "translateX(-50%) rotate(-30deg)",
            }}
          />
          {/* Minute hand */}
          <div
            style={{
              position: "absolute",
              bottom: "50%",
              left: "50%",
              width: "1px",
              height: "10px",
              background: "#4A2208",
              transformOrigin: "bottom center",
              transform: "translateX(-50%) rotate(60deg)",
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "3px",
              height: "3px",
              background: "#4A2208",
              borderRadius: "50%",
            }}
          />
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
                top: `${34 + f * floorHeight}px`,
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
                  top: `${34 + f * floorHeight}px`,
                  left: "4px",
                  right: "4px",
                  height: "2px",
                  background: "#7A3B10",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: `${36 + f * floorHeight}px`,
                left: "14px",
                right: "14px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#7A3B10" />
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#7A3B10" />
            </div>
          </div>
        ))}

        {/* Arched door */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "24px",
            height: "28px",
            background: "#4A2208",
            border: "2px solid #2E1505",
            borderRadius: "12px 12px 0 0",
          }}
        >
          {/* Door handle */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "4px",
              width: "3px",
              height: "3px",
              background: "#C9A84C",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* Stone base ledge (wider than building) */}
      <div
        style={{
          width: "130px",
          height: "6px",
          background: "#8A7A6A",
          border: "1px solid #6A5A4A",
          marginLeft: "-5px",
        }}
      />
    </div>
  );
}
