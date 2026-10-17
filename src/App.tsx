import { useCallback, useEffect, useRef, useState } from "react";
import { FRUIT_SKINS, FRUITS, LEVELS, POWERUPS, SKINS, WORLDS, goalText } from "./game/config";
import { audio } from "./game/audio";
import { GameCanvas, type GameHandle, type GameStats } from "./game/GameCanvas";
import { claimStatus, clearSave, defaultSave, loadSave, persistSave } from "./game/storage";
import type { LevelConfig, RunResult, SaveData, ScreenName, ShopItem } from "./game/types";
import { ChestIcon, CoinIcon, FruitIcon, JarIcon, LockIcon, PowerIcon, SceneArt, StarIcon, SoundIcon, MusicIcon, VibrateIcon, PolicyIcon } from "./components/Art";
import splashImg from "./assets/splash_img.png";

type ShopCategory = keyof typeof SKINS;
type Overlay = "level" | "pause" | "complete" | "gameover" | "preview" | "confirm" | "reset" | "chest" | "privacy" | null;

const MAP_POSITIONS = [
  [20, 84], [48, 77], [79, 70], [67, 61], [34, 55],
  [18, 46], [42, 38], [76, 31], [62, 21], [30, 14],
] as const;

const SHOP_LABELS: Record<ShopCategory, string> = {
  fruit: "Fruit Skins",
  jars: "Jars",
  backgrounds: "Backgrounds",
  powerups: "Power-ups",
  chests: "Chests",
};

const EMPTY_STATS: GameStats = { score: 0, combo: 0, current: 0, next: 1, goalProgress: 0, goalTarget: 1, warning: false };
const rarityClass = (rarity: string) => `rarity-${rarity.toLowerCase()}`;

function ArrowIcon({ direction = "left" }: { direction?: "left" | "right" }) {
  return <svg viewBox="0 0 40 40" className={direction === "right" ? "flip-x" : ""} aria-hidden="true"><path d="M24 8 L12 20 L24 32" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 11 L29 29 M29 11 L11 29" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg>;
}

function GearIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M27 5 h10 l2 8 l7 4 l8-2 l5 9 l-6 6 v8 l6 6 l-5 9 l-8-2 l-7 4 l-2 8 H27 l-2-8 l-7-4 l-8 2 l-5-9 l6-6 v-8 l-6-6 l5-9 l8 2 l7-4z" fill="#fff4dc" stroke="#6f4b37" strokeWidth="4"/><circle cx="32" cy="34" r="10" fill="#ff9b5c" stroke="#6f4b37" strokeWidth="4"/></svg>;
}

function HomeIcon() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 31 L32 8 L57 31 V57 H39 V41 H25 V57 H7Z" fill="#fff3dd" stroke="#6f4b37" strokeWidth="5" strokeLinejoin="round"/><path d="M4 33 L32 6 L60 33" fill="none" stroke="#ff7d67" strokeWidth="8" strokeLinecap="round"/></svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`logo ${compact ? "logo-compact" : ""}`}>
    <div className="logo-leaf" />
    <div className="logo-main">Orchardly</div>
    <div className="logo-sub">FRUIT MERGE</div>
  </div>;
}

function CoinCounter({ coins, pulse }: { coins: number; pulse: number }) {
  return <div className={`coin-counter ${pulse ? "counter-pop" : ""}`} key={`${coins}-${pulse}`}><CoinIcon /><strong>{coins.toLocaleString()}</strong></div>;
}

