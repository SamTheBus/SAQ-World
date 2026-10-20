import {DUNGEON_MOBS_V1_CATALOG_ENEMIES,DUNGEON_MOBS_V1_CATALOG_PROFILES,LEGACY_ORDINARY_ENEMIES,LEGACY_ORDINARY_PROFILES,DUNGEON_MOBS_V1_ENEMIES,DUNGEON_MOBS_V1_PROFILES,DUNGEON_MOBS_V2_ENEMIES,DUNGEON_MOBS_V2_PROFILES} from '../content/ordinary_enemies.js';
import {createContentCatalog,verifyContentFingerprint} from '../content/index.js';
import {hasWorldCombat} from '../content/world_combat_v1.js';
import {closedRecord,copyWire,canonicalStringify,requireContract as check,safeInteger} from './wire.js';
import {installHostileProjectiles} from './hostile_projectiles_v1.js';

export const DUNGEON_MOB_CATALOG_UPGRADE='dungeon-mob-catalog-upgrade-v1';
const additions=[...DUNGEON_MOBS_V1_ENEMIES,...DUNGEON_MOBS_V1_PROFILES];
const addedIds=new Set(additions.map(d=>d.contentDefinitionId));
const laterIds=new Set([...DUNGEON_MOBS_V2_ENEMIES,...DUNGEON_MOBS_V2_PROFILES].map(d=>d.contentDefinitionId));
const same=(a,b)=>a===b||a!==undefined&&b!==undefined&&canonicalStringify(a)===canonicalStringify(b);
const hasLaterEntries=state=>Object.keys(state.content.definitionsById).some(id=>laterIds.has(id));
// V1 always denotes the original seven plus its eleven-member append. A later
// append's receipt identifies that exact historical prefix without rewriting it.
export function dungeonMobV1CatalogPrefix(state){
 if(!hasLaterEntries(state))return state.content;
 return {...copyWire(state.content),fingerprint:state.hostileCombat?.catalogUpgradeV2?.fromFingerprint??state.content.fingerprint,
  definitionsById:Object.fromEntries(Object.entries(state.content.definitionsById).filter(([id])=>!laterIds.has(id)).map(([id,d])=>[id,copyWire(d)]))};
}
export function hasDungeonMobCatalog(state){return additions.every(d=>same(state.content.definitionsById[d.contentDefinitionId],d));}
export function validateOrdinaryCatalog(state){
 const prefix=dungeonMobV1CatalogPrefix(state),defs=prefix.definitionsById,full=hasDungeonMobCatalog(state);
 check(full||!additions.some(d=>Object.hasOwn(defs,d.contentDefinitionId)),'Partial Dungeon mob catalog');
 for(const d of full?[...DUNGEON_MOBS_V1_CATALOG_ENEMIES,...DUNGEON_MOBS_V1_CATALOG_PROFILES]:[...LEGACY_ORDINARY_ENEMIES,...LEGACY_ORDINARY_PROFILES])check(same(defs[d.contentDefinitionId],d),'Ordinary content drift');
 const receipt=state.hostileCombat?.catalogUpgrade;if(receipt){
  closedRecord(receipt,['version','appliedTick','fromFingerprint','toFingerprint']);
  check(!hasLaterEntries(state)||state.hostileCombat?.catalogUpgradeV2,'Missing later catalog prefix receipt');
  check(full&&receipt.version===DUNGEON_MOB_CATALOG_UPGRADE&&/^[a-f0-9]{64}$/.test(receipt.fromFingerprint)&&receipt.toFingerprint===prefix.fingerprint&&receipt.fromFingerprint!==receipt.toFingerprint,'Dungeon mob catalog upgrade receipt');
  safeInteger(receipt.appliedTick,0,state.tick);
 }
 return full;
}

export async function upgradeDungeonMobCatalog(state,{sha256}){
 if(!hasWorldCombat(state)||hasDungeonMobCatalog(state))return {changed:false};
 validateOrdinaryCatalog(state);await verifyContentFingerprint(state.content,{sha256});
 const before=state.content.fingerprint;
 const content=await createContentCatalog([...Object.values(state.content.definitionsById),...additions],{sha256});
 state.content=copyWire(content);state.campaign.contentFingerprint=content.fingerprint;
 installHostileProjectiles(state);
 state.hostileCombat.catalogUpgrade={version:DUNGEON_MOB_CATALOG_UPGRADE,appliedTick:state.tick,fromFingerprint:before,toFingerprint:content.fingerprint};
 return {changed:true};
}

export function previousDungeonMobCatalog(state){
 const receipt=state.hostileCombat?.catalogUpgrade;if(!receipt||!hasDungeonMobCatalog(state))return null;
 const prefix=dungeonMobV1CatalogPrefix(state);
 return {...copyWire(prefix),fingerprint:receipt.fromFingerprint,definitionsById:Object.fromEntries(Object.entries(prefix.definitionsById).filter(([id])=>!addedIds.has(id)).map(([id,d])=>[id,copyWire(d)]))};
}

// Exactly one reward-free, same-tick catalog append may replace the static
// content document. No actor, geography, inventory, binding or history changes.
export function isDungeonMobCatalogUpgrade(before,after){
 try{
  if(!hasWorldCombat(before)||!hasWorldCombat(after)||hasDungeonMobCatalog(before)||!hasDungeonMobCatalog(after)||hasLaterEntries(before)||hasLaterEntries(after))return false;
  const r=after.hostileCombat?.catalogUpgrade;if(!r||r.version!==DUNGEON_MOB_CATALOG_UPGRADE||before.hostileCombat?.catalogUpgrade||r.appliedTick!==before.tick||after.tick!==before.tick||r.fromFingerprint!==before.content.fingerprint||r.toFingerprint!==after.content.fingerprint)return false;
  if(!same(previousDungeonMobCatalog(after),before.content))return false;
  const expected=copyWire(before);expected.content=copyWire(after.content);expected.campaign.contentFingerprint=after.content.fingerprint;installHostileProjectiles(expected);expected.hostileCombat.catalogUpgrade=copyWire(r);
  return same(expected,after);
 }catch{return false;}
}

export function previousDungeonMobOriginDocument(state,document){
 const prior=previousDungeonMobCatalog(state),r=state.hostileCombat?.catalogUpgrade;
 if(!prior||r.appliedTick!==state.tick)return null;
 const old=copyWire(document);old.payload.content=prior;return old;
}
