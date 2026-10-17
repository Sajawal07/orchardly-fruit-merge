import { useId } from "react";
import { FRUITS, FRUIT_SKINS } from "../game/config";

type IconProps = { className?: string; style?: React.CSSProperties };

const face = (level: number, worried = false) => (
  <g className="fruit-face" fill="#3d2c2e" stroke="#3d2c2e" strokeLinecap="round">
    <circle cx={level === 0 ? 41 : 43} cy="55" r="2.4" stroke="none" />
    <circle cx={level === 0 ? 57 : 58} cy="55" r="2.4" stroke="none" />
    {worried ? <path d="M47 65 Q52 60 57 65" fill="none" strokeWidth="2.4" /> : <path d="M47 62 Q52 68 57 62" fill="none" strokeWidth="2.4" />}
    <circle cx="40" cy="62" r="3.2" fill="#ff9aa7" opacity=".65" stroke="none" />
    <circle cx="61" cy="62" r="3.2" fill="#ff9aa7" opacity=".65" stroke="none" />
  </g>
);

export function FruitIcon({ level, skin = "classic", className = "", worried = false }: { level: number; skin?: string; className?: string; worried?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fruit = FRUITS[Math.max(0, Math.min(10, level))];
  const skinConfig = FRUIT_SKINS.find((item) => item.id === skin);
  const accent = skinConfig?.palette?.[level % 3] || fruit.color;
  const main = skin === "classic" || skin === "emoji" ? fruit.color : accent;
  const light = skin === "kawaii" ? "#fff7fb" : fruit.light;
  const filter = skin === "neon" ? `drop-shadow(0 0 8px ${main})` : skin === "watercolor" ? "url(#soft)" : undefined;
  const common = { fill: `url(#fruit-${id})`, stroke: fruit.dark, strokeWidth: skin === "pixel" ? 4 : 3, strokeLinejoin: "round" as const };
  return (
    <svg className={`fruit-icon skin-${skin} ${className}`} viewBox="0 0 100 100" aria-label={fruit.name} style={{ filter }}>
      <defs>
        <radialGradient id={`fruit-${id}`} cx="35%" cy="25%">
          <stop offset="0" stopColor={light} />
          <stop offset=".38" stopColor={main} />
          <stop offset="1" stopColor={fruit.dark} />
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation=".25" /></filter>
      </defs>
      {level === 0 && <><path d="M48 32 Q45 13 61 9" fill="none" stroke="#5e7d32" strokeWidth="5" strokeLinecap="round" /><path d="M55 15 Q70 9 73 20 Q62 23 55 15" fill="#79ad45" stroke="#4f7c2c" strokeWidth="2" /><circle cx="39" cy="56" r="23" {...common} /><circle cx="64" cy="60" r="20" {...common} /></>}
      {level === 1 && <><path d="M23 37 Q28 20 50 25 Q72 20 78 37 L69 68 Q60 85 50 91 Q39 84 30 68 Z" {...common} /><path d="M27 31 Q33 16 49 27 Q62 13 74 30 Q61 32 51 40 Q41 31 27 31" fill="#62a844" stroke="#39742b" strokeWidth="2.5" />{[37, 50, 63].map((x) => <path key={x} d={`M${x} 48 l3 5 l-4 1 Z`} fill="#ffe78b" />)}</>}
      {level === 2 && <><path d="M49 28 Q51 17 63 14" fill="none" stroke="#55873b" strokeWidth="5" />{[[50,37],[34,45],[66,45],[49,54],[31,62],[68,62],[49,72]].map(([x,y], i) => <circle key={i} cx={x} cy={y} r="15" {...common} />)}</>}
      {level === 3 && <><path d="M15 56 Q21 30 48 26 Q79 26 86 52 Q80 78 51 80 Q22 81 15 56 Z" {...common} /><path d="M23 53 Q27 39 39 35" fill="none" stroke="#fff" strokeWidth="5" opacity=".45" strokeLinecap="round" /></>}
      {level === 4 && <><circle cx="50" cy="55" r="36" {...common} /><path d="M50 19 Q55 10 65 11" fill="none" stroke="#60833b" strokeWidth="4" /><path d="M50 32 V76 M27 53 H73" fill="none" stroke={fruit.dark} strokeWidth="2" opacity=".26" /></>}
      {level === 5 && <><path d="M50 31 Q62 19 75 30 Q90 44 80 69 Q69 88 51 83 Q30 90 19 69 Q9 45 26 30 Q39 19 50 31 Z" {...common} /><path d="M50 29 Q48 14 58 8" fill="none" stroke="#6e4d2e" strokeWidth="6" strokeLinecap="round" /><path d="M55 17 Q72 10 76 24 Q63 28 55 17" fill="#70a847" stroke="#487c33" strokeWidth="2" /></>}
      {level === 6 && <><path d="M42 29 Q43 17 51 15 Q62 16 61 31 Q64 38 73 49 Q86 70 69 83 Q51 94 31 83 Q14 69 28 49 Q39 37 42 29 Z" {...common} /><path d="M51 18 Q50 8 60 5" fill="none" stroke="#6e4d2e" strokeWidth="5" /><path d="M56 13 Q70 8 73 19 Q63 22 56 13" fill="#5e9d43" /></>}
      {level === 7 && <><path d="M50 27 Q72 17 83 38 Q94 62 74 82 Q54 96 50 82 Q43 96 24 82 Q4 63 16 39 Q27 17 50 27 Z" {...common} /><path d="M50 28 Q44 42 50 82" fill="none" stroke={fruit.dark} strokeWidth="3" opacity=".55" /><path d="M50 27 Q55 14 68 14" fill="none" stroke="#56813b" strokeWidth="4" /></>}
      {level === 8 && <><path d="M27 38 Q50 26 73 38 L77 77 Q50 94 23 77 Z" {...common} /><path d="M27 46 L72 75 M26 62 L65 86 M73 46 L27 75 M70 63 L42 84" stroke="#8c6727" strokeWidth="2" opacity=".65" /><path d="M31 37 L20 18 L42 28 L47 8 L55 28 L76 17 L68 39" fill="#5ca94e" stroke="#39763a" strokeWidth="3" /></>}
      {level === 9 && <><circle cx="50" cy="56" r="39" {...common} /><path d="M27 28 Q36 55 27 81 M45 18 Q51 54 44 94 M64 21 Q70 55 65 89 M77 31 Q84 56 76 80" fill="none" stroke="#f1e0a3" strokeWidth="3" opacity=".7" /></>}
      {level === 10 && <><circle cx="50" cy="55" r="42" {...common} /><path d="M26 22 Q38 55 25 86 M45 14 Q53 54 45 97 M65 18 Q75 54 67 91 M79 27 Q90 55 79 82" fill="none" stroke="#185d3b" strokeWidth="5" opacity=".8" /></>}
      {skin === "galaxy" && <g fill="#fff" opacity=".85"><circle cx="32" cy="45" r="1.5"/><circle cx="65" cy="37" r="1"/><circle cx="72" cy="68" r="1.4"/><path d="M35 72 l2 4 l4 2 l-4 2 l-2 4 l-2-4 l-4-2 l4-2z" /></g>}
      {face(level, worried)}
      <ellipse cx="36" cy="36" rx="8" ry="4" fill="#fff" opacity={skin === "jelly" ? .78 : .5} transform="rotate(-35 36 36)" />
    </svg>
  );
}

export function CoinIcon({ className = "", style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="coin" x2="0" y2="1"><stop stopColor="#fff38a"/><stop offset=".5" stopColor="#ffc83d"/><stop offset="1" stopColor="#e99520"/></linearGradient></defs><circle cx="32" cy="32" r="27" fill="url(#coin)" stroke="#b86c1b" strokeWidth="4"/><circle cx="32" cy="32" r="20" fill="none" stroke="#ffe879" strokeWidth="3"/><path d="M36 16 l-3 10 h9 l-14 22 l3-13 h-9z" fill="#fff2a8" stroke="#cb7c20" strokeWidth="2"/></svg>;
}

export function StarIcon({ filled = true, className = "" }: IconProps & { filled?: boolean }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 l8 17 l19 2 l-14 13 l4 19 l-17-9 l-17 9 l4-19 l-14-13 l19-2z" fill={filled ? "#ffd84d" : "#d7cbc0"} stroke={filled ? "#d79022" : "#9f9389"} strokeWidth="4" strokeLinejoin="round"/><path d="M25 20 Q32 13 38 20" fill="none" stroke="#fff" strokeWidth="3" opacity=".6"/></svg>;
}

export function LockIcon({ className = "" }: IconProps) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M19 29 V22 Q19 9 32 9 Q45 9 45 22 V29" fill="none" stroke="#726d70" strokeWidth="7"/><rect x="12" y="27" width="40" height="31" rx="9" fill="#aaa5a8" stroke="#625c61" strokeWidth="4"/><circle cx="32" cy="41" r="5" fill="#625c61"/><path d="M32 44 v8" stroke="#625c61" strokeWidth="5"/></svg>;
}

export function SoundIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M12 24 h10 l16 -12 v40 l-16 -12 h-10 z" fill="#ffd166" stroke="#71411f" strokeWidth="4" strokeLinejoin="round" />
      <path d="M46 22 Q54 32 46 42" fill="none" stroke="#71411f" strokeWidth="4" strokeLinecap="round" />
      <path d="M52 16 Q64 32 52 48" fill="none" stroke="#71411f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function MusicIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="20" cy="46" rx="8" ry="6" fill="#ffd166" stroke="#71411f" strokeWidth="4" />
      <ellipse cx="44" cy="40" rx="8" ry="6" fill="#ffd166" stroke="#71411f" strokeWidth="4" />
      <path d="M28 46 V18 L52 12 V40" fill="none" stroke="#71411f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 24 L52 18" stroke="#71411f" strokeWidth="4" />
    </svg>
  );
}

