# Sound Effects Design

## Summary

Add two 8-bit/chiptune notification sounds to Claude Town, synthesized via Web Audio API. No audio files needed.

## Sounds

### 1. Agent Waiting (`waiting_input`)

Attention-grabbing ascending chiptune jingle. Three quick rising square-wave notes (Metal Gear "!" alert vibe, but 8-bit western). Plays once when an agent transitions to `waiting_input`.

### 2. Agent Completed (`completed`)

Satisfying descending completion chime. Short 4-note major-key arpeggio on a triangle wave (NES item-obtained feel). Plays once when an agent transitions to `completed`.

## Implementation

### New Files

- **`src/lib/sounds.ts`** - Web Audio API synth functions. Two exports: `playWaitingSound()` and `playCompletedSound()`. Pure oscillator synthesis, no audio files.
- **`src/hooks/useSoundEffects.ts`** - Hook that listens to WebSocket events (`agent:state`) and triggers sounds on state transitions. Includes mute toggle persisted to localStorage.

### Modified Files

- **`src/components/town/TownScene.tsx`** - Add mute toggle icon (small speaker in top corner).
- **`src/App.tsx`** - Wire up `useSoundEffects` hook with WebSocket events.

### Behavior Rules

- Each sound plays once per state transition, not repeatedly.
- If multiple agents complete simultaneously, sounds queue with small delay to avoid cacophony.
- Mute state persisted in localStorage (`claude-town-muted`).

### Mute Control

Small pixel-art speaker icon in the top corner of the town scene. Click to toggle mute/unmute. Remembers preference across sessions via localStorage.
