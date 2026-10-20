import {environmentWorldOffset,terrainHash} from './environment_motifs.js';
import {hybridArtTerrainBinding} from './hybrid_art_binding.js';
import {prepareCelTexture} from './cel_materials_v1.js';

// Opt-in presentation adapter. It never receives an authority mutation API.
export async function createHybridArtPilotV1(environment,review,initialMode='candidate',coverage='inspection-corridor'){
 const base=new URL('../../assets/hybrid-art-pilot-v1/',import.meta.url);
 const get=async name=>{const r=await environment.fetch(new URL(name,base));if(!r.ok)throw Error('Missing authored kit '+name);return r.json();};
 const manifest=await get('kit-manifest.json'),journey=await get('journey.json');
 const terrainBinding=coverage==='compatible-terrain'?hybridArtTerrainBinding(review.binding):null;
 if(!terrainBinding&&review.binding.assetHash!==journey.geometryBinding.assetHash)throw Error('Art pilot requires its exact Alpha geometry binding');
 const chunks=new Set(journey.kitChunkKeys),tiles=[];let mode='existing',loading=null,loadMs=0,downloads=0;
 async function load(){if(tiles.length)return;if(loading)return loading;loading=(async()=>{
  const start=environment.performance.now(),r=await environment.fetch(new URL(manifest.atlas.path,base));if(!r.ok)throw Error('Authored atlas unavailable');
  const bytes=await r.arrayBuffer(),digest=Array.from(new Uint8Array(await environment.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==manifest.atlas.bytes||digest!==manifest.atlas.sha256)throw Error('Authored atlas commitment mismatch');
  const image=await environment.createImageBitmap(new Blob([bytes],{type:'image/png'}));
  try{if(image.width!==manifest.atlas.width||image.height!==manifest.atlas.height)throw Error('Authored atlas dimensions mismatch');
   for(const s of manifest.slots.filter(s=>s.used)){const col=s.index%4,row=Math.floor(s.index/4),inset=s.kind==='sprite'?8:3;
    let x=Math.floor(col*image.width/4)+inset,y=Math.floor(row*image.height/4)+inset,w=Math.floor((col+1)*image.width/4)-x-inset,h=Math.floor((row+1)*image.height/4)-y-inset;
    if(s.index===4){x+=Math.floor(w*.32);w=Math.floor(w*.36);} // Use the authored dirt material, not a second drawn path silhouette.
    const c=environment.document.createElement('canvas');c.width=s.decodedWidth;c.height=s.decodedHeight;c.getContext('2d').drawImage(image,x,y,w,h,0,0,c.width,c.height);tiles[s.index]=prepareCelTexture(c,{terrain:s.kind!=='sprite'});
   }
  }finally{image.close();}downloads++;loadMs=environment.performance.now()-start;
 })();try{await loading;}catch(e){tiles.length=0;throw e;}finally{loading=null;}}
 async function setMode(value){if(!['existing','candidate'].includes(value))throw Error('Unknown art comparison mode');if(value==='candidate')await load();mode=value;return mode;}
 function eligible(space,x,y){if(mode!=='candidate'||!tiles.length||space.site||!space.visual?.worldAddress)return false;const o=environmentWorldOffset(space),tx=Math.floor((x+o.x-1048576)/32),ty=Math.floor((y+o.y-851968)/32);if(coverage==='compatible-terrain'){const v=space.visual,biome=v.biomes?.[Math.floor(y/32)-(v.originTile?.y??0)]?.[Math.floor(x/32)-(v.originTile?.x??0)];return ['w','a'].includes(biome);}return chunks.has(Math.floor(tx/32)+','+Math.floor(ty/26));}
 function stamp(c,index,x,y,w,h,n=0){const image=tiles[index];if(!image)return;c.save();c.translate(x+w/2,y+h/2);if(n&1)c.scale(-1,1);if(n&2&&index<7)c.scale(1,-1);c.drawImage(image,-w/2,-h/2,w,h);c.restore();}
 function drawGround(c,space,bounds){if(mode!=='candidate')return;
  // The cache recorder stores style assignments before replaying save/restore.
  // Explicitly restore alpha so descriptor preparation cannot tint a later page.
  let started=false;const v=space.visual,t=32,ox=v.originTile?.x??0,oy=v.originTile?.y??0,o=environmentWorldOffset(space);
  for(let y=Math.floor(bounds.y/t);y<=Math.floor((bounds.y+bounds.height)/t);y++)for(let x=Math.floor(bounds.x/t);x<=Math.floor((bounds.x+bounds.width)/t);x++){
   const biome=v.biomes?.[y-oy]?.[x-ox];if(!['w','a'].includes(biome)||!eligible(space,x*t,y*t))continue;
   if(!started){c.globalAlpha=1;started=true;}
   const n=terrainHash(x+o.x/t,y+o.y/t,701);stamp(c,biome==='a'?1:0,x*t,y*t,t,t,n);
   if(biome==='w'&&n%11===0){c.save();c.globalAlpha=.14;stamp(c,2,x*t,y*t,t,t,n);c.restore();c.globalAlpha=1;}
   const at=(dx,dy)=>v.terrain[y+dy-oy]?.[x+dx-ox];if(!['r','p','H','V','O','W','L'].includes(at(0,0)))for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]])if(['O','W','L'].includes(at(dx,dy))) {
    // Texture stays on the existing dry side of the exact water boundary.
    c.save();c.beginPath();c.rect(x*t+(dx>0?24:0),y*t+(dy>0?24:0),dx?8:t,dy?8:t);c.clip();stamp(c,6,x*t,y*t,t,t,n);c.restore();
   }
  }
 }
 function covers(space,bounds){if(mode!=='candidate')return false;const v=space.visual,ox=v?.originTile?.x??0,oy=v?.originTile?.y??0;for(let y=Math.floor(bounds.y/32);y<=Math.floor((bounds.y+bounds.height)/32);y++)for(let x=Math.floor(bounds.x/32);x<=Math.floor((bounds.x+bounds.width)/32);x++)if(!['w','a'].includes(v?.biomes?.[y-oy]?.[x-ox])||!eligible(space,x*32,y*32))return false;return true;}
 const road=(c,type,n,t)=>stamp(c,type==='r'?3:4,-1,-1,t+2,t+2,n);
 function drawSurface(c,space,type,x,y,t,at){if(!eligible(space,x*t,y*t))return;const v=space.visual,biome=v.biomes?.[y-(v.originTile?.y??0)]?.[x-(v.originTile?.x??0)];if(!['w','a'].includes(biome))return;
  if(type==='C')stamp(c,5,x*t,y*t,t,t,0);
  if(type==='H'||type==='V'){const horizontal=type==='H',top=at(x+(horizontal?0:-1),y+(horizontal?-1:0))===type?0:4,bottom=at(x+(horizontal?0:1),y+(horizontal?1:0))===type?0:4;
   c.save();c.translate(x*t+t/2,y*t+t/2);if(!horizontal)c.rotate(Math.PI/2);c.drawImage(tiles[7],-t/2,-t/2+top,t,t-top-bottom);c.restore();
  }
 }
 function tree(c,space,x,y,size,n){if(!eligible(space,x+size/2,y+size*.78))return false;stamp(c,8+n%4,x,y,size,size,n);return true;}
 function rock(c,space,x,y,size,n){if(!eligible(space,x+size/2,y+size/2))return false;stamp(c,12+n%3,x,y,size,size,n);return true;}
 await setMode(initialMode);
 return Object.freeze({manifest,journey:review.binding.assetHash===journey.geometryBinding.assetHash?journey:null,terrainBinding,setMode,eligible,covers,drawGround,road,drawSurface,tree,rock,mode:()=>mode,resources:()=>({authoredArtMode:mode,authoredArtLoaded:tiles.length>0,authoredArtDownloadBytes:downloads?manifest.atlas.bytes:0,authoredArtLoadMs:loadMs,authoredArtDownloads:downloads,authoredArtDecodedBytes:tiles.reduce((n,c)=>n+(c?c.width*c.height*4:0),0),authoredArtSourceTransientBytes:downloads?manifest.atlas.width*manifest.atlas.height*4:0,authoredArtCorridorChunks:chunks.size,authoredArtCoverage:coverage,authoredArtBinding:terrainBinding})});
}
