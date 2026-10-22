# SAQ World · Stage 1 Cinematic Loading V2

**Status:** Loading-screen presentation update. **No game logic, campaign data, worker routing, save namespace, or world generation is changed.**

## Why

The first animated loading screen used made-up armored hero and green monster silhouettes. The owner rejected those as visibly unlike our game's real artwork. The replacement uses a restrained, authored game-world environment instead of synthetic looking characters.

## Art direction and provenance

The panorama is a lightweight inline SVG **adaptation of the real forest Stage 1 (tier 0) visuals from `SamTheBus/IdleSAQ`, `entities.js`**:
- Deep indigo, plum, peach and warm golden dawn sky (#121829, #4a154b, #ff7675, #ffeaa7).
- Rising sun at the Stage 1 (180, 90) coordinate using its white/amber radial gradient.
- The same distant jagged purple mountain geometry (#271b3e).
- The original algorithmic pine-tree silhouette contours (#0c1f13), with landscape forest ground gradient (#194d22 → #223d1c → #0c1a0c).
- A few quiet, animated cloud/firefly details from the same environment motifs.

The panorama is not a screenshot or an exact full-game render. It's a compact, directly adapted version for a responsive loading composition. **No unrelated AI-generated or imagined hero/monster is present.** No external image/animation assets are required.

## UI

Full-bleed forest backdrop; small SAQ World crest; quiet serif title; matte dark fade; thin gold segmented-by-milestone progress bar; live stage description, elapsed clock, six verified setup steps, diagnostics copy. iPhone-safe with responsive desktop layout and `prefers-reduced-motion` support.

## Compatibility

Preserves `__SAQ_STARTUP_LOADING_V1__` milestones, finish/fail/recovery, copy timings, `wilderness-v3-starter-20261022` saved campaign, and `save-worker.wilderness-v3-migrationfix-20261022.js`.

## Validation

- `node checks/startup-loading-v1.test.mjs` (real progress, finish/fail behavior)
- `node checks/startup-stage1-visual-v2.test.mjs` (authentic Stage 1 visual source, no invented character art, stable 8 DOM IDs)
- `node --experimental-vm-modules checks/startup-module-graph.test.mjs` (490 imports, cache keys and launch contracts)
- `node checks/wilderness-v3-database-routing.test.mjs` (save/worker namespace handshake)
- Chromium/Playwright renders at 390×844, 375×667 and 1440×900; progress advances from 0/6 to 3/6 on an explicit milestone and scene hides on finish; reduced-motion disables background movement.

The new scenery is presentation-only and does not shorten world generation time. Real iPhone visual testing and loading-time profiling remain useful follow-ups.

## V3 visual refinement (user feedback)

The owner noted the first loading UI looked like the Card Packs screen. The Stage 1 authored sky/mountains/pines remain, but the **interface** now uses subdued forest charcoal, parchment-white typography, desaturated sage progress, and a small monochrome game crest. Removed purple/gold card-frame cues, progress glow, heavy bordered diagnostics button, and the generic adventure slogan. The large title simply reads **The Wilderness**; real progress stages, elapsed time, diagnostics and saved-campaign identity remain untouched.

The runtime manifest URL also gets a new `?v=stage1-premium-v3` cache key to prevent the old cached manifest from validating new `index.html` and `world.css` bytes.
