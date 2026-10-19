import { validateId, validateIdMap } from "../shared/contracts/identities.js";
import { closedRecord, copyWire, freezeWire, requireContract, safeInteger, validateWire, canonicalStringify } from "../shared/contracts/wire.js";

// Extracted B1 gateway algorithm; injected schemas do not change its ordering policy.
export function createCommandGatewayContracts({ validateWorldState, validateCommand, validateCommandForState, appliedClientSequence }) {
  // Admission owns buffers and transport order. It never invokes the simulation.
  function createGatewayState(worldState) {
    validateWorldState(worldState);
    requireContract(worldState.session !== null, "Gateway needs a bound session");
    const playersById = Object.create(null);
    for (const playerId of worldState.session.playerIds) {
      const last = appliedClientSequence(worldState, playerId);
      safeInteger(last + 1, 1);
      playersById[playerId] = { nextClientSequence: last + 1, bufferedCommands: [] };
    }
    safeInteger(worldState.lastAppliedAuthorityOrder + 1, 1);
    return freezeWire({ sessionId: worldState.session.sessionId, nextAuthorityOrder: worldState.lastAppliedAuthorityOrder + 1,
      playersById, admittedCommandsById: Object.create(null) });
  }

  function validateGatewayState(gateway) {
    validateWire(gateway);
    closedRecord(gateway, ["sessionId", "nextAuthorityOrder", "playersById", "admittedCommandsById"]);
    validateId("sessionId", gateway.sessionId);
    safeInteger(gateway.nextAuthorityOrder, 1);
    const ids = new Set();
    const orders = new Set();
    const sequences = new Set();
    validateIdMap("playerId", gateway.playersById, (cursor, playerId) => {
      closedRecord(cursor, ["nextClientSequence", "bufferedCommands"]);
      safeInteger(cursor.nextClientSequence, 1);
      requireContract(Array.isArray(cursor.bufferedCommands) && cursor.bufferedCommands.length <= 16, "Gateway buffer limit");
      let previous = cursor.nextClientSequence;
      for (const command of cursor.bufferedCommands) {
        validateCommand(command);
        requireContract(command.playerId === playerId && command.sessionId === gateway.sessionId, "Buffered command owner mismatch");
        requireContract(command.clientSequence > previous && command.clientSequence - cursor.nextClientSequence <= 16, "Invalid out-of-order sequence");
        previous = command.clientSequence;
        requireContract(!ids.has(command.commandId), "Gateway command ID collision");
        ids.add(command.commandId);
      }
    });
    validateIdMap("commandId", gateway.admittedCommandsById, (receipt, key) => {
      closedRecord(receipt, ["command", "authorityOrder"]);
      validateCommand(receipt.command);
      const cursor = gateway.playersById[receipt.command.playerId];
      requireContract(receipt.command.commandId === key && receipt.command.sessionId === gateway.sessionId && cursor,
        "Admission reference mismatch");
      requireContract(receipt.command.clientSequence < cursor.nextClientSequence, "Admission cursor mismatch");
      const sequenceKey = `${receipt.command.playerId}/${receipt.command.clientSequence}`;
      requireContract(!sequences.has(sequenceKey), "Admission sequence collision");
      sequences.add(sequenceKey);
      safeInteger(receipt.authorityOrder, 1, gateway.nextAuthorityOrder - 1);
      requireContract(!orders.has(receipt.authorityOrder) && !ids.has(key), "Admission ID/order collision");
      orders.add(receipt.authorityOrder);
      ids.add(key);
    });
    requireContract(Object.keys(gateway.playersById).length <= 4 && Object.keys(gateway.admittedCommandsById).length <= 64, "Gateway fixture capacity");
    return gateway;
  }

  function validateGatewayForState(gateway, worldState) {
    validateGatewayState(gateway);
    validateWorldState(worldState);
    requireContract(worldState.campaign !== null && worldState.session !== null, "Gateway needs a bound campaign/session");
    requireContract(gateway.sessionId === worldState.session.sessionId, "Gateway/session mismatch");
    requireContract(canonicalStringify(Object.keys(gateway.playersById).sort()) === canonicalStringify(worldState.session.playerIds),
      "Gateway membership changed");

    const pending = [];
    for (const receipt of Object.values(gateway.admittedCommandsById)) {
      const command = receipt.command;
      requireContract(command.campaignId === worldState.campaign.campaignId && command.sessionId === worldState.session.sessionId &&
        Object.hasOwn(worldState.playersById, command.playerId), "Admission identity mismatch");
      const applied = worldState.appliedCommandsById[command.commandId];
      if (applied) {
        requireContract(applied.commandCanonical === canonicalStringify(command) && applied.authorityOrder === receipt.authorityOrder &&
          applied.playerId === command.playerId && applied.clientSequence === command.clientSequence,
        "Admission/applied receipt mismatch");
      } else pending.push(receipt);
    }
    pending.sort((a, b) => a.authorityOrder - b.authorityOrder);
    pending.forEach((receipt, index) => {
      requireContract(receipt.authorityOrder === worldState.lastAppliedAuthorityOrder + index + 1,
        "Pending admission authority orders must be contiguous after applied state");
    });
    requireContract(gateway.nextAuthorityOrder === worldState.lastAppliedAuthorityOrder + pending.length + 1,
      "Unjustified gateway authority cursor");

    for (const playerId of worldState.session.playerIds) {
      const cursor = gateway.playersById[playerId];
      const pendingForPlayer = pending.filter((receipt) => receipt.command.playerId === playerId)
        .sort((a, b) => a.command.clientSequence - b.command.clientSequence);
      let justified = appliedClientSequence(worldState, playerId);
      pendingForPlayer.forEach((receipt, index) => {
        requireContract(receipt.command.clientSequence === justified + index + 1,
          "Pending admission client sequences must be contiguous after applied state");
      });
      justified += pendingForPlayer.length;
      requireContract(cursor.nextClientSequence === justified + 1, "Unjustified gateway player cursor");
      for (const buffered of cursor.bufferedCommands) {
        requireContract(buffered.clientSequence > cursor.nextClientSequence &&
          buffered.clientSequence - cursor.nextClientSequence <= 16, "Buffered command is not strictly ahead of justified cursor");
      }
    }
    return gateway;
  }

  function admitDiagnosticCommand(gateway, command, worldState) {
    validateCommand(command);
    validateWorldState(worldState);
    requireContract(worldState.campaign !== null && worldState.session !== null, "No bound campaign/session");
    requireContract(command.campaignId === worldState.campaign.campaignId, "Stale campaign");
    requireContract(command.sessionId === worldState.session.sessionId, "Stale session");
    validateGatewayForState(gateway, worldState);
    const alreadyApplied = worldState.appliedCommandsById[command.commandId];
    if (alreadyApplied) {
      requireContract(alreadyApplied.commandCanonical === canonicalStringify(command), "Applied command ID collision");
      return freezeWire({ gateway, ready: [], status: "alreadyApplied" });
    }
    const known = gateway.admittedCommandsById[command.commandId]?.command ||
      Object.values(gateway.playersById).flatMap((cursor) => cursor.bufferedCommands).find((item) => item.commandId === command.commandId);
    if (known) {
      requireContract(canonicalStringify(known) === canonicalStringify(command), "Command ID reused with different payload");
      return freezeWire({ gateway, ready: [], status: "duplicate" });
    }
    // Mutable context is intentionally checked only for genuinely new work.
    validateCommandForState(command, worldState);
    const next = copyWire(gateway);
    const cursor = next.playersById[command.playerId];
    requireContract(command.clientSequence >= cursor.nextClientSequence && command.clientSequence - cursor.nextClientSequence <= 16, "Sequence outside admission bounds");
    requireContract(!cursor.bufferedCommands.some((item) => item.clientSequence === command.clientSequence), "Sequence collision");
    cursor.bufferedCommands.push(copyWire(command));
    cursor.bufferedCommands.sort((a, b) => a.clientSequence - b.clientSequence);
    const ready = [];
    while (cursor.bufferedCommands[0]?.clientSequence === cursor.nextClientSequence) {
      const admitted = cursor.bufferedCommands.shift();
      validateCommandForState(admitted, worldState);
      safeInteger(next.nextAuthorityOrder + 1, 1);
      safeInteger(cursor.nextClientSequence + 1, 1);
      const receipt = { command: admitted, authorityOrder: next.nextAuthorityOrder++ };
      next.admittedCommandsById[admitted.commandId] = receipt;
      ready.push(copyWire(receipt));
      cursor.nextClientSequence++;
    }
    validateGatewayForState(next, worldState);
    return freezeWire({ gateway: next, ready, status: ready.length ? "admitted" : "buffered" });
  }

  function retireAppliedAdmissions(gateway, state) {
    const next = copyWire(gateway);
    for (const [id, receipt] of Object.entries(next.admittedCommandsById)) {
      if (receipt.authorityOrder <= state.lastAppliedAuthorityOrder) delete next.admittedCommandsById[id];
    }
    validateGatewayForState(next, state);
    return freezeWire(next);
  }
  return Object.freeze({ createGatewayState, validateGatewayState, validateGatewayForState, admitDiagnosticCommand, retireAppliedAdmissions });
}
