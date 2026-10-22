import {uprightAttackFrame} from './upright_attack_frame.js';

const SCALE=.78,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const NECK=6,NOSE=8.5,FRONT=(NECK+NOSE)*SCALE;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const color=(flash,hex)=>flash?'#fff':hex;
function localDirection(direction,rotation,facing){
 const co=Math.cos(rotation),si=Math.sin(rotation);
 return {x:(co*direction.x+si*direction.y)*facing,y:-si*direction.x+co*direction.y};
}
export function hellBatMeleePoseV4(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry;
 if(actor.enemyFamily!=='hell_bat'||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,d=Math.hypot(dx,dy);
 const direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=Math.max(sourceRadius,Math.min(weaponReach,d-targetRadius));
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick)),size=actor.elite?.scale??1;
 const frame=uprightAttackFrame({front:FRONT*size,recoil:3,lift:-3,lean:-.1,hitLean:.12,squeezeX:1,squeezeY:1,hitX:1,hitY:1},phase.phase,p,direction,contactReach);
 if(phase.phase==='windup'){
  // Six host ticks are too short to reserve all travel for the final 60%.
  // Begin the swoop gently while the wings lift, then meet the same hit pose.
  const travel=Math.max(0,contactReach-FRONT*size)*p*p*(3-2*p)-3*Math.sin(Math.PI*p);
  frame.body.x=direction.x*travel;frame.body.y=direction.y*travel-3*Math.sin(Math.PI*p);
  frame.anchor={x:frame.body.x,y:frame.body.y};
 }
 return {family:'hell_bat',phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:-12*SCALE*size},drawFacingX:actor.presentationFacingX===-1?-1:1};
}
export function hellBatMotionV4(m,time){
 const action=m.familyAttack,weight=action?.artWeight??0,strike=action?.strikeBlend??0;
 const cx=m.x+m.w/2,cy=m.y+m.h/2+Math.sin(time/140)*2.5*(1-weight);
 const u=action?localDirection(action.direction,action.body.rotation,action.drawFacingX):{x:.35,y:Math.sqrt(1-.35**2)};
 // A fixed short neck turns the head toward the bite; the torso stays upright.
 const angle=Math.atan2(u.y,u.x),neckTurn=Math.atan2(Math.sin(angle+Math.PI/2),Math.cos(angle+Math.PI/2));
 const neckAngle=-Math.PI/2+neckTurn*strike,head={x:cx+Math.cos(neckAngle)*NECK,y:cy+Math.sin(neckAngle)*NECK};
 const rest=Math.atan2(Math.sqrt(1-.35**2),.35),turn=Math.atan2(Math.sin(angle-rest),Math.cos(angle-rest));
 const mouthAngle=rest+turn*strike,nose={x:head.x+Math.cos(mouthAngle)*NOSE,y:head.y+Math.sin(mouthAngle)*NOSE};
 const flap=Math.sin(time/85),attackFlap=mix(.95,-.65,strike);
 return {cx,cy,head,nose,mouthAngle,weight,strike,flap:mix(flap,attackFlap,weight),gape:weight*(1-strike)*.48};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function wing(c,side,motion,flash){
 const f=motion.flap,elbowY=-4-f*2.5,tipY=-4-f*6;
 c.save();c.translate(motion.cx+side*4,motion.cy-3);c.scale(side,1);
 c.rotate(-f*.18);
 c.fillStyle=color(flash,'#b53f3c');c.strokeStyle=INK;c.lineWidth=LINE;
 c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(6,-5,10,elbowY);c.quadraticCurveTo(17,tipY-2,22,tipY);
 c.quadraticCurveTo(17,tipY+3,17,tipY+7);c.quadraticCurveTo(12,tipY+4,11,tipY+9);
 c.quadraticCurveTo(6,3,0,4);c.closePath();c.fill();c.stroke();
 if(!flash){
  c.fillStyle='#762b36';c.beginPath();c.moveTo(2,2);c.quadraticCurveTo(11,elbowY+1,20,tipY+.5);
  c.quadraticCurveTo(16,tipY+3,17,tipY+6);c.quadraticCurveTo(12,tipY+4,11,tipY+8);
  c.quadraticCurveTo(6,3,2,2);c.fill();
 }
 c.restore();
}
function body(c,motion,flash){
 const {cx:x,cy:y}=motion;
 c.fillStyle=color(flash,'#414252');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.ellipse(x,y,8.5,10,0,0,TAU);c.fill();c.stroke();
 if(!flash){
  c.fillStyle='#252534';c.beginPath();c.moveTo(x+4,y-7);c.quadraticCurveTo(x+10,y,x+5,y+7);c.quadraticCurveTo(x+1,y+11,x-4,y+7);c.quadraticCurveTo(x+5,y+6,x+4,y-7);c.fill();
 }
}
function head(c,motion,flash){
 const {x,y}=motion.head;
 // Small ears, dot eyes and a flat fanged grin keep the original cartoon read.
 for(const side of [-1,1]){
  polygon(c,[[x+side*2.5,y-5],[x+side*6,y-10.5],[x+side*7.5,y-4]],color(flash,'#414252'));
 }
 c.fillStyle=color(flash,'#414252');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(motion.nose.x,motion.nose.y);c.arc(x,y,NOSE,motion.mouthAngle,motion.mouthAngle+TAU);c.closePath();c.fill();c.stroke();
 if(!flash){
  c.fillStyle='#252534';c.beginPath();c.moveTo(x+5,y-6);c.quadraticCurveTo(x+10,y+1,x+4,y+6);c.quadraticCurveTo(x,y+9,x-5,y+5);c.quadraticCurveTo(x+5,y+4,x+5,y-6);c.fill();
  c.fillStyle='#646678';c.beginPath();c.ellipse(x-2.7,y-4.5,3,1.5,-.35,0,TAU);c.fill();
 }
 c.save();c.translate(x,y);c.rotate(motion.mouthAngle);
 // The mouth opens within the round face. There is no projecting snout.
 const open=2+motion.gape*2;
 if(!flash){
  c.fillStyle=INK;c.beginPath();c.moveTo(3,-open);c.quadraticCurveTo(7,-open-1,7.6,0);c.quadraticCurveTo(7,open+1,3,open);c.closePath();c.fill();
  polygon(c,[[3.4,-1.9],[3.8,-.2],[6.3,-1]],'#f5dfbb',false);
  polygon(c,[[3.8,.2],[3.4,1.9],[6.3,1]],'#f5dfbb',false);
 }
 c.restore();
 if(!flash){
  const lookX=Math.cos(motion.mouthAngle)*.5;
  c.fillStyle='#ff6b5b';c.beginPath();c.arc(x-3.2+lookX,y-1.6,1.65,0,TAU);c.arc(x+3.2+lookX,y-1.6,1.65,0,TAU);c.fill();
 }
}
export function drawHellBatV4(c,m,time){
 const motion=hellBatMotionV4(m,time),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 wing(c,-1,motion,flash);wing(c,1,motion,flash);body(c,motion,flash);head(c,motion,flash);c.restore();
}
