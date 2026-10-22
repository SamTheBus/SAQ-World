import {uprightAttackFrame} from './upright_attack_frame.js';

const SCALE=.78,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const NECK=5,NOSE=Math.hypot(8,1),FRONT=(NECK+NOSE)*SCALE;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const color=(flash,hex)=>flash?'#fff':hex;
function localDirection(direction,rotation,facing){
 const co=Math.cos(rotation),si=Math.sin(rotation);
 return {x:(co*direction.x+si*direction.y)*facing,y:-si*direction.x+co*direction.y};
}
export function lavaSerpentMeleePoseV4(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry;
 if(actor.enemyFamily!=='lava_serpent'||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,d=Math.hypot(dx,dy);
 const direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=Math.max(sourceRadius,Math.min(weaponReach,d-targetRadius));
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick)),size=actor.elite?.scale??1;
 const frame=uprightAttackFrame({front:FRONT*size,recoil:4,lift:-1,lean:-.1,hitLean:.08,squeezeX:1,squeezeY:1,hitX:1,hitY:1},phase.phase,p,direction,contactReach);
 return {family:'lava_serpent',phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:-10*SCALE*size},drawFacingX:actor.presentationFacingX===-1?1:-1,disableFacingFlip:false};
}
export function lavaSerpentRangedPoseV4(actor,tick){
 const r=actor.ranged;if(!actor.alive||!r||r.phase==='idle')return null;
 const aim=r.aim??{x:actor.presentationFacingX??1,y:0},d=Math.hypot(aim.x,aim.y),direction=d>.001?{x:aim.x/d,y:aim.y/d}:{x:1,y:0};
 const p=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick)),smooth=x=>x*x*(3-2*x),weight=r.phase==='windup'?smooth(p):1-smooth(p),size=actor.elite?.scale??1;
 return {family:'lava_serpent',ranged:true,upright:true,preserveFacingFlip:true,phase:r.phase,progress:p,direction,artWeight:weight,strikeBlend:1,
  charge:r.phase==='windup'?weight:0,release:r.phase==='recovery'?Math.max(0,1-(tick-r.phaseStartedTick)/4):0,recovery:r.phase==='recovery'?1-p:0,
  drawFacingX:actor.presentationFacingX===-1?1:-1,bodyPivot:{x:0,y:-10*SCALE*size},body:{x:-direction.x*2*weight,y:-direction.y*2*weight,rotation:0,scaleX:1,scaleY:1},limb:{extension:0,sweep:0,open:weight}};
}
export function lavaSerpentMotionV4(m,time,seed){
 const action=m.familyAttack,weight=action?.artWeight??0,strike=action?.strikeBlend??0,walk=m.motionBlend??0,step=m.stepPhase??0,cx=m.x+m.w/2,cy=m.y+m.h/2+2,t=time/140;
 const wave=(i)=>Math.sin(t-i*.8)*(3.5+walk*.8)*(1-weight*(i===0?1:.25))+Math.sin(step-i*.7)*walk*.55*(1-weight);
 const root={x:cx,y:cy+wave(0)},u=action?localDirection(action.direction,action.body.rotation,action.drawFacingX):{x:-1,y:0};
 const aim=Math.atan2(-u.y,-u.x),neckAngle=mix(.12,aim,strike)*weight,angle=mix(-.22,aim+Math.atan2(1,8),strike)*weight;
 const head={x:root.x-Math.cos(neckAngle)*NECK,y:root.y-Math.sin(neckAngle)*NECK,angle,gape:action?.ranged?weight*.28:weight*(1-strike)*.34};
 const nose={x:head.x-Math.cos(angle)*8-Math.sin(angle),y:head.y-Math.sin(angle)*8+Math.cos(angle)};
 const segments=Array.from({length:6},(_,i)=>({x:cx+i*5.5-i*.6*weight*(1-strike),y:cy+wave(i),radius:6.5-i*.7}));
 return {root,head,nose,segments,weight,strike,castHeat:action?.ranged?weight:0,heat:.92+Math.sin(time/220+(seed%11))*.08};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function glow(c,motion){
 c.save();c.globalAlpha*=.23*motion.heat;c.strokeStyle='#ff681c';c.shadowColor='#ff6417';c.shadowBlur=7;c.lineWidth=3;
 c.beginPath();for(const s of motion.segments){c.moveTo(s.x+s.radius,s.y);c.arc(s.x,s.y,s.radius,0,TAU);}c.stroke();c.restore();
}
function segment(c,s,flash,rare){
 const {x,y,radius:r}=s;
 // The six source basalt segments and dorsal spines keep their silhouette.
 polygon(c,[[x+1,y-r],[x-2,y-r-3],[x-3,y-r]],color(flash,'#38201b'));
 c.fillStyle=color(flash,rare?'#c16b24':'#693325');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.stroke();
 if(!flash){
  c.fillStyle='#321b1b';c.beginPath();c.moveTo(x+r*.25,y-r*.8);c.quadraticCurveTo(x+r*.95,y-r*.32,x+r*.9,y+r*.27);c.quadraticCurveTo(x+r*.48,y+r*.91,x-r*.12,y+r*.88);c.lineTo(x+r*.02,y+r*.2);c.closePath();c.fill();
  c.fillStyle='#ab5830';c.beginPath();c.moveTo(x-r*.7,y-r*.36);c.quadraticCurveTo(x-r*.4,y-r*.89,x+r*.15,y-r*.78);c.lineTo(x+r*.07,y-r*.39);c.quadraticCurveTo(x-r*.35,y-r*.56,x-r*.7,y-r*.36);c.fill();
  c.fillStyle=rare?'#fff0b2':'#f55518';c.beginPath();c.arc(x,y,r*.45,0,TAU);c.fill();
  c.fillStyle='#ffc964';c.beginPath();c.ellipse(x-r*.09,y-r*.1,r*.21,r*.14,-.4,0,TAU);c.fill();
 }
}
function head(c,motion,flash){
 const h=motion.head;
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);
 // The lower jaw hinges at the back of the real wedge-shaped head.
 c.save();c.translate(4,3);c.rotate(-h.gape);
 polygon(c,[[2,0],[-12,-2],[-9,2],[2,4]],color(flash,'#713321'));
 if(!flash){polygon(c,[[-9,-.7],[-6,1],[0,2],[1,3],[-8,1]],'#b75b29',false);}
 c.restore();
 polygon(c,[[6,-6],[-7,-5],[-8,1],[-3,3],[6,3]],color(flash,'#55271e'));
 if(!flash){
  polygon(c,[[4,-5],[-5.8,-4],[-6.3,-1.6],[-.5,-2],[4,-.5]],'#9a4a27',false);
  polygon(c,[[-5.5,.1],[-2,1],[4,1.7],[4,2.6],[-3,2]],'#2d1718',false);
  polygon(c,[[-5,1],[-3.6,1.3],[-4.5,2.6]],'#ffe7a6',false);
 }
 c.fillStyle=color(flash,'#ef8629');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(2,-5);c.quadraticCurveTo(7,-11,10,-10);c.lineTo(3,-2);c.closePath();c.fill();c.stroke();
 if(!flash){
  polygon(c,[[3.5,-5.2],[7.8,-9],[6.2,-6.1],[3.8,-3.4]],'#ffd07b',false);
  c.fillStyle='#ffe2a0';c.beginPath();c.ellipse(-2,-1,1.5,1.15,-.2,0,TAU);c.fill();
  c.strokeStyle='#4c251c';c.lineWidth=.75;c.beginPath();c.moveTo(-2.2,-1.8);c.lineTo(-2.5,-.3);c.stroke();
  if(motion.castHeat>0){
   const q=motion.castHeat;c.save();c.globalAlpha*=q;c.shadowColor='#ff6a16';c.shadowBlur=5;c.fillStyle='#ff861e';c.beginPath();c.ellipse(-6.5,1,1+q*1.5,.6+q,0,0,TAU);c.fill();c.shadowBlur=0;c.fillStyle='#fff1b2';c.beginPath();c.arc(-7,1,.5+q*.8,0,TAU);c.fill();c.restore();
  }
 }
 c.restore();
}
export function drawLavaSerpentV4(c,m,time,seed){
 const motion=lavaSerpentMotionV4(m,time,seed),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 if(!flash)glow(c,motion);
 for(let i=5;i>=0;i--)segment(c,motion.segments[i],flash,m.isRare);
 c.save();c.strokeStyle=color(flash,'#693325');c.lineWidth=8;c.beginPath();c.moveTo(motion.root.x,motion.root.y);c.lineTo(motion.head.x,motion.head.y);c.stroke();c.restore();
 head(c,motion,flash);c.restore();
}
