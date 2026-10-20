import {createHybridArtPilotV1} from './hybrid_art_pilot_v1.js';
import {environmentWorldOffset,environmentSeed,terrainHash,drawMushrooms} from './environment_motifs.js';
import {roadMask} from './road_presentation.js';
const TAU=Math.PI*2;

// Presentation-only successor. World-phase materials never choose geometry.
export async function createHybridArtV2(environment,review,initialMode='candidate'){
 const prior=await createHybridArtPilotV1(environment,review,'existing','compatible-terrain'),base=new URL('../../assets/hybrid-art-v2/',import.meta.url);
 const response=await environment.fetch(new URL('kit-manifest.json',base));if(!response.ok)throw Error('Missing V2 kit manifest');const manifest=await response.json();
 let mode='existing',loading=null,loadMs=0,downloads=0;const draws={ground:0,road:0,surface:0,bush:0};const materials=[],bushes=[];
 async function load(){if(materials.length&&bushes.length===4)return;if(loading)return loading;loading=(async()=>{
  const at=environment.performance.now(),r=await environment.fetch(new URL(manifest.atlas.path,base));if(!r.ok)throw Error('V2 materials unavailable');const bytes=await r.arrayBuffer();
  const digest=Array.from(new Uint8Array(await environment.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(digest!==manifest.atlas.sha256||bytes.byteLength!==manifest.atlas.bytes)throw Error('V2 material commitment mismatch');
  const bitmap=await environment.createImageBitmap(new Blob([bytes],{type:'image/png'}));try{
   if(bitmap.width!==manifest.atlas.width||bitmap.height!==manifest.atlas.height)throw Error('V2 atlas dimensions');
   for(let i=0;i<8;i++){
    const tile=environment.document.createElement('canvas');tile.width=tile.height=256;const c=tile.getContext('2d'),x=Math.floor(i%4*bitmap.width/4)+3,y=Math.floor(Math.floor(i/4)*bitmap.height/4)+3,w=Math.floor((i%4+1)*bitmap.width/4)-x-3,h=Math.floor((Math.floor(i/4)+1)*bitmap.height/4)-y-3;
    // Mirrored material quadrants have identical shared edges. The world-space
    // phase remains continuous across tiles, pages, local rebases and chunks.
    for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){c.save();c.translate(xx?256:0,yy?256:0);c.scale(xx?-1:1,yy?-1:1);c.drawImage(bitmap,x,y,w,h,0,0,128,128);c.restore();}materials[i]=tile;
   }
  }finally{bitmap.close();}
  const br=await environment.fetch(new URL(manifest.bushes.path,base));if(!br.ok)throw Error('V2 bushes unavailable');const bb=await br.arrayBuffer(),bd=Array.from(new Uint8Array(await environment.crypto.subtle.digest('SHA-256',bb)),n=>n.toString(16).padStart(2,'0')).join('');if(bd!==manifest.bushes.sha256||bb.byteLength!==manifest.bushes.bytes)throw Error('V2 bush commitment mismatch');
  const foliage=await environment.createImageBitmap(new Blob([bb],{type:'image/png'}));try{if(foliage.width!==manifest.bushes.width||foliage.height!==manifest.bushes.height)throw Error('V2 bush dimensions');for(let i=0;i<4;i++){const sprite=environment.document.createElement('canvas');sprite.width=sprite.height=64;const s=manifest.bushes.slots[i];sprite.getContext('2d').drawImage(foliage,s.x,s.y,s.width,s.height,0,64-s.decodedHeight,64,s.decodedHeight);bushes[i]=sprite;}}finally{foliage.close();}downloads+=2;loadMs=environment.performance.now()-at;
 })();try{await loading;}catch(e){materials.length=0;bushes.length=0;throw e;}finally{loading=null;}}
 async function setMode(value){if(!['existing','v1','candidate'].includes(value))throw Error('Unknown art mode');if(value==='candidate')await load();await prior.setMode(value==='existing'?'existing':'candidate');mode=value;return value;}
 function material(c,index,x,y,w,h,worldX,worldY,scale=1){const image=materials[index];for(let yy=0;yy<h;){const sy=(((worldY+yy)/scale)%256+256)%256,hh=Math.min(h-yy,(256-sy)*scale);for(let xx=0;xx<w;){const sx=(((worldX+xx)/scale)%256+256)%256,ww=Math.min(w-xx,(256-sx)*scale);c.drawImage(image,sx,sy,ww/scale,hh/scale,x+xx,y+yy,ww,hh);xx+=ww;}yy+=hh;}}
 function drawGround(c,space,bounds){if(mode!=='candidate')return prior.drawGround(c,space,bounds);const v=space.visual,o=environmentWorldOffset(space),ox=v.originTile?.x??0,oy=v.originTile?.y??0;
  for(let y=Math.floor(bounds.y/32);y<=Math.floor((bounds.y+bounds.height)/32);y++)for(let x=Math.floor(bounds.x/32);x<=Math.floor((bounds.x+bounds.width)/32);x++){
   const type=v.terrain[y-oy]?.[x-ox];if(['O','W','L'].includes(type))continue;const biome=v.biomes?.[y-oy]?.[x-ox];if(!['w','a'].includes(biome)||!prior.eligible(space,x*32,y*32))continue;draws.ground++;c.globalAlpha=1;material(c,biome==='a'?1:0,x*32,y*32,32,32,x*32+o.x,y*32+o.y);
   if(['r','p','H','V','O','W','L'].includes(type))continue;
   for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]])if(['O','W','L'].includes(v.terrain[y+dy-oy]?.[x+dx-ox])){c.save();c.beginPath();c.rect(x*32+(dx>0?24:0),y*32+(dy>0?24:0),dx?8:32,dy?8:32);c.clip();material(c,6,x*32,y*32,32,32,x*32+o.x,y*32+o.y);c.restore();}
  }
 }
 function road(c,type,n,t,worldX=0,worldY=0){if(mode!=='candidate')return prior.road(c,type,n,t);material(c,type==='r'?3:4,-1,-1,t+2,t+2,worldX-1,worldY-1);}
 function roadOverlay(c,space,bounds,at){if(mode!=='candidate')return;const t=32,o=environmentWorldOffset(space),seed=environmentSeed(space),x0=Math.floor(bounds.x/t)-1,y0=Math.floor(bounds.y/t)-1,x1=Math.floor((bounds.x+bounds.width)/t),y1=Math.floor((bounds.y+bounds.height)/t);
  let eligibleRoad=false;for(let y=y0;y<=y1&&!eligibleRoad;y++)for(let x=x0;x<=x1;x++)if(['r','p'].includes(at(x,y))&&prior.eligible(space,x*t,y*t)){eligibleRoad=true;break;}if(!eligibleRoad)return;
  // Trace the same cell silhouettes into one union. A single material pass
  // avoids filtered drawImage edges exposing a 32px tile grid inside the road.
  for(const type of ['r','p']){c.save();c.beginPath();let count=0;
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(at(x,y)!==type||!prior.eligible(space,x*t,y*t))continue;count++;const mask=roadMask(at,x,y),n=terrainHash(x+o.x/t,y+o.y/t,seed),north=mask&1,east=mask&2,south=mask&4,west=mask&8,trail=type==='p',inset=trail?6:2;
    const nwRoad=!trail&&at(x-1,y-1)==='r',neRoad=!trail&&at(x+1,y-1)==='r',swRoad=!trail&&at(x-1,y+1)==='r',seRoad=!trail&&at(x+1,y+1)==='r',px=x*t,py=y*t;
    const l=px+(west||nwRoad||swRoad?-1:inset+n%2),r=px+(east||neRoad||seRoad?t+1:t-inset-(n>>>4)%2),top=py+(north||nwRoad||neRoad?-1:inset+(n>>>8)%2),bottom=py+(south||swRoad||seRoad?t+1:t-inset-(n>>>12)%2),nw=!north&&!west?9:0,ne=!north&&!east?9:0,se=!south&&!east?9:0,sw=!south&&!west?9:0;
    c.moveTo(l+nw,top);c.lineTo(r-ne,top);c.quadraticCurveTo(r,top,r,top+ne);c.lineTo(r,bottom-se);c.quadraticCurveTo(r,bottom,r-se,bottom);c.lineTo(l+sw,bottom);c.quadraticCurveTo(l,bottom,l,bottom-sw);c.lineTo(l,top+nw);c.quadraticCurveTo(l,top,l+nw,top);c.closePath();
   }if(count){draws.road+=count;c.clip();material(c,type==='r'?3:4,x0*t-1,y0*t-1,(x1-x0+1)*t+2,(y1-y0+1)*t+2,x0*t-1+o.x,y0*t-1+o.y);}c.restore();
  }
 }
 function drawSurface(c,space,type,x,y,t,at){if(mode!=='candidate')return prior.drawSurface(c,space,type,x,y,t,at);if(!prior.eligible(space,x*t,y*t))return;const o=environmentWorldOffset(space);
  if(type==='C'){draws.surface++;material(c,5,x*t,y*t,t,t,x*t+o.x,y*t+o.y);return;}
  if(type==='H'||type==='V'){
   draws.surface++;const horizontal=type==='H',crossA=at(x+(horizontal?0:-1),y+(horizontal?-1:0))===type?0:4,crossB=at(x+(horizontal?0:1),y+(horizontal?1:0))===type?0:4;
   // Timber grain/planks use a quarter-scale material; world phase still joins
   // across deck cells. Deck size, edge beams and collision remain unchanged.
   c.save();c.translate(x*t+t/2,y*t+t/2);if(!horizontal)c.rotate(Math.PI/2);material(c,7,-t/2,-t/2+crossA,t,t-crossA-crossB,horizontal?x*t+o.x:y*t+o.y,horizontal?y*t+o.y:x*t+o.x,.25);
   // End threshold/pegs remain inside the accepted deck, not extra collision.
   for(const side of [-1,1])if(at(x+(horizontal?side:0),y+(horizontal?0:side))!==type){c.fillStyle='#513e29';c.fillRect(side<0?-t/2:t/2-3,-t/2+crossA,3,t-crossA-crossB);c.fillStyle='#c1a274';c.fillRect(side<0?-t/2+1:t/2-2,-t/2+crossA,1,t-crossA-crossB);}
   c.restore();
  }
 }
 function baseArt(c,space,x,y,size,n,biome){if(mode!=='candidate'||!prior.eligible(space,x+size/2,y+size*.78))return false;draws.bush++;c.save();c.globalAlpha=1;
  // One foliage sprite replaces each existing obstacle-base visual. Broad
  // opaque underbrush covers the blocked tile; leaves, not ground material,
  // define its irregular silhouette. Contact shade stays under the foliage.
  c.fillStyle='#163624';c.globalAlpha=.35;c.beginPath();c.ellipse(x+size*.5,y+size*.76,size*.52,size*.22,0,0,TAU);c.fill();c.globalAlpha=1;c.translate(x+size*.5,y+size*.5);if(n&1)c.scale(-1,1);c.drawImage(bushes[(n>>>2)%4],-size*.61,-size*.65,size*1.22,size*1.22);c.restore();c.globalAlpha=1;const cx=x+size*.5+(n%7)-3,ground=y+size*.76+((n>>>4)%5)-2;if(n%19===0)retainedStump(c,cx,ground-3,n);else if(n%23===0)retainedLog(c,cx,ground-1,n);return true;}
 await setMode(initialMode);
 return Object.freeze({...prior,manifest,setMode,mode:()=>mode,drawGround,road,roadOverlay,drawSurface,base:baseArt,resources:()=>({...prior.resources(),authoredArtMode:mode,authoredArtV2Rendered:{...draws},authoredArtV2DownloadBytes:downloads?manifest.atlas.bytes+manifest.bushes.bytes:0,authoredArtV2LoadMs:loadMs,authoredArtV2DecodedBytes:materials.length*256*256*4+bushes.length*64*64*4,authoredArtV2SourceTransientBytes:downloads?(manifest.atlas.width*manifest.atlas.height+manifest.bushes.width*manifest.bushes.height)*4:0,authoredArtV2Downloads:downloads,authoredMaterialPeriodPixels:256})});
}

