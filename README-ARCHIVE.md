# SAQ WORLD — BOSS CODE RECOVERY
Recovered October 23, 2026.
This archive is a BACKUP of verified source text found on GitHub, not a claim that every boss has been integrated or that the original polished HTML previews were recovered.

## Source provenance and meaning
01-legacy-SA_Q-Dungeon/: ORIGINAL shipping Dungeon controller, combat and rendering source from SamTheBus/SAQ-Dungeon@main. The legacy engine targets its own Dungeon runtime and is not a plug-and-play SAQ World port.
02-isolated-SA_Q-World-reconstruction/: EIGHT newer shared boss identities (Corrosive, Void, Chronos, Nexus, Gilded, Marcus, Hooktail and Cinderhart). Exact source from SamTheBus/SAQ-World branch boss-restoration-20261023 at commit b421ce91d700fdacf89ebe52eae33e719281525c. Includes deterministic catalog, state contract, simulation controller, Canvas presentation, and integration test. This is a reconstruction, NOT byte-identical copies of the missing standalone playable HTML demos.
03-previous-SA_Q-World-source/: World boss controller/renderers recovered from the historical commit 0cb599ba01131554028244909044f2c1dc98d294 (Treant, Goliath, Brimstone lineage).

## RECONSTRUCTION NOT YET VERIFIED FOR LIVE GAME
GitHub Actions isolated verification failed on 2026-10-23: five seeded site bindings passed; the Marcus fort resolved as aegis_goliath instead of marcus (test checks/recovered-boss-v1.test.mjs, line 63). The branch has NOT been merged into live SAQ World main. Never replace live save/worker or merge this as production without fixing test and running complete build/browser/saved-game checks.

## Boss-by-boss status
- **Arachnid Treant:** Preserved old World controller; roots, Bark Shield and Sprout Cocoons.
- **Aegis Goliath:** Preserved previous World boss presentation/combat; detachable Mimic Shields, phase-two recalled Tower Shield; enrage when no shields survive.
- **Brimstone Colossus / Overlord Iron Vault:** Preserved previous World boss presentation/combat; molten vents and erupting cross fissures.
- **Corrosive Abomination:** Restored World reconstruction module; newer design sheds ~8%-HP chunks, summons slimes up to six, slag/acid hazards in phase two.
- **Void Overseer:** Restored World reconstruction module; five pink eyes, Eye Lance, anchored Singularity and obsidian core. Original standalone v2 playable unavailable here.
- **Chronos Arbitrator:** Restored World reconstruction module; three gears, slow fields, 4-second rewind interruptible by shield break/daze. Original standalone playable unavailable here.
- **Nexus Overseer:** Restored World reconstruction module; rotating prism, shrinking Prism Collapse cage and two holographic shield decoys.
- **Marcus the Outlaw:** Restored World reconstruction module plus original Dungeon controller; orbiting/ricocheting coins, lasso, Gold Rush, afterimages/molten pools. Exact standalone polished source NOT confirmed.
- **Gilded Vault Keeper:** Restored World reconstruction module plus original Dungeon controller; winged ruby-core chest, golden claws, Taxation/gold theft. Exact standalone polished source NOT confirmed.
- **Hooktail:** Restored World reconstruction module plus original Dungeon controller; Scarlet Fire, hooked tail, falling outer arena rings. Original Hooktail-PLAYABLE.html unavailable here.
- **Cinderhart the Wildfire Warren:** Restored World reconstruction module only; charred stag, panicking rabbits, charging flame trail 3s and rabbit-landing fire 5s. Exact standalone prototype unavailable here.

## Missing original polished prototypes (not in this archive)
- corrosive-abomination/Corrosive-Abomination-PLAYABLE-v2.html
- void-overseer/Void-Overseer-PLAYABLE-v2.html
- chronos-arbitrator/Chronos-Arbitrator-PLAYABLE.html
- hooktail/Hooktail-PLAYABLE.html
- Cinderhart independent playable prototype / GIF / verification source
- Full standalone polished Marcus and Gilded Vault Keeper previews/source.
Earlier temporary ChatGPT workspace breadcrumb: /workspace/scratch/81209958b2f8/saq-world-boss-polish . This temporary workspace is NOT accessible from this conversation. Look in local Downloads/Documents/Desktop (or other saved ZIP/HTML downloads), then preserve found files verbatim as an additional layer.

## GitHub links
Original Dungeon: https://github.com/SamTheBus/SAQ-Dungeon/tree/main
World isolated reconstruction: https://github.com/SamTheBus/SAQ-World/tree/boss-restoration-20261023
Previous World source: https://github.com/SamTheBus/SAQ-World/tree/0cb599ba01131554028244909044f2c1dc98d294
Failed reconstruction verification: https://github.com/SamTheBus/SAQ-World/actions/runs/39946973868
