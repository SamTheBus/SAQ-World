import { ORDINARY_ENEMIES, ORDINARY_CATALOG_VERSION } from './ordinary_enemies.js';
import { canonicalStringify, freezeWire } from "../contracts/wire.js";
import { bytesToHex, hashBytes, utf8 } from "../contracts/hashing.js";
import { OLDWARD_SPACES } from "./oldward_wood.js";

export const LOCATION_SITE_PROOF_CATALOG = freezeWire([
  { contentDefinitionId: "def:d2000000000000000000000000000001", kind: "locationSiteProof", locationKey: "hollow-gate", label: "Hollow Gate", siteKind: "dungeon", artifactEligible: true },
  { contentDefinitionId: "def:d2000000000000000000000000000002", kind: "locationSiteProof", locationKey: "waystone-ruin", label: "Waystone Ruin", siteKind: "ruin", artifactEligible: true },
  { contentDefinitionId: "def:d2000000000000000000000000000003", kind: "locationSiteProof", locationKey: "moss-shrine", label: "Moss Shrine", siteKind: "shrine", artifactEligible: true },
  { contentDefinitionId: "def:d2000000000000000000000000000004", kind: "locationSiteProof", locationKey: "deep-cave", label: "Deep Cave", siteKind: "cave", artifactEligible: true },
]);

export const ARTIFACT_PROOF_CATALOG = freezeWire([
  { contentDefinitionId: "def:d3000000000000000000000000000001", kind: "artifactProof", artifactKey: "ember-sigil", label: "Ember Sigil" },
  { contentDefinitionId: "def:d3000000000000000000000000000002", kind: "artifactProof", artifactKey: "verdant-oath", label: "Verdant Oath" },
  { contentDefinitionId: "def:d3000000000000000000000000000003", kind: "artifactProof", artifactKey: "starless-bell", label: "Starless Bell" },
]);

export async function currentProceduralContentCatalogHash(sha256,populationEnabled=false) {
  const sources=[...OLDWARD_SPACES].sort((a,b)=>a.contentDefinitionId.localeCompare(b.contentDefinitionId)).map(space=>({
    contentDefinitionId:space.contentDefinitionId,collision:space.collision,visual:space.visual,
  }));
  const body={catalogVersion:"procedural-proof-content-v1",sources,
    locationDefinitions:LOCATION_SITE_PROOF_CATALOG,artifactDefinitions:ARTIFACT_PROOF_CATALOG};
  const geographyHash=bytesToHex(await hashBytes(utf8(canonicalStringify(body)),sha256));
  return populationEnabled?bytesToHex(await hashBytes(utf8(canonicalStringify({geographyHash,catalogVersion:ORDINARY_CATALOG_VERSION,enemies:ORDINARY_ENEMIES})),sha256)):geographyHash;
}
