import { RNG_VERSION, SEED_NORMALIZATION_VERSION } from "./versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, safeInteger, validateWire } from "./wire.js";
import { bytesToHex, frameUtf8, hashBytes, validateBytes, validateHex } from "./hashing.js";

const UINT32_RANGE = 0x100000000;
const rotateLeft = (value, bits) => ((value << bits) | (value >>> (32 - bits))) >>> 0;

export function wordsFromDigest(digest) {
  validateBytes(digest, 32);
  const words = [0, 4, 8, 12].map((offset) =>
    (digest[offset] | (digest[offset + 1] << 8) | (digest[offset + 2] << 16) | (digest[offset + 3] << 24)) >>> 0);
  if (words.every((word) => word === 0)) words[0] = 0x9e3779b9;
  return words;
}

export function validateRngState(state) {
  validateWire(state);
  closedRecord(state, ["rngVersion", "words", "drawCount"]);
  exactVersion(state.rngVersion, RNG_VERSION);
  requireContract(Array.isArray(state.words) && state.words.length === 4, "Expected four RNG words");
  state.words.forEach((word) => safeInteger(word, 0, 0xffffffff));
  requireContract(state.words.some((word) => word !== 0), "Forbidden zero RNG state");
  safeInteger(state.drawCount);
  return state;
}

export function createRngState(words) {
  const state = { rngVersion: RNG_VERSION, words, drawCount: 0 };
  validateRngState(state);
  return freezeWire(state);
}

// A pure state/output transition. No module singleton and no implicit seed.
export function nextUint32(state) {
  validateRngState(state);
  requireContract(state.drawCount < Number.MAX_SAFE_INTEGER, "RNG draw counter exhausted");
  const words = [...state.words];
  const value = Math.imul(rotateLeft(Math.imul(words[1], 5) >>> 0, 7), 9) >>> 0;
  const shifted = (words[1] << 9) >>> 0;
  words[2] = (words[2] ^ words[0]) >>> 0;
  words[3] = (words[3] ^ words[1]) >>> 0;
  words[1] = (words[1] ^ words[2]) >>> 0;
  words[0] = (words[0] ^ words[3]) >>> 0;
  words[2] = (words[2] ^ shifted) >>> 0;
  words[3] = rotateLeft(words[3], 11);
  return freezeWire({ value, state: { rngVersion: RNG_VERSION, words, drawCount: state.drawCount + 1 } });
}

export function nextUnit(state) {
  const result = nextUint32(state);
  return freezeWire({ value: result.value / UINT32_RANGE, state: result.state });
}

// Unbiased [0, bound). Rejected draws advance the supplied stream state.
export function nextBoundedInteger(state, bound) {
  safeInteger(bound, 1, UINT32_RANGE);
  const limit = UINT32_RANGE - (UINT32_RANGE % bound);
  let current = state;
  for (let attempt = 0; attempt < 1024; attempt++) {
    const result = nextUint32(current);
    current = result.state;
    if (result.value < limit) return freezeWire({ value: result.value % bound, state: current });
  }
  throw new RangeError("Bounded sampling draw budget exhausted; no biased fallback");
}

export function validateGenerationIdentity(identity) {
  validateWire(identity);
  closedRecord(identity, ["seedHex", "seedNormalizationVersion", "generatorVersion", "contentCatalogHash", "worldRecipeVersion"]);
  validateHex(identity.seedHex, 16);
  exactVersion(identity.seedNormalizationVersion, SEED_NORMALIZATION_VERSION);
  validateHex(identity.contentCatalogHash, 32);
  for (const key of ["generatorVersion", "worldRecipeVersion"]) {
    requireContract(typeof identity[key] === "string" && /^[a-zA-Z0-9._-]{1,64}$/.test(identity[key]), "Invalid generation version token");
  }
  return identity;
}

export function validateStreamScope(scope) {
  validateWire(scope);
  closedRecord(scope, ["domain", "keys"]);
  requireContract(typeof scope.domain === "string" && /^[a-z][a-z0-9._-]{0,63}$/.test(scope.domain), "Invalid stream domain");
  requireContract(Array.isArray(scope.keys) && scope.keys.length <= 16, "Invalid stream keys");
  for (const key of scope.keys) {
    // Deliberately closed tagged keys. Geography keys cannot be authority IDs.
    closedRecord(key, ["kind", "value"]);
    if (key.kind === "index") safeInteger(key.value);
    else {
      requireContract(key.kind === "recipe", "Unknown stream key kind");
      requireContract(typeof key.value === "string" && /^[a-z][a-z0-9._-]{0,63}$/.test(key.value), "Invalid recipe key");
    }
  }
  return scope;
}

export async function deriveScopedStream(identity, scope, { sha256 } = {}) {
  validateGenerationIdentity(identity);
  validateStreamScope(scope);
  const frozenIdentity = freezeWire(identity);
  const frozenScope = freezeWire(scope);
  const fields = ["SAQ-WORLD-STREAM-v1", identity.seedHex, identity.generatorVersion,
    identity.contentCatalogHash, identity.worldRecipeVersion, scope.domain,
    ...scope.keys.map((key) => key.kind === "index" ? String(key.value) : key.value)];
  const digest = await hashBytes(frameUtf8(fields), sha256);
  return freezeWire({ rngVersion: RNG_VERSION, generationIdentity: frozenIdentity, scope: frozenScope,
    derivationDigest: bytesToHex(digest), initialState: createRngState(wordsFromDigest(digest)) });
}
