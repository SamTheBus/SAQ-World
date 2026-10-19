import { createWorldSimulation } from "../simulation/world_simulation.js";
export { createCampaignAuthority } from "./campaign_authority.js";
export { allocateIdentity } from "./identity_allocation.js";
export { createGatewayState, validateGatewayState, validateGatewayForState, admitDiagnosticCommand } from "./diagnostic_gateway.js";

// The embedding host supplies each tick explicitly. No scheduler exists yet.
export function createLocalAuthorityHost(initialState) {
  // initialState must be host-assembled/trusted or separately fingerprint-verified.
  // The separate CampaignAuthority composes verified persistence with a barrier.
  const simulation = createWorldSimulation(initialState);
  const clientView = Object.freeze({
    getInspection: simulation.getInspection,
  });

  return Object.freeze({
    advanceOneTick: simulation.advanceOneTick,
    setMovementIntent: simulation.setMovementIntent,
    resolveDirectAttack: simulation.resolveDirectAttack,
    clientView,
  });
}
