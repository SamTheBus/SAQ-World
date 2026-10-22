import {floorLightField} from './interior_light_field.js';
import {createInteriorLightClips} from './interior_light_clips.js';
import {terrainHash} from './environment_motifs.js';
import {depthItem} from './world_depth_presentation.js';
export const LIGHT_LIMITS=Object.freeze({descriptors:64,pages:4,staticVisible:24,dynamicVisible:8,embers:16,stamps:4});
const authoredSite=space=>space.site??space.functionalSite??null;
export const lightingProfile=space=>authoredSite(space)?'interior':space.settlementSafe?'settlement':'overworld';
export function lightMotion(light,time){const phase=light.phase;return light.kind==='torch'||light.kind==='campfire'? .94+.10*Math.sin(time*.009+phase)+.06*Math.cos(time*.0137+phase*2.1):.94+.04*Math.sin(time*light.frequency+phase)+.02*Math.cos(time*light.frequency*1.37+phase*2.1);}
export function describeLights(space){const lights=[],t=space.collision.tileSize;
 const add=(id,x,y,radius,kind,alpha=1)=>{if(lights.length>=LIGHT_LIMITS.descriptors)return;const n=terrainHash(Math.round(x),Math.round(y),317);lights.push(Object.freeze({id,x,y,radius,kind,color:kind==='window'?'#ffd37a':kind==='mushroom'?'#79e0bd':kind==='shaft'?'#d4e7bd':'#ff9d32',intensity:kind==='window'?.22:.42,alpha,dynamic:!['window','shaft'].includes(kind),phase:n%6283/1000,frequency:.003+(n%9)*.00019}));};
 const site=authoredSite(space);
 if(site){
  if(site.siteKind==='woodland-cave')for(const d of space.visual.decorations??[]){if(d.kind==='cave-glow-mushrooms'){const v=d.variant??0,sign=v%2?-1:1;add('mushroom/'+d.x+'/'+d.y+'/core',d.x*t,d.y*t-7,86+v*7,'mushroom',.72);add('mushroom/'+d.x+'/'+d.y+'/edge',d.x*t+sign*(19+v*3),d.y*t+5,61+v*5,'mushroom',.38);}else if(d.kind==='cave-light-shaft'){add('shaft/'+d.x+'/'+d.y+'/broad',d.x*t,d.y*t-12,172,'shaft',.5);add('shaft/'+d.x+'/'+d.y+'/mouth',d.x*t-13,d.y*t+28,105,'shaft',.32);}}
  else {for(const d of space.visual.decorations??[]){if(d.kind==='sconce')add('torch/'+d.x+'/'+d.y,d.x*t,d.y*t+6,190,'torch');else if(site.siteKind==='woodland-ruin'&&d.kind==='ruin-light-shaft')add('ruin-shaft/'+d.x+'/'+d.y,d.x*t,d.y*t+28,178,'shaft',.45);else if(site.siteKind==='woodland-ruin'&&d.kind==='ruin-weapon-shrine')add('ruin-shrine/'+d.x+'/'+d.y,d.x*t,d.y*t-10,76,'mushroom',.18);}
  // Source sconces remain in place. Add at most four presentation fixtures on
  // exposed side walls of narrow passages, using the existing floor grid only.
  const rows=space.visual.terrain,floor=(x,y)=>rows[y]?.[x]==='1',candidates=[];
  for(let y=1;y<rows.length-1;y++)for(let x=1;x<rows[y].length-1;x++){
   if(!floor(x,y))continue;
   let width=1;for(let i=1;i<=3&&floor(x-i,y);i++)width++;for(let i=1;i<=3&&floor(x+i,y);i++)width++;
   if(width>3||!floor(x,y-1)||!floor(x,y+1))continue;
   for(const side of [-1,1])if(rows[y]?.[x+side]==='0')candidates.push({x:(x+(side<0?0:1))*t-side*2,y:y*t+t/2,side});
  }
  let added=0;while(added<4&&lights.length<8){let best=null,distance=200;
   for(const p of candidates){const d=Math.min(...lights.map(l=>Math.hypot(l.x-p.x,l.y-p.y)));if(d>distance){best=p;distance=d;}}
   if(!best)break;add('passage/'+best.x+'/'+best.y,best.x,best.y,190,'torch');added++;
  }
  }
 }
 else {for(const d of space.visual.decorations??[])if(d.kind==='fort-fire')add('campfire/'+d.x+'/'+d.y,d.x*t,d.y*t,154,'campfire');
 for(const b of space.visual.blockers){if(b.kind!=='building')continue;const x=b.x*t,y=b.y*t,w=b.width*t,h=b.height*t;
  add('window/'+b.x+'/'+b.y+'/left',x+21,y+h*.67+7,49,'window');add('window/'+b.x+'/'+b.y+'/right',x+w-21,y+h*.67+7,49,'window');
  add('lantern/'+b.x+'/'+b.y,x+w*.42-8,y+h*.72+2,62,'lantern');
 }}
 return Object.freeze(lights);
}
export function drawFlameFixture(ctx,light,time,withEmbers=true){
 const x=light.x,y=light.y,motion=lightMotion(light,time),flick=(motion-.94)*17,camp=light.kind==='campfire';
 if(!camp){ctx.fillStyle='#0f172a';ctx.fillRect(x-3,y-1,6,8);ctx.fillStyle='#657079';ctx.fillRect(x-1,y,2,7);ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.strokeRect(x-3,y-1,6,8);}
 const base=camp?y+5:y-2,scale=camp?2.2:1;
 ctx.fillStyle='#ff3300';ctx.beginPath();ctx.moveTo(x-4*scale,base);ctx.quadraticCurveTo(x-5*scale+flick,base-10*scale,x,base-14*scale-flick);ctx.quadraticCurveTo(x+5*scale-flick,base-10*scale,x+4*scale,base);ctx.closePath();ctx.fill();
 ctx.fillStyle='#ffd700';ctx.beginPath();ctx.moveTo(x-2.5*scale,base-1);ctx.quadraticCurveTo(x-2*scale+flick,base-8*scale,x,base-11*scale);ctx.quadraticCurveTo(x+2*scale-flick,base-8*scale,x+2.5*scale,base-1);ctx.closePath();ctx.fill();ctx.fillStyle='#fff3bd';ctx.beginPath();ctx.arc(x,base-5*scale,1.5*scale,0,Math.PI*2);ctx.fill();
 if(withEmbers)for(let i=0;i<(camp?3:2);i++){const phase=(time/1200+light.phase+i*.31)%1;ctx.globalAlpha=(1-phase)*.68;ctx.fillStyle=i%2?'#ff5500':'#ffd700';ctx.fillRect(x+Math.sin(phase*4+light.phase+i)*4*scale,base-7-phase*17*scale,1.5,1.5);}ctx.globalAlpha=1;
}
export function createLighting(canvas){
 const pages=new Map(),stamps=new Map(),torchStamps=new Map(),clips=createInteriorLightClips();let fieldKey=null,fieldBuilds=0,maxFieldNodes=0,maxFieldSamples=0,worstStaticBuildMs=0,worstPlayerLightMs=0;let playerLights=0,considered=0,rendered=0,statics=0,embers=0,builds=0,descriptorBuilds=0,worstDescriptorMs=0,profile='overworld';
 // Fixed-size sprite construction occurs once, not at camera-region transitions.
 for(const [kind,inner,outer] of [['window','#ffd37a80','#ffac3828'],['torch','#ffd48490','#ff702022'],['lantern','#ffd77e90','#ff9d302b'],['mushroom','#79e0bd86','#3e8d7930'],['shaft','#d4e7bd78','#9cbd8622'],['player','#fff1cf80','#eacba31a']]){
  const c=canvas.ownerDocument.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gradient=g.createRadialGradient(64,64,1,64,64,64);gradient.addColorStop(0,inner);gradient.addColorStop(.4,outer);gradient.addColorStop(1,'#ff9d3000');g.fillStyle=gradient;g.fillRect(0,0,128,128);stamps.set(kind,c);builds++;
 }
 function clear(){pages.clear();clips.clear();torchStamps.clear();fieldKey=null;}
 function interiorTorch(space,light){const site=authoredSite(space);
  if(fieldKey!==site.contentHash){torchStamps.clear();fieldKey=site.contentHash;}
  const key=site.contentHash+'/'+light.id;let stamp=torchStamps.get(key);if(stamp)return stamp;
  const at=performance.now(),field=floorLightField(space,light),radius=240;fieldBuilds++;maxFieldNodes=Math.max(maxFieldNodes,field.evaluated);maxFieldSamples=Math.max(maxFieldSamples,field.reached);
  stamp=canvas.ownerDocument.createElement('canvas');stamp.width=stamp.height=256;const g=stamp.getContext('2d');g.scale(256/(radius*2),256/(radius*2));g.translate(radius-light.x,radius-light.y);
  const coarse=canvas.ownerDocument.createElement('canvas');coarse.width=coarse.height=field.side;const c=coarse.getContext('2d'),mask=new Path2D();
  for(let i=0;i<field.values.length;i++){const distance=field.values[i];if(!Number.isFinite(distance))continue;const x=i%field.side,y=Math.floor(i/field.side),px=field.x0+x*field.step,py=field.y0+y*field.step;
   c.globalAlpha=.36*Math.pow(1-distance/field.reach,1.25);c.fillStyle='#dfbf87';c.fillRect(x,y,1,1);mask.rect(px,py,field.step,field.step);
   // Only the immediate solid face adjacent to reached floor catches reflection.
   // Never paint across the wall tile or onto floor behind it.
   g.fillStyle='#dfbf87';g.globalAlpha=c.globalAlpha*.28;
   if(!field.floor(px-1,py+8))g.fillRect(px-2,py,2,16);if(!field.floor(px+16,py+8))g.fillRect(px+16,py,2,16);
   if(!field.floor(px+8,py-1))g.fillRect(px,py-2,16,2);if(!field.floor(px+8,py+16))g.fillRect(px,py+16,16,2);
  }
  g.globalAlpha=1;g.save();g.clip(mask);g.imageSmoothingEnabled=true;g.drawImage(coarse,field.x0,field.y0,field.side*16,field.side*16);g.restore();
  const core=88,path=clips.pathFor(space,{...light,radius:104});g.save();g.clip(path);g.drawImage(stamps.get('torch'),light.x-core,light.y-core,core*2,core*2);g.restore();
  torchStamps.set(key,stamp);worstStaticBuildMs=Math.max(worstStaticBuildMs,performance.now()-at);return stamp;
 }
 function lightsFor(space){let lights=pages.get(space.visual);if(!lights){const at=performance.now();lights=describeLights(space);descriptorBuilds++;worstDescriptorMs=Math.max(worstDescriptorMs,performance.now()-at);pages.set(space.visual,lights);while(pages.size>LIGHT_LIMITS.pages)pages.delete(pages.keys().next().value);}return lights;}
 function draw(ctx,space,view,time,player=null){profile=lightingProfile(space);const lights=lightsFor(space),site=authoredSite(space);
  playerLights=considered=rendered=statics=embers=0;ctx.save();
  // Only the interior floor receives ambient depth. Actors, drops and UI render
  // afterwards at full clarity. No overworld tint or gameplay visibility mask.
  if(profile==='interior'){ctx.fillStyle='#07101b50';ctx.fillRect(view.x,view.y,view.width,view.height);}
  for(const light of lights){const extent=site?240:light.radius;if(light.x+extent<view.x||light.y+extent<view.y||light.x-extent>view.x+view.width||light.y-extent>view.y+view.height)continue;
   if(statics>=LIGHT_LIMITS.staticVisible)break;statics++;
   const visibleDynamic=light.dynamic&&light.x>=view.x-16&&light.y>=view.y-16&&light.x<=view.x+view.width+16&&light.y<=view.y+view.height+16;
   if(visibleDynamic)considered++;const animate=visibleDynamic&&rendered<LIGHT_LIMITS.dynamicVisible;
   const motion=animate?lightMotion(light,time):.94,r=light.radius*((light.kind==='torch'||light.kind==='campfire')?1+(motion-.94)*.28:1),stampKind=light.kind==='campfire'?'torch':light.kind;
   ctx.save();ctx.globalAlpha=(profile==='interior'?.85:.62)*(light.kind==='torch'?motion:1)*(light.alpha??1);
   if(site&&light.kind==='torch'){ctx.drawImage(interiorTorch(space,light),light.x-240,light.y-240,480,480);}
   else{if(site)ctx.clip(clips.pathFor(space,{...light,radius:208}));ctx.drawImage(stamps.get(stampKind),light.x-r,light.y-r,r*2,r*2);
    if(animate){ctx.globalAlpha=.18*motion;ctx.drawImage(stamps.get(stampKind),light.x-r*.6,light.y-r*.6,r*1.2,r*1.2);}}ctx.restore();
   if(!animate)continue;rendered++;
   const x=light.x,y=light.y;
   if(light.kind==='lantern'){
    // Dungeon dungeon_map.js brass lantern: gold rim, black outline, white core.
    ctx.strokeStyle='#1a141c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(x,y+3,3.5,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff1c0';ctx.beginPath();ctx.arc(x,y+3,1.2*motion,0,Math.PI*2);ctx.fill();
   }else{embers+=2;}
  }
  if(profile==='interior'&&player?.alive){const at=performance.now(),light={id:'local-player',x:player.position.x,y:player.position.y-5,radius:56};ctx.save();ctx.clip(clips.pathFor(space,light,true));ctx.globalAlpha=.32;ctx.drawImage(stamps.get('player'),light.x-56,light.y-56,112,112);ctx.restore();playerLights=1;worstPlayerLightMs=Math.max(worstPlayerLightMs,performance.now()-at);}
  ctx.restore();
 }
 function fixtures(space,view,time){const result=[];for(const light of lightsFor(space)){if(!['torch','campfire'].includes(light.kind))continue;if(light.x<view.x-48||light.y<view.y-64||light.x>view.x+view.width+48||light.y>view.y+view.height+48)continue;if(result.length>=LIGHT_LIMITS.dynamicVisible)break;result.push(depthItem({id:'light-fixture/'+light.id,anchorX:light.x,anchorY:light.y+(light.kind==='campfire'?12:18),draw:ctx=>drawFlameFixture(ctx,light,time,true)}));}return result;}
 function ground(ctx,actor){ctx.save();ctx.fillStyle='#07101938';ctx.beginPath();ctx.ellipse(actor.position.x,actor.position.y+7,Math.max(7,actor.hullRadius??12),4.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 return Object.freeze({draw,fixtures,ground,clear,resources:()=>({lightingProfile:profile,lightFeatherStamps:torchStamps.size,lightFeatherBytes:torchStamps.size*256*256*4,lightFieldBuilds:fieldBuilds,lightFieldStep:16,lightMaxFieldNodes:maxFieldNodes,lightMaxFieldSamples:maxFieldSamples,lightWorstStaticBuildMs:worstStaticBuildMs,lightWorstPlayerLightMs:worstPlayerLightMs,playerLightsRendered:playerLights,...clips.resources(),lightDescriptorPages:pages.size,lightDescriptors:[...pages.values()].reduce((n,p)=>n+p.length,0),lightStampBuilds:builds,lightDescriptorBuilds:descriptorBuilds,lightWorstDescriptorMs:worstDescriptorMs,lightStampBytes:4*128*128*4,staticLightsRendered:statics,dynamicLightsConsidered:considered,dynamicLightsRendered:rendered,lightEmbers:embers})});
}
