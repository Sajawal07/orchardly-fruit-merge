import type { SaveData } from "./types";

const KEY = "orchardly-save-v2";
const SCHEMA = 2;
const today = () => new Date().toISOString().slice(0, 10);

export const defaultSave = (): SaveData => ({
  schema: SCHEMA,
  coins: 120,
  bestScore: 0,
  unlockedLevel: 1,
  stars: {},
  levelScores: {},
  owned: ["classic", "glass", "orchard"],
  equipped: { fruit: "classic", jar: "glass", background: "orchard" },
  powerups: { shake: 1, hammer: 1, swap: 1, upgrade: 0 },
  collection: [0, 1, 2, 3, 4],
  settings: { sound: true, music: true, vibration: true },
  daily: { lastClaim: "", streak: 0 },
  missions: { date: today(), progress: [0, 0, 0], claimed: [false, false, false] },
  claimedChests: [],
  hints: { map: false, shop: false, game: false },
});

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    const merged: SaveData = {
      ...base,
      ...parsed,
      schema: SCHEMA,
      equipped: { ...base.equipped, ...parsed.equipped },
      powerups: { ...base.powerups, ...parsed.powerups },
      settings: { ...base.settings, ...parsed.settings },
      daily: { ...base.daily, ...parsed.daily },
      missions: { ...base.missions, ...parsed.missions },
      claimedChests: Array.isArray(parsed.claimedChests) ? parsed.claimedChests : [],
      hints: { ...base.hints, ...parsed.hints },
    };
    if (merged.missions.date !== today()) {
      merged.missions = { date: today(), progress: [0, 0, 0], claimed: [false, false, false] };
    }
    return merged;
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // The game remains playable if storage is unavailable.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore private-mode storage failures.
  }
}

export function claimStatus(save: SaveData) {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  if (save.daily.lastClaim === todayKey) return { available: false, streak: save.daily.streak };
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const continued = save.daily.lastClaim === yesterday.toISOString().slice(0, 10);
  return { available: true, streak: continued ? (save.daily.streak % 7) + 1 : 1 };
}