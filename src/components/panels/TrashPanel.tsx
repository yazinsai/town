import { useState, useEffect } from "react";
import type { TrashedBuilding } from "@shared/types";
import { getTrashedBuildings, restoreBuilding } from "../../lib/api";
import PixelButton from "../ui/PixelButton";
import PixelText from "../ui/PixelText";

interface TrashPanelProps {
  onClose: () => void;
  onRestored: () => void;
}

function timeRemaining(trashedAt: string): string {
  const elapsed = Date.now() - new Date(trashedAt).getTime();
  const remaining = 48 * 60 * 60 * 1000 - elapsed;
  if (remaining <= 0) return "Expiring...";
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${minutes}m left`;
}

export default function TrashPanel({ onClose, onRestored }: TrashPanelProps) {
  const [items, setItems] = useState<TrashedBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    getTrashedBuildings()
      .then(setItems)
      .catch((err) => console.error("Failed to fetch trash:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      await restoreBuilding(id);
      onRestored();
    } catch (err) {
      console.error("Failed to restore building:", err);
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div
      className="animate-slide-up"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#2C1810", border: "3px solid #8B4513", borderBottom: "none",
        padding: "16px", zIndex: 100, maxHeight: "85vh", overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <PixelText variant="h2">TRASH</PixelText>
        <PixelButton variant="ghost" onClick={onClose}>X</PixelButton>
      </div>

      {loading ? (
        <PixelText variant="small" color="#5C3317">Loading...</PixelText>
      ) : items.length === 0 ? (
        <PixelText variant="small" color="#5C3317">Nothing in the trash</PixelText>
      ) : (
        items.map((item) => (
          <div
            key={item.buildingId}
            style={{
              border: "2px solid #5C3317",
              padding: "8px",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <PixelText variant="body" color="#D2B48C">
                  {item.building.name.toUpperCase()}
                </PixelText>
                <PixelText variant="small" color="#A0826A" style={{ marginTop: "4px" }}>
                  {item.building.style} &bull; {timeRemaining(item.trashedAt)}
                </PixelText>
              </div>
              <PixelButton
                onClick={() => handleRestore(item.buildingId)}
                disabled={restoringId === item.buildingId}
              >
                {restoringId === item.buildingId ? "..." : "RESTORE"}
              </PixelButton>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
