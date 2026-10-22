const SCALE=.75,LINE=1.26/SCALE,INK='#11151a';
const smooth=v=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
export function slagSlimeShapeV4(m,time){
 const a=m.familyAttack,blend=!a?0:a.phase==='windup'?smooth(a.progress):a.phase==='recovery'?1-smooth(a.progress):1;
 const squish=Math.sin(time/100)*3.5*(1-blend),w=m.w/2+squish,h=m.h/2-squish;
 return {cx:m.x+m.w/2,cy:m.y+m.h-10+squish/2,w,h,rx:w*1.2,ry:h*.9};
}
function bodyPath(c,{cx:x,cy:y,rx,ry}){
 c.beginPath();c.moveTo(x-rx*.97,y+ry*.4);
 c.bezierCurveTo(x-rx*1.05,y-ry*.02,x-rx*.74,y-ry*.52,x-rx*.44,y-ry*.64);
 c.quadraticCurveTo(x-rx*.15,y-ry*.88,x+rx*.17,y-ry*.58);
 c.quadraticCurveTo(x+rx*.55,y-ry*.69,x+rx*.75,y-ry*.31);
 c.quadraticCurveTo(x+rx*.87,y-ry*.12,x+rx*.88,y+ry*.08);
 c.quadraticCurveTo(x+rx*1.12,y+ry*.27,x+rx*.97,y+ry*.56);
 c.quadraticCurveTo(x+rx*.86,y+ry*.78,x+rx*.59,y+ry*.71);
 c.quadraticCurveTo(x+rx*.32,y+ry*.9,x+rx*.04,y+ry*.77);
 c.quadraticCurveTo(x-rx*.3,y+ry*.96,x-rx*.53,y+ry*.76);
 c.quadraticCurveTo(x-rx*.99,y+ry*.89,x-rx*.97,y+ry*.4);c.closePath();
}
function plate(c,q,points,fill){
 c.fillStyle=fill;c.beginPath();c.moveTo(q.cx+points[0][0]*q.rx,q.cy+points[0][1]*q.ry);
 for(const [x,y]of points.slice(1))c.lineTo(q.cx+x*q.rx,q.cy+y*q.ry);
 c.closePath();c.fill();
}
export function drawSlagSlimeV4(c,m,time,seed){
 const q=slagSlimeShapeV4(m,time),{cx:x,cy:y,rx,ry}=q,flash=m.flashTimer>0;
 c.save();c.lineJoin='round';c.lineCap='round';
 // A soft uneven mound keeps the original slime's attached squish timing.
 c.fillStyle=flash?'#fff':'#f77b25';bodyPath(c,q);c.fill();
 if(!flash){
  c.save();bodyPath(c,q);c.clip();
  // A broad golden lip stays exposed below the cooling crust.
  plate(c,q,[[-1,.63],[-.56,.72],[-.18,.65],[.2,.75],[.56,.62],[1,.55],[1,1.1],[-1,1.1]],'#ffb33b');
  plate(c,q,[[-1,.87],[-.5,.95],[.05,.87],[.5,.91],[1,.73],[1,1.1],[-1,1.1]],'#da5223');
  // One soft, chunky shell rather than scrap metal or many tiny rock tiles.
  const shell=[[-1.1,-1.1],[1.1,-1.1],[1.1,.28],[.87,.45],[.59,.42],[.33,.62],[.1,.48],[-.2,.62],[-.45,.51],[-.64,.63],[-1.1,.46]];
  plate(c,q,shell,'#503d3e');
  c.strokeStyle=INK;c.lineWidth=LINE*.7;c.stroke();
  plate(c,q,[[-1.1,-.15],[-.76,.13],[-.52,.12],[-.3,.36],[.1,.35],[.33,.62],[.1,.48],[-.2,.62],[-.45,.51],[-.64,.63],[-1.1,.46]],'#342b31');
  plate(c,q,[[-.84,-.59],[-.44,-.87],[.03,-.84],[.15,-.68],[-.24,-.62],[-.45,-.39],[-.73,-.33]],'#76534c');
  // Two wide molten seams keep the material readable at phone scale.
  c.strokeStyle='#f77b25';c.lineWidth=2;c.beginPath();
  c.moveTo(x-rx*.18,y-ry*1.02);c.lineTo(x-rx*.12,y-ry*.59);c.lineTo(x-rx*.34,y-ry*.39);c.lineTo(x-rx*.28,y-ry*.23);
  c.moveTo(x+rx*.96,y-ry*.23);c.lineTo(x+rx*.66,y-ry*.12);c.lineTo(x+rx*.67,y+ry*.17);c.stroke();
  c.strokeStyle='#ffc04b';c.lineWidth=.7;c.beginPath();c.moveTo(x-rx*.18,y-ry*.95);c.lineTo(x-rx*.12,y-ry*.61);c.lineTo(x-rx*.3,y-ry*.42);c.stroke();
  // The face is a few hot openings in the crust, with no human pupils.
  const phase=(time/3400+(seed%13)*.07)%1,blink=phase>.94?Math.sin((phase-.94)/.06*Math.PI):0,eyeH=1-.86*blink;
  c.fillStyle='#ffbc3e';c.strokeStyle=INK;c.lineWidth=1;
  for(const ex of [-.13,.34]){
   c.beginPath();c.moveTo(x+rx*(ex-.105),y-ry*.12);
   c.quadraticCurveTo(x+rx*ex,y-ry*(.12+.11*eyeH),x+rx*(ex+.105),y-ry*.065);
   c.quadraticCurveTo(x+rx*ex,y+ry*(-.12+.21*eyeH),x+rx*(ex-.105),y-ry*.12);c.closePath();c.fill();c.stroke();
  }
  c.strokeStyle='#ff9b2e';c.lineWidth=1.3;c.beginPath();c.moveTo(x-rx*.12,y+ry*.25);c.lineTo(x+rx*.02,y+ry*.31);c.lineTo(x+rx*.13,y+ry*.23);c.lineTo(x+rx*.25,y+ry*.27);c.stroke();
  c.restore();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;bodyPath(c,q);c.stroke();
 c.restore();
}
