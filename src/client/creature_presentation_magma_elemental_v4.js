const SCALE=.74,LINE=1.26/SCALE,INK='#11151a',TAU=Math.PI*2;
const smooth=p=>p*p*(3-2*p),color=(flash,hex)=>flash?'#fff':hex;
export function magmaElementalMotionV4(m,time){
 const cast=m.rangedPose,heat=cast?(cast.phase==='windup'?cast.charge:1-smooth(cast.progress)):0;
 return {cx:m.x+m.w/2,cy:m.y+m.h/2,heat,flicker:Math.sin(time/60)*3};
}
function polygon(c,points,fill){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();
}
function originalArmsPath(c,x,y,flicker){
 c.beginPath();c.moveTo(x-14,y);c.quadraticCurveTo(x-24-flicker,y+4,x-20,y+12);c.lineTo(x-11,y+6);
 c.moveTo(x+14,y);c.quadraticCurveTo(x+24+flicker,y+4,x+20,y+12);c.lineTo(x+11,y+6);c.closePath();
}
function originalFacePath(c,x,y){c.beginPath();c.arc(x,y-12,8,0,TAU);}
function originalCrestPath(c,x,y,flicker){
 c.beginPath();c.moveTo(x-6,y-18);c.quadraticCurveTo(x,y-28-flicker,x+6,y-18);c.quadraticCurveTo(x+3,y-12,x-3,y-12);c.closePath();
}
function blackOuterEdge(c){c.strokeStyle=INK;c.lineWidth=2+LINE;c.stroke();}
function originalPaint(c,fill,flash){
 c.fillStyle=color(flash,fill);c.fill();c.strokeStyle=flash?INK:'#ff5500';c.lineWidth=flash?LINE:2;c.stroke();
}
function originalArms(c,q,flash){
 originalArmsPath(c,q.cx,q.cy,q.flicker);blackOuterEdge(c);originalPaint(c,'#d35400',flash);
}
function originalHead(c,q,flash){
 const {cx:x,cy:y,flicker}=q;
 // Outline the whole head first. Original paints then cover all interior ink,
 // preserving the orange rim, flat dark face, broad crest and yellow dot eyes.
 originalFacePath(c,x,y);blackOuterEdge(c);originalCrestPath(c,x,y,flicker);blackOuterEdge(c);
 originalFacePath(c,x,y);originalPaint(c,'#2d110b',flash);
 originalCrestPath(c,x,y,flicker);originalPaint(c,'#e67e22',flash);
 if(!flash){c.fillStyle='#f1c40f';c.beginPath();c.arc(x-3,y-12,1.5,0,TAU);c.arc(x+3,y-12,1.5,0,TAU);c.fill();}
}
function fissures(c,x,y,heat){
 c.save();c.strokeStyle='#e2570a';c.lineWidth=1.3;c.shadowColor='#ff5d0a';c.shadowBlur=1+heat*2;
 c.beginPath();c.moveTo(x-9,y-3);c.lineTo(x-5,y+1);c.lineTo(x-7,y+4);c.lineTo(x-6,y+7);
 c.moveTo(x+10,y+6);c.lineTo(x+7,y+9);c.lineTo(x+9,y+12);c.stroke();
 c.shadowBlur=0;c.strokeStyle='#ffb62c';c.lineWidth=.55;c.beginPath();c.moveTo(x-8.3,y-2.3);c.lineTo(x-5.2,y+.8);c.moveTo(x+9.4,y+6.7);c.lineTo(x+7.2,y+8.8);c.stroke();c.restore();
}
export function drawMagmaElementalV4(c,m,time){
 const q=magmaElementalMotionV4(m,time),{cx:x,cy:y,heat}=q,flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 // The dark block silhouette remains; a few broad rock edges and seams refine it.
 c.fillStyle=color(flash,'#1a0805');c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(x-11,y-6);c.lineTo(x-4,y-7);c.lineTo(x+3,y-5);c.lineTo(x+10,y-6);c.lineTo(x+14,y-2);c.lineTo(x+14,y+10);c.quadraticCurveTo(x+13,y+15,x+9,y+16);c.lineTo(x-10,y+16);c.quadraticCurveTo(x-15,y+14,x-14,y+9);c.lineTo(x-14,y-2);c.closePath();c.fill();c.stroke();
 if(!flash){
  polygon(c,[[x+10,y-3],[x+13,y-1],[x+13,y+11],[x+10,y+15],[x-9,y+15],[x-11,y+12],[x+9,y+12]],'#100607');
  polygon(c,[[x-10,y-5],[x-5,y-6],[x-3,y-4],[x-8,y-2],[x-11,y+2],[x-12,y-1]],'#49231a');
  fissures(c,x,y,heat);
 }
 originalArms(c,q,flash);originalHead(c,q,flash);
 c.restore();
}
