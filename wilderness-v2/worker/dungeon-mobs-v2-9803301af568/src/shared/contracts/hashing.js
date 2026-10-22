import { requireContract, validateWire } from "./wire.js";

// Pure UTF-8 encoding; no platform encoder, crypto import, or implicit replacement.
export function utf8(value) {
  requireContract(typeof value === "string" && !value.includes("\0"), "Invalid UTF-8 input");
  const bytes = [];
  for (let i = 0; i < value.length; i++) {
    let point = value.charCodeAt(i);
    if (point >= 0xd800 && point <= 0xdbff) {
      const low = value.charCodeAt(++i);
      requireContract(low >= 0xdc00 && low <= 0xdfff, "Unpaired surrogate");
      point = 0x10000 + ((point - 0xd800) << 10) + low - 0xdc00;
    } else requireContract(point < 0xdc00 || point > 0xdfff, "Unpaired surrogate");
    if (point < 0x80) bytes.push(point);
    else if (point < 0x800) bytes.push(0xc0 | (point >>> 6), 0x80 | (point & 63));
    else if (point < 0x10000) bytes.push(0xe0 | (point >>> 12), 0x80 | ((point >>> 6) & 63), 0x80 | (point & 63));
    else bytes.push(0xf0 | (point >>> 18), 0x80 | ((point >>> 12) & 63), 0x80 | ((point >>> 6) & 63), 0x80 | (point & 63));
  }
  return bytes;
}

// D7 cuts carry four participant inventories, generated payloads, ground gear and bounded salvage receipts.
// Hash input remains bounded at 16 MiB; digest and seed callers still require their exact lengths.
export function validateBytes(bytes, size) {
  requireContract(Number.isSafeInteger(size) && size >= 0 && size <= 16777216 && Array.isArray(bytes) &&
    Object.getPrototypeOf(bytes) === Array.prototype && bytes.length === size, `Expected ${size} bytes`);
  const descriptors = Object.getOwnPropertyDescriptors(bytes);
  requireContract(Reflect.ownKeys(descriptors).length === size + 1, "Extended byte array");
  for (let i = 0; i < size; i++) {
    const descriptor = descriptors[String(i)];
    requireContract(descriptor && "value" in descriptor && descriptor.enumerable && Number.isInteger(descriptor.value) &&
      descriptor.value >= 0 && descriptor.value <= 255, "Invalid byte data");
  }
  return bytes;
}

export function bytesToHex(bytes) {
  validateBytes(bytes, bytes.length);
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validateHex(value, bytes) {
  requireContract(typeof value === "string" && new RegExp(`^[0-9a-f]{${bytes * 2}}$`).test(value), "Invalid canonical hex");
  return value;
}

export function hexToBytes(value, bytes) {
  validateHex(value, bytes);
  return value.match(/../g).map((pair) => Number.parseInt(pair, 16));
}

export function frameUtf8(fields) {
  validateWire(fields);
  requireContract(Array.isArray(fields) && fields.length <= 32, "Invalid framing fields");
  const output = [];
  for (const field of fields) {
    const bytes = utf8(field);
    requireContract(bytes.length <= 4096, "Framing field too long");
    const length = bytes.length;
    output.push((length >>> 24) & 255, (length >>> 16) & 255, (length >>> 8) & 255, length & 255, ...bytes);
  }
  return output;
}

export async function hashBytes(bytes, sha256) {
  requireContract(typeof sha256 === "function", "Explicit SHA-256 provider required");
  validateBytes(bytes, bytes.length);
  const result = await sha256(Object.freeze([...bytes]));
  validateBytes(result, 32);
  return [...result];
}
