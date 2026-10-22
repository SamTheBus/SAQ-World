# SAQ World — Master Development Roadmap

**Status:** User-approved direction, October 22, 2026  
**Purpose:** Stable cross-conversation development reference for SAQ World. This document records the agreed priorities and should be consulted before choosing the next major implementation task.  
**Live source:** https://github.com/SamTheBus/SAQ-World (branch `main`)  
**Playable game:** https://samthebus.github.io/SAQ-World/

## Guiding decision

**Make one complete region genuinely fun to play before attempting to finish every system globally.** SAQ World already has a large traversable world and many prototype systems. The next priority is a coherent RPG adventure loop: depart a town, follow roads/trails, discover a site, encounter biome-appropriate enemies and a suitable boss/elite, earn useful rewards, return to town, and optionally travel by ferry. Scale the successful systems across the rest of the world.

Avoid designing towns, sites, UI, encounters, and economy as unrelated projects. Build interoperable systems, preserve existing content, and use short playable checkpoints rather than long isolated workstreams.

## Approved priority order

1. **Enemy ecology and boss placement** — Assign enemies by biome and site identity; locate existing polished bosses where their mechanics and arenas make sense. Give overworld areas danger and variety.
2. **Overworld encounters** — Activate a controlled subset of pre-reserved wilderness event clearings; add roaming packs, ambushes, abandoned camps, treasure discoveries, and elite hunts with persistence.
3. **UI visual direction and redesign** — The current UI style is unsatisfying to the project owner. Establish a unified fantasy-RPG visual language; improve HUD, inventory, maps/minimap, prompts, combat feedback, and mobile usability before multiplying inconsistent screens.
4. **Site artwork and environmental identity** — Improve readable, biome-specific cave, ruin, fort, and crypt exteriors/interiors; vary landmarks, architecture, set dressing, and rewards.
5. **Complete towns and services** — Build out useful NPCs, vendors, taverns/inns, interiors, settlements, and local identity. Retain flexible service mixes; reserve some specialty/exclusive amenities for bigger towns and cities. Avoid artificial single-purpose settlements (e.g. a mandatory 'Forge Town').
6. **Finish ferries** — The existing network is a foundation. Refine landing/dock art, boats, travel presentation, clarity, accessibility, and reliability without needlessly rebuilding the underlying connectivity.
7. **Mob difficulty and loot-quality balance** — Begin basic balance alongside encounters; finish progression tuning once the play loop is working.
8. **Economy and drop-rate balance** — Finalize after enemies, loot pools, town merchants, and advancement coexist in gameplay, not in isolation.

## Milestones

### Milestone 1 — Wilderness V3: A Living World (**NEXT**)

- Define an **enemy ecology matrix** for all eight world biomes: woodland, grassland, wetland, upland, desert, frostland, tropical, volcanic. Include surface vs dungeon eligibility and variations by site family, size, tier, faction/theme, and encounter role.
- Assign existing ordinary mobs and elites. Identify biome coverage gaps and invent/add only the necessary new enemies (do not randomly scatter every species in every biome).
- Map existing polished boss prototypes to appropriate site families and arenas. **Not every dungeon needs a boss**: use elites/minibosses at some smaller sites, memorable major bosses in larger/deep sites. Boss mechanics, support mobs, environmental cues, and reward themes should fit together.
- Implement an actual **bounded overworld event director** from the already reserved 176 event positions: deterministic activation, encounter spawning, persistence/completion/repeatability, and appropriate rewards. The current event planning file is not yet a live gameplay director.
- Ensure new dispersed sites are discoverable from small roads, branching footpaths, trails, landmarks, and occasional hidden routes; avoid making every site sit directly on a main road. Preserve room for wilderness events and natural quiet areas.
- Add preliminary loot and threat budgets to make the encounters rewarding; don't claim final balance.
- **First playable vertical slice**: one starter region with a town, paths/trails, ordinary overworld enemies, a site with room-by-room inhabitants, an elite/boss, drops, a return-to-town use for rewards, save/reopen behavior, and an optional ferry excursion.
- Test native gameplay and mobile performance; prioritize real iPhone exploration cadence, encounter readability, and preserving prior world geography, original sites, and save isolation.

**Milestone 1 exit criteria:** A player can naturally discover a worthwhile site without dev teleport controls, enjoy an identifiable combat/loot loop, return to useful town services, and resume saved progress. At least one polished boss works in its live themed arena. Event content is genuinely playable rather than just reserved coordinates.

### Milestone 2 — Cohesive Visual Identity

