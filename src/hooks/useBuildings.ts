import { useState, useEffect, useCallback } from "react";
import type { Building, WSEvent } from "@shared/types";
import { getBuildings } from "../lib/api";

export function useBuildings(lastEvent: WSEvent | null) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error("Failed to fetch buildings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "building:created") {
      setBuildings((prev) => {
        // Avoid duplicates — replace if exists, append if new
        const exists = prev.some((b) => b.id === lastEvent.building.id);
        if (exists) return prev.map((b) => b.id === lastEvent.building.id ? lastEvent.building : b);
        return [...prev, lastEvent.building];
      });
    } else if (lastEvent.type === "building:removed") {
      setBuildings((prev) =>
        prev.filter((b) => b.id !== lastEvent.buildingId)
      );
    } else if (lastEvent.type === "agent:state" || lastEvent.type === "agent:question" || lastEvent.type === "agent:permission") {
      // Refetch to get updated agent info
      fetch();
    }
  }, [lastEvent, fetch]);

  return { buildings, loading, refetch: fetch };
}
