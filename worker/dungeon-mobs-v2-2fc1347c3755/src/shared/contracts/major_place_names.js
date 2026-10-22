import { requireContract } from './wire.js';

export const MAJOR_NAME_POLICY_VERSION = 'major-proper-names-v1';
const nameKey = name => {
  requireContract(typeof name === 'string' && name.trim().length > 0 && name.length <= 64, 'Invalid major proper name');
  return name.trim().toLowerCase();
};

// Generation-local reservations. Candidate order is curated, never another RNG draw.
export function createMajorNameRegistry(reserved = []) {
  const assigned = new Set();
  function reserve(name) {
    const key = nameKey(name);
    requireContract(!assigned.has(key), 'Duplicate major proper name');
    assigned.add(key);
    return name;
  }
  for (const name of reserved) reserve(name);
  return Object.freeze({reserve, assign(candidate, pool) {
    const start = pool.indexOf(candidate);
    requireContract(start >= 0, 'Major name candidate outside curated pool');
    for (let offset = 0; offset < pool.length; offset++) {
      const name = pool[(start + offset) % pool.length];
      if (!assigned.has(nameKey(name))) return reserve(name);
    }
    throw new TypeError('Curated major proper names exhausted');
  }});
}

export function validateMajorPlaceNames(manifest) {
  // Older stored D1/D2 names remain readable and are never rewritten on load.
  if (manifest.majorNamePolicyVersion === undefined) {
    requireContract(!manifest.manifestId.endsWith('-names-v1'), 'Missing major name policy');
    return;
  }
  requireContract(manifest.majorNamePolicyVersion === MAJOR_NAME_POLICY_VERSION, 'Unknown major name policy');
  const registry = createMajorNameRegistry();
  for (const place of manifest.settlements) registry.reserve(place.label);
  for (const site of manifest.sites) if (site.properName !== undefined) registry.reserve(site.properName);
}
