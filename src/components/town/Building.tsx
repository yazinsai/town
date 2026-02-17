import type { Building as BuildingType, Agent, AgentState } from "@shared/types";
import Saloon from "../sprites/Saloon";
import Bank from "../sprites/Bank";
import SheriffOffice from "../sprites/SheriffOffice";
import GeneralStore from "../sprites/GeneralStore";
import Hotel from "../sprites/Hotel";
import Masjid from "../sprites/Masjid";
import Blacksmith from "../sprites/Blacksmith";
import PostOffice from "../sprites/PostOffice";
import SpeechBubble from "./SpeechBubble";
import type { BubbleType } from "./SpeechBubble";

export interface FloorAgent {
  state: AgentState;
}

interface BuildingProps {
  building: BuildingType;
  agents: Agent[];
  seenAgents: Set<string>;
  onClick: () => void;
  onBubbleClick: (agent: Agent) => void;
}

const FLOOR_HEIGHT = 24;

// Pixel offset from sprite root to the first floor's window row, per building style.
// buildingTop: flow offset before main building div (e.g. Bank pediment)
// windowStart: offset from main building div top to first floor windows
const floorLayout: Record<string, { buildingTop: number; windowStart: number }> = {
  saloon: { buildingTop: 0, windowStart: 22 },
  bank: { buildingTop: 20, windowStart: 24 },
  sheriff: { buildingTop: 0, windowStart: 22 },
  "general-store": { buildingTop: 0, windowStart: 22 },
  hotel: { buildingTop: 0, windowStart: 22 },
  masjid: { buildingTop: 0, windowStart: 24 },
  blacksmith: { buildingTop: 0, windowStart: 22 },
  "post-office": { buildingTop: 0, windowStart: 22 },
};

function getBubbleType(state: AgentState): BubbleType | null {
  switch (state) {
    case "waiting_input": return "question";
    case "waiting_permission": return "permission";
    case "completed": return "completed";
    case "error": return "error";
    default: return null;
  }
}

function BuildingSprite({ style, agents, name }: { style: string; agents: FloorAgent[]; name: string }) {
  switch (style) {
    case "saloon":
      return <Saloon agents={agents} name={name} />;
    case "bank":
      return <Bank agents={agents} name={name} />;
    case "sheriff":
      return <SheriffOffice agents={agents} name={name} />;
    case "general-store":
      return <GeneralStore agents={agents} name={name} />;
    case "hotel":
      return <Hotel agents={agents} name={name} />;
    case "masjid":
      return <Masjid agents={agents} name={name} />;
    case "blacksmith":
      return <Blacksmith agents={agents} name={name} />;
    case "post-office":
      return <PostOffice agents={agents} name={name} />;
    default:
      return <Saloon agents={agents} name={name} />;
  }
}

export default function Building({
  building,
  agents,
  seenAgents,
  onClick,
  onBubbleClick,
}: BuildingProps) {
  const floorAgents: FloorAgent[] = agents.length > 0
    ? agents.map((a) => ({ state: a.state }))
    : [{ state: "idle" as AgentState }];

  const layout = floorLayout[building.buildingStyle] || floorLayout.saloon;

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
      <div style={{ position: "relative" }}>
        <BuildingSprite style={building.buildingStyle} agents={floorAgents} name={building.name} />

        {/* Per-floor speech bubbles */}
        {agents.map((agent, floorIndex) => {
          const bubbleType = getBubbleType(agent.state);
          if (!bubbleType) return null;
          if (bubbleType === "completed" && seenAgents.has(agent.id)) return null;

          const top = layout.buildingTop + layout.windowStart + floorIndex * FLOOR_HEIGHT;

          return (
            <div
              key={agent.id}
              style={{
                position: "absolute",
                top: `${top}px`,
                left: "100%",
                marginLeft: "4px",
                zIndex: 10,
              }}
            >
              <SpeechBubble
                type={bubbleType}
                onClick={() => onBubbleClick(agent)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
