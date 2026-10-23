// Wilderness V3.8: proximity-limited, spoiler-light hints for existing Woodland
// events. Presentation-only: no extra spawns, progression, save state or world edits.
import {WOODLAND_EVENT_PILOT_V3_7,woodlandPilotWorldPosition} from '../generation/woodland_event_pilot_v3_7.js';

export const WOODLAND_RUMOR_RADIUS_TILES=54;
export const WOODLAND_SIGHT_RADIUS_TILES=20;
const hints=Object.freeze({
 'density-v2-event-capacity-030':'Faint campfire smoke drifts between the trees',
 'density-v2-event-capacity-070':'Broken saplings and fresh tracks mark the undergrowth',
 'density-v2-event-capacity-132':'Weathered stones hide something among the roots'
});
const direction=(dx,dy)=>{
 const east=Math.abs(dx)>Math.abs(dy)*.42?(dx>0?'east':'west'):'';
 const north=Math.abs(dy)>Math.abs(dx)*.42?(dy>0?'south':'north'):'';
 return north+east||'nearby';
};
export function woodlandEventDistanceV3_8(from,to) {
 if(!from||!to)return Infinity;
 const cx=BigInt(to.chunkX)-BigInt(from.chunkX),cy=BigInt(to.chunkY)-BigInt(from.chunkY);
 // Bound Number conversion even if the D9 world extends to huge coordinates.
 if(cx>3n||cx< -3n||cy>3n||cy< -3n)return Infinity;
 return Math.hypot(Number(cx)*1024+to.localX-from.localX,
   Number(cy)*832+to.localY-from.localY);
}
export function woodlandEventCluesV3_8(position,statuses=[]) {
 if(!position)return Object.freeze([]);
 const stateById=new Map(statuses.map(s=>[s.slotId,s.state]));
 const candidates=[];
 for(const event of WOODLAND_EVENT_PILOT_V3_7){
   const point=woodlandPilotWorldPosition(event);
   const distance=woodlandEventDistanceV3_8(position,point),tiles=distance/32;
   if(tiles>WOODLAND_RUMOR_RADIUS_TILES)continue;
   const state=stateById.get(event.slotId)??'undiscovered';
   if(state==='completed'&&tiles>WOODLAND_SIGHT_RADIUS_TILES)continue;
   const dx=(Number(BigInt(point.chunkX)-BigInt(position.chunkX))*1024+point.localX-position.localX);
   const dy=(Number(BigInt(point.chunkY)-BigInt(position.chunkY))*832+point.localY-position.localY);
   const bearing=direction(dx,dy);
   const sighted=tiles<=WOODLAND_SIGHT_RADIUS_TILES;
   candidates.push(Object.freeze({
     slotId:event.slotId,kind:event.kind,state,stage:sighted?'sighted':'rumor',
     title:sighted?event.label:'Something in the wilderness',
     text:state==='completed'?event.label+' · cleared':sighted?event.label:hints[event.slotId],
     direction:bearing,distanceTiles:Math.round(tiles),
     // The minimap receives exact coordinates only after the player is close.
     ...(sighted?{position:point}:{}),
   }));
 }
 candidates.sort((a,b)=>a.distanceTiles-b.distanceTiles||a.slotId.localeCompare(b.slotId));
 return Object.freeze(candidates);
}
