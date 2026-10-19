import { validateCommand } from "./commands.js";
import { validateWorldState } from "./state.js";
import { requireContract } from "./wire.js";

// Relational validation is separate from both closed envelope and state schemas.
export function validateCommandForState(command, state) {
  validateCommand(command);
  validateWorldState(state);
  requireContract(state.campaign !== null && state.session !== null, "No bound campaign/session");
  requireContract(command.campaignId === state.campaign.campaignId, "Stale campaign");
  requireContract(command.sessionId === state.session.sessionId, "Stale session");
  requireContract(Object.hasOwn(state.playersById, command.playerId), "Unknown command player");
  requireContract(state.playersById[command.playerId].connectionStatus === "connected", "Disconnected command player");
  requireContract(command.spaceInstanceId === (state.activeSpaceRef?.spaceInstanceId ?? null), "Stale space instance");
  requireContract(command.spaceRevision === (state.activeSpaceRef?.spaceRevision ?? null), "Stale space revision");
  if (command.kind !== "diagnostic.noop") {
    requireContract(state.multiplayer, "Gameplay commands need explicit multiplayer contract");
    const player = state.playersById[command.playerId];
    const actor = state.space?.entitiesById[player.entityId];
    requireContract(actor?.kind === "actor" && actor.team === "party" && actor.ownerCharacterId === player.characterId,
      "Command controller/actor ownership mismatch");
    if (state.primary) requireContract(command.kind !== "combat.basicAttack", "Manual primary input is required for this family");
    if (command.kind === "combat.primaryIntent") requireContract(state.primary && state.space.encounterId !== null, "Primary attack requires active attempt");
    if (command.kind === "combat.basicAttack") requireContract(state.space.entitiesById[command.payload.targetEntityId]?.kind === "actor",
      "Unknown attack target");
  }
  if (Object.hasOwn(command, "expectedSaveRevision")) {
    requireContract(command.expectedSaveRevision === state.campaign.saveRevision, "Stale save revision");
  }
  return command;
}
