// Corrosive-only presentation. Capsule footprints, shed records and minion
// stages come from the review authority; this module never creates combat.
import {CREATURE_PAINTERS_D11} from './creature_presentation_d11.js';
import {creaturePresentationForRenderV3} from './creature_presentation_profiles_v3.js';
import {hostileMeleePose} from './hostile_melee_presentation.js';
import {presentCombat} from '../shared/contracts/combat_amount.js';

const TAU=Math.PI*2,INK='#11151a',BASE='#369a63',LIGHT='#75c988',DARK='#216b4c',DEEP='#143e30';
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,p)=>a+(b-a)*p;
const point=(x,y)=>({x,y});
const unit=(x,y)=>{const d=Math.hypot(x,y)||1;return point(x/d,y/d);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hash=s=>{let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;};
function ellipse(c,x,y,rx,ry,color,outline=false){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();}}
function fill(c,color,outline=false){c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=1.26;c.lineJoin='round';c.stroke();}}

// A single combined fill is the union of the *actual* live capsules. Individual
// discs are never outlined, and paths separated by the controller stay apart.
function capsule(c,a,b,r){
 const angle=Math.atan2(b.y-a.y,b.x-a.x),nx=-Math.sin(angle)*r,ny=Math.cos(angle)*r;
 c.moveTo(a.x+nx,a.y+ny);c.lineTo(b.x+nx,b.y+ny);
 c.arc(b.x,b.y,r,angle+Math.PI/2,angle-Math.PI/2,true);
 c.lineTo(a.x-nx,a.y-ny);c.arc(a.x,a.y,r,angle-Math.PI/2,angle+Math.PI/2,true);c.closePath();
}
function footprint(c,rows){c.beginPath();for(const r of rows)capsule(c,r.from,r.to,r.radius);}
function sampleChain(rows){
 const points=[];let length=0;
 for(const row of rows){
  const d=distance(row.from,row.to),steps=Math.max(1,Math.ceil(d/7));
  if(!points.length)points.push({...row.from,s:0,r:row.radius,expiresTick:row.expiresTick});
  for(let i=1;i<=steps;i++)points.push({x:mix(row.from.x,row.to.x,i/steps),y:mix(row.from.y,row.to.y,i/steps),s:length+d*i/steps,r:row.radius,expiresTick:row.expiresTick});
  length+=d;
 }
 for(let i=0;i<points.length;i++){
  const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],u=unit(b.x-a.x,b.y-a.y);
  points[i].nx=-u.y;points[i].ny=u.x;
 }
 return points;
}
function bankPath(c,points,width,offset,seed){
 if(points.length<2)return;
 const edge=(p,side)=>{
  // Slow, broad banks, stable in world coordinates; no bead-shaped deposits.
  const irregular=.88+.075*Math.sin(p.x*.065+p.y*.049+seed)+.045*Math.sin(p.x*.14-p.y*.08);
  const w=p.r*width*irregular,shift=p.r*offset;
  return point(p.x+p.nx*(shift+side*w),p.y+p.ny*(shift+side*w));
 };
 const left=points.map(p=>edge(p,1)),right=points.map(p=>edge(p,-1));
 c.beginPath();c.moveTo(left[0].x,left[0].y);
 for(let i=1;i<left.length;i++)c.lineTo(left[i].x,left[i].y);
 const end=points.at(-1),u=unit(end.x-points.at(-2).x,end.y-points.at(-2).y),tip=point(end.x+u.x*end.r*.7,end.y+u.y*end.r*.7);
 c.quadraticCurveTo(tip.x,tip.y,right.at(-1).x,right.at(-1).y);
 for(let i=right.length-2;i>=0;i--)c.lineTo(right[i].x,right[i].y);
 const start=points[0],v=unit(points[1].x-start.x,points[1].y-start.y);
 c.quadraticCurveTo(start.x-v.x*start.r*.7,start.y-v.y*start.r*.7,left[0].x,left[0].y);c.closePath();
}
function chains(rows){
 const result=[],previous=new Map();
 for(const row of [...rows].sort((a,b)=>a.createdTick-b.createdTick||String(a.id).localeCompare(String(b.id)))){
  const key=String(row.chainId??row.sourceEntityId)+'/'+row.kind;
  const old=previous.get(key);
  if(old&&distance(old.at(-1).to,row.from)<.01)old.push(row);
  else{const list=[row];result.push(list);previous.set(key,list);}
 }
 return result;
}
function ageGradient(c,chain,tick,rgb,minimum,maximum,span=90){
 const first=chain[0],last=chain.find(r=>r.expiresTick-tick>=span)??chain.at(-1),a=first.from,b=last.to;
 const alpha=row=>mix(minimum,maximum,ease((row.expiresTick-tick)/span));
 if(distance(a,b)<.1)return `rgba(${rgb},${alpha(last)})`;
 const gradient=c.createLinearGradient(a.x,a.y,b.x,b.y);gradient.addColorStop(0,`rgba(${rgb},${alpha(first)})`);gradient.addColorStop(1,`rgba(${rgb},${alpha(last)})`);return gradient;
}
export function drawCorrosiveTrails(c,rows,tick){
 const live=rows.flatMap(block=>(block.segments??[]).map(segment=>({...segment,id:block.id+'/'+segment.sequence,sourceEntityId:block.sourceEntityId,kind:block.kind,radius:block.radius}))).filter(r=>r.createdTick<=tick&&r.expiresTick>tick&&r.from&&r.to&&r.radius>0);
 for(const chain of chains(live)){
  const slag=chain[0].kind==='slag',points=sampleChain(chain),seed=hash(chain[0].chainId??chain[0].sourceEntityId)%97;
  if(points.length<2)continue;
  c.save();footprint(c,chain);c.clip();
  // The entire harmful footprint remains legible; only the wet surface dries.
  // One continuous age wash avoids the circular overlap rings that alpha
  // compositing a sequence of separately fading capsules would create.
  footprint(c,chain);fill(c,ageGradient(c,chain,tick,slag?'77,56,46':'38,60,38',.16,.48));
  footprint(c,chain);fill(c,ageGradient(c,chain,tick,slag?'121,80,45':'63,96,50',.07,1));
  {
   c.save();
   bankPath(c,points,.96,-.045,seed);fill(c,ageGradient(c,chain,tick,slag?'151,102,46':'84,126,60',0,1));
   bankPath(c,points,.48,-.12,seed+2);fill(c,ageGradient(c,chain,tick,slag?'184,137,64':'114,154,73',0,.65));
   c.strokeStyle=ageGradient(c,chain,tick,slag?'205,161,92':'164,195,118',0,.58);c.lineWidth=.68;c.lineCap='round';
   // A few long flow lines read flat even when the path curls or overlaps.
   for(const offset of[-.34,.23]){
    let open=false,streak=-1;c.beginPath();
    for(const p of points){
     const period=offset<0?46:61,start=p.s+seed*2+(offset<0?0:23),run=Math.floor(start/period),on=(start%period)<(offset<0?29:18);
     if(!on){open=false;continue;}
     const w=p.r*(offset+.045*Math.sin(p.s*.085+seed)),x=p.x+p.nx*w,y=p.y+p.ny*w;
     if(!open||streak!==run){c.moveTo(x,y);open=true;streak=run;}else c.lineTo(x,y);
    }c.stroke();
   }
   // Tiny surface blisters, not raised drops or repeated round pools.
   c.globalAlpha*=.58;
   for(let i=4;i<points.length;i+=19){const p=points[i];if(p.expiresTick-tick<72)continue;const pulse=.75+.15*Math.sin(tick*.06+i),w=p.r*.45;ellipse(c,p.x+p.nx*w,p.y+p.ny*w,.72*pulse,.48*pulse,slag?'#e8b970':'#c9e399');}
   c.restore();
  }
  c.restore();
 }
}

