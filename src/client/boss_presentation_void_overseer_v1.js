// Void Overseer: the original levitating obsidian diamond and five watch eyes.
// Presentation observes native actions; no hit selection, authority or clocks.
import {presentCombat} from '../shared/contracts/combat_amount.js';

const ID='void_overseer',TAU=Math.PI*2,INK='#11151a';
const DARK='#10081c',STONE='#251334',LIGHT='#49305f',VIOLET='#9d58d0',PINK='#ed459b',PALE='#efd3ff';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,p)=>a+(b-a)*p;
const point=(x,y)=>({x,y});
function unit(x,y){const d=Math.hypot(x,y)||1;return point(x/d,y/d);}
function hash(value){let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
function ellipse(c,x,y,rx,ry,color,outline=false,width=1.26){c.beginPath();c.ellipse(x,y,Math.max(.001,rx),Math.max(.001,ry),0,0,TAU);c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=width;c.stroke();}}
function polygon(c,points,color,outline=true,width=1.26){c.beginPath();for(const[i,p]of points.entries())i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);c.closePath();c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=width;c.stroke();}}
function circle(c,x,y,r,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(.001,r),0,TAU);c.stroke();}
function localTarget(actor,record){const p=record?.targetPosition??point(actor.position.x,actor.position.y+60);return point(p.x-actor.position.x,p.y-actor.position.y);}
function castProgress(row,tick){return clamp((tick-row.startedTick)/Math.max(1,row.resolvesTick-row.startedTick));}

export function voidAttackPose(actor,tick){
 const b=actor.boss??{},alive=actor.alive!==false&&b.bossDefinitionId===ID;
 const pending=alive?b.pendingAction:null,last=alive?b.lastAction:null,age=last?tick-last.resolvedTick:Infinity;
 const recent=age>=0&&age<40?last:null,p=pending?castProgress(pending,tick):0;
 const record=pending??recent,aim=record?localTarget(actor,record):point(Math.cos(b.facingAngle??Math.PI/2)*60,Math.sin(b.facingAngle??Math.PI/2)*60);
 const origin=record?.originPosition??actor.position,target=record?.targetPosition??point(actor.position.x+aim.x,actor.position.y+aim.y),direction=unit(target.x-origin.x,target.y-origin.y);
 const hover=Math.sin((tick+(actor.visualSeed??0)*.13)/8.4)*4.2;
 const pose={ability:record?.ability??null,p,age,aim,direction,bodyX:0,bodyY:-43+hover,rotation:Math.sin(tick*.025)*.018,scaleX:1,scaleY:1,charge:0,drive:0,release:0};
 if(pending?.ability==='slam'){
  const coil=ease(p/.72),drive=ease((p-.78)/.22);
  pose.bodyX=-direction.x*4*coil+direction.x*7*drive;pose.bodyY+=-12*coil+17*drive;
  pose.rotation+=direction.x*(-.16*coil+.10*drive);pose.scaleX=1-.08*coil+.10*drive;pose.scaleY=1+.10*coil-.10*drive;
  pose.charge=coil;pose.drive=drive;
 }else if(recent?.ability==='slam'){
  const amount=1-ease(age/35);pose.bodyX=direction.x*3*amount;pose.bodyY+=5*amount;pose.rotation-=direction.x*.06*amount;pose.scaleX=1+.02*amount;pose.charge=amount;pose.drive=amount;pose.release=(1-ease(age/16));
 }else if(recent?.ability==='strike'&&age<26){
  const amount=1-ease(age/26),angle=Math.atan2(aim.y-17-pose.bodyY,aim.x),nearest=Math.round(angle/(Math.PI/2))*(Math.PI/2);
  pose.bodyX=direction.x*7*amount;pose.bodyY+=direction.y*6*amount;pose.rotation+=(angle-nearest)*amount;pose.scaleX=1+.045*amount;pose.charge=.45*amount;pose.drive=amount;
 }else if(pending?.ability==='singularity'){
  const coil=ease(p/.9);pose.bodyY-=8*coil;pose.scaleX=1-.06*coil;pose.scaleY=1+.08*coil;pose.rotation+=Math.sin(tick*.025)*.035*coil;pose.charge=coil;
 }else if(recent?.ability==='singularity'){
  const amount=1-ease(age/38),kick=Math.sin(Math.PI*clamp(age/14));pose.bodyY+=-8*amount+5*kick;pose.scaleX=1-.06*amount;pose.scaleY=1+.08*amount;pose.rotation+=Math.sin(tick*.025)*.035*amount;pose.charge=amount;pose.release=(1-ease(age/20));
 }
 return pose;
}

