import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as Matter from "matter-js";
import { FRUITS } from "./config";
import type { LevelConfig, RunResult } from "./types";
import { audio, haptic } from "./audio";
import { bodyData, drawCanvasFruit, drawJar, drawRock, type FloatText, type Particle } from "./renderer";

export type GameStats = {
  score: number;
  combo: number;
  current: number;
  next: number;
  dropsLeft?: number;
  goalProgress: number;
  goalTarget: number;
  warning: boolean;
};

export type GameHandle = {
  usePower: (kind: string) => boolean;
  revive: () => void;
};

type Props = {
  mode: "level" | "endless";
  level?: LevelConfig;
  skin: string;
  jar: string;
  paused: boolean;
  vibration: boolean;
  onStats: (stats: GameStats) => void;
  onFinish: (result: RunResult) => void;
  onUsePower: (kind: string) => void;
  onCoinReward: (amount: number) => void;
};

type Bounds = { left: number; right: number; top: number; bottom: number; danger: number };
type FruitPlugin = { level: number; radius: number; createdAt: number; frozen?: boolean; rock?: boolean; merging?: boolean; dangerSince?: number; popUntil?: number; worried?: boolean };

const randomDrop = () => {
  const roll = Math.random();
  if (roll < .34) return 0;
  if (roll < .61) return 1;
  if (roll < .8) return 2;
  if (roll < .93) return 3;
  return 4;
};

