import {freezeWire} from '../contracts/wire.js';
import {ARACHNID_TREANT_PROFILE} from './bosses_d12_5.js';
import {collidesWithTiles} from '../rules/world_geometry.js';

// Dungeon's Zone 3 identity is named Brimstone Colossus and uses this AI key.
export const BRIMSTONE_ID='overlord_iron_vault';
export const BRIMSTONE_PROFILE=ARACHNID_TREANT_PROFILE;
export const BRIMSTONE=freezeWire({
 label:'BRIMSTONE COLOSSUS',range:220,recoveryTicks:120,
 strike:{telegraphTicks:24,recoveryTicks:50,radius:52,halfAngle:.95,damageNumerator:10},
 slam:{telegraphTicks:75,radius:64,damageNumerator:18},
 magma_vents:{telegraphTicks:75,count:2,boilTicks:270,flashTicks:18,reach:96,halfWidth:12,damageNumerator:13,maxActive:6}
});
export const brimstoneFortFloor=(site,index)=>site.familyId==='site-family:fort'&&site.sizeTier==='large'&&index===site.floorCount-1;
export const BRIMSTONE_VOLCANIC_LARGE_RUIN_V4='repeatable-slot:ruin:volcanic:large:01';
// The existing Fort Brimstone remains unchanged. Only this committed Ruin
// admission receives the new encounter; earlier saved rooms are not rewritten.
export function brimstoneVolcanicRuinFloorV4(site,index,state){
 return site?.familyId==='site-family:ruin'&&site.sizeTier==='large'&&
  index===site.floorCount-1&&
  site.socket?.provenance?.reservationId===BRIMSTONE_VOLCANIC_LARGE_RUIN_V4&&
  site.socket?.region?.biome==='volcanic'&&
  state?.d9World?.plannedWorld?.wildernessVersion!==undefined&&
  state.d9World.plannedWorld.combatVersion!==undefined;
}
// A full-width cross fissure needs orthogonal, walkable corridors and
// somewhere the player can retreat. This is immutable floor geometry, not VFX.
export function brimstoneRuinArenaProofV4(c,position){
 if(collidesWithTiles(c,position.x,position.y,34))return null;
 const arms=brimstoneVentArms(c,position);
 const horizontal=arms.east+arms.west,vertical=arms.north+arms.south;
 if(Math.min(...Object.values(arms))<24||horizontal<112||vertical<112)return null;
 return {arms,horizontal,vertical,shortest:Math.min(...Object.values(arms))};
}
export function chooseBrimstoneRuinAnchorV4(recipe){
 const c=recipe?.collision,leader=recipe?.encounter?.members?.[0];
 if(!c||!leader)return null;
 const others=recipe.encounter.members.slice(1).map(m=>m.position);
 const room=recipe.graph?.rooms?.find(r=>r.roomId===leader.roomId);
 const boxes=[...(room?.bounds?[room.bounds]:room&&Number.isInteger(room.cx)?[
  {x:room.cx-room.rx,y:room.cy-room.ry,width:room.rx*2+1,height:room.ry*2+1}
 ]:[]),{x:2,y:2,width:c.width-4,height:c.height-4}];
 const options=[];
 for(const [scope,b] of boxes.entries())for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++){
  if(x<=1||y<=1||x>=c.width-2||y>=c.height-2||c.tiles[y]?.[x]!=='1')continue;
  const p={x:(x+.5)*c.tileSize,y:(y+.5)*c.tileSize},distance=Math.hypot(p.x-leader.position.x,p.y-leader.position.y);
  if(distance>416||Math.hypot(p.x-recipe.entrance.x,p.y-recipe.entrance.y)<160||
     others.some(m=>Math.hypot(m.x-p.x,m.y-p.y)<62))continue;
  const proof=brimstoneRuinArenaProofV4(c,p);
  if(!proof)continue;
  options.push({position:p,scope,proof,score:Math.min(proof.horizontal,proof.vertical)*2+
   proof.shortest*3-distance*.3});
 }
 options.sort((a,b)=>a.scope-b.scope||b.score-a.score||
  a.position.y-b.position.y||a.position.x-b.position.x);
 return options[0]?{position:options[0].position,...options[0].proof}:null;
}

export function brimstoneLineClear(c,a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));
 for(let i=0;i<=n;i++){const q=i/n;if(collidesWithTiles(c,a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q,1))return false;}return true;
}
export function brimstoneVentArms(c,p){
 const arms={};for(const[key,dx,dy]of[['east',1,0],['west',-1,0],['north',0,-1],['south',0,1]]){
  let length=0;for(let d=2;d<=96;d+=2){if(collidesWithTiles(c,p.x+dx*d,p.y+dy*d,12))break;length=d;}arms[key]=length;
 }return arms;
}
export function brimstoneVentContains(v,p){
 const x=p.x-v.position.x,y=p.y-v.position.y;
 return Math.abs(y)<=12&&x>=-v.arms.west&&x<=v.arms.east||Math.abs(x)<=12&&y>=-v.arms.north&&y<=v.arms.south;
}
