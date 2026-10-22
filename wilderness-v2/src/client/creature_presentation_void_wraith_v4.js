// Client-only living shade: one flowing body, a void eye and soft spectral arms.
// One real hand commits to the existing melee hit while the other guards.
const SCALE=.78,INK='#11151a',LINE=1.26/SCALE,BONE=12;
const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const turn=x=>Math.atan2(Math.sin(x),Math.cos(x));
const mix=(a,b,w)=>a+(b-a)*w;
const blend=(a,b,w)=>({x:mix(a.x,b.x,w),y:mix(a.y,b.y,w)});
const color=(flash,hex)=>flash?'#fff':hex;

function local(a,p){
 const b=a.body,v=a.bodyPivot,size=a.voidWraithScale??1,facing=a.idleFacingX??1;
 const x=p.x-b.x-v.x,y=p.y-b.y-v.y,co=Math.cos(b.rotation),si=Math.sin(b.rotation);
 return {x:((co*x+si*y)/b.scaleX+v.x)/(SCALE*size)*facing,
  y:((-si*x+co*y)/b.scaleY+v.y)/(SCALE*size)};
}
function elbow(root,wrist,side){
 const x=wrist.x-root.x,y=wrist.y-root.y,d=Math.hypot(x,y);
 if(d<1e-6)return {x:root.x+side*BONE,y:root.y};
 const h=Math.sqrt(Math.max(0,BONE*BONE-d*d/4));
 return {x:root.x+x/2+y/d*h*side,y:root.y+y/2-x/d*h*side};
}

export function voidWraithMotionV4(m,time,seed=0){
 const x=m.x+m.w/2,y=m.y+m.h/2-4+Math.sin(time/180)*3.5,a=m.familyAttack;
 const weight=a?.artWeight??0,strike=a?.strikeBlend??0,reach=a?.phase==='recovery'?strike*strike:strike;
 let aimAngle=0,lead=1;
 if(a){const o=local(a,{x:0,y:0}),v=local(a,a.direction);aimAngle=Math.atan2(v.y-o.y,v.x-o.x);lead=Math.cos(aimAngle)>=-1e-8?1:-1;}
 const rake=a?.phase==='impact'?smooth(a.progress):a?.phase==='recovery'?1:0;
 const arms=[-1,1].map(side=>{
  const attacking=!!a&&side===lead,root={x:x+side*8,y:y-2};
  const idleAngle=side>0?1.05:Math.PI-1.05;
  const idle={x:x+side*(16+Math.sin(time/330+side)*.35),y:y+8+Math.sin(time/370+side)*.4};
  const brace=side===lead?{x:x+side*18,y:y-8}:{x:x+side*13,y:y+1};
  let wrist=blend(idle,brace,weight),angle=idleAngle,goals=null;
  if(attacking){
   const d=a.direction,n={x:-d.y,y:d.x},sweep=mix(4,-4,rake);
   const center={x:d.x*a.contactReach+n.x*sweep,y:d.y*a.contactReach-8+n.y*sweep};
   const tip=local(a,center);angle=idleAngle+turn(aimAngle-idleAngle)*weight;
   wrist=blend(wrist,{x:tip.x-Math.cos(angle)*7.5,y:tip.y-Math.sin(angle)*7.5},reach);
   goals=[-1,0,1].map(i=>local(a,{x:center.x+n.x*i*1.8,y:center.y+n.y*i*1.8}));
  }
  const aim={x:Math.cos(angle),y:Math.sin(angle)},normal={x:-Math.sin(angle),y:Math.cos(angle)};
  const fingers=[-1,0,1].map((i,k)=>{
   const p={x:wrist.x+aim.x*(7.5-Math.abs(i)*.8)+normal.x*i*2.8,y:wrist.y+aim.y*(7.5-Math.abs(i)*.8)+normal.y*i*2.8};
   return goals?blend(p,goals[k],reach):p;
  });
  return {side,attacking,root,wrist,elbow:elbow(root,wrist,side),aim,normal,fingers};
 });
 return {x,y,weight,strike,drift:Math.sin(time/330+(seed%13)*.17)*1.6,arms};
}


