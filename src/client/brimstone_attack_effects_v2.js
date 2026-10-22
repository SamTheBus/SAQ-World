import {BRIMSTONE_ID} from '../shared/content/brimstone_colossus_v1.js';

// A disposable renderer cache lets an observed eruption settle after its
// authoritative one-shot hazard retires. It never enters saves or targeting.
export function createBrimstoneEruptionPresentation(){
 const recent=new Map();let context=null,lastTick=-1;
 const clear=()=>{recent.clear();context=null;lastTick=-1;};
 function update(model){
  const tick=model.tick,key=[model.context?.campaignId,model.context?.sessionId,model.context?.spaceInstanceId??model.space?.spaceId,model.context?.spaceRevision,model.context?.residencyRevision].join('/');
  if(key!==context||tick<lastTick)recent.clear();context=key;lastTick=tick;
  const live=new Set(Object.values(model.entitiesById??{}).filter(a=>a.alive!==false&&a.boss?.bossDefinitionId===BRIMSTONE_ID).map(a=>a.boss.bossId));
  const current=model.bossHazards?.brimstoneVents??[],ids=new Set(current.map(v=>v.id));
  for(const v of current){
   const owner=[...live].find(id=>v.id.startsWith(id+':vent:'));if(!owner)continue;
   const before=recent.get(v.id),entry={vent:Object.freeze({...v,position:Object.freeze({...v.position}),arms:Object.freeze({...v.arms}),hitEntityIds:Object.freeze([...(v.hitEntityIds??[])])}),owner,confirmed:before?.confirmed===true||v.stage==='erupting'};
   recent.set(v.id,entry);
  }
  for(const[id,e]of recent)if(!live.has(e.owner)||tick>=e.vent.detonatesTick+60||!ids.has(id)&&(!e.confirmed||tick<e.vent.expiresTick))recent.delete(id);
  // At most the native six-vent budget per boss, and 24 across a malformed view.
  const counts=new Map();for(const[id,e]of [...recent].sort(([a,x],[b,y])=>y.vent.detonatesTick-x.vent.detonatesTick||(y.vent.sequence??0)-(x.vent.sequence??0)||b.localeCompare(a))){const n=counts.get(e.owner)??0;if(n>=6||!counts.has(e.owner)&&counts.size>=4)recent.delete(id);else counts.set(e.owner,n+1);}
  if(!current.length&&!recent.size)return model;
  const vents=current.map(v=>recent.has(v.id)?{...v,presentationUntilTick:v.detonatesTick+60,presentationOnly:false}:v);
  for(const[id,e]of recent)if(!ids.has(id)&&e.confirmed)vents.push({...e.vent,stage:'erupting',presentationUntilTick:e.vent.detonatesTick+60,presentationOnly:true});
  return Object.freeze({...model,bossHazards:Object.freeze({...model.bossHazards,brimstoneVents:Object.freeze(vents)})});
 }
 return Object.freeze({update,clear,inspect:()=>({retained:recent.size,lastTick})});
}
export function brimstoneEruptionEnvelope(v,tick,distance=0){
 const duration=(v.presentationUntilTick??v.expiresTick??v.detonatesTick+18)-v.detonatesTick,age=tick-v.detonatesTick;
 if(age<0||age>=duration)return {height:0,opacity:0,age,localAge:-1};
 const delay=clamp(distance/96)*Math.min(10,duration*.23),localAge=age-delay;
 if(localAge<=0)return {height:0,opacity:0,age,localAge};
 const rise=ease(localAge/Math.min(6,duration*.25));
 // The hot columns peak quickly, then collapse into falling debris and a
 // cooling seam. The extended tail is aftermath of the one-shot hit.
 const fall=1-ease((localAge-duration*.27)/(duration*.46));
 const fade=1-ease((age-duration*.57)/(duration*.43));
 return {height:rise*fall,opacity:fade,age,localAge};
}

