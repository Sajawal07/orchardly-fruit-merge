import type { FruitConfig, LevelConfig, ShopItem, WorldConfig } from "./types";

export const FRUITS: FruitConfig[] = [
  { name: "Cherry", color: "#ef476f", dark: "#b62c4c", light: "#ff8ca5", radius: 16, points: 10 },
  { name: "Strawberry", color: "#ff5d6c", dark: "#bc3549", light: "#ff9ca6", radius: 20, points: 24 },
  { name: "Grape", color: "#8d5ac7", dark: "#5f3495", light: "#c69ce9", radius: 24, points: 46 },
  { name: "Lemon", color: "#ffd84d", dark: "#c99c20", light: "#fff59b", radius: 28, points: 78 },
  { name: "Orange", color: "#ff9f43", dark: "#d66c28", light: "#ffc875", radius: 33, points: 120 },
  { name: "Apple", color: "#ef5350", dark: "#b62f35", light: "#ff9088", radius: 38, points: 180 },
  { name: "Pear", color: "#9acb52", dark: "#638f30", light: "#d1ec83", radius: 43, points: 260 },
  { name: "Peach", color: "#ff9f89", dark: "#d96b64", light: "#ffd0ae", radius: 49, points: 370 },
  { name: "Pineapple", color: "#e6ad36", dark: "#a96e21", light: "#ffe172", radius: 55, points: 520 },
  { name: "Melon", color: "#a8d65e", dark: "#599849", light: "#dff38a", radius: 62, points: 740 },
  { name: "Watermelon", color: "#3fae62", dark: "#216c43", light: "#8ee784", radius: 70, points: 1200 },
];

export const WORLDS: WorldConfig[] = [
  { id: "orchard", name: "Sunny Orchard", subtitle: "Applewood Acres", scene: "orchard", jar: "barrel", colors: ["#fff4c5", "#bde57f", "#66bd6c"] },
  { id: "frost", name: "Frosty Valley", subtitle: "Snowdrop Pass", scene: "snow", jar: "ice", colors: ["#e8fbff", "#aadff5", "#7eb6df"] },
  { id: "desert", name: "Desert Dunes", subtitle: "Citrus Sands", scene: "desert", jar: "cactus", colors: ["#fff0bc", "#f5be6b", "#dc7956"] },
  { id: "beach", name: "Tropical Beach", subtitle: "Mango Bay", scene: "beach", jar: "shell", colors: ["#dcfbf2", "#75d8d0", "#3a91bd"] },
  { id: "night", name: "Starry Night Forest", subtitle: "Moonberry Grove", scene: "night", jar: "lantern", colors: ["#25284e", "#413768", "#70558c"] },
  { id: "candy", name: "Candy Land", subtitle: "Sugarplum Lane", scene: "candy", jar: "candy", colors: ["#fff0fa", "#ffc4df", "#a992e8"] },
];

const makeLevel = (id: number): LevelConfig => {
  const world = Math.floor((id - 1) / 10);
  const step = id - world * 10;
  const goalKind = id % 3;
  const difficulty = id + world * 3;
  const type = goalKind === 1 ? "score" : goalKind === 2 ? "create" : "merge";
  const fruit = Math.min(9, 2 + Math.floor(id / 7));
  const target = type === "score" ? 350 + difficulty * 90 : type === "create" ? fruit : 3 + Math.floor(id / 10);
  const oneStar = type === "score" ? target : 350 + id * 75;
  return {
    id,
    world,
    goal: { type, target, fruit: type === "score" ? undefined : fruit },
    drops: id < 8 ? undefined : Math.max(22, 45 - Math.floor(id / 3)),
    starScores: [oneStar, Math.round(oneStar * 1.4), Math.round(oneStar * 1.9)],
    obstacles: world > 0 ? { frozen: Math.min(3, Math.floor(world / 2) + (step > 5 ? 1 : 0)), rocks: world > 1 ? Math.min(3, Math.floor(world / 2)) : 0 } : undefined,
    boss: step === 5 || step === 10,
    coins: 22 + world * 7 + (step === 5 || step === 10 ? 28 : 0),
  };
};

export const LEVELS: LevelConfig[] = Array.from({ length: 60 }, (_, index) => makeLevel(index + 1));

