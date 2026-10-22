// A celestial construct with six articulated supports and a separate weaving
// claw assembly. All motion is cosmetic and uses the supplied presentation clock.
const TAU=Math.PI*2,INK='#11151a',LINE=1.26/.78;
const color=(flash,hex)=>flash?'#fff':hex;
const clamp=x=>Math.max(0,Math.min(1,x));
function polygon(c,points,fill,outline=false){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}

export function starWeaverWalkingLegsV4(time,seed,walk=0){
 const blend=clamp(walk),legs=[],roots=[-6,-2,4],knees=[-14,1,14],feet=[-20,-5,13],kneeY=[10.5,15,11.5],footY=[18.5,22.5,19];
 for(const side of [-1,1])for(let row=0;row<3;row++){
  // Alternating tripods sweep and lift; a slower, smaller flex stays visible
  // while idle. No accumulated animation state can alter the saved actor.
  const phase=time/170+(row%2?Math.PI:0)+(side===1?Math.PI:0)+(seed%7)*.31;
  const idle=Math.sin(time/490+row*1.6+side*.8+(seed%11)*.43),step=Math.sin(phase)*3.2*blend,lift=Math.max(0,Math.cos(phase))*2.6*blend;
  legs.push({root:{x:roots[row],y:side*(row===1?6:4.5)},
   joint:{x:knees[row]+step*.38+idle*.8*(1-blend),y:side*(kneeY[row]-lift*.5+idle*.7*(1-blend))},
   foot:{x:feet[row]+step+idle*.38*(1-blend),y:side*(footY[row]-lift+idle*.24*(1-blend))}});
 }
 return legs;
}
function bone(c,a,b,rootWidth,tipWidth,flash){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;
 polygon(c,[[a.x+nx*rootWidth,a.y+ny*rootWidth],[b.x+nx*tipWidth,b.y+ny*tipWidth],[b.x-nx*tipWidth,b.y-ny*tipWidth],[a.x-nx*rootWidth,a.y-ny*rootWidth]],color(flash,'#69afd9'),true);
 // One broad lit plane, with the opposite edge left in the base blue.
 polygon(c,[[a.x+nx*rootWidth*.65,a.y+ny*rootWidth*.65],[b.x+nx*tipWidth*.4,b.y+ny*tipWidth*.4],[b.x,b.y],[a.x,a.y]],color(flash,'#b9e6fa'));
}
function walking(c,m,time,seed,cx,cy){
 const at=p=>({x:cx+p.x,y:cy+p.y});
 c.save();c.lineJoin='round';
 for(const l of starWeaverWalkingLegsV4(time,seed,m.motionBlend??0)){
  bone(c,at(l.joint),at(l.foot),1.25,.45,m.flashTimer);
  bone(c,at(l.root),at(l.joint),1.9,1.25,m.flashTimer);
  c.fillStyle=color(m.flashTimer,'#3875a5');c.strokeStyle=INK;c.lineWidth=LINE;
  c.beginPath();c.arc(cx+l.joint.x,cy+l.joint.y,1.6,0,TAU);c.fill();c.stroke();
 }
 c.restore();
}
function head(c,scale,flash){
 c.save();c.scale(scale,scale);
 // A compact faceted visor, rather than a natural spider's head and fangs.
 polygon(c,[[5,-3.6],[10.5,-4.2],[14,-1.8],[14,1.8],[10.5,4.2],[5,3.6]],color(flash,'#5ca9db'),true);
 polygon(c,[[5,0],[14,0],[14,1.8],[10.5,4.2],[5,3.6]],color(flash,'#2e5e91'));
 polygon(c,[[5.8,-2.8],[10.5,-3.3],[12,-2.2],[7.3,-1.5]],color(flash,'#b9e6fa'));
 for(const side of [-1,1]){
  c.fillStyle=color(flash,'#153a59');c.beginPath();c.ellipse(11,side*1.55,1.85,1.2,0,0,TAU);c.fill();
  c.fillStyle=color(flash,'#c1f7ff');c.beginPath();c.ellipse(11.3,side*1.55,1.15,.65,0,0,TAU);c.fill();
 }
 c.restore();
}
function claws(c,tip,open,scale,flash){
 c.save();c.lineJoin='round';
 for(const side of [-1,1]){
  const root={x:6.6*scale,y:side*4.4*scale},joint={x:10.8*scale+(tip-13.2*scale)*.2,y:side*(5.4+2.3*open)*scale},end={x:tip,y:side*(.25+.85*open)*scale};
  // Two blue jointed tools close together at contact; the support legs never
  // disappear or become the attacking claws.
  c.save();c.scale(scale,scale);
  bone(c,{x:root.x/scale,y:root.y/scale},{x:joint.x/scale,y:joint.y/scale},1.55,1.15,flash);
  polygon(c,[[joint.x/scale-1.2,joint.y/scale],[joint.x/scale+1.1,joint.y/scale+side*.9],[end.x/scale,end.y/scale],[end.x/scale-2.4,side*.2],[joint.x/scale-1.2,joint.y/scale-side*1.1]],color(flash,'#69afd9'),true);
  polygon(c,[[joint.x/scale,joint.y/scale-side*.65],[end.x/scale,end.y/scale],[end.x/scale-2.4,side*.2]],color(flash,'#d3f0ff'));
  c.fillStyle=color(flash,'#3875a5');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(joint.x/scale,joint.y/scale,1.3,0,TAU);c.fill();c.stroke();
  c.restore();
 }
 c.restore();
}
export function drawStarWeaverV4(c,m,time,seed){
 const cx=m.x+m.w/2,cy=m.y+m.h/2,flash=m.flashTimer;
 c.save();c.lineJoin='round';walking(c,m,time,seed,cx,cy);c.translate(cx,cy);
 // A single dimensional crystal shell retains the old celestial silhouette.
 // Facets follow its volume; the inset star replaces the large floating dots.
 const shell=[[-11,0],[-7,-8],[0,-12.5],[7.5,-7.5],[10,0],[5.5,9],[-4,10],[-9,5]];
 polygon(c,shell,color(flash,'#5ca9db'));
 polygon(c,[[-11,0],[-3,1],[5.5,9],[-4,10],[-9,5]],color(flash,'#2e5e91'));
 polygon(c,[[-7,-8],[0,-12.5],[7.5,-7.5],[-3,1]],color(flash,'#b9e6fa'));
 polygon(c,[[7.5,-7.5],[10,0],[5.5,9],[-3,1]],color(flash,'#4589bd'));
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(...shell[0]);for(const p of shell.slice(1))c.lineTo(...p);c.closePath();c.stroke();
 polygon(c,[[-6,-.3],[-1.7,-5.8],[3.4,-1],[.4,5.4]],color(flash,'#244f78'),true);
 polygon(c,[[-2,-4.4],[-.9,-1.5],[1.9,-.5],[-.6,.6],[.1,3.8],[-2.1,1.1],[-4.8,.3],[-2.8,-1]],color(flash,'#c8f5ff'));
 if(!m.familyAttack){head(c,1,flash);claws(c,13.2/.78,.1,1,flash);}
 c.restore();
}
export function drawStarWeaverAttackV4(c,pose,flash=false){
 if(pose?.family!=='star_weaver')return false;
 const facing=pose.idleFacingX??1,size=pose.starWeaverScale??1,localAim=Math.atan2(pose.direction.y,pose.direction.x*facing),angle=localAim*pose.artWeight;
 c.save();c.translate(pose.lunge.x+pose.bodyPivot.x,pose.lunge.y+pose.bodyPivot.y);c.scale(facing,1);c.rotate(angle);
 const tip=pose.limb.extension+13.2*(size-1)*(1-pose.artWeight);
 head(c,.78*size,flash);claws(c,tip,pose.limb.open,.78*size,flash);c.restore();return true;
}
