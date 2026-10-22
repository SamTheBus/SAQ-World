import { SEED_NORMALIZATION_VERSION } from "./versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, validateWire } from "./wire.js";
import { utf8, frameUtf8, hashBytes, bytesToHex, hexToBytes, validateBytes, validateHex } from "./hashing.js";

const trimAscii = (value) => value.replace(/^[\u0009-\u000d\u0020]+|[\u0009-\u000d\u0020]+$/g, "");

export function validateStoredSeed(record) {
  validateWire(record);
  closedRecord(record, ["seedNormalizationVersion", "seedHex"]);
  exactVersion(record.seedNormalizationVersion, SEED_NORMALIZATION_VERSION);
  validateHex(record.seedHex, 16);
  return record;
}

function storedSeed(seedHex) {
  return freezeWire({ seedNormalizationVersion: SEED_NORMALIZATION_VERSION, seedHex });
}

export async function normalizeSeedInput(input, { sha256 } = {}) {
  requireContract(typeof input === "string", "Seed input must be a string");
  requireContract(utf8(input).length <= 1024, "Seed input exceeds 1024 UTF-8 bytes");
  let text = trimAscii(input.replace(/\r\n?/g, "\n"));
  if (text.startsWith("hex:")) {
    const digits = text.slice(4);
    requireContract(/^[0-9a-fA-F]{32}$/.test(digits), "hex: requires exactly 32 hex digits (16 bytes)");
    return storedSeed(digits.toLowerCase());
  }
  if (text.startsWith("text:")) text = text.slice(5);
  text = trimAscii(text).normalize("NFC");
  requireContract(text.length > 0 && utf8(text).length <= 256, "Text seed must contain 1 to 256 UTF-8 bytes");
  const digest = await hashBytes(frameUtf8(["SAQ-WORLD", SEED_NORMALIZATION_VERSION, text]), sha256);
  return storedSeed(bytesToHex(digest.slice(0, 16)));
}

export async function createRandomSeed({ entropy } = {}) {
  requireContract(typeof entropy === "function", "Explicit entropy provider required");
  const bytes = await entropy(16);
  validateBytes(bytes, 16);
  return storedSeed(bytesToHex(bytes));
}

// Historical loading accepts only stored canonical bytes/version, never raw text.
export function loadStoredSeed(record) {
  validateStoredSeed(record);
  return freezeWire(record);
}

export function storedSeedBytes(record) {
  validateStoredSeed(record);
  return hexToBytes(record.seedHex, 16);
}
