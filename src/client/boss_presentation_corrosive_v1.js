// Corrosive Abomination: the original four-eyed alchemical sludge identity.
// All motion observes projected combat. Paint never chooses hits or mutates DTOs.
import {presentCombat} from '../shared/contracts/combat_amount.js';
import {applyCorrosiveRupturePose,drawCorrosiveBodyRuptures,drawCorrosiveTrails,drawCorrosiveMinionGround,corrosiveSheddingDepthItems} from './boss_presentation_corrosive_shedding_v2.js';

const ID='corrosive_abomination',TAU=Math.PI*2;
const INK='#11151a',BASE='#369a63',LIGHT='#75c988',DARK='#216b4c',DEEP='#143e30';
const ACID='#b5e976',MINT='#dbf8b5',WET='#b3e9ae';
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,p)=>a+(b-a)*p;
const point=(x,y)=>({x,y});
const lerp=(a,b,p)=>point(mix(a.x,b.x,p),mix(a.y,b.y,p));
function hash(value){let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
function unit(x,y){const d=Math.hypot(x,y)||1;return point(x/d,y/d);}
function ellipse(c,x,y,rx,ry,fill,outline=true,line=1.26){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=fill;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=line;c.stroke();}}
function fill(c,color,outline=true,line=1.26){c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=line;c.lineJoin='round';c.stroke();}}
function localTarget(actor,record,height=0){const p=record?.targetPosition??actor.position;return point(p.x-actor.position.x,p.y-actor.position.y-height);}

// This pure pose is exported for focused geometry/timing checks. Immediate
// strikes begin at their actual resolved tick; only major casts have a warning.
export function corrosiveAttackPose(actor,tick){
 const b=actor.boss??{},pending=b.pendingAction,last=b.lastAction;
 const active=actor.alive!==false&&b.bossDefinitionId===ID;
 const p=active&&pending?clamp((tick-pending.startedTick)/Math.max(1,pending.resolvesTick-pending.startedTick)):0;
 const age=last?tick-last.resolvedTick:Infinity;
 const recent=active&&age>=0&&age<40?last:null;
 const aim=pending?localTarget(actor,pending):recent?localTarget(actor,recent):point(Math.cos(b.facingAngle??1.57)*40,Math.sin(b.facingAngle??1.57)*40);
 const committed=pending??recent,origin=committed?.originPosition??actor.position;
 const committedDirection=committed?.targetPosition?point(committed.targetPosition.x-origin.x,committed.targetPosition.y-origin.y):aim;
 const direction=unit(committedDirection.x,committedDirection.y),side=committedDirection.x<0?-1:1;
 const idle=Math.sin((tick+(actor.visualSeed??0)*.7)*.045);
 const moving=actor.movedLastTick===true,hop=moving?Math.sin(tick*TAU/30):0;
 const motion=unit(actor.movementIntent?.x??direction.x,actor.movementIntent?.y??direction.y);
 const pose={ability:pending?.ability??recent?.ability??null,p,age,side,aim,direction,bodyX:moving?-motion.x*(1.1+Math.abs(hop)*1.4):0,bodyY:idle*1.5+Math.abs(hop)*1.8,top:idle*1.2-Math.abs(hop)*2,width:1+Math.abs(hop)*.025,pressure:b.phase===2?.32:0,armAmount:0,tip:null,slamWeight:0};
 if(!active)return pose;
 if(pending?.ability==='slam'){
  const coil=ease(p/.65),drive=ease((p-.80)/.20);
  pose.bodyX=-direction.x*4*coil+direction.x*7*drive;
  pose.bodyY=3*coil+5*drive;
  pose.top=-9*coil+15*drive;pose.width=1+.035*coil+.06*drive;
  pose.armAmount=coil;pose.slamWeight=drive;pose.pressure+=coil*.32;
  const ready=point(side*49,-104),contact=localTarget(actor,pending,2);
  pose.tip=lerp(ready,contact,drive);
 }else if(recent?.ability==='slam'){
  const recover=ease((age-3)/32),amount=1-recover;
  pose.bodyX=direction.x*7*amount;pose.bodyY=8*amount;
  pose.top=6*amount;pose.width=1+.095*amount;
  pose.armAmount=amount;pose.slamWeight=amount;
  pose.tip=localTarget(actor,recent,2);pose.pressure+=amount*.22;
 }else if(recent?.ability==='strike'&&age<26){
  const amount=1-ease(age/26);
  pose.armAmount=amount;pose.bodyX=direction.x*3*amount;pose.bodyY=direction.y*2*amount;
  pose.tip=localTarget(actor,recent,17);pose.top=-2*amount;
 }else if(pending?.ability==='spore_storm'){
  const swell=ease(p);
  pose.width=1+swell*.10;pose.top=-10*swell;pose.bodyY=-3*swell;
  pose.pressure+=swell*.65;pose.armAmount=swell*.45;
 }else if(recent?.ability==='spore_storm'){
  const amount=1-ease(age/30);pose.width=1+.10*amount;pose.top=-10*amount;pose.bodyY=-3*amount;pose.pressure+=.45*amount;pose.armAmount=.45*amount;
 }
 return applyCorrosiveRupturePose(actor,tick,pose);
}

