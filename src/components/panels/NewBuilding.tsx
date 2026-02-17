import { useState, useEffect, useRef } from "react";
import type { AgentState, BuildingStyle } from "@shared/types";
import { createBuilding, getProjects, type ProjectInfo } from "../../lib/api";
import PixelButton from "../ui/PixelButton";
import PixelInput from "../ui/PixelInput";
import PixelText from "../ui/PixelText";
import Saloon from "../sprites/Saloon";
import Bank from "../sprites/Bank";
import SheriffOffice from "../sprites/SheriffOffice";
import GeneralStore from "../sprites/GeneralStore";

interface NewBuildingProps {
  onClose: () => void;
  onCreated: () => void;
}

type SpriteProps = { agents: { state: AgentState }[] };
const previewAgents: { state: AgentState }[] = [{ state: "idle" }];

const styles: { value: BuildingStyle; label: string; Sprite: React.FC<SpriteProps> }[] = [
  { value: "saloon", label: "Saloon", Sprite: Saloon },
  { value: "bank", label: "Bank", Sprite: Bank },
  { value: "sheriff", label: "Sheriff", Sprite: SheriffOffice },
  { value: "general-store", label: "Store", Sprite: GeneralStore },
];

export default function NewBuilding({ onClose, onCreated }: NewBuildingProps) {
  const [name, setName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [buildingStyle, setBuildingStyle] = useState<BuildingStyle>("saloon");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<ProjectInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch suggestions dynamically as user types
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getProjects(projectPath || undefined)
        .then(setSuggestions)
        .catch(() => {});
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [projectPath]);

  async function handleSubmit() {
    if (!name || !projectPath || !initialPrompt) {
      setError("Fill all fields, partner");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createBuilding({ name, projectPath, buildingStyle, initialPrompt });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="animate-slide-up"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#2C1810",
        border: "3px solid #8B4513",
        borderBottom: "none",
        padding: "16px",
        zIndex: 100,
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <PixelText variant="h2">NEW BUILDING</PixelText>
        <PixelButton variant="ghost" onClick={onClose}>
          X
        </PixelButton>
      </div>

      {/* Name */}
      <div style={{ marginBottom: "12px" }}>
        <PixelText variant="small" color="#D2B48C" style={{ marginBottom: "4px" }}>
          NAME
        </PixelText>
        <PixelInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
        />
      </div>

      {/* Project path */}
      <div style={{ marginBottom: "12px", position: "relative" }}>
        <PixelText variant="small" color="#D2B48C" style={{ marginBottom: "4px" }}>
          PROJECT PATH
        </PixelText>
        <PixelInput
          value={projectPath}
          onChange={(e) => {
            setProjectPath(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="/path/to/project"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#F4E4C1",
              border: "2px solid #8B4513",
              maxHeight: "120px",
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {suggestions.map((p) => (
              <div
                key={p.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: "1px solid #D2B48C",
                }}
              >
                <div
                  onClick={() => {
                    setProjectPath(p.path);
                    if (!name) setName(p.name);
                    setShowSuggestions(false);
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "6px",
                    color: "#2C1810",
                    cursor: "pointer",
                  }}
                >
                  {p.name}
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectPath(p.path + "/");
                  }}
                  style={{
                    padding: "6px 10px",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "8px",
                    color: "#8B4513",
                    cursor: "pointer",
                    borderLeft: "1px solid #D2B48C",
                  }}
                  title="Browse subdirectories"
                >
                  &gt;
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Building style selector */}
      <div style={{ marginBottom: "12px" }}>
        <PixelText variant="small" color="#D2B48C" style={{ marginBottom: "8px" }}>
          STYLE
        </PixelText>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {styles.map(({ value, label, Sprite }) => (
            <div
              key={value}
              onClick={() => setBuildingStyle(value)}
              style={{
                cursor: "pointer",
                padding: "8px",
                border: `2px solid ${buildingStyle === value ? "#E8C55A" : "#5C3317"}`,
                background:
                  buildingStyle === value
                    ? "rgba(232,197,90,0.1)"
                    : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div style={{ transform: "scale(0.5)", transformOrigin: "bottom center", height: "45px" }}>
                <Sprite agents={previewAgents} />
              </div>
              <PixelText
                variant="small"
                color={buildingStyle === value ? "#E8C55A" : "#D2B48C"}
              >
                {label}
              </PixelText>
            </div>
          ))}
        </div>
      </div>

      {/* Initial prompt */}
      <div style={{ marginBottom: "16px" }}>
        <PixelText variant="small" color="#D2B48C" style={{ marginBottom: "4px" }}>
          INITIAL PROMPT
        </PixelText>
        <textarea
          value={initialPrompt}
          onChange={(e) => setInitialPrompt(e.target.value)}
          placeholder="What should the agent work on?"
          rows={3}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "8px",
            padding: "8px 10px",
            background: "#F4E4C1",
            color: "#2C1810",
            border: "2px solid #8B4513",
            borderRadius: 0,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            lineHeight: "14px",
          }}
        />
      </div>

      {error && (
        <PixelText variant="small" color="#F44336" style={{ marginBottom: "8px" }}>
          {error}
        </PixelText>
      )}

      <PixelButton
        onClick={handleSubmit}
        disabled={submitting}
        style={{ width: "100%" }}
      >
        {submitting ? "BUILDING..." : "BUILD"}
      </PixelButton>
    </div>
  );
}