export const FRUIT_SKINS: ShopItem[] = [
  { id: "classic", name: "Classic Cartoon", rarity: "Common", price: 0, preview: "classic", palette: ["#ef476f", "#ffd84d", "#3fae62"] },
  { id: "jelly", name: "Glossy Jelly", rarity: "Rare", price: 180, preview: "jelly", palette: ["#ff77aa", "#ffe35b", "#60d8b0"] },
  { id: "candy", name: "Candy Sweets", rarity: "Rare", price: 220, preview: "candy", palette: ["#ff75bd", "#79dfff", "#c89dff"] },
  { id: "pixel", name: "Pixel Retro", rarity: "Epic", price: 580, preview: "pixel", palette: ["#ed3e64", "#ffc942", "#3dab62"] },
  { id: "watercolor", name: "Watercolor", rarity: "Rare", price: 320, preview: "watercolor", palette: ["#f07f8e", "#eccf59", "#68bd88"] },
  { id: "neon", name: "Neon Glow", rarity: "Legendary", price: 1600, preview: "neon", palette: ["#ff47b7", "#fff45a", "#47ffc2"] },
  { id: "wood", name: "Wooden Toy", rarity: "Epic", price: 640, preview: "wood", palette: ["#bf6848", "#e3b651", "#6ea05f"] },
  { id: "galaxy", name: "Galaxy Planets", rarity: "Legendary", price: 1900, preview: "galaxy", palette: ["#cf5cff", "#6ba8ff", "#5a4bc6"] },
  { id: "emoji", name: "Emoji Faces", rarity: "Rare", price: 360, preview: "emoji", palette: ["#ff6969", "#ffd54d", "#63c46b"] },
  { id: "kawaii", name: "Kawaii Pastel", rarity: "Epic", price: 760, preview: "kawaii", palette: ["#ffadc0", "#fff093", "#a9e6b1"] },
];

export const JARS: ShopItem[] = [
  { id: "glass", name: "Classic Glass", rarity: "Common", price: 0, preview: "glass" },
  { id: "barrel", name: "Wooden Barrel", rarity: "Common", price: 90, preview: "barrel" },
  { id: "ice", name: "Ice Block", rarity: "Rare", price: 260, preview: "ice" },
  { id: "cactus", name: "Cactus Pot", rarity: "Rare", price: 310, preview: "cactus" },
  { id: "shell", name: "Seashell Bowl", rarity: "Epic", price: 620, preview: "shell" },
  { id: "gold", name: "Golden Vase", rarity: "Legendary", price: 2100, preview: "gold" },
  { id: "lantern", name: "Moon Lantern", rarity: "Epic", price: 720, preview: "lantern" },
  { id: "candyJar", name: "Candy Jar", rarity: "Rare", price: 380, preview: "candy" },
  { id: "crystal", name: "Crystal Cube", rarity: "Legendary", price: 2400, preview: "crystal" },
];

export const BACKGROUNDS: ShopItem[] = [
  { id: "orchard", name: "Sunny Orchard", rarity: "Common", price: 0, preview: "orchard" },
  { id: "snow", name: "Snowy Hills", rarity: "Rare", price: 240, preview: "snow" },
  { id: "desert", name: "Desert Dunes", rarity: "Rare", price: 280, preview: "desert" },
  { id: "beach", name: "Tropical Beach", rarity: "Epic", price: 560, preview: "beach" },
  { id: "night", name: "Starry Night", rarity: "Epic", price: 700, preview: "night" },
  { id: "candy", name: "Candy Land", rarity: "Legendary", price: 1800, preview: "candy" },
  { id: "kitchen", name: "Cozy Kitchen", rarity: "Common", price: 120, preview: "kitchen" },
  { id: "blossom", name: "Cherry Blossom", rarity: "Epic", price: 850, preview: "blossom" },
  { id: "underwater", name: "Underwater", rarity: "Legendary", price: 2200, preview: "underwater" },
];

export const POWERUPS: ShopItem[] = [
  { id: "shake", name: "Shake", rarity: "Common", price: 45, preview: "shake" },
  { id: "hammer", name: "Hammer", rarity: "Common", price: 55, preview: "hammer" },
  { id: "swap", name: "Swap", rarity: "Rare", price: 65, preview: "swap" },
  { id: "upgrade", name: "Upgrade", rarity: "Rare", price: 85, preview: "upgrade" },
];

export const CHESTS: ShopItem[] = [
  { id: "woodChest", name: "Picnic Chest", rarity: "Common", price: 140, preview: "chest" },
  { id: "goldChest", name: "Golden Chest", rarity: "Epic", price: 420, preview: "chest" },
  { id: "starChest", name: "Starlight Chest", rarity: "Legendary", price: 900, preview: "chest" },
];

export const SKINS = {
  fruit: FRUIT_SKINS,
  jars: JARS,
  backgrounds: BACKGROUNDS,
  powerups: POWERUPS,
  chests: CHESTS,
};

export const goalText = (level: LevelConfig) => {
  if (level.goal.type === "score") return `Score ${level.goal.target.toLocaleString()} points`;
  const fruit = FRUITS[level.goal.fruit || 0].name;
  if (level.goal.type === "create") return `Create one ${fruit}`;
  return `Merge ${level.goal.target} ${fruit}s`;
};