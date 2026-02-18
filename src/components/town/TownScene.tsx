import type { Building as BuildingType, Agent } from "@shared/types";
import { useTimeOfDay } from "../../hooks/useTimeOfDay";
import Sky from "./Sky";
import Road from "./Road";
import Building from "./Building";
import PixelText from "../ui/PixelText";

interface TownSceneProps {
  buildings: BuildingType[];
  agents: Record<string, Agent[]>;
  seenAgents: Set<string>;
  onBuildClick: (building: BuildingType) => void;
  onBubbleClick: (agent: Agent, building: BuildingType) => void;
  onNewBuilding: () => void;
  connected: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

export default function TownScene({
  buildings,
  agents,
  seenAgents,
  onBuildClick,
  onBubbleClick,
  onNewBuilding,
  connected,
  muted,
  onToggleMute,
}: TownSceneProps) {
  const theme = useTimeOfDay();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.sceneBg,
      }}
    >
      {/* Top-right indicators */}
      <div
        style={{
          position: "fixed",
          top: "8px",
          right: "8px",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {/* Mute toggle */}
        <div
          onClick={onToggleMute}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          style={{
            cursor: "pointer",
            opacity: muted ? 0.4 : 0.8,
          }}
        >
          <PixelText variant="small" color="#F4E4C1">
            {muted ? "MUTE" : "SFX"}
          </PixelText>
        </div>
        <div style={{ width: "1px", height: "10px", background: "#8B4513" }} />
        {/* Connection indicator */}
        <div
          style={{
            width: "6px",
            height: "6px",
            background: connected ? "#4CAF50" : "#F44336",
          }}
        />
        <PixelText variant="small" color={connected ? "#4CAF50" : "#F44336"}>
          {connected ? "LIVE" : "..."}
        </PixelText>
      </div>

      {/* Title */}
      <div
        style={{
          position: "fixed",
          top: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
        }}
      >
        <PixelText variant="h2" color="#F4E4C1">
          CLAUDE TOWN
        </PixelText>
      </div>

      {/* Sky */}
      <Sky theme={theme} />

      {/* Buildings area */}
      <div
        style={{
          flex: 1,
          background: theme.ground.gradient,
          display: "flex",
          alignItems: "flex-end",
          overflowX: "auto",
          overflowY: "hidden",
          padding: "0 32px 0",
          gap: "32px",
          minHeight: "200px",
        }}
      >
        {buildings.map((building) => (
          <Building
            key={building.id}
            building={building}
            agents={agents[building.id] || []}
            seenAgents={seenAgents}
            onClick={() => onBuildClick(building)}
            onBubbleClick={(agent) => onBubbleClick(agent, building)}
          />
        ))}

        {/* New building button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            flexShrink: 0,
            paddingBottom: "8px",
          }}
        >
          <div
            onClick={onNewBuilding}
            style={{
              width: "80px",
              height: "60px",
              border: `3px dashed ${theme.ground.borderTop}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: theme.period === "night"
                ? "rgba(40,50,70,0.3)"
                : "rgba(139,69,19,0.15)",
            }}
          >
            <PixelText variant="h1" color={theme.ground.borderTop}>
              +
            </PixelText>
          </div>
          <PixelText
            variant="small"
            color={theme.ground.borderTop}
            style={{ marginTop: "6px" }}
          >
            BUILD
          </PixelText>
        </div>
      </div>

      {/* Road */}
      <Road theme={theme} />
    </div>
  );
}
