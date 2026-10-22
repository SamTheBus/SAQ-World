// Client-only sapphire wyrmling, cyan crystals and an attached upright head.
// Its mouth follows World's existing frost-shot origin; it creates no shots.
const SCALE=.7,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const NECK_REACH=14,LIP=7,FRONT=(NECK_REACH+LIP)*SCALE;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const mix=(a,b,w)=>a+(b-a)*w;
const turn=x=>Math.atan2(Math.sin(x),Math.cos(x));
const color=(flash,hex)=>flash?'#fff':hex;

export function frostWyrmlingRangedPoseV4(actor,tick){
 const r=actor.ranged;if(!actor.alive||!r||r.phase==='idle')return null;
 const aim=r.aim??(r.targetPosition?{x:r.targetPosition.x-actor.position.x,y:r.targetPosition.y-actor.position.y}:{x:actor.presentationFacingX??1,y:0});
 const length=Math.hypot(aim.x,aim.y),direction=length>.001?{x:aim.x/length,y:aim.y/length}:{x:1,y:0};
 const p=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick));
 const weight=r.phase==='windup'?smooth(p):1-smooth(p),size=actor.elite?.scale??1;
 const muzzle=(actor.hullRadius??10)+6+1;
 const kick=r.phase==='recovery'?Math.sin(Math.PI*clamp((tick-r.phaseStartedTick)/4)):0;
 const travel=(muzzle-FRONT*size)*weight-2*Math.sin(Math.PI*weight)-3*kick;
 return {family:'wyrmling',ranged:true,upright:true,preserveFacingFlip:true,
  phase:r.phase,progress:p,direction,artWeight:weight,charge:r.phase==='windup'?weight:0,
  release:r.phase==='recovery'?Math.max(0,1-(tick-r.phaseStartedTick)/3):0,recovery:r.phase==='recovery'?1-p:0,
  drawFacingX:actor.presentationFacingX===-1?1:-1,bodyPivot:{x:0,y:-12*SCALE*size},
  body:{x:direction.x*travel,y:direction.y*travel+(12*SCALE*size-8)*weight,rotation:0,scaleX:1,scaleY:1},
  limb:{extension:0,sweep:0,open:weight}};
}

export function frostWyrmlingMotionV4(m,time){
 const x=m.x+m.w/2,baseY=m.y+m.h/2,a=m.rangedPose,weight=a?.artWeight??0;
 const walk=m.motionBlend??0,step=m.stepPhase??0,y=baseY+Math.sin(time/150)*4*(1-weight);
 const segments=Array.from({length:5},(_,i)=>({index:i,x:x+i*7.5,
  y:y+Math.sin(time/200-i*.8)*6*(1-weight*(i===0?1:.25))+Math.sin(step-i*.7)*walk*.65*(1-weight),radius:8-i*1.2}));
 const root={x:segments[0].x,y:segments[0].y};
 const target=a?{x:a.direction.x*a.drawFacingX,y:a.direction.y}:{x:0,y:1};
 const angle=Math.PI/2+turn(Math.atan2(target.y,target.x)-Math.PI/2)*weight;
 const u={x:Math.cos(angle),y:Math.sin(angle)};
 const head={x:mix(x,root.x+target.x*NECK_REACH,weight),y:mix(y-14,root.y+target.y*NECK_REACH,weight),aim:u,gape:weight};
 const neckSegments=[{t:.34,radius:5.5},{t:.68,radius:4.8}].map(s=>({
  x:mix(root.x,head.x,s.t)-1.2*Math.sin(Math.PI*s.t)*(1-weight*.5),
  y:mix(root.y,head.y,s.t),radius:s.radius}));
 const mouth={x:head.x+u.x*(4+2*weight),y:head.y+u.y*(4+2*weight),angle};
 const muzzle={x:mouth.x+u.x,y:mouth.y+u.y};
 return {segments,neckSegments,root,head,mouth,muzzle,weight};
}

