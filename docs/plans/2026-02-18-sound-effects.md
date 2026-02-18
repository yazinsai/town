# Sound Effects Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add two 8-bit chiptune notification sounds (agent waiting, agent completed) synthesized via Web Audio API.

**Architecture:** Create a `sounds.ts` utility with Web Audio API oscillator synthesis, a `useSoundEffects` hook that reacts to WebSocket events, and a mute toggle in the TownScene header.

**Tech Stack:** Web Audio API (OscillatorNode, GainNode), React hooks, localStorage

---

### Task 1: Create sound synthesis utility

**Files:**
- Create: `src/lib/sounds.ts`

**Step 1: Create `src/lib/sounds.ts`**

This file exports two functions and a mute control. Uses Web Audio API with a lazy-initialized AudioContext (browsers require user gesture before playing audio).

```typescript
const MUTE_KEY = "claude-town-muted";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function setMuted(muted: boolean) {
  localStorage.setItem(MUTE_KEY, muted ? "true" : "false");
}

export function getMuted(): boolean {
  return isMuted();
}

function playNote(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Ascending 3-note square wave alert — "Hey partner, need ya!"
 * Notes: A4 → C#5 → E5 (A major triad, rising, urgent)
 */
export function playWaitingSound() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25]; // A4, C#5, E5
  notes.forEach((freq, i) => {
    playNote(ctx, freq, "square", now + i * 0.12, 0.15, 0.15);
  });
}

/**
 * Descending 4-note triangle wave chime — "Job's done, sheriff"
 * Notes: E5 → C5 → G4 → C4 (C major, descending, satisfying)
 */
export function playCompletedSound() {
  if (isMuted()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [659.25, 523.25, 392.0, 261.63]; // E5, C5, G4, C4
  notes.forEach((freq, i) => {
    playNote(ctx, freq, "triangle", now + i * 0.13, 0.2, 0.12);
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/sounds.ts
git commit -m "feat: add 8-bit sound synthesis utility"
```

---

### Task 2: Create useSoundEffects hook

**Files:**
- Create: `src/hooks/useSoundEffects.ts`

**Step 1: Create `src/hooks/useSoundEffects.ts`**

This hook takes the `lastEvent` from useWebSocket, tracks which agent state changes it has already played sounds for (to avoid replays), and triggers the appropriate sound.

```typescript
import { useEffect, useRef, useState } from "react";
import type { WSEvent } from "@shared/types";
import { playWaitingSound, playCompletedSound, getMuted, setMuted } from "../lib/sounds";

const MUTE_KEY = "claude-town-muted";

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
```

Note: The `waiting_input` key includes `Date.now()` so the same agent can trigger the sound multiple times (e.g. if an agent asks multiple questions across its lifetime). The `completed` key uses just the agentId since completion is a one-time event.

**Step 2: Commit**

```bash
git add src/hooks/useSoundEffects.ts
git commit -m "feat: add useSoundEffects hook for WebSocket events"
```

---

### Task 3: Wire hook into App.tsx and add mute toggle to TownScene

**Files:**
- Modify: `src/App.tsx` (lines 1-4 imports, line 132 after useWebSocket, lines 257-270 TownScene props)
- Modify: `src/components/town/TownScene.tsx` (props interface, mute toggle UI next to connection indicator)

**Step 1: Modify `src/App.tsx`**

Add import for the new hook:
```typescript
import { useSoundEffects } from "./hooks/useSoundEffects";
```

After line 132 (`const { lastEvent, connected } = useWebSocket(authed);`), add:
```typescript
const { muted, toggleMute } = useSoundEffects(lastEvent);
```

Pass `muted` and `toggleMute` to TownScene (add to the existing props on lines 257-270):
```tsx
<TownScene
  buildings={buildings}
  agents={agentsByBuilding}
  seenAgents={seenAgents}
  onBuildClick={...}
  onBubbleClick={...}
  onNewBuilding={...}
  connected={connected}
  muted={muted}
  onToggleMute={toggleMute}
/>
```

**Step 2: Modify `src/components/town/TownScene.tsx`**

Add `muted` and `onToggleMute` to the TownSceneProps interface:
```typescript
interface TownSceneProps {
  // ... existing props
  muted: boolean;
  onToggleMute: () => void;
}
```

Add a mute toggle button next to the existing connection indicator (top-right area, lines 41-62). Place it just to the left of the LIVE indicator:

```tsx
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
```

Place this inside the existing top-right fixed div (line 42-62), before the connection dot, adding it to the flex row.

**Step 3: Commit**

```bash
git add src/App.tsx src/components/town/TownScene.tsx
git commit -m "feat: wire sound effects into app with mute toggle"
```

---

### Task 4: Manual test and verify

**Step 1: Run dev server**

```bash
cd /Users/rock/ai/projects/town && bun run dev
```

**Step 2: Verify in browser**

1. Open the app, click the SFX/MUTE toggle — confirm it switches text and persists on reload
2. Spawn an agent or use an existing one that will ask a question — confirm the ascending chiptune plays when agent enters `waiting_input`
3. Let an agent complete — confirm the descending chime plays on `agent:completed`
4. Toggle mute, trigger events again — confirm silence when muted
5. Refresh page — confirm mute preference persisted

**Step 3: Final commit if any tweaks needed**

```bash
git add <changed files>
git commit -m "fix: tune sound effect parameters"
```
