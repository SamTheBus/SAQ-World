// Disposable client art. Sleeves and hands share the same continuous pose
// from idle through the committed cross-rake; host combat data stays intact.
const SCALE=.78,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const turn=x=>Math.atan2(Math.sin(x),Math.cos(x));
const mix=(a,b,w)=>a+(b-a)*w;
const pointMix=(a,b,w)=>({x:mix(a.x,b.x,w),y:mix(a.y,b.y,w)});
const color=(flash,hex)=>flash?'#fff':hex;

function toLocal(a,point){
 const b=a.body,pivot=a.bodyPivot,size=a.voidSpectreScale??1,facing=a.idleFacingX??1;
 const x=point.x-b.x-pivot.x,y=point.y-b.y-pivot.y,co=Math.cos(b.rotation),si=Math.sin(b.rotation);
 return {x:((co*x+si*y)/b.scaleX+pivot.x)/(SCALE*size)*facing,
  y:((-si*x+co*y)/b.scaleY+pivot.y)/(SCALE*size)};
}
function joint(root,wrist,side){
 const dx=wrist.x-root.x,dy=wrist.y-root.y,d=Math.hypot(dx,dy);
 const upper=15.5,lower=15.5;
 if(d<1e-6)return {x:root.x+side*upper,y:root.y};
 const along=(upper*upper-lower*lower+d*d)/(2*d);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {x:root.x+dx/d*along-dy/d*height*side,y:root.y+dy/d*along+dx/d*height*side};
}

export function voidSpectreMotionV4(m,time,seed=0){
 const x=m.x+m.w/2,y=m.y+m.h/2+Math.sin(time/150)*5,a=m.familyAttack;
 const weight=a?.artWeight??0,strike=a?.strikeBlend??0;
 const rake=a?.phase==='impact'?smooth(a.progress):a?.phase==='recovery'?1:0;
 const sway=Math.sin(time/410+(seed%13)*.17)*1.5;
 const arms=[-1,1].map(side=>{
  const root={x:x+side*8,y:y-3},idleAngle=Math.atan2(-.4,side*.9);
  const idleHand={x:x+side*(19+Math.sin(time/310+side)*.8),y:y-1+Math.sin(time/370+side)*.6};
  const braceHand={x:x+side*22,y:y-11};
  const rest=pointMix(idleHand,braceHand,weight);
  let angle=idleAngle,wrist=rest,tip={x:rest.x+Math.cos(angle)*6,y:rest.y+Math.sin(angle)*6},attackTips=null;
  if(a){
   const d=a.direction,n={x:-d.y,y:d.x},spread=side*mix(5,-5,rake);
   const center={x:d.x*a.contactReach+n.x*spread,y:d.y*a.contactReach-8+n.y*spread};
   const goal=toLocal(a,center),origin=toLocal(a,{x:0,y:0}),direction=toLocal(a,d);
   const targetAngle=Math.atan2(direction.y-origin.y,direction.x-origin.x);
   angle=idleAngle+turn(targetAngle-idleAngle)*weight;
   const forward={x:Math.cos(angle),y:Math.sin(angle)};
   const targetWrist={x:goal.x-forward.x*6,y:goal.y-forward.y*6};
   wrist=pointMix(rest,targetWrist,strike);
   attackTips=[-1,0,1].map(i=>toLocal(a,{x:center.x+n.x*i*1.25,y:center.y+n.y*i*1.25}));
   tip=goal;
  }
  const u={x:Math.cos(angle),y:Math.sin(angle)},n={x:-Math.sin(angle),y:Math.cos(angle)};
  const fingers=[-1,0,1].map((i,k)=>{
   const idle={x:wrist.x+u.x*(6-Math.abs(i)*.6)+n.x*i*1.8,y:wrist.y+u.y*(6-Math.abs(i)*.6)+n.y*i*1.8};
   return attackTips?pointMix(idle,attackTips[k],strike):idle;
  });
  return {side,root,wrist,elbow:joint(root,wrist,side),aim:u,normal:n,fingers,tip};
 });
 return {x,y,sway,weight,strike,arms};
}

