// Client-only holographic cowl and two attached arms. The leading energy claw
// reaches World's existing contact point; this painter never creates a hit.
const SCALE=.82,LINE=1.26/SCALE,INK='#11151a',BONE=11.5;
const mix=(a,b,w)=>a+(b-a)*w;
const blend=(a,b,w)=>({x:mix(a.x,b.x,w),y:mix(a.y,b.y,w)});
const turn=v=>Math.atan2(Math.sin(v),Math.cos(v));
const smooth=v=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
const color=(flash,hex)=>flash?'#fff':hex;
const hash=v=>{v^=v>>>16;v=Math.imul(v,0x7feb352d);v^=v>>>15;v=Math.imul(v,0x846ca68b);return(v^(v>>>16))>>>0;};

function local(a,p){
 const b=a.body,v=a.bodyPivot,size=a.cyberWraithScale??1,facing=a.idleFacingX??1;
 const x=p.x-b.x-v.x,y=p.y-b.y-v.y,co=Math.cos(b.rotation),si=Math.sin(b.rotation);
 // Invert the host's body, elite, facing, drawOffset (0,-8), then .82 scale.
 return {x:((co*x+si*y)/b.scaleX+v.x)/(SCALE*size)*facing,
  y:(((-si*x+co*y)/b.scaleY+v.y)/size+8)/SCALE};
}
function elbow(r,w,side){
 const x=w.x-r.x,y=w.y-r.y,d=Math.hypot(x,y);
 if(d<1e-6)return {x:r.x+side*BONE,y:r.y};
 const h=Math.sqrt(Math.max(0,BONE*BONE-d*d/4));
 return {x:r.x+x/2+y/d*h*side,y:r.y+y/2-x/d*h*side};
}

export function cyberWraithMotionV4(m,time,seed=0){
 const j=hash((seed>>>0)^Math.floor(time/80)),glitch=(j&31)===0;
 const x=m.x+m.w/2+(glitch?((j>>>5)%5-2)*.5:0);
 const y=m.y+m.h/2+Math.sin(time/150)*3+(glitch?((j>>>9)%3-1)*.5:0);
 const a=m.familyAttack,weight=a?.artWeight??0,strike=a?.strikeBlend??0;
 const reach=a?.phase==='recovery'?strike*strike:strike;
 let aimAngle=0,lead=1;
 if(a){const o=local(a,{x:0,y:0}),v=local(a,a.direction);aimAngle=Math.atan2(v.y-o.y,v.x-o.x);lead=Math.cos(aimAngle)>=-1e-8?1:-1;}
 const rake=a?.phase==='impact'?smooth(a.progress):a?.phase==='recovery'?1:0;
 const arms=[-1,1].map(side=>{
  const attacking=!!a&&side===lead,root={x:x+side*7,y:y-1};
  const idleAngle=side>0?1:Math.PI-1;
  const idle={x:x+side*(13+Math.sin(time/330+side)*.3),y:y+8+Math.sin(time/370+side)*.4};
  const brace=side===lead?{x:x+side*15,y:y-5}:{x:x+side*12,y:y+3};
  let wrist=blend(idle,brace,weight),angle=idleAngle,goals=null;
  if(attacking){
   const d=a.direction,n={x:-d.y,y:d.x},sweep=mix(3,-3,rake);
   const center={x:d.x*a.contactReach+n.x*sweep,y:d.y*a.contactReach-17.84+n.y*sweep};
   const tip=local(a,center);angle=idleAngle+turn(aimAngle-idleAngle)*weight;
   wrist=blend(wrist,{x:tip.x-Math.cos(angle)*6.5,y:tip.y-Math.sin(angle)*6.5},reach);
   goals=[-1,1].map(i=>local(a,{x:center.x+n.x*i*1.5,y:center.y+n.y*i*1.5}));
  }
  const aim={x:Math.cos(angle),y:Math.sin(angle)},normal={x:-Math.sin(angle),y:Math.cos(angle)};
  const tips=[-1,1].map((i,k)=>{
   const p={x:wrist.x+aim.x*6.5+normal.x*i*1.8,y:wrist.y+aim.y*6.5+normal.y*i*1.8};
   return goals?blend(p,goals[k],reach):p;
  });
  return {side,attacking,root,wrist,elbow:elbow(root,wrist,side),aim,normal,tips};
 });
 return {x,y,glitch,visorHeight:Math.max(1,2-(a?.limb.open??0)),arms};
}

