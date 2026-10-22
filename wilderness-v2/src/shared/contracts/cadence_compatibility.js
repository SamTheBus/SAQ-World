import { SIMULATION_TICKS_PER_SECOND } from "./versions.js";
import { COMBAT_SIMULATION_FRAMES_PER_SECOND } from "../rules/index.js";
import { requireContract } from "./wire.js";

export function assertCadenceCompatibility() {
  requireContract(SIMULATION_TICKS_PER_SECOND === COMBAT_SIMULATION_FRAMES_PER_SECOND,
    "Protocol tick rate is incompatible with the pinned Dungeon cadence rules");
}