- Start concept/UI direction **in parallel** with Milestone 1 so future artwork follows the same style; do not wait to address dissatisfaction with the current HUD.
- Agree on a reusable design system (palette, type, frames/panels, icons, UI density, feedback, motion, mobile controls/accessibility).
- Redesign core HUD, inventory, map/minimap, menus, dialogue/interaction prompts, loot/quest messaging, combat and boss telegraphs.
- Carry the visual language through biome-specific sites, entrance silhouettes, interiors, towns, taverns, service buildings, docks, and ships.
- Prioritize coherent, legible, performant 2D/Canvas presentation over decoration that interferes with mobile play.

**Milestone 2 exit criteria:** The game looks and reads as a cohesive fantasy RPG on desktop and phone; location type and threat level are visually legible; reusable patterns prevent screen-by-screen style drift.

### Milestone 3 — Gameplay Depth, World Services & Progression

- Finish scalable settlement behaviors, vendor/service availability, NPC roles, taverns/inns, interiors, and town identities.
- Finish ferries' visual and UX layer using the existing established landings/routes; test island accessibility and travel/save behavior.
- Expand equipment/reward variety, merchants, crafting/upgrading, and advancement relationships only where they support the actual play loop.
- Systematically tune enemy HP/damage/AI, miniboss/boss difficulty, rarity, drops, gold income/sinks, and reward pacing. Use repeatable playtests rather than arbitrary percentages.

**Milestone 3 exit criteria:** Exploration, combat, travel, inventory, town services, and progression reinforce each other. Reward pacing and player power are tested at multiple stages.

## Important design rules and project-owner preferences

- **Exploration first:** The world must not be huge, empty, and time-consuming just to reach a site. Sites should be scattered naturally, discoverable without always sticking to main roads, with branching minor tracks, environmental clues, and room for unscripted encounters.
- **Biome identity matters:** Enemy groups, boss encounters, site atmosphere, hazards, architecture, and loot should feel appropriate to their locations. Do not treat biomes as mere palette swaps.
- **Boss spectacle matters:** Preserve and integrate prior boss-polish work. For example, Aegis Goliath's detachable Mimic Shields, possible recall/fusion into a tower shield, and enraged fallback if shields are destroyed; dramatic erupting fissures on the Brimstone-type encounter; wildfire/charging creature concepts with panicked wildlife. These are design concepts/prototypes, **not** a claim they are all integrated into the public build.
- **Not every site is a boss arena.** Create sensible distinctions among normal dungeons, elite encounters, rare encounters, and major boss sites.
- **Town flexibility:** Larger settlements can have exclusive services, but smaller ones are not forced into rigid craft-themed identities. Settlements should feel like places, not vending-machine menus.
- **The UI needs a new visual direction.** Design once and reuse components instead of polishing the current unsatisfying aesthetic one screen at a time.
- **Avoid premature full balance.** Implement broad, playable envelopes early; tune exact numbers/drop rates only after combat, loot, and economy are connected.
- **Preserve progress and previous systems.** Prefer additive, versioned changes and verification that existing world generation, settlements, ferry network, site IDs, saved campaigns, and assets remain intact; avoid mixing unverified prototypes into live builds.
- **Work incrementally and publish verified checkpoints** to the `main` GitHub build once tested, rather than building large disconnected demos for long periods.

## Baseline and outstanding caveats at time of approval

The `main` branch on October 22, 2026 published the **Wilderness V2** source under commit `1531778611acf92c642dd6fd630c034722fdc99b` (GitHub Pages deployment succeeded). That release describes **108 playable sites** in the published variant (35 existing + 73 additions) and **176 reserved overworld event slots**. Reservation is **not** equivalent to live event spawning. The ferry network has working foundational landing/route data. Polished boss previews and mob content exist, but comprehensive biome-site assignment and integration into the live world are outstanding. The Wilderness V2 README notes that a prior inaccessible checkpoint's appended site IDs were not reconstructed and old campaigns were isolated rather than silently migrated. This roadmap is **a plan, not a statement that these future milestones have been implemented**.

## Next immediate work package

**Wilderness V3 / Enemy Ecology & Encounter Placement**

1. Inventory which mob and boss definitions already exist and which are live, fixture-only, or presentation-only.
2. Draft an eight-biome × surface/site-family × tier eligibility and encounter-role matrix, including gaps.
3. Select one starter-region path/site/town loop, assign a coherent enemy roster and one polished boss/elite, and implement it end-to-end.
4. Connect a small controlled sample of actual wilderness events to the reserved clearing system; then generalize.
5. Playtest exploration frequency, readability, save integrity, reward usefulness, and performance. In parallel, sketch two or three UI art-direction options for review before adopting one.

**Instruction for future SAQ World chats:** Treat this roadmap as the agreed high-level priority baseline. Check the current GitHub `main` state and any newer explicit user decisions before implementation. Do not silently reorder priorities, assume unbuilt features are live, or overwrite more recent user choices. If the owner says 'continue SAQ World', start from Wilderness V3 enemy ecology/boss placement and the starter-region vertical slice unless a newer accepted milestone supersedes it.