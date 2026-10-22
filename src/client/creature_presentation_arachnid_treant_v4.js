// Body art only. The boss adapter owns shadows, shields, defeat fade and HUD.
// A low root abdomen supports a short twisted trunk and one connected canopy.
const TAU=Math.PI*2,INK='#11151a',LINE=1.26;
const BARK='#71503a',DARK='#433025',LIGHT='#a8784d';
const MOSS='#568347',MOSS_LIGHT='#8ab75c',MOSS_DARK='#315437',EYE='#a0ed75';
const EYES=Object.freeze([[-6,-34,2.5],[3.5,-34,2.7],[-8,-39.5,1.4],[5,-39.5,1.4],[-1.5,-42,1.4],[9.5,-29.8,1.4]].map(Object.freeze));
const LEGS=Object.freeze([
 [[9,-24],[29,-34],[37,-17],[42,-13]],
 [[17,-18],[42,-22],[51,-3],[55,0]],
 [[19,-7],[42,-4],[46,15],[51,19]],
 [[11,0],[27,7],[24,27],[29,31]]
].map(row=>Object.freeze(row.map(Object.freeze))));
const color=(flash,hex)=>flash?'#fff':hex;
const point=(x,y)=>({x,y});
const normal=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;return {x:-dy/d,y:dx/d};};
const offset=(p,n,r)=>point(p.x+n.x*r,p.y+n.y*r);
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const p=clamp(n);return p*p*(3-2*p);};
const mixPoint=(a,b,t)=>point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);

// A strike has no authority wind-up. This pose starts at contact and only adds
// follow-through. The cached origin/target lock the choice of leg for this hit.
// chosenLeg.side names the world-facing half of the footprint, before mirroring.
export function treantStrikePose(actor,tick){
 const retained=actor.boss?.meleePresentation,last=actor.boss?.lastAction;
 const action=retained?.ability==='strike'?retained:last?.ability==='strike'?last:null;
 if(actor.alive===false||!action||!Number.isFinite(action.resolvedTick))return null;
 const age=tick-action.resolvedTick,origin=action.originPosition??actor.position,target=action.targetPosition;
 if(age<0||age>=24||!finitePoint(origin)||!finitePoint(target))return null;
 const dx=target.x-origin.x,dy=target.y-origin.y,length=Math.hypot(dx,dy);
 const direction=length>.001?point(dx/length,dy/length):point(1,0);
 let chosenLeg=null,best=-Infinity;
 // Match the actual spread of the eight planted feet, rather than rotating the
 // whole creature. Equal scores have a stable right-side tie break.
 for(const side of [1,-1])for(let index=0;index<LEGS.length;index++){
  const foot=LEGS[index][3],distance=Math.hypot(foot[0],foot[1]);
  const score=(side*foot[0]*direction.x+foot[1]*direction.y)/distance;
  if(score>best+1e-9){best=score;chosenLeg={index,side};}
 }
 const jab=1-smooth((age-3)/14),contact=1-smooth((age-2)/6);
 const recoil=Math.sin(Math.PI*clamp((age-5)/19));
 return {age,resolvedTick:action.resolvedTick,originPosition:{...origin},targetPosition:{...target},direction,chosenLeg,
  jab,contact,brace:1-smooth((age-15)/9),bodyShift:contact*3.2-recoil*1.6};
}

