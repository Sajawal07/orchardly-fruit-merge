import type Matter from "matter-js";
import { FRUITS, FRUIT_SKINS } from "./config";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

export type FloatText = { x: number; y: number; text: string; life: number; color: string };

type FruitBodyData = { level: number; frozen?: boolean; rock?: boolean; worried?: boolean };

const skinColor = (level: number, skin: string) => {
  const fruit = FRUITS[level];
  const selected = FRUIT_SKINS.find((item) => item.id === skin);
  if (!selected?.palette || skin === "classic" || skin === "emoji") return fruit.color;
  return selected.palette[level % selected.palette.length];
};

export function drawCanvasFruit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  level: number,
  skin: string,
  rotation = 0,
  scale = 1,
  worried = false,
  isHeld = false,
) {
  const fruit = FRUITS[level];
  const bodyColor = skinColor(level, skin);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  if (skin === "neon") {
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = radius * 0.55;
  } else {
    ctx.shadowColor = "rgba(63,39,35,.22)";
    ctx.shadowBlur = radius * 0.22;
    ctx.shadowOffsetY = radius * 0.12;
  }

  const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.42, radius * 0.04, 0, 0, radius);
  gradient.addColorStop(0, skin === "kawaii" ? "#fff9fb" : fruit.light);
  gradient.addColorStop(0.32, bodyColor);
  gradient.addColorStop(1, fruit.dark);
  ctx.fillStyle = gradient;
  ctx.strokeStyle = fruit.dark;
  ctx.lineWidth = Math.max(2, radius * 0.08);
  ctx.lineJoin = "round";

  ctx.beginPath();
  if (level === 1) {
    ctx.moveTo(0, -radius * 0.9);
    ctx.bezierCurveTo(radius, -radius, radius * 0.9, radius * 0.2, 0, radius);
    ctx.bezierCurveTo(-radius * 0.9, radius * 0.2, -radius, -radius, 0, -radius * 0.9);
  } else if (level === 3) {
    ctx.ellipse(0, 0, radius, radius * 0.78, -0.12, 0, Math.PI * 2);
  } else if (level === 6) {
    ctx.moveTo(-radius * 0.35, -radius * 0.75);
    ctx.bezierCurveTo(-radius * 0.25, -radius * 1.1, radius * 0.3, -radius * 1.1, radius * 0.36, -radius * 0.7);
    ctx.bezierCurveTo(radius * 0.45, -radius * 0.35, radius, radius * 0.15, radius * 0.75, radius * 0.65);
    ctx.bezierCurveTo(radius * 0.35, radius * 1.08, -radius * 0.45, radius * 1.05, -radius * 0.78, radius * 0.62);
    ctx.bezierCurveTo(-radius, radius * 0.1, -radius * 0.44, -radius * 0.37, -radius * 0.35, -radius * 0.75);
  } else if (level === 8) {
    ctx.moveTo(-radius * 0.72, -radius * 0.72);
    ctx.quadraticCurveTo(0, -radius, radius * 0.72, -radius * 0.72);
    ctx.lineTo(radius * 0.62, radius * 0.75);
    ctx.quadraticCurveTo(0, radius * 1.05, -radius * 0.62, radius * 0.75);
    ctx.closePath();
  } else {
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
  ctx.clip();
  if (level === 0) {
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.fillRect(-radius * 0.08, -radius, radius * 0.16, radius * 2);
  }
  if (level === 1) {
    ctx.fillStyle = "#ffe995";
    for (const [sx, sy] of [[-0.45,-0.22],[0.45,-0.2],[-0.25,0.25],[0.3,0.35],[0,0.65]]) {
      ctx.beginPath();
      ctx.ellipse(radius * sx, radius * sy, radius * 0.06, radius * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (level === 2) {
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = radius * 0.08;
    for (const [sx, sy] of [[-0.4,-0.25],[0.35,-0.32],[-0.1,0.25],[0.42,0.35]]) {
      ctx.beginPath(); ctx.arc(radius * sx, radius * sy, radius * .27, 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (level === 4) {
    ctx.strokeStyle = "rgba(118,68,18,.22)";
    ctx.lineWidth = radius * .05;
    ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.moveTo(0, -radius); ctx.lineTo(0, radius); ctx.stroke();
  }
  if (level === 7) {
    ctx.strokeStyle = "rgba(133,54,56,.45)";
    ctx.lineWidth = radius * .06;
    ctx.beginPath(); ctx.moveTo(0, -radius); ctx.bezierCurveTo(-radius*.2, -radius*.25, radius*.1, radius*.6, 0, radius); ctx.stroke();
  }
  if (level === 8) {
    ctx.strokeStyle = "rgba(101,64,20,.55)";
    ctx.lineWidth = radius * .045;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(-radius, i * radius * .35 - radius * .2); ctx.lineTo(radius, i * radius * .35 + radius * .7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(radius, i * radius * .35 - radius * .2); ctx.lineTo(-radius, i * radius * .35 + radius * .7); ctx.stroke();
    }
  }
  if (level >= 9) {
    ctx.strokeStyle = level === 10 ? "rgba(15,83,47,.72)" : "rgba(255,239,174,.65)";
    ctx.lineWidth = radius * (level === 10 ? .1 : .06);
    [-.55, -.18, .2, .57].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(radius * offset, -radius);
      ctx.bezierCurveTo(radius * (offset + .18), -radius * .3, radius * (offset - .12), radius * .35, radius * offset, radius);
      ctx.stroke();
    });
  }
  if (skin === "wood") {
    ctx.strokeStyle = "rgba(91,55,31,.3)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, radius * .65, 0, Math.PI * 2); ctx.stroke();
  }
  if (skin === "galaxy") {
    ctx.fillStyle = "#fff";
    [[-.42,-.4],[.48,-.28],[-.55,.32],[.34,.5]].forEach(([sx,sy], i) => { ctx.beginPath(); ctx.arc(radius*sx, radius*sy, i%2+1, 0, Math.PI*2); ctx.fill(); });
  }
  ctx.restore();

  // Stems & leaves
  if (level === 0 || level === 4 || level === 5 || level === 6 || level === 7) {
    ctx.strokeStyle = "#5d7837"; ctx.lineWidth = Math.max(2, radius * .12); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -radius * .78); ctx.quadraticCurveTo(radius*.04, -radius*1.18, radius*.35, -radius*1.28); ctx.stroke();
    ctx.fillStyle = "#6eaa48"; ctx.beginPath(); ctx.ellipse(radius*.4, -radius*1.14, radius*.28, radius*.12, -.3, 0, Math.PI*2); ctx.fill();
  }
  if (level === 1) {
    ctx.fillStyle = "#66a844";
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((Math.PI * 2 * i) / 5); ctx.beginPath(); ctx.ellipse(0, -radius*.86, radius*.18, radius*.48, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
  }
  if (level === 8) {
    ctx.fillStyle = "#4f9e4b"; ctx.strokeStyle = "#33723b"; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i*radius*.13, -radius*.72); ctx.lineTo(i*radius*.28, -radius*1.42); ctx.lineTo(i*radius*.04 + radius*.12, -radius*.82); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }

  // Fruit face highlight
  ctx.fillStyle = "rgba(255,255,255,.58)";
  ctx.beginPath(); ctx.ellipse(-radius*.33, -radius*.37, radius*.2, radius*.1, -.55, 0, Math.PI*2); ctx.fill();

  const eyeY = level === 1 ? radius * .08 : radius * .04;
  const eyeSpacing = radius * 0.25;

  if (isHeld) {
    // WAITING AT TOP: Eyes happily closed in anticipation (cute curved eyelashes ⌒ ⌒)
    ctx.strokeStyle = "#2e1d20";
    ctx.lineWidth = Math.max(2.2, radius * 0.08);
    ctx.lineCap = "round";

    // Left closed eye arc
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY + radius * 0.02, radius * 0.11, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Right closed eye arc
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY + radius * 0.02, radius * 0.11, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Cute small anticipation smile mouth
    ctx.beginPath();
    ctx.arc(0, radius * 0.22, radius * 0.12, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Blushing rosy cheeks
    ctx.fillStyle = "rgba(255,120,140,.75)";
    ctx.beginPath(); ctx.arc(-radius * 0.38, radius * 0.22, radius * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(radius * 0.38, radius * 0.22, radius * 0.12, 0, Math.PI * 2); ctx.fill();
  } else if (worried) {
    // WORRIED: Fruit is close to danger line!
    const eyeR = Math.max(3, radius * 0.13);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#2e1d20";
    ctx.lineWidth = Math.max(1.5, radius * 0.05);

    // Wide shocked eye whites
    ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, eyeR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, eyeR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Small shocked pupils
    ctx.fillStyle = "#2e1d20";
    ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, eyeR * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, eyeR * 0.45, 0, Math.PI * 2); ctx.fill();

    // Wavy / trembling worried mouth
    ctx.strokeStyle = "#2e1d20";
    ctx.lineWidth = Math.max(2, radius * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, radius * 0.35, radius * 0.16, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Sweat droplet
    ctx.fillStyle = "#6dd5ed";
    ctx.strokeStyle = "#2193b0";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(radius * 0.48, -radius * 0.3);
    ctx.quadraticCurveTo(radius * 0.58, -radius * 0.15, radius * 0.52, -radius * 0.05);
    ctx.arc(radius * 0.45, -radius * 0.05, radius * 0.08, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // NORMAL IN JAR: BIG SPARKLING KAWAII EYES & BIG HAPPY SMILE!
    const bigEyeR = Math.max(3.8, radius * 0.155);

    // Dark glossy eyes
    ctx.fillStyle = "#241418";
    ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, bigEyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, bigEyeR, 0, Math.PI * 2); ctx.fill();

    // Big glossy white sparkle catchlight (top-left)
    const catch1 = bigEyeR * 0.42;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(-eyeSpacing - bigEyeR * 0.26, eyeY - bigEyeR * 0.26, catch1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing - bigEyeR * 0.26, eyeY - bigEyeR * 0.26, catch1, 0, Math.PI * 2); ctx.fill();

    // Baby secondary twinkle highlight (bottom-right)
    const catch2 = bigEyeR * 0.22;
    ctx.beginPath(); ctx.arc(-eyeSpacing + bigEyeR * 0.32, eyeY + bigEyeR * 0.32, catch2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeSpacing + bigEyeR * 0.32, eyeY + bigEyeR * 0.32, catch2, 0, Math.PI * 2); ctx.fill();

    // Big open happy smile showing cute pink tongue!
    const mouthW = radius * 0.24;
    const mouthY = radius * 0.21;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, mouthY, mouthW, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fillStyle = "#5c1b26";
    ctx.fill();
    ctx.strokeStyle = "#241418";
    ctx.lineWidth = Math.max(1.8, radius * 0.065);
    ctx.lineCap = "round";
    ctx.stroke();

    // Cute pink tongue inside mouth
    ctx.clip();
    ctx.fillStyle = "#ff6584";
    ctx.beginPath();
    ctx.arc(0, mouthY + mouthW * 0.75, mouthW * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Big happy blushing rosy cheeks
    ctx.fillStyle = "rgba(255,105,135,.65)";
    ctx.beginPath(); ctx.arc(-radius * 0.38, radius * 0.24, radius * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(radius * 0.38, radius * 0.24, radius * 0.11, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

export function drawJar(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  bounds: { left: number; right: number; top: number; bottom: number; danger: number },
  kind: string,
  progress: number,
) {
  const { left, right, top, bottom, danger } = bounds;
  const jarWidth = right - left;
  const radius = jarWidth * 0.075;

  ctx.save();

  // 1. CLIP & DRAW JUICE LEVEL (Goal Harvest Progress)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left + 2, top, jarWidth - 4, bottom - top, [radius, radius, radius * 1.5, radius * 1.5]);
  ctx.clip();

  const fillHeight = Math.max(0, Math.min(1, progress)) * (bottom - top - 6);
  if (fillHeight > 0) {
    const juiceY = bottom - fillHeight;
    const juice = ctx.createLinearGradient(0, juiceY, 0, bottom);
    juice.addColorStop(0, "rgba(255,178,54,.55)");
    juice.addColorStop(0.5, "rgba(255,108,82,.62)");
    juice.addColorStop(1, "rgba(235,50,90,.72)");
    ctx.fillStyle = juice;
    ctx.fillRect(left, juiceY, jarWidth, fillHeight);

    // Sparkling foam & wave surface
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillRect(left, juiceY, jarWidth, 4);

    // Fizzy rising bubbles in juice
    const bubbleTime = Date.now() / 600;
    ctx.fillStyle = "rgba(255,255,255,.45)";
    for (let i = 0; i < 7; i++) {
      const bx = left + (jarWidth * ((i * 37 + 13) % 90)) / 100 + 8;
      const bProgress = ((bubbleTime + i * 0.35) % 1);
      const by = bottom - bProgress * fillHeight;
      const bRadius = 2 + (i % 3);
      ctx.beginPath();
      ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Juice progress label badge on the surface
    if (fillHeight > 18) {
      const pct = Math.round(progress * 100);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.font = `800 ${Math.max(10, width * 0.026)}px Fredoka, sans-serif`;
      ctx.fillText(`🥤 JUICE ${pct}%`, (left + right) / 2, Math.min(bottom - 10, juiceY + 16));
    }
  }
  ctx.restore();

  // 2. DISTINCT JAR SKINS
  const styles: Record<string, { stroke: string; fill: string; width: number; glow: string }> = {
    barrel: { stroke: "#6b3f1f", fill: "rgba(148,88,40,.14)", width: 11, glow: "rgba(107,63,31,.25)" },
    ice: { stroke: "#7ed6ee", fill: "rgba(195,245,255,.18)", width: 10, glow: "rgba(126,214,238,.6)" },
    cactus: { stroke: "#2e7d48", fill: "rgba(67,160,95,.12)", width: 11, glow: "rgba(46,125,72,.3)" },
    shell: { stroke: "#e88e85", fill: "rgba(255,208,200,.15)", width: 10, glow: "rgba(232,142,133,.4)" },
    gold: { stroke: "#f1b327", fill: "rgba(255,228,110,.18)", width: 12, glow: "rgba(255,200,40,.75)" },
    lantern: { stroke: "#513a70", fill: "rgba(255,215,90,.13)", width: 10, glow: "rgba(255,215,90,.55)" },
    candy: { stroke: "#ee709d", fill: "rgba(255,175,205,.16)", width: 10, glow: "rgba(238,112,157,.45)" },
    candyJar: { stroke: "#ee709d", fill: "rgba(255,175,205,.16)", width: 10, glow: "rgba(238,112,157,.45)" },
    crystal: { stroke: "#9b78e6", fill: "rgba(215,200,255,.16)", width: 10, glow: "rgba(155,120,230,.65)" },
    glass: { stroke: "rgba(105,175,190,.78)", fill: "rgba(220,248,255,.1)", width: 9, glow: "rgba(80,180,210,.25)" },
  };

  const currentStyle = styles[kind] || styles.glass;

  ctx.shadowColor = currentStyle.glow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = currentStyle.fill;
  ctx.strokeStyle = currentStyle.stroke;
  ctx.lineWidth = currentStyle.width;

  ctx.beginPath();
  ctx.roundRect(left, top, jarWidth, bottom - top, [radius, radius, radius * 1.5, radius * 1.5]);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Custom Skin Features:
  if (kind === "barrel") {
    // Rich wood planks and metallic iron bands with gold rivets
    ctx.strokeStyle = "#4e2b12";
    ctx.lineWidth = 7;
    const band1 = top + (bottom - top) * 0.28;
    const band2 = bottom - (bottom - top) * 0.22;
    [band1, band2].forEach((by) => {
      ctx.beginPath(); ctx.moveTo(left + 2, by); ctx.lineTo(right - 2, by); ctx.stroke();
      // Rivets
      ctx.fillStyle = "#ffd56b";
      for (let rx = left + 20; rx < right - 10; rx += 38) {
        ctx.beginPath(); ctx.arc(rx, by, 3, 0, Math.PI * 2); ctx.fill();
      }
    });
  } else if (kind === "gold") {
    // Royal gold crown rim and sparkling glints
    ctx.strokeStyle = "#fff2a1";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(left + 10, top + 6);
    ctx.lineTo(right - 10, top + 6);
    ctx.moveTo(left + 20, bottom - 6);
    ctx.lineTo(right - 20, bottom - 6);
    ctx.stroke();
    // Star glints
    ctx.fillStyle = "#ffffff";
    const glint = (Date.now() / 800) % 1;
    ctx.beginPath();
    ctx.arc(left + 24 + glint * 10, top + 15, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "ice") {
    // Icicles along the top rim
    ctx.fillStyle = "#ffffff";
    for (let ix = left + 15; ix < right - 15; ix += 24) {
      ctx.beginPath();
      ctx.moveTo(ix, top + 3);
      ctx.lineTo(ix + 12, top + 3);
      ctx.lineTo(ix + 6, top + 16 + (ix % 7) * 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === "cactus") {
    // Terracotta rim and desert flower
    ctx.strokeStyle = "#e07a5f";
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(left - 2, top + 2); ctx.lineTo(right + 2, top + 2); ctx.stroke();
    // Pink desert flower at top-right corner
    ctx.fillStyle = "#ff6584";
    ctx.beginPath(); ctx.arc(right - 10, top - 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath(); ctx.arc(right - 10, top - 2, 3.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === "shell") {
    // Wavy seashell grooves
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 3;
    for (let sx = left + 25; sx < right - 15; sx += 32) {
      ctx.beginPath();
      ctx.moveTo(sx, bottom - 6);
      ctx.quadraticCurveTo((left + right) / 2, top + (bottom - top) * 0.45, sx, top + 10);
      ctx.stroke();
    }
  } else if (kind === "crystal") {
    // Shimmering diamond crystal facets
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(left + 25, top + 35);
    ctx.lineTo(left + 45, top + 15);
    ctx.lineTo(left + 35, top + 65);
    ctx.closePath();
    ctx.stroke();
  } else if (kind === "candy" || kind === "candyJar") {
    // Candy cane striped rim
    ctx.lineWidth = 6;
    for (let cx = left + 5; cx < right - 15; cx += 18) {
      ctx.strokeStyle = cx % 36 === 0 ? "#ffffff" : "#ff4b72";
      ctx.beginPath(); ctx.moveTo(cx, top - 2); ctx.lineTo(cx + 10, top + 8); ctx.stroke();
    }
  }

  // Left glass reflection shine
  ctx.strokeStyle = "rgba(255,255,255,.65)";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left + 16, top + 28);
  ctx.lineTo(left + 16, bottom - 45);
  ctx.stroke();

  // Top open mouth rim
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(left - 3, top + 2);
  ctx.quadraticCurveTo(width / 2, top - 6, right + 3, top + 2);
  ctx.stroke();

  // Danger Line & Text
  ctx.setLineDash([9, 8]);
  ctx.strokeStyle = "rgba(235,60,60,.82)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(left + 8, danger);
  ctx.lineTo(right - 8, danger);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `800 ${Math.max(10, width * 0.028)}px Fredoka, sans-serif`;
  ctx.fillStyle = "rgba(215,50,50,.9)";
  ctx.fillText("⚠️ DANGER LINE", left + 14, danger - 6);

  ctx.restore();
}

export function drawRock(ctx: CanvasRenderingContext2D, body: Matter.Body) {
  ctx.save(); ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle);
  const radius = (body.plugin as { radius?: number }).radius || 23;
  const gradient = ctx.createRadialGradient(-radius*.3,-radius*.35,2,0,0,radius);
  gradient.addColorStop(0,"#b5aea8"); gradient.addColorStop(1,"#656466");
  ctx.fillStyle=gradient;ctx.strokeStyle="#4e4d50";ctx.lineWidth=3;
  ctx.beginPath(); body.vertices.forEach((v,i)=>{const x=v.x-body.position.x,y=v.y-body.position.y;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="rgba(255,255,255,.2)";ctx.beginPath();ctx.arc(-radius*.25,-radius*.25,radius*.18,0,Math.PI*2);ctx.fill();ctx.restore();
}

export function bodyData(body: Matter.Body): FruitBodyData {
  return body.plugin as FruitBodyData;
}