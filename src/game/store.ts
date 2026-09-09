import { create } from "zustand";
import { defaultState, type Choice, type GameState, type TrustKey } from "./types";
import { interpolate, NODES, resolveEnding } from "./story";
import { CHAR_META, LORE } from "./meta";
import { persistSeen } from "./save";

export type Toast = { id: number; text: string };

type Store = {
  screen: "title" | "game" | "ending";
  state: GameState;
  toast: Toast | null;
  endingKey: string | null;
  panel: null | "journal" | "chars" | "saves" | "about";
  start: (name: string) => void;
  loadState: (s: GameState) => void;
  toTitle: () => void;
  advance: () => void;
  choose: (c: Choice) => void;
  setPanel: (p: Store["panel"]) => void;
  canShow: (c: Choice) => boolean;
};

let toastId = 0;

function applyNode(state: GameState, id: string, extraTrust?: Partial<Record<TrustKey, number>>, extraFlag?: string) {
  const node = NODES[id];
  const next: GameState = {
    ...state,
    node: id,
    location: node.loc || state.location,
    flags: { ...state.flags },
    trust: { ...state.trust },
    journal: [...state.journal],
    charsUnlocked: { ...state.charsUnlocked },
    endingsSeen: [...state.endingsSeen],
  };
  const toasts: string[] = [];
  if (extraFlag) next.flags[extraFlag] = true;
  if (node.flag) next.flags[node.flag] = true;
  if (extraTrust) {
    for (const [k, v] of Object.entries(extraTrust)) {
      next.trust[k as TrustKey] += v;
    }
  }
  if (node.trust) {
    for (const [k, v] of Object.entries(node.trust)) {
      next.trust[k as TrustKey] += v;
    }
  }
  const journals = node.journal ? (Array.isArray(node.journal) ? node.journal : [node.journal]) : [];
  for (const j of journals) {
    if (!next.journal.includes(j)) {
      next.journal.push(j);
      toasts.push("Журнал: " + (LORE[j]?.title || j));
    }
  }
  if (node.unlockChar) {
    const prev = next.charsUnlocked[node.unlockChar.id] || 0;
    if (node.unlockChar.level > prev) {
      next.charsUnlocked[node.unlockChar.id] = node.unlockChar.level;
      toasts.push("Персонаж: " + CHAR_META[node.unlockChar.id].name);
    }
  }
  return { next, toasts, ending: node.ending as string | undefined };
}

export const useGame = create<Store>((set, get) => ({
  screen: "title",
  state: defaultState(),
  toast: null,
  endingKey: null,
  panel: null,
  start: (name) => {
    const s = defaultState();
    s.playerName = (name || "Душа").trim() || "Душа";
    const { next, toasts } = applyNode(s, "intro_1");
    set({
      screen: "game",
      state: next,
      panel: null,
      endingKey: null,
      toast: toasts[0] ? { id: ++toastId, text: toasts[0] } : null,
    });
  },
  loadState: (s) => {
    set({ screen: "game", state: s, panel: null, endingKey: null });
  },
  toTitle: () => set({ screen: "title", panel: null }),
  canShow: (c) => {
    const { state } = get();
    if (c.reqTrust) {
      for (const [k, v] of Object.entries(c.reqTrust)) {
        if (state.trust[k as TrustKey] < v) return false;
      }
    }
    if (c.reqFlag && !state.flags[c.reqFlag]) return false;
    if (c.reqFlagNot && state.flags[c.reqFlagNot]) return false;
    return true;
  },
  advance: () => {
    const { state } = get();
    const node = NODES[state.node];
    if (!node?.next) return;
    get().choose({ text: "", next: node.next });
  },
  choose: (c) => {
    const { state } = get();
    const { next, toasts, ending } = applyNode(state, c.next, c.trust, c.flag);
    if (ending) {
      const key = resolveEnding(ending, next.flags);
      if (!next.endingsSeen.includes(key)) next.endingsSeen.push(key);
      persistSeen(next.endingsSeen);
      set({
        state: next,
        screen: "ending",
        endingKey: key,
        toast: toasts[0] ? { id: ++toastId, text: toasts[0] } : null,
      });
      return;
    }
    set({
      state: next,
      toast: toasts[0] ? { id: ++toastId, text: toasts[0] } : null,
    });
  },
  setPanel: (p) => set({ panel: p }),
}));

export function nodeText(state: GameState) {
  const n = NODES[state.node];
  return interpolate(n?.text || "", state.playerName);
}
