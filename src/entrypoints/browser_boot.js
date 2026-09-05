import { mountWorldBoundary } from "./world_browser.js";
import { startWorldClient } from "./playable_browser.js";

const inspection = document.getElementById("world-boundary-status");
if (inspection) mountWorldBoundary(inspection);
else startWorldClient(window).catch((error) => { document.getElementById("world-status").textContent = `Unable to start: ${error.message}`; });
