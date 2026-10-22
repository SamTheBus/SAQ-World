import {collidesWithTiles} from '../rules/world_geometry.js';
import {copyWire,freezeWire} from './wire.js';

export const ARACHNID_TREANT_EXTRACTION_D12_5C='arachnid-treant-extraction-d12.5c-v1';

const center=value=>{const [x,y]=value.split(',').map(Number);return {x:(x+.5)*32,y:(y+.5)*32};};
const key=p=>`${Math.floor(p.x/32)},${Math.floor(p.y/32)}`;
const hash=text=>{let value=2166136261;for(let i=0;i<text.length;i++)value=Math.imul(value^text.charCodeAt(i),16777619);return value>>>0;};

function portalPosition(site,floor,boss){
 const reward=floor.reward?.position;if(!reward)return null;
 const room=floor.graph.rooms.find(row=>row.openCells.includes(key(reward)))??floor.graph.rooms.find(row=>row.roomId===boss.roomId);if(!room)return null;
 const portalId=`extraction:${site.siteId}:${floor.index}:${boss.bossId}`,phase=hash(portalId)%4,angles=[0,Math.PI/2,Math.PI,Math.PI*1.5],angle=angles[phase],desired={x:reward.x+Math.cos(angle)*96,y:reward.y+Math.sin(angle)*96},reserved=[floor.entrance,...Object.values(floor.transitions).filter(Boolean).map(row=>row.anchor)],decorations=(floor.visual?.decorations??[]).map(row=>({x:row.x*floor.collision.tileSize,y:row.y*floor.collision.tileSize}));
 const candidates=room.openCells.map(center).filter(point=>{const distance=Math.hypot(point.x-reward.x,point.y-reward.y);return distance>=72&&distance<=160&&!collidesWithTiles(floor.collision,point.x,point.y,22)&&reserved.every(anchor=>Math.hypot(point.x-anchor.x,point.y-anchor.y)>=80)&&decorations.every(anchor=>Math.hypot(point.x-anchor.x,point.y-anchor.y)>=72);}).sort((a,b)=>Math.hypot(a.x-desired.x,a.y-desired.y)-Math.hypot(b.x-desired.x,b.y-desired.y)||a.y-b.y||a.x-b.x);
 return candidates[0]??null;
}

export function projectArachnidTreantExtractionD12_5C(state,site,floor){
 if(state.proofCase!=='O'||!site||!floor||floor.index!==0)return null;
 const boss=Object.values(state.bossCombat?.bossesByEntityId??{}).find(row=>row.siteId===site.siteId&&row.floorId===floor.floorId&&row.groupId===floor.groupId);if(!boss)return null;
 const position=portalPosition(site,floor,boss);if(!position)return null;
 const group=state.groupsById[boss.groupId],economy=state.encounterEconomy.groups[boss.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null),portalId=`extraction:${site.siteId}:${floor.index}:${boss.bossId}`;
 return freezeWire({version:ARACHNID_TREANT_EXTRACTION_D12_5C,portalId,siteId:site.siteId,floorId:floor.floorId,groupId:boss.groupId,spaceInstanceId:floor.spaceInstanceId,position:copyWire(position),visible,activatedTick:visible?economy.clearedTick:null});
}
