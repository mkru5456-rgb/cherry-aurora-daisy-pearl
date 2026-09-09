import { defaultState, SAVE_VERSION, type GameState } from "./types";

const SLOTS_KEY = "tdv_saves_v1";
const SEEN_KEY = "tdv_endings";

export type SaveSlot = {
  time: number;
  location: string;
  node: string;
  playerName: string;
  state: GameState;
} | null;

function migrate(raw: GameState): GameState {
  const base = defaultState();
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    trust: { ...base.trust, ...(raw.trust || {}) },
    flags: { ...(raw.flags || {}) },
    journal: raw.journal || [],
    charsUnlocked: raw.charsUnlocked || {},
    endingsSeen: raw.endingsSeen || [],
    playerName: raw.playerName || "Душа",
    node: raw.node || "intro_1",
    location: raw.location || "Порог",
  };
}

export function loadSlots(): SaveSlot[] {
  try {
    const arr = JSON.parse(localStorage.getItem(SLOTS_KEY) || "[]") as SaveSlot[];
    const slots: SaveSlot[] = [null, null, null, null, null];
    for (let i = 0; i < 5; i++) slots[i] = arr[i] ?? null;
    return slots;
  } catch {
    return [null, null, null, null, null];
  }
}

export function writeSlot(i: number, state: GameState) {
  const slots = loadSlots();
  slots[i] = {
    time: Date.now(),
    location: state.location,
    node: state.node,
    playerName: state.playerName,
    state: structuredClone(state),
  };
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function deleteSlot(i: number) {
  const slots = loadSlots();
  slots[i] = null;
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function readSlot(i: number): GameState | null {
  const s = loadSlots()[i];
  if (!s?.state) return null;
  return migrate(s.state);
}

export function persistSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* private mode */
  }
}

export function loadSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}
