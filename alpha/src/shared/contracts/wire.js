export function requireContract(condition, message) {
  if (!condition) throw new TypeError(message);
}

// Versioned technical capacity for canonical entity-ID indexes. Ordinary
// records, arrays, total nodes, depth and descriptor checks retain their bounds.
export const ENTITY_INDEX_WIRE_V2=Object.freeze({version:'entity-index-wire-capacity-v2',maximumKeys:512,parentRecordMaximum:256});

// Inspect descriptors before values: validation never invokes a property getter.
export function validateWire(value) {
  const seen = new WeakSet();
  // D7 full-party gear and retained salvage proofs require a larger bounded cut.
  // Per-record/array limits, descriptor checks and depth remain unchanged.
  let nodes = 0;
  function visit(current, depth) {
    requireContract(++nodes <= 262144 && depth <= 24, "Wire size/depth limit");
    if (current === null || typeof current === "boolean") return;
    if (typeof current === "string") {
      requireContract(current.length <= 4096 && !/[\u0000]/u.test(current), "Invalid wire string");
      for (let i = 0; i < current.length; i++) {
        const unit = current.charCodeAt(i);
        if (unit >= 0xd800 && unit <= 0xdbff) {
          const next = current.charCodeAt(++i);
          requireContract(next >= 0xdc00 && next <= 0xdfff, "Unpaired wire surrogate");
        } else requireContract(unit < 0xdc00 || unit > 0xdfff, "Unpaired wire surrogate");
      }
      return;
    }
    if (typeof current === "number") {
      requireContract(Number.isFinite(current), "Non-finite wire number");
      return;
    }
    requireContract(typeof current === "object", "Wire must contain data only");
    requireContract(!seen.has(current), "Cyclic or aliased wire object");
    seen.add(current);
    const array = Array.isArray(current);
    const proto = Object.getPrototypeOf(current);
    requireContract(array ? proto === Array.prototype : proto === Object.prototype || proto === null,
      "Only plain records/arrays are wire values");
    const descriptors = Object.getOwnPropertyDescriptors(current);
    const keys = Reflect.ownKeys(descriptors);
    requireContract(keys.every((key) => typeof key === "string"), "Symbol wire key");
    if (array) {
      requireContract(current.length <= 256 && keys.length === current.length + 1, "Sparse/extended/oversize array");
      for (let i = 0; i < current.length; i++) {
        const descriptor = descriptors[String(i)];
        requireContract(descriptor && "value" in descriptor && descriptor.enumerable, "Array accessor or hole");
        visit(descriptor.value, depth + 1);
      }
    } else {
      requireContract(keys.length <= 256 || keys.length<=ENTITY_INDEX_WIRE_V2.maximumKeys&&keys.every(key=>/^ent:[a-f0-9]{32}$/.test(key)), "Oversize record");
      for (const key of keys) {
        requireContract(key.length > 0 && key.length <= 128 && !["__proto__", "prototype", "constructor"].includes(key), "Unsafe record key");
        const descriptor = descriptors[key];
        requireContract("value" in descriptor && descriptor.enumerable, "Accessor or hidden wire field");
        visit(descriptor.value, depth + 1);
      }
    }
  }
  visit(value, 0);
  return value;
}

export function closedRecord(value, required, optional = []) {
  requireContract(value !== null && typeof value === "object" && !Array.isArray(value), "Expected record");
  const keys = Object.keys(value);
  requireContract(required.every((key) => Object.hasOwn(value, key)), "Missing field");
  requireContract(keys.every((key) => required.includes(key) || optional.includes(key)), "Unknown field");
  return value;
}

export function safeInteger(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  requireContract(Number.isSafeInteger(value) && value >= minimum && value <= maximum, "Invalid safe integer");
  return value;
}

export function exactVersion(value, expected) {
  requireContract(value === expected, "Unsupported contract version");
}

export function validateBigNumWire(value) {
  validateWire(value);
  closedRecord(value, ["m", "e"]);
  requireContract(typeof value.m === "number" && Number.isFinite(value.m), "Invalid mantissa");
  safeInteger(value.e, -Number.MAX_SAFE_INTEGER);
  requireContract(value.m === 0 ? value.e === 0 : Math.abs(value.m) >= 1 && Math.abs(value.m) < 10,
    "BigNum wire must be normalized");
  return value;
}

export function copyWire(value) {
  validateWire(value);
  function copy(current) {
    if (current === null || typeof current !== "object") return current;
    if (Array.isArray(current)) return current.map(copy);
    const result = Object.create(null);
    for (const key of Object.keys(current).sort()) result[key] = copy(current[key]);
    return result;
  }
  return copy(value);
}

export function freezeWire(value) {
  const cloned = copyWire(value);
  function freeze(current) {
    if (current && typeof current === "object") {
      for (const child of Object.values(current)) freeze(child);
      Object.freeze(current);
    }
    return current;
  }
  return freeze(cloned);
}

export function canonicalStringify(value) {
  return JSON.stringify(copyWire(value));
}
