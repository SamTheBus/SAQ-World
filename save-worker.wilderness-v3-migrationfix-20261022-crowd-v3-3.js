// Same V3 IndexedDB campaign namespace. Refresh save-worker code for new optional grace field.
import('./worker/wilderness-v3-migrationfix-20261022/src/entrypoints/activity_save_worker.js?v=wilderness-v3-3-20261022')
  .then(module=>module.startActivitySaveWorker(self));
