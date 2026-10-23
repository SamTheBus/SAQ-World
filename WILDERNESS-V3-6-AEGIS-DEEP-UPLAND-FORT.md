# Wilderness V3.6 — Aegis Goliath at Deep Upland Fort

Aegis Goliath now joins the existing standard-fort boss encounters at the exact committed reservation `repeatable-slot:fort:upland:deep:01`, site `site:008569b825d37f670bef85494852022f`, on its fourth/deepest floor. The encounter uses the accepted Mimic Shield component/recall/fusion boss mechanics and existing World boss/elite scaling.

**Actual deterministic arena proof:** the preserved site seed `008569b825d37f670bef85494852022f4d731cbf8b797338ebc376d93f3fdb6f` produces a final floor with 29 encounter member slots and a collision-safe 34px-radius Aegis body anchor. No procedural geography, creature IDs, floors, existing rewards or save namespace are regenerated.

**Eligibility:** committed Wilderness World Combat only; exactly one Deep Upland reservation. Other deep forts, other biomes, non-Wilderness worlds, and existing Standard Fort Aegis fights are not modified. New admissions and normal renewed site episodes can use the new binding; previously saved site records remain as they were.

**Compatibility:** both browser and pinned V3 Worker use the new boss-site predicate; unchanged IndexedDB database and `data-world-release`. Cache-busted boss/Fort modules and a signed runtime manifest. New automated check: `node --test checks/wilderness-v3-6-aegis-fort.test.mjs`. Native gameplay and iPhone visuals still require manual review.

**Not covered here:** Brimstone in a Volcanic Ruin. Its Ruin-family adapter and eruption-space validation are separate work.
