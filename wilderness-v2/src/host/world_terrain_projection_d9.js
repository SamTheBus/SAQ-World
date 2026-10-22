import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {projectToLocalFrameD9,localFramePositionD9} from '../shared/contracts/local_world_frames_d9.js';
import {copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {originEgressGuidePaths} from '../shared/contracts/origin_egress_d9.js';

// A bounded visual window copied from already admitted geometry. It cannot
// generate terrain, choose site content, reveal a map, or activate an episode.
export function projectWorldTerrainD9(state,compiled,{x,y,width=88,height=88}){
 check(Number.isInteger(x)&&Number.isInteger(y)&&width<=88&&height<=88&&width>0&&height>0,'Terrain projection bound');
 const grid=Array.from({length:height},()=>Array(width).fill('v')),biomes=Array.from({length:height},()=>Array(width).fill('o')),blockers=[],decorations=[];
 const plannedRuinIds=new Set(Object.values(state.d9World.siteReservationsById??{}).filter(r=>['procedural-ruin-family','procedural-crypt-family'].includes(r.packageId)).map(r=>r.siteId)),ruinWalls=new Set();
 const plannedRuinArt=id=>plannedRuinIds.has(/^ruin(?:-art)?:(site:[a-f0-9]{32}):/.exec(id??'')?.[1]);
 function paint(terrain,offsetX,offsetY,features,biome,details=[]){
  const right=offsetX+(terrain[0]?.length??0),bottom=offsetY+terrain.length;if(right<=x||bottom<=y||offsetX>=x+width||offsetY>=y+height)return;
  for(let gy=Math.max(y,offsetY);gy<Math.min(y+height,bottom);gy++)for(let gx=Math.max(x,offsetX);gx<Math.min(x+width,right);gx++){grid[gy-y][gx-x]=terrain[gy-offsetY][gx-offsetX];biomes[gy-y][gx-x]=Array.isArray(biome)?biome[gy-offsetY]?.[gx-offsetX]??'o':biome;}
  for(const b of features){const px=b.x+offsetX,py=b.y+offsetY;if(px+b.width>=x&&py+b.height>=y&&px<x+width&&py<y+height){const planned=b.kind==='ruin-exterior-masonry'&&plannedRuinArt(b.id);if(planned&&ruinWalls.has(b.id))continue;if(planned)ruinWalls.add(b.id);blockers.push({...b,x:px,y:py,...(planned?{plannedRuinExterior:true}:{})});}}
  for(const d of details){const px=d.x+offsetX,py=d.y+offsetY;if(px>=x-20&&py>=y-20&&px<x+width+20&&py<y+height+20)decorations.push({...d,x:px,y:py,...(plannedRuinArt(d.id)?{plannedRuinExterior:true}:{})});}
 }
 let originBlockers=compiled.visual.blockers;
 for(const opening of state.d9World.origin.egress.openings)for(const p of opening.cells)originBlockers=originBlockers.flatMap(b=>{
  if(p.x<b.x||p.y<b.y||p.x>=b.x+b.width||p.y>=b.y+b.height)return [b];
  return [{...b,height:p.y-b.y},{...b,y:p.y+1,height:b.y+b.height-p.y-1},{...b,y:p.y,height:1,width:p.x-b.x},{...b,x:p.x+1,y:p.y,height:1,width:b.x+b.width-p.x-1}].filter(r=>r.width>0&&r.height>0);
 });
 paint(compiled.visual.terrain,0,0,originBlockers,'o');
 // Paint one established road from Alderwatch into the generated country.
 // This is derived from the saved opening and immutable origin collision.
 for(const route of originEgressGuidePaths(compiled,compiled.collision,state.d9World.origin.egress))for(const p of route.cells)if(p.x>=x&&p.y>=y&&p.x<x+width&&p.y<y+height)grid[p.y-y][p.x-x]='r';
 // The origin overlay is a separate compatibility fact; its openings use the
 // adjacent ground material without editing the retained origin visual source.
 for(const opening of state.d9World.origin.egress.openings)for(const p of opening.cells)if(p.x>=x&&p.y>=y&&p.x<x+width&&p.y<y+height)grid[p.y-y][p.x-x]='r';
 for(const chunk of state.d9World.runtime.chunks){const position=projectToLocalFrameD9({chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:0,localY:0},state.d9World.runtime.frames);if(!position)continue;paint(chunk.visual.terrain,position.x/P.tileSize,position.y/P.tileSize,chunk.visual.blockers,chunk.visual.biomes??{woodland:'w','rocky-uplands':'r',marsh:'m'}[chunk.region.biome],chunk.visual.decorations??[]);}
 const point=localFramePositionD9({x:x*P.tileSize,y:y*P.tileSize},state.d9World.runtime.frames);
 // This is a bounded derived client view, not a serialized authority record.
 // Its 88×88 window may legitimately intersect more than 256 wall rectangles.
 // Keep every rectangle; individual persisted chunk pages retain wire limits.
 return {originTile:{x,y},terrain:grid.map(r=>r.join('')),biomes:biomes.map(r=>r.join('')),blockers,decorations,worldAddress:point};
}
