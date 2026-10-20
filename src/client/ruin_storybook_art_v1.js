import {createHybridArtV2} from './hybrid_art_v2.js';
import {environmentWorldOffset} from './environment_motifs.js';
import {drawCreatureD11} from './creature_presentation_d11.js';
import {ruinLandscapeBlendAt} from '../shared/generation/ruin_groves_v1.js';
import {terrainHash} from './environment_motifs.js';
import {depthItem} from './world_depth_presentation.js';
import {prepareCelTexture} from './cel_materials_v1.js';

// Small translucent layers stay compatible with the scenery command recorder.
// No opaque canopy discs, blur/filter work, or authority/collision changes.
export function paintRuinContactShadow(c,x,y,size,kind='tree'){
 const radius=size*(kind==='tree'?.18:.28),ground=y+size*.85;
 c.save();for(const [scale,alpha]of [[1,.04],[.70,.05],[.38,.08]]){c.fillStyle=`rgba(31,54,28,${alpha})`;c.beginPath();c.ellipse(x+size*.5,ground,radius*scale,size*.075*scale,0,0,Math.PI*2);c.fill();}c.restore();
}

// Presentation adapter only. The sampler never selects collision or content.
// One bounded decoded kit; no per-chunk image allocation or scene authority.
export async function createRuinStorybookArtV1(environment,review,initial='storybook'){
 const prior=await createHybridArtV2(environment,review,'candidate'),base=new URL('../../assets/ruin-storybook-v1/',import.meta.url),response=await environment.fetch(new URL('kit-manifest.json',base));if(!response.ok)throw Error('Missing storybook manifest');const manifest=await response.json();
 const images={},modules={},flora=[],materials=[],draws={ground:0,foliage:0,stone:0,ruin:0,specimens:0};let mode='candidate',specimens=false,decodedBytes=0,loadMs=0;
 const start=environment.performance.now();
 for(const f of manifest.files){const r=await environment.fetch(new URL(f.path,base));if(!r.ok)throw Error('Missing storybook '+f.id);const bytes=await r.arrayBuffer(),digest=Array.from(new Uint8Array(await environment.crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(digest!==f.sha256||bytes.byteLength!==f.bytes)throw Error('Storybook commitment mismatch '+f.id);
  const bitmap=await environment.createImageBitmap(new Blob([bytes],{type:'image/png'}));try{if(bitmap.width!==f.width||bitmap.height!==f.height)throw Error('Storybook source dimensions');
   const crop=(box,w,h)=>{const canvas=environment.document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(bitmap,...box,0,0,w,h);decodedBytes+=w*h*4;return prepareCelTexture(canvas);};
   if(f.id==='entrance')images.entrance=crop(f.crop,576,Math.round(576*f.crop[3]/f.crop[2]));
   else if(['modular','vertical'].includes(f.id)){for(const [id,p]of Object.entries(manifest.modules))if(p.sheet===f.id){const w=Math.ceil(p.crop[2]*p.scale*2.8),h=Math.round(w*p.crop[3]/p.crop[2]);modules[id]=crop(p.crop,w,h);}}
   else if(f.id==='grove')for(let i=0;i<6;i++){const box=manifest.floraSlots[i],w=i<3?270:256;flora[i]=crop(box,w,Math.round(w*box[3]/box[2]));}
   else for(let i=0;i<2;i++){const canvas=environment.document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d'),box=[i*887,0,887,887];for(let y=0;y<2;y++)for(let x=0;x<2;x++){c.save();c.translate(x?256:0,y?256:0);c.scale(x?-1:1,y?-1:1);c.drawImage(bitmap,...box,0,0,128,128);c.restore();}decodedBytes+=256*256*4;materials[i]=prepareCelTexture(canvas,{terrain:true});}
  }finally{bitmap.close();}
 }
 loadMs=environment.performance.now()-start;
 const scene=manifest.scene.bounds,standardScene=manifest.standardStructureReview.bounds,structureScenes=[standardScene,...(review.cryptReservations??[]).map(r=>({left:Number(r.parcel.tileX)-1024*32,top:Number(r.parcel.tileY)-1024*26,width:r.parcel.width,height:r.parcel.height})),...(review.ruinReservations??[]).filter(r=>r.socket.provenance.placementVersion==='planned-ruin-family-candidate-v2').map(r=>({left:Number(r.parcel.tileX)-1024*32,top:Number(r.parcel.tileY)-1024*26,width:r.parcel.width,height:r.parcel.height}))];
 const scenePoint=(space,x,y)=>{if(space.site||space.functionalSite||space.settlementInterior||!space.overworld)return false;const o=environmentWorldOffset(space),wx=(x+o.x-1048576)/32,wy=(y+o.y-851968)/32;return wx>=scene.left&&wy>=scene.top&&wx<scene.left+scene.width&&wy<scene.top+scene.height;};
 const structurePoint=(space,x,y)=>{if(!space.overworld||space.site||space.functionalSite||space.settlementInterior)return false;const o=environmentWorldOffset(space),wx=(x+o.x-1048576)/32,wy=(y+o.y-851968)/32;return structureScenes.some(b=>wx>=b.left&&wy>=b.top&&wx<b.left+b.width&&wy<b.top+b.height);};
 function texture(c,index,x,y,w,h,wx,wy){const a=materials[index];for(let yy=0;yy<h;){const sy=((wy+yy)%256+256)%256,hh=Math.min(h-yy,256-sy);for(let xx=0;xx<w;){const sx=((wx+xx)%256+256)%256,ww=Math.min(w-xx,256-sx);c.drawImage(a,sx,sy,ww,hh,x+xx,y+yy,ww,hh);xx+=ww;}yy+=hh;}}
 const active=()=>mode==='storybook';
 // Two immutable pilot-only material stamps. The small alpha mask is smoothly
 // sampled; no pixel readback, mask construction or image allocation per frame.
 const mask=environment.document.createElement('canvas');mask.width=Math.ceil(scene.width*32/16)+1;mask.height=Math.ceil(scene.height*32/16)+1;const mc=mask.getContext('2d'),md=mc.createImageData(mask.width,mask.height);
 for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){const i=(y*mask.width+x)*4;md.data[i]=md.data[i+1]=md.data[i+2]=255;md.data[i+3]=Math.round(255*ruinLandscapeBlendAt(scene,scene.left+x*scene.width/(mask.width-1),scene.top+y*scene.height/(mask.height-1)));}mc.putImageData(md,0,0);
 const blended=materials.map((_,i)=>{const a=environment.document.createElement('canvas');a.width=scene.width*32;a.height=scene.height*32;const c=a.getContext('2d');texture(c,i,0,0,a.width,a.height,scene.left*32+1048576,scene.top*32+851968);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0,a.width,a.height);decodedBytes+=a.width*a.height*4;return a;});mask.width=mask.height=1;
 function blendOrigin(space){const o=environmentWorldOffset(space);return {x:scene.left*32+1048576-o.x,y:scene.top*32+851968-o.y};}
 function blendGrass(c,space,bounds,at){c.save();c.beginPath();let any=false;for(let y=Math.floor(bounds.y/32)-1;y<=Math.ceil((bounds.y+bounds.height)/32);y++)for(let x=Math.floor(bounds.x/32)-1;x<=Math.ceil((bounds.x+bounds.width)/32);x++)if(scenePoint(space,x*32+16,y*32+16)&&at(x,y)==='g'){c.rect(x*32,y*32,32,32);any=true;}if(any){c.clip();const p=blendOrigin(space);c.drawImage(blended[0],p.x,p.y);draws.ground++;}c.restore();}
 function ground(c,space,bounds){prior.drawGround(c,space,bounds);if(!active())return;const v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0;blendGrass(c,space,bounds,(x,y)=>v.terrain[y-oy]?.[x-ox]);}
 function roadCell(c,x,y,at){const inset=at(x,y)==='p'?6:2,north=at(x,y-1)===at(x,y),east=at(x+1,y)===at(x,y),south=at(x,y+1)===at(x,y),west=at(x-1,y)===at(x,y),l=x*32+(west?-1:inset),r=x*32+(east?33:32-inset),t=y*32+(north?-1:inset),b=y*32+(south?33:32-inset),nw=!north&&!west?9:0,ne=!north&&!east?9:0,se=!south&&!east?9:0,sw=!south&&!west?9:0;c.moveTo(l+nw,t);c.lineTo(r-ne,t);c.quadraticCurveTo(r,t,r,t+ne);c.lineTo(r,b-se);c.quadraticCurveTo(r,b,r-se,b);c.lineTo(l+sw,b);c.quadraticCurveTo(l,b,l,b-sw);c.lineTo(l,t+nw);c.quadraticCurveTo(l,t,l+nw,t);c.closePath();}
 function roadPath(c,space,bounds,at){let any=false;for(let y=Math.floor(bounds.y/32)-1;y<=Math.ceil((bounds.y+bounds.height)/32);y++)for(let x=Math.floor(bounds.x/32)-1;x<=Math.ceil((bounds.x+bounds.width)/32);x++)if(scenePoint(space,x*32+16,y*32+16)&&['r','p'].includes(at(x,y))){any=true;roadCell(c,x,y,at);}return any;}
 function roadOverlay(c,space,bounds,at){prior.roadOverlay?.(c,space,bounds,at);if(!active())return;const o=environmentWorldOffset(space);
  // Replace old edge-color fillets within this scene before drawing the same
  // route silhouette. Water and surfaces outside the trial remain untouched.
  blendGrass(c,space,bounds,at);
  const p=blendOrigin(space);for(let y=Math.floor(bounds.y/32)-1;y<=Math.ceil((bounds.y+bounds.height)/32);y++)for(let x=Math.floor(bounds.x/32)-1;x<=Math.ceil((bounds.x+bounds.width)/32);x++)if(scenePoint(space,x*32+16,y*32+16)&&['r','p'].includes(at(x,y))){c.save();c.beginPath();c.rect(x*32,y*32,32,32);c.clip();c.beginPath();c.rect(x*32,y*32,32,32);roadCell(c,x,y,at);c.clip('evenodd');c.drawImage(blended[0],p.x,p.y);c.restore();}
  c.save();c.beginPath();if(roadPath(c,space,bounds,at)){c.clip();c.drawImage(blended[1],p.x,p.y);}c.restore();}
 function foliage(kind,c,space,x,y,size,n,biome){if(!active()||!scenePoint(space,x+size/2,y+size/2))return kind==='base'?prior.base(c,space,x,y,size,n,biome):prior[kind](c,space,x,y,size,n);if(kind==='tree'||kind==='base')return true;draws.stone++;const p=modules.foundation,w=size*1.05,h=w*p.height/p.width;c.drawImage(p,x+(size-w)/2,y+size*.85-h,w,h);return true;
 }
 const plantDraw=(c,d,t)=>{const variant=Number(d.kind.split('-').at(-1)),p=flora[variant],w=d.width,h=w*p.height/p.width,x=d.x*t,y=d.y*t;paintRuinContactShadow(c,x-w/2,y-w*.85,w,d.kind.includes('-tree-')?'tree':'base');c.drawImage(p,x-w/2,y-h*.94,w,h);draws.foliage++;};
 const moduleDraw=(c,d,t)=>{const id=d.kind.slice('ruin-module-'.length),p=manifest.modules[id],image=modules[id];if(!p||!image)throw Error('Unbound ruin module '+id);const x=d.x*t-p.origin[0]*p.scale+(p.visualOffset?.[0]??0),y=d.y*t-p.origin[1]*p.scale+(p.visualOffset?.[1]??0);c.drawImage(image,x,y,p.crop[2]*p.scale,p.crop[3]*p.scale);draws.ruin++;};
 const ruin={active,wall(c,space,b,tx,ty){if(!active())return false;if(structurePoint(space,tx*32+16,ty*32+16))return b.presentationPart==='entry-structure'||b.presentationPart==='modular-base';if(!scenePoint(space,tx*32+16,ty*32+16))return false;return b.presentationPart==='entry-structure'||b.presentationPart==='modular-base';},
  entrance(c,f,layer){if(!active()||![scene,...structureScenes].some(b=>f.worldX>=b.left&&f.worldX<b.left+b.width&&f.worldY>=b.top&&f.worldY<b.top+b.height))return false;if(layer==='rear'||layer==='ground'){const w=288,h=w*images.entrance.height/images.entrance.width;c.drawImage(images.entrance,f.x-w/2,f.y-140,w,h);draws.ruin++;}return true;},
  decoration(c,d,t){if(!active())return false;if(d.kind.startsWith('ruin-grove-')){plantDraw(c,d,t);return true;}if(d.kind.startsWith('ruin-module-')){moduleDraw(c,d,t);return true;}return false;},
  module(c,d,t){if(active())moduleDraw(c,d,t);},moduleAnchor(d,t){return d.y*t+(d.kind==='ruin-module-north-south'?96:d.kind==='ruin-module-broken-north-south'?64:0);}
 };
 function reviewDepthItems(model,viewport){if(!specimens||!model.space.overworld)return [];const o=environmentWorldOffset(model.space),origin={x:(scene.left+scene.width/2+.5)*32+1048576-o.x,y:(scene.top+scene.height/2+5)*32+851968-o.y};if(!scenePoint(model.space,origin.x,origin.y))return [];return ['sprout','golem','slime','gargoyle'].map((family,i)=>{const x=origin.x+(i-1.5)*52,y=origin.y;if(x<viewport.x-60||y<viewport.y-60||x>viewport.x+viewport.width+60||y>viewport.y+viewport.height+60)return null;return depthItem({id:'storybook-specimen/'+family,anchorX:x,anchorY:y,draw:c=>{drawCreatureD11(c,{alive:true,enemyFamily:family,position:{x,y},visualSeed:817+i,hp:{m:100,e:0},maxHp:{m:100,e:0},elite:null,statuses:[],presentationFacingX:1},model.tick,false);draws.specimens++;}});}).filter(Boolean);}
 async function setMode(value){if(!['existing','v1','candidate','storybook'].includes(value))throw Error('Unknown storybook comparison mode');await prior.setMode(value==='storybook'?'candidate':value);mode=value;}
 await setMode(initial);
 const treeShadow=(c,space,x,y,size,n)=>active()&&scenePoint(space,x+size/2,y+size/2);
 return Object.freeze({...prior,ruin,drawGround:ground,roadOverlay,tree:(...a)=>foliage('tree',...a),rock:(...a)=>foliage('rock',...a),base:(...a)=>foliage('base',...a),treeShadow,hasTree:(space,x,y,size,n)=>!active()||!scenePoint(space,x+size/2,y+size/2),setMode,mode:()=>mode,reviewDepthItems,setSpecimens:value=>{specimens=Boolean(value);},resources:()=>({...prior.resources(),storybook:{version:manifest.version,mode,scope:manifest.scope,draws:{...draws},decodedBytes,downloadBytes:manifest.files.reduce((n,f)=>n+f.bytes,0),imageCount:3+Object.keys(modules).length+flora.length+materials.length,loadMs,specimens,groveProof:'Stable cluster descriptors from the chunk generator; no viewport-dependent canopy selection.',blendBytes:blended.reduce((n,a)=>n+a.width*a.height*4,0)}})});
}
