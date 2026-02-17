import type { Building as BuildingType, Agent } from "@shared/types";
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
}

export default function TownScene({
  buildings,
  agents,
  seenAgents,
  onBuildClick,
  onBubbleClick,
  onNewBuilding,
  connected,
}: TownSceneProps) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#2C1810",
      }}
    >
      {/* Connection indicator */}
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
      <Sky />

      {/* Buildings area */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(to bottom, #D48540 0%, #C88E50 15%, #BE9458 35%, #B89B5E 60%, #C4A265 85%, #C4A86A 100%)",
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
              border: "3px dashed #8B7340",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "rgba(139,69,19,0.15)",
            }}
          >
            <PixelText variant="h1" color="#8B7340">
              +
            </PixelText>
          </div>
          <PixelText
            variant="small"
            color="#6B5530"
            style={{ marginTop: "6px" }}
          >
            BUILD
          </PixelText>
        </div>
      </div>

      {/* Road */}
      <Road />
    </div>
  );
}
