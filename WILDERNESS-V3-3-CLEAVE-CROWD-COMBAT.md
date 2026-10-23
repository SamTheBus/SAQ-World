# Wilderness V3.3 — Focused cleave and crowd fairness

This opt-in update only affects committed Wilderness worlds. World Combat V1 policy/hash, legacy worlds, 32px clear-hull gap reach, attack timing, boss shield components, hero progression, and existing Wilderness V3 save namespace are unchanged.

**Cleave:** forward dot 0.1 (~174° cone) to 0.45 (~127° cone); nearest targets per combo 4/6/8 to 2/3/4. Breakable targeting uses the same narrower angle.

**Crowd hit protection:** A successful ordinary or elite hostile *direct HP hit* grants a per-player 15-tick (250 ms at 60 Hz) protection window. Subsequent ordinary/elite direct hits consume their attack cooldown/projectile but deal no HP damage and do not roll defenses, apply melee status procs, or emit phantom hits. Barrier-only and fully prevented hits do not start grace. Boss scripted/telegraphed attacks and all damage-over-time packets bypass the window.

**Durability:** optional bounded `wildernessCrowdGraceByEntityId` root field stores a future eligible tick per living player, validates in both client and pinned V3 IndexedDB Worker, persists through cut/reopen, and clears on expiration, defeat, respawn, and travel. Old saves require no migration. The Worker boot filename changes only for cache invalidation, not its database namespace.

**Checks:** `node --test checks/wilderness-v3-3-combat-tuning.test.mjs checks/wilderness-v3-3-combat-runtime.test.mjs`, `node --experimental-vm-modules checks/startup-module-graph.test.mjs`, and existing V3.2 fairness/save tests.

**Still to playtest:** iPhone combat feel and whether starter-area high-level packs need separate placement tuning.
