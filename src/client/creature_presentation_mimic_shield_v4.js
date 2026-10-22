// One living shield face: a heater silhouette, ruby slit eye and gold teeth.
// Its grin stays embedded in the armor. The rigid shield itself makes contact.
const TAU=Math.PI*2,SCALE=.76,INK='#11151a',LINE=1.26/SCALE;
const color=(flash,hex)=>flash?'#fff':hex;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const HULL=Object.freeze([[-16,-16],[16,-16],[18,2],[0,22],[-18,2]].map(p=>Object.freeze(p)));

// Distance to the actual rim along the target ray, after its committed lean.
// Use the same rigid outline as the painter, including reflection and size.
export function mimicShieldBashRadiusV4(direction,rotation,facing=1,size=1){
 const co=Math.cos(rotation),si=Math.sin(rotation),scale=SCALE*size;
 const vertices=HULL.map(([x,y])=>({x:(co*x*facing-si*y)*scale,y:(si*x*facing+co*y)*scale}));
 const cross=(a,b)=>a.x*b.y-a.y*b.x;let distance=Infinity;
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length],edge={x:b.x-a.x,y:b.y-a.y},den=cross(direction,edge);
  if(Math.abs(den)<1e-9)continue;
  const t=cross(a,edge)/den,u=cross(a,direction)/den;
  if(t>=0&&u>=-1e-9&&u<=1+1e-9)distance=Math.min(distance,t);
 }
 return Number.isFinite(distance)?distance:13.5*size;
}

export function mimicShieldFaceV4(time,seed,pose=null){
 const weight=pose?.artWeight??0,cycle=((time+(seed%23)*137)%4200+4200)%4200;
 const idleBlink=smooth(Math.abs(cycle-210)/85),idleOpen=2.8+Math.sin(time/240+(seed%11)*.31)*.4;
 const blink=idleBlink+(1-idleBlink)*weight;
 const opening=(2.1+(idleOpen-2.8)*.3)*(1-weight)+(pose?.limb.open??2.1)*weight;
 const width=8,center={x:0,y:3.5},angle=0;
 const outline=[[-8,-.4],[-6,-opening],[-2,-opening*.72],[2,-opening*.72],[6,-opening],[8,-.4],[6,opening*.72],[2,opening],[-2,opening],[-6,opening*.72]];
 const teeth=[];
 for(const side of [-1,1]){
  for(const x of [-5.25,-1.75,1.75,5.25]){
   const edge=xx=>side*opening*(side<0?.72+.28*clamp((Math.abs(xx)-2)/4):1-.28*clamp((Math.abs(xx)-2)/4));
   teeth.push([[x-.95,edge(x-.95)],[x,edge(x)-side*Math.min(1.8,opening*.7)],[x+.95,edge(x+.95)]]);
  }
 }
 return {blink,opening,center,angle,width,outline,teeth};
}
function polygon(c,points,fill,outline=true){
 c.fillStyle=fill;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.lineTo(...points[0]);c.closePath();c.fill();
 if(outline){c.strokeStyle=INK;c.lineWidth=LINE;c.stroke();}
}
function mouth(c,face,flash){
 c.save();c.translate(face.center.x,face.center.y);c.rotate(face.angle);
 polygon(c,face.outline,color(flash,'#21151d'),false);c.strokeStyle=INK;c.lineWidth=1.15;c.stroke();
 c.save();c.clip();
 // The dark maw separates these small gold shapes. Outlining every tooth
 // would swallow its color at gameplay scale.
 for(const tooth of face.teeth)polygon(c,tooth,color(flash,'#edc76b'),false);
 c.restore();c.restore();
}
function eye(c,face,flash){
 const height=Math.max(.12,4*face.blink);
 c.save();c.translate(0,-7);
 c.fillStyle=color(flash,'#f4ead8');c.strokeStyle=INK;c.lineWidth=1.4;
 c.beginPath();c.ellipse(0,0,6,height,0,0,TAU);c.fill();c.stroke();
 c.save();c.beginPath();c.ellipse(0,0,6,height,0,0,TAU);c.clip();
 c.fillStyle=color(flash,'#c34a4e');c.beginPath();c.arc(0,0,2.45,0,TAU);c.fill();
 c.fillStyle=color(flash,'#161a21');c.beginPath();c.ellipse(0,0,.75,2.35,0,0,TAU);c.fill();
 c.fillStyle=color(flash,'#ffdfbb');c.beginPath();c.arc(-.75,-.9,.52,0,TAU);c.fill();c.restore();c.restore();
}
export function drawMimicShieldV4(c,m,time,seed){
 const flash=m.flashTimer,face=mimicShieldFaceV4(time,seed,m.familyAttack);if(m.aegisDormant)face.blink=.12;
 c.save();c.translate(m.x+m.w/2,m.y+m.h/2);c.lineJoin='round';c.lineCap='round';
 const hull=HULL;
 polygon(c,hull,color(flash,'#b48743'),false);
 polygon(c,[[-16,-16],[16,-16],[13,-13],[-13,-13],[-15,1],[-18,2]],color(flash,'#edcd7d'),false);
 polygon(c,[[18,2],[0,22],[-18,2],[-15,1],[0,18],[15,1]],color(flash,'#8e622f'),false);
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.moveTo(...hull[0]);for(const p of hull.slice(1))c.lineTo(...p);c.lineTo(...hull[0]);c.closePath();c.stroke();
 const inset=[[-13,-13],[13,-13],[15,1],[0,18],[-15,1]];
 polygon(c,inset,color(flash,'#536779'),false);
 polygon(c,[[-13,-13],[-3,-13],[-5,2],[0,18],[-15,1]],color(flash,'#8294a1'),false);
 polygon(c,[[13,-13],[15,1],[0,18],[-5,2],[3,6]],color(flash,'#34485c'),false);
 c.strokeStyle=INK;c.lineWidth=1.15;c.beginPath();c.moveTo(...inset[0]);for(const p of inset.slice(1))c.lineTo(...p);c.closePath();c.stroke();
 mouth(c,face,flash);eye(c,face,flash);c.restore();
}