const TAU=Math.PI*2,INK='#11141b',COAL='#292b37',STONE='#555561',RUST='#a04f35',LAVA='#f6662c',GOLD='#ffbd53',WHITE='#fff0b0';
const clamp=v=>Math.max(0,Math.min(1,v));
const lerp=(a,b,p)=>a+(b-a)*p,ease=p=>{p=clamp(p);return p*p*(3-2*p);};
const hash=s=>{let v=2166136261;for(const x of String(s))v=Math.imul(v^x.charCodeAt(0),16777619);return v>>>0;};
function polygon(c,pts,fill,stroke=INK,width=1.26){
 c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
}
function disc(c,x,y,r,fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function line(c,points,color,width){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
export function brimstoneAttackPose(b,tick){
 const action=b.pendingAction,ability=action?.ability,p=action?clamp((tick-action.startedTick)/Math.max(1,action.resolvesTick-action.startedTick)):0;
 const last=b.lastAction,age=last?tick-last.resolvedTick:999,side=Math.cos(b.facingAngle??Math.PI/2)>=0?1:-1,hands={};
 let drop=0,heat=0,strikeSide=0;
 if(ability==='slam'){
  const q=ease(p/.84);for(const s of[-1,1])hands[s]={x:s*lerp(36,55,q),y:lerp(-9,-104,q)};drop=-3*q;heat=.3+.7*q;
 }else if(last?.ability==='slam'&&age>=0&&age<30){
  const q=ease((age-7)/23);for(const s of[-1,1])hands[s]={x:s*lerp(40,34,q),y:lerp(-1,-8,q)};drop=(1-q)*6;heat=(1-q)*.7;
 }else if(ability==='strike'){
  strikeSide=side;const q=ease(p);hands[side]={x:side*lerp(34,49,q),y:lerp(-8,-57,q)};drop=-q;heat=q*.8;
 }else if(last?.ability==='strike'&&age>=0&&age<20){
  strikeSide=side;const q=ease((age-3)/17),angle=b.facingAngle??Math.PI/2;
  hands[side]={x:lerp(Math.cos(angle)*61,side*34,q),y:lerp(Math.sin(angle)*43-22,-8,q)};drop=2*(1-q);heat=(1-q)*.9;
 }else if(ability==='magma_vents'){
  const q=ease(p);for(const s of[-1,1])hands[s]={x:s*lerp(34,57,q),y:lerp(-8,-37,q)};drop=-q*2;heat=.2+.8*q;
 }
 return {hands,drop,heat,strikeSide,charge:p,ability};
}
export function brimstoneArmAngles(side,hand){
 const x=hand.x-side*28,y=hand.y+61,r=Math.hypot(x,y)||1,d=Math.max(5,Math.min(49,r));
 const bend=Math.acos(Math.max(-1,Math.min(1,(d*d+23*23-27*27)/(2*d*23))));
 const upper=Math.atan2(y,x)-Math.PI/2+side*bend;
 const ex=-Math.sin(upper)*23,ey=Math.cos(upper)*23,tx=x/r*d,ty=y/r*d;
 return {upper,lower:Math.atan2(ty-ey,tx-ex)-Math.PI/2-upper};
}
function circlePath(c,p,r){c.beginPath();c.arc(p.x,p.y,r,0,TAU);}
export function traceBrimstoneVent(c,v){
 const p=v.position,a=v.arms;c.beginPath();
 if(a.east+a.west>0)c.rect(p.x-a.west,p.y-12,a.east+a.west,24);
 if(a.north+a.south>0)c.rect(p.x-12,p.y-a.north,24,a.north+a.south);
}
function spokes(c,seed,r,progress){
 for(let i=0;i<7;i++){
  const angle=i*TAU/7+(seed%101)*.01,length=r*(.55+.38*Math.sin(i*3.7+seed)),j=Math.sin(i*2.1+seed)*.09;
  const pts=[[Math.cos(angle)*7,Math.sin(angle)*7],[Math.cos(angle+j)*length*.45,Math.sin(angle+j)*length*.45],[Math.cos(angle-j)*length*progress,Math.sin(angle-j)*length*progress]];
  line(c,pts,'#713c36',5);line(c,pts,LAVA,2.4);line(c,pts,progress>.8?GOLD:'#ee8140',.8);
  if(i%2===0){const m=pts[1];line(c,[m,[m[0]+Math.cos(angle+.8)*11,m[1]+Math.sin(angle+.8)*11]],LAVA,1.3);}
 }
}
function moltenTarget(c,p,r,progress,seed){
 c.save();c.translate(p.x,p.y);circlePath(c,{x:0,y:0},r);c.save();c.clip();
 disc(c,0,0,r,'#3a252842');disc(c,0,0,r*(.18+.72*progress),'#f7782420');
 for(let i=0;i<7;i++){const a=i*TAU/7+.15,inner=15+(i%3)*2,outer=r*(.65+(i%2)*.13);c.save();c.rotate(a);c.globalAlpha*=.12+progress*.16;polygon(c,[[inner,-3],[outer*.73,-outer*.3],[outer,-3],[outer*.87,outer*.22],[inner+7,5]],COAL,null);c.restore();}
 spokes(c,seed,r,.35+.65*progress);c.restore();
 // Full collision boundary stays visible throughout the warning.
 circlePath(c,{x:0,y:0},r);c.strokeStyle=INK;c.lineWidth=4;c.stroke();c.strokeStyle='#ed9a54';c.lineWidth=1.8;c.stroke();
 for(let i=0;i<8;i++){
  const a=i*TAU/8;c.save();c.rotate(a);
  polygon(c,[[r-9,-2],[r-1,-4],[r,0],[r-1,4],[r-9,2],[r-5,0]],progress>i/9?GOLD:RUST,INK,1);
  c.restore();
 }
 // A segmented furnace seal charges inwards instead of a clock hand.
 for(let i=0;i<12;i++){
  const a=i*TAU/12+.03;c.beginPath();c.arc(0,0,r-5,a,a+TAU/12-.13);c.strokeStyle=i/12<progress?GOLD:'#824e3f';c.lineWidth=2.2;c.stroke();
 }
 c.restore();
}
function ventMouthGround(c,p,q,tick){
 c.save();c.translate(p.x,p.y);
 polygon(c,[[-19,0],[-13,-10],[-2,-14],[11,-11],[20,-3],[18,7],[6,12],[-9,10]],'#2b242ac0',null);
 c.beginPath();c.ellipse(0,0,13,8,0,0,TAU);c.fillStyle='#a83e28';c.fill();c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();
 c.beginPath();c.ellipse(-1,-1,9+q*2,5+q,0,0,TAU);c.fillStyle=LAVA;c.fill();
 c.beginPath();c.ellipse(-2,-2,4+q*3,2.5+q,0,0,TAU);c.fillStyle=GOLD;c.fill();
 for(let i=0;i<5;i++){
  const a=i*TAU/5,x=Math.cos(a)*15,y=Math.sin(a)*9;
  polygon(c,[[x-4,y-3],[x+1,y-5],[x+6,y-1],[x+3,y+4],[x-3,y+3]],i%2?STONE:COAL,INK,1.1);
 }
 c.restore();
}
const armSpecs=v=>[['east',1,0],['west',-1,0],['north',0,-1],['south',0,1]].map(([key,x,y])=>({key,x,y,length:v.arms[key]}));
function ventFissure(c,v,q,erupt,tick){
 const since=tick-v.createdTick,reveal=ease(since/45),duration=(v.presentationUntilTick??v.expiresTick)-v.detonatesTick,age=tick-v.detonatesTick;
 const cooling=erupt?1-ease((age-duration*.24)/(duration*.6)):1;
 c.save();traceBrimstoneVent(c,v);c.clip();if(erupt)c.globalAlpha*=1-ease((age-(duration-18))/18);c.fillStyle=erupt?'#642d201a':'#c9642c'+(q>.78?'30':'16');c.fill();
 for(const a of armSpecs(v)){
  if(!a.length)continue;
  c.save();c.translate(v.position.x,v.position.y);c.rotate(Math.atan2(a.y,a.x));
  const seed=hash(v.id+a.key),path=[[0,0]],opened=a.length*(erupt?1:reveal);
  for(let d=8;d<opened;d+=10)path.push([d,Math.sin(d*.19+seed)*4]);path.push([opened,0]);
  line(c,path,'#1b1c27a8',18);line(c,path,erupt?'#64372f':'#8c4739',7+q*2);
  if(erupt){
   // The banks split apart as the upward burst reaches each section. Broken
   // stone and a narrow molten seam replace the old solid cross-shaped flash.
   for(let d=8;d<opened-4;d+=17){
    const e=brimstoneEruptionEnvelope(v,tick,d),y=Math.sin(d*.19+seed)*3.3,split=e.height*2.8;
    for(const side of[-1,1]){
     const y0=y+side*(4+split),y1=y+side*(8+split);
     polygon(c,[[d-5,y0],[d+2,y0-side],[d+6,y1-side],[d-2,y1]],side<0?'#554940':'#38353b',INK,.8);
    }
   }
   c.save();c.globalAlpha*=cooling;
   line(c,path,LAVA,3.5+cooling*3);line(c,path,GOLD,1+cooling*2.4);
   if(age<18){c.globalAlpha*=1-ease(age/18);line(c,path,WHITE,1.2);}
   c.restore();
  }else line(c,path,'#fa7239',1.4+q*2);
  for(let d=19;d<opened-4;d+=25){
   const sign=Math.sin(d+seed)>0?1:-1,y=Math.sin(d*.19+seed)*4;
   line(c,[[d,y],[d+4,sign*7],[d+11,sign*11]],erupt?(cooling>.5?GOLD:'#754935'):q>.8?GOLD:'#c47443',erupt?1.7:1);
  }
  // Warm, broken margins describe the real 24px strip without solid planks.
  if(!erupt)for(const side of[-1,1])for(let d=0;d<a.length;d+=19)line(c,[[d,side*11.5],[Math.min(a.length,d+10),side*11.5]],q>.78?'#ffd36e':'#9d6347',q>.78?1.3:.9);
  c.restore();
 }
 c.restore();
 if(!erupt)ventMouthGround(c,v.position,q,tick);
}
export function brimstoneSlams(model,tick){
 const rows=[],seen=new Set();
 const accept=s=>{if(!s||s.ability!=='slam'||tick<s.resolvedTick||tick-s.resolvedTick>=42)return;const k=s.resolvedTick+'/'+s.targetPosition.x+'/'+s.targetPosition.y;if(seen.has(k))return;seen.add(k);rows.push(s);};
 for(const s of model.bossHazards?.brimstoneImpacts??[])accept(s);
 for(const a of Object.values(model.entitiesById??{}))if(a.boss?.bossDefinitionId===BRIMSTONE_ID&&a.alive!==false)accept(a.boss.lastAction);
 return rows;
}
function slamGround(c,s,tick){
 const age=tick-s.resolvedTick,p=clamp(age/42),burst=clamp(age/10),fade=1-ease((age-15)/27),pos=s.targetPosition;
 c.save();c.translate(pos.x,pos.y);circlePath(c,{x:0,y:0},64);c.clip();c.globalAlpha=fade;
 polygon(c,Array.from({length:16},(_,i)=>{const a=i*TAU/16,r=54+(i%2?2:7);return[Math.cos(a)*r,Math.sin(a)*r];}),'#30242b9a',null);
 disc(c,0,0,55*(1-burst*.45),'#ff923b'+(age<4?'7a':'28'));spokes(c,17,62,1);
 c.globalAlpha=fade*(1-clamp(age/21));c.strokeStyle=GOLD;c.lineWidth=4*(1-burst)+1;
 c.beginPath();c.arc(0,0,12+52*Math.sin(burst*Math.PI*.5),0,TAU);c.stroke();
 c.restore();
}
export function drawBrimstoneAttackGround(c,model,tick){
 c.save();const h=model.bossHazards??{};
 for(const t of h.brimstoneTelegraphs??[]){
  const q=clamp((tick-t.startedTick)/Math.max(1,t.resolvesTick-t.startedTick));
  if(t.ability==='slam')moltenTarget(c,t.position,64,q,hash(t.bossId));
  else if(t.ability==='strike'){
   c.save();c.translate(t.position.x,t.position.y);c.rotate(t.angle);c.beginPath();c.moveTo(0,0);c.arc(0,0,52,-.95,.95);c.closePath();c.fillStyle='#f1703525';c.fill();
   c.strokeStyle='#da8549';c.lineWidth=1.4;c.stroke();for(let i=-1;i<=1;i++){c.save();c.rotate(i*.56);polygon(c,[[37,-1.8],[49,-3.6],[45,0],[49,3.6],[37,1.8],[41,0]],q>.55?GOLD:RUST,null);c.restore();}c.restore();
  }else for(const p of t.ventTargets)moltenTarget(c,p,18,q,hash(t.bossId));
 }
 for(const v of h.brimstoneVents??[])ventFissure(c,v,clamp((tick-v.createdTick)/270),v.stage==='erupting',tick);
 for(const s of brimstoneSlams(model,tick))slamGround(c,s,tick);
 c.restore();
}
function lavaJet(c,p,height,width,age,seed,opacity=1){
 if(height<1||opacity<=0)return;c.save();c.translate(p.x,p.y);c.globalAlpha*=opacity;
 const sway=Math.sin(age*.65+seed)*width*.17;
 c.beginPath();c.moveTo(-width*.68,0);c.bezierCurveTo(-width*1.1,-height*.19,-width*.27,-height*.37,-width*.73,-height*.68);c.quadraticCurveTo(-width*.17,-height*.58,-width*.22,-height*.43);c.bezierCurveTo(-width*.18,-height*.72,width*.2+sway,-height*.65,sway,-height);c.quadraticCurveTo(width*.87,-height*.75,width*.52,-height*.52);c.bezierCurveTo(width*.35,-height*.38,width*1.05,-height*.4,width*.86,-height*.2);c.lineTo(width*.68,0);c.closePath();c.fillStyle='#d73f29';c.fill();c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();
 c.beginPath();c.moveTo(-width*.5,-1);c.quadraticCurveTo(-width*.6,-height*.27,-width*.15,-height*.45);c.quadraticCurveTo(width*.1,-height*.58,sway*.7,-height*.77);c.bezierCurveTo(width*.55,-height*.57,width*.07,-height*.41,width*.43,-height*.19);c.lineTo(width*.5,-1);c.closePath();c.fillStyle=LAVA;c.fill();
 c.beginPath();c.moveTo(-width*.22,-1);c.quadraticCurveTo(-width*.3,-height*.22,sway*.5,-height*.55);c.quadraticCurveTo(width*.25,-height*.36,width*.23,-height*.2);c.lineTo(width*.25,-1);c.closePath();c.fillStyle=GOLD;c.fill();
 polygon(c,[[-width*.1,-1],[0,-height*.23],[width*.12,-1]],WHITE,null);
 c.restore();
}
function ember(c,p,seed,age,life=30){
 const q=clamp(age/life),a=seed*2.39996,x=p.x+Math.cos(a)*(7+q*25),y=p.y-Math.sin(q*Math.PI)*(17+seed%4*6)-q*8,r=1.5+seed%3*.25;
 c.save();c.globalAlpha*=Math.sin(q*Math.PI);polygon(c,[[x-r,y],[x,y-r*2],[x+r,y],[x,y+r]],seed%2?GOLD:LAVA,null);c.restore();
}
export function brimstoneEffectDepthItems(model,tick,viewport=null){
 const items=[],visible=p=>!viewport||(p.x>=viewport.x-40&&p.x<=viewport.x+viewport.width+40&&p.y>=viewport.y-24&&p.y<=viewport.y+viewport.height+95);
 const add=(id,p,draw)=>{if(visible(p))items.push(Object.freeze({id:'brimstone-vfx/'+id,anchorX:p.x,anchorY:p.y+2,draw}));};
 for(const v of model.bossHazards?.brimstoneVents??[]){
  const seed=hash(v.id);
  if(v.stage!=='erupting'){
   const q=clamp((tick-v.createdTick)/270);
   add(v.id+'/boil',v.position,c=>{c.save();lavaJet(c,{x:v.position.x,y:v.position.y-2},9+q*13,5+q*2,tick,seed);for(let i=0;i<3;i++)ember(c,v.position,i+seed%11,(tick+i*9)%32,32);c.restore();});
   continue;
  }
  const age=tick-v.detonatesTick,duration=(v.presentationUntilTick??v.expiresTick??v.detonatesTick+18)-v.detonatesTick;if(age<0||age>=duration)continue;
  const points=[{...v.position,ordinal:0,center:true}];let ordinal=1;
  for(const a of armSpecs(v))for(let d=22;d<=a.length-3;d+=29)points.push({x:v.position.x+a.x*d,y:v.position.y+a.y*d,ordinal:ordinal++,center:false});
  for(const p of points)add(v.id+'/jet/'+p.ordinal,p,c=>{
   const envelope=brimstoneEruptionEnvelope(v,tick,Math.hypot(p.x-v.position.x,p.y-v.position.y));
   c.save();if(envelope.localAge>=0&&envelope.height>0){
    const pulse=.92+Math.sin(envelope.localAge*.55+p.ordinal)*.08;
    lavaJet(c,p,(p.center?58:26+(seed+p.ordinal*7)%16)*envelope.height*pulse,p.center?17:8,envelope.localAge,seed+p.ordinal,envelope.opacity);
    const local=envelope.localAge;for(let i=0;i<(p.center?5:2);i++)ember(c,p,i+p.ordinal*3,local,Math.min(40,duration));
    if(local<24)for(let i=0;i<2;i++){const q=local/24,x=p.x+(i?1:-1)*(3+q*12),y=p.y-Math.sin(q*Math.PI)*15; c.save();c.globalAlpha*=1-ease((local-14)/10);polygon(c,[[x-3,y],[x-2,y-4],[x+3,y-2],[x+3,y+2]],COAL);c.restore();}
   }c.restore();
  });
 }
 for(const s of brimstoneSlams(model,tick)){
  const age=tick-s.resolvedTick,p=s.targetPosition,key='slam/'+s.resolvedTick+'/'+p.x+'/'+p.y;
  if(age<18)add(key+'/core',p,c=>lavaJet(c,p,(1-ease((age-5)/13))*58,22,age,3,1-clamp((age-12)/6)));
  if(age<30)for(let i=0;i<10;i++){
   const q=age/30,a=i*TAU/10+.2,r=9+q*(29+i%3*7),contact={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r},lift=Math.sin(q*Math.PI)*(29+i%3*9),size=(3+i%3*.8)*(1-q*.45);
   add(key+'/shard/'+i,contact,c=>{c.save();c.translate(contact.x,contact.y-lift);c.rotate(i*.8+q*(i%2?2:-2));c.globalAlpha*=1-ease((age-18)/12);polygon(c,[[-size,-size*.5],[0,-size],[size,size*.1],[size*.5,size],[-size*.7,size*.7]],COAL);polygon(c,[[-size,-size*.5],[0,-size],[size,size*.1],[-size*.2,0]],i%3?STONE:LAVA,null);c.restore();});
  }
 }
 for(const a of Object.values(model.entitiesById??{})){
  const b=a.boss;if(b?.bossDefinitionId!==BRIMSTONE_ID||a.alive===false)continue;
  const age=b.lastAction?tick-b.lastAction.resolvedTick:999;
  if(b.lastAction?.ability==='strike'&&age>=0&&age<9){
   const angle=b.facingAngle??Math.PI/2,p={x:a.position.x+Math.cos(angle)*48,y:a.position.y+Math.sin(angle)*43};
   add('strike/'+b.bossId+'/'+b.lastAction.resolvedTick,p,c=>{
    c.save();c.translate(p.x,p.y-20);c.rotate(angle);const q=age/9;c.globalAlpha*=1-q;
    c.beginPath();c.moveTo(-19,-10);c.quadraticCurveTo(9,-17,20,-1);c.quadraticCurveTo(5,5,-17,9);c.lineTo(-5,0);c.closePath();c.fillStyle=LAVA;c.fill();c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();
    line(c,[[-12,-4],[5,-3],[13,0]],GOLD,2.2);c.restore();
   });
  }
 }
 return Object.freeze(items);
}
