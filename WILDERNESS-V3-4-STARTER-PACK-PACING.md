# Wilderness V3.4 — Starter Pack Pacing

Original Wilderness World Combat spawns 6–12-member packs in up to 60% of eligible chunks. Changing the immutable sampler would rewrite saved chunk identities. This change instead paces **unprovoked pursuit only**: each healthy overworld pack with more than 3 actors sends its **three closest visible ordinary enemies** at players below level 6. The other members remain in place until the player approaches closely or attacks the pack.

**Combat integrity:** Wounding any group member removes the pursuit limit so the whole pack can retaliate. Close-contact enemies and existing melee windups are never suppressed. Elite/boss encounters, caves, forts, legacy worlds, level scaling and the existing 15-tick incoming hit grace are untouched.

**Save compatibility:** Only read live actor HP, positions, group identity and character level. No spawn/terrain generation, actor identities, loot, save schema, worker, or world namespace changes.

**Checks:** `node --test checks/wilderness-v3-4-pack-pacing.test.mjs`, existing V3.3 tests and `node --experimental-vm-modules checks/startup-module-graph.test.mjs`. Physical iPhone review remains necessary. A true spawn-density/population reroll requires a separately versioned planned world and migration policy; this is not one.
