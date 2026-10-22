// Client-only gravity orb. All animation derives from the supplied clock and
// committed cast DTO; no authority, random numbers or saved animation state.
const TAU=Math.PI*2,INK='#11151a',CONTOUR=1.26/.75;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const p=clamp(v);return p*p*(3-2*p);};

export function voidOrbRangedPoseV4(actor,tick){
 const r=actor.ranged;
 if(!actor.alive||!r||!['windup','recovery'].includes(r.phase))return null;
 const d=r.aim??(r.targetPosition?{x:r.targetPosition.x-actor.position.x,y:r.targetPosition.y-actor.position.y}:{x:actor.presentationFacingX??1,y:0});
 const length=Math.hypot(d.x,d.y),direction=length>.001?{x:d.x/length,y:d.y/length}:{x:1,y:0};
 const progress=clamp((tick-r.phaseStartedTick)/Math.max(1,r.phaseEndsTick-r.phaseStartedTick));
 const hold=r.phase==='windup'?smooth(progress):1-smooth(progress);
 const kick=r.phase==='recovery'?Math.sin(Math.PI*clamp(progress*3)):0;
 const travel=-2.2*hold-2*kick;
 return {family:'void_orb',ranged:true,upright:true,bodyPivot:{x:0,y:-9},drawFacingX:actor.presentationFacingX===-1?-1:1,
  phase:r.phase,progress,charge:r.phase==='windup'?hold:0,
  release:r.phase==='recovery'?Math.max(0,1-(tick-r.phaseStartedTick)/3):0,
  recovery:r.phase==='recovery'?1-progress:0,hold,kick,direction,
  body:{x:direction.x*travel,y:direction.y*travel-.7*hold,rotation:-direction.x*.07*hold,
   scaleX:1-.11*hold+.07*kick,scaleY:1+.08*hold-.04*kick},
  limb:{extension:0,sweep:0,open:hold}};
}

export function voidOrbMotionV4(m,time){
 const cast=m.rangedPose,hold=cast?.hold??0,kick=cast?.kick??0;
 let aim={x:1,y:0};
 if(cast){
  // Undo the renderer's lean, stretch and facing mirror before aiming the
  // attached aperture. Keep the whole body upright, even when firing south.
  const co=Math.cos(cast.body.rotation),si=Math.sin(cast.body.rotation);
  const x=(co*cast.direction.x+si*cast.direction.y)/cast.body.scaleX*cast.drawFacingX;
  const y=(-si*cast.direction.x+co*cast.direction.y)/cast.body.scaleY;
  const angle=Math.atan2(y,x)*hold;aim={x:Math.cos(angle),y:Math.sin(angle)};
 }
 return {cx:m.x+m.w/2,cy:m.y+m.h/2+Math.sin(time/150)*4,hold,kick,aim,
  orbitAngle:-.32+Math.sin(time/2400)*.06+hold*.06,
  orbitX:26-3*hold+kick,orbitY:10.5-.8*hold+.5*kick,
  aperture:{x:aim.x*2.4*hold,y:aim.y*2.4*hold,radius:13.2+.3*hold-.25*kick}};
}

function contour(c){c.strokeStyle=INK;c.lineWidth=CONTOUR;}
export function voidOrbRingSampleV4(q,time,seed,angle){
 const co=Math.cos(angle),si=Math.sin(angle),nx=co/q.orbitX,ny=si/q.orbitY,length=Math.hypot(nx,ny);
 return {x:co*q.orbitX,y:si*q.orbitY,nx:nx/length,ny:ny/length,
  halfWidth:1.6+.3*Math.sin(angle*3-time/850+(seed%13)*.2)+.15*Math.sin(angle*7+time/1300)};
}

function ringCurrent(c,q,time,seed,offset,span,width,color){
 const start=time/1000+(seed%17)*.19+offset;
 c.beginPath();
 for(let side=0;side<2;side++)for(let i=0;i<=24;i++){
  const progress=(side?24-i:i)/24,a=start+span*progress,p=voidOrbRingSampleV4(q,time,seed,a);
  const w=Math.sin(Math.PI*progress)*width*(side?-.45:.55),x=p.x+p.nx*w,y=p.y+p.ny*w;
  if(side===0&&i===0)c.moveTo(x,y);else c.lineTo(x,y);
 }
 c.closePath();c.fillStyle=color;c.fill();
}

