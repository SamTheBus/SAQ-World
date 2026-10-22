import { freezeWire, requireContract, safeInteger, validateBigNumWire } from "./wire.js";

export const MAX_BOUNDED_COMBAT_INTEGER = 1000000000;

function decimalCoefficient(value) {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(value));
  requireContract(match !== null, "Invalid combat mantissa decimal form");
  const fraction = match[2] ?? "";
  return {
    coefficient: BigInt(`${match[1]}${fraction}`),
    exponent: Number(match[3] ?? 0) - fraction.length,
  };
}

// The bounded WORLD combat codec interprets the shortest decimal text of the
// normalized wire mantissa exactly. It never uses floating-point multiplication
// or tolerance to decide whether the represented value is an integer.
export function boundedCombatInteger(value) {
  validateBigNumWire(value);
  requireContract(value.m >= 0, "Bounded combat integer cannot be negative");
  if (value.m === 0) return 0;
  const decimal = decimalCoefficient(value.m);
  const exponent = decimal.exponent + value.e;
  requireContract(exponent >= -32 && exponent <= 9, "Bounded combat integer is out of range");
  let integer;
  if (exponent >= 0) integer = decimal.coefficient * (10n ** BigInt(exponent));
  else {
    const divisor = 10n ** BigInt(-exponent);
    requireContract(decimal.coefficient % divisor === 0n, "Bounded combat value is fractional");
    integer = decimal.coefficient / divisor;
  }
  requireContract(integer <= BigInt(MAX_BOUNDED_COMBAT_INTEGER), "Bounded combat integer is out of range");
  return Number(integer);
}

export function combatIntegerWire(value) {
  safeInteger(value, 0, MAX_BOUNDED_COMBAT_INTEGER);
  if (value === 0) return freezeWire({ m: 0, e: 0 });
  const digits = String(value);
  const exponent = digits.length - 1;
  const mantissa = Number(exponent === 0 ? digits : `${digits[0]}.${digits.slice(1)}`);
  const wire = freezeWire({ m: mantissa, e: exponent });
  requireContract(boundedCombatInteger(wire) === value, "Combat integer codec round-trip failure");
  return wire;
}

export function validateBoundedCombatIntegerWire(value, minimum = 0) {
  const integer = boundedCombatInteger(value);
  safeInteger(minimum, 0, MAX_BOUNDED_COMBAT_INTEGER);
  requireContract(integer >= minimum, "Bounded combat integer is below minimum");
  return value;
}