function body(c,{x,y,drift:s}){
 c.beginPath();c.moveTo(x-9,y-9);c.quadraticCurveTo(x-10,y-16,x-5,y-17);
 c.quadraticCurveTo(x-8,y-22,x-5,y-24);c.quadraticCurveTo(x-2,y-17,x+5,y-17);
 c.quadraticCurveTo(x+14,y-12,x+13,y-3);c.quadraticCurveTo(x+13,y+4,x+8,y+8);
 c.quadraticCurveTo(x+6,y+10,x+8+s*.35,y+13);c.quadraticCurveTo(x+1,y+12,x,y+8);
 c.quadraticCurveTo(x-3,y+17,x-10+s*.5,y+17);c.quadraticCurveTo(x-7,y+10,x-10,y+5);
 c.quadraticCurveTo(x-14,y-2,x-9,y-9);c.closePath();
}
function armPath(c,{root:r,elbow:e,wrist:w,normal:n,side}){
 c.beginPath();c.moveTo(r.x,r.y-3.2);
 c.quadraticCurveTo(e.x+side*1.5,e.y-3,w.x+n.x*2.2,w.y+n.y*2.2);
 c.lineTo(w.x-n.x*2.2,w.y-n.y*2.2);
 c.quadraticCurveTo(e.x-side*1.5,e.y+3,r.x,r.y+3.2);c.closePath();
}
function arm(c,a,flash){
 const {root:r,elbow:e,wrist:w,normal:n}=a;
 armPath(c,a);c.fillStyle=color(flash,'#1b0a2a');c.fill();
 if(!flash){
  c.save();armPath(c,a);c.clip();c.fillStyle='#4b1a64';c.beginPath();
  c.moveTo(r.x,r.y-3.2);c.quadraticCurveTo(e.x,e.y-3,w.x+n.x*2.2,w.y+n.y*2.2);
  c.lineTo(w.x,w.y);c.quadraticCurveTo(e.x,e.y,r.x,r.y);c.closePath();c.fill();c.restore();
 }
 armPath(c,a);c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
}
function hand(c,a,flash){
 const {wrist:w,aim:u,normal:n,fingers:f}=a;
 const p=(forward,side)=>({x:w.x+u.x*forward+n.x*side,y:w.y+u.y*forward+n.y*side});
 const to=q=>c.lineTo(q.x,q.y);
 c.beginPath();let q=p(0,-1.8);c.moveTo(q.x,q.y);to(p(2,-3.7));
 q=p(5,-4.5);c.quadraticCurveTo(q.x,q.y,f[0].x,f[0].y);
 to(p(3,-1.3));to(f[1]);to(p(3,1));
 q=p(5,3.4);c.quadraticCurveTo(q.x,q.y,f[2].x,f[2].y);
 q=p(1.5,4);c.quadraticCurveTo(q.x,q.y,w.x+n.x*1.8,w.y+n.y*1.8);c.closePath();
 c.fillStyle=color(flash,'#36104f');c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 if(!flash){
  c.fillStyle='#63277e';c.beginPath();q=p(0,0);c.moveTo(q.x,q.y);
  to(p(3,-1));to(p(4,1));to(p(1,2.5));c.closePath();c.fill();
 }
}
function haze(c,{x,y},flash){
 const g=c.createRadialGradient(x,y+9,1,x,y+9,19);
 g.addColorStop(0,flash?'rgba(255,255,255,.16)':'rgba(142,68,173,.2)');
 g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;
 c.beginPath();c.ellipse(x,y+9,17,12,0,0,Math.PI*2);c.fill();
}
export function drawVoidWraithV4(c,m,time,seed){
 const q=voidWraithMotionV4(m,time,seed),flash=m.flashTimer>0,{x,y}=q;
 c.save();c.lineCap='round';c.lineJoin='round';haze(c,q,flash);
 for(const a of q.arms)arm(c,a,flash);
 c.fillStyle=color(flash,'#1b0a2a');body(c,q);c.fill();
 if(!flash){
  c.save();body(c,q);c.clip();c.fillStyle='#63277e';c.beginPath();
  c.moveTo(x-5,y-24);c.quadraticCurveTo(x-2,y-17,x+5,y-17);
  c.quadraticCurveTo(x-4,y-15,x-5,y-8);c.quadraticCurveTo(x-9,y-1,x-6,y+7);
  c.lineTo(x-10+q.drift*.5,y+17);c.quadraticCurveTo(x-7,y+10,x-10,y+5);
  c.quadraticCurveTo(x-14,y-2,x-9,y-9);c.quadraticCurveTo(x-10,y-16,x-5,y-17);
  c.quadraticCurveTo(x-8,y-22,x-5,y-24);c.closePath();c.fill();
  c.fillStyle='#0d0217';c.beginPath();c.moveTo(x+5,y-17);
  c.quadraticCurveTo(x+14,y-12,x+13,y-3);c.quadraticCurveTo(x+13,y+4,x+8,y+8);
  c.quadraticCurveTo(x+6,y+10,x+8+q.drift*.35,y+13);c.quadraticCurveTo(x+1,y+12,x,y+8);
  c.quadraticCurveTo(x+4,y+4,x+4,y-3);c.closePath();c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;body(c,q);c.stroke();
 if(!flash){
  c.fillStyle='#0b0113';c.beginPath();c.ellipse(x,y-6.5,5.5,7.2,0,0,Math.PI*2);c.fill();
  c.save();c.fillStyle='#e84393';c.shadowColor='#e84393';c.shadowBlur=6;
  c.beginPath();c.ellipse(x,y-6.5,3.2,4.5,0,0,Math.PI*2);c.fill();c.restore();
  c.fillStyle='#11051d';c.beginPath();c.ellipse(x,y-6.5,1.05,2.9,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ff9acb';c.beginPath();c.arc(x-1,y-8.2,.6,0,Math.PI*2);c.fill();
 }
 for(const a of q.arms)hand(c,a,flash);
 c.restore();
}