export function VibrateIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="22" y="10" width="20" height="44" rx="6" fill="#ffd166" stroke="#71411f" strokeWidth="4" />
      <line x1="28" y1="16" x2="36" y2="16" stroke="#71411f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="47" r="2.5" fill="#71411f" />
      <path d="M13 22 Q8 32 13 42 M51 22 Q56 32 51 42" fill="none" stroke="#71411f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PolicyIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6 L50 14 V32 Q50 48 32 58 Q14 48 14 32 V14 Z" fill="#ffd166" stroke="#71411f" strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 32 L30 38 L42 24" fill="none" stroke="#327a48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChestIcon({ className = "", gold = false }: IconProps & { gold?: boolean }) {
  return <svg className={className} viewBox="0 0 100 80" aria-hidden="true"><path d="M12 33 Q14 9 34 8 H66 Q87 10 88 33" fill={gold ? "#ffd958" : "#b8783d"} stroke="#71411f" strokeWidth="6"/><path d="M9 31 H91 V70 Q91 76 84 76 H16 Q9 76 9 69 Z" fill={gold ? "#f1aa2d" : "#9a5e32"} stroke="#71411f" strokeWidth="6"/><path d="M9 42 H91 M28 9 V75 M72 9 V75" stroke={gold ? "#fff083" : "#d99a54"} strokeWidth="5"/><rect x="42" y="34" width="16" height="22" rx="4" fill="#fff08a" stroke="#8c561f" strokeWidth="4"/><circle cx="50" cy="43" r="3" fill="#8c561f"/></svg>;
}

