// Compatibility alias for previously opened SAQ World tabs.
// The active worker now lives at ./save-worker.js and shares the canonical src/.
import('./src/entrypoints/activity_save_worker.js?v=shared-runtime-20261022')
  .then(module=>module.startActivitySaveWorker(self));
