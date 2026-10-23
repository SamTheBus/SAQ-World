// SAQ World boss restoration catalog, October 23 2026.
// These are the post-Dungeon redesigns, not the legacy boss controllers.
// Explicit, pre-existing reservations protect save compatibility and deterministic site allocation.
export const RECOVERED_BOSS_VERSION = 'recovered-boss-v1';
export const RECOVERED_BOSSES = Object.freeze({
  corrosive_abomination: Object.freeze({id:'corrosive_abomination',label:'CORROSIVE ABOMINATION',site:'repeatable-slot:ruin:wetland:standard:033',family:'ruin',biome:'wetland',color:'#91e56b',secondary:'#436f3f',adds:6,
    attacks:Object.freeze({corrosive_slam:75,spore_storm:85,acid_spill:45})}),
  void_overseer: Object.freeze({id:'void_overseer',label:'VOID OVERSEER',site:'repeatable-slot:ruin:frostland:deep:01',family:'ruin',biome:'frostland',color:'#fa78d5',secondary:'#38234a',adds:0,
    attacks:Object.freeze({eye_lance:75,singularity:360})}),
  chronos_arbitrator: Object.freeze({id:'chronos_arbitrator',label:'CHRONOS ARBITRATOR',site:'repeatable-slot:ruin:upland:standard:049',family:'ruin',biome:'upland',color:'#e8c874',secondary:'#536c8a',adds:0,
    attacks:Object.freeze({chronos_slam:75,time_field:60,chronos_rewind:240})}),
  nexus_overseer: Object.freeze({id:'nexus_overseer',label:'NEXUS OVERSEER',site:'repeatable-slot:ruin:tropical:standard:037',family:'ruin',biome:'tropical',color:'#5cecf5',secondary:'#a078ff',adds:2,
    attacks:Object.freeze({prism_collapse:110,control_glitch:60,prism_slam:75})}),
  gilded_vault_keeper: Object.freeze({id:'gilded_vault_keeper',label:'GILDED VAULT KEEPER',site:'repeatable-slot:crypt:upland:standard:01',family:'crypt',biome:'upland',color:'#ffd16a',secondary:'#aa3155',adds:0,
    attacks:Object.freeze({vault_crush:75,gold_fall:75,taxation:240})}),
  marcus: Object.freeze({id:'marcus',label:'MARCUS THE OUTLAW',site:'repeatable-slot:fort:grassland:standard:040',family:'fort',biome:'grassland',color:'#ffb968',secondary:'#bd4d39',adds:0,
    attacks:Object.freeze({coin_barrage:65,gold_rush:55,gilded_lasso:55,inversion:80,molten_shield:240})}),
  hooktail: Object.freeze({id:'hooktail',label:'HOOKTAIL',site:'repeatable-slot:ruin:desert:standard:056',family:'ruin',biome:'desert',color:'#ef5b57',secondary:'#63283a',adds:0,
    attacks:Object.freeze({scarlet_fire:90,hooked_tail:70,arena_collapse:100})}),
  cinderhart: Object.freeze({id:'cinderhart',label:'CINDERHART',site:'repeatable-slot:ruin:woodland:standard:054',family:'ruin',biome:'woodland',color:'#ff983e',secondary:'#432b25',adds:5,
    attacks:Object.freeze({warren_call:60,fire_charge:54})})
});
export const RECOVERED_BOSS_IDS = Object.freeze(Object.keys(RECOVERED_BOSSES));
const BY_SITE = new Map(Object.values(RECOVERED_BOSSES).map(row => [row.site,row]));
export function recoveredBossForReservation(reservationId,family,index,floorCount,enabled=true) {
  if(!enabled || !Number.isInteger(index) || index!==floorCount-1)return null;
  const boss=BY_SITE.get(reservationId);
  return boss?.family===family?boss:null;
}
export function recoveredBossForId(id){return RECOVERED_BOSSES[id]??null;}
