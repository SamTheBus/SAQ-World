// Wilderness V3.7: three native, one-time encounters at existing V2 Woodland clearings.
// The immutable geography and 176 reserved capacities are not rewritten.
// Every group uses existing D9 combat, rewards, paging and campaign persistence.
import {WORLD_COMBAT_VERSION,hasWorldCombat} from '../content/world_combat_v1.js';
import {hasWilderness} from '../content/wilderness_v2.js';
import {worldIdentity} from './world_identity_d9.js';
import {PLANNED_ADDRESS_OFFSET} from './planned_world_foundation_v1.js';

export const WOODLAND_EVENT_PILOT_V3_7=Object.freeze([
  Object.freeze({slotId:'density-v2-event-capacity-030',ordinal:37,kind:'abandoned_camp',label:'Abandoned Supply Camp',rank:'C',families:Object.freeze(['sprout','slime','sprout','slime','golem','slime']),x:1440,y:6422}),
  Object.freeze({slotId:'density-v2-event-capacity-070',ordinal:38,kind:'roaming_pack',label:'Thornwood Swarm',rank:'C',families:Object.freeze(['sprout','sprout','slime','sprout','slime','sprout']),x:1632,y:6578}),
  Object.freeze({slotId:'density-v2-event-capacity-132',ordinal:39,kind:'treasure_cache',label:'Lost Woodland Cache',rank:'B',families:Object.freeze(['golem','slime','sprout','slime','golem','sprout']),x:1568,y:6838})
]);
const ordinals=new Set(WOODLAND_EVENT_PILOT_V3_7.map(e=>e.ordinal));
export const isWoodlandPilotEventAnchor=anchor=>anchor?.combatVersion===WORLD_COMBAT_VERSION&&ordinals.has(anchor.ordinal)&&typeof anchor.id==='string'&&anchor.id.startsWith('anchor:');
export const isWoodlandPilotTreasureAnchor=anchor=>isWoodlandPilotEventAnchor(anchor)&&anchor.ordinal===39;

// V2's authored positions use tile coordinates; D9 paging uses chunk coordinates
// offset by 1024. Keep the transformation explicit so markers and actors coincide.
export function woodlandPilotWorldPosition(slot) {
  return {chunkX:String(PLANNED_ADDRESS_OFFSET.chunkX+Math.floor(slot.x/32)),
    chunkY:String(PLANNED_ADDRESS_OFFSET.chunkY+Math.floor(slot.y/26)),
    localX:(slot.x%32+.5)*32,localY:(slot.y%26+.5)*32};
}
// Clearing centers can coincide with the corner of four D9 chunks. Keep the
// resident actors on the same native page, close to that original clearing.
const stable=text=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
function openThreeByThree(tile,x,y,landmassId) {
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const t=tile(x+dx,y+dy);
    if(t.collision!=='1'||t.landmassId!==landmassId||t.town||t.fortExterior||t.ruinExterior||t.caveExterior||t.kind==='bridge')return false;
  }
  return true;
}
export async function createWoodlandPilotEventAnchors({asset,binding,cx,cy,seed,sha256,tile,regularAnchors=[]}) {
  if(!hasWorldCombat(binding)||!hasWilderness(binding)||!asset.wildernessExtension?.eventCapacities)return [];
  const candidates=asset.wildernessExtension.eventCapacities;
  const result=[];
  for(const event of WOODLAND_EVENT_PILOT_V3_7){
    if(Math.floor(event.x/32)!==cx||Math.floor(event.y/26)!==cy)continue;
    const slot=candidates.find(s=>s.eventSlotId===event.slotId);
    if(!slot||slot.biome!=='woodland'||slot.position.x!==event.x||slot.position.y!==event.y||!slot.cells?.length)
      throw new Error('Woodland pilot is not backed by the frozen Wilderness V2 clearing');
    const cellIds=new Set(slot.cells.map(c=>c.x+','+c.y));
    const candidates=[];
    // Use safe shoulders adjacent to the reserved clearing rather than
    // placing actors at negative local coordinates across chunk boundaries.
    for(let dy=2;dy<=16;dy++)for(let dx=2;dx<=18;dx++){
      const x=event.x+dx,y=event.y+dy;
      if(Math.floor(x/32)!==cx||Math.floor(y/26)!==cy)continue;
      if(!openThreeByThree(tile,x,y,slot.landmassId))continue;
      const position={x:(x-cx*32+.5)*32,y:(y-cy*26+.5)*32};
      if(regularAnchors.some(a=>Math.hypot(position.x-a.position.x,position.y-a.position.y)<144))continue;
      candidates.push({position,priority:dx+dy+(cellIds.has(x+','+y)?-3:0),
        tie:stable(event.slotId+'/'+dx+'/'+dy)});
    }
    candidates.sort((a,b)=>a.priority-b.priority||a.tie-b.tie);
    const members=[];
    for(const p of candidates){
      if(members.some(m=>Math.hypot(m.position.x-p.position.x,m.position.y-p.position.y)<78))continue;
      members.push({family:event.families[members.length],position:p.position});
      if(members.length===6)break;
    }
    // Invalid geography stays dormant rather than carving new terrain.
    if(members.length!==6)continue;
    const identity=await worldIdentity(seed,'anchor',['woodland-event-pilot-v3-7',event.slotId],sha256);
    const anchor=members.reduce((best,m)=>!best||m.position.x+m.position.y<best.position.x+best.position.y?m:best,null);
    result.push({id:identity.id,ordinal:event.ordinal,
      position:{...anchor.position},
      rank:event.rank,combatVersion:WORLD_COMBAT_VERSION,members});

  }
  return result;
}
