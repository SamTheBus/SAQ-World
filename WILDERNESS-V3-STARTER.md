# SAQ World — Wilderness V3 starter encounters

**Released checkpoint:** October 22, 2026. The live root game uses its own `wilderness-v3-starter-20261022` release and save worker. The published `/wilderness-v2/` copy and its IndexedDB namespace are retained; existing V2 campaigns are **not** migrated.

## What's live

The native ordinary-roster adoption path is now linked to the V3 ecology policy for exactly three real Mainland Woodland reservations:

| Reservation | Common intended enemies | Behavior |
|---|---|---|
| `repeatable-slot:cave:woodland:small:089` | Rust Nibbler, Slime | Three-quarters of eligible ordinary slots adopt the thematic pool |
| `repeatable-slot:fort:woodland:standard:01` | Animated Armor, Golem | Three-quarters of eligible ordinary slots adopt the theme; existing bosses, shield mimics and elites are not overwritten |
| `repeatable-slot:ruin:woodland:standard:054` | Cursed Blade, Gargoyle | Three-quarters of eligible ordinary slots adopt the theme |

The substitution process is deterministic by campaign/group/actor identity. It uses the existing persisted `ordinaryRoster` episode journal, immutable physical layout, and the same entity/position/loot rules. V2 Clockwork/Cyber substitutions are disabled **only inside these three sites**; other biomes/locations retain their older admission behavior. Unconverted ordinary slots can keep their native encounter definitions. This is a starter-slice release, not a claim that every enemy in the 108-site roster has been rethemed.

### Existing boss encounters

Aegis Goliath currently appears as an inherited combat-content feature on the final floor of *standard* forts. This includes the Woodland fort in this starter slice. Its Mimic Shield summons are preserved by the ordinary-ecology substitution exemptions. This existing behavior differs from the later *desired* placement in a Deep Upland fort; move it only in a dedicated arena/identity-reviewed boss migration, not incidentally during this roster pass. Brimstone follows the existing large-fort rule. No new boss binding is claimed here.

## Safeguards and verification

- The live game has `data-wilderness-v3=true` and retains `data-wilderness-v2=true` to load all 108 Wilderness V2 reservations and 176 reserved event spaces.
- Its saved campaign uses the separate `saq-world-wilderness-v3-` IndexedDB namespace and a new immutable worker entrypoint `save-worker.wilderness-v3-starter-20261022.js`.
- The worker tree is a copy of the published V2 worker with **matching** V3 ecology and roster modules. Older worker trees remain frozen.
- Native 108-site fixture: successfully entered the three target real sites, validated full activity state, saved/reopened roster journals and exact entity IDs/profiles, and exited. No original floor collision, space/group identity, or enemy count changed. Latest local test: 2/2 cases passed.
- Self-contained repository audit: `node --test checks/wilderness-v3-ecology.test.mjs`.
- Save worker module imported in Node without missing dependencies after removing a client-only creature-presentation dependency.
- Real iPhone exploration/combat/frame rate still needs user playtesting. Current 176 event clearings are reserved but not live event spawners; Desert, Grassland and Tropical require additional native mobs.

## Next slice

Playtest the Woodland trail → cave/fort/ruin → loot → return route with ordinary player movement. Confirm that the inherited Aegis encounter is appropriate for the starter fort; if not, plan a versioned future boss relocation. Then activate a bounded forest event using the established 176 clearings without disrupting the existing world generation or older saves. The full Dungeon-inspired interface redesign remains a separate upcoming milestone; reactive health feedback is already live.