function orbitHalf(c,q,time,seed,front,flash){
 c.save();c.rotate(q.orbitAngle);
 const start=front?0:Math.PI,end=start+Math.PI;
 // Confine the nebula to a narrow annulus. The accepted silhouette and all
 // five matter orbits stay fixed; only this ring's material is revised.
 c.beginPath();
 for(let side=0;side<2;side++)for(let i=0;i<=40;i++){
  const a=start+(end-start)*(side?40-i:i)/40,p=voidOrbRingSampleV4(q,time,seed,a);
  const width=p.halfWidth*(side?-1:1),x=p.x+p.nx*width,y=p.y+p.ny*width;
  if(side===0&&i===0)c.moveTo(x,y);else c.lineTo(x,y);
 }
 c.closePath();c.fillStyle=flash?'#ffffff':front?'#472064':'#2c153e';
 c.save();c.shadowColor='#a752ed';c.shadowBlur=2;c.fill();c.restore();
 c.strokeStyle=INK;c.lineWidth=.85;c.stroke();
 c.save();c.beginPath();c.rect(-40,front?0:-40,80,40);c.clip();
 ringCurrent(c,q,time,seed,0,2.2,2.3,flash?'#ffffff':front?'#a55ce1':'#693b93');
 ringCurrent(c,q,time,seed,2.15,1.8,2.1,flash?'#ffffff':front?'#d786eb':'#8e4aa6');
 ringCurrent(c,q,time,seed,4.25,1.7,1.45,flash?'#ffffff':front?'#9c9feb':'#615b99');
 ringCurrent(c,q,time,seed,.2,1.1,.65,flash?'#ffffff':'#ebc0fa');
 c.restore();
 // Two tiny star glints drift with the energy; no large flares or curls.
 for(let n=0;n<2;n++){
  const a=time/1150+(seed%11)*.23+n*Math.PI;
  if((Math.sin(a)>=0)!==front)continue;
  const p=voidOrbRingSampleV4(q,time,seed,a),s=1.1+.3*Math.sin(time/550+n);
  c.save();c.translate(p.x,p.y);c.rotate(-q.orbitAngle);
  c.beginPath();c.moveTo(0,-s*1.4);c.lineTo(s*.23,-s*.23);c.lineTo(s,0);
  c.lineTo(s*.23,s*.23);c.lineTo(0,s*1.4);c.lineTo(-s*.23,s*.23);
  c.lineTo(-s,0);c.lineTo(-s*.23,-s*.23);c.closePath();c.fillStyle=flash?'#ffffff':'#e9d9ff';c.fill();
  c.restore();
 }
 c.restore();
}

export function voidOrbOrbitersV4(q,time,seed){
 const co=Math.cos(q.orbitAngle),si=Math.sin(q.orbitAngle);
 return Array.from({length:5},(_,n)=>{
  const angle=time/700+(seed%19)*.13+n*TAU/5+q.hold*.3;
  const u=Math.cos(angle)*q.orbitX,v=Math.sin(angle)*q.orbitY;
  return {x:co*u-si*v,y:si*u+co*v,depth:Math.sin(angle),angle,
   kind:n===0||n===3?'fragment':'mote',size:n===0?2.8:n===3?2.2:1.55};
 });
}

function orbiters(c,q,time,seed,front,flash){
 for(const p of voidOrbOrbitersV4(q,time,seed)){
  if((p.depth>=0)!==front)continue;
  c.save();c.translate(p.x,p.y);
  if(p.kind==='fragment'){
   c.rotate(q.orbitAngle+p.angle*.45);
   c.beginPath();c.moveTo(-p.size,-p.size*.2);c.lineTo(-p.size*.4,-p.size);
   c.lineTo(p.size*.7,-p.size*.6);c.lineTo(p.size,p.size*.3);c.lineTo(0,p.size);c.closePath();
   c.fillStyle=flash?'#ffffff':front?'#9360b6':'#633e84';c.fill();contour(c);c.stroke();
   c.strokeStyle=flash?'#ffffff':'#d3a0eb';c.lineWidth=.8;
   c.beginPath();c.moveTo(-p.size*.4,-p.size*.55);c.lineTo(p.size*.4,-p.size*.3);c.stroke();
  }else{
   c.beginPath();c.ellipse(0,0,p.size*1.5,p.size*.8,q.orbitAngle+p.angle,0,TAU);
   c.fillStyle=flash?'#ffffff':front?'#efc1ff':'#ad73ce';c.fill();
   c.strokeStyle=INK;c.lineWidth=1;c.stroke();
  }
  c.restore();
 }
}

export function drawVoidOrbV4(c,m,time,seed){
 const q=voidOrbMotionV4(m,time),flash=m.flashTimer>0;
 c.save();c.translate(q.cx,q.cy);c.lineJoin='round';c.lineCap='round';
 orbitHalf(c,q,time,seed,false,flash);orbiters(c,q,time,seed,false,flash);
 c.save();c.translate(q.aperture.x,q.aperture.y);
 const r=q.aperture.radius;
 // A round unlit event horizon. No facets, surface shading or appendages.
 c.beginPath();c.arc(0,0,r+1.8,0,TAU);
 c.save();c.strokeStyle=flash?'#ffffff':'#b064df';c.lineWidth=2.2;
 c.shadowColor='#a750e5';c.shadowBlur=3.5+q.hold*2;c.stroke();c.restore();
 c.fillStyle='#07050f';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();contour(c);c.stroke();
 c.strokeStyle=flash?'#ffffff':'#e0a4f4';c.lineWidth=.85;
 c.beginPath();c.arc(0,0,r+2,-2.7,-1.35);c.stroke();
 c.restore();
 orbitHalf(c,q,time,seed,true,flash);orbiters(c,q,time,seed,true,flash);
 c.restore();
}
