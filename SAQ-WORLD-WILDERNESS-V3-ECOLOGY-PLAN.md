# SAQ World — Wilderness V3 Enemy Ecology & Site Assignment

**Status:** Implementation plan — October 22, 2026. Not a claim that the encounters below are live.  
**Source:** GitHub `main` Wilderness V2 (108 sites: 35 retained + 73 additions) and current `WORLD_CREATURES_D11` metadata.  
**Design baseline:** [SAQ-WORLD-MASTER-ROADMAP.md](https://github.com/SamTheBus/SAQ-World/blob/main/SAQ-WORLD-MASTER-ROADMAP.md).

## Objective

Populate the continuous world without turning its biomes into interchangeable randomized bags. The basic loop is **town → trail → encounter → cave/ruin/fort/crypt → meaningful reward → town**. Keep intentional quiet territory and leave the 176 reserved event clearings available. Small sites usually terminate in ordinary combat or elites; only appropriately sized and themed sites should host major bosses.

## Confirmed Wilderness V2 site counts

| Biome | Total | Caves | Ruins | Forts | Crypts | Current variety | Immediate need |
|---|---:|---:|---:|---:|---:|---|---|
| Woodland | 15 | 7 | 5 | 1 | 2 | Sprout, Slime, Thorn Wyrm, Rust Nibbler, Golem, Animated Armor, Gargoyle, Cursed Blade | Organize habitats; new large/deep signature arena |
| Desert | 15 | 9 | 4 | 1 | 1 | No desert-native ordinary family; generic Void Orb is biome-agnostic | **Critical:** desert fauna and raiders before common overworld spawning |
| Upland | 16 | 5 | 6 | 4 | 1 | Wyrmling, Gilded Scuttler, Mimic Shield | More natural surface wildlife; suitable Aegis fort |
| Tropical | 11 | 2 | 6 | 1 | 2 | Thorn Wyrm is the main native match | **Critical:** canopy/temple/venom families |
| Grassland | 13 | 3 | 3 | 6 | 1 | Thorn Wyrm is the main native match | **Critical:** common melee fauna/bandits and fort occupants |
| Volcanic | 10 | 5 | 3 | 2 | 0 | Magma Elemental, Lava Serpent, Hell Bat, Slag Slime | Good base; tie hazards to lava architecture |
| Frostland | 14 | 5 | 2 | 2 | 5 | Wyrmling, Gilded Scuttler, Mimic Shield | An icy melee pursuer/undead family |
| Wetland | 14 | 4 | 5 | 1 | 4 | Swamp Basilisk, Toxic Fly, Marsh Ghost, Corroded Golem | Good base; differentiate crypts from marsh caves |
| **All** | **108** | **40** | **34** | **18** | **16** | | |

Do **not** treat the broadly tagged Void/Cyber/Temporal/Clockwork import families as ordinary wildlife in every biome. Reserve those for themed anomalies, arcane ruins, deep crypts and exceptional encounters. Their current broad eligibility metadata is an input limitation, not an ecological design decision.

## Proposed encounter roles (existing assets first)

| Biome | Overworld ordinary / patrol | Caves | Ruins and crypts | Forts | Gaps |
|---|---|---|---|---|---|
| Woodland | Sprout, Slime, Thorn Wyrm | Rust Nibbler, Slime, Golem | Cursed Blade, Gargoyle, occasional Sprout | Animated Armor, Golem | More natural fauna later |
| Grassland | Thorn Wyrm **only for now** | Sparse / thorn creatures | Rare haunted blade/anomaly, not common | **Needs bandit/guard roster** | Boar, field raider, harrier |
| Wetland | Toxic Fly, Marsh Ghost | Basilisk, Corroded Golem | Marsh Ghost and haunted variants | Corroded guard variants | Distinct swamp crypt apparition |
| Upland | Wyrmling, Gilded Scuttler | Scuttler, Wyrmling | Shield Mimics only in cursed/guarded sites | Shield Mimics, heavy guardians | Rock predator / bird |
| Desert | **Do not fill with universal Void creatures** | Needs local crawlers | Rare occult anomaly only | Needs actual raider guardians | Dune Scuttler, Sand Stalker, Dust Revenant |
| Frostland | Wyrmling, Gilded Scuttler | Wyrmling, ice burrowers later | Haunted frozen protectors | Shield Mimics only in special forts | Snow prowler, Ice Revenant |
| Tropical | Thorn Wyrm | Vine/venom family required | Temple guardian required | Jungle defenders required | Canopy Raptor, Vine Stalker, Temple Guardian |
| Volcanic | Hell Bat, Lava Serpent | Slag Slime, Hell Bat | Magma Elemental, slag creatures | Magma Elemental, Lava Serpent | Few; boss/hazard cohesion is higher priority |

**Important:** A proposed family in the Gaps column is not implemented. A reused actor outside its current eligibility must be explicitly reviewed, given an appropriate encounter identity, and wired in a versioned ruleset rather than silently enabled by the planner.

## Starter-region vertical slice: mainland Woodland, Bands 1–2

Work with *existing reservations*; no new geography required for this first loop:

- `repeatable-slot:cave:woodland:small:089` — newly scattered Band 1 cave. Use Rust Nibblers and Slimes, one clear objective, short reward loop, and a readable off-road approach.
- `repeatable-slot:fort:woodland:standard:01` — existing Band 1 woodland fort. Animated Armor and Golem defenders, plus a fair final elite. Do not force a major boss into this standard fort.
- `repeatable-slot:ruin:woodland:standard:054` — dispersed Band 2 ruin. Cursed Blades with a Gargoyle guardian, environmental clues, and a more advanced reward.

Include a town return/reward spend, discoverable branching footpaths, and one bounded forest event with save/reopen persistence. Make combat, drops, entrances and return trip playable *without debug teleport*. The first pass should favor a few intentional encounters over high spawn frequency and should be tested on iPhone.

## Polished-boss placement candidates (not yet integrated)

| Boss | Preferred site reservation | Why | Gate |
|---|---|---|---|
| **Aegis Goliath** | `repeatable-slot:fort:upland:deep:01` | Deep fortified architecture, shield-based guardians, Mimic Shield components, recall/fusion mechanics | Check current native binding, arena footprint, actor clearance, reward and save rules; preserve any existing boss fixture |
| **Brimstone Colossus** | `repeatable-slot:ruin:volcanic:large:01` | Ruined volcanic arena with space for erupting cross-fissures and safe diagonal gaps | Verify lava hazard geometry, arena collisions, support mobs and existing boss-binding assumptions |
| **Arachnid Treant** | **Requires a new large/deep Woodland cave or ruin reservation** | Needs a substantial overgrown chamber and a readable bark/cocoon phase, not a tiny starter cave | No appropriate large/deep Woodland slot currently exists among the 108; create a compliant site candidate first |
| **Wildfire charging creature / panicked rabbits** | Later event/boss arena, likely Woodland | Funny and memorable design concept with temporary fire trails and panicked wildlife | Concept only; do not count as existing runtime boss |

Not every large site must have a major boss. Some should culminate in hard elites, special loot or environmental discoveries. This keeps bosses rare enough to feel like discoveries.

## Implementation stages and safety

1. Establish a **pure, deterministic ecology policy** from immutable site identifiers, biome, site family, tier, progression band and optional anomaly theme. Enforce supported enemy-definition IDs and count coverage gaps. Do not mutate the frozen site selection or existing save schema.
2. Implement and test the **starter Woodland vertical slice** in a fresh explicitly versioned world/runtime namespace, including both client and the matching save worker. Preserve the V2 playable snapshot and avoid silent migration of older campaigns.
3. Connect a controlled overworld event director to a few of the 176 reserved clearings. Its preexisting `planWildernessEvents` is planning code, **not** a live actor/reward spawner. Enforce active caps, repeatability, completion persistence, and safe settlement buffers.
4. Expand **Upland/Volcanic boss arenas** only after their native geometry and persistence checks pass. Integrate Arachnid Treant only with its own proper site.
5. Build missing Grassland/Desert/Tropical enemies and bind them through tested official creature definitions. Only then attempt global 108-site rollout and later loot/drop tuning.

**Acceptance tests:** all 108 reservations mapped to either a valid native roster or explicit coverage gap; no invalid species IDs; no universal cyber/void wildlife; no common encounters inside safe settlements; trails and clearings remain traversable; no boss in an undersized arena; V2 save isolation and original island/settlement/site IDs retained; browser, worker and physical-phone play verified separately.

## Parallel visual direction (owner preference)

The owner specifically likes **SAQ Dungeon's** dark-fantasy UI, low-health screen vignette, damage-reactive player/enemy HP bars and boss bars. The first visual-only feedback upgrade was committed to SAQ World `main` on October 22, 2026 as `15c0a3bc`; continue improving the overall HUD, panels, map, inventory, fonts and mobile controls using Dungeon as a stylistic reference. This is not a full UI redesign yet. Keep damage trails visual-only and honor reduced-motion preferences.
