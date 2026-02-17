import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface MasjidProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function Masjid({ agents, name }: MasjidProps) {
  const floors = agents.length;
  const baseHeight = 80;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Dome */}
      <div
        style={{
          position: "absolute",
          top: "-14px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "40px",
          height: "20px",
          background: "#C9A84C",
          borderRadius: "20px 20px 0 0",
          border: "2px solid #A08030",
          borderBottom: "none",
        }}
      >
        {/* Crescent */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "8px",
            height: "8px",
            border: "2px solid #C9A84C",
            borderRadius: "50%",
            borderRight: "2px solid transparent",
            borderBottom: "2px solid transparent",
            rotate: "-45deg",
          }}
        />
      </div>

      {/* Minaret left */}
      <div
        style={{
          position: "absolute",
          top: "-18px",
          left: "6px",
          width: "10px",
          height: "22px",
          background: "#E8D8B0",
          border: "1px solid #A09070",
          borderBottom: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "6px",
            height: "4px",
            background: "#C9A84C",
            borderRadius: "3px 3px 0 0",
          }}
        />
      </div>

      {/* Minaret right */}
      <div
        style={{
          position: "absolute",
          top: "-18px",
          right: "6px",
          width: "10px",
          height: "22px",
          background: "#E8D8B0",
          border: "1px solid #A09070",
          borderBottom: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "6px",
            height: "4px",
            background: "#C9A84C",
            borderRadius: "3px 3px 0 0",
          }}
        />
      </div>

      {/* Main building */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#E8D8B0",
          border: "2px solid #A09070",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Sign */}
        <div
          style={{
            position: "absolute",
            top: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#A09070",
            padding: "3px 6px",
            border: "1px solid #807060",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "6px",
            color: "#3C3020",
            whiteSpace: "nowrap",
          }}
        >
          {name || "MASJID"}
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
            {f > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: `${22 + f * floorHeight}px`,
                  left: "4px",
                  right: "4px",
                  height: "2px",
                  background: "#A09070",
                }}
              />
            )}
            {/* Arched windows */}
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
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#A09070" />
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#A09070" />
            </div>
          </div>
        ))}

        {/* Large arched doorway */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "28px",
            height: "30px",
            background: "#8A7A5A",
            border: "2px solid #6A5A3A",
            borderRadius: "14px 14px 0 0",
          }}
        />

        {/* Decorative arch band */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "20px",
            right: "20px",
            height: "4px",
            background:
              "repeating-linear-gradient(to right, #C9A84C 0px, #C9A84C 6px, transparent 6px, transparent 10px)",
          }}
        />
      </div>
    </div>
  );
}
