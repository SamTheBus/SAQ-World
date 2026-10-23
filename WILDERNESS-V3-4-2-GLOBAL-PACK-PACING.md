# Wilderness V3.4.2 — Global first-contact pursuit budget

V3.4.1 caps *each* healthy overworld pack at three unprovoked pursuers for novice heroes. Multiple packs could still send six or more. In committed Wilderness V3 worlds, first-contact pursuers are now ranked across all active eligible unprovoked packs, limited to **three ordinary mobs per level 1–5 player** in an overworld region with minimum level 1–5 or within 1,536px of the initial starting point.

All mobs stay alive and visible. The nearest eligible, unobstructed three are allowed to approach; other members wait as reinforcements. Selection is deterministic and recomputed once per 60Hz authority tick. The global budget is per player, including multiplayer.

**Anti-cheese preserved:** Hitting or one-shotting *any* pack member still causes that pack's full V3.4.1 retaliation. Bosses, elite affixes, committed melee windups, already-close opponents, sites, dungeons, high-level regions far from the start, and heroes level 6+ retain their established behavior. The 15-tick direct damage grace from V3.3 remains intact.

This is AI-only. It does not alter spawn identities, encounter geometry, damage values, progression, inventory/rewards, save files or Worker validation. Existing wilderness campaign IDs and releases are unchanged.

Regression: `node --test checks/wilderness-v3-4-2-global-pack-pacing.test.mjs checks/wilderness-v3-4-pack-pacing.test.mjs`; boot: `node --experimental-vm-modules checks/startup-module-graph.test.mjs`.

Still needs iPhone playtest to observe real crowded pack behavior and tune the limit if it feels too passive.
