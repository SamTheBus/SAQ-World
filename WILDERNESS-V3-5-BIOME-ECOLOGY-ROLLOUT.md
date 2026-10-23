# Wilderness V3.5 — Live biome and site enemies

Activate the V3 ecology matrix through existing authoritative V1/V2 roster substitutions. New and renewable World encounters use biome-appropriate Dungeon families, while existing roster journals preserve their prior historical recipes.

- **Surface:** Woodland, Grassland, Wetland, Upland, Frostland, Tropical and Volcanic pools. Desert has no suitable existing families, so no artificial Void/Cyber filler is introduced.
- **Approved sites:** 108 cave/fort/ruin/crypt reservations; **74 with existing native-family coverage**, **34 needing new creature designs**. Three accepted starter-site recipes remain unchanged.
- **Rare anomalies:** at most one exotic V2 creature on eligible lower Ruin/Crypt floors, using deterministic reservation/floor hashing. Boss assignments remain review-only.
- **Persistence:** new `wilderness-v3-5-ecology:` keys on newly adopted V1/V2 rows; old keys continue using the old selector. No change to spawn identities/counts, site geometry, generated world, equipment/rewards, actor level scaling, save schema, Worker database, or campaign identity. Browser and pinned V3 save Worker share the same source.

**Test commands:** `node --test checks/wilderness-v3-5-biome-ecology.test.mjs checks/wilderness-v3-ecology.test.mjs`, then `node --experimental-vm-modules checks/startup-module-graph.test.mjs`.

**Next content needs:** new Desert families, plus better Grassland/Tropical sites; actual boss site binding requires separate arena proof. For live playtesting visit a fresh Wetland cave, Upland fort or Volcanic ruin. Previously visited and journaled rooms will not silently reroll.
