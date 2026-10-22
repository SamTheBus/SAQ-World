# Wilderness V3 · Combat Loading Screen

This release adds a lightweight **presentation-only** first-load experience. No simulation, RNG, persistence, worker database, player statistics, drop rates, or campaign namespace changes.

## What players see

- Fantasy duel: a small animated armored hero swings at a green wilderness monster, with a spark, hit reaction and floating damage indicator. Inline SVG + CSS animations have no heavyweight runtime or downloaded artwork dependencies.
- Six confirmed startup checkpoints: browser module import, world map read, saved campaign lookup, game session creation/resume, asset manifest verification, and the first successfully rendered playable frame. `0/6` through `6/6` reflect **completed steps**, not an invented fraction of total time. A long asynchronous step intentionally does not advance until actually complete.
- During the most expensive stage, additional real progress messages identify when the session checks its saved state, generates terrain, persists its first checkpoint, binds the planned wilderness, and checks enemy rosters.
- Elapsed clock and 'Copy timings' control. The timings are in-memory for this page load only (`window.__SAQ_WORLD_STARTUP_TIMINGS__`) and logged to the browser console. Long waits show a non-ETA explanation. No personal/saved information is copied.
- Reduced-motion mode disables combat animation, and the fullscreen scene yields to the existing startup recovery panel on error. No game controls are reachable while the world is loading.

## Checks

- `node checks/startup-loading-v1.test.mjs`: monotonic completed steps, failure/finish behavior, elapsed timing, no fake 100%.
- `node --experimental-vm-modules checks/startup-module-graph.test.mjs`: imports and syntax across the entire current game client and bridge, presence of the correct worker and cache keys.
- Other gameplay and database routing gates from Wilderness V3 remain unchanged and should pass.
- Visual verification using an isolated Chromium page with the embedded HTML/CSS/controller is possible, but the local browser sandbox forbids navigating to the preview localhost server. The real full client startup still requires an iPhone test.

## Follow-on optimization

The loading animation is not a performance improvement itself. The elapsed/stage log helps determine whether runtime cost is mostly module evaluation, world planning, world authority generation/restore, integrity verification or rendering. Optimize only after reviewing real device timings.
