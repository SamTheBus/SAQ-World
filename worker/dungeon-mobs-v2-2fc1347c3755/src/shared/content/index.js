import { validateOrdinaryDefinition } from './ordinary_enemies.js';
import { CONTENT_SCHEMA_VERSION } from "../contracts/versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, validateWire, canonicalStringify, safeInteger } from "../contracts/wire.js";
import { validateBoundedCombatIntegerWire } from "../contracts/combat_integer.js";
import { createIdMap, validateId, validateIdMap } from "../contracts/identities.js";
import { bytesToHex, hashBytes, utf8, validateHex } from "../contracts/hashing.js";
import { validateOverworldManifestDefinition } from "../contracts/overworld.js";

import { REGION_ID, LAYOUT_VERSION, GEOGRAPHY_DEFINITION_ID } from "./oldward_wood.js";

import { SHIELD_SWORD_PRIMARY } from "./manual_primary.js";

// Kept for the WORLD.1A inspection projection; still contains no gameplay data.
export const EMPTY_WORLD_CONTENT = Object.freeze({});

// Selected WORLD.1C proof profiles. Values are resolved live-rule inputs, not
// a production catalog or progression table.
export const WORLD1C_PLAYER_PROFILE = freezeWire({
  contentDefinitionId: "def:c1000000000000000000000000000001", kind: "actorProfile", profileKey: "h4a-player-baseline",
  team: "party", maxHp: { m: 1, e: 2 }, attackDamage: { m: 1.5, e: 1 }, moveSpeed: 3,
  hullRadius: 9, combatRadius: 9, attackReach: 20, attackReachMode: "clearHullGap", attackDelayTicks: 15, aiKind: null,
});
export const WORLD1C_GREEN_SLIME_PROFILE = freezeWire({
  contentDefinitionId: "def:c1000000000000000000000000000002", kind: "actorProfile", profileKey: "green-slime",
  team: "hostile", maxHp: { m: 8.7, e: 1 }, attackDamage: { m: 1, e: 1 }, moveSpeed: 1.35,
  hullRadius: 10, combatRadius: 10.8, attackReach: 20, attackReachMode: "center", attackDelayTicks: 60, aiKind: "simpleMelee",
});

function validateDefinition(definition, key) {
  validateId("contentDefinitionId", definition.contentDefinitionId);
  requireContract(definition.contentDefinitionId === key, "Definition map identity mismatch");
  if (definition.kind === "ordinaryEnemyDefinition") { validateOrdinaryDefinition(definition); return; }
  if (definition.kind === "diagnostic") {
    closedRecord(definition, ["contentDefinitionId", "kind"]);
    return;
  }
  if (definition.kind === "primaryProfile") {
    requireContract(canonicalStringify(definition) === canonicalStringify(SHIELD_SWORD_PRIMARY), "Unsupported primary profile");
    return;
  }
  if (definition.kind === "authoredGeography") {
    closedRecord(definition, ["contentDefinitionId", "kind", "regionId", "layoutVersion", "layoutFingerprint"]);
    requireContract(key === GEOGRAPHY_DEFINITION_ID && definition.regionId === REGION_ID && definition.layoutVersion === LAYOUT_VERSION,
      "Unsupported authored geography definition");
    validateHex(definition.layoutFingerprint, 32);
    return;
  }
  if (definition.kind === "overworldManifest") {
    validateOverworldManifestDefinition(definition);
    return;
  }
  if(definition.kind==="locationSiteProof"){
    closedRecord(definition,["contentDefinitionId","kind","locationKey","label","siteKind","artifactEligible"]);
    requireContract(/^[a-z][a-z0-9-]{0,63}$/.test(definition.locationKey)&&typeof definition.label==="string"&&definition.label.length<=64&&
      ["dungeon","ruin","shrine","cave"].includes(definition.siteKind)&&definition.artifactEligible===true,"Invalid proof location definition");
    return;
  }
  if(definition.kind==="artifactProof"){
    closedRecord(definition,["contentDefinitionId","kind","artifactKey","label"]);
    requireContract(/^[a-z][a-z0-9-]{0,63}$/.test(definition.artifactKey)&&typeof definition.label==="string"&&definition.label.length<=64,"Invalid proof artifact definition");
    return;
  }
  requireContract(definition.kind === "actorProfile", "Unknown synthetic definition kind");
  closedRecord(definition, ["contentDefinitionId", "kind", "profileKey", "team", "maxHp", "attackDamage", "moveSpeed",
    "hullRadius", "combatRadius", "attackReach", "attackReachMode", "attackDelayTicks", "aiKind"], ["isBoss"]);
  requireContract(/^[a-z][a-z0-9-]{0,63}$/.test(definition.profileKey), "Invalid actor profile key");
  requireContract(definition.team === "party" || definition.team === "hostile", "Invalid profile team");
  validateBoundedCombatIntegerWire(definition.maxHp, 1);
  validateBoundedCombatIntegerWire(definition.attackDamage, 1);
  for (const [value, minimum, maximum] of [[definition.moveSpeed, 0, 16], [definition.hullRadius, 0.25, 64],
    [definition.combatRadius, 0.25, 64], [definition.attackReach, 0, 256]]) {
    requireContract(typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum, "Invalid profile geometry");
  }
  requireContract(definition.attackReachMode === "center" || definition.attackReachMode === "clearHullGap", "Invalid reach mode");
  safeInteger(definition.attackDelayTicks, 4, 300);
  requireContract(definition.aiKind === null || definition.aiKind === "simpleMelee", "Invalid profile AI");
  requireContract((definition.team === "hostile") === (definition.aiKind === "simpleMelee"), "Profile team/AI mismatch");
  if(definition.isBoss!==undefined)requireContract(definition.isBoss===true&&definition.team==='hostile','Invalid boss profile');
}

