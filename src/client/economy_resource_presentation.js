import {drawDungeonProp} from './environment_motifs.js';
import {drawIronChest} from './iron_chest_art.js';
import {depthItem} from './world_depth_presentation.js';

const TAU=Math.PI*2,BOSS_REVEAL_TICKS=90;
const stableVisualSeed=id=>{let value=2166136261;for(let i=0;i<id.length;i++)value=Math.imul(value^id.charCodeAt(i),16777619);return value>>>0;};
function drawBossChestGroundD12_5B(ctx,x,y,age){const progress=Math.max(0,Math.min(1,age/BOSS_REVEAL_TICKS)),fade=1-progress;ctx.save();ctx.translate(x,y+8);ctx.globalAlpha=fade*.42;ctx.fillStyle='#6fb35a';ctx.beginPath();ctx.ellipse(0,0,32+progress*13,14+progress*5,0,0,TAU);ctx.fill();ctx.globalAlpha=fade*.56;ctx.strokeStyle='#e9bd58';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,22+progress*18,9+progress*8,0,-2.86,-1.56);ctx.ellipse(0,0,22+progress*18,9+progress*8,0,-1.22,-.18);ctx.ellipse(0,0,22+progress*18,9+progress*8,0,.24,1.14);ctx.ellipse(0,0,22+progress*18,9+progress*8,0,1.55,2.65);ctx.stroke();ctx.restore();}
function drawBossChestParticlesD12_5B(ctx,x,y,age,seed,front){const fade=Math.max(0,1-age/BOSS_REVEAL_TICKS);ctx.save();for(let i=0;i<14;i++){const delay=(i%5)*3,travel=Math.max(0,Math.min(1,(age-delay)/58));if(travel<=0)continue;const angle=i*2.399963+(seed%97)*.017,radius=8+travel*(24+(i%4)*4),px=x+Math.cos(angle)*radius,py=y+5+Math.sin(angle)*radius*.44-Math.sin(travel*Math.PI)*(10+i%3*4),isFront=py>=y+4;if(isFront!==front)continue;const alpha=fade*Math.sin(travel*Math.PI);if(alpha<=0)continue;ctx.globalAlpha=alpha;ctx.fillStyle=i%3?'#e9bd58':'#8ed46c';ctx.strokeStyle='#26351f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py-3);ctx.lineTo(px+2.5,py);ctx.lineTo(px,py+3);ctx.lineTo(px-2.5,py);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();}

export function createResourcePresentation(){
 let domain=null;const seen=new Map();
 function depthItems(model,time,viewport){
  const key=model.context.sessionId+'/'+model.context.spaceInstanceId;if(domain!==key){seen.clear();domain=key;}const visible=new Set(),items=[];
  for(const r of model.resources??[]){visible.add(r.sourceEntityId);let v=seen.get(r.sourceEntityId);if(!v){v={used:r.used,born:-Infinity};seen.set(r.sourceEntityId,v);}else if(r.used&&!v.used){v.used=true;v.born=time;}
   const x=r.position.x,y=r.position.y;if(x<viewport.x||x>viewport.x+viewport.width||y<viewport.y||y>viewport.y+viewport.height)continue;const age=time-v.born;
   const caveReward=r.kind==='chest'&&model.space.site?.siteKind==='woodland-cave',bossCompletion=r.bossCompletion?.kind==='arachnid-treant-completion'?r.bossCompletion:null,finaleCompletion=['small-cave-elite-pack-completion','large-cave-provisional-completion'].includes(r.finaleCompletion?.kind)?r.finaleCompletion:null,upgradedCompletion=bossCompletion??finaleCompletion,revealAge=bossCompletion?Math.max(0,model.tick-r.bossCompletion.clearTick):finaleCompletion?Math.max(0,model.tick-r.finaleCompletion.clearTick):Infinity,revealSeed=upgradedCompletion?stableVisualSeed(r.sourceEntityId):0;
   if(upgradedCompletion&&revealAge<BOSS_REVEAL_TICKS){items.push(depthItem({id:'resource/'+r.sourceEntityId+'/reveal-ground',anchorX:x,anchorY:y-20,draw:ctx=>drawBossChestGroundD12_5B(ctx,x,y,revealAge)}));items.push(depthItem({id:'resource/'+r.sourceEntityId+'/reveal-rear',anchorX:x,anchorY:y-4,draw:ctx=>drawBossChestParticlesD12_5B(ctx,x,y,revealAge,revealSeed,false)}));}
   const paint=ctx=>{if(r.kind==='chest'){ctx.save();if(upgradedCompletion){const entrance=Math.min(1,revealAge/20),scale=1.55*(.68+.32*entrance);ctx.globalAlpha=.35+.65*entrance;ctx.translate(x,y);ctx.scale(scale,scale);ctx.translate(-x,-y);}else if(caveReward){ctx.translate(x,y);ctx.scale(1.22,1.22);ctx.translate(-x,-y);}if(bossCompletion)drawIronChest(ctx,x,y,bossCompletion?model.tick*1000/60:time,r.used?Math.min(1,age/300):0);else drawIronChest(ctx,x,y,finaleCompletion?model.tick*1000/60:time,r.used?Math.min(1,age/300):0);ctx.restore();return;}
    if(!r.used){drawDungeonProp(ctx,{type:{pot:'clay_pot',urn:'ancient_urn',barrel:'wooden_barrel'}[r.art]},x-16,y-16,32);return;}
    if(age>4500)return;const palette=r.art==='barrel'?['#5c3a21','#9b6a3a','#334155']:r.art==='urn'?['#334155','#94a3b8','#d4af37']:['#d35400','#e67e22','#ba4a00'];ctx.save();
    for(let n=0;n<22;n++){const fly=n<16;if(fly&&age>600)continue;const progress=Math.min(age/1000,fly?.6:.5),angle=n*2.39996+r.ordinal,speed=fly?60+n%5*18:10+n%5*5,px=x+Math.cos(angle)*speed*progress,py=y+Math.sin(angle)*speed*progress-(fly?75*progress-140*progress*progress:0);ctx.globalAlpha=Math.max(0,1-age/(fly?600:4500));ctx.fillStyle=palette[n%3];ctx.beginPath();ctx.moveTo(px-2,py);ctx.lineTo(px+1,py-3);ctx.lineTo(px+3,py+1);ctx.closePath();ctx.fill();}ctx.restore();};
   items.push(depthItem({id:'resource/'+r.sourceEntityId,anchorX:x,anchorY:y+(bossCompletion?22:finaleCompletion?22:caveReward?18:14),draw:paint}));if(upgradedCompletion&&revealAge<BOSS_REVEAL_TICKS)items.push(depthItem({id:'resource/'+r.sourceEntityId+'/reveal-front',anchorX:x,anchorY:y+28,draw:ctx=>drawBossChestParticlesD12_5B(ctx,x,y,revealAge,revealSeed,true)}));
  }
  for(const id of seen.keys())if(!visible.has(id))seen.delete(id);return items;
 }
 return Object.freeze({depthItems,draw(ctx,model,time,viewport){for(const item of depthItems(model,time,viewport))item.draw(ctx);},clear(){seen.clear();}});
}
