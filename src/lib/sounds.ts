const MUTE_KEY = "claude-town-muted";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
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

export function initAudio() {
  getCtx();
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