function AppButton({ children, onClick, tone = "coral", className = "", disabled = false }: { children: React.ReactNode; onClick?: () => void; tone?: "coral" | "green" | "gold" | "cream" | "purple"; className?: string; disabled?: boolean }) {
  return <button className={`juice-button tone-${tone} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function IconButton({ children, onClick, label, className = "" }: { children: React.ReactNode; onClick?: () => void; label: string; className?: string }) {
  return <button className={`icon-button ${className}`} onClick={onClick} aria-label={label}>{children}</button>;
}

function Screen({ name, active, children, className = "" }: { name: ScreenName; active: boolean; children: React.ReactNode; className?: string }) {
  return <section className={`screen screen-${name} ${active ? "is-active" : ""} ${className}`} aria-hidden={!active}>{children}</section>;
}

function Modal({ children, className = "", onClose }: { children: React.ReactNode; className?: string; onClose?: () => void }) {
  return <div className="modal-layer" role="dialog" aria-modal="true" onPointerDown={(event) => { if (event.target === event.currentTarget && onClose) onClose(); }}><div className={`modal-panel ${className}`}>{children}</div></div>;
}

function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: `${(i * 43) % 100}%`, backgroundColor: `hsl(${i * 39} 80% 60%)`, animationDuration: `${1.8 + (i % 4) * .25}s`, animationDelay: `${(i % 5) * .08}s` }} />)}</div>;
}

function App() {
  const initialSave = useRef(loadSave()).current;
  const [screen, setScreen] = useState<ScreenName>("splash");
  const [save, setSave] = useState<SaveData>(initialSave);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [mapPage, setMapPage] = useState(() => Math.min(5, Math.floor((initialSave.unlockedLevel - 1) / 10)));
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(LEVELS[0]);
  const [gameMode, setGameMode] = useState<"level" | "endless">("level");
  const [activeLevel, setActiveLevel] = useState<LevelConfig | undefined>(LEVELS[0]);
  const [runKey, setRunKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [result, setResult] = useState<RunResult | null>(null);
  const [coinPulse, setCoinPulse] = useState(0);
  const [shopCategory, setShopCategory] = useState<ShopCategory>("fruit");
  const [shopPage, setShopPage] = useState(0);
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [howPage, setHowPage] = useState(0);
  const [collectionPage, setCollectionPage] = useState(0);
  const [chestReward, setChestReward] = useState<{ item?: ShopItem; coins?: number } | null>(null);
  const [mascotMoving, setMascotMoving] = useState(false);
  const [toast, setToast] = useState("");
  const touchStart = useRef<number | null>(null);
  const gameRef = useRef<GameHandle>(null);
  const finishHandled = useRef(false);

  const updateSave = useCallback((updater: (previous: SaveData) => SaveData) => {
    setSave((previous) => {
      const next = updater(previous);
      persistSave(next);
      return next;
    });
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const go = useCallback((next: ScreenName) => {
    audio.play("button");
    setOverlay(null);
    setScreen(next);
  }, []);

  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const durationMs = 2400;
    let animFrame: number;
    let timerId: number;

    const animateProgress = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progressFraction = Math.min(1, elapsed / durationMs);
      // Smooth ease-out cubic curve for natural gaming loading feel
      const curvedProgress = 1 - Math.pow(1 - progressFraction, 2.2);
      const percent = Math.min(100, Math.round(curvedProgress * 100));
      setLoadingProgress(percent);

      if (progressFraction < 1) {
        animFrame = requestAnimationFrame(animateProgress);
      } else {
        setLoadingProgress(100);
        timerId = window.setTimeout(() => {
          setScreen("home");
        }, 300);
      }
    };

    animFrame = requestAnimationFrame(animateProgress);
    return () => {
      cancelAnimationFrame(animFrame);
      window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    audio.configure(save.settings.sound, save.settings.music, save.settings.vibration);
  }, [save.settings.music, save.settings.sound, save.settings.vibration]);

  // Keep screen awake while playing game so phone doesn't sleep/lock
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestLock = async () => {
      try {
        if ("wakeLock" in navigator && screen === "game" && !paused) {
          wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
        }
      } catch {
        // WakeLock unsupported or rejected
      }
    };
    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && screen === "game" && !paused) {
        requestLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    };
  }, [screen, paused]);

  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    const preventMenu = (event: Event) => event.preventDefault();
    document.addEventListener("contextmenu", preventMenu);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      document.removeEventListener("contextmenu", preventMenu);
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && screen === "game" && !paused && !result) {
        setPaused(true);
        setOverlay("pause");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [paused, result, screen]);

  const currentWorld = WORLDS[mapPage];
  const mapLevels = LEVELS.slice(mapPage * 10, mapPage * 10 + 10);
  const daily = claimStatus(save);
  const worldForGame = activeLevel ? WORLDS[activeLevel.world] : WORLDS[0];
  // Apply equipped skins directly from shop!
  const gameScene = save.equipped.background && save.equipped.background !== "orchard" ? save.equipped.background : (activeLevel ? worldForGame.scene : "orchard");
  const gameJar = save.equipped.jar && save.equipped.jar !== "glass" ? save.equipped.jar : (activeLevel ? worldForGame.jar : "glass");
  const shopItems = SKINS[shopCategory];
  const shopPageCount = Math.ceil(shopItems.length / 6);
  const shownShopItems = shopItems.slice(shopPage * 6, shopPage * 6 + 6);

  const startLevel = (level: LevelConfig) => {
    finishHandled.current = false;
    setSelectedLevel(level);
    setActiveLevel(level);
    setGameMode("level");
    setStats({ ...EMPTY_STATS, goalTarget: level.goal.target, dropsLeft: level.drops });
    setResult(null);
    setPaused(false);
    setOverlay(null);
    setRunKey((value) => value + 1);
    setScreen("game");
  };

  const startEndless = () => {
    finishHandled.current = false;
    setActiveLevel(undefined);
    setGameMode("endless");
    setStats(EMPTY_STATS);
    setResult(null);
    setPaused(false);
    setOverlay(null);
    setRunKey((value) => value + 1);
    setScreen("game");
  };

  const handleFinish = useCallback((run: RunResult) => {
    if (finishHandled.current) return;
    finishHandled.current = true;
    const earned = run.won ? run.coins : Math.min(15, Math.floor(run.score / 700) * 3);
    const collectionFruit = activeLevel?.goal.fruit;
    updateSave((previous) => {
      const next: SaveData = {
        ...previous,
        coins: previous.coins + earned,
        bestScore: Math.max(previous.bestScore, run.score),
        missions: {
          ...previous.missions,
          progress: [
            Math.min(12, previous.missions.progress[0] + Math.max(1, Math.floor(run.score / 240))),
            Math.min(2500, previous.missions.progress[1] + run.score),
            Math.min(2, previous.missions.progress[2] + 1),
          ],
        },
      };
      if (run.won && run.level) {
        next.stars = { ...previous.stars, [run.level]: Math.max(previous.stars[run.level] || 0, run.stars) };
        next.levelScores = { ...previous.levelScores, [run.level]: Math.max(previous.levelScores[run.level] || 0, run.score) };
        next.unlockedLevel = Math.min(60, Math.max(previous.unlockedLevel, run.level + 1));
        if (collectionFruit !== undefined) next.collection = Array.from(new Set([...previous.collection, collectionFruit]));
      }
      return next;
    });
    if (earned) setCoinPulse((value) => value + 1);
    setResult({ ...run, coins: earned });
    setPaused(true);
    setOverlay(run.won ? "complete" : "gameover");
  }, [activeLevel?.goal.fruit, updateSave]);

  const retry = () => {
    finishHandled.current = false;
    setResult(null);
    setPaused(false);
    setOverlay(null);
    setStats(gameMode === "level" && activeLevel ? { ...EMPTY_STATS, goalTarget: activeLevel.goal.target, dropsLeft: activeLevel.drops } : EMPTY_STATS);
    setRunKey((value) => value + 1);
  };

  const revive = () => {
    if (save.coins < 25) {
      notify("You need 25 coins to revive");
      return;
    }
    updateSave((previous) => ({ ...previous, coins: previous.coins - 25 }));
    finishHandled.current = false;
    setResult(null);
    setPaused(false);
    setOverlay(null);
    gameRef.current?.revive();
    audio.play("purchase");
  };

  const goToMapWithMascot = () => {
    if (result?.level) setMapPage(Math.min(5, Math.floor((result.level - 1) / 10)));
    setOverlay(null);
    setScreen("map");
    setMascotMoving(true);
    window.setTimeout(() => setMascotMoving(false), 1200);
  };

  const nextLevel = () => {
    const id = result?.level || activeLevel?.id || 1;
    if (id >= LEVELS.length) goToMapWithMascot();
    else startLevel(LEVELS[id]);
  };

  const isOwned = (item: ShopItem) => save.owned.includes(item.id);
  const isEquipped = (item: ShopItem) => Object.values(save.equipped).includes(item.id);

  const equip = (item: ShopItem, category = shopCategory) => {
    updateSave((previous) => {
      const nextEquipped = { ...previous.equipped };
      if (category === "fruit") nextEquipped.fruit = item.id;
      if (category === "jars") nextEquipped.jar = item.id;
      if (category === "backgrounds") nextEquipped.background = item.id;
      return { ...previous, equipped: nextEquipped };
    });
    audio.play("unlock");
    notify(`${item.name} equipped!`);
  };

  const purchase = (item: ShopItem) => {
    if (save.coins < item.price) {
      setOverlay(null);
      setScreen("missions");
      notify(`Earn ${item.price - save.coins} more coins`);
      return;
    }
    if (shopCategory === "chests") {
      openChest(item);
      return;
    }
    updateSave((previous) => {
      const next: SaveData = { ...previous, coins: previous.coins - item.price };
      if (shopCategory === "powerups") {
        next.powerups = { ...previous.powerups, [item.id]: (previous.powerups[item.id] || 0) + 1 };
      } else {
        if (!next.owned.includes(item.id)) next.owned = [...previous.owned, item.id];
        if (shopCategory === "fruit") next.equipped.fruit = item.id;
        if (shopCategory === "jars") next.equipped.jar = item.id;
        if (shopCategory === "backgrounds") next.equipped.background = item.id;
      }
      return next;
    });
    audio.play("purchase");
    setCoinPulse((value) => value + 1);
    setOverlay(null);
    if (shopCategory !== "powerups") {
      audio.play("unlock");
      notify(`${item.name} unlocked & equipped!`);
    } else {
      notify(`${item.name} added to your bag`);
    }
  };

  const claimMilestoneChest = (levelId: number) => {
    if (save.claimedChests?.includes(levelId)) {
      notify("Bonus chest already collected! ✓");
      return;
    }
    const bonusAmount = levelId === 5 ? 60 : 100;
    updateSave((previous) => ({
      ...previous,
      coins: previous.coins + bonusAmount,
      claimedChests: [...(previous.claimedChests || []), levelId],
    }));
    audio.play("chest");
    setCoinPulse((value) => value + 1);
    setChestReward({
      item: { id: "levelChest", name: `Level ${levelId} Fruit Chest`, rarity: "Epic", price: 0, preview: "chest" },
      coins: bonusAmount,
    });
    setOverlay("chest");
  };

  const openChest = (chest: ShopItem) => {
    if (save.coins < chest.price) return;
    const roll = Math.random();
    const rarity = chest.id === "starChest" ? (roll < .5 ? "Legendary" : "Epic") : chest.id === "goldChest" ? (roll < .2 ? "Legendary" : roll < .72 ? "Epic" : "Rare") : (roll < .12 ? "Epic" : roll < .55 ? "Rare" : "Common");
    const pool = FRUIT_SKINS.filter((item) => item.rarity === rarity && item.price > 0);
    const won = pool[Math.floor(Math.random() * pool.length)] || FRUIT_SKINS[1];
    const duplicate = save.owned.includes(won.id);
    const refund = duplicate ? Math.max(35, Math.floor(won.price * .2)) : 0;
    updateSave((previous) => ({ ...previous, coins: previous.coins - chest.price + refund, owned: duplicate ? previous.owned : [...previous.owned, won.id] }));
    setChestReward(duplicate ? { item: won, coins: refund } : { item: won });
    setOverlay("chest");
    audio.play("chest");
    window.setTimeout(() => audio.play("unlock"), 700);
  };

  const claimDaily = () => {
    if (!daily.available) return;
    const rewards = [20, 25, 30, 40, 50, 70, 120];
    const amount = rewards[daily.streak - 1];
    const today = new Date().toISOString().slice(0, 10);
    updateSave((previous) => ({ ...previous, coins: previous.coins + amount, daily: { lastClaim: today, streak: daily.streak } }));
    setCoinPulse((value) => value + 1);
    audio.play("coin");
    notify(`Day ${daily.streak} reward: ${amount} coins`);
  };

  const claimMission = (index: number, reward: number) => {
    const targets = [12, 2500, 2];
    if (save.missions.progress[index] < targets[index] || save.missions.claimed[index]) return;
    updateSave((previous) => {
      const claimed = [...previous.missions.claimed];
      claimed[index] = true;
      return { ...previous, coins: previous.coins + reward, missions: { ...previous.missions, claimed } };
    });
    setCoinPulse((value) => value + 1);
    audio.play("coin");
  };

  const usePowerup = (kind: string) => updateSave((previous) => ({ ...previous, powerups: { ...previous.powerups, [kind]: Math.max(0, (previous.powerups[kind] || 0) - 1) } }));

  const awardGameCoins = useCallback((amount: number) => {
    updateSave((previous) => ({ ...previous, coins: previous.coins + amount }));
    setCoinPulse((value) => value + 1);
  }, [updateSave]);

  const touchPaging = (end: number, backward: () => void, forward: () => void) => {
    if (touchStart.current === null) return;
    const delta = end - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < 38) return;
    if (delta > 0) backward(); else forward();
  };

  const shareScore = async () => {
    const text = `I scored ${(result?.score || stats.score).toLocaleString()} in Orchardly: Fruit Merge!`;
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: "Orchardly: Fruit Merge", text });
      else await navigator.clipboard.writeText(text);
      notify(canShare ? "Score shared" : "Score copied");
    } catch {
      notify("Sharing was canceled");
    }
  };

  const updateSetting = (key: keyof SaveData["settings"]) => {
    updateSave((previous) => ({ ...previous, settings: { ...previous.settings, [key]: !previous.settings[key] } }));
  };

  return <main id="app-shell" onPointerDown={() => audio.unlock()}>
    <div className="ambient-fruit ambient-one"><FruitIcon level={0} skin={save.equipped.fruit} /></div>
    <div className="ambient-fruit ambient-two"><FruitIcon level={3} skin={save.equipped.fruit} /></div>
    <div className="ambient-sparkle sparkle-one" />
    <div className="ambient-sparkle sparkle-two" />

    <Screen name="splash" active={screen === "splash"}>
      <img src={splashImg} alt="Orchardly Fruit Merge Splash" className="splash-bg-image" />
      <div className="splash-footer">
        <div className="gaming-loader">
          <div className="gaming-loader-track">
            <div className="gaming-loader-fill" style={{ width: `${loadingProgress}%` }}>
              <div className="gaming-loader-shine" />
            </div>
          </div>
          <div className="gaming-loader-info">
            <span className="gaming-loader-label">Loading Game...</span>
            <span className="gaming-loader-percent">{loadingProgress}%</span>
          </div>
        </div>
      </div>
    </Screen>

    <Screen name="home" active={screen === "home"}>
      <SceneArt scene={save.equipped.background} className="scene-art" />
      <header className="home-topbar">
        <CoinCounter coins={save.coins} pulse={coinPulse} />
        <IconButton label="Settings" onClick={() => go("settings")}><GearIcon /></IconButton>
      </header>
      <div className="home-content">
        <Logo />
        <div className="home-fruit-stage">
          <span className="fruit-stage-leaf" />
          <FruitIcon level={6} skin={save.equipped.fruit} className="home-fruit pear" />
          <FruitIcon level={4} skin={save.equipped.fruit} className="home-fruit orange" />
          <FruitIcon level={0} skin={save.equipped.fruit} className="home-fruit cherry" />
        </div>
        <AppButton className="play-button" tone="coral" onClick={() => go("map")}><span>PLAY</span><small>Continue level {save.unlockedLevel}</small></AppButton>
        <div className="home-actions">
          <AppButton tone="green" onClick={() => go("map")}>Levels</AppButton>
          <AppButton tone="purple" onClick={startEndless}>Endless</AppButton>
          <AppButton tone="gold" onClick={() => go("shop")}>Shop</AppButton>
          <AppButton tone="cream" onClick={() => go("daily")}>Daily {daily.available && <i className="notification-dot" />}</AppButton>
        </div>
        <div className="home-links">
          <button onClick={() => go("missions")}>Missions</button><span />
          <button onClick={() => go("collection")}>Collection</button><span />
          <button onClick={() => go("how")}>How to play</button>
        </div>
        <div className="best-ribbon"><StarIcon /> Best {save.bestScore.toLocaleString()}</div>
      </div>
    </Screen>

    <Screen name="map" active={screen === "map"} className={`world-${currentWorld.scene}`}>
      <SceneArt scene={currentWorld.scene} className="scene-art" />
      <header className="screen-header map-header">
        <IconButton label="Home" onClick={() => go("home")}><HomeIcon /></IconButton>
        <div className="world-title"><small>WORLD {mapPage + 1}</small><h1>{currentWorld.name}</h1><p>{currentWorld.subtitle}</p></div>
        <CoinCounter coins={save.coins} pulse={coinPulse} />
      </header>
      <div className="map-stage" onPointerDown={(event) => { touchStart.current = event.clientX; }} onPointerUp={(event) => touchPaging(event.clientX, () => setMapPage((p) => Math.max(0, p - 1)), () => setMapPage((p) => Math.min(5, p + 1)))}>
        <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M20 84 C35 80 62 76 79 70 S83 63 67 61 S40 58 34 55 S11 51 18 46 S35 40 42 38 S79 36 76 31 S68 24 62 21 S40 16 30 14" /></svg>
        {mapLevels.map((mapLevel, index) => {
          const unlocked = mapLevel.id <= save.unlockedLevel;
          const completed = Boolean(save.stars[mapLevel.id]);
          const current = mapLevel.id === save.unlockedLevel;
          const [x, y] = MAP_POSITIONS[index];
          return <button key={mapLevel.id} className={`level-node ${unlocked ? "unlocked" : "locked"} ${completed ? "completed" : ""} ${current ? "current" : ""} ${mapLevel.boss ? "boss" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} disabled={!unlocked} onClick={() => { setSelectedLevel(mapLevel); setOverlay("level"); audio.play("button"); }} aria-label={`Level ${mapLevel.id}${unlocked ? "" : " locked"}`}>
            <span className="node-leaf" />
            {mapLevel.boss && <ChestIcon className="node-chest" gold={index === 9} />}
            {unlocked ? <strong>{mapLevel.id}</strong> : <LockIcon className="node-lock" />}
            {completed && <span className="node-stars">{[0, 1, 2].map((star) => <StarIcon key={star} filled={star < save.stars[mapLevel.id]} />)}</span>}
            {current && <span className={`node-mascot ${mascotMoving ? "walking" : ""}`}><FruitIcon level={0} skin={save.equipped.fruit} /></span>}
          </button>;
        })}
      </div>
      <footer className="pager-footer map-pager">
        <IconButton label="Previous world" onClick={() => setMapPage((page) => Math.max(0, page - 1))} className={mapPage === 0 ? "is-disabled" : ""}><ArrowIcon /></IconButton>
        <div className="page-dots">{WORLDS.map((world, index) => <button key={world.id} className={index === mapPage ? "active" : ""} onClick={() => setMapPage(index)} aria-label={`Go to ${world.name}`} />)}</div>
        <IconButton label="Next world" onClick={() => setMapPage((page) => Math.min(5, page + 1))} className={mapPage === 5 ? "is-disabled" : ""}><ArrowIcon direction="right" /></IconButton>
      </footer>
      {!save.hints.map && <div className="hint-bubble map-hint"><button onClick={() => updateSave((previous) => ({ ...previous, hints: { ...previous.hints, map: true } }))}><CloseIcon /></button>Swipe to explore six fruity worlds.</div>}
    </Screen>

    <Screen name="game" active={screen === "game"} className={stats.warning ? "danger-warning" : ""}>
      <SceneArt key={gameScene} scene={gameScene} className="scene-art game-backdrop" />
      {screen === "game" && <GameCanvas key={runKey} ref={gameRef} mode={gameMode} level={activeLevel} skin={save.equipped.fruit} jar={gameJar} paused={paused} vibration={save.settings.vibration} onStats={setStats} onFinish={handleFinish} onUsePower={usePowerup} onCoinReward={awardGameCoins} />}
      <header className="game-hud">
        <IconButton label="Pause" onClick={() => { setPaused(true); setOverlay("pause"); }}><span className="pause-mark">II</span></IconButton>
        <div className="score-board"><small>SCORE</small><strong>{stats.score.toLocaleString()}</strong>{stats.combo > 1 && <em>Combo x{stats.combo}</em>}</div>
        <div className="next-preview"><small>NEXT</small><FruitIcon level={stats.next} skin={save.equipped.fruit} /></div>
      </header>
      <div className="goal-hud"><div><strong>{gameMode === "level" && activeLevel ? goalText(activeLevel) : "Endless orchard"}</strong>{stats.dropsLeft !== undefined && <span>{stats.dropsLeft} drops</span>}</div><div className="goal-track"><i style={{ width: `${gameMode === "endless" ? Math.min(100, (stats.score % 1000) / 10) : Math.min(100, stats.goalProgress / Math.max(1, stats.goalTarget) * 100)}%` }} /></div></div>
      <div className="power-dock">{POWERUPS.map((power) => <button key={power.id} disabled={!save.powerups[power.id] || paused} onClick={() => gameRef.current?.usePower(power.id)} aria-label={power.name}><PowerIcon kind={power.id} /><span>{save.powerups[power.id] || 0}</span><small>{power.name}</small></button>)}</div>
      {!save.hints.game && <div className="hint-bubble game-hint"><button onClick={() => updateSave((previous) => ({ ...previous, hints: { ...previous.hints, game: true } }))}><CloseIcon /></button>Slide to aim, then tap the jar to drop.</div>}
    </Screen>

    <Screen name="shop" active={screen === "shop"}>
      <div className="shop-awning"><i /><i /><i /><i /><i /><i /></div>
      <header className="screen-header shop-header"><IconButton label="Back" onClick={() => go("home")}><ArrowIcon /></IconButton><div><small>FRESH PICKS</small><h1>Orchard Shop</h1></div><CoinCounter coins={save.coins} pulse={coinPulse} /></header>
      <nav className="shop-tabs">{(Object.keys(SHOP_LABELS) as ShopCategory[]).map((category) => <button key={category} className={shopCategory === category ? "active" : ""} onClick={() => { setShopCategory(category); setShopPage(0); }}>{SHOP_LABELS[category]}</button>)}</nav>
      <div className="shop-grid" onPointerDown={(event) => { touchStart.current = event.clientX; }} onPointerUp={(event) => touchPaging(event.clientX, () => setShopPage((page) => Math.max(0, page - 1)), () => setShopPage((page) => Math.min(shopPageCount - 1, page + 1)))}>
        {shownShopItems.map((item) => <button key={item.id} className={`shop-card ${rarityClass(item.rarity)} ${isEquipped(item) ? "equipped" : ""}`} onClick={() => { setPreviewItem(item); setOverlay("preview"); }}>
          <span className="rarity-ribbon">{item.rarity}</span><span className="item-art">
            {shopCategory === "fruit" && <FruitIcon level={(shopItems.indexOf(item) + 2) % 11} skin={item.id} />}
            {shopCategory === "jars" && <JarIcon kind={item.preview} />}
            {shopCategory === "backgrounds" && <span className="background-thumb"><SceneArt scene={item.preview} /></span>}
            {shopCategory === "powerups" && <PowerIcon kind={item.id} />}
            {shopCategory === "chests" && <ChestIcon gold={item.rarity !== "Common"} />}
          </span><strong>{item.name}</strong><span className="item-state">{isEquipped(item) ? "Equipped" : isOwned(item) && shopCategory !== "powerups" ? "Owned" : <><CoinIcon /> {item.price}</>}</span>{shopCategory === "powerups" && <b className="stock-badge">x{save.powerups[item.id] || 0}</b>}
        </button>)}
      </div>
      <footer className="pager-footer shop-pager"><IconButton label="Previous page" className={shopPage === 0 ? "is-disabled" : ""} onClick={() => setShopPage((page) => Math.max(0, page - 1))}><ArrowIcon /></IconButton><div className="page-dots">{Array.from({ length: shopPageCount }, (_, index) => <button key={index} className={index === shopPage ? "active" : ""} onClick={() => setShopPage(index)} />)}</div><IconButton label="Next page" className={shopPage === shopPageCount - 1 ? "is-disabled" : ""} onClick={() => setShopPage((page) => Math.min(shopPageCount - 1, page + 1))}><ArrowIcon direction="right" /></IconButton></footer>
      {!save.hints.shop && <div className="hint-bubble shop-hint"><button onClick={() => updateSave((previous) => ({ ...previous, hints: { ...previous.hints, shop: true } }))}><CloseIcon /></button>Tap any item for a live preview.</div>}
    </Screen>

    <Screen name="daily" active={screen === "daily"}>
      <SceneArt scene="orchard" className="scene-art" />
      <header className="screen-header simple-header"><IconButton label="Back" onClick={() => go("home")}><ArrowIcon /></IconButton><h1>Daily Picnic</h1><CoinCounter coins={save.coins} pulse={coinPulse} /></header>
      <div className="daily-content"><div className="daily-mascot"><FruitIcon level={5} skin={save.equipped.fruit} /><span className="basket"><ChestIcon /></span></div><div className="section-title"><small>{daily.available ? "WELCOME BACK" : "COME BACK TOMORROW"}</small><h2>{daily.streak || save.daily.streak || 1} day streak</h2><p>Visit each day to grow the reward.</p></div>
        <div className="reward-week">{[20, 25, 30, 40, 50, 70, 120].map((amount, index) => { const day = index + 1; const claimed = !daily.available && day <= save.daily.streak; const current = daily.available ? day === daily.streak : day === save.daily.streak; return <div key={day} className={`${current ? "current" : ""} ${claimed ? "claimed" : ""}`}><small>DAY {day}</small><CoinIcon /><strong>{amount}</strong>{claimed && <span className="checkmark">OK</span>}</div>; })}</div>
        <AppButton tone="gold" onClick={claimDaily} disabled={!daily.available}>{daily.available ? `Claim day ${daily.streak}` : "Reward claimed"}</AppButton>
      </div>
    </Screen>

    <Screen name="missions" active={screen === "missions"}>
      <SceneArt scene="kitchen" className="scene-art" />
      <header className="screen-header simple-header"><IconButton label="Back" onClick={() => go("home")}><ArrowIcon /></IconButton><h1>Daily Missions</h1><CoinCounter coins={save.coins} pulse={coinPulse} /></header>
      <div className="missions-content"><div className="section-title"><small>FRESH EVERY DAY</small><h2>Fill your coin basket</h2><p>Complete three bite-sized orchard jobs.</p></div>
        {[{ name: "Merge master", text: "Make 12 fruit merges", target: 12, reward: 25, icon: "shake" }, { name: "Juicy score", text: "Score 2,500 points", target: 2500, reward: 35, icon: "upgrade" }, { name: "Two baskets", text: "Play 2 games", target: 2, reward: 30, icon: "swap" }].map((mission, index) => { const progress = Math.min(mission.target, save.missions.progress[index]); const ready = progress >= mission.target; return <div className="mission-row" key={mission.name}><span className="mission-illustration"><PowerIcon kind={mission.icon} /></span><div><strong>{mission.name}</strong><small>{mission.text}</small><div className="mini-track"><i style={{ width: `${progress / mission.target * 100}%` }} /></div><em>{progress.toLocaleString()} / {mission.target.toLocaleString()}</em></div><button className={ready ? "ready" : ""} disabled={!ready || save.missions.claimed[index]} onClick={() => claimMission(index, mission.reward)}>{save.missions.claimed[index] ? "Claimed" : <><CoinIcon /> {mission.reward}</>}</button></div>; })}
        <p className="mission-note">Rewarded bonus hook: <button onClick={() => notify("Connect your ad provider here for +20 coins")}>Earn +20</button></p>
      </div>
    </Screen>

    <Screen name="collection" active={screen === "collection"}>
      <header className="screen-header simple-header collection-header"><IconButton label="Back" onClick={() => go("home")}><ArrowIcon /></IconButton><div><small>FRUIT JOURNAL</small><h1>Collection</h1></div><span className="collection-count">{save.collection.length}/11</span></header>
      <div className="collection-display">{FRUITS.slice(collectionPage * 6, collectionPage * 6 + 6).map((fruit, localIndex) => { const level = collectionPage * 6 + localIndex; const unlocked = save.collection.includes(level); return <div className={`collection-entry ${unlocked ? "unlocked" : "locked"}`} key={fruit.name}>{unlocked ? <FruitIcon level={level} skin={save.equipped.fruit} /> : <><FruitIcon level={level} skin="classic" /><LockIcon className="collection-lock" /></>}<strong>{unlocked ? fruit.name : "Mystery fruit"}</strong><small>{unlocked ? `Worth ${fruit.points} points` : "Merge to discover"}</small></div>; })}</div>
      <footer className="pager-footer collection-pager"><IconButton label="Previous" className={collectionPage === 0 ? "is-disabled" : ""} onClick={() => setCollectionPage(0)}><ArrowIcon /></IconButton><div className="page-dots"><button className={collectionPage === 0 ? "active" : ""} onClick={() => setCollectionPage(0)} /><button className={collectionPage === 1 ? "active" : ""} onClick={() => setCollectionPage(1)} /></div><IconButton label="Next" className={collectionPage === 1 ? "is-disabled" : ""} onClick={() => setCollectionPage(1)}><ArrowIcon direction="right" /></IconButton></footer>
    </Screen>

    <Screen name="how" active={screen === "how"}>
      <header className="screen-header simple-header"><IconButton label="Back" onClick={() => go("home")}><ArrowIcon /></IconButton><h1>How to Play</h1><span /></header>
      <div className="how-slider" onPointerDown={(event) => { touchStart.current = event.clientX; }} onPointerUp={(event) => touchPaging(event.clientX, () => setHowPage((page) => Math.max(0, page - 1)), () => setHowPage((page) => Math.min(3, page + 1)))}><div className="how-track" style={{ transform: `translateX(-${howPage * 100}%)` }}>
        <article><div className="how-art aim-art"><FruitIcon level={0} /><span className="drop-line" /><JarIcon /></div><small>STEP 1</small><h2>Aim and drop</h2><p>Slide left or right to choose a spot. Tap anywhere in the jar to drop your fruit.</p></article>
        <article><div className="how-art merge-art"><FruitIcon level={3} /><b>+</b><FruitIcon level={3} /><b>=</b><FruitIcon level={4} /></div><small>STEP 2</small><h2>Match and merge</h2><p>Two matching fruits pop into the next bigger fruit. Quick chains build a score combo.</p></article>
        <article><div className="how-art danger-art"><span className="danger-demo">DANGER</span><FruitIcon level={7} worried /><PowerIcon kind="hammer" /></div><small>STEP 3</small><h2>Keep it tidy</h2><p>Do not let settled fruit cross the danger line. Power-ups can rescue a crowded jar.</p></article>
        <article><div className="how-art juice-art"><JarIcon kind="glass" /><FruitIcon level={4} /></div><small>STEP 4</small><h2>Fill the Juice Jar</h2><p>Every merge squeezes delicious fresh juice into your jar! Reach 100% juice to complete the level and earn 3 stars.</p></article>
      </div></div>
      <footer className="how-footer"><div className="page-dots">{[0,1,2,3].map((index) => <button key={index} className={howPage === index ? "active" : ""} onClick={() => setHowPage(index)} />)}</div><AppButton onClick={() => howPage < 3 ? setHowPage(howPage + 1) : go("home")} tone="green">{howPage < 3 ? "Next" : "Let's play"}</AppButton></footer>
    </Screen>

    <Screen name="settings" active={screen === "settings"}>
      <SceneArt scene="kitchen" className="scene-art" />
      <header className="screen-header simple-header"><IconButton label="Back" onClick={() => go("home")}><ArrowIcon /></IconButton><h1>Settings</h1><span /></header>
      <div className="settings-content">
        <div className="settings-glass-panel">
          <div className="settings-mascot">
            <FruitIcon level={2} skin={save.equipped.fruit} />
            <div className="settings-mascot-text">
              <h2>Make it yours</h2>
              <p>Audio, haptics & privacy options</p>
            </div>
          </div>

          <div className="settings-items">
            <button className="setting-card-row" onClick={() => updateSetting("sound")}>
              <div className="setting-card-icon sound-bg"><SoundIcon /></div>
              <div className="setting-card-info">
                <strong>Sound Effects</strong>
                <small>Pops, merges, drops & UI sounds</small>
              </div>
              <i className={`toggle ${save.settings.sound ? "on" : ""}`}><b /></i>
            </button>

            <button className="setting-card-row" onClick={() => updateSetting("music")}>
              <div className="setting-card-icon music-bg"><MusicIcon /></div>
              <div className="setting-card-info">
                <strong>Background Music</strong>
                <small>Relaxing chill acoustic melodies</small>
              </div>
              <i className={`toggle ${save.settings.music ? "on" : ""}`}><b /></i>
            </button>

            <button className="setting-card-row" onClick={() => updateSetting("vibration")}>
              <div className="setting-card-icon vibrate-bg"><VibrateIcon /></div>
              <div className="setting-card-info">
                <strong>Haptic Vibration</strong>
                <small>Gentle tactile drop & merge pulses</small>
              </div>
              <i className={`toggle ${save.settings.vibration ? "on" : ""}`}><b /></i>
            </button>
          </div>

          <div className="settings-actions">
            <button className="settings-action-btn privacy-action" onClick={() => setOverlay("privacy")}>
              <span className="action-btn-icon"><PolicyIcon /></span>
              <span>Privacy Policy</span>
            </button>
            <button className="settings-action-btn tutorial-action" onClick={() => go("how")}>
              <span>📖 Replay Tutorial</span>
            </button>
          </div>

          <button className="reset-button" onClick={() => setOverlay("reset")}>Reset all progress</button>
          <p className="version">Orchardly v1.0.2 - Offline edition</p>
        </div>
      </div>
    </Screen>

    {overlay === "level" && <Modal onClose={() => setOverlay(null)} className="level-modal"><IconButton label="Close" className="modal-close" onClick={() => setOverlay(null)}><CloseIcon /></IconButton><div className="level-popup-art"><JarIcon kind={WORLDS[selectedLevel.world].jar} /><FruitIcon level={selectedLevel.goal.fruit ?? 4} skin={save.equipped.fruit} /></div><small>LEVEL {selectedLevel.id}</small><h2>{selectedLevel.boss ? "Bonus Harvest" : "Fruit Basket"}</h2><p>{goalText(selectedLevel)}</p>{selectedLevel.drops && <div className="drop-limit">Finish in {selectedLevel.drops} drops</div>}<div className="best-stars"><span>BEST</span>{[0,1,2].map((star) => <StarIcon key={star} filled={star < (save.stars[selectedLevel.id] || 0)} />)}</div>{selectedLevel.boss && (
      <button
        type="button"
        className={`boss-bonus-box ${save.claimedChests?.includes(selectedLevel.id) ? "is-claimed" : "can-claim"}`}
        onClick={() => claimMilestoneChest(selectedLevel.id)}
      >
        <div className="boss-bonus-chest"><ChestIcon gold /></div>
        <div className="boss-bonus-details">
          <strong>{save.claimedChests?.includes(selectedLevel.id) ? "Bonus Chest Claimed ✓" : "Tap Chest to Open!"}</strong>
          <small>{save.claimedChests?.includes(selectedLevel.id) ? "Coins collected" : `+${selectedLevel.coins || 60} Bonus Coins`}</small>
        </div>
      </button>
    )}<AppButton tone="green" onClick={() => startLevel(selectedLevel)}>Start</AppButton></Modal>}

    {overlay === "pause" && <Modal className="pause-modal"><FruitIcon level={4} skin={save.equipped.fruit} /><small>TAKE A BREATH</small><h2>Game Paused</h2><AppButton tone="green" onClick={() => { setPaused(false); setOverlay(null); }}>Keep playing</AppButton><AppButton tone="cream" onClick={retry}>Restart</AppButton><button className="text-button" onClick={() => { setPaused(false); go(gameMode === "level" ? "map" : "home"); }}>Leave game</button></Modal>}

    {overlay === "complete" && result && <Modal className="complete-modal"><Confetti /><div className="complete-glow"><JarIcon kind={gameJar} /></div><small>LEVEL {result.level} COMPLETE</small><h2>Sweet harvest!</h2><div className="result-stars">{[0,1,2].map((star) => <StarIcon key={star} filled={star < result.stars} />)}</div><div className="result-score"><span>SCORE<strong>{result.score.toLocaleString()}</strong></span><span>REWARD<strong><CoinIcon /> {result.coins}</strong></span></div><AppButton tone="green" onClick={nextLevel}>Next level</AppButton><button className="text-button" onClick={goToMapWithMascot}>Back to map</button></Modal>}

    {overlay === "gameover" && result && <Modal className="gameover-modal"><FruitIcon level={7} skin={save.equipped.fruit} worried /><small>{result.reason === "drops" ? "OUT OF DROPS" : "JAR OVERFLOWED"}</small><h2>So close!</h2><p>Score <strong>{result.score.toLocaleString()}</strong></p>{result.coins > 0 && <div className="earned-coins"><CoinIcon /> +{result.coins} earned</div>}<AppButton tone="gold" onClick={revive}><CoinIcon /> Revive for 25</AppButton><AppButton tone="green" onClick={retry}>Try again</AppButton><div className="modal-links"><button onClick={shareScore}>Share</button><button onClick={() => go(gameMode === "level" ? "map" : "home")}>Leave</button></div></Modal>}

    {overlay === "preview" && previewItem && <Modal onClose={() => setOverlay(null)} className="preview-modal"><IconButton label="Close" className="modal-close" onClick={() => setOverlay(null)}><CloseIcon /></IconButton><span className={`preview-rarity ${rarityClass(previewItem.rarity)}`}>{previewItem.rarity}</span><h2>{previewItem.name}</h2><div className="live-preview">
      {shopCategory === "fruit" && <div className="fruit-chain-preview">{FRUITS.map((_, index) => <FruitIcon key={index} level={index} skin={previewItem.id} />)}</div>}
      {shopCategory === "jars" && <div className="mini-game-preview"><JarIcon kind={previewItem.preview} /><FruitIcon level={4} skin={save.equipped.fruit} /></div>}
      {shopCategory === "backgrounds" && <div className="mini-background-preview"><SceneArt scene={previewItem.preview} /><JarIcon kind={save.equipped.jar} /></div>}
      {shopCategory === "powerups" && <div className="large-power-preview"><PowerIcon kind={previewItem.id} /><span>Stock: {save.powerups[previewItem.id] || 0}</span></div>}
      {shopCategory === "chests" && <div className="large-chest-preview"><ChestIcon gold={previewItem.rarity !== "Common"} /><span>Contains one random fruit skin</span></div>}
    </div>{isOwned(previewItem) && shopCategory !== "powerups" && shopCategory !== "chests" ? <AppButton tone="green" disabled={isEquipped(previewItem)} onClick={() => { equip(previewItem); setOverlay(null); }}>{isEquipped(previewItem) ? "Equipped" : "Equip"}</AppButton> : <AppButton tone="gold" onClick={() => setOverlay("confirm")}><CoinIcon /> {previewItem.price} - {shopCategory === "powerups" ? "Add one" : shopCategory === "chests" ? "Open chest" : "Buy"}</AppButton>}</Modal>}

    {overlay === "confirm" && previewItem && <Modal className="confirm-modal"><div className="confirm-art">{shopCategory === "chests" ? <ChestIcon gold /> : shopCategory === "powerups" ? <PowerIcon kind={previewItem.id} /> : <FruitIcon level={5} skin={shopCategory === "fruit" ? previewItem.id : save.equipped.fruit} />}</div><h2>Bring it home?</h2><p>{save.coins >= previewItem.price ? `Buy ${previewItem.name} for ${previewItem.price} coins?` : `You are ${previewItem.price - save.coins} coins short.`}</p>{save.coins >= previewItem.price ? <AppButton tone="gold" onClick={() => purchase(previewItem)}><CoinIcon /> Confirm purchase</AppButton> : <AppButton tone="green" onClick={() => { setOverlay(null); go("missions"); }}>Earn more</AppButton>}<button className="text-button" onClick={() => setOverlay("preview")}>Not now</button></Modal>}

    {overlay === "chest" && chestReward && <Modal className="chest-modal"><div className="chest-opening"><ChestIcon gold /><span className="chest-rays" /></div><small>CHEST OPENED</small><h2>{chestReward.item?.name}</h2>{chestReward.item && <FruitIcon level={6} skin={chestReward.item.id} />}{chestReward.coins ? <p>Duplicate converted to <strong>{chestReward.coins} coins</strong>.</p> : <p>A new fruit skin joined your collection.</p>}<AppButton tone="green" onClick={() => setOverlay(null)}>Lovely!</AppButton></Modal>}

    {overlay === "reset" && <Modal className="confirm-modal"><FruitIcon level={0} worried /><h2>Reset everything?</h2><p>Levels, coins, purchases and scores will return to the beginning. This cannot be undone.</p><AppButton tone="coral" onClick={() => { clearSave(); const fresh = defaultSave(); setSave(fresh); persistSave(fresh); setOverlay(null); setScreen("home"); }}>Yes, reset</AppButton><button className="text-button" onClick={() => setOverlay(null)}>Keep my orchard</button></Modal>}

    {overlay === "privacy" && <Modal onClose={() => setOverlay(null)} className="privacy-modal">
      <IconButton label="Close" className="modal-close" onClick={() => setOverlay(null)}><CloseIcon /></IconButton>
      <small>OFFLINE & CHILD-FRIENDLY</small>
      <h2>Privacy Policy</h2>
      <div className="privacy-scroll">
        <p><strong>Orchardly: Fruit Merge</strong> values your privacy. We are fully committed to protecting your rights and providing a safe, offline gaming experience.</p>
        <h3>1. Zero Personal Data Collection</h3>
        <p>We do NOT collect, transmit, store, sell, or share any personal identifying information (PII), names, emails, phone numbers, or device locations.</p>
        <h3>2. Local Device Storage</h3>
        <p>Your level progression, high scores, collected coins, unlocked skins, and sound preferences are stored solely on your local device.</p>
        <h3>3. Family & Children Safety</h3>
        <p>Our game is designed for all audiences and complies with Google Play Families Policy and COPPA standards. No inappropriate content is shown.</p>
        <h3>4. Permissions</h3>
        <p>Only VIBRATE (tactile feedback on fruit merges) and WAKE_LOCK (keeps screen active during gameplay) are used.</p>
        <h3>5. Contact</h3>
        <p>If you have any questions, contact us at <strong>support@orchardlygames.com</strong>.</p>
      </div>
      <AppButton tone="green" onClick={() => setOverlay(null)}>I Understand</AppButton>
    </Modal>}

    {coinPulse > 0 && <div className="flying-coins" key={coinPulse}>{[0,1,2].map((coin) => <CoinIcon key={coin} style={{ left: `${40 + coin * 9}%`, animationDelay: `${coin * .08}s` }} />)}</div>}
    {toast && <div className="toast-message">{toast}</div>}
  </main>;
}

export default App;