// The approved native body painter is reused without changing any generic mob.
// This adapter only supplies Corrosive's actor DTO and the shared world ink.
function approvedMinion(c,row,tick,{scaleX=1,scaleY=1,alpha=1,flash=false}={}){
 const family=row.enemyFamily,profile=creaturePresentationForRenderV3(family),frame=profile?.painterFrame,painter=CREATURE_PAINTERS_D11[family];
 if(!profile||!painter)return;
 const melee=typeof row.meleePhase==='object'?row.meleePhase:null,span=Math.max(1,(melee?.phaseEndsTick??tick)-(melee?.phaseStartedTick??tick));
 const attack=hostileMeleePose({...row,alive:true,meleePhase:melee},tick),seed=(row.visualSeed??hash(row.id))>>>0;
 const m={x:frame.x,y:frame.y,w:frame.width,h:frame.height,flashTimer:flash?1:0,movedLastTick:!!row.movedLastTick,meleePhase:melee,phaseProgress:melee?clamp((tick-melee.phaseStartedTick)/span):0,meleeAction:!!attack,familyAttack:attack,deathProgress:0,presentationTick:tick,motionBlend:row.movedLastTick?1:0,stepPhase:tick*.66+(seed%17)*.13,paletteKey:profile.paletteKey};
 c.save();c.translate(row.position.x,row.position.y);c.globalAlpha*=alpha;
 c.scale(scaleX,scaleY);
 if(attack){c.translate(attack.body.x,attack.body.y);if(attack.bodyPivot)c.translate(attack.bodyPivot.x,attack.bodyPivot.y);c.rotate(attack.body.rotation);c.scale(attack.body.scaleX,attack.body.scaleY);if(attack.bodyPivot)c.translate(-attack.bodyPivot.x,-attack.bodyPivot.y);}
 c.scale((row.presentationFacingX??(Math.cos(row.facingAngle??0)<0?-1:1))===-1?-1:1,1);c.translate(profile.drawOffset.x,profile.drawOffset.y);c.scale(profile.visualScale,profile.visualScale);c.lineJoin='round';c.lineCap='round';c.strokeStyle=INK;c.lineWidth=1.26/profile.visualScale;
 painter(c,m,tick*1000/60,seed);c.restore();
}

