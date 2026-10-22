const SCALE=.78,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const smooth=v=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
const color=(flash,hex)=>flash?'#fff':hex;
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
export function swampBasiliskMotionV4(m,time){
 const cx=m.x+m.w/2,cy=m.y+m.h/2+2,t=time/150,a=m.familyAttack;
 // Preserve all six original segment centers, taper and slither cadence.
 const segments=Array.from({length:6},(_,i)=>({x:cx+i*5.5,y:cy+Math.sin(t-i*.8)*3.5,radius:6.5-i*.7}));
 const p=smooth(a?.progress??0),gape=a?.phase==='windup'?Math.sin(Math.PI*p)*.26:0;
 return {segments,head:{x:cx-5,y:segments[0].y,gape}};
}
function segment(c,s,flash,rare){
 const {x,y,radius:r}=s;
 c.fillStyle=color(flash,rare?'#3eb88d':'#387b4c');c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 if(!flash){
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  c.fillStyle='#234c36';c.beginPath();c.moveTo(x-r,y+r*.17);c.quadraticCurveTo(x,y+r*.68,x+r,y-r*.05);c.lineTo(x+r,y+r);c.lineTo(x-r,y+r);c.closePath();c.fill();
  c.fillStyle=rare?'#76ddb2':'#6aad65';c.beginPath();c.ellipse(x-r*.24,y-r*.43,r*.43,r*.17,-.15,0,TAU);c.fill();c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
 polygon(c,[[x+1.7,y-r],[x-1.2,y-r-5],[x-3.5,y-r]],color(flash,rare?'#e957a2':'#b976d0'));
}
function head(c,h,flash,rare,time,seed){
 c.save();c.translate(h.x,h.y);
 // The lower portion of the original wedge hinges at its rear corner.
 c.save();c.translate(7,2.4);c.rotate(-h.gape);
 polygon(c,[[0,0],[-14,-.9],[-14,1.6],[0,4.6]],color(flash,rare?'#2b957a':'#285538'));
 if(!flash)polygon(c,[[-12.5,1],[-5,2],[0,1.8],[0,3.6],[-12.5,1.5]],'#74905a',false);
 c.restore();
 polygon(c,[[7,-7],[-8,-3],[-7,1.5],[7,4]],color(flash,rare?'#36ab85':'#316a43'));
 if(!flash){
  polygon(c,[[6,-5.6],[-5.7,-2.5],[-5.1,-.7],[1.7,-2.1],[6,-.8]],rare?'#75d5a4':'#6ba963',false);
  c.strokeStyle=INK;c.lineWidth=.85;c.beginPath();c.moveTo(-6.5,1);c.lineTo(-1,2);c.lineTo(4,2.5);c.stroke();
  polygon(c,[[-6,-.3],[-6.6,2.8],[-3.7,.8]],'#fff0c9',false);
  const phase=(time/4100+(seed%11)*.09)%1,blink=phase>.965?Math.sin((phase-.965)/.035*Math.PI):0;
  c.fillStyle='#ffdb55';c.strokeStyle=INK;c.lineWidth=.65;c.beginPath();c.ellipse(-1.8,-2.25,1.7,1.3*(1-.8*blink),-.1,0,TAU);c.fill();c.stroke();
  c.strokeStyle=INK;c.lineWidth=.65;c.beginPath();c.moveTo(-1.8,-3.05+blink*.8);c.lineTo(-1.8,-1.45-blink*.8);c.stroke();
 }
 c.restore();
}
export function drawSwampBasiliskV4(c,m,time,seed){
 const motion=swampBasiliskMotionV4(m,time),flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 for(let i=5;i>=0;i--)segment(c,motion.segments[i],flash,m.isRare);
 head(c,motion.head,flash,m.isRare,time,seed);c.restore();
}
