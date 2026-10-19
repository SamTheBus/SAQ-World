import { PROTOCOL_VERSION } from "./versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, safeInteger, validateWire } from "./wire.js";
import { validateId, validateRevision } from "./identities.js";

import { isOldwardExit } from "../content/oldward_wood.js";

import { validatePrimaryAim } from "./primary.js";

export function validateSpaceStamp(value) {
  if (value.spaceInstanceId === null) requireContract(value.spaceRevision === null, "Incomplete command/event space stamp");
  else {
    validateId("spaceInstanceId", value.spaceInstanceId);
    validateRevision("spaceRevision", value.spaceRevision);
  }
}

export function validateDiagnosticPayload(payload) {
  closedRecord(payload, ["tag"]);
  requireContract(typeof payload.tag === "string" && payload.tag.length <= 64, "Diagnostic payload limit");
}

export function validateCommand(command) {
  validateWire(command);
  closedRecord(command, ["protocolVersion", "campaignId", "sessionId", "playerId", "commandId", "clientSequence", "kind", "payload", "spaceInstanceId", "spaceRevision"], ["expectedSaveRevision"]);
  exactVersion(command.protocolVersion, PROTOCOL_VERSION);
  for (const kind of ["campaignId", "sessionId", "playerId", "commandId"]) validateId(kind, command[kind]);
  safeInteger(command.clientSequence, 1);
  if (command.kind === "diagnostic.noop") validateDiagnosticPayload(command.payload);
  else if (command.kind === "movement.setIntent") {
    closedRecord(command.payload, ["x", "y"]);
    requireContract([command.payload.x, command.payload.y].every((n) => typeof n === "number" && Number.isFinite(n) && n >= -1 && n <= 1) &&
      Math.hypot(command.payload.x, command.payload.y) <= 1.000000000001, "Invalid movement command intent");
  } else if (command.kind === "combat.primaryIntent") {
    closedRecord(command.payload, ["pressed", "aim"], ["cancelQueued"]);
    if(Object.hasOwn(command.payload,"cancelQueued"))requireContract(command.payload.pressed===false&&typeof command.payload.cancelQueued==="boolean","Cancel only on release");
    requireContract(typeof command.payload.pressed === "boolean", "Primary press must be boolean");
    validatePrimaryAim(command.payload.aim);
  } else if(command.kind==='loot.pickup') {
    closedRecord(command.payload,['sourceEntityId','inventoryRevision']);validateId('entityId',command.payload.sourceEntityId);safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='gear.salvage') {
    closedRecord(command.payload,['itemId','inventoryRevision','fingerprint']);safeInteger(command.payload.inventoryRevision);requireContract(typeof command.payload.itemId==='string'&&command.payload.itemId.length<=240&&typeof command.payload.fingerprint==='string'&&/^[0-9a-f]{1,8}$/.test(command.payload.fingerprint),'Invalid salvage identity');
  } else if(command.kind==='gear.drop') {
    closedRecord(command.payload,['itemId','inventoryRevision']);requireContract(typeof command.payload.itemId==='string'&&/^item:ply:[0-9a-f]{32}:(?:ent:[0-9a-f]{32}|starter)$/.test(command.payload.itemId),'Invalid item ID');safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='resource.interact') {
    closedRecord(command.payload,['groupId','episode','ordinal','inventoryRevision']);requireContract(typeof command.payload.groupId==='string'&&command.payload.groupId.length<=160,'Invalid encounter identity');safeInteger(command.payload.episode);safeInteger(command.payload.ordinal,0,3);safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='progression.change') {
    safeInteger(command.expectedSaveRevision);closedRecord(command.payload,['progressionRevision','action'],['inventoryRevision','goldQuote']);safeInteger(command.payload.progressionRevision);const a=command.payload.action;
    if(a.kind==='allocate'){closedRecord(a,['kind','deltas']);closedRecord(a.deltas,['str','dex','int']);for(const n of Object.values(a.deltas))safeInteger(n,0,147);}
    else if(a.kind==='node.purchase'){closedRecord(a,['kind','nodeId']);requireContract(typeof a.nodeId==='string'&&a.nodeId.length<=80,'Invalid node');}
    else if(a.kind==='tree.reset'){closedRecord(a,['kind','tree']);requireContract(['shield','dagger','tome','utility'].includes(a.tree),'Invalid constellation');}
    else {requireContract(a.kind==='attributes.reset','Unknown progression action');closedRecord(a,['kind']);safeInteger(command.payload.inventoryRevision);requireContract(command.payload.goldQuote==='2500','Invalid Attribute reset quote');}
  } else if(command.kind==='forge.attune') {
    closedRecord(command.payload,['slot','expectedLevel','inventoryRevision']);requireContract(['weapon','helmet','chest','leggings','overall','boots','ring1','ring2','subweapon'].includes(command.payload.slot),'Unknown Forge slot');safeInteger(command.payload.expectedLevel,0,99);safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='equipment.equip') {
    closedRecord(command.payload,['itemId','inventoryRevision'],['slot']);if(command.payload.slot!==undefined)requireContract(['weapon','helmet','chest','leggings','overall','boots','ring1','ring2','subweapon'].includes(command.payload.slot),'Unknown equipment slot');requireContract(typeof command.payload.itemId==='string'&&/^item:ply:[0-9a-f]{32}:(?:ent:[0-9a-f]{32}|starter)$/.test(command.payload.itemId),'Invalid item ID');safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='equipment.unequip') {
    closedRecord(command.payload,['slot','inventoryRevision']);requireContract(['weapon','helmet','chest','leggings','overall','boots','ring1','ring2','subweapon','armor','charm'].includes(command.payload.slot),'Unknown equipment slot');safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='subweapon.claim') {
    closedRecord(command.payload,['subType','inventoryRevision']);requireContract(['shield','dagger','tome'].includes(command.payload.subType),'Unknown provision');safeInteger(command.payload.inventoryRevision);
  } else if(command.kind==='combat.guardIntent') {
    closedRecord(command.payload,['pressed']);requireContract(typeof command.payload.pressed==='boolean','Guard press must be boolean');
  } else if(command.kind==='combat.shadowDash') {
    closedRecord(command.payload,['aim']);validatePrimaryAim(command.payload.aim);
  } else if(command.kind==='player.respawn') {
    closedRecord(command.payload,[]);
  } else if(command.kind==='site.transition') {
    closedRecord(command.payload,['siteId','direction'],['transitionId','extractionId']);requireContract(/^loc:[a-f0-9]{32}$/.test(command.payload.siteId)||/^site:[a-f0-9]{32}$/.test(command.payload.siteId),'Invalid site transition identity');
    requireContract(['enter','exit','up','down','extract'].includes(command.payload.direction),'Invalid site transition direction');if(['up','down'].includes(command.payload.direction))requireContract(typeof command.payload.transitionId==='string'&&command.payload.transitionId.length<=180&&command.payload.extractionId===undefined,'Missing floor transition identity');else if(command.payload.direction==='extract')requireContract(typeof command.payload.extractionId==='string'&&command.payload.extractionId.length<=180&&command.payload.transitionId===undefined,'Missing extraction identity');else requireContract(command.payload.transitionId===undefined&&command.payload.extractionId===undefined,'Unexpected site transition identity');
  } else if (command.kind === "space.travel") {
    closedRecord(command.payload, ["exitId"]);
    requireContract(["field-to-room", "room-to-field"].includes(command.payload.exitId) || isOldwardExit(command.payload.exitId), "Unknown authored or fixture exit");
  } else {
    requireContract(command.kind === "combat.basicAttack", "Unsupported command kind");
    closedRecord(command.payload, ["targetEntityId"]);
    validateId("entityId", command.payload.targetEntityId);
  }
  validateSpaceStamp(command);
  if (Object.hasOwn(command, "expectedSaveRevision")) validateRevision("saveRevision", command.expectedSaveRevision);
  return command;
}

export function createCommand(record) {
  validateCommand(record);
  return freezeWire(record);
}
