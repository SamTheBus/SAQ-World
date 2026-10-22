import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';

export const WOODLAND_RUIN_EXTERIOR_D11_3_2='woodland-ruin-exterior-d11.3.2-v1';
const T=32;

// D11.3.2 retains the accepted nine-by-eight entrance footprint. The last
// three rows now agree exactly with the authored rubble and root bases. Only
// the centre tile is painted as worn road; the remaining walkable cells stay
// Woodland ground so the approach does not become a broad beige stamp.
const ROWS=[
 '000000000',
 '000000000',
 '000111000',
 '000111000',
 '000111000',
 '001111100',
 '001111100',
 '011111110'
];
const LEFT=-4,TOP=-4;
const solid=(x,y)=>ROWS[y-TOP]?.[x-LEFT]==='0';

export function overlayWoodlandRuinExteriorD11_3_2(chunk,bootstrap){
 const site=bootstrap?.bootstrap??bootstrap?.guaranteedCandidate??bootstrap;if(!site?.entrance||site.entrance.chunkX!==chunk.chunkX||site.entrance.chunkY!==chunk.chunkY)return chunk;
 const ex=Math.floor(site.entrance.localX/T),ey=Math.floor(site.entrance.localY/T);
 check(ex+LEFT>=0&&ex+LEFT+9<=32&&ey+TOP>=0&&ey+TOP+8<=26,'Ruin exterior crosses page boundary');
 const collision=chunk.collision.tiles.map(r=>[...r]),terrain=chunk.visual.terrain.map(r=>[...r]),biomes=chunk.visual.biomes.map(r=>[...r]),centerline=chunk.visual.route.centerline.map(r=>[...r]),clearance=chunk.visual.route.clearance.map(r=>[...r]);
 for(let ry=0;ry<ROWS.length;ry++)for(let rx=0;rx<ROWS[ry].length;rx++){
  const x=ex+LEFT+rx,y=ey+TOP+ry,walk=ROWS[ry][rx]==='1',path=walk&&x===ex;
  collision[y][x]=walk?'1':'0';terrain[y][x]=path?'p':'g';biomes[y][x]='w';centerline[y][x]=path?'1':'0';clearance[y][x]=walk?'1':'0';
 }
 const owns=(x,y)=>x>=ex+LEFT&&x<ex+LEFT+9&&y>=ey+TOP&&y<ey+TOP+8;
 const intersects=b=>b.x<ex+LEFT+9&&b.x+b.width>ex+LEFT&&b.y<ey+TOP+8&&b.y+b.height>ey+TOP;
 const blockers=chunk.visual.blockers.filter(b=>!intersects(b));
 for(const b of [
  {x:ex-4,y:ey-4,width:9,height:2,detail:'rear-mass'},
  {x:ex-4,y:ey-2,width:3,height:3,detail:'left-shoulder'},
  {x:ex+2,y:ey-2,width:3,height:3,detail:'right-shoulder'},
  {x:ex-4,y:ey+1,width:2,height:2,detail:'left-rubble'},
  {x:ex+3,y:ey+1,width:2,height:2,detail:'right-rubble'},
  {x:ex-4,y:ey+3,width:1,height:1,detail:'left-root'},
  {x:ex+4,y:ey+3,width:1,height:1,detail:'right-root'}
 ])blockers.push({id:`ruin:${site.siteId}:${b.detail}`,...b,kind:'ruin-exterior-masonry'});
 const decorations=(chunk.visual.decorations??[]).filter(d=>!owns(Math.floor(d.x),Math.floor(d.y))),anchors=chunk.anchors.filter(a=>!owns(Math.floor(a.position.x/T),Math.floor(a.position.y/T))),sites=chunk.sites.filter(s=>s.siteId===site.siteId||!owns(Math.floor(s.entrance.localX/T),Math.floor(s.entrance.localY/T)));
 return freezeWire({...copyWire(chunk),collision:{...copyWire(chunk.collision),tiles:collision.map(r=>r.join(''))},visual:{...copyWire(chunk.visual),terrain:terrain.map(r=>r.join('')),biomes:biomes.map(r=>r.join('')),blockers,decorations,route:{centerline:centerline.map(r=>r.join('')),clearance:clearance.map(r=>r.join(''))}},anchors,sites,ruinExterior:{version:WOODLAND_RUIN_EXTERIOR_D11_3_2,siteId:site.siteId,entranceTile:{x:ex,y:ey},mask:[...ROWS]}});
}

export const ruinExteriorSolidD11_3_2=solid;
