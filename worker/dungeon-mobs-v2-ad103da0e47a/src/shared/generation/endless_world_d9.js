import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {signedAddress,addressWire,floorDiv,regionAddress} from '../contracts/world_address.js';
import {freezeWire,copyWire,requireContract as check} from '../contracts/wire.js';
import {worldIdentity} from './world_identity_d9.js';
import {progressionWire} from '../contracts/progression_integer.js';
import {validateSiteSocketD9,SITE_SOCKET_D9} from '../contracts/site_content_d9.js';
import {woodlandRegionNameD12_2} from '../content/woodland_region_names_d12_2.js';
const mix=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0;};
const abs=n=>n<0n?-n:n,max=(a,b)=>a>b?a:b;
const BIOME_FIELD_SPAN=72n,BIOME_CODES={woodland:'w','rocky-uplands':'r',marsh:'m'};
// A globally sampled value field makes biome borders independent of chunk and
// macro-region edges. Only the small remainder inside a field cell becomes a
// Number; arbitrarily large world coordinates stay exact BigInts.
export function biomeAtD9(seed,tileX,tileY){
 const x=BigInt(tileX),y=BigInt(tileY),gx=floorDiv(x,BIOME_FIELD_SPAN),gy=floorDiv(y,BIOME_FIELD_SPAN),ix=Number(x-gx*BIOME_FIELD_SPAN),iy=Number(y-gy*BIOME_FIELD_SPAN),s=Number(BIOME_FIELD_SPAN);
 const score=biome=>{const sample=(dx,dy)=>mix(P.version+'/'+seed+'/biome-field/'+biome+'/'+(gx+BigInt(dx))+'/'+(gy+BigInt(dy)))%65536,a=sample(0,0)*(s-ix)+sample(1,0)*ix,b=sample(0,1)*(s-ix)+sample(1,1)*ix;return a*(s-iy)+b*iy;};
 return P.biomes.map(b=>[b,score(b)]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
}
export function regionDescriptorD9(seed,x,y,{originWidthChunks=4,originHeightChunks=4}={}){
 x=signedAddress(x);y=signedAddress(y);const key=P.version+'/'+seed+'/region/'+x+'/'+y,roll=mix(key+'/floor')%100,rx=BigInt(x),ry=BigInt(y),distance=max(abs(rx),abs(ry)),octave=distance>0n?distance.toString(2).length-1:0;
 const biome=biomeAtD9(seed,rx*BigInt(P.regionChunks*32)+BigInt(P.regionChunks*16),ry*BigInt(P.regionChunks*26)+BigInt(P.regionChunks*13)),low=roll<P.lowFloorPercent,anomaly=!low&&roll<P.lowFloorPercent+P.anomalyPercent;
 const shift=low?0:Math.max(0,Math.floor(octave/4)-1),maxBand=anomaly?4:Math.min(4,1+Math.floor(octave/2)),band=low?0:anomaly?3+mix(key+'/anomaly')%2:mix(key+'/band')%(maxBand+1),[min,maxValue]=P.floorBands[band],factor=1n<<BigInt(shift),base=BigInt(min+mix(key+'/within')%(maxValue-min+1));
 const floor=progressionWire(base*factor),names={'rocky-uplands':['Stone','Amber','Slate','High'],marsh:['Rain','Mist','Reed','Fen']},ends={'rocky-uplands':['fold','ridge','heights','crag'],marsh:['mere','fen','marsh','water']},name=biome==='woodland'?woodlandRegionNameD12_2(mix(key+'/name')%4,mix(key+'/end')%4):names[biome][mix(key+'/name')%4]+ends[biome][mix(key+'/end')%4];
 return freezeWire({version:P.version,regionX:x,regionY:y,biome,name,minimumLevel:floor,originWidthChunks,originHeightChunks});
}
export function chunkRegionD9(seed,x,y,origin){const r=regionAddress(x,y),d=regionDescriptorD9(seed,r.regionX,r.regionY,origin),cx=BigInt(x),cy=BigInt(y),collar=BigInt(P.originCollarChunks),w=BigInt(origin?.originWidthChunks??4),h=BigInt(origin?.originHeightChunks??4);return cx>=-collar&&cy>=-collar&&cx<w+collar&&cy<h+collar?freezeWire({...d,areaId:'origin-collar-d9-v1',minimumLevel:1}):d;}
export function sharedEdgeD9(seed,x,y,side){x=BigInt(signedAddress(x));y=BigInt(signedAddress(y));check(['north','east','south','west'].includes(side),'Invalid edge side');const vertical=side==='east'||side==='west';if(side==='east')x++;if(side==='south')y++;const key=P.version+'/'+seed+'/edge/'+(vertical?'v':'h')+'/'+x+'/'+y,count=vertical?26:32,center=4+mix(key)%(count-8),cells=Array.from({length:count},(_,i)=>Math.abs(i-center)<=2?'1':'2'),terrain=cells.map((v,i)=>Math.abs(i-center)<=1?'p':'g');
 // Corner cells use shared vertex samples, irrespective of which edge requested them.
 for(const i of [0,count-1]){const vx=x+(vertical?0n:i===0?0n:1n),vy=y+(vertical?(i===0?0n:1n):0n);cells[i]=mix(P.version+'/'+seed+'/corner/'+vx+'/'+vy)%9===0?'2':'1';terrain[i]='g';}
 return freezeWire({version:'world-edge-d9-v1',key,axis:vertical?'vertical':'horizontal',center,cells:cells.join(''),terrain:terrain.join('')});
}
export async function generateChunkD9({seed,chunkX,chunkY,origin},sha256){
 signedAddress(chunkX);signedAddress(chunkY);if(origin){const x=BigInt(chunkX),y=BigInt(chunkY);check(!(x>=0n&&y>=0n&&x<BigInt(origin.originWidthChunks)&&y<BigInt(origin.originHeightChunks)),'Reserved historical origin: use the immutable origin binding');}const identity=await worldIdentity(seed,'chunk',[chunkX,chunkY],sha256),region=chunkRegionD9(seed,chunkX,chunkY,origin),X=BigInt(chunkX)*32n,Y=BigInt(chunkY)*26n,edges=Object.fromEntries(['north','east','south','west'].map(s=>[s,sharedEdgeD9(seed,chunkX,chunkY,s)])),tiles=[],terrain=[],biomes=[],blockers=[];
 for(let y=0;y<26;y++){const row=[],art=[],biomeRow=[];for(let x=0;x<32;x++){const tx=X+BigInt(x),ty=Y+BigInt(y),biome=biomeAtD9(seed,tx,ty),field=mix(seed+'/landform/'+floorDiv(tx,5n)+'/'+floorDiv(ty,5n)),detail=mix(seed+'/detail/'+tx+'/'+ty),density=biome==='woodland'?19:biome==='marsh'?12:8,blocked=field%100<density&&detail%5!==0;row.push(blocked?'2':'1');art.push('g');biomeRow.push(BIOME_CODES[biome]);}tiles.push(row);terrain.push(art);biomes.push(biomeRow);}
 for(let x=0;x<32;x++){tiles[0][x]=edges.north.cells[x];terrain[0][x]=edges.north.terrain[x];tiles[25][x]=edges.south.cells[x];terrain[25][x]=edges.south.terrain[x];}
 for(let y=0;y<26;y++){tiles[y][0]=edges.west.cells[y];terrain[y][0]=edges.west.terrain[y];tiles[y][31]=edges.east.cells[y];terrain[y][31]=edges.east.terrain[y];}
 // Connect only the approved legacy perimeter cells. Historical absent origin
 // cells stay absent; no procedural chunk is generated inside the origin bounds.
 const originApproaches=[];
 for(const opening of origin?.egress?.openings??[]){const matching=[];for(const cell of opening.cells){
  const dx=opening.side==='west'?-1:opening.side==='east'?1:0,dy=opening.side==='north'?-1:opening.side==='south'?1:0;
  const gx=BigInt(cell.x+dx),gy=BigInt(cell.y+dy),cx=floorDiv(gx,32n),cy=floorDiv(gy,26n);
  if(cx!==BigInt(chunkX)||cy!==BigInt(chunkY))continue;
  const x=Number(gx-cx*32n),y=Number(gy-cy*26n);matching.push({x,y});tiles[y][x]='1';terrain[y][x]='r';
  const side=opening.side==='west'?'east':opening.side==='east'?'west':opening.side==='north'?'south':'north',i=side==='north'||side==='south'?x:y,edge=edges[side];
  const cells=edge.cells.split(''),art=edge.terrain.split('');cells[i]='1';art[i]='r';edges[side]={...edge,cells:cells.join(''),terrain:art.join(''),originOverlayVersion:origin.egress.version};
 }if(matching.length)originApproaches.push({side:opening.side,point:matching[Math.floor(matching.length/2)]});}
 // Regional route hierarchy: one continuous main road follows the region's
 // stable axis; narrower trails join the remaining passages and local content.
 // This preserves every shared crossing while avoiding four equal beige arms
 // converging on a repeated central hub in every chunk.
 const roadCells=new Set(),carve=(x,y,kind='p')=>{if(x>=0&&x<32&&y>=0&&y<26){tiles[y][x]='1';if(kind==='r'||terrain[y][x]!=='r')terrain[y][x]=kind;roadCells.add(x+','+y);}},line=(x1,y1,x2,y2,kind='p')=>{let x=x1,y=y1;carve(x,y,kind);while(x!==x2){x+=x<x2?1:-1;carve(x,y,kind);}while(y!==y2){y+=y<y2?1:-1;carve(x,y,kind);}},elbow=(from,to,kind,axis)=>{const n=mix(identity.digest+'/route/'+from.x+'/'+from.y+'/'+to.x+'/'+to.y),bend=axis==='v'?{x:from.x,y:Math.max(4,Math.min(21,Math.round((from.y+to.y)/2)+(n%5-2)))}:{x:Math.max(4,Math.min(27,Math.round((from.x+to.x)/2)+(n%5-2))),y:from.y};line(from.x,from.y,bend.x,bend.y,kind);line(bend.x,bend.y,to.x,to.y,kind);};
 const mainVertical=mix(P.version+'/'+seed+'/route-axis/'+region.regionX+'/'+region.regionY)%2===0,junction={x:8+mix(identity.digest+'/route/jx')%16,y:7+mix(identity.digest+'/route/jy')%12},ends={north:{x:edges.north.center,y:0},south:{x:edges.south.center,y:25},west:{x:0,y:edges.west.center},east:{x:31,y:edges.east.center}};
 if(mainVertical){elbow(ends.north,junction,'r','v');elbow(ends.south,junction,'r','v');elbow(ends.west,junction,'p','h');elbow(ends.east,junction,'p','h');}
 else{elbow(ends.west,junction,'r','h');elbow(ends.east,junction,'r','h');elbow(ends.north,junction,'p','v');elbow(ends.south,junction,'p','v');}
 // A legacy origin opening is not an ordinary shared-edge center. Join its
 // exact middle cell to the nearest interior spine with a three-tile brush so
 // the normal player hull can cross into genuinely connected terrain.
 const wideCarve=(x,y)=>{for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)carve(xx,yy);},wideLine=(a,b)=>{let x=a.x,y=a.y;wideCarve(x,y);while(x!==b.x){x+=x<b.x?1:-1;wideCarve(x,y);}while(y!==b.y){y+=y<b.y?1:-1;wideCarve(x,y);}};
 for(const approach of originApproaches){const candidates=[...roadCells].map(v=>v.split(',').map(Number)).filter(([x,y])=>x>=3&&x<=28&&y>=3&&y<=22),target=candidates.sort((a,b)=>Math.abs(a[0]-approach.point.x)+Math.abs(a[1]-approach.point.y)-Math.abs(b[0]-approach.point.x)-Math.abs(b[1]-approach.point.y)||a[1]-b[1]||a[0]-b[0])[0];check(target,'Origin egress has no interior road target');wideLine(approach.point,{x:target[0],y:target[1]});}
 // A painted route is a traversal promise. Reserve one tile of walkable
 // shoulder around every centerline cell before blocker rectangles are made.
 // Shared edges already expose a five-cell opening, so the three-cell route
 // corridor remains identical on both sides of a chunk boundary.
 const routeClearance=new Set();
 for(const value of [...roadCells]){const [x,y]=value.split(',').map(Number);for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)if(xx>=0&&xx<32&&yy>=0&&yy<26){tiles[yy][xx]='1';routeClearance.add(xx+','+yy);}}
 // Rectangle runs preserve exactly the collision footprint while avoiding an
 // individual tree/rock drawing descriptor for each blocked tile.
 const covered=new Set();
 for(let y=0;y<26;y++)for(let x=0;x<32;x++)if(tiles[y][x]!=='1'&&!covered.has(y*32+x)){
  let width=1,height=1;while(x+width<32&&tiles[y][x+width]!=='1'&&!covered.has(y*32+x+width))width++;
  while(y+height<26&&Array.from({length:width},(_,i)=>tiles[y+height][x+i]!=='1'&&!covered.has((y+height)*32+x+i)).every(Boolean))height++;
  for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)covered.add(yy*32+xx);
  blockers.push({id:`obstacle:${identity.digest.slice(0,16)}:${x}:${y}:${width}:${height}`,x,y,width,height,kind:biomes[y][x]==='r'?'rock':'thicket',detail:''});
 }
 // Catalog positions are candidates only; occupancy and episode placement are
 // checked by authority later. Generation itself never creates an episode.
 const anchors=[];for(let i=0;i<2;i++){const h=mix(identity.digest+'/anchor/'+i),x=4+h%24,y=4+(h>>>8)%18;if(tiles[y][x]==='1'&&tiles[y][x+1]==='1'){const id=await worldIdentity(seed,'anchor',[chunkX,chunkY,i],sha256);anchors.push({id:id.id,ordinal:i,position:{x:(x+.5)*32,y:(y+.5)*32},rank:['C','B','A','S'][(h>>>16)%4],members:[{family:['sprout','golem','slime'][h%3]},{family:['sprout','golem','slime'][(h+1)%3]}]});}}
 // A geography socket has no selected content package. No catalog/ledger/RNG
 // for interiors is consulted by generation, preloading, discovery or rendering.
 const sites=[];
 if(mix(identity.digest+'/site-socket')%P.siteSocketChanceDenominator===0){
  const id=await worldIdentity(seed,'site',[chunkX,chunkY,0],sha256);
  // Bind the socket to a deterministic interior road position. This avoids the
  // old repeated north-row entrance while preserving a passable approach.
  const candidates=[...roadCells].map(v=>v.split(',').map(Number)).filter(([x,y])=>x>=3&&x<=28&&y>=3&&y<=22),[x,y]=candidates[mix(id.digest+'/entrance')%candidates.length];
  const site={version:SITE_SOCKET_D9,siteId:id.id,siteSeed:id.digest,entrance:{chunkX,chunkY,localX:(x+.5)*32,localY:(y+.5)*32},siteClass:'dungeon',capabilities:['interior'],region:{regionX:region.regionX,regionY:region.regionY,biome:region.biome},minimumLevel:region.minimumLevel,provenance:{geographyVersion:P.version,chunkId:identity.id,ordinal:0}};
  site.minimumLevel=copyWire(site.minimumLevel);validateSiteSocketD9(site);sites.push(site);
 }
 const mask=set=>Array.from({length:26},(_,y)=>Array.from({length:32},(_,x)=>set.has(x+','+y)?'1':'0').join(''));
 return freezeWire({version:P.version,identity,chunkX,chunkY,region,collision:{tileSize:32,width:32,height:26,tiles:tiles.map(r=>r.join(''))},visual:{terrain:terrain.map(r=>r.join('')),biomes:biomes.map(r=>r.join('')),blockers,route:{centerline:mask(roadCells),clearance:mask(routeClearance)}},edges,anchors,sites});
}
