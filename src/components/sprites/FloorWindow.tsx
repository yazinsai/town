import type { AgentState } from "@shared/types";

interface WindowConfig {
  bg: string;
  glow: string;
  className: string;
  boarded: boolean;
}

const stateConfig: Record<string, WindowConfig> = {
  busy: { bg: "#E8C55A", glow: "0 0 6px 2px rgba(232,197,90,0.5)", className: "animate-window-flicker", boarded: false },
  idle: { bg: "#6A5A3A", glow: "none", className: "", boarded: false },
  waiting_input: { bg: "#FF9800", glow: "0 0 8px 3px rgba(255,152,0,0.5)", className: "animate-window-pulse", boarded: false },
  waiting_permission: { bg: "#FF5252", glow: "0 0 8px 3px rgba(255,82,82,0.5)", className: "animate-window-pulse", boarded: false },
  completed: { bg: "#2A2520", glow: "none", className: "", boarded: true },
  error: { bg: "#4A1515", glow: "0 0 4px 1px rgba(200,50,50,0.3)", className: "", boarded: false },
};

const defaultConfig: WindowConfig = stateConfig.idle;

export function getWindowConfig(state?: AgentState): WindowConfig {
  return stateConfig[state || "idle"] || defaultConfig;
}

interface FloorWindowProps {
  state?: AgentState;
  width: number;
  height: number;
  borderColor: string;
}

export default function FloorWindow({ state, width, height, borderColor }: FloorWindowProps) {
  const config = getWindowConfig(state);

  return (
    <div style={{ position: "relative", width: `${width}px`, height: `${height}px` }}>
      <div
        className={config.className || undefined}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: config.bg,
          border: `2px solid ${borderColor}`,
          boxShadow: config.glow,
        }}
      />
      {config.boarded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "-20%",
              width: "140%",
              height: "2px",
              background: "#5C3317",
              transform: "rotate(45deg)",
              transformOrigin: "center",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "-20%",
              width: "140%",
              height: "2px",
              background: "#5C3317",
              transform: "rotate(-45deg)",
              transformOrigin: "center",
            }}
          />
        </div>
      )}
    </div>
  );
}
