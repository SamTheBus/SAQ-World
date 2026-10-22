# SAQ World — Stage 1 Combat Loading V3

**Scope:** Presentation-only revision responding to game-owner feedback. The actual SAQ World default hero and Woodland Rust Nibbler should duel in the existing IdleSAQ Stage 1 forest loading background, with no giant THE WILDERNESS headline.

## Art provenance
- Hero's `primaryPose` and `drawWorldHero` painter bodies are copied directly from `src/client/hero_presentation.js`. The default red cloak, steel helmet and heater shield silhouette are unchanged.
- Worn sword SVG is copied directly from `src/client/equipment_art.js` definition `worn-sword` and fed through World hero's own `equipmentArt` hook.
- Enemy attack pose and full six-legged rust-nibbler painter are copied from `src/client/creature_presentation_d11.js` and its registered `.68` World visual scale. No fabricated hero, creature, or external images.
- Stage 1 sky, mountains and forest were previously adapted from `SamTheBus/IdleSAQ` tier-0 renderer. Retained unchanged.

## Presentation
- Standalone classic canvas preview loads before game module graph and uses tiny fixed sprites, authentic native attacks, restrained strike flash, 15 fps maximum, reduced-motion still frame, and no simulation/saves.
- Removed unnecessary `<h1>The Wilderness</h1>` headline entirely. Small game logo and `Preparing your world` eyebrow remain.
- Retained milestone-driven progress, elapsed time, copy-timings diagnosis, recovery, and existing muted woodland UI.

## Compatibility
- `data-world-release=wilderness-v3-starter-20261022` unchanged.
- `data-world-save-worker=save-worker.wilderness-v3-migrationfix-20261022.js` unchanged.
- No changes to game startup milestones, game logic, worker, indexedDB routing, world state or environment simulation.