const shedRows=actor=>actor.boss?.recentRuptures??(actor.boss?.lastRupture?[actor.boss.lastRupture]:[]);
const visibleShed=(row,tick)=>row.createdTick<=tick&&tick-row.createdTick<40&&(row.spawnedMinionIds?.length??row.chunkCount)>0;
const tearOffset=row=>row.bodyOriginPosition?point(row.originPosition.x-row.bodyOriginPosition.x,row.originPosition.y-row.bodyOriginPosition.y):point(row.direction.x*26,row.direction.y*26);
export function applyCorrosiveRupturePose(actor,tick,pose){
 if(actor.alive===false)return pose;
 const row=shedRows(actor).filter(r=>visibleShed(r,tick)).sort((a,b)=>b.createdTick-a.createdTick||b.damageSequence-a.damageSequence)[0];
 if(!row)return pose;
 const age=tick-row.createdTick,d=row.direction,kick=(1-ease(age/23))*(1+Math.min(2,(row.spawnedMinionIds?.length??row.chunkCount)-1)*.12);
 return {...pose,bodyX:pose.bodyX-d.x*4.8*kick,bodyY:pose.bodyY-d.y*2.8*kick+1.1*kick,top:pose.top+2.2*kick,width:pose.width*(1-.025*kick)};
}
export function drawCorrosiveBodyRuptures(c,actor,tick){
 for(const row of shedRows(actor).filter(r=>visibleShed(r,tick)).slice(-3)){
  const age=tick-row.createdTick,open=1-ease((age-5)/23),d=row.direction;if(open<=0||d.y<-.65)continue;
  const count=row.spawnedMinionIds?.length??row.chunkCount,w=5+Math.min(3,count)*1.1;
  const local=tearOffset(row);c.save();c.translate(local.x,local.y-33);c.rotate(Math.atan2(d.y,d.x));c.globalAlpha*=Math.min(1,open*2.4);
  // A dark parted fold and its two wet lips are attached to the actual body.
  // It closes as the remaining mass flows back into the bite-shaped seam.
  c.beginPath();c.moveTo(-3*open,-w);c.quadraticCurveTo(5*open,-w*.63,3.5*open,0);c.quadraticCurveTo(4*open,w*.52,-2*open,w);c.quadraticCurveTo(-7*open,w*.22,-3*open,-w);c.closePath();fill(c,DEEP,true);
  c.beginPath();c.moveTo(-3*open,-w);c.quadraticCurveTo(-7*open,-w*.2,-2*open,w);c.quadraticCurveTo(-4*open,w*.1,-1*open,-w*.7);c.closePath();fill(c,LIGHT);
  c.beginPath();c.moveTo(2*open,-w*.7);c.quadraticCurveTo(7*open,-w*.25,3*open,1);c.quadraticCurveTo(4*open,w*.6,1*open,w*.8);c.strokeStyle='#a1d893';c.lineWidth=.8;c.stroke();c.restore();
 }
}

