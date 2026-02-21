import type { AgentState } from "@shared/types";
import FloorWindow from "./FloorWindow";

interface ObservatoryProps {
  agents: { state: AgentState }[];
  name?: string;
}

export default function Observatory({ agents, name }: ObservatoryProps) {
  const floors = agents.length;
  const baseHeight = 82;
  const floorHeight = 24;
  const totalHeight = baseHeight + Math.max(0, floors - 1) * floorHeight;

  return (
    <div style={{ width: "120px", position: "relative" }}>
      {/* Telescope poking out of dome at angle */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          left: "50%",
          transform: "translateX(-50%) rotate(-30deg)",
          transformOrigin: "bottom center",
          width: "6px",
          height: "22px",
          background: "#C9A84C",
          border: "1px solid #A08030",
          zIndex: 3,
        }}
      >
        {/* Lens at tip */}
        <div
          style={{
            position: "absolute",
            top: "-3px",
            left: "-1px",
            width: "8px",
            height: "4px",
            background: "#87CEEB",
            border: "1px solid #6AADCC",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Dome */}
      <div
        style={{
          position: "absolute",
          top: "-16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60px",
          height: "22px",
          background: "#708090",
          borderRadius: "30px 30px 0 0",
          border: "2px solid #556677",
          borderBottom: "none",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Dome slit (narrow dark vertical opening) */}
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "3px",
            height: "100%",
            background: "#1A1A2E",
          }}
        />
      </div>

      {/* Main building body */}
      <div
        style={{
          width: "120px",
          height: `${totalHeight}px`,
          background: "#556677",
          border: "2px solid #3D4D5C",
          borderBottom: "none",
          position: "relative",
        }}
      >
        {/* Stone block pattern - horizontal lines */}
        {Array.from({ length: Math.floor(totalHeight / 10) }).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: "absolute",
              top: `${i * 10}px`,
              left: 0,
              right: 0,
              height: "1px",
              background: "rgba(0,0,0,0.12)",
            }}
          />
        ))}
        {/* Stone block pattern - alternating vertical center lines for brick offset */}
        {Array.from({ length: Math.floor(totalHeight / 10) }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: "absolute",
              top: `${i * 10}px`,
              left: i % 2 === 0 ? "50%" : "25%",
              width: "1px",
              height: "10px",
              background: "rgba(0,0,0,0.10)",
            }}
          />
        ))}
        {Array.from({ length: Math.floor(totalHeight / 10) }).map((_, i) =>
          i % 2 !== 0 ? (
            <div
              key={`v2-${i}`}
              style={{
                position: "absolute",
                top: `${i * 10}px`,
                left: "75%",
                width: "1px",
                height: "10px",
                background: "rgba(0,0,0,0.10)",
              }}
            />
          ) : null
        )}

        {/* Sign */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#2D3D4C",
            padding: "2px 6px",
            border: "1px solid #1A2A3A",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "4px",
            color: "#87CEEB",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          {name || "OBSERVATORY"}
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
                  background: "#3D4D5C",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: `${24 + f * floorHeight + (f > 0 ? 2 : 0)}px`,
                left: "14px",
                right: "14px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#3D4D5C" />
              <FloorWindow state={agent.state} width={16} height={14} borderColor="#3D4D5C" />
            </div>
          </div>
        ))}

        {/* Circular entrance */}
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "30px",
            height: "30px",
            background: "#1A1A2E",
            border: "2px solid #C9A84C",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          {/* Star dots inside entrance */}
          <div style={{ position: "absolute", top: "5px", left: "6px", width: "2px", height: "2px", background: "#FFFFFF", borderRadius: "50%", opacity: 0.9 }} />
          <div style={{ position: "absolute", top: "12px", left: "18px", width: "2px", height: "2px", background: "#FFFFFF", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", top: "8px", left: "12px", width: "1px", height: "1px", background: "#FFFFFF", borderRadius: "50%", opacity: 1.0 }} />
          <div style={{ position: "absolute", top: "18px", left: "8px", width: "1px", height: "1px", background: "#FFFFFF", borderRadius: "50%", opacity: 0.7 }} />
          <div style={{ position: "absolute", top: "15px", left: "22px", width: "2px", height: "2px", background: "#FFFFFF", borderRadius: "50%", opacity: 0.5 }} />
          <div style={{ position: "absolute", top: "22px", left: "14px", width: "1px", height: "1px", background: "#FFFFFF", borderRadius: "50%", opacity: 0.8 }} />
        </div>
      </div>

      {/* Stone base ledge (wider than building) */}
      <div
        style={{
          width: "132px",
          height: "6px",
          background: "#3D4D5C",
          border: "2px solid #2D3D4C",
          marginLeft: "-6px",
        }}
      />
    </div>
  );
}
