import { requireContract, validateWire, safeInteger, copyWire } from "./wire.js";

export const ID_PREFIXES = Object.freeze({
  campaignId: "cmp", sessionId: "ses", characterId: "chr", playerId: "ply",
  spaceId: "spc", spaceInstanceId: "spi", entityId: "ent", itemInstanceId: "itm",
  commandId: "cmd", eventId: "evt", transactionId: "txn", contentDefinitionId: "def",
  encounterId: "enc", encounterAttemptId: "att", entitlementId: "elt", checkpointId: "chk",
  locationId: "loc", legendAssignmentId: "lga", recoveryRecordId: "rec",
  attackActionId: "act", primaryActionId: "pra",
});

export function validateId(kind, value) {
  requireContract(Object.hasOwn(ID_PREFIXES, kind), "Unknown ID class");
  requireContract(typeof value === "string" && new RegExp(`^${ID_PREFIXES[kind]}:[0-9a-f]{32}$`).test(value),
    `Invalid ${kind}`);
  return value;
}

// The opaque token is supplied by the authority, never allocated by shared rules.
export function createId(kind, token) {
  requireContract(typeof token === "string", "ID token must be a string");
  requireContract(Object.hasOwn(ID_PREFIXES, kind), "Unknown ID class");
  return validateId(kind, `${ID_PREFIXES[kind]}:${token}`);
}

export function validateRevision(kind, value) {
  requireContract(kind === "spaceRevision" || kind === "saveRevision", "Unknown revision class");
  return safeInteger(value);
}

export const createRevision = (kind, value) => validateRevision(kind, value);

export function createIdMap(kind, entries = []) {
  validateWire(entries);
  requireContract(Array.isArray(entries), "ID entries must be an array");
  const result = Object.create(null);
  for (const entry of entries) {
    requireContract(Array.isArray(entry) && entry.length === 2, "Expected ID/value pair");
    const key = validateId(kind, entry[0]);
    requireContract(!Object.hasOwn(result, key), "ID collision");
    result[key] = copyWire(entry[1]);
  }
  const ordered = Object.create(null);
  for (const key of Object.keys(result).sort()) ordered[key] = result[key];
  return ordered;
}

export function validateIdMap(kind, value, validateEntry) {
  validateWire(value);
  requireContract(Object.hasOwn(ID_PREFIXES, kind), "Unknown ID class");
  requireContract(value && typeof value === "object" && !Array.isArray(value), "Expected ID map");
  for (const [key, entry] of Object.entries(value)) {
    validateId(kind, key);
    validateEntry(entry, key);
  }
}