function eye(c,x,y,r,look,charge,flash){
 const glow=c.createRadialGradient(x,y,r*.25,x,y,r+3.2+charge*1.5);glow.addColorStop(0,flash?'#fff':'#ed459b80');glow.addColorStop(1,'#ed459b00');ellipse(c,x,y,r+3.2+charge*1.5,r+3.2+charge*1.5,glow);
 ellipse(c,x,y,r+1.1,r*1.13+1.1,DARK,true,1.05);
 ellipse(c,x,y,r,r*1.13,flash?'#fff':PINK);
 if(flash)return;
 ellipse(c,x-r*.19,y-r*.26,r*.49,r*.56,'#ff85c5');
 ellipse(c,x+look.x*r*.18,y+look.y*r*.14,r*.27,r*.72,DARK);
 ellipse(c,x-r*.28,y-r*.48,Math.max(.35,r*.10),Math.max(.45,r*.14),PALE);
}
function core(c,pose,flash){
 const sx=pose.scaleX,sy=pose.scaleY,shape=points=>points.map(([x,y])=>[x*sx,y*sy]);
 polygon(c,shape([[0,-33],[32,0],[4,37],[-28,3]]),flash?'#fff':DARK);
 polygon(c,shape([[0,-34],[29,0],[0,34],[-29,0]]),flash?'#fff':STONE);
 if(!flash){
  polygon(c,shape([[0,-34],[-4,-4],[-29,0]]),LIGHT,false);
  polygon(c,shape([[0,-34],[29,0],[22,-1],[0,-25]]),'#382047',false);
  polygon(c,shape([[-29,0],[-4,-4],[0,34]]),'#321b45',false);
  polygon(c,shape([[0,34],[29,0],[21,1],[0,25]]),'#0a0612',false);
  polygon(c,shape([[0,-25],[21,0],[0,25],[-21,0]]),'#190b29',false);
  c.strokeStyle='#785895';c.lineWidth=.85;c.beginPath();c.moveTo(-25*sx,-.5*sy);c.lineTo(-.5*sx,-29*sy);c.stroke();
  c.strokeStyle='#49325d';c.lineWidth=.75;c.beginPath();c.moveTo(2*sx,30*sy);c.lineTo(27*sx,1*sy);c.stroke();
 }
 const cos=Math.cos(pose.rotation),sin=Math.sin(pose.rotation),vx=pose.aim.x-pose.bodyX,vy=pose.aim.y-17-pose.bodyY;
 const look=unit(cos*vx+sin*vy,-sin*vx+cos*vy);
 for(const[x,y,r]of[[-10.5,-11.5,3.0],[10.5,-11.5,3.0],[-10.5,11.5,3.0],[10.5,11.5,3.0],[0,0,6.4]])eye(c,x*sx,y*sy,r,look,pose.charge,flash);
}
export function drawVoidOverseer(c,actor,tick,flash=false){
 if(actor.boss?.bossDefinitionId!==ID)return false;
 const pose=voidAttackPose(actor,tick),death=actor.alive===false?clamp((actor.deathAge??0)/36):0;
 c.save();c.translate(actor.position.x,actor.position.y);c.lineCap='round';c.lineJoin='round';c.globalAlpha*=1-death;
 ellipse(c,0,5,30,8,'#09061650');
 c.save();c.translate(pose.bodyX,pose.bodyY+death*14);c.rotate(pose.rotation);
 const r=43+pose.charge*5,aura=c.createRadialGradient(0,0,17,0,0,r);aura.addColorStop(0,'#a15cdb00');aura.addColorStop(.45,flash?'#e9c5ff66':'#a15cdb37');aura.addColorStop(1,'#a15cdb00');ellipse(c,0,0,r,r,aura);
 core(c,pose,flash);c.restore();c.restore();return true;
}