export const GameCanvas = forwardRef<GameHandle, Props>(function GameCanvas(
  { mode, level, skin, jar, paused, vibration, onStats, onFinish, onUsePower, onCoinReward },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<{
    engine: Matter.Engine;
    world: Matter.World;
    bounds: Bounds;
    width: number;
    height: number;
    scale: number;
    walls: Matter.Body[];
    pointerX: number;
    current: number;
    next: number;
    score: number;
    combo: number;
    lastMerge: number;
    dropsLeft?: number;
    goalProgress: number;
    goalTarget: number;
    ended: boolean;
    warning: boolean;
    lastDrop: number;
    canDropAt: number;
    particles: Particle[];
    texts: FloatText[];
    shake: number;
  } | null>(null);
  const pausedRef = useRef(paused);
  const finishRef = useRef(onFinish);
  const statsRef = useRef(onStats);
  const usePowerRef = useRef(onUsePower);
  const coinRewardRef = useRef(onCoinReward);
  const vibrationRef = useRef(vibration);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);
  useEffect(() => { statsRef.current = onStats; }, [onStats]);
  useEffect(() => { usePowerRef.current = onUsePower; }, [onUsePower]);
  useEffect(() => { coinRewardRef.current = onCoinReward; }, [onCoinReward]);
  useEffect(() => { vibrationRef.current = vibration; }, [vibration]);

  const emitStats = () => {
    const game = runtimeRef.current;
    if (!game) return;
    const target = mode === "endless" ? Math.max(1000, game.score + 1) : level?.goal.target || 1;
    statsRef.current({
      score: game.score,
      combo: game.combo,
      current: game.current,
      next: game.next,
      dropsLeft: game.dropsLeft,
      goalProgress: mode === "endless" ? game.score : game.goalProgress,
      goalTarget: target,
      warning: game.warning,
    });
  };

  useImperativeHandle(ref, () => ({
    usePower(kind: string) {
      const game = runtimeRef.current;
      if (!game || game.ended) return false;
      const bodies = Matter.Composite.allBodies(game.world).filter((body) => body.label === "fruit" && !bodyData(body).frozen);
      if (kind === "shake" && bodies.length) {
        bodies.forEach((body, index) => Matter.Body.applyForce(body, body.position, { x: (index % 2 ? 1 : -1) * .018 * body.mass, y: -.025 * body.mass }));
        game.shake = 8;
      } else if (kind === "hammer" && bodies.length) {
        const target = bodies.sort((a, b) => bodyData(b).level - bodyData(a).level)[0];
        Matter.Composite.remove(game.world, target);
        burst(game, target.position.x, target.position.y, FRUITS[bodyData(target).level].color, 12);
      } else if (kind === "swap") {
        game.next = randomDrop();
      } else if (kind === "upgrade" && bodies.length) {
        const target = bodies.sort((a, b) => bodyData(b).level - bodyData(a).level)[0];
        const data = bodyData(target) as FruitPlugin;
        if (data.level >= 10) return false;
        const position = { ...target.position };
        const nextLevel = data.level + 1;
        Matter.Composite.remove(game.world, target);
        Matter.Composite.add(game.world, createFruit(nextLevel, position.x, position.y, game.scale));
        burst(game, position.x, position.y, FRUITS[nextLevel].color, 16);
      } else return false;
      usePowerRef.current(kind);
      audio.play("merge", 3);
      emitStats();
      return true;
    },
    revive() {
      const game = runtimeRef.current;
      if (!game) return;
      const bodies = Matter.Composite.allBodies(game.world).filter((body) => body.label === "fruit");
      bodies.sort((a, b) => a.position.y - b.position.y).slice(0, 3).forEach((body) => Matter.Composite.remove(game.world, body));
      if (game.dropsLeft !== undefined && game.dropsLeft <= 0) game.dropsLeft = 5;
      game.ended = false;
      game.warning = false;
      game.lastDrop = performance.now();
      emitStats();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const engine = Matter.Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.05;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;
    const first = randomDrop();
    const initial: NonNullable<typeof runtimeRef.current> = {
      engine,
      world: engine.world,
      bounds: { left: 0, right: 0, top: 0, bottom: 0, danger: 0 },
      width: 0,
      height: 0,
      scale: 1,
      walls: [],
      pointerX: 0,
      current: first,
      next: randomDrop(),
      score: 0,
      combo: 0,
      lastMerge: 0,
      dropsLeft: mode === "level" ? level?.drops : undefined,
      goalProgress: 0,
      goalTarget: mode === "level" ? level?.goal.target || 1 : 1000,
      ended: false,
      warning: false,
      lastDrop: performance.now(),
      canDropAt: 0,
      particles: [],
      texts: [],
      shake: 0,
    };
    runtimeRef.current = initial;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const previousBounds = { ...initial.bounds };
      const previousScale = initial.scale;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      initial.width = rect.width;
      initial.height = rect.height;
      initial.scale = Math.max(.55, Math.min(1.35, rect.width / 390));
      initial.bounds = {
        left: rect.width * .075,
        right: rect.width * .925,
        top: rect.height * .185,
        bottom: rect.height * .78,
        danger: rect.height * .30,
      };
      if (previousBounds.right > previousBounds.left && previousBounds.bottom > previousBounds.top) {
        const sizeRatio = initial.scale / previousScale;
        Matter.Composite.allBodies(initial.world).forEach((body) => {
          if (body.label !== "fruit" && body.label !== "rock") return;
          const xRatio = (body.position.x - previousBounds.left) / (previousBounds.right - previousBounds.left);
          const yRatio = (body.position.y - previousBounds.top) / (previousBounds.bottom - previousBounds.top);
          Matter.Body.setPosition(body, {
            x: initial.bounds.left + xRatio * (initial.bounds.right - initial.bounds.left),
            y: initial.bounds.top + yRatio * (initial.bounds.bottom - initial.bounds.top),
          });
          Matter.Body.scale(body, sizeRatio, sizeRatio);
          const data = body.plugin as FruitPlugin;
          if (data.radius) data.radius *= sizeRatio;
        });
      }
      initial.pointerX = initial.pointerX || rect.width / 2;
      initial.pointerX = Math.max(initial.bounds.left + 20, Math.min(initial.bounds.right - 20, initial.pointerX));
      if (initial.walls.length) Matter.Composite.remove(initial.world, initial.walls);
      const wallThickness = 28;
      const { left, right, top, bottom } = initial.bounds;
      initial.walls = [
        Matter.Bodies.rectangle(left - wallThickness / 2, (top + bottom) / 2, wallThickness, bottom - top + wallThickness, { isStatic: true, label: "wall" }),
        Matter.Bodies.rectangle(right + wallThickness / 2, (top + bottom) / 2, wallThickness, bottom - top + wallThickness, { isStatic: true, label: "wall" }),
        Matter.Bodies.rectangle((left + right) / 2, bottom + wallThickness / 2, right - left + wallThickness * 2, wallThickness, { isStatic: true, label: "wall" }),
      ];
      Matter.Composite.add(initial.world, initial.walls);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const addObstacles = () => {
      if (!level?.obstacles) return;
      const { left, right, bottom } = initial.bounds;
      const frozen = level.obstacles.frozen || 0;
      const rocks = level.obstacles.rocks || 0;
      for (let i = 0; i < frozen; i++) {
        const x = left + (right - left) * ((i + 1) / (frozen + 1));
        const body = createFruit(Math.min(3, Math.floor(level.world / 2) + 1), x, bottom - 35 * initial.scale, initial.scale, true);
        Matter.Body.setStatic(body, true);
        Matter.Composite.add(initial.world, body);
      }
      for (let i = 0; i < rocks; i++) {
        const radius = (19 + i * 3) * initial.scale;
        const x = left + (right - left) * ((i + .65) / (rocks + .5));
        const rock = Matter.Bodies.polygon(x, bottom - radius * 1.1, 7, radius, { isStatic: true, label: "rock", plugin: { rock: true, radius } });
        Matter.Composite.add(initial.world, rock);
      }
    };
    const obstacleTimer = window.setTimeout(addObstacles, 40);

    const mergeQueue: Array<[Matter.Body, Matter.Body]> = [];
    const collisionHandler = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        if (pair.bodyA.label !== "fruit" || pair.bodyB.label !== "fruit") continue;
        const a = bodyData(pair.bodyA) as FruitPlugin;
        const b = bodyData(pair.bodyB) as FruitPlugin;
        if (a.level !== b.level || a.frozen || b.frozen || a.merging || b.merging) continue;
        a.merging = true;
        b.merging = true;
        mergeQueue.push([pair.bodyA, pair.bodyB]);
      }
    };
    Matter.Events.on(engine, "collisionStart", collisionHandler);

    const processMerges = (now: number) => {
      while (mergeQueue.length) {
        const [a, b] = mergeQueue.shift()!;
        if (!Matter.Composite.get(initial.world, a.id, "body") || !Matter.Composite.get(initial.world, b.id, "body")) continue;
        const sourceLevel = (bodyData(a) as FruitPlugin).level;
        const x = (a.position.x + b.position.x) / 2;
        const y = (a.position.y + b.position.y) / 2;
        Matter.Composite.remove(initial.world, [a, b]);
        const chained = now - initial.lastMerge <= 1000;
        initial.combo = chained ? Math.min(9, initial.combo + 1) : 1;
        initial.lastMerge = now;
        let points: number;
        if (sourceLevel === 10) {
          points = 3000 * initial.combo;
          initial.shake = 14;
          burst(initial, x, y, "#ffd84d", 34);
        } else {
          const newLevel = sourceLevel + 1;
          const fruit = createFruit(newLevel, x, y, initial.scale);
          (bodyData(fruit) as FruitPlugin).popUntil = now + 220;
          Matter.Composite.add(initial.world, fruit);
          points = FRUITS[newLevel].points * initial.combo;
          burst(initial, x, y, FRUITS[newLevel].color, 12 + newLevel * 2);
          unlockNearby(initial, x, y, 115 * initial.scale);
          if (mode === "level" && level?.goal.type === "create" && newLevel >= (level.goal.fruit || 0)) initial.goalProgress = level.goal.target;
        }
        initial.score += points;
        const coinBonus = sourceLevel >= 8 ? sourceLevel - 6 : initial.combo >= 4 ? 1 : 0;
        if (coinBonus) coinRewardRef.current(coinBonus);
        if (mode === "level" && level?.goal.type === "score") initial.goalProgress = initial.score;
        if (mode === "level" && level?.goal.type === "merge" && sourceLevel === level.goal.fruit) initial.goalProgress += 1;
        initial.texts.push({ x, y, text: `+${points}${initial.combo > 1 ? `  x${initial.combo}` : ""}`, life: 1, color: initial.combo > 1 ? "#ffdf55" : "#ffffff" });
        audio.play(initial.combo > 2 ? "combo" : "merge", sourceLevel);
        if (vibrationRef.current) {
          if (initial.combo > 2) haptic("success");
          else if (sourceLevel >= 6) haptic("heavy");
          else haptic("medium");
        }
        if (sourceLevel >= 8) initial.shake = Math.max(initial.shake, sourceLevel - 4);
        emitStats();
        checkWin(initial, mode, level);
      }
    };

    const drop = () => {
      const now = performance.now();
      if (initial.ended || pausedRef.current || now < initial.canDropAt || initial.dropsLeft === 0) return;
      const radius = FRUITS[initial.current].radius * initial.scale;
      const x = Math.max(initial.bounds.left + radius, Math.min(initial.bounds.right - radius, initial.pointerX));
      const body = createFruit(initial.current, x, initial.bounds.top + radius + 4, initial.scale);
      Matter.Composite.add(initial.world, body);
      initial.current = initial.next;
      initial.next = randomDrop();
      initial.lastDrop = now;
      initial.canDropAt = now + 310;
      if (initial.dropsLeft !== undefined) initial.dropsLeft = Math.max(0, initial.dropsLeft - 1);
      audio.play("drop");
      emitStats();
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      initial.pointerX = event.clientX - rect.left;
      const radius = FRUITS[initial.current].radius * initial.scale;
      initial.pointerX = Math.max(initial.bounds.left + radius, Math.min(initial.bounds.right - radius, initial.pointerX));
    };
    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      onPointerMove(event);
      drop();
    };
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });

    let frame = 0;
    let previous = performance.now();
    let accumulator = 0;
    const timestep = 1000 / 60;
    const loop = (now: number) => {
      const elapsed = Math.min(50, now - previous);
      previous = now;
      if (!pausedRef.current && !initial.ended) {
        accumulator += elapsed;
        while (accumulator >= timestep) {
          Matter.Engine.update(engine, timestep);
          processMerges(now);
          accumulator -= timestep;
        }
        checkDanger(initial, now, mode, level);
        if (initial.dropsLeft === 0 && now - initial.lastDrop > 3200 && !goalMet(initial, level)) finish(initial, false, mode, level, "drops");
      }
      render(ctx, initial, skin, jar, now);
      frame = requestAnimationFrame(loop);
    };
    emitStats();
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(obstacleTimer);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      Matter.Events.off(engine, "collisionStart", collisionHandler);
      Matter.Engine.clear(engine);
      runtimeRef.current = null;
    };
  }, [jar, level, mode, skin]);

  function finish(game: NonNullable<typeof runtimeRef.current>, won: boolean, gameMode: "level" | "endless", levelConfig?: LevelConfig, reason?: "danger" | "drops") {
    if (game.ended) return;
    game.ended = true;
    let stars = 0;
    let coins = 0;
    if (won && levelConfig) {
      stars = game.score >= levelConfig.starScores[2] ? 3 : game.score >= levelConfig.starScores[1] ? 2 : 1;
      if (levelConfig.drops && game.dropsLeft !== undefined && game.dropsLeft >= levelConfig.drops * .25) stars = Math.min(3, stars + 1);
      coins = levelConfig.coins + (stars - 1) * 12;
    }
    audio.play(won ? "complete" : "gameover");
    window.setTimeout(() => finishRef.current({ score: game.score, stars, coins, level: gameMode === "level" ? levelConfig?.id : undefined, won, reason }), won ? 650 : 100);
  }

  function checkWin(game: NonNullable<typeof runtimeRef.current>, gameMode: "level" | "endless", levelConfig?: LevelConfig) {
    if (gameMode !== "level" || !levelConfig || !goalMet(game, levelConfig)) return;
    finish(game, true, gameMode, levelConfig);
  }

  function checkDanger(game: NonNullable<typeof runtimeRef.current>, now: number, gameMode: "level" | "endless", levelConfig?: LevelConfig) {
    let hasWarning = false;
    const fruits = Matter.Composite.allBodies(game.world).filter((body) => body.label === "fruit" && !bodyData(body).frozen);
    for (const fruit of fruits) {
      const data = bodyData(fruit) as FruitPlugin;
      const high = fruit.position.y - data.radius < game.bounds.danger && fruit.speed < 1.1 && now - data.createdAt > 600;
      if (high) {
        data.dangerSince ||= now;
        data.worried = true;
        if (now - data.dangerSince > 850) hasWarning = true;
        if (now - data.dangerSince > 2000) {
          finish(game, false, gameMode, levelConfig, "danger");
          return;
        }
      } else {
        data.dangerSince = undefined;
        data.worried = false;
      }
    }
    if (game.warning !== hasWarning) {
      game.warning = hasWarning;
      emitStats();
    }
  }

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Fruit merge game board" />;
});