export function arachnidTreantAnatomyV4(tick,moving=false){
 const legs=[];
 for(let index=0;index<4;index++)for(const side of [-1,1]){
  // Alternating groups move continuously. Idle feet remain planted.
  const phase=tick*.105+index*Math.PI*.66+(side<0?Math.PI:0);
  const stride=moving?Math.sin(phase)*2.4:0,lift=moving?Math.max(0,Math.cos(phase))*2:0;
  const [r,k,a,f]=LEGS[index];
  const root=point(side*r[0],r[1]);
  const knee=point(side*(k[0]+Math.sin(phase)*(moving?1.2:.35)),k[1]+stride*.3);
  const ankle=point(side*a[0],a[1]+stride-lift);
  const foot=point(side*f[0],f[1]+stride-lift);
  legs.push({index,side,root,knee,ankle,foot});
 }
 return {legs,eyes:EYES};
}
function strikeAnatomy(actor,tick,strike,facing){
 const live=arachnidTreantAnatomyV4(tick,!!actor.movedLastTick);
 if(!strike)return live;
 const planted=arachnidTreantAnatomyV4(strike.resolvedTick,false),direction=point(strike.direction.x*facing,strike.direction.y);
 const body=point(direction.x*strike.bodyShift,direction.y*strike.bodyShift*.6);
 const side=strike.chosenLeg.side*facing,target=point((strike.targetPosition.x-actor.position.x)*facing,strike.targetPosition.y-actor.position.y-10);
 const legs=live.legs.map((l,i)=>{
  const rest=planted.legs[i],posed={...l};
  for(const name of ['root','knee','ankle','foot'])posed[name]=mixPoint(l[name],rest[name],strike.brace);
  posed.root=point(posed.root.x+body.x,posed.root.y+body.y);
  if(l.index!==strike.chosenLeg.index||l.side!==side)return posed;
  // Fold one existing root limb up toward the contact point. Its knee stays
  // outboard, keeping three readable joints instead of extending a rubber arm.
  const knee=point((posed.root.x+target.x)*.5+side*18,(posed.root.y+target.y)*.5-12);
  const ankle=point(target.x-direction.x*8,target.y-direction.y*8-3);
  posed.knee=mixPoint(posed.knee,knee,strike.jab);
  posed.ankle=mixPoint(posed.ankle,ankle,strike.jab);
  posed.foot=mixPoint(posed.foot,target,strike.jab);
  posed.striking=true;return posed;
 });
 return {legs,eyes:EYES,body,target};
}
function path(c,points){c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.closePath();}
function polygon(c,points,fill,outline=true){path(c,points);c.fillStyle=fill;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}}
function finish(c,shape,fill,flash,planes){
 shape(c);c.fillStyle=color(flash,fill);c.fill();
 if(!flash&&planes){c.save();shape(c);c.clip();planes();c.restore();}
 shape(c);c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
}
function leg(c,l,flash){
 c.save();c.scale(l.side,1);
 const local=p=>point(p.x*l.side,p.y),r=local(l.root),k=local(l.knee),a=local(l.ankle),f=local(l.foot),s=1;
 const n1=normal(r,k),n2=normal(k,a),n3=normal(a,f);
 const d=Math.hypot(n1.x+n2.x,n1.y+n2.y)||1,n={x:(n1.x+n2.x)/d,y:(n1.y+n2.y)/d};
 const outer=[offset(r,n1,-4.2),offset(k,n,-3.6),offset(a,n2,-2.3),offset(f,n3,-1.3),
  point(f.x+s*3,f.y+.8),point(f.x+s*.5,f.y+2.1),offset(f,n3,1.3),offset(a,n2,2.3),offset(k,n,3.6),offset(r,n1,4.2)];
 if(l.index===1||l.index===3)polygon(c,[point(k.x-s*2,k.y),point(k.x+s*2,k.y-6),point(k.x+s*4,k.y-6.5),point(k.x+s*3,k.y+1)],color(flash,BARK));
 polygon(c,outer,color(flash,BARK),false);
 if(!flash){
  c.save();path(c,outer);c.clip();
  polygon(c,[outer[0],outer[1],outer[2],outer[3],f,a,k,r],LIGHT,false);
  polygon(c,[r,k,a,f,outer[5],outer[6],outer[7],outer[8],outer[9]],DARK,false);
  c.restore();
 }
 // The root is buried in the abdomen. Keep the exposed outline open there.
 c.beginPath();c.moveTo(outer[0].x,outer[0].y);for(const p of outer.slice(1))c.lineTo(p.x,p.y);
 c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 if(!flash){c.strokeStyle=DARK;c.lineWidth=.9;c.beginPath();c.moveTo(k.x-s*4,k.y-1);c.quadraticCurveTo(k.x,k.y-2,k.x+s*1,k.y+3);c.stroke();}
 c.restore();
}
function abdomen(c){
 c.beginPath();c.moveTo(-19,3);c.bezierCurveTo(-30,-4,-24,-23,-15,-29);
 c.quadraticCurveTo(-8,-32,-13,-41);c.lineTo(-17,-48);c.lineTo(-12,-55);c.lineTo(-6,-48);
 c.lineTo(0,-55);c.lineTo(9,-55);c.lineTo(5,-43);
 c.quadraticCurveTo(14,-36,13,-29);c.quadraticCurveTo(24,-25,23,-18);
 c.quadraticCurveTo(30,-4,18,6);c.lineTo(10,8);c.lineTo(2,5);c.lineTo(-6,9);c.lineTo(-12,5);c.closePath();
}
function wood(c,flash){
 finish(c,abdomen,BARK,flash,()=>{
  c.fillStyle=LIGHT;c.beginPath();c.moveTo(-22,-58);c.lineTo(-9,-56);c.lineTo(-2,-42);
  c.bezierCurveTo(6,-29,-21,-22,-10,-6);c.lineTo(-7,9);c.lineTo(-32,9);c.lineTo(-28,-22);c.closePath();c.fill();
  c.fillStyle=DARK;c.beginPath();c.moveTo(9,-56);c.lineTo(23,-34);c.lineTo(31,0);c.lineTo(18,12);c.lineTo(5,9);
  c.bezierCurveTo(21,-11,-9,-16,4,-33);c.closePath();c.fill();
  c.strokeStyle=DARK;c.lineWidth=1.3;c.beginPath();c.moveTo(-2,5);c.bezierCurveTo(-10,-8,3,-10,-1,-20);c.moveTo(15,0);c.quadraticCurveTo(20,-9,13,-15);c.stroke();
 });
 // Forks visibly support the connected crown, with a few bare twig tips.
 for(const s of [-1,1]){
  polygon(c,[point(s*2,-42),point(s*7,-54),point(s*23,-61),point(s*30,-69),point(s*33,-68),point(s*26,-57),point(s*13,-49),point(s*8,-41)],color(flash,BARK));
 }
}
function canopy(c){
 c.beginPath();c.moveTo(-34,-54);c.lineTo(-30,-61);c.lineTo(-32,-65);
 c.quadraticCurveTo(-24,-72,-15,-68);c.lineTo(-13,-74);c.lineTo(-8,-73);c.lineTo(-4,-77);
 c.lineTo(2,-75);c.lineTo(5,-79);c.quadraticCurveTo(14,-76,17,-70);c.lineTo(22,-72);c.quadraticCurveTo(29,-70,31,-63);
 c.lineTo(35,-60);c.lineTo(32,-54);c.lineTo(35,-51);c.lineTo(31,-47);c.lineTo(25,-48);c.lineTo(22,-43);c.lineTo(17,-48);
 c.quadraticCurveTo(9,-43,1,-48);c.quadraticCurveTo(-8,-43,-17,-49);
 c.quadraticCurveTo(-25,-45,-34,-50);c.lineTo(-31,-53);c.closePath();
}
function crown(c,flash,tick){
 c.save();c.translate(0,-50);c.rotate(Math.sin(tick*.035)*.018);c.translate(0,50);
 finish(c,canopy,MOSS,flash,()=>{
  c.fillStyle=MOSS_LIGHT;c.beginPath();c.moveTo(-37,-61);c.quadraticCurveTo(-24,-76,-16,-67);
  c.quadraticCurveTo(-8,-80,2,-78);c.quadraticCurveTo(15,-81,21,-66);
  c.quadraticCurveTo(8,-70,5,-64);c.quadraticCurveTo(-5,-70,-13,-60);c.quadraticCurveTo(-23,-66,-37,-56);c.closePath();c.fill();
  c.fillStyle=MOSS_DARK;c.beginPath();c.moveTo(29,-69);c.quadraticCurveTo(41,-55,33,-46);c.lineTo(-36,-43);c.lineTo(-34,-53);
  c.quadraticCurveTo(-21,-47,-16,-56);c.quadraticCurveTo(-6,-47,2,-55);c.quadraticCurveTo(18,-47,23,-56);c.closePath();c.fill();
  c.strokeStyle=MOSS_DARK;c.lineWidth=1.2;c.beginPath();c.moveTo(-17,-64);c.lineTo(-12,-60);c.moveTo(8,-68);c.lineTo(12,-65);c.stroke();
 });
 c.restore();
 // Moss follows the root bulb rather than forming separate spherical bushes.
 const moss=ctx=>{ctx.beginPath();ctx.moveTo(-22,-18);ctx.quadraticCurveTo(-15,-28,-7,-25);ctx.lineTo(-4,-21);ctx.lineTo(-9,-18);ctx.lineTo(-11,-11);ctx.lineTo(-15,-15);ctx.lineTo(-21,-13);ctx.closePath();};
 finish(c,moss,MOSS,flash,()=>{polygon(c,[point(-25,-21),point(-12,-29),point(-5,-24),point(-15,-20),point(-23,-16)],MOSS_LIGHT,false);});
}
function face(c,flash,charge,snap=0){
 // Six insect eyes sit directly in the trunk's existing bark planes.
 if(!flash)for(const [x,y,r]of EYES){
  c.fillStyle=INK;c.beginPath();c.ellipse(x,y,r+1,r+.8,0,0,TAU);c.fill();
  c.save();c.shadowColor=EYE;c.shadowBlur=1.5+charge*2;c.fillStyle=EYE;c.beginPath();c.ellipse(x,y,r,r*.85,0,0,TAU);c.fill();c.restore();
  c.fillStyle='#efffc9';c.beginPath();c.arc(x-.6,y-.5,.55,0,TAU);c.fill();
 }
 // Short splinter fangs remain rooted beneath the eyes.
 for(const s of [-1,1]){
  c.save();c.translate(s*7,-25);c.rotate(s*snap*.2);c.translate(-s*7,25);
  const fang=ctx=>{ctx.beginPath();ctx.moveTo(s*5,-25);ctx.lineTo(s*10,-25);ctx.quadraticCurveTo(s*12,-19,s*5,-16);ctx.lineTo(s*7,-21);ctx.closePath();};
  finish(c,fang,LIGHT,flash);c.restore();
 }
}
function strikeContact(c,strike,target,direction){
 if(strike.age>=7)return;
 const fade=1-strike.age/7,side=point(-direction.y,direction.x);
 c.save();c.globalAlpha*=fade;c.strokeStyle='#e3bf7b';c.lineWidth=1.25;
 // A few wood splinters mark the resolved touch, with no extra damage shape.
 for(const sign of [-1,1]){
  const spread=3+strike.age*.7;
  c.beginPath();c.moveTo(target.x+side.x*sign*spread,target.y+side.y*sign*spread);
  c.lineTo(target.x+side.x*sign*(spread+3)+direction.x*2,target.y+side.y*sign*(spread+3)+direction.y*2);c.stroke();
 }
 c.restore();
}
export function drawArachnidTreantBodyV4(c,actor,tick,flash=false){
 const strike=treantStrikePose(actor,tick),facing=actor.presentationFacingX<0?-1:1;
 const q=strikeAnatomy(actor,tick,strike,facing),pending=actor.boss?.pendingAction;
 const charge=pending?Math.max(0,Math.min(1,(tick-pending.startedTick)/Math.max(1,pending.resolvesTick-pending.startedTick))):0;
 c.save();c.lineCap='round';c.lineJoin='round';
 c.scale(facing,1);
 for(const l of q.legs.filter(l=>l.index<3&&!l.striking))leg(c,l,flash);
 c.save();if(strike)c.translate(q.body.x,q.body.y);
 wood(c,flash);crown(c,flash,tick);c.restore();
 for(const l of q.legs.filter(l=>l.index===3&&!l.striking))leg(c,l,flash);
 // The attacking limb crosses the near bark plane. It is still one of the
 // original eight legs; its other seven planted feet support the small recoil.
 for(const l of q.legs.filter(l=>l.striking))leg(c,l,flash);
 c.save();if(strike)c.translate(q.body.x,q.body.y);
 face(c,flash,Math.max(charge,strike?.contact??0),strike?.contact??0);c.restore();
 if(strike)strikeContact(c,strike,q.target,point(strike.direction.x*facing,strike.direction.y));
 c.restore();
}
