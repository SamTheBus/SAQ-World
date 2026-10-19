import { createId, validateId } from "../shared/contracts/identities.js";
import { requireContract } from "../shared/contracts/wire.js";

// Token uniqueness/entropy is provided by the embedding authority, not by rules.
export function allocateIdentity(kind, { nextToken, existingIds = [] }) {
  requireContract(typeof nextToken === "function" && Array.isArray(existingIds), "Explicit ID provider/registry required");
  const seen = new Set();
  for (const existing of existingIds) {
    validateId(kind, existing);
    requireContract(!seen.has(existing), "Existing ID collision");
    seen.add(existing);
  }
  const identity = createId(kind, nextToken(kind));
  requireContract(!seen.has(identity), "Allocated ID collision");
  return identity;
}

// A compacted authority cannot keep an eternal set of opaque IDs. For these
// identity classes a persisted lexical high watermark prevents reuse exactly.
export function allocateFencedIdentity(kind, { nextToken, highWatermark = null, existingIds = [] }) {
  requireContract(typeof nextToken === "function", "Explicit ID provider required");
  const candidate = createId(kind, nextToken(kind));
  const high = [highWatermark, ...existingIds].filter(Boolean).sort().at(-1);
  if (!high || candidate > high) return candidate;
  validateId(kind, high);
  const token = (BigInt("0x" + high.slice(4)) + 1n).toString(16).padStart(32, "0");
  requireContract(token.length === 32, "Authority identity namespace exhausted");
  return createId(kind, token);
}
