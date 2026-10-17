# Orchardly: Fruit Merge

Orchardly is a portrait-first, offline fruit merge puzzle game. Gameplay is rendered on an HTML5 canvas with a fixed-step Matter.js simulation. All artwork is generated with SVG, canvas, and CSS; all sound and music is generated with Web Audio. Matter.js, Fredoka, and every runtime asset are bundled locally.

## Included

- Physics-based fruit dropping, eleven merge levels, combos, danger timing, particles, shake, and score text
- Sixty data-driven levels across six paged illustrated worlds
- Score, create-fruit, and merge goals with drop limits, frozen fruit, and rock obstacles
- Endless mode, pause, revive, retry, sharing, tutorial, collection, missions, and settings
- Local coin economy, daily streak, power-ups, mystery chests, purchases, and equipment
- Ten fruit skins, nine jars, and nine scenery backgrounds drawn in code
- Versioned `localStorage` saves with guarded reads, writes, and reset
- Procedural Web Audio effects and music with saved sound settings
- Responsive fixed-viewport layout with no scrolling or network requests
- Capacitor configuration for `com.yourname.orchardly`

## Run In A Browser

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev -- --host
```

Open the LAN URL printed by Vite on a phone connected to the same network. The viewport disables browser zoom, selection, context menus, pull-to-refresh, scrolling, and overscroll.

Create and test the production bundle with:

```bash
npm run build
npm run preview -- --host
```

The production build is written to `dist/`. The configured Vite single-file plugin inlines the game code, styles, and fonts into the generated HTML for dependable offline packaging.

## Project Structure

- `src/App.tsx`: full-screen app and screen manager
- `src/index.css`: fixed viewport layout, responsive art direction, and animation
- `src/game/config.ts`: fruit chain, six worlds, sixty levels, shop registry, and skin registry
- `src/game/GameCanvas.tsx`: input, fixed-step physics, merges, goals, danger logic, and power-ups
- `src/game/renderer.ts`: canvas fruit, container, liquid, obstacle, and particle rendering
- `src/game/storage.ts`: save schema, migration defaults, and guarded persistence
- `src/game/audio.ts`: procedural sound effects and music
- `src/components/Art.tsx`: SVG fruit, jar, coin, chest, scene, and badge illustrations
- `capacitor.config.ts`: Android/iOS wrapper settings

## Add Or Tune Levels

Levels are exported from `src/game/config.ts` as the `LEVELS` array. `makeLevel()` generates each entry, so broad difficulty changes can be made in one place. Each level supports:

```ts
{
  id: 61,
  world: 6,
  goal: { type: "merge", target: 6, fruit: 5 },
  drops: 28,
  starScores: [4200, 5900, 7600],
  obstacles: { frozen: 2, rocks: 2 },
  boss: false,
  coins: 70
}
```

Goal types are `score`, `create`, and `merge`. `fruit` is a zero-based index into `FRUITS`. Add a corresponding entry to `WORLDS` for each additional ten-level map page, then extend the map page limit and dots in `src/App.tsx`.

## Add Skins And Shop Items

The single `SKINS` registry in `src/game/config.ts` groups fruit skins, jars, backgrounds, power-ups, and chests. Add an item with a unique `id`, display `name`, `rarity`, `price`, and `preview` key.

For a fruit skin, add its palette to `FRUIT_SKINS`, then add any special SVG treatment in `FruitIcon` and matching canvas treatment in `drawCanvasFruit`. Size and fruit-specific details remain driven by the base fruit index.

For a jar, add the item to `JARS`, then add the key's colors or line treatment to `JarIcon` and `drawJar`. Physics walls automatically use the same responsive container bounds.

For a background, add the item to `BACKGROUNDS`, then add an SVG scenery branch to `SceneArt`. No bitmap or network asset is required.

## Build An Android APK With Capacitor

Android Studio and an Android SDK are required. Capacitor dependencies and `capacitor.config.ts` are already included.

1. Build the web bundle.

```bash
npm run build
```

2. Add the Android project the first time only.

```bash
npx cap add android
```

3. Copy the latest offline web bundle into Android and open Android Studio.

```bash
npx cap sync android
npx cap open android
```

4. In Android Studio, use **Build > Generate App Bundles or APKs > Generate APKs** for a test APK, or **Generate Signed Bundle / APK** for a release.

The configured app id is `com.yourname.orchardly`, the app name is `Orchardly: Fruit Merge`, and Capacitor reads the compiled files from `dist`.

For a portrait-only release, add `android:screenOrientation="portrait"` to the generated main activity in `android/app/src/main/AndroidManifest.xml`. The web layout still safely handles landscape and centers a portrait playfield.

After subsequent web changes, run:

```bash
npm run build
npx cap sync android
```

## Offline Notes

The game has no fetch calls, remote URLs, analytics, ads, or CDN references. The rewarded-bonus button is intentionally a local placeholder hook and never contacts a service. If an ad provider is integrated later, its network and privacy requirements are outside the current offline build.