function robe(c,q){
 const {x,y,sway:s}=q;
 c.beginPath();c.arc(x,y-11,8.5,Math.PI,0);
 c.lineTo(x+10,y-6);c.lineTo(x+14,y-3);c.lineTo(x+10,y);c.lineTo(x+9,y+5);
 c.quadraticCurveTo(x+9,y+10,x+12+s*.4,y+14);c.lineTo(x+5,y+11);
 c.quadraticCurveTo(x+4,y+17,x-1+s,y+20);c.lineTo(x-3,y+11);c.lineTo(x-9+s*.35,y+16);
 c.quadraticCurveTo(x-10,y+8,x-8.5,y+2);c.lineTo(x-14,y-2);c.lineTo(x-10,y-7);c.closePath();
}
function mist(c,q,flash){
 const {x,y}=q,gradient=c.createLinearGradient(x,y-14,x,y+24);
 gradient.addColorStop(0,flash?'#fff':'rgba(142,68,173,.75)');
 gradient.addColorStop(.5,flash?'rgba(255,255,255,.5)':'rgba(232,67,147,.4)');
 gradient.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gradient;
 c.beginPath();c.moveTo(x-14,y-5);c.quadraticCurveTo(x-18,y+10,x-5,y+24);
 c.lineTo(x+5,y+24);c.quadraticCurveTo(x+18,y+10,x+14,y-5);c.closePath();c.fill();
}
function sleeve(c,a,flash){
 const {root:r,elbow:e,wrist:w,normal:n}=a;
 c.beginPath();c.moveTo(r.x-2,r.y-2.5);
 c.quadraticCurveTo(e.x-3,e.y-2,w.x+n.x*2.5,w.y+n.y*2.5);
 c.lineTo(w.x-n.x*2.5,w.y-n.y*2.5);
 c.quadraticCurveTo(e.x+3,e.y+3,r.x+2,r.y+3);c.closePath();
 c.fillStyle=color(flash,'#210832');c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 c.strokeStyle=color(flash,'#6b2988');c.lineWidth=1;
 c.beginPath();c.moveTo(r.x,r.y-1);c.quadraticCurveTo(e.x,e.y,w.x,w.y);c.stroke();
}
function hand(c,a,flash){
 const {wrist:w,aim:u,normal:n}=a;
 c.beginPath();c.moveTo(w.x-n.x*2.5,w.y-n.y*2.5);
 c.lineTo(w.x+u.x*3-n.x*3,w.y+u.y*3-n.y*3);
 c.lineTo(w.x+u.x*4+n.x*2,w.y+u.y*4+n.y*2);
 c.lineTo(w.x+n.x*2.5,w.y+n.y*2.5);c.closePath();
 c.fillStyle=color(flash,'#50196c');c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 for(let i=0;i<3;i++){
  const tip=a.fingers[i],side=i-1,base={x:w.x+u.x*2+n.x*side*1.8,y:w.y+u.y*2+n.y*side*1.8};
  c.beginPath();c.moveTo(base.x-n.x*.7,base.y-n.y*.7);
  c.quadraticCurveTo(tip.x-u.x*2+n.x*1.5,tip.y-u.y*2+n.y*1.5,tip.x,tip.y);
  c.quadraticCurveTo(tip.x-u.x*1.3-n.x*.4,tip.y-u.y*1.3-n.y*.4,base.x+n.x*.7,base.y+n.y*.7);
  c.closePath();c.fillStyle=color(flash,'#8e44ad');c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 }
}

export function drawVoidSpectreV4(c,m,time,seed){
 const q=voidSpectreMotionV4(m,time,seed),flash=m.flashTimer>0,{x,y}=q;
 c.save();c.lineCap='round';c.lineJoin='round';mist(c,q,flash);
 c.fillStyle=color(flash,'#0d011a');robe(c,q);c.fill();
 if(!flash){
  c.save();robe(c,q);c.clip();
  c.fillStyle='#36104f';c.beginPath();c.moveTo(x-8,y-10);c.quadraticCurveTo(x-7,y-17,x-2,y-18.5);
  c.lineTo(x-4,y-11);c.lineTo(x-2,y-3);c.quadraticCurveTo(x-5,y+2,x-3,y+11);
  c.lineTo(x-9,y+16);c.lineTo(x-7,y+1);c.lineTo(x-12,y-3);c.closePath();c.fill();
  c.fillStyle='#24052f';c.beginPath();c.moveTo(x+5,y-15);c.lineTo(x+9,y-6);c.lineTo(x+7,y+4);
  c.lineTo(x+12+q.sway*.4,y+14);c.lineTo(x+5,y+11);c.lineTo(x-1+q.sway,y+20);
  c.quadraticCurveTo(x+3,y+8,x+1,y+1);c.closePath();c.fill();
  c.strokeStyle='#8e44ad';c.lineWidth=1;c.beginPath();c.moveTo(x-7,y-13);
  c.quadraticCurveTo(x-2,y-19,x+4,y-16);c.stroke();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;robe(c,q);c.stroke();
 if(!flash){
  c.fillStyle='#07000f';c.beginPath();c.moveTo(x-6,y-13);c.quadraticCurveTo(x,y-18,x+6,y-13);
  c.lineTo(x+5,y-7);c.lineTo(x,y-4.5);c.lineTo(x-5,y-7);c.closePath();c.fill();
  c.save();c.fillStyle='#e84393';c.shadowColor='#e84393';c.shadowBlur=8;
  c.beginPath();c.ellipse(x-3,y-10,1.2,3,Math.PI/12,0,TAU);
  c.ellipse(x+3,y-10,1.2,3,-Math.PI/12,0,TAU);c.fill();c.restore();
 }
 for(const a of q.arms){sleeve(c,a,flash);hand(c,a,flash);}
 c.restore();
}