// Reused embedded base props: identical accepted coordinates/counts.
function retainedStump(ctx,x,y,n){ctx.save();ctx.translate(x,y);ctx.fillStyle='#263c27';ctx.beginPath();ctx.ellipse(0,5,9,3.5,0,0,TAU);ctx.fill();ctx.fillStyle='#68401f';ctx.strokeStyle='#2d1d11';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(6,-5);ctx.lineTo(5,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#b17b3d';ctx.beginPath();ctx.ellipse(.5,-5,6,2.5,0,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#704720';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(.5,-5,3,0,TAU);ctx.stroke();if(n%2)drawMushrooms(ctx,7,2);ctx.restore();}
function retainedLog(ctx,x,y,n){ctx.save();ctx.translate(x,y);ctx.rotate(((n>>>5)%7-3)*.06);ctx.fillStyle='#263c27';ctx.beginPath();ctx.ellipse(0,5,17,4,0,0,TAU);ctx.fill();ctx.fillStyle='#5d351c';ctx.strokeStyle='#28190e';ctx.lineWidth=1.4;ctx.beginPath();ctx.roundRect(-16,-3,31,8,4);ctx.fill();ctx.stroke();ctx.fillStyle='#8b5b2c';ctx.fillRect(-11,-2,17,2);ctx.fillStyle='#75964a';ctx.fillRect(-4,-4,9,2);ctx.beginPath();ctx.arc(15,1,4,0,TAU);ctx.fillStyle='#a9773d';ctx.fill();ctx.stroke();ctx.restore();}
