import {DUNGEON_MOBS_V2_ENEMIES,DUNGEON_MOBS_V2_PROFILES} from '../content/ordinary_enemies.js';
import {createContentCatalog,verifyContentFingerprint} from '../content/index.js';
import {hasWorldCombat} from '../content/world_combat_v1.js';
import {closedRecord,copyWire,canonicalStringify,requireContract as check,safeInteger} from './wire.js';
import {installHostileProjectiles} from './hostile_projectiles_v1.js';
import {hasDungeonMobCatalog,validateOrdinaryCatalog,isDungeonMobCatalogUpgrade,dungeonMobV1CatalogPrefix} from './dungeon_mob_catalog_v1.js';

export const DUNGEON_MOB_CATALOG_UPGRADE_V2='dungeon-mob-catalog-upgrade-v2';
const additions=[...DUNGEON_MOBS_V2_ENEMIES,...DUNGEON_MOBS_V2_PROFILES];
const same=(a,b)=>a===b||a!==undefined&&b!==undefined&&canonicalStringify(a)===canonicalStringify(b);
export function hasDungeonMobCatalogV2(state){return hasDungeonMobCatalog(state)&&additions.every(d=>same(state.content.definitionsById[d.contentDefinitionId],d));}

export function validateOrdinaryCatalogV2(state){
 const defs=state.content.definitionsById,full=hasDungeonMobCatalogV2(state);
 check(full||!additions.some(d=>Object.hasOwn(defs,d.contentDefinitionId)),'Partial Dungeon mob V2 catalog');
 validateOrdinaryCatalog(state);
 const receipt=state.hostileCombat?.catalogUpgradeV2;
 if(receipt){
  closedRecord(receipt,['version','appliedTick','fromFingerprint','toFingerprint']);
  check(full&&receipt.version===DUNGEON_MOB_CATALOG_UPGRADE_V2&&/^[a-f0-9]{64}$/.test(receipt.fromFingerprint)&&receipt.toFingerprint===state.content.fingerprint&&receipt.fromFingerprint!==receipt.toFingerprint,'Dungeon mob V2 catalog upgrade receipt');
  safeInteger(receipt.appliedTick,0,state.tick);
  if(state.hostileCombat.catalogUpgrade)check(state.hostileCombat.catalogUpgrade.appliedTick<=receipt.appliedTick,'Dungeon mob catalog receipt chronology');
 }
 return full?2:hasDungeonMobCatalog(state)?1:0;
}

export async function upgradeDungeonMobCatalogV2(state,{sha256}){
 if(!hasWorldCombat(state))return {changed:false};
 validateOrdinaryCatalogV2(state);if(hasDungeonMobCatalogV2(state))return {changed:false};
 check(hasDungeonMobCatalog(state),'Dungeon mob V1 catalog must be published before V2');
 await verifyContentFingerprint(state.content,{sha256});
 const before=state.content.fingerprint,content=await createContentCatalog([...Object.values(state.content.definitionsById),...additions],{sha256});
 state.content=copyWire(content);state.campaign.contentFingerprint=content.fingerprint;installHostileProjectiles(state);
 state.hostileCombat.catalogUpgradeV2={version:DUNGEON_MOB_CATALOG_UPGRADE_V2,appliedTick:state.tick,fromFingerprint:before,toFingerprint:content.fingerprint};
 return {changed:true};
}

export function previousDungeonMobCatalogV2(state){
 if(!state.hostileCombat?.catalogUpgradeV2||!hasDungeonMobCatalogV2(state))return null;
 return dungeonMobV1CatalogPrefix(state);
}

export function isDungeonMobCatalogUpgradeV2(before,after){
 try{
  if(!hasWorldCombat(before)||!hasWorldCombat(after)||!hasDungeonMobCatalog(before)||hasDungeonMobCatalogV2(before)||!hasDungeonMobCatalogV2(after))return false;
  const r=after.hostileCombat?.catalogUpgradeV2;
  if(!r||r.version!==DUNGEON_MOB_CATALOG_UPGRADE_V2||before.hostileCombat?.catalogUpgradeV2||r.appliedTick!==before.tick||after.tick!==before.tick||r.fromFingerprint!==before.content.fingerprint||r.toFingerprint!==after.content.fingerprint)return false;
  if(!same(previousDungeonMobCatalogV2(after),before.content))return false;
  const expected=copyWire(before);expected.content=copyWire(after.content);expected.campaign.contentFingerprint=after.content.fingerprint;installHostileProjectiles(expected);expected.hostileCombat.catalogUpgradeV2=copyWire(r);
  return same(expected,after);
 }catch{return false;}
}

export function validateDungeonMobCatalogProgress(before,after){
 for(const [key,admitted]of [['catalogUpgrade',isDungeonMobCatalogUpgrade],['catalogUpgradeV2',isDungeonMobCatalogUpgradeV2]]){
  const a=before.hostileCombat?.[key],b=after.hostileCombat?.[key];
  check(same(a,b)||a===undefined&&b!==undefined&&admitted(before,after),'Dungeon mob catalog receipt history changed');
 }
}

export function previousDungeonMobOriginDocumentV2(state,document){
 const prior=previousDungeonMobCatalogV2(state),r=state.hostileCombat?.catalogUpgradeV2;
 if(!prior||r.appliedTick!==state.tick)return null;
 const old=copyWire(document);old.payload.content=copyWire(prior);return old;
}
