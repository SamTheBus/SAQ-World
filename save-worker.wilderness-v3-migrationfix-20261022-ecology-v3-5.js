// Wilderness V3.5 ecology: same V3 IndexedDB campaign namespace;
// versioned import graph enables the new saved V1/V2 roster recipes.
import('./worker/wilderness-v3-migrationfix-20261022/src/entrypoints/activity_save_worker.js?v=wilderness-v3-5-ecology-20261022')
  .then(module=>module.startActivitySaveWorker(self));