function bodyPath(c,pose){
 const w=pose.width,t=pose.top;
 c.beginPath();c.moveTo(-23*w,-63+t*.6);
 c.bezierCurveTo(-29*w,-84+t,-13*w,-92+t,1,-88+t);
 c.bezierCurveTo(23*w,-91+t,29*w,-71+t*.6,28*w,-53+t*.3);
 c.bezierCurveTo(31*w,-35,41*w,-19,31*w,-4);
 c.quadraticCurveTo(22*w,7,10*w,4);c.quadraticCurveTo(0,10,-13*w,4);
 c.quadraticCurveTo(-28*w,8,-33*w,-5);c.bezierCurveTo(-38*w,-24,-23*w,-42,-23*w,-63+t*.6);c.closePath();
}
function ribbon(c,root,c1,c2,tip,width,flash=false){
 const start=unit(c1.x-root.x,c1.y-root.y),end=unit(tip.x-c2.x,tip.y-c2.y);
 const n=point(-start.y,start.x),e=point(-end.y,end.x),endW=width*.09;
 const path=()=>{c.beginPath();c.moveTo(root.x+n.x*width,root.y+n.y*width);c.bezierCurveTo(c1.x+n.x*width*.8,c1.y+n.y*width*.8,c2.x+e.x*width*.65,c2.y+e.y*width*.65,tip.x+e.x*endW,tip.y+e.y*endW);c.quadraticCurveTo(tip.x+end.x*.8,tip.y+end.y*.8,tip.x-e.x*endW,tip.y-e.y*endW);c.bezierCurveTo(c2.x-e.x*width*.6,c2.y-e.y*width*.6,c1.x-n.x*width*.8,c1.y-n.y*width*.8,root.x-n.x*width,root.y-n.y*width);c.closePath();};
 path();fill(c,flash?'#fff':BASE);
 if(!flash){c.save();path();c.clip();c.beginPath();c.moveTo(root.x+n.x*width*.3,root.y+n.y*width*.3);c.bezierCurveTo(c1.x+n.x*width*.45,c1.y+n.y*width*.45,c2.x+e.x*width*.4,c2.y+e.y*width*.4,tip.x,tip.y);c.bezierCurveTo(c2.x,c2.y,c1.x,c1.y,root.x,root.y);c.closePath();fill(c,LIGHT,false);c.restore();}
 path();c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();
}
function arm(c,side,pose,tick,flash){
 const sway=Math.sin(tick*.045+side*1.4)*3;
 const root=point(side*23+pose.bodyX,-39+pose.bodyY);
 const rest=point(side*(67+sway*.45),-28+sway+pose.bodyY);
 const targeted=pose.tip&&side===pose.side;
 let tip=targeted?lerp(rest,pose.tip,pose.armAmount):rest;
 let c1=point(side*38+pose.bodyX,-60+sway+pose.bodyY),c2=point(side*60,-48+sway+pose.bodyY);
 if(targeted){
  const quick=pose.ability==='strike',d=unit(tip.x-root.x,tip.y-root.y);
  const bend1=quick?point(mix(root.x,tip.x,.33)+side*9,mix(root.y,tip.y,.33)-4):point(root.x+side*22,root.y-42-pose.slamWeight*10);
  const bend2=quick?point(tip.x-d.x*9+side*3,tip.y-d.y*9):point(tip.x-side*(14+Math.min(16,Math.abs(tip.x-root.x)*.12)),tip.y-19-pose.slamWeight*14);
  c1=lerp(c1,bend1,pose.armAmount);c2=lerp(c2,bend2,pose.armAmount);
 }else if(pose.ability==='slam'&&pose.armAmount>0){
  tip=lerp(rest,point(side*57,-76),pose.armAmount*.8);c1.y-=pose.armAmount*22;c2.y-=pose.armAmount*30;
 }else if(pose.ability==='spore_storm'){
  tip.y-=pose.armAmount*21;c1.y-=pose.armAmount*15;c2.y-=pose.armAmount*21;
 }
 ribbon(c,root,c1,c2,tip,targeted?5.7:4.5,flash);
 if(targeted&&pose.ability==='slam'&&pose.slamWeight>.28){
  // A broad, sagging lobe carries the slam's weight into the real target.
  // Its volume grows continuously with the final drive, never blinking on.
  const s=ease((pose.slamWeight-.28)/.60),x=v=>tip.x+v*s,y=v=>tip.y+v*s;
  c.beginPath();c.moveTo(x(-13),y(3));c.bezierCurveTo(x(-17),y(-2),x(-13),y(-14),x(-6),y(-17));c.quadraticCurveTo(x(4),y(-20),x(12),y(-10));c.bezierCurveTo(x(17),y(-3),x(14),y(3),x(4),y(5));c.quadraticCurveTo(x(-6),y(8),x(-13),y(3));c.closePath();fill(c,flash?'#fff':BASE);
  if(!flash){c.beginPath();c.moveTo(x(-11),y(-5));c.quadraticCurveTo(x(-12),y(-14),x(-4),y(-16));c.quadraticCurveTo(x(3),y(-17),x(6),y(-12));c.quadraticCurveTo(x(-4),y(-14),x(-7),y(-3));c.closePath();fill(c,LIGHT,false);}
 }
}
function eye(c,x,y,r,iris,look,open=1,flash=false){
 ellipse(c,x,y,r,r*open,flash?'#fff':'#eff3db');
 if(flash)return;
 c.save();c.beginPath();c.ellipse(x,y,Math.max(.1,r-.7),Math.max(.1,(r-.7)*open),0,0,TAU);c.clip();
 const ix=x+look.x*r*.19,iy=y+look.y*r*.17;
 ellipse(c,ix,iy,r*.57,r*.57,iris,true,.7);ellipse(c,ix,iy,r*.25,r*.31,INK,false);ellipse(c,ix-r*.17,iy-r*.17,Math.max(.5,r*.11),Math.max(.5,r*.11),'#fff',false);c.restore();
}
function bodyPool(c,tick,phase){
 ellipse(c,0,7,43,13,'#101d1980',false);
 c.beginPath();c.moveTo(-39,5);c.bezierCurveTo(-34,-5,-15,-7,0,-5);c.bezierCurveTo(17,-9,43,-2,42,8);c.bezierCurveTo(35,16,17,13,3,15);c.bezierCurveTo(-13,16,-29,14,-39,10);c.closePath();fill(c,'#28694bd9');
 const slide=Math.sin(tick*.038)*1.3;
 c.strokeStyle='#71b876';c.lineWidth=.9;c.beginPath();c.moveTo(-34,7);c.bezierCurveTo(-21,15,17,15,29,8);c.bezierCurveTo(37,1,10+slide,-2,-2+slide,3);c.bezierCurveTo(-8+slide,7,7+slide,10,17+slide,6);c.stroke();
 for(let i=0;i<2;i++){const a=tick*.025+i*Math.PI,x=Math.cos(a)*(23+i*6),y=7+Math.sin(a)*5;ellipse(c,x,y,1.6,1,phase===2?ACID:LIGHT,false);}
}
export function drawCorrosiveAbomination(c,actor,tick,flash=false){
 const b=actor.boss;if(b?.bossDefinitionId!==ID)return false;
 const pose=corrosiveAttackPose(actor,tick),death=actor.alive===false?clamp((actor.deathAge??0)/36):0;
 c.save();c.translate(actor.position.x,actor.position.y);c.globalAlpha*=1-death*.8;const opacity=c.globalAlpha;c.lineCap='round';c.lineJoin='round';
 bodyPool(c,tick,b.phase);
 const activeFront=pose.tip&&pose.armAmount>0&&pose.tip.y>-48;
 for(const side of[-1,1])if(!activeFront||side!==pose.side)arm(c,side,pose,tick,flash);
 c.save();c.translate(pose.bodyX,pose.bodyY+death*15);
 bodyPath(c,pose);fill(c,flash?'#fff':BASE);
 if(!flash){
  c.save();bodyPath(c,pose);c.clip();
  c.beginPath();c.moveTo(-34,-95+pose.top);c.lineTo(4,-95+pose.top);c.bezierCurveTo(-14,-76+pose.top,-17,-59,-14,-42);c.bezierCurveTo(-12,-22,-23,-12,-23,6);c.lineTo(-44,15);c.closePath();fill(c,LIGHT,false);
  c.beginPath();c.moveTo(15,-91+pose.top);c.bezierCurveTo(25,-63,17,-53,23,-33);c.bezierCurveTo(34,-13,17,0,4,8);c.lineTo(46,13);c.lineTo(47,-96);c.closePath();fill(c,DARK,false);
  // One broad rolling fold wraps the lower fluid mass into its low vortex.
  // It follows the body instead of adding stripes or surface texture.
  const slide=Math.sin(tick*.045)*1.8+pose.bodyX*.35;
  c.beginPath();c.moveTo(-36,-10);c.bezierCurveTo(-19,-24,6+slide,-11,26,-18);c.bezierCurveTo(39,-22,38,-8,25,-4);c.bezierCurveTo(10,2,-6+slide,-8,-20,-1);c.quadraticCurveTo(-28,4,-35,12);c.lineTo(-43,15);c.closePath();fill(c,DARK,false);
  c.beginPath();c.moveTo(-31,-10);c.bezierCurveTo(-16,-19,5+slide,-9,23,-15);c.quadraticCurveTo(31,-18,32,-14);c.bezierCurveTo(21,-9,4+slide,-11,-8,-8);c.quadraticCurveTo(-21,-6,-27,1);c.closePath();fill(c,LIGHT,false);
  c.beginPath();c.moveTo(-33,5);c.bezierCurveTo(-18,-3,-6,4,7,0);c.quadraticCurveTo(25,-7,36,0);c.lineTo(39,15);c.lineTo(-39,15);c.closePath();fill(c,DEEP,false);
  c.beginPath();c.moveTo(-15,-77+pose.top*.7);c.quadraticCurveTo(-8,-84+pose.top,0,-82+pose.top);c.quadraticCurveTo(-6,-79+pose.top,-11,-74+pose.top*.7);c.closePath();fill(c,WET,false);
  // Two retained wet bulges stay broad; phase two increases their pressure.
  for(const [x,y,r]of[[-17,-65,4],[15,-69,5]]){const swell=1+pose.pressure*(.42+Math.sin(tick*.095+x)*.10);ellipse(c,x,y+pose.top*.55,r*swell,r*.72*swell,b.phase===2?'#9ed88c':LIGHT,false);}
  c.restore();
 }
 bodyPath(c,pose);c.strokeStyle=INK;c.lineWidth=1.26;c.stroke();
 drawCorrosiveBodyRuptures(c,actor,tick);
 const look=unit(pose.aim.x,pose.aim.y+32),open=pose.ability==='slam'&&pose.p>0?1-.13*Math.sin(pose.p*Math.PI):1;
 eye(c,0,-59+pose.top*.58,10.3,'#9d6fc0',look,open,flash);
 eye(c,-16,-38+pose.top*.25,5.9,'#d97562',look,1,flash);
 eye(c,16,-44+pose.top*.33,6.7,'#d9bf5d',look,1,flash);
 eye(c,-5,-21+pose.top*.08,4.9,'#6ca8cb',look,1,flash);
 // Acid drips fall from the mass into its own puddle, not into fake hazards.
 if(!flash)for(let i=0;i<3;i++){
  const age=(tick+i*17+(actor.visualSeed??0))%51,x=[-24,21,11][i],drop=ease(age/51),y=-18+drop*28;
  c.globalAlpha=opacity*(age<45?1:1-(age-45)/6);ellipse(c,x+Math.sin(i*3+tick*.04),y,1.2,2.4, i===1?ACID:LIGHT,false);
 }
 c.restore();
 if(activeFront)arm(c,pose.side,pose,tick,flash);
 c.restore();return true;
}