export function JarIcon({ kind = "glass", className = "" }: { kind?: string; className?: string }) {
  const isBarrel = kind === "barrel";
  const isCactus = kind === "cactus";
  const isGold = kind === "gold";
  const isIce = kind === "ice" || kind === "crystal";
  const isLantern = kind === "lantern";
  const main = isBarrel ? "#a96635" : isCactus ? "#68b964" : isGold ? "#f0bd3a" : isLantern ? "#574579" : isIce ? "#c7f2ff" : kind.includes("candy") ? "#ffb4d2" : "#d9f6ff";
  return <svg className={className} viewBox="0 0 100 110" aria-hidden="true"><path d="M22 20 Q16 46 21 90 Q50 104 79 90 Q84 47 78 20 Z" fill={main} fillOpacity={isBarrel || isCactus || isGold || isLantern ? .95 : .5} stroke={isBarrel ? "#71411f" : isCactus ? "#327a48" : isGold ? "#a86d16" : isLantern ? "#2f2850" : "#73aebb"} strokeWidth="6"/><path d="M17 20 Q50 11 83 20 Q83 28 77 30 Q50 23 23 30 Q17 28 17 20 Z" fill={isBarrel ? "#d49250" : main} stroke={isBarrel ? "#71411f" : "#679eaa"} strokeWidth="5"/><path d="M30 35 Q25 56 31 78" fill="none" stroke="#fff" strokeWidth="5" opacity=".55" strokeLinecap="round"/>{isBarrel && <><path d="M20 43 H80 M20 75 H80" stroke="#57351f" strokeWidth="6"/><path d="M48 25 V97" stroke="#7f4c2b" strokeWidth="3"/></>}{isCactus && <><path d="M22 57 Q7 58 10 43 M79 52 Q94 54 92 38" fill="none" stroke="#327a48" strokeWidth="8" strokeLinecap="round"/><g stroke="#e9f5a5" strokeWidth="2"><path d="M40 41v6 M60 55v6 M43 72v6"/></g></>}{isLantern && <><path d="M28 18 Q29 2 50 2 Q71 2 72 18" fill="none" stroke="#322b4e" strokeWidth="5"/><circle cx="50" cy="61" r="23" fill="#ffe67b" opacity=".55"/></>}</svg>;
}

