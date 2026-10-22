import { ORDINARY_ENEMIES, ORDINARY_PROFILES } from '../content/ordinary_enemies.js';
import {ARACHNID_TREANT_PROFILE} from '../content/bosses_d12_5.js';
import { createWorldState } from "./state.js";
import { createId } from "./identities.js";
import { initializeHistory } from "./history.js";
import { copyWire } from "./wire.js";
import { WORLD_COMBAT_CONTRACT_VERSION } from "./versions.js";
import { createContentCatalog, WORLD1C_PLAYER_PROFILE, WORLD1C_GREEN_SLIME_PROFILE } from "../content/index.js";
import { ACTIVE_SPACE_FIXTURES } from "../content/active_spaces.js";

import { authoredGeographyDefinition, initialDiscovery, OLDWARD_SPACES, SPACE_IDS, oldwardSpace } from "./geography.js";

import { initialEncounterProof } from "./encounter_proof.js";
import { initializePrimary } from "./primary.js";
import { SHIELD_SWORD_PRIMARY } from "../content/manual_primary.js";
import { createOldwardSeamlessManifest, SEAMLESS_OVERWORLD_SPACE_ID, SPACE_IDS as SEAMLESS_AREA_IDS } from "../content/oldward_wood.js";
import { initialOverworldCampaign, worldPointForArea } from "./overworld.js";
import { compileBoundOverworld } from "../content/overworld_fixture_catalog.js";
import { generateProceduralOverworld, LOCATION_SITE_PROOF_CATALOG, ARTIFACT_PROOF_CATALOG } from "../generation/procedural_overworld.js";
import { validateStoredSeed } from "./seed.js";

// Retained proof scenario and authored campaign share the same actor/state construction.
export async function createClientFixture({ sha256, nextToken, playerCount = 1, scenario = "fixture", manualPrimary = false, campaignSeed = null, populationEnabled=false, sitesEnabled=false }) {
  if (!["fixture", "oldward", "seamless", "procedural"].includes(scenario)) throw new TypeError("Unknown client content scenario");
  if (![1, 2, 3, 4].includes(playerCount)) throw new TypeError("Fixture party size must be one through four");
  const id = (kind) => createId(kind, nextToken(kind));
  const geography = scenario === "oldward" ? await authoredGeographyDefinition(sha256) : null;
  if(scenario==="procedural")validateStoredSeed(campaignSeed);
  const generated = scenario==="procedural"?await generateProceduralOverworld({campaignSeed,sha256,populationEnabled,sitesEnabled}):null;
  const manifest = scenario === "seamless" ? await createOldwardSeamlessManifest(sha256) : generated?.manifest??null;
  const spaces = geography || manifest ? OLDWARD_SPACES : ACTIVE_SPACE_FIXTURES;
  const content = await createContentCatalog([WORLD1C_PLAYER_PROFILE, ...(populationEnabled?[...ORDINARY_ENEMIES,...ORDINARY_PROFILES,ARACHNID_TREANT_PROFILE]:[]), ...spaces.map((f) =>
    ({ contentDefinitionId: f.contentDefinitionId, kind: "diagnostic" })), ...(geography ? [geography] : []), ...(manifest ? [manifest] : []),
    ...(generated?[...LOCATION_SITE_PROOF_CATALOG,...ARTIFACT_PROOF_CATALOG]:[]),
    ...(manualPrimary ? [SHIELD_SWORD_PRIMARY, WORLD1C_GREEN_SLIME_PROFILE] : [])], { sha256 });
  const fixture = manifest ? compileBoundOverworld({ campaign: { overworld: { manifestDefinitionId: manifest.contentDefinitionId,
    manifestId: manifest.manifestId, manifestHash: manifest.manifestHash } }, content: { definitionsById: { [manifest.contentDefinitionId]: manifest } } }) :
    geography ? oldwardSpace(SPACE_IDS.town) : ACTIVE_SPACE_FIXTURES[0];
  const campaignId = id("campaignId");
  const playersById = {}, charactersById = {}, entitiesById = {};
  const p = WORLD1C_PLAYER_PROFILE;
  let localPlayerId;
  for (let index = 0; index < playerCount; index++) {
    const playerId = id("playerId"), characterId = id("characterId"), entityId = id("entityId");
    if (index === 0) localPlayerId = playerId; // Explicit controller created here, never inferred from a map.
    charactersById[characterId] = { characterId };
    playersById[playerId] = { playerId, characterId, entityId, connectionStatus: "connected" };
    entitiesById[entityId] = { entityId, ownerCharacterId: characterId, kind: "actor", contentDefinitionId: p.contentDefinitionId,
      hp: copyWire(p.maxHp), maxHp: copyWire(p.maxHp), team: p.team, position: manifest ?
        (manifest.manifestVersion===2?{x:manifest.start.position.x+(index%2)*24,y:manifest.start.position.y+Math.floor(index/2)*24}:
          worldPointForArea(manifest, SEAMLESS_AREA_IDS.town, { x: 516 + (index%2)*24, y: 356 + Math.floor(index/2)*24 })) :
        geography ? copyWire(fixture.anchor.partyPositions[index]) : { x: 112, y: 272 + index * 24 },
      hullRadius: p.hullRadius, combatRadius: p.combatRadius, movementIntent: { x: 0, y: 0 }, moveSpeed: p.moveSpeed, alive: true,
      attackDamage: copyWire(p.attackDamage), attackReach: p.attackReach, attackReachMode: p.attackReachMode,
      attackDelayTicks: p.attackDelayTicks, attackTimer: p.attackDelayTicks, nextAttackActionSequence: 1, movedLastTick: false, ai: null };
  }
  const activeSpaceRef = { spaceId: fixture.spaceId, spaceInstanceId: id("spaceInstanceId"), spaceRevision: 1 };
  const state = { protocolVersion: 1, simulationStateSchemaVersion: 1, ticksPerSecond: 60, tick: 0, content,
    campaign: { campaignId, saveRevision: 0, seed: generated?copyWire(campaignSeed):null, contentFingerprint: content.fingerprint, charactersById, checkpointId: null },
    session: { sessionId: id("sessionId"), campaignId, playerIds: Object.keys(playersById).sort() }, playersById, activeSpaceRef,
    space: { ...activeSpaceRef, contentDefinitionId: fixture.contentDefinitionId, collision: copyWire(fixture.collision), entitiesById,
      encounterId: null, encounterAttemptId: null }, combat: { combatContractVersion: WORLD_COMBAT_CONTRACT_VERSION, appliedActionsById: {} },
    eventEmission: { lastEventSequence: 0 }, rngStatesByName: {}, appliedCommandsById: {}, lastAppliedAuthorityOrder: 0,
    multiplayer: { contractVersion: 1, priorSessions: [], encounterParticipants: null } };
  if (geography) state.campaign.geography = initialDiscovery(geography);
  if (manifest) state.campaign.overworld = initialOverworldCampaign(manifest, manifest.manifestVersion===2?manifest.start.chunkId:SEAMLESS_AREA_IDS.town);
  if ((geography || manifest) && manualPrimary) state.campaign.encounterProof = initialEncounterProof();
  return { initialState: createWorldState(initializeHistory(manualPrimary ? initializePrimary(state) : state)), localPlayerId,
    generationDiagnostics:generated?.diagnostics??null };
}