function cowl(c,{x,y}){
 c.beginPath();c.arc(x,y-9,7.5,Math.PI,0);c.lineTo(x+8,y+2);
 c.quadraticCurveTo(x+6.5,y+9,x,y+15);c.quadraticCurveTo(x-6.5,y+9,x-8,y+2);
 c.lineTo(x-7.5,y-9);c.closePath();
}
function sleevePath(c,{root:r,elbow:e,wrist:w,normal:n,side}){
 c.beginPath();c.moveTo(r.x,r.y-2.6);
 c.quadraticCurveTo(e.x+side,e.y-2.6,w.x+n.x*1.6,w.y+n.y*1.6);
 c.lineTo(w.x-n.x*1.6,w.y-n.y*1.6);
 c.quadraticCurveTo(e.x-side,e.y+2.6,r.x,r.y+2.6);c.closePath();
}
function sleeve(c,a,flash){
 const {root:r,elbow:e,wrist:w,normal:n}=a;
 sleevePath(c,a);c.fillStyle=color(flash,'#103a50');c.fill();
 if(!flash){
  c.save();sleevePath(c,a);c.clip();c.fillStyle='#36778a';c.beginPath();
  c.moveTo(r.x,r.y-2.6);c.quadraticCurveTo(e.x,e.y-2.6,w.x+n.x*1.6,w.y+n.y*1.6);
  c.lineTo(w.x,w.y);c.quadraticCurveTo(e.x,e.y,r.x,r.y);c.closePath();c.fill();c.restore();
 }
 sleevePath(c,a);c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
}
function claw(c,a,flash){
 const {wrist:w,aim:u,normal:n,tips:t}=a;
 const p=(f,s)=>({x:w.x+u.x*f+n.x*s,y:w.y+u.y*f+n.y*s});
 const line=q=>c.lineTo(q.x,q.y);
 let q=p(0,-1.5);c.beginPath();c.moveTo(q.x,q.y);line(p(2,-3));
 q=p(5.5,-3);c.quadraticCurveTo(q.x,q.y,t[0].x,t[0].y);
 line(p(3.6,0));line(t[1]);q=p(3,3);
 c.quadraticCurveTo(q.x,q.y,w.x+n.x*1.5,w.y+n.y*1.5);c.closePath();
 c.fillStyle=color(flash,'#7ce7f8');c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 if(!flash){
  c.fillStyle='#1595b1';c.beginPath();q=p(0,-1.5);c.moveTo(q.x,q.y);
  line(p(3.6,0));line(p(1,1.8));line(p(0,1.5));c.closePath();c.fill();
 }
}
function trail(c,{x,y},flash){
 c.fillStyle=color(flash,'rgba(0,210,255,.16)');c.strokeStyle=color(flash,'rgba(0,210,255,.55)');c.lineWidth=.9;
 c.beginPath();c.moveTo(x-8,y+5);c.quadraticCurveTo(x-12,y+12,x-9,y+17);
 c.lineTo(x-7,y+17);c.lineTo(x-7,y+22);c.lineTo(x-4,y+22);c.lineTo(x-4,y+26);
 c.lineTo(x-1,y+26);c.lineTo(x-1,y+20);c.lineTo(x+1.5,y+20);c.lineTo(x+1.5,y+24);
 c.lineTo(x+5,y+24);c.lineTo(x+5,y+18);c.lineTo(x+8,y+18);
 c.quadraticCurveTo(x+12,y+12,x+8,y+5);c.closePath();c.fill();c.stroke();
 if(!flash){
  c.fillStyle='rgba(0,210,255,.22)';c.beginPath();c.moveTo(x-5,y+9);
  c.lineTo(x-1,y+13);c.lineTo(x-1,y+20);c.lineTo(x-4,y+20);c.closePath();c.fill();
 }
}

export function drawCyberWraithV4(c,m,time,seed){
 const q=cyberWraithMotionV4(m,time,seed),flash=m.flashTimer>0,{x,y}=q;
 c.save();c.lineJoin='round';c.lineCap='round';trail(c,q,flash);
 for(const a of q.arms)sleeve(c,a,flash);
 cowl(c,q);c.fillStyle=color(flash,'#0f172a');c.fill();
 if(!flash){
  c.save();cowl(c,q);c.clip();c.fillStyle='#225c70';c.beginPath();
  c.moveTo(x,y-16.5);c.quadraticCurveTo(x-6,y-14,x-5,y-6);
  c.lineTo(x-4,y+4);c.lineTo(x,y+15);c.quadraticCurveTo(x-6.5,y+9,x-8,y+2);
  c.lineTo(x-7.5,y-9);c.quadraticCurveTo(x-7.5,y-16.5,x,y-16.5);c.closePath();c.fill();
  c.fillStyle='#070e1b';c.beginPath();c.moveTo(x+3,y-15);c.quadraticCurveTo(x+9,y-11,x+8,y+2);
  c.quadraticCurveTo(x+6.5,y+9,x,y+15);c.lineTo(x+3,y+3);c.closePath();c.fill();c.restore();
 }
 cowl(c,q);c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 if(!flash){
  c.strokeStyle='#00d2ff';c.lineWidth=1.1;c.beginPath();c.moveTo(x-5.8,y-6);
  c.quadraticCurveTo(x-6.5,y-14,x-.5,y-14.7);c.quadraticCurveTo(x+5,y-14.7,x+5.8,y-8);c.stroke();
  c.fillStyle='#080d19';c.fillRect(x-5,y-11.2,10,4.4);
  c.save();c.fillStyle='#ff007f';c.shadowColor='#ff007f';c.shadowBlur=3;
  c.fillRect(x-4,y-10,8,q.visorHeight);c.restore();
  c.fillStyle='#00d2ff';c.beginPath();c.moveTo(x-4.8,y+1);c.lineTo(x-4.1,y+4);
  c.lineTo(x-.7,y+9);c.lineTo(x-2.4,y+3.5);c.closePath();c.fill();
  if(q.glitch){
   c.strokeStyle='#ff65af';c.lineWidth=1;c.beginPath();c.moveTo(x-9,y-3);c.lineTo(x+6,y-3);
   c.moveTo(x-4,y+8);c.lineTo(x+9,y+8);c.stroke();
  }
 }
 for(const a of q.arms)claw(c,a,flash);
 c.restore();
}
