import { compileOverworldManifest, originManifestForState as manifestForState, verifyOverworldManifestHash } from "../contracts/overworld.js";
import { oldwardAreaDefinition } from "./oldward_wood.js";
import { canonicalStringify, requireContract } from "../contracts/wire.js";
import { currentProceduralContentCatalogHash } from "./procedural_catalog.js";

// Fixture content lookup. The compiler and all runtime queries remain layout
// agnostic; X-B2 may supply generated manifests over the same definition API.
export const resolveOverworldAreaDefinition = contentDefinitionId => oldwardAreaDefinition(contentDefinitionId);
export const compileBoundOverworld = state => compileOverworldManifest(manifestForState(state), resolveOverworldAreaDefinition);
export async function verifyBoundOverworldGeometry(state,{sha256}={}) {
  if (!state.campaign?.overworld) return true;
  const manifest=manifestForState(state);
  await verifyOverworldManifestHash(manifest,{sha256});
  if(manifest.manifestVersion===2)requireContract(await currentProceduralContentCatalogHash(sha256,Boolean(manifest.population))===manifest.generation.contentCatalogHash,
    "Generated manifest content catalog mismatch");
  requireContract(canonicalStringify(state.space.collision) === canonicalStringify(compileBoundOverworld(state).collision),
    "Persisted seamless overworld geometry differs from its manifest");
  return true;
}