export function validateContentCatalog(catalog) {
  validateWire(catalog);
  closedRecord(catalog, ["contentSchemaVersion", "fingerprint", "definitionsById"]);
  exactVersion(catalog.contentSchemaVersion, CONTENT_SCHEMA_VERSION);
  validateHex(catalog.fingerprint, 32);
  validateIdMap("contentDefinitionId", catalog.definitionsById, (definition, key) => {
    validateDefinition(definition, key);
  });
  for(const definition of Object.values(catalog.definitionsById).filter(value=>value.kind==="overworldManifest"&&value.manifestVersion===2)){
    requireContract(definition.sites.every(site=>catalog.definitionsById[site.locationDefinitionId]?.kind==="locationSiteProof"),"Generated site content reference missing");
    requireContract(definition.artifactAssignments.every(assignment=>catalog.definitionsById[assignment.artifactDefinitionId]?.kind==="artifactProof"),"Generated artifact content reference missing");
    requireContract(definition.generation.contentCatalogHash!==catalog.fingerprint,"Generated source catalog identity must not depend on final manifest fingerprint");
  }
  return catalog;
}

export async function createContentCatalog(definitions, { sha256 } = {}) {
  validateWire(definitions);
  requireContract(Array.isArray(definitions), "Expected definitions array");
  const definitionsById = createIdMap("contentDefinitionId", definitions.map((definition) => [definition.contentDefinitionId, definition]));
  const body = freezeWire({ contentSchemaVersion: CONTENT_SCHEMA_VERSION, definitionsById });
  // Validate definition fields before invoking the provider.
  validateContentCatalog({ ...body, fingerprint: "0".repeat(64) });
  const fingerprint = bytesToHex(await hashBytes(utf8(canonicalStringify(body)), sha256));
  return freezeWire({ ...body, fingerprint });
}

export async function verifyContentFingerprint(catalog, { sha256 } = {}) {
  validateContentCatalog(catalog);
  const expectedFingerprint = catalog.fingerprint;
  const body = freezeWire({ contentSchemaVersion: catalog.contentSchemaVersion, definitionsById: catalog.definitionsById });
  const fingerprint = bytesToHex(await hashBytes(utf8(canonicalStringify(body)), sha256));
  requireContract(fingerprint === expectedFingerprint, "Content fingerprint mismatch");
  return true;
}
