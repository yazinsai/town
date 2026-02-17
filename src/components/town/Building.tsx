import type { Building as BuildingType, Agent, AgentState } from "@shared/types";
import Saloon from "../sprites/Saloon";
import Bank from "../sprites/Bank";
import SheriffOffice from "../sprites/SheriffOffice";
import GeneralStore from "../sprites/GeneralStore";
import SpeechBubble from "./SpeechBubble";

export interface FloorAgent {
  state: AgentState;
}

interface BuildingProps {
  building: BuildingType;
  agents: Agent[];
  onClick: () => void;
  onBubbleClick: (agent: Agent) => void;
}

function BuildingSprite({ style, agents }: { style: string; agents: FloorAgent[] }) {
  switch (style) {
    case "saloon":
      return <Saloon agents={agents} />;
    case "bank":
      return <Bank agents={agents} />;
    case "sheriff":
      return <SheriffOffice agents={agents} />;
    case "general-store":
      return <GeneralStore agents={agents} />;
    default:
      return <Saloon agents={agents} />;
  }
}

export default function Building({
  building,
  agents,
  onClick,
  onBubbleClick,
}: BuildingProps) {
  const waitingAgent = agents.find(
    (a) => a.state === "waiting_input" || a.state === "waiting_permission"
  );
  const bubbleType = waitingAgent?.state === "waiting_input" ? "question" : "permission";
  const floorAgents: FloorAgent[] = agents.length > 0
    ? agents.map((a) => ({ state: a.state }))
    : [{ state: "idle" as AgentState }];

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* Speech bubble */}
      {waitingAgent && (
        <SpeechBubble
          type={bubbleType as "question" | "permission"}
          onClick={() => onBubbleClick(waitingAgent)}
        />
      )}

      {/* Building sprite */}
      <div style={{ position: "relative" }}>
        <BuildingSprite style={building.buildingStyle} agents={floorAgents} />
      </div>

      {/* Wooden name sign */}
      <div
        style={{
          background: "#6B4226",
          border: "2px solid #4A2E1A",
          padding: "3px 8px",
          marginTop: "4px",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "5px",
          color: "#F4E4C1",
          textAlign: "center",
          maxWidth: "120px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {building.name}
      </div>
    </div>
  );
}
