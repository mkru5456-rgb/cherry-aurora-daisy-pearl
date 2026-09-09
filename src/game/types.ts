export type TrustKey = "lucifer" | "elias" | "dion" | "lilith" | "cain";

export type Choice = {
  text: string;
  next: string;
  trust?: Partial<Record<TrustKey, number>>;
  flag?: string;
  reqTrust?: Partial<Record<TrustKey, number>>;
  reqFlag?: string;
  reqFlagNot?: string;
};

export type StoryNode = {
  loc?: string;
  bg?: "threshold" | "street" | "library" | "garden" | "heaven" | "office" | "night";
  speaker?: string;
  speakerId?: TrustKey | "angel" | "";
  chars?: Array<TrustKey | "angel">;
  text: string;
  next?: string;
  choices?: Choice[];
  flag?: string;
  trust?: Partial<Record<TrustKey, number>>;
  journal?: string | string[];
  unlockChar?: { id: TrustKey; level: number };
  ending?: string;
};

export type GameState = {
  version: number;
  node: string;
  playerName: string;
  flags: Record<string, boolean>;
  trust: Record<TrustKey, number>;
  journal: string[];
  charsUnlocked: Partial<Record<TrustKey, number>>;
  endingsSeen: string[];
  location: string;
};

export const SAVE_VERSION = 1;

export const defaultState = (): GameState => ({
  version: SAVE_VERSION,
  node: "intro_1",
  playerName: "Душа",
  flags: {},
  trust: { lucifer: 0, elias: 0, dion: 0, lilith: 0, cain: 0 },
  journal: [],
  charsUnlocked: {},
  endingsSeen: [],
  location: "Порог",
});