function boundary(c,p,r,progress,kind){
 c.save();c.translate(p.x,p.y);
 ellipse(c,0,0,r,r,kind==='singularity'?'#793bb714':'#b74dba12');
 circle(c,0,0,r,INK,2.65);circle(c,0,0,r,kind==='singularity'?'#ed68b6':'#cb8bf0',1.15);
 c.strokeStyle=kind==='singularity'?'#ffd1eb':'#eee0ff';c.lineWidth=1.45;c.beginPath();c.arc(0,0,r-3,-Math.PI/2,-Math.PI/2+TAU*progress);c.stroke();
 c.restore();
}
function inwardDust(c,p,tick,startedTick,seed,progress,collapseAge=null){
 const elapsed=tick-startedTick,opacityScale=c.globalAlpha;
 for(let i=0;i<28;i++){
  if(elapsed<i*2)continue;
  const q=((elapsed-i*2)%43)/43,dist=115+(seed+i*37)%70,a=(seed%31)*.21+i*2.39996+q*.32;
  const drawQ=collapseAge===null?q:mix(q,1,ease(collapseAge/14)),r=dist*(1-drawQ*drawQ),tailQ=Math.max(0,drawQ-.075),rt=dist*(1-tailQ*tailQ),opacity=Math.sin(q*Math.PI)*(.3+.35*progress)*(collapseAge===null?1:1-clamp(collapseAge/18));
  if(opacity<=0)continue;
  c.globalAlpha=opacityScale*opacity;c.strokeStyle=i%3===0?PALE:i%2?PINK:VIOLET;c.lineWidth=i%3===0?.8:1.05;
  c.beginPath();c.moveTo(p.x+Math.cos(a-.025)*rt,p.y+Math.sin(a-.025)*rt);c.lineTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);c.stroke();
 }
}
function accretion(c,p,progress,tick,collapse=0){
 const amount=1-ease(collapse),r=(22+39*ease(progress))*(1-.9*ease(collapse));
 c.save();c.translate(p.x,p.y);c.globalAlpha*=amount;
 for(const[i,angle]of[-tick*.012,tick*.009+.8].entries()){
  c.save();c.rotate(angle);c.strokeStyle=INK;c.lineWidth=3.0;c.beginPath();c.ellipse(0,0,r*(i?.78:1),r*(i?.23:.34),0,0,TAU);c.stroke();
  c.strokeStyle=i?'#8d7bdc':'#b869d7';c.lineWidth=1.6;c.stroke();c.strokeStyle=i?'#c8b7ff':'#ef9fdb';c.lineWidth=.85;c.beginPath();c.ellipse(0,0,r*(i?.78:1),r*(i?.23:.34),0,.1,1.65);c.stroke();c.restore();
 }
 const coreR=(5+20*ease(progress/.9))*(1-ease(collapse));
 ellipse(c,0,0,coreR+2,coreR+2,'#8f45b75c');ellipse(c,0,0,coreR,coreR,'#080510',true);circle(c,0,0,coreR+1,'#da62bd',1.05);
 c.restore();
}
function singularityGround(c,row,tick){
 const p=row.position??row.originPosition,progress=castProgress(row,tick),elapsed=tick-row.startedTick,seed=hash((row.bossId??row.sourceEntityId??ID)+'/'+row.sequence);
 c.save();boundary(c,p,row.radius??90,progress,'singularity');
 for(let i=0;i<3;i++){const q=((elapsed/53+i/3)%1+1)%1;c.globalAlpha=Math.sin(q*Math.PI)*(.14+.12*progress);circle(c,p.x,p.y,(row.radius??90)*(1-q),'#ad69d1',.85);}
 c.globalAlpha=1;accretion(c,p,progress,tick);inwardDust(c,p,tick,row.startedTick,seed,progress);c.restore();
}
function slamGround(c,row,tick){
 const age=tick-row.resolvedTick;if(age<0||age>=40)return;
 const p=row.targetPosition,q=clamp(age/40),r=row.radius??64;c.save();
 if(age<12){c.globalAlpha=1-ease(age/12);circle(c,p.x,p.y,r,INK,3);circle(c,p.x,p.y,r,'#dba3f8',1.2);}
 c.globalAlpha=(1-q)*.65;ellipse(c,p.x,p.y,17+ease(age/14)*35,9+ease(age/14)*19,'#6f3cae42');
 circle(c,p.x,p.y,11+ease(age/18)*(r-11),'#cc8bf1',1.25);c.restore();
}
function collapseGround(c,row,tick){
 const age=tick-row.resolvedTick;if(age<0||age>=40)return;
 const p=row.targetPosition??row.originPosition,r=row.radius??90,seed=hash((row.bossId??row.sourceEntityId??ID)+'/'+row.sequence);c.save();
 if(age<12){c.globalAlpha=1-ease(age/12);circle(c,p.x,p.y,r,INK,3);circle(c,p.x,p.y,r,'#ffd0ec',1.6);}
 if(age<18){c.globalAlpha=1-ease(age/18);const ring=r*(1-ease(age/15));circle(c,p.x,p.y,ring,'#ec72c1',1.8);}
 c.globalAlpha=1;accretion(c,p,1,tick,age/18);inwardDust(c,p,tick,row.resolvedTick-360,seed,1,age);c.restore();
}
export function drawVoidGround(c,model,tick){
 const h=model.bossHazards??{};c.save();
 for(const row of h.voidTelegraphs??[]){if(tick<row.startedTick||tick>row.resolvesTick)continue;if(row.ability==='singularity')singularityGround(c,row,tick);else if(row.ability==='slam')boundary(c,row.position??row.targetPosition,row.radius??64,castProgress(row,tick),'slam');}
 for(const row of h.voidImpacts??[])if(row.ability==='singularity')collapseGround(c,row,tick);else if(row.ability==='slam')slamGround(c,row,tick);
 c.restore();
}

