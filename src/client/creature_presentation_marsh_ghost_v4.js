const SCALE=.78,LINE=1.26/SCALE,INK='#11151a';
const smooth=v=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
const color=(flash,hex)=>flash?'#fff':hex;
export function marshGhostMotionV4(m,time,seed=0){
 const a=m.familyAttack,p=a?.progress??0,weight=!a?0:a.phase==='windup'?smooth(p):a.phase==='recovery'?1-smooth(p):1;
 const strike=!a?0:a.phase==='windup'?smooth((p-.4)/.6):a.phase==='recovery'?1-smooth(p):1;
 const gather=weight*(1-strike),sway=Math.sin(time/240+(seed%13)*.3)*2.2;
 return {x:m.x+m.w/2,y:m.y+m.h/2+Math.sin(time/140)*6,weight,strike,gather,sway,
  arms:[-1,1].map(side=>({side,elbow:17-gather*3+strike,hand:23-gather*3+strike*4,
   elbowY:1-gather*7,handY:-7-gather*9+strike*2+Math.sin(time/310+side*1.2)*1.4*(1-weight)}))};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function body(c,q){
 const {x,y,sway:s}=q;
 c.beginPath();c.moveTo(x-10,y-9);c.quadraticCurveTo(x-11,y-16,x-5,y-20);
 c.lineTo(x-1,y-23);c.lineTo(x-1,y-19);c.quadraticCurveTo(x+4,y-23,x+8,y-19);c.lineTo(x+6,y-17);
 c.quadraticCurveTo(x+11,y-13,x+10,y-8);c.lineTo(x+15,y-5);c.lineTo(x+11,y);c.lineTo(x+8,y-1);
 c.quadraticCurveTo(x+7,y+5,x+13+s*.5,y+14);c.quadraticCurveTo(x+5,y+13,x+3,y+9);
 c.quadraticCurveTo(x+3,y+17,x-4+s,y+23);c.quadraticCurveTo(x-1,y+12,x-4,y+7);
 c.lineTo(x-9+s*.4,y+15);c.quadraticCurveTo(x-11,y+8,x-9,y+1);
 c.lineTo(x-14,y+3);c.lineTo(x-13,y-3);c.lineTo(x-17,y-5);c.closePath();
}
function mist(c,q,flash){
 const {x,y,sway:s}=q,glow=c.createLinearGradient(x,y,x,y+27);
 glow.addColorStop(0,flash?'rgba(255,255,255,.5)':'rgba(76,218,165,.35)');
 glow.addColorStop(.62,flash?'rgba(255,255,255,.4)':'rgba(166,106,211,.38)');
 glow.addColorStop(1,'rgba(153,99,197,0)');c.fillStyle=glow;
 c.beginPath();c.moveTo(x-7,y+2);c.quadraticCurveTo(x-16,y+14,x-17+s,y+24);
 c.quadraticCurveTo(x-7+s,y+18,x-2+s,y+27);c.quadraticCurveTo(x+6,y+17,x+14+s,y+22);
 c.quadraticCurveTo(x+10,y+8,x+7,y+2);c.closePath();c.fill();
}
function arm(c,q,a,flash){
 const {side:s,elbow:e,hand:h,elbowY:ey,handY:hy}=a;
 c.save();c.translate(q.x,q.y);c.scale(s,1);
 // The sleeve, palm and three short hooked fingers form one attached shape.
 c.fillStyle=color(flash,s<0?'#34745e':'#469778');c.beginPath();c.moveTo(10,-7);
 c.quadraticCurveTo(e,-6,h-3,hy);c.lineTo(h-1,hy-3);c.lineTo(h+3,hy-4);
 c.lineTo(h+4,hy-1);c.lineTo(h+1,hy-1);c.lineTo(h+2,hy+1);
 c.lineTo(h+4,hy+2);c.lineTo(h+2,hy+4);c.lineTo(h-1,hy+2);
 c.lineTo(h-2,hy+5);c.lineTo(h-4,hy+3);c.lineTo(h-4,hy+1);
 c.quadraticCurveTo(e,ey+7,11,1);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();
 if(!flash){
  c.strokeStyle='#8bdbb7';c.lineWidth=.9;c.beginPath();c.moveTo(12,-4);c.quadraticCurveTo(e,-3,h-4,hy+1);c.stroke();
 }
 c.restore();
}
export function drawMarshGhostV4(c,m,time,seed){
 const q=marshGhostMotionV4(m,time,seed),{x,y,sway:s}=q,flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';mist(c,q,flash);
 arm(c,q,q.arms[0],flash);arm(c,q,q.arms[1],flash);
 c.fillStyle=color(flash,'#397c60');body(c,q);c.fill();
 if(!flash){
  c.save();body(c,q);c.clip();
  polygon(c,[[x+4,y-18],[x+10,y-9],[x+6,y+1],[x+13+s*.5,y+14],[x+3,y+9],[x-4+s,y+23],[x,y+5],[x-2,y-4]],'#215044',false);
  polygon(c,[[x-10,y-8],[x-8,y-15],[x-2,y-20],[x-3,y-15],[x-7,y-10],[x-4,y-3],[x-7,y+2],[x-12,y-3]],'#79b68a',false);
  polygon(c,[[x,y+6],[x+2,y+12],[x-4+s,y+23],[x-3,y+15],[x-6,y+12]],'#9b6fba',false);
  polygon(c,[[x+6,y+6],[x+10,y+11],[x+13+s*.5,y+14],[x+6,y+11]],'#a97dcc',false);
  c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;body(c,q);c.stroke();
 if(!flash){
  // A broad, broken face opening keeps the eyes out of a rounded capsule.
  c.fillStyle='#112b27';c.beginPath();c.moveTo(x-7,y-14);c.quadraticCurveTo(x-1,y-20,x+7,y-14.5);
  c.lineTo(x+5.7,y-8);c.lineTo(x+1,y-6);c.lineTo(x-6,y-8.5);c.closePath();c.fill();
  c.save();c.shadowColor='#55efc4';c.shadowBlur=4;
  polygon(c,[[x-5.3,y-13.7],[x-1.4,y-12.7],[x-2.1,y-10.5],[x-4.3,y-11]],'#74ffcf',false);
  polygon(c,[[x+1.4,y-12.8],[x+5.3,y-14],[x+4.6,y-10.9],[x+2.4,y-10.4]],'#74ffcf',false);c.restore();
 }
 c.restore();
}
