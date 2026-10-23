// V3.6 boss-binding Worker; preserve the established Wilderness V3 IndexedDB database.
import('./worker/wilderness-v3-migrationfix-20261022/src/entrypoints/activity_save_worker.js?v=v3-6-aegis-deep-20261022')
  .then(module=>module.startActivitySaveWorker(self));
