import { useEffect, useRef, useState } from "react";
import type { WSEvent } from "@shared/types";
import { playWaitingSound, playCompletedSound, getMuted, setMuted } from "../lib/sounds";

export function useSoundEffects(lastEvent: WSEvent | null) {
  const [muted, _setMuted] = useState(() => getMuted());
  const processedRef = useRef(new Set<string>());

  function toggleMute() {
    const next = !muted;
    _setMuted(next);
    setMuted(next);
  }

  useEffect(() => {
    if (!lastEvent || muted) return;

    // Generate a dedup key from the event
    let key: string | null = null;
    let sound: (() => void) | null = null;

    if (lastEvent.type === "agent:state" && lastEvent.state === "waiting_input") {
      key = `waiting:${lastEvent.agentId}:${Date.now()}`;
      sound = playWaitingSound;
    } else if (lastEvent.type === "agent:completed") {
      key = `completed:${lastEvent.agentId}`;
      sound = playCompletedSound;
    }

    if (key && sound && !processedRef.current.has(key)) {
      processedRef.current.add(key);
      sound();
      // Keep set from growing unbounded
      if (processedRef.current.size > 200) {
        const arr = [...processedRef.current];
        processedRef.current = new Set(arr.slice(-100));
      }
    }
  }, [lastEvent, muted]);

  return { muted, toggleMute };
}
