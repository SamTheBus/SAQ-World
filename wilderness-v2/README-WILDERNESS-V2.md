# SAQ World — Off-road Wilderness V2 (local review)

This is an **unpublished local playable source build**. It extends the October 21 cumulative SAQ World build, not the inaccessible October 22 108-site checkpoint. The prior checkpoint's 73 appended site IDs could not be reconstructed, so those IDs are **not** claimed to be preserved or migrated. Existing base Alpha sites and world plan remain intact.

## What is implemented

- 35 existing playable site bindings **plus 73 new native site bindings** (108 in this isolated build): 28 new caves, 25 new ruins, 11 new forts, nine new crypts. Their actual exterior geometry, site sockets, multi-floor interiors, rewards and persistent instance boundaries use the existing native systems, not fake map markers.
- Off-road accessibility: 31 short footpaths, 22 wilderness trails, six near-road sites, 14 hidden/partial destinations. Full routes contain walkable footpath tiles and show up as minor tracks instead of new main highways. Twelve of the hidden sites have fragmentary worn tracks; two have no trail at all.
- 176 separately reserved, terrain-cleared event locations, with metadata in `assets/wilderness-v2/alpha.json`. **No live event spawner, roaming event director or event reward loop has been built yet.**
- Immutable base Alpha asset, settlement and original reservation contracts are unchanged. Wilderness is an explicit versioned optional extension with a SHA256-verified sidecar and separate local IndexedDB namespace.
- Existing native worker code copied to a new versioned path so the saved-state worker and main thread use exactly the same new generation and population contracts.

## How to run

Extract the ZIP, install Node.js if necessary and run `Start-Preview.cmd` on Windows (or execute `node preview-server.mjs` in this folder on another OS). Open `http://127.0.0.1:8819/` in a desktop browser. This preview starts its own isolated local campaign and never updates the public GitHub Pages game.

The development inspection menu can jump to specific generated entrances using the existing site review controls; ordinary walking, trails, map observation, dungeon entry and durable saving all use native systems.

## Validation

- `node tools/test-wilderness-load.mjs` — native generation of 108 reservation records.
- `node tools/test-wilderness-geometry.mjs` — 73 walkable entrances, all 176 walkable event clearings, 9,074 explicit minor path cells, 12 actual exterior generation examples and unchanged baseline spot checks.
- `node tools/test-wilderness-native.mjs --family=cave|ruin|fort|crypt` (one family at a time) — native entry and save/reopen for one addition of each kind.
- `node tools/verify-wilderness-release.mjs` — SHA256 verification of all 3,546 archived runtime file entries, asset SHA, client import map and worker mirrors.

**Not verified:** visual browser gameplay in this environment (local Chromium policy blocked loopback HTTP), actual iPhone Safari performance, original inaccessible 108-site save migration and discovery cadence on a physical phone. Old saved campaigns aren't silently migrated; the new preview uses a separate namespace. The local existing beginner cave remains, but the unpublished October 22 starter-site shortcut and its safety corrections cannot be included without that checkpoint's exact source.

## Next work

1. Rebase to the correct later 108-site checkpoint if its source/ZIP becomes available, retaining its original appended IDs.
2. Test the revised distribution on a physical iPhone and adjust trail discoverability, UI labels, and travel cadence.
3. Build an actual overworld event director that activates only a bounded set of the 176 clearings, with persistent completion/repeatability rules.
4. Continue spawn ecology and integrate the polished bosses into site themes.

GitHub and private boss-preview Site have **not** been updated.
