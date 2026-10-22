# Wilderness V3 — iPhone migration startup repair

**Date:** October 22, 2026  
**Symptom:** The game rendered its header but remained blank, then displayed `World could not start — Missing historical migration cut`.

## Root cause

The main-browser campaign store used `saq-world-wilderness-v3-alpha` for the new Wilderness V3 Alpha game, while the versioned save worker still used `saq-world-combat-v2-alpha`. The D9 world migration requires the initial historical activity checkpoint to exist in the same IndexedDB database. The worker queried the wrong database and correctly refused to publish an origin root because the checkpoint was absent.

This was a wiring mismatch introduced while versioning the browser release; not evidence of corrupted user progress.

## Fix

- Include `wildernessV3=1` in the explicitly planned, versioned worker URL.
- Resolve the worker database to the same unchanged `saq-world-wilderness-v3-${plan}` namespace as the browser; reject missing/invalid plan identities rather than falling back silently.
- Have the worker send its actual database name in the readiness handshake. Both save and world bridges verify the expected name and reject mismatches before any commands run.
- Pin a **new immutable save-worker mirror** under `worker/wilderness-v3-migrationfix-20261022/`, retaining the previous V3 and V2 workers and snapshots intact.
- Keep `data-world-release="wilderness-v3-starter-20261022"` so existing V3 saves and launcher records retain their keys. No data reset, deletion or automatic migration was added.
- Cache-bust updated client scripts, boot entrypoint and runtime integrity manifest.

## Verification

- `node checks/wilderness-v3-database-routing.test.mjs`: reproduces screenshot error when the worker points to the wrong store; verifies same V3 name in client and worker, rejects mismatches before writes, and passes with a matching handshake.
- `node --experimental-vm-modules checks/startup-module-graph.test.mjs`: full game browser module parse/import and fresh release asset checks.
- `node --test checks/wilderness-v3-ecology.test.mjs`: 108-site roster distribution preserved.
- Worker entrypoint and release manifest hashes verified separately.

**Still requires real-device acceptance:** fresh launch, reopen the V3 campaign without resetting, show world, travel, fight, save and reload on iPhone Safari. Local Chromium browser policy blocks loopback game execution, so these validations do not claim iOS playtest success.