export function PowerIcon({ kind, className = "" }: { kind: string; className?: string }) {
  if (kind === "hammer") return <svg className={className} viewBox="0 0 64 64"><path d="M39 9 l17 17 l-11 11 l-8-8 l-24 29 l-8-8 l29-24 l-7-7z" fill="#8f633f" stroke="#52372c" strokeWidth="4"/><path d="M27 8 l12-4 l21 21 l-8 12z" fill="#7cb4c6" stroke="#3f6572" strokeWidth="4"/></svg>;
  if (kind === "swap") return <svg className={className} viewBox="0 0 64 64"><path d="M10 20 H49 l-9-9 M54 44 H15 l9 9" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (kind === "upgrade") return <svg className={className} viewBox="0 0 64 64"><path d="M32 8 l18 20 H39 V54 H25 V28 H14z" fill="#fff0a1" stroke="#875f24" strokeWidth="4" strokeLinejoin="round"/></svg>;
  return <svg className={className} viewBox="0 0 64 64"><path d="M32 6 Q42 20 58 15 Q48 29 58 43 Q41 40 32 58 Q23 40 6 43 Q16 29 6 15 Q23 20 32 6z" fill="#fff" stroke="#5c9562" strokeWidth="4"/><path d="M32 18 v28 M18 32 h28" stroke="#6bcb77" strokeWidth="5"/></svg>;
}

