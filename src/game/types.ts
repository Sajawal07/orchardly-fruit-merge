export type ScreenName =
  | "splash"
  | "home"
  | "map"
  | "game"
  | "shop"
  | "daily"
  | "missions"
  | "collection"
  | "how"
  | "settings";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export type FruitConfig = {
  name: string;
  color: string;
  dark: string;
  light: string;
  radius: number;
  points: number;
};

export type WorldConfig = {
  id: string;
  name: string;
  subtitle: string;
  scene: string;
  jar: string;
  colors: [string, string, string];
};

export type GoalType = "score" | "create" | "merge";

export type LevelConfig = {
  id: number;
  world: number;
  goal: {
    type: GoalType;
    target: number;
    fruit?: number;
  };
  drops?: number;
  starScores: [number, number, number];
  obstacles?: { frozen?: number; rocks?: number };
  boss?: boolean;
  coins: number;
};

export type ShopItem = {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  preview: string;
  palette?: string[];
};

export type SaveData = {
  schema: number;
  coins: number;
  bestScore: number;
  unlockedLevel: number;
  stars: Record<number, number>;
  levelScores: Record<number, number>;
  owned: string[];
  equipped: { fruit: string; jar: string; background: string };
  powerups: Record<string, number>;
  collection: number[];
  settings: { sound: boolean; music: boolean; vibration: boolean };
  daily: { lastClaim: string; streak: number };
  missions: { date: string; progress: number[]; claimed: boolean[] };
  claimedChests: number[];
  hints: { map: boolean; shop: boolean; game: boolean };
};

export type RunResult = {
  score: number;
  stars: number;
  coins: number;
  level?: number;
  won: boolean;
  reason?: "danger" | "drops";
};