function createFruit(level: number, x: number, y: number, scale: number, frozen = false) {
  const radius = FRUITS[level].radius * scale;
  return Matter.Bodies.circle(x, y, radius, {
    label: "fruit",
    restitution: .27,
    friction: .18,
    frictionStatic: .28,
    frictionAir: .006,
    density: .0018,
    sleepThreshold: 40,
    plugin: { level, radius, frozen, createdAt: performance.now() } satisfies FruitPlugin,
  });
}

function burst(game: NonNullable<React.RefObject<unknown>["current"]> & { particles: Particle[] }, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.2;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life: 1, color, size: 2 + Math.random() * 5 });
  }
}

function unlockNearby(game: NonNullable<React.RefObject<unknown>["current"]> & { world: Matter.World; particles: Particle[] }, x: number, y: number, radius: number) {
  Matter.Composite.allBodies(game.world).forEach((body) => {
    if (body.label !== "fruit") return;
    const data = bodyData(body) as FruitPlugin;
    if (!data.frozen || Matter.Vector.magnitude(Matter.Vector.sub(body.position, { x, y })) > radius) return;
    data.frozen = false;
    Matter.Body.setStatic(body, false);
    burst(game, body.position.x, body.position.y, "#d8fbff", 18);
    audio.play("unlock");
  });
}