function irregularPool(c,x,y,r,seed){
 c.beginPath();for(let i=0;i<=20;i++){const a=i/20*TAU,f=.91+.055*Math.sin(i*2.2+seed)+.03*Math.cos(i*4.3+seed),px=x+Math.cos(a)*r*f,py=y+Math.sin(a)*r*f;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();
}
function poolGround(c,row,tick){
 const age=tick-row.createdTick,left=row.expiresTick-tick;if(age<0||left<=0)return;
 const r=row.radius??12,seed=hash(row.id),spread=.25+.75*ease(age/13),fade=.28+.72*clamp(left/65);
 c.save();c.translate(row.position.x,row.position.y);
 // A complete faint footprint is visible from creation while the wet fill spreads.
 ellipse(c,0,0,r,r,'#478b3533',false);
 irregularPool(c,0,0,r*spread,seed);c.globalAlpha=fade;fill(c,'#285c30cc',true,.85);
 irregularPool(c,-r*.09,-r*.13,r*.73*spread,seed);fill(c,'#609a42b8',false);
 c.strokeStyle=ACID;c.globalAlpha=Math.max(.5,fade*.8);c.lineWidth=.7;c.beginPath();c.arc(0,0,r,-2.9,-.65);c.arc(0,0,r,.2,1.95);c.stroke();
 for(let i=0;i<3;i++){
  const life=(age+i*17+seed%31)%47,q=life/47,a=seed+i*2.4,x=Math.cos(a)*r*.46,y=Math.sin(a)*r*.46;
  c.globalAlpha=fade*Math.sin(q*Math.PI);ellipse(c,x,y,1+q*2.2,.7+q*1.4,q<.7?LIGHT:ACID,false);
 }
 c.restore();
}
function warning(c,row,tick){
 const q=clamp((tick-row.startedTick)/Math.max(1,row.resolvesTick-row.startedTick));
 if(row.ability!=='slam')return;
 const p=row.targetPosition??row.position,r=row.radius??64,seed=hash(row.id??row.bossId);
 c.save();c.translate(p.x,p.y);ellipse(c,0,0,r,r,`rgba(113,182,75,${.045+q*.065})`,false);
 c.strokeStyle=INK;c.lineWidth=2.8;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.strokeStyle=ACID;c.lineWidth=1.15;c.stroke();
 for(let i=0;i<6;i++){
  const a=i*TAU/6+(seed%37)*.1,rad=12+(1-q)*22,x=Math.cos(a)*rad,y=Math.sin(a)*rad;
  c.globalAlpha=.2+.5*q;ellipse(c,x,y,2+q*(2+i%2),1.4+q*2,LIGHT,false);
 }
 c.globalAlpha=.35+.5*q;c.strokeStyle='#d9f5ac';c.lineWidth=1.6;c.beginPath();c.arc(0,0,r-3,-Math.PI/2,-Math.PI/2+TAU*q);c.stroke();
 c.restore();
}
function slamGround(c,row,tick){
 const age=tick-row.resolvedTick;if(row.ability!=='slam'||age<0||age>=40)return;
 const p=row.targetPosition,q=age/40;
 c.save();c.translate(p.x,p.y);c.globalAlpha=(1-q)*.65;
 irregularPool(c,0,0,13+ease(age/14)*27,hash(row.bossId));fill(c,'#417f3e80',false);
 c.globalAlpha=(1-q)*.7;c.strokeStyle=ACID;c.lineWidth=1.4;c.beginPath();c.arc(0,0,8+ease(age/17)*56,0,TAU);c.stroke();c.restore();
}
export function drawCorrosiveGround(c,model,tick){
 const h=model.bossHazards??{};c.save();
 if(h.corrosiveTrails)drawCorrosiveTrails(c,h.corrosiveTrails,tick);
 else for(const row of h.corrosivePools??[])poolGround(c,row,tick); // Historical V1 poses only.
 drawCorrosiveMinionGround(c,h.corrosiveMinions??[],tick);
 for(const row of h.corrosiveTelegraphs??[])warning(c,row,tick);
 for(const row of h.corrosiveImpacts??[])slamGround(c,row,tick);
 c.restore();
}

function droplet(c,x,y,r,flash=false){
 c.beginPath();c.moveTo(x,y-r*1.9);c.bezierCurveTo(x+r*.45,y-r*.6,x+r*1.15,y-r*.2,x+r*.85,y+r*.5);c.quadraticCurveTo(x,y+r*1.4,x-r*.85,y+r*.5);c.bezierCurveTo(x-r*1.1,y-r*.2,x-r*.25,y-r*.8,x,y-r*1.9);c.closePath();fill(c,flash?'#fff':BASE,true,1.05);if(!flash)ellipse(c,x-r*.25,y-r*.25,r*.22,r*.47,LIGHT,false);
}
function splash(c,p,age,seed,power=1){
 if(age<0||age>=40)return;
 c.save();c.translate(p.x,p.y);const q=clamp(age/40);c.globalAlpha=1-ease((age-25)/15);
 for(let i=0;i<7;i++){
  const a=i*2.39996+seed%7,speed=(.4+(i%3)*.2)*power,dx=Math.cos(a)*speed*age,dy=Math.sin(a)*speed*age*.6;
  const height=Math.max(0,(3.2+(i%3)*.55)*age*.65-age*age*.052)*power;
  if(height>0)droplet(c,dx,dy-height,(1.5+i%3*.48)*(1-q*.35));
 }
 if(age<22){
  const rise=Math.sin(clamp((age+1)/22)*Math.PI),h=(21+power*7)*rise,w=(7+power*2)*(1-age/44);
  c.beginPath();c.moveTo(-w,1);c.bezierCurveTo(-w*1.5,-h*.2,-w*.5,-h*.45,-w*.6,-h);c.quadraticCurveTo(0,-h*.76,w*.45,-h*.92);c.bezierCurveTo(w*.1,-h*.5,w*1.4,-h*.18,w,1);c.closePath();fill(c,BASE);
  c.beginPath();c.moveTo(-w*.45,0);c.quadraticCurveTo(-w*.65,-h*.3,-w*.1,-h*.7);c.quadraticCurveTo(w*.3,-h*.3,w*.4,0);c.closePath();fill(c,LIGHT,false);
 }
 c.restore();
}
function spore(c,row,tick){
 const p=row.position,age=tick-row.createdTick,stage=row.stage??'drifting';
 if(stage!=='drifting'){
  const endAge=tick-(row.resolvedTick??tick);if(endAge<0||endAge>=24)return;
  c.save();c.translate(p.x,p.y);c.globalAlpha=1-endAge/24;
  for(let i=0;i<6;i++){const a=i*TAU/6+hash(row.id)%9,dist=3+endAge*.7;ellipse(c,Math.cos(a)*dist,Math.sin(a)*dist*.6-8-endAge*.25,1.4,1.1,i%2?LIGHT:ACID,false);}
  if(stage==='detonated'){c.strokeStyle=ACID;c.lineWidth=1;c.beginPath();c.arc(0,0,4+endAge*.8,0,TAU);c.stroke();}c.restore();return;
 }
 c.save();c.translate(p.x,p.y);const pulse=Math.sin((tick+hash(row.id)%37)*.14),r=6.1+pulse*.45;
 ellipse(c,0,2,8,3,'#101c1855',false);ellipse(c,0,-7,row.radius??12,row.radius??12,'#8dd66b2b',false);
 ellipse(c,0,-7,r,r,BASE);c.save();c.beginPath();c.arc(0,-7,r,0,TAU);c.clip();ellipse(c,-2,-9,r*.8,r*.8,LIGHT,false);ellipse(c,3,-4,r*.8,r*.8,DARK,false);c.restore();
 ellipse(c,-1.6,-8.7,1.4,1.2,MINT,false);
 const prev=row.previousPosition??p,velocity=unit(p.x-prev.x,p.y-prev.y);
 for(let i=1;i<=2;i++){c.globalAlpha=.34/i;ellipse(c,-velocity.x*(r+3+i*3),-7-velocity.y*(r+3+i*3),1.1,1.1,LIGHT,false);}c.globalAlpha=1;
 // One clear health pip distinguishes the real, shootable one-HP spores.
 c.fillStyle=INK;c.fillRect(-5,-19,10,2.5);c.fillStyle=ACID;c.fillRect(-4,-18.5,8,1.3);
 if(row.expiresTick-tick<60){c.globalAlpha=.25+Math.abs(Math.sin(tick*.22))*.4;c.strokeStyle=MINT;c.lineWidth=.7;c.beginPath();c.arc(0,-7,r+1.5,0,TAU);c.stroke();}
 c.restore();
}
function stormPod(c,row,p,index,tick){
 const q=clamp((tick-row.startedTick)/Math.max(1,row.resolvesTick-row.startedTick)),growth=ease((q-.12)/.88);if(growth<=0)return;
 const o=row.originPosition,seed=index*2.2,root=point(o.x,o.y-31),tip=point(p.x,p.y-7);
 c.save();c.globalAlpha=.35+growth*.55;c.strokeStyle=DARK;c.lineWidth=1.2;c.beginPath();c.moveTo(root.x,root.y);c.quadraticCurveTo(mix(root.x,tip.x,.7),Math.min(root.y,tip.y)-8-growth*7,tip.x,tip.y);c.stroke();
 ellipse(c,p.x,p.y-7,1+growth*5.5,1.3+growth*5.2,BASE,true,1.1);ellipse(c,p.x-1.3,p.y-8.5,.6+growth*1.7,.5+growth*1.3,LIGHT,false);c.restore();
}
export function corrosiveDepthItems(model,tick,viewport=null){
 const h=model.bossHazards??{},items=[];
 const visible=(p,r=45)=>!viewport||(p.x>=viewport.x-r&&p.x<=viewport.x+viewport.width+r&&p.y>=viewport.y-r&&p.y<=viewport.y+viewport.height+r);
 const add=(id,p,draw,r=45)=>{if(visible(p,r))items.push(Object.freeze({id:'corrosive-vfx/'+id,anchorX:p.x,anchorY:p.y+1,draw}));};
 for(const row of h.corrosiveImpacts??[]){const age=tick-row.resolvedTick;if(row.ability==='slam'&&age>=0&&age<40)add((row.id??row.bossId+'/'+row.sequence)+'/slam',row.targetPosition,c=>splash(c,row.targetPosition,age,hash(row.bossId),1.4),85);}
 for(const row of h.corrosiveSpores??[])add(row.id,row.position,c=>spore(c,row,tick),28);
 for(const row of h.corrosiveTelegraphs??[])if(row.ability==='spore_storm')for(const[index,p]of(row.sporeSpawnPositions??[]).entries())add((row.id??row.bossId)+'/pod/'+index,p,c=>stormPod(c,row,p,index,tick),90);
 return [...items,...corrosiveSheddingDepthItems(model,tick,viewport,corrosiveAttackPose)];
}
export function drawCorrosiveBossHud(c,canvas,model){
 const a=Object.values(model.entitiesById??{}).find(a=>a.alive&&a.boss?.bossDefinitionId===ID);if(!a)return false;
 const b=a.boss,w=Math.min(480,canvas.width-24),x=(canvas.width-w)/2,y=10;
 const hp=presentCombat(a.hp),max=Math.max(1,presentCombat(a.maxHp)),ratio=clamp(hp/max);
 c.save();c.fillStyle='#12221ded';c.strokeStyle='#8bb86c';c.lineWidth=1.3;c.beginPath();c.roundRect(x,y,w,58,7);c.fill();c.stroke();
 c.fillStyle='#e9f5d8';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('CORROSIVE ABOMINATION',canvas.width/2,y+17);
 c.fillStyle='#263a29';c.fillRect(x+12,y+24,w-24,8);c.fillStyle=BASE;c.fillRect(x+12,y+24,(w-24)*ratio,8);
 c.fillStyle=MINT;c.font='11px sans-serif';const labels={slam:'Caustic slam — leave the marked pool',spore_storm:'Spore storm — three fragile homing spores'};
 c.fillText(labels[b.pendingAction?.ability]??(b.phase===2?'Toxic pressure · acid trails and spores':'Alchemical sludge · avoid the acid trail'),canvas.width/2,y+47);c.restore();return true;
}