function forceGeometry(row,tick,pending){
 if(pending){const p=castProgress(row,tick),gather=ease((p-.35)/.5),drop=ease((p-.82)/.18);return{visible:gather,y:-44*gather*(1-drop)-6*drop,height:20*gather*(1-.65*drop),width:(5+9*drop)*gather,alpha:gather,drop};}
 const age=tick-row.resolvedTick,q=clamp(age/40),rise=Math.sin(Math.PI*clamp(age/17));return{visible:age>=0&&age<40?1:0,y:-6*(1-ease(age/20)),height:(7+15*rise)*(1-ease(age/34)),width:(14+8*rise)*(1-ease(age/38)),alpha:1-ease(q),drop:1};
}
function slamForce(c,row,tick,pending,source){
 const g=forceGeometry(row,tick,pending);if(g.visible<=0||g.alpha<=0)return;
 const p=row.position??row.targetPosition;c.save();c.globalAlpha*=g.alpha;
 if(pending&&source){
  const pose=voidAttackPose(source,tick),from=point(source.position.x+pose.bodyX,source.position.y+pose.bodyY),alpha=.42*Math.sin(Math.PI*castProgress(row,tick));
  c.save();c.globalAlpha*=alpha;c.strokeStyle='#be7de5';c.lineWidth=.9;c.beginPath();c.moveTo(from.x,from.y);c.bezierCurveTo(from.x,from.y-24,p.x,p.y+g.y-44,p.x,p.y+g.y);c.stroke();c.restore();
 }
 c.translate(p.x,p.y+g.y);const w=g.width,h=g.height;
 polygon(c,[[0,-h],[w,0],[0,h],[-w,0]],'#28113e',true);
 polygon(c,[[0,-h],[-w,0],[0,h],[w*.18,0]],'#7d3cad',false);
 polygon(c,[[0,-h*.86],[w*.18,0],[0,h*.90],[-w*.22,0]],'#dda0f2',false);
 c.strokeStyle='#f4d6ff';c.lineWidth=.9;c.beginPath();c.moveTo(0,-h*.7);c.lineTo(0,h*.72);c.stroke();c.restore();
 if(!pending){
  const age=tick-row.resolvedTick;if(age<24){c.save();c.globalAlpha=1-ease(age/24);for(let i=0;i<7;i++){const a=i*TAU/7+hash(row.bossId)%7,d=age*(.75+(i%3)*.13),height=Math.max(0,age*1.8-age*age*.085);c.strokeStyle=i%2?PINK:VIOLET;c.lineWidth=1.1;c.beginPath();c.moveTo(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.6-height);c.lineTo(p.x+Math.cos(a)*Math.max(0,d-4),p.y+Math.sin(a)*Math.max(0,d-4)*.6-height-2);c.stroke();}c.restore();}
 }
}
function strikeGlint(c,row,tick){
 const age=tick-row.resolvedTick;if(age<0||age>=16)return;const p=row.targetPosition,amount=1-ease(age/16),d=unit(p.x-row.originPosition.x,p.y-row.originPosition.y);
 c.save();c.translate(p.x,p.y-17);c.rotate(Math.atan2(d.y,d.x));c.globalAlpha*=amount;
 for(const side of[-1,1]){c.strokeStyle=side<0?PINK:PALE;c.lineWidth=1.2;c.beginPath();c.moveTo(-4,side*2);c.lineTo(6+age*.35,side*(5+age*.16));c.stroke();}c.restore();
}
export function voidDepthItems(model,tick,viewport=null){
 const h=model.bossHazards??{},items=[];
 const visible=(p,r)=>!viewport||p.x+r>=(viewport.x??viewport.left??-Infinity)&&p.x-r<=(viewport.right??((viewport.x??0)+(viewport.width??Infinity)))&&p.y+r>=(viewport.y??viewport.top??-Infinity)&&p.y-r<=(viewport.bottom??((viewport.y??0)+(viewport.height??Infinity)));
 const add=(id,p,r,draw)=>{if(visible(p,r))items.push(Object.freeze({id:'void-vfx/'+id,anchorX:p.x,anchorY:p.y+1,draw}));};
 for(const row of h.voidTelegraphs??[])if(row.ability==='slam'&&tick>=row.startedTick&&tick<=row.resolvesTick){const p=row.position??row.targetPosition;add(row.id??row.bossId+'/pending',p,100,c=>slamForce(c,row,tick,true,model.entitiesById?.[row.sourceEntityId]));}
 for(const row of h.voidImpacts??[]){const age=tick-row.resolvedTick;if(age<0||age>=40)continue;const p=row.targetPosition;
  if(row.ability==='slam')add((row.id??row.bossId+'/'+row.sequence)+'/slam',p,100,c=>slamForce(c,row,tick,false));
  else if(row.ability==='strike')add((row.id??row.bossId+'/'+row.sequence)+'/strike',p,35,c=>strikeGlint(c,row,tick));
 }
 return items;
}
export function drawVoidBossHud(c,canvas,model){
 const a=Object.values(model.entitiesById??{}).find(a=>a.alive&&a.boss?.bossDefinitionId===ID);if(!a)return false;
 const b=a.boss,w=Math.min(480,canvas.width-24),x=(canvas.width-w)/2,y=10,hp=presentCombat(a.hp),max=Math.max(1,presentCombat(a.maxHp)),ratio=clamp(hp/max);
 c.save();c.fillStyle='#171022ee';c.strokeStyle='#a369cb';c.lineWidth=1.3;c.beginPath();c.roundRect(x,y,w,58,7);c.fill();c.stroke();
 c.fillStyle='#f3e5fc';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('VOID OVERSEER',canvas.width/2,y+17);
 c.fillStyle='#30203e';c.fillRect(x+12,y+24,w-24,8);c.fillStyle=PINK;c.fillRect(x+12,y+24,(w-24)*ratio,8);
 c.fillStyle=PALE;c.font='11px sans-serif';const labels={slam:'Void slam · leave the marked circle',singularity:'Gravity pull · keep moving out of the magenta ring'};
 c.fillText(labels[b.pendingAction?.ability]??'The Eye of the Void',canvas.width/2,y+47);c.restore();return true;
}