import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface BankProps {
  agents: { state: AgentState }[];
}

export default function Bank({ agents }: BankProps) {
  const floors = agents.length;
  const baseHeight = 90;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Pediment / triangle top */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "60px solid transparent",
          borderRight: "60px solid transparent",
          borderBottom: "20px solid #607060",
          margin: "0 auto",
        }}
      />

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#708070",
          border: "2px solid #4A5A4A",
          borderTop: "none",
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
            background: "#4A5A4A",
            padding: "3px 10px",
            border: "1px solid #3A4A3A",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "7px",
            color: "#D4C990",
            whiteSpace: "nowrap",
          }}
        >
          BANK
        </div>

        {/* Columns */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "8px",
            width: "8px",
            height: "100%",
            background: "#8A9A8A",
            border: "1px solid #4A5A4A",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "0",
            right: "8px",
            width: "8px",
            height: "100%",
            background: "#8A9A8A",
            border: "1px solid #4A5A4A",
          }}
        />

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
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${22 + f * floorHeight}px`,
                  left: "20px",
                  right: "20px",
                  height: "2px",
                  background: "#4A5A4A",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: `${24 + f * floorHeight}px`,
                left: "28px",
                right: "28px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={14} height={16} borderColor="#4A5A4A" />
              <FloorWindow state={agent.state} width={14} height={16} borderColor="#4A5A4A" />
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
            height: "28px",
            background: "#4A5A4A",
            border: "2px solid #3A4A3A",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "4px",
              width: "3px",
              height: "3px",
              background: "#D4C990",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
