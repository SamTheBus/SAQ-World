# SAQ World Boss Source Archive — 23 October 2026

**13 recovered source files, original and reconstructed, not a verified playable boss update.**
This branch/archive is kept separate from SAQ World main to protect the playable game and existing saves.

01-SAQ-Dungeon-original contains ORIGINAL Dungeon boss_ai.js, boss_combat.js, mob_renderer.js, bestiary_data.js and constants.js. These include original boss controllers and art for Corrosive, Void, Chronos, Nexus, Marcus, Gilded Vault Keeper, Hooktail and other original Dungeon bosses. Dungeon controllers are not directly drop-in World code.

02-SAQ-World-reconstruction contains FOUR real World source modules and ONE integration test from SamTheBus/SAQ-World@b421ce91d700fdacf89ebe52eae33e719281525c: recovered_boss_catalog_v1.js (all 8: Corrosive, Void, Chronos, Nexus, Marcus, Gilded, Hooktail, Cinderhart), recovered_boss_v1.js state contract, recovered_boss_v1.js simulation, recovered_boss_presentation_v1.js hand-authored visual code, recovered-boss-v1.test.mjs. This is reconstructed code, NOT the byte-identical original polished standalone playable HTML files.

03-SAQ-World-previous has pre-cleanup World boss_combat_d12_5.js and Aegis/Brimstone presentation code from 0cb599ba01131554028244909044f2c1dc98d294; the already-integrated Arachnid Treant, Aegis Goliath and Brimstone lineage are represented there.

**Verification blocker: NOT MERGED INTO LIVE MAIN.** The isolated reconstruction's GitHub test passed five individual site proofs but then failed: Marcus's reserved site resolved to Aegis Goliath instead of Marcus. See https://github.com/SamTheBus/SAQ-World/actions/runs/39946973868 . Treat this as archived source awaiting a full fix and playtest.

## Latest designs to preserve separately from original implementation
- Aegis: detachable elite Mimic Shields, phase 2 fused Tower Shield recall, enraged if all destroyed.
- Brimstone: eruption-style cross fissures and volcanic vent effects.
- Corrosive: chunks shed at roughly 8% HP, adds up to six slimes, slag/acid phase.
- Void: five luminous pink eyes, Eye Lance, anchored six-second Singularity.
- Chronos: triple rotating gears, slow fields, interruptible four-second Rewind.
- Nexus: rotating prism, shrinking Prism Collapse cage, two holograms protecting boss.
- Marcus: eight orbiting coins, ricochet barrage, Gold Rush afterimages and molten pools.
- Gilded Vault Keeper: gold winged chest, glowing ruby core, Taxation theft and shield.
- Hooktail: Scarlet Fire, hooked-tail strikes, sequential collapsing arena rings.
- Cinderhart: charred stag, panic-hopping rabbits, three-second fire charge trail, five-second landing fires, five faster rabbits in phase two.
- Treant: root hazards, Bark Shield and three Sprout Cocoons.

## Unrecovered source / demo files (not invented)
corrosive-abomination/Corrosive-Abomination-PLAYABLE-v2.html
void-overseer/Void-Overseer-PLAYABLE-v2.html
chronos-arbitrator/Chronos-Arbitrator-PLAYABLE.html
hooktail/Hooktail-PLAYABLE.html
Cinderhart standalone playable source/GIF, latest standalone Marcus and Gilded polished previews.
Previous chat temporary-cloud breadcrumb /workspace/scratch/81209958b2f8/saq-world-boss-polish is not accessible from here.