function polygon(c,points,fill,outline=true){
 c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.closePath();
 c.fillStyle=fill;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function crystal(c,points,flash){
 polygon(c,points,color(flash,'#81ecec'),false);
 if(!flash){
  const center={x:(points[0].x+points[points.length-1].x)/2,y:(points[0].y+points[points.length-1].y)/2};
  polygon(c,[points[1],points[2],center],'#3b9fca',false);
  polygon(c,[points[0],points[1],center],'#d2ffff',false);
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(points[0].x,points[0].y);
 for(const p of points.slice(1))c.lineTo(p.x,p.y);c.closePath();c.stroke();
}
function segment(c,s,flash){
 const {x,y,radius:r}=s;
 c.fillStyle=color(flash,'#2b6cb0');c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 if(!flash){
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  c.fillStyle='#193e76';c.beginPath();c.moveTo(x+r*.5,y-r*.9);
  c.quadraticCurveTo(x+r*1.4,y+r*.8,x-r*.5,y+r*1.1);c.lineTo(x-r*.9,y+r*.35);
  c.quadraticCurveTo(x+r*.7,y+r*.6,x+r*.5,y-r*.9);c.closePath();c.fill();
  c.fillStyle='#65c5df';c.beginPath();c.moveTo(x-r*.95,y-r*.03);
  c.quadraticCurveTo(x-r*.9,y-r*.9,x+r*.3,y-r*.92);c.lineTo(x+r*.1,y-r*.42);
  c.quadraticCurveTo(x-r*.5,y-r*.55,x-r*.95,y-r*.03);c.closePath();c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
}
function head(c,q,flash){
 const {x,y}=q.head;
 c.beginPath();c.ellipse(x,y,8,7,0,0,TAU);c.fillStyle=color(flash,'#2b6cb0');c.fill();
 if(!flash){
  c.save();c.beginPath();c.ellipse(x,y,8,7,0,0,TAU);c.clip();
  c.fillStyle='#193e76';c.beginPath();c.moveTo(x+4,y-6);c.quadraticCurveTo(x+12,y+7,x-3,y+8);
  c.lineTo(x-6,y+3);c.quadraticCurveTo(x+5,y+5,x+4,y-6);c.closePath();c.fill();
  c.fillStyle='#65c5df';c.beginPath();c.moveTo(x-7,y-1);c.quadraticCurveTo(x-6,y-8,x+2,y-6.7);
  c.lineTo(x,y-3.8);c.quadraticCurveTo(x-4,y-4.5,x-7,y-1);c.closePath();c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.ellipse(x,y,8,7,0,0,TAU);c.stroke();
 for(const side of [-1,1]){
  crystal(c,[{x:x+side*1.5,y:y-5},{x:x+side*7,y:y-12.5},{x:x+side*5.5,y:y-4}],flash);
 }
 if(flash)return;
 for(const side of [-1,1]){
  const ex=x+side*3+q.head.aim.x*q.weight*.3,ey=y-2+q.head.aim.y*q.weight*.2;
  c.fillStyle='#10335a';c.beginPath();c.ellipse(ex,ey,1.85,1.65,0,0,TAU);c.fill();
  c.save();c.fillStyle='#f0ffff';c.shadowColor='#81ecec';c.shadowBlur=2.5;
  c.beginPath();c.arc(ex,ey,1.25,0,TAU);c.fill();c.restore();
 }
 c.save();c.translate(q.mouth.x,q.mouth.y);c.rotate(q.mouth.angle);
 c.fillStyle='#163b61';c.beginPath();c.ellipse(0,0,.2+q.weight*.8,1.2+q.weight*.7,0,0,TAU);c.fill();
 c.strokeStyle=INK;c.lineWidth=.7;c.stroke();c.globalAlpha*=q.weight;
 c.fillStyle='#d2ffff';c.beginPath();c.moveTo(.8,0);c.lineTo(-.6,-.8);c.lineTo(-.6,.8);c.closePath();c.fill();c.restore();
}

export function drawFrostWyrmlingV4(c,m,time,seed){
 const q=frostWyrmlingMotionV4(m,time),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 for(const s of q.segments.slice().reverse())crystal(c,[{x:s.x-2.4,y:s.y-s.radius+.7},{x:s.x,y:s.y-s.radius-(6-s.index)},{x:s.x+2.4,y:s.y-s.radius+.7}],flash);
 for(const s of q.segments.slice().reverse())segment(c,s,flash);
 for(const s of q.neckSegments)segment(c,s,flash);
 head(c,q,flash);c.restore();
}
