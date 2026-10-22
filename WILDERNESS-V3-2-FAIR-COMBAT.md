# Wilderness V3.2 — Fair Level-Gap Combat (first balance checkpoint)

**Scope:** Apply a combat delivery override only to the committed Wilderness V3 population. No new spawns, balance RNG, save schema, campaign ID, progression policy, or save-worker changes.

## Player-requested correction

Higher-level enemies already gain damage from their **attack stat**. World Combat V1 was multiplying their direct and periodic damage again by up to **4×** when the enemy exceeded the player's level by more than two. This made an already powerful enemy punish the player twice.

For Wilderness worlds, the new `wilderness_fairness_v3_2.js` policy sets **incoming level-gap scaling to exactly 1×**, preserving enemy damage, elite and boss ability multipliers, player armor, parry, shields and barriers. It leaves the current deterministic level-disadvantage **outgoing resistance** untouched, including spells and periodic player attacks, so a level-one player cannot easily farm or cheese enemies ten levels above them.

The original canonical `WORLD_COMBAT_POLICY` and hash are **not rewritten**. Legacy worlds continue using the original policy; the Wilderness presentation and existing V3 save namespace remain unchanged.

### Verified native example

A level-1 hero in a real level-11 cave was struck by **two** ordinary enemies on the same simulation tick. Both hits were **27 HP**, exactly their 27-damage stat, with **no additional 4× level-gap amplification**. The hero went from 100 to 46 HP. The actual combat state validated and the saved/reopened HP was identical.

## Critical work remaining (do not misrepresent as implemented)

- **Crowd burst:** The example proves two enemies can still land on the same tick. Add a short authoritative post-hit grace period or burst budget to limit simultaneous attacks; preserve boss telegraphs, DoT pacing and defensive procs. This requires a persisted deterministic state/time contract and dedicated tests, so was intentionally not rushed into this small patch.
- **Cleave:** Test a somewhat narrower forward cone and reduced per-combo target caps. Avoid shrinking reach so much that melee becomes frustrating, and preserve boss shield components.
- **Spawn fairness:** Investigate high-level packs visible near first spawn or when using a level-one teleport; do not assume level-gap fix solves encounter placement.
- **Playtest:** Check player survival at level one and the strength of overleveled damage resistance on a physical iPhone.

## Tests

- `node --test checks/wilderness-v3-2-fairness.test.mjs`
- `node --test checks/wilderness-v3-2-fairness-runtime.test.mjs`
- `node --experimental-vm-modules checks/startup-module-graph.test.mjs`
- `node --test checks/wilderness-v3-database-routing.test.mjs`
- Existing World Combat V1 progression tests remain intact and are intentionally not rewritten.