function minionPose(row,tick){
 const air=clamp((tick-row.spawnedTick)/Math.max(1,row.landsTick-row.spawnedTick));
 const landing=clamp((tick-row.landsTick)/Math.max(1,row.activatesTick-row.landsTick));
 // Only vertical displacement is invented by the painter. Ground motion,
 // fan direction, safe landing and activation are all authoritative values.
 const height=(1-air)*33+4*air*(1-air)*(31+(row.volleyOrdinal??0)*2.5);
 const launch=unit(row.landingPosition.x-row.originPosition.x,row.landingPosition.y-row.originPosition.y);
 return {air,landing,height,launch,age:tick-row.spawnedTick,terminalAge:row.stage==='dissolving'?tick-(row.retireTick-24):null};
}
function splatPath(c,r,seed){
 c.beginPath();for(let i=0;i<=16;i++){const a=i/16*TAU,w=1+.11*Math.sin(i*2.7+seed)+.06*Math.sin(i*1.8),x=Math.cos(a)*r*w,y=Math.sin(a)*r*.42*w;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();
}
export function drawCorrosiveMinionGround(c,rows,tick){
 for(const row of rows){
  const pose=minionPose(row,tick),slag=row.enemyFamily==='slag_slime';if(pose.age<0)continue;
  c.save();c.translate(row.position.x,row.position.y);
  if(row.stage==='airborne')ellipse(c,0,2,8-pose.height*.025,2.7-pose.height*.008,'#121b1750');
  else if(row.stage==='coalescing'){
   const q=pose.landing,r=15-5*ease(q);c.globalAlpha*=1-ease((q-.55)/.45);
   splatPath(c,r,hash(row.id));fill(c,slag?'#b86b31':'#419e55',true);
   splatPath(c,r*.72,hash(row.id));fill(c,slag?'#eba245':'#91d67b');
   for(let i=0;i<4;i++){const a=i*1.7+hash(row.id)%5,d=14+q*11;c.strokeStyle=slag?'#d98d3c':'#a6dc86';c.lineWidth=.9;c.beginPath();c.moveTo(Math.cos(a)*d,Math.sin(a)*d*.45);c.lineTo(Math.cos(a)*(d+3*(1-q)),Math.sin(a)*(d+3*(1-q))*.45);c.stroke();}
  }else if(row.stage==='active')ellipse(c,0,2,11,3,'#0a0e0f33');
  else if(row.stage==='dissolving'){
   const q=clamp(pose.terminalAge/24);c.globalAlpha*=1-q;splatPath(c,12+q*5,hash(row.id));fill(c,slag?'#7a4c30':'#386e42');
  }
  c.restore();
 }
}
function strand(c,root,tip,amount){
 if(amount<=0)return;
 const d=unit(tip.x-root.x,tip.y-root.y),n=point(-d.y,d.x),w=3.8*amount,thin=.8*amount,m=point(mix(root.x,tip.x,.55),mix(root.y,tip.y,.55)+5*amount);
 c.beginPath();c.moveTo(root.x+n.x*w,root.y+n.y*w);c.quadraticCurveTo(m.x+n.x*w*.4,m.y+n.y*w*.4,tip.x+n.x*thin,tip.y+n.y*thin);c.lineTo(tip.x-n.x*thin,tip.y-n.y*thin);c.quadraticCurveTo(m.x-n.x*w*.4,m.y-n.y*w*.4,root.x-n.x*w,root.y-n.y*w);c.closePath();fill(c,BASE,true);
 c.strokeStyle=LIGHT;c.lineWidth=.8*amount;c.beginPath();c.moveTo(root.x-n.x*w*.4,root.y-n.y*w*.4);c.quadraticCurveTo(m.x,m.y,tip.x,tip.y);c.stroke();
}
function chunk(c,row,pose){
 const slag=row.enemyFamily==='slag_slime',q=pose.air,w=7.5+Math.sin(q*Math.PI)*1.3,h=6.7+Math.sin(q*Math.PI)*1.5;
 c.save();c.translate(row.position.x,row.position.y-pose.height);c.rotate(Math.atan2(pose.launch.y,pose.launch.x)*.35+Math.sin(q*Math.PI)*.6*((row.volleyOrdinal??0)%2?-1:1));
 c.beginPath();c.moveTo(-w,-h*.2);c.bezierCurveTo(-w*1.2,-h*.8,-w*.2,-h*1.2,w*.3,-h*.9);c.quadraticCurveTo(w*1.2,-h*.6,w*.9,h*.25);c.quadraticCurveTo(w*.6,h*1.1,-w*.25,h*.85);c.quadraticCurveTo(-w*.95,h*.6,-w,-h*.2);c.closePath();fill(c,slag?'#a97e46':BASE,true);
 c.beginPath();c.moveTo(-w*.8,-h*.25);c.quadraticCurveTo(-w*.65,-h*.95,w*.2,-h*.8);c.quadraticCurveTo(w*.05,-h*.3,-w*.35,h*.1);c.closePath();fill(c,slag?'#d6ab62':LIGHT);
 if(slag){c.beginPath();c.moveTo(-w*.4,h*.2);c.lineTo(w*.2,-h*.15);c.lineTo(w*.7,h*.1);c.lineTo(w*.35,h*.65);c.closePath();fill(c,'#644633');}
 c.restore();
}
function minionBody(c,row,tick,model,bodyPoseForActor){
 const pose=minionPose(row,tick);if(pose.age<0)return;
 if(row.stage==='airborne'){
  const event=(model.bossHazards?.corrosiveSheds??[]).find(s=>s.spawnedMinionIds.includes(row.id));
  if(event&&pose.age<8){
   const boss=model.entitiesById?.[row.sourceEntityId]??Object.values(model.entitiesById??{}).find(a=>a.boss?.bossId===row.bossId),local=tearOffset(event),body=boss&&bodyPoseForActor?bodyPoseForActor(boss,tick):{bodyX:0,bodyY:0};
   const root=boss?point(boss.position.x+local.x+body.bodyX,boss.position.y+local.y-33+body.bodyY):point(event.originPosition.x,event.originPosition.y-33);
   strand(c,root,point(row.position.x,row.position.y-pose.height),1-ease((pose.age-3)/5));
  }
  chunk(c,row,pose);return;
 }
 if(row.stage==='coalescing'){
  const q=ease(pose.landing),rise=ease((pose.landing-.10)/.90);
  approvedMinion(c,row,tick,{scaleX:1.38-.38*q,scaleY:.22+.78*rise,alpha:.18+.82*ease(pose.landing/.6)});return;
 }
 if(row.stage==='active'){
  const flash=Number.isFinite(row.lastDamagedTick)&&tick-row.lastDamagedTick>=0&&tick-row.lastDamagedTick<4;
  approvedMinion(c,row,tick,{flash});
  const profile=creaturePresentationForRenderV3(row.enemyFamily),max=Math.max(1,presentCombat(row.maxHp)),ratio=clamp(presentCombat(row.hp)/max),width=Math.max(18,Math.min(34,profile.visualBounds.width*.68)),y=row.position.y+profile.labels.healthBarY;
  c.save();c.fillStyle=INK;c.fillRect(row.position.x-width/2,y,width,3);c.fillStyle=row.enemyFamily==='slag_slime'?'#f5b85b':'#b4e484';c.fillRect(row.position.x-width/2+.6,y+.6,(width-1.2)*ratio,1.8);c.restore();return;
 }
 if(row.stage==='dissolving'){
  const q=clamp(pose.terminalAge/24);if(q>=1)return;
  if(row.retireTick-24<row.landsTick){
   // A chunk destroyed in flight remains a falling broken chunk. It never
   // turns into a complete ground slime just because its HP reached zero.
   const atHit=minionPose(row,row.retireTick-24),height=atHit.height*(1-ease(q));
   c.save();c.globalAlpha*=1-ease(q);chunk(c,row,{...atHit,height});
   for(let i=0;i<3;i++){const a=i*2.4+hash(row.id)%8,d=4+q*14;ellipse(c,row.position.x+Math.cos(a)*d,row.position.y-height+Math.sin(a)*d*.6,1.8*(1-q)+.2,1.4*(1-q)+.2,row.enemyFamily==='slag_slime'?'#d78a41':LIGHT);}
   c.restore();return;
  }
  const formed=minionPose(row,row.retireTick-24).landing,startX=1.38-.38*ease(formed),startY=.22+.78*ease((formed-.10)/.90);
  approvedMinion(c,row,tick,{scaleX:startX+q*.22,scaleY:startY*(1-q*.82),alpha:1-ease(q)});
  c.save();c.globalAlpha*=1-q;
  for(let i=0;i<3;i++){const a=i*2.4+hash(row.id)%8,d=5+q*11;ellipse(c,row.position.x+Math.cos(a)*d,row.position.y+Math.sin(a)*d*.5-q*4,1.2*(1-q)+.3,.9*(1-q)+.2,row.enemyFamily==='slag_slime'?'#d78a41':LIGHT);}
  c.restore();
 }
}
export function corrosiveSheddingDepthItems(model,tick,viewport,bodyPoseForActor){
 const items=[];
 for(const row of model.bossHazards?.corrosiveMinions??[]){
  const p=row.position,r=row.stage==='airborne'?86:42;if(viewport&&(p.x<viewport.x-r||p.x>viewport.x+viewport.width+r||p.y<viewport.y-r||p.y>viewport.y+viewport.height+r))continue;
  items.push(Object.freeze({id:'corrosive-minion/'+row.id,anchorX:p.x,anchorY:p.y+4.5,draw:c=>minionBody(c,row,tick,model,bodyPoseForActor)}));
 }
 return items;
}