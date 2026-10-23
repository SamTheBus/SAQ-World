// SAQ World save worker. The canonical simulation and save code live in src/.
// Keep the existing Wilderness V3 IndexedDB namespace and migration handshake.
import('./src/entrypoints/activity_save_worker.js?v=shared-runtime-20261022')
  .then(module=>module.startActivitySaveWorker(self));
