import {uprightAttackFrame} from './upright_attack_frame.js';
// Preserve the Warden's stone sculpture and carried greatsword. Its real
// weapon and articulated stone arm share one continuous idle/attack assembly.
const TAU=Math.PI*2,SCALE=.82,LINE=1.26/SCALE,INK='#11151a',IDLE_ANGLE=-.72;
const SHOULDER=Object.freeze({x:-8,y:-3}),STRIKE_GRIP=Object.freeze({x:2,y:4}),BLADE_REACH=31,ARM=9;
const IDLE_GRIP=Object.freeze({x:-11-Math.sin(IDLE_ANGLE)*8,y:7+Math.cos(IDLE_ANGLE)*8});
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const color=(flash,hex)=>flash?'#fff':hex;
function localDirection(direction,rotation,facing){
 const co=Math.cos(rotation),si=Math.sin(rotation);
 return {x:(co*direction.x+si*direction.y)*facing,y:-si*direction.x+co*direction.y};
}
function swordRay(u){
 const dot=STRIKE_GRIP.x*u.x+STRIKE_GRIP.y*u.y,perp2=STRIKE_GRIP.x**2+STRIKE_GRIP.y**2-dot*dot;
 return dot+Math.sqrt(Math.max(0,BLADE_REACH**2-perp2));
}
export function gargoyleSwordFrontV4(direction,rotation,facing=1,size=1){
 return swordRay(localDirection(direction,rotation,facing))*SCALE*size;
}
export function gargoyleSwordGeometryV4(action=null){
 const weight=action?.artWeight??0,strike=action?.strikeBlend??0,facing=action?.idleFacingX??1;
 const u=action?localDirection(action.direction,action.body.rotation,facing):{x:1,y:0},distance=swordRay(u);
 // Keep the forward swing on one angle branch as a target moves from right
 // to down; shortest-angle wrapping would reverse the swing mid-windup.
 const goal=Math.atan2(u.y*distance-STRIKE_GRIP.y,u.x*distance-STRIKE_GRIP.x)+Math.PI/2-IDLE_ANGLE;
 const braceAngle=-.38*(Math.sign(goal)||1);
 const grip={x:mix(IDLE_GRIP.x,mix(-8,STRIKE_GRIP.x,strike),weight),y:mix(IDLE_GRIP.y,mix(8,STRIKE_GRIP.y,strike),weight)};
 const angle=IDLE_ANGLE+mix(braceAngle,goal,strike)*weight;
 const dx=grip.x-SHOULDER.x,dy=grip.y-SHOULDER.y,d=Math.hypot(dx,dy)||1,along=d/2,height=Math.sqrt(Math.max(0,ARM**2-along**2));
 const elbow={x:SHOULDER.x+dx/d*along-dy/d*height,y:SHOULDER.y+dy/d*along+dx/d*height};
 return {shoulder:SHOULDER,elbow,grip,angle,tip:{x:grip.x+Math.sin(angle)*BLADE_REACH,y:grip.y-Math.cos(angle)*BLADE_REACH},upperLength:ARM,lowerLength:ARM};
}
export function gargoyleMeleePoseV4(actor,tick){
 const phase=actor.meleePhase,g=actor.meleeGeometry;
 if(actor.enemyFamily!=='gargoyle'||!actor.alive||!g||!phase||phase.phase==='idle')return null;
 const dx=g.targetPosition?g.targetPosition.x-actor.position.x:actor.presentationFacingX??1,dy=g.targetPosition?g.targetPosition.y-actor.position.y:0,d=Math.hypot(dx,dy);
 const direction=d>.001?{x:dx/d,y:dy/d}:{x:1,y:0},sourceRadius=g.sourceRadius,targetRadius=g.targetRadius;
 const centerLimit=g.mode==='clearHullGap'?g.reach+sourceRadius+targetRadius:g.reach,weaponReach=Math.max(sourceRadius,centerLimit-targetRadius),contactReach=Math.max(sourceRadius,Math.min(weaponReach,d-targetRadius));
 const p=clamp((tick-phase.phaseStartedTick)/Math.max(1,phase.phaseEndsTick-phase.phaseStartedTick)),facing=actor.presentationFacingX===-1?-1:1,size=actor.elite?.scale??1;
 const tuning={front:gargoyleSwordFrontV4(direction,.1*direction.x,facing,size),recoil:3,lift:2,lean:-.12,hitLean:.1,squeezeX:1,squeezeY:1,hitX:1,hitY:1};
 const frame=uprightAttackFrame(tuning,phase.phase,p,direction,contactReach);
 return {family:'gargoyle',phase:phase.phase,progress:p,direction,sourceRadius,targetRadius,centerLimit,weaponReach,contactReach,...frame,
  upright:true,bodyPivot:{x:0,y:-12*SCALE*size},idleFacingX:facing,gargoyleScale:size,disableFacingFlip:false};
}
export function gargoyleMotionV4(m,time,seed){
 const weight=m.familyAttack?.artWeight??0,strike=m.familyAttack?.strikeBlend??0,walk=m.motionBlend??0,step=m.stepPhase??0;
 return {x:Math.sin(step)*walk*1.2*(1-weight),y:(Math.sin(time/210+(seed%11))*.7-Math.abs(Math.sin(step))*walk)*(1-weight),wingWidth:17+3*weight,
  wings:[-1,1].map(side=>(Math.sin(time/180+side)*1.2+Math.sin(step+side)*walk*2)*(1-weight)+mix(-4,7,strike)*weight)};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function stoneLimb(c,a,b,widthA,widthB,flash){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;
 polygon(c,[[a.x+nx*widthA,a.y+ny*widthA],[b.x+nx*widthB,b.y+ny*widthB],[b.x-nx*widthB,b.y-ny*widthB],[a.x-nx*widthA,a.y-ny*widthA]],color(flash,'#60717a'));
 polygon(c,[[a.x+nx*widthA*.7,a.y+ny*widthA*.7],[b.x+nx*widthB*.65,b.y+ny*widthB*.65],[b.x,b.y],[a.x,a.y]],color(flash,'#8b9aa0'),false);
}
function offhand(c,flash,cx,cy){
 c.save();c.translate(cx,cy);
 stoneLimb(c,{x:8,y:-3},{x:12,y:2},2.8,2.4,flash);stoneLimb(c,{x:12,y:2},{x:10,y:8},2.5,2.2,flash);
 polygon(c,[[8,6],[12,6],[13,9],[11,11],[10,9.6],[8.5,10],[7.5,8.5]],color(flash,'#60717a'));c.restore();
}
function weapon(c,m,cx,cy,flash){
 const g=gargoyleSwordGeometryV4(m.familyAttack);
 c.save();c.translate(cx,cy);c.lineJoin='round';c.lineCap='round';
 stoneLimb(c,g.shoulder,g.elbow,3,2.7,flash);stoneLimb(c,g.elbow,g.grip,2.7,2.1,flash);
 // Original blade, guard and handle paths, rigidly pivoted at the real grip.
 c.save();c.translate(g.grip.x,g.grip.y);c.rotate(g.angle);c.translate(0,-8);
 polygon(c,[[-2,-19],[0,-23],[2,-19],[2,4],[-2,4]],color(flash,'#97a5ae'));
 polygon(c,[[-1.1,-18],[0,-21],[0,2],[-1.1,2]],color(flash,'#c4cdd0'),false);
 c.fillStyle=color(flash,'#39474f');c.fillRect(-6,1,12,3);c.strokeStyle=INK;c.lineWidth=LINE;c.strokeRect(-6,1,12,3);
 c.fillStyle=color(flash,'#69513a');c.fillRect(-2,4,4,8);c.strokeRect(-2,4,4,8);
 if(!flash){c.strokeStyle='#e3a84a';c.lineWidth=.8;c.beginPath();c.moveTo(0,-17);c.lineTo(0,-7);c.stroke();}c.restore();
 c.save();c.translate(g.grip.x,g.grip.y);c.rotate(g.angle);
 polygon(c,[[-2.8,-2.2],[2.2,-2.2],[3,0],[2,2.6],[-2.4,2.6],[-3,.4]],color(flash,'#8b9aa0'));c.restore();c.restore();
}

export function drawGargoyleV4(c,m,presentationTime,seed){
  const time=presentationTime,action=m.familyAttack,motion=gargoyleMotionV4(m,time,seed),cx=m.x+m.w/2+motion.x,cy=m.y+m.h-12+motion.y;
  const flash=m.flashTimer>0,outline=INK,stone=flash?'#fff':'#60717a',stoneLight=flash?'#fff':'#8b9aa0',stoneDark=flash?'#fff':'#39474f',moss=flash?'#fff':'#42633a',core='#e3a84a';
  c.save();c.strokeStyle=outline;c.lineWidth=LINE;c.lineJoin='round';c.lineCap='round';
  // Compact, upward-swept bat wings sit behind the masonry body.
  for(let side=-1;side<=1;side+=2){
    const flex=motion.wings[side===-1?0:1];
    c.fillStyle=stoneDark;c.beginPath();
    c.moveTo(cx+side*5,cy-6);
    c.lineTo(cx+side*motion.wingWidth,cy-17-flex);
    c.lineTo(cx+side*18,cy-5);
    c.lineTo(cx+side*13,cy+3);
    c.lineTo(cx+side*7,cy+1);c.closePath();c.fill();c.stroke();
    if(!flash){c.strokeStyle='#788286';c.lineWidth=1;c.beginPath();c.moveTo(cx+side*7,cy-6);c.lineTo(cx+side*15,cy-12-flex*.4);c.moveTo(cx+side*8,cy-2);c.lineTo(cx+side*14,cy);c.stroke();c.strokeStyle=outline;c.lineWidth=LINE;}
  }
  offhand(c,flash,cx,cy);
  // Blocky torso with two stone planes and squat clawed feet.
  c.fillStyle=stone;c.beginPath();c.moveTo(cx-9,cy-7);c.lineTo(cx+9,cy-7);c.lineTo(cx+11,cy+7);c.lineTo(cx+5,cy+12);c.lineTo(cx-6,cy+12);c.lineTo(cx-11,cy+6);c.closePath();c.fill();c.stroke();
  if(!flash){c.fillStyle=stoneLight;c.beginPath();c.moveTo(cx-8,cy-6);c.lineTo(cx-1,cy-5);c.lineTo(cx-2,cy+8);c.lineTo(cx-6,cy+10);c.closePath();c.fill();c.fillStyle=stoneDark;c.beginPath();c.moveTo(cx+2,cy-5);c.lineTo(cx+8,cy-5);c.lineTo(cx+9,cy+6);c.lineTo(cx+4,cy+10);c.closePath();c.fill();}
  c.fillStyle=stoneDark;c.beginPath();c.moveTo(cx-7,cy+10);c.lineTo(cx-13,cy+14);c.lineTo(cx-4,cy+14);c.closePath();c.moveTo(cx+7,cy+10);c.lineTo(cx+13,cy+14);c.lineTo(cx+4,cy+14);c.closePath();c.fill();c.stroke();
  // Masonry head, brow, muzzle and readable horns.
  const headY=cy-13;c.fillStyle=stone;c.beginPath();c.roundRect(cx-8,headY-7,16,14,[4]);c.fill();c.stroke();
  c.fillStyle=stoneLight;c.beginPath();c.moveTo(cx-7,headY-5);c.lineTo(cx,headY-7);c.lineTo(cx,headY+4);c.lineTo(cx-6,headY+3);c.closePath();c.fill();
  c.fillStyle=stoneDark;c.beginPath();c.moveTo(cx-6,headY-5);c.quadraticCurveTo(cx-12,headY-13,cx-15,headY-11);c.lineTo(cx-7,headY-1);c.closePath();c.moveTo(cx+6,headY-5);c.quadraticCurveTo(cx+12,headY-13,cx+15,headY-11);c.lineTo(cx+7,headY-1);c.closePath();c.fill();c.stroke();
  c.strokeStyle=outline;c.lineWidth=LINE;c.beginPath();c.moveTo(cx-6,headY-1);c.lineTo(cx-1,headY-2);c.moveTo(cx+1,headY-2);c.lineTo(cx+6,headY-1);c.stroke();
  c.fillStyle=stoneDark;c.beginPath();c.roundRect(cx-5,headY+2,10,5,[2]);c.fill();c.stroke();
  if(!flash){c.fillStyle='#fff4c8';c.shadowBlur=5;c.shadowColor=core;c.beginPath();c.arc(cx-3,headY,1.4,0,Math.PI*2);c.arc(cx+3,headY,1.4,0,Math.PI*2);c.fill();c.shadowBlur=0;
    const pulse=.85+Math.sin(time/180)*.15;c.save();c.shadowBlur=7*pulse;c.shadowColor=core;c.fillStyle=core;c.beginPath();c.moveTo(cx,cy-5);c.lineTo(cx-3,cy-1);c.lineTo(cx,cy+3);c.lineTo(cx+3,cy-1);c.closePath();c.fill();c.restore();
    c.fillStyle=moss;c.beginPath();c.ellipse(cx-7,cy+2,4,2.5,-.35,0,Math.PI*2);c.ellipse(cx+6,cy+8,3,2,.4,0,Math.PI*2);c.fill();}
  weapon(c,m,cx,cy,flash);
  c.restore();
}

