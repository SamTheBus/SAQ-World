// Void Crawler's seven original body segments and slither remain intact.
// Only client presentation changes: twelve supports and a real attached bite.
const TAU=Math.PI*2,SCALE=.75,LINE=1.26/SCALE,INK='#11151a';
const color=(flash,hex)=>flash?'#fff':hex;

export function voidCrawlerMotionV4(m,time,seed=0){
 const cx=m.x+m.w/2,cy=m.y+m.h/2+2,t=time/150,a=m.familyAttack;
 const segments=Array.from({length:7},(_,i)=>({x:cx+i*5.5,y:cy+Math.sin(t-i*.7)*3.5,radius:6.2-i*.7}));
 let turn=0;
 if(a){
  const co=Math.cos(a.body.rotation),si=Math.sin(a.body.rotation),flip=-(a.idleFacingX??1);
  const x=(co*a.direction.x+si*a.direction.y)/a.body.scaleX*flip,y=(-si*a.direction.x+co*a.direction.y)/a.body.scaleY;
  turn=Math.atan2(-y,-x)*a.artWeight;
 }
 const u={x:-Math.cos(turn),y:-Math.sin(turn)},root=segments[0];
 const head={x:root.x+u.x*5,y:root.y+u.y*5,turn,open:a?a.limb.open*(1-a.strikeBlend):1.2};
 const tip={x:head.x+u.x*15,y:head.y+u.y*15};
 const walk=Math.max(0,Math.min(1,m.motionBlend??0)),legs=[];
 for(const near of [false,true])for(let i=0;i<6;i++){
  const s=segments[i],p=time/110-i*.8+(near?Math.PI:0)+(seed%13)*.21;
  const step=Math.sin(p)*1.8*walk,lift=Math.max(0,Math.cos(p))*2.2*walk;
  const settle=Math.sin(time/510+i+(near?2:0)+(seed%7))*.18*(1-walk);
  legs.push({near,root:{x:s.x,y:s.y+(near?2:-1)},
   knee:{x:s.x-1+step*.5,y:s.y+(near?7:3.5)-lift*.4+settle},
   foot:{x:s.x+(near?-3:3)+step,y:s.y+(near?11:6.5)-lift+settle}});
 }
 return {segments,head,tip,legs};
}

export function voidCrawlerPoseV4(actor,pose,tick){
 const size=actor.elite?.scale??1,idleFacingX=actor.presentationFacingX===-1?-1:1;
 const a={...pose,idleFacingX,voidCrawlerScale:size};
 const {tip}=voidCrawlerMotionV4({x:-12,y:-24,w:24,h:24,familyAttack:a},tick*1000/60);
 const flip=-idleFacingX,b=pose.body,pivot=pose.bodyPivot,co=Math.cos(b.rotation),si=Math.sin(b.rotation);
 const x=(tip.x*SCALE*size*flip-pivot.x)*b.scaleX,y=(tip.y*SCALE*size-pivot.y)*b.scaleY;
 // Calibrate against the committed impact translation. Blending the whole
 // remaining distance here would apply the lunge easing twice.
 const impactTravel=pose.contactReach-pose.frontExtent;
 const px=pose.direction.x*impactTravel+pivot.x+co*x-si*y;
 const py=pose.direction.y*impactTravel+pivot.y+si*x+co*y;
 const weight=pose.strikeBlend;
 const body={...b,x:b.x+(pose.direction.x*pose.contactReach-px)*weight,
  y:b.y+(pose.direction.y*pose.contactReach-8-py)*weight};
 // Move the body to the contact plane instead of stretching the neck or jaws.
 return {...a,body,anchor:{x:body.x,y:body.y}};
}

function polygon(c,points,fill,outline=true){
 c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function support(c,a,b,width,flash,near){
 const d=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;
 polygon(c,[[a.x+nx*width,a.y+ny*width],[b.x+nx*.25,b.y+ny*.25],
  [b.x-nx*.25,b.y-ny*.25],[a.x-nx*width,a.y-ny*width]],color(flash,near?'#40104f':'#1a022b'));
}
function legs(c,motion,near,flash){
 for(const l of motion.legs.filter(l=>l.near===near)){
  support(c,l.knee,l.foot,.65,flash,near);support(c,l.root,l.knee,.9,flash,near);
 }
}
function segment(c,s,flash,i){
 const {x,y,radius:r}=s;
 c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color(flash,'#1a022b');c.fill();
 if(!flash){
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  c.fillStyle='#0d0017';c.beginPath();c.moveTo(x-r,y+r*.08);
  c.quadraticCurveTo(x,y+r*.7,x+r,y-r*.1);c.lineTo(x+r,y+r);c.lineTo(x-r,y+r);c.closePath();c.fill();
  c.fillStyle='#8e44ad';c.beginPath();c.ellipse(x-r*.22,y-r*.47,r*.47,r*.18,-.15,0,TAU);c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
 if(!flash&&i<5){c.strokeStyle='#8e44ad';c.lineWidth=1;c.beginPath();c.moveTo(x-1.1,y-r+2.2);c.lineTo(x+1.1,y-r+2.2);c.stroke();}
}
function head(c,h,flash,time){
 c.save();c.translate(h.x,h.y);c.rotate(h.turn);c.scale(-1,1);
 for(const side of [-1,1]){
  c.beginPath();c.moveTo(4.6,side*2.8);
  c.quadraticCurveTo(10,side*(h.open+4),15,side*h.open);
  c.lineTo(11,side*(h.open+.1));c.quadraticCurveTo(7,side*.9,4.4,side*1.1);c.closePath();
  c.fillStyle=color(flash,side<0?'#8e44ad':'#411354');c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 }
 c.beginPath();c.arc(0,0,6.5,0,TAU);c.fillStyle=color(flash,'#11001c');c.fill();
 if(!flash){
  c.fillStyle='#6d238c';c.beginPath();c.moveTo(-5,-2.2);c.quadraticCurveTo(-2,-7,3.5,-4.8);
  c.quadraticCurveTo(1,-2.5,-5,-2.2);c.closePath();c.fill();
  c.fillStyle='#090010';c.beginPath();c.moveTo(-5,2);c.quadraticCurveTo(1,5.5,5.6,.8);
  c.quadraticCurveTo(4,6.5,-1,6.3);c.quadraticCurveTo(-5,5,-5,2);c.closePath();c.fill();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(0,0,6.5,0,TAU);c.stroke();
 const twitch=Math.sin(time/50)*2.5;
 c.beginPath();c.moveTo(2,-4);c.quadraticCurveTo(9,-9+twitch,14,-6+twitch);
 c.strokeStyle=INK;c.lineWidth=2.6;c.stroke();c.strokeStyle=color(flash,'#8e44ad');c.lineWidth=1;c.stroke();
 if(!flash){
  c.save();c.fillStyle='#ff007f';c.shadowColor='#ff007f';c.shadowBlur=2;
  for(const [x,y,r]of [[3,-2,1],[1,-1,.8],[3,1,.8]]){c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  c.restore();
 }
 c.restore();
}

export function drawVoidCrawlerV4(c,m,time,seed){
 const motion=voidCrawlerMotionV4(m,time,seed),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';legs(c,motion,false,flash);
 for(let i=6;i>=0;i--)segment(c,motion.segments[i],flash,i);
 // Near supports belong in front of the body, not hidden under its plates.
 legs(c,motion,true,flash);head(c,motion.head,flash,time);c.restore();
}