function goalMet(game: { goalProgress: number; score: number }, level?: LevelConfig) {
  if (!level) return false;
  return level.goal.type === "score" ? game.score >= level.goal.target : game.goalProgress >= level.goal.target;
}

function render(
  ctx: CanvasRenderingContext2D,
  game: NonNullable<React.RefObject<unknown>["current"]> & {
    world: Matter.World; bounds: Bounds; width: number; height: number; scale: number; pointerX: number; current: number;
    score: number; goalProgress: number; goalTarget: number; particles: Particle[]; texts: FloatText[]; shake: number; warning: boolean;
  },
  skin: string,
  jar: string,
  now: number,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, game.width, game.height);
  const sx = game.shake > 0 ? (Math.random() - .5) * game.shake : 0;
  const sy = game.shake > 0 ? (Math.random() - .5) * game.shake : 0;
  game.shake *= .84;
  ctx.save();
  ctx.translate(sx, sy);
  const progress = game.goalProgress > 0 ? Math.min(1, game.goalProgress / Math.max(1, game.goalTarget)) : 0;
  drawJar(ctx, game.width, game.height, game.bounds, jar, progress);

  const previewRadius = FRUITS[game.current].radius * game.scale;
  ctx.setLineDash([5, 8]); ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(game.pointerX, game.bounds.top - previewRadius*.25); ctx.lineTo(game.pointerX, game.bounds.danger - 8); ctx.stroke(); ctx.setLineDash([]);
  drawCanvasFruit(ctx, game.pointerX, game.bounds.top + previewRadius + 3, previewRadius, game.current, skin, 0, .92, false, true);

  const bodies = Matter.Composite.allBodies(game.world);
  for (const body of bodies) {
    if (body.label === "fruit") {
      const data = bodyData(body) as FruitPlugin;
      const pop = data.popUntil && data.popUntil > now ? 1 + Math.sin(((data.popUntil - now) / 220) * Math.PI) * .24 : 1;
      drawCanvasFruit(ctx, body.position.x, body.position.y, data.radius, data.level, skin, body.angle, pop, Boolean(data.worried), false);
      if (data.frozen) {
        ctx.fillStyle = "rgba(190,240,255,.48)"; ctx.strokeStyle = "rgba(230,253,255,.9)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(body.position.x, body.position.y, data.radius + 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        for (let i=0;i<3;i++){ctx.save();ctx.translate(body.position.x,body.position.y);ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(-data.radius*.45,0);ctx.lineTo(data.radius*.45,0);ctx.stroke();ctx.restore();}
      }
    } else if (body.label === "rock") drawRock(ctx, body);
  }

  game.particles = game.particles.filter((particle) => {
    particle.x += particle.vx; particle.y += particle.vy; particle.vy += .08; particle.life -= .025;
    if (particle.life <= 0) return false;
    ctx.globalAlpha = particle.life; ctx.fillStyle = particle.color;
    ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI*2); ctx.fill();
    return true;
  });
  ctx.textAlign = "center"; ctx.font = `800 ${Math.max(15, game.width*.046)}px Fredoka, sans-serif`;
  game.texts = game.texts.filter((text) => {
    text.y -= .65; text.life -= .018;
    if (text.life <= 0) return false;
    ctx.globalAlpha = text.life; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(75,44,35,.55)"; ctx.strokeText(text.text, text.x, text.y); ctx.fillStyle = text.color; ctx.fillText(text.text, text.x, text.y);
    return true;
  });
  ctx.globalAlpha = 1;
  if (game.warning) {
    const alpha = .08 + Math.abs(Math.sin(now / 130)) * .14;
    ctx.fillStyle = `rgba(255,65,65,${alpha})`; ctx.fillRect(0,0,game.width,game.height);
  }
  ctx.restore();
}