export function SceneArt({ scene, className = "" }: { scene: string; className?: string }) {
  const night = scene === "night";
  return <svg className={className} viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id={`sky-${scene}`} x2="0" y2="1"><stop stopColor={night ? "#24264c" : scene === "snow" ? "#e9fbff" : scene === "desert" ? "#fff0bc" : scene === "beach" ? "#b9f4ee" : scene === "candy" ? "#ffe3f2" : "#fff4c7"}/><stop offset="1" stopColor={night ? "#554274" : scene === "snow" ? "#8dcbea" : scene === "desert" ? "#ef9b60" : scene === "beach" ? "#58b8ce" : scene === "candy" ? "#c9a6ef" : "#91d174"}/></linearGradient></defs>
    <rect width="400" height="700" fill={`url(#sky-${scene})`}/>
    {night && <g fill="#fff8b2">{[[34,76],[95,126],[166,55],[230,115],[315,64],[366,155],[278,201],[69,230]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3+1.5}/>)}</g>}
    {scene === "orchard" && <><circle cx="65" cy="455" r="95" fill="#4c9d55"/><circle cx="335" cy="420" r="118" fill="#5caf62"/><rect x="43" y="440" width="28" height="170" rx="12" fill="#865333"/><rect x="325" y="430" width="31" height="180" rx="12" fill="#865333"/><g fill="#ef5a59"><circle cx="35" cy="430" r="8"/><circle cx="84" cy="390" r="8"/><circle cx="315" cy="389" r="9"/><circle cx="370" cy="430" r="9"/></g></>}
    {scene === "snow" && <><path d="M0 470 L98 310 L180 460 L275 250 L400 450 V700 H0Z" fill="#d9f5ff"/><path d="M63 364 l35-54 l31 58 l-28-17z M242 310 l33-60 l45 85 l-42-29z" fill="#fff"/><circle cx="56" cy="190" r="5" fill="#fff"/><circle cx="325" cy="160" r="7" fill="#fff"/></>}
    {scene === "desert" && <><circle cx="324" cy="115" r="53" fill="#ffd166"/><path d="M0 450 Q110 350 225 450 Q305 510 400 405 V700 H0Z" fill="#eaa65d"/><path d="M0 540 Q100 425 220 535 Q315 610 400 500 V700 H0Z" fill="#d88952"/><path d="M68 420 v-94 q0-24 18-24 v54 q24 0 24-23" fill="none" stroke="#4f9b59" strokeWidth="18" strokeLinecap="round"/></>}
    {scene === "beach" && <><circle cx="330" cy="100" r="45" fill="#ffe174"/><path d="M0 390 Q90 350 180 395 T400 390 V700 H0Z" fill="#39aeca"/><path d="M0 460 Q85 420 160 465 T330 455 T400 450" fill="none" stroke="#dffdf6" strokeWidth="15"/><path d="M0 550 Q130 490 265 550 T400 545 V700 H0Z" fill="#f3d794"/></>}
    {scene === "candy" && <><path d="M0 480 Q95 380 185 470 Q290 330 400 470 V700 H0Z" fill="#f8aed0"/><path d="M55 430 v-100" stroke="#fff" strokeWidth="10"/><circle cx="55" cy="310" r="37" fill="#ff7aae" stroke="#fff" strokeWidth="8"/><path d="M55 275 v70 M20 310 h70" stroke="#fff" strokeWidth="7" opacity=".7"/><path d="M330 470 v-125" stroke="#fff" strokeWidth="11"/><circle cx="330" cy="325" r="42" fill="#9c82df" stroke="#fff" strokeWidth="9"/></>}
    {scene === "kitchen" && <><rect y="390" width="400" height="310" fill="#e7b87b"/><path d="M0 390 H400 M0 500 H400 M90 390 V700 M300 390 V700" stroke="#cb915b" strokeWidth="8"/><rect x="40" y="90" width="320" height="220" rx="15" fill="#fff1d7" stroke="#b87955" strokeWidth="10"/></>}
    {scene === "blossom" && <><path d="M0 500 Q110 410 210 500 Q300 390 400 480 V700 H0Z" fill="#b3d999"/><path d="M30 0 Q80 180 150 330 M370 0 Q315 190 230 310" fill="none" stroke="#73513c" strokeWidth="18"/><g fill="#ffb7d2">{[[74,140],[115,215],[300,205],[350,120],[262,260]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="18"/>)}</g></>}
    {scene === "underwater" && <><path d="M0 460 Q100 420 200 465 T400 455 V700 H0Z" fill="#277e94"/><g fill="none" stroke="#b9ffff" strokeWidth="4" opacity=".6"><circle cx="55" cy="290" r="13"/><circle cx="77" cy="245" r="8"/><circle cx="335" cy="320" r="17"/></g><path d="M40 700 Q25 580 75 520 M330 700 Q375 585 330 520" fill="none" stroke="#58bc7e" strokeWidth="18"/></>}
    <path d="M0 620 Q90 570 180 620 T400 610 V700 H0Z" fill={night ? "#25294a" : scene === "snow" ? "#ecfbff" : "#6caf59"} opacity=".9"/>
  </svg>;
}