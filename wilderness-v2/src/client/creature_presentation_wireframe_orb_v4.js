// Depth-sorted, perspective-projected lattice art. Host motion, damage
// and save state stay in World; all geometry is disposable presentation data.
const TAU=Math.PI*2,INK='#11151a',SCALE=.9,LINE=1.26/SCALE,RADIUS=12.5,PHI=(1+Math.sqrt(5))/2;
const source=[];
for(const a of [-1,1])for(const b of [-1,1])source.push([0,a,b*PHI],[a,b*PHI,0],[b*PHI,0,a]);
const unit=source.map(v=>{const d=Math.hypot(...v);return v.map(n=>n/d);});
const pairs=[];
const edgeLength=Math.min(...unit.flatMap((v,i)=>unit.slice(i+1).map(w=>Math.hypot(...v.map((n,j)=>n-w[j])))));
for(let i=0;i<unit.length;i++)for(let j=i+1;j<unit.length;j++)if(Math.hypot(...unit[i].map((n,k)=>n-unit[j][k]))<edgeLength+1e-6)pairs.push(Object.freeze([i,j]));
export const WIREFRAME_ORB_EDGES_V4=Object.freeze(pairs);
const color=(flash,hex)=>flash?'#fff':hex;
function verticesAt(time,seed){
 const yaw=time/1800+(seed%13)*.17,pitch=time/2400+(seed%11)*.13,roll=Math.sin(time/2800+(seed%7))*.16;
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
 return unit.map(([x,y,z])=>{
  const x1=x*cy+z*sy,z1=-x*sy+z*cy,y2=y*cp-z1*sp,z2=y*sp+z1*cp;
  const x3=x1*cr-y2*sr,y3=x1*sr+y2*cr,perspective=1+z2/8;
  return {x:x3*RADIUS*perspective,y:y3*RADIUS*perspective,z:z2*RADIUS};
 });
}
function hullOf(vertices){
 const indices=vertices.map((_,i)=>i).sort((a,b)=>vertices[a].x-vertices[b].x||vertices[a].y-vertices[b].y);
 const cross=(a,b,c)=>(vertices[b].x-vertices[a].x)*(vertices[c].y-vertices[a].y)-(vertices[b].y-vertices[a].y)*(vertices[c].x-vertices[a].x);
 const half=list=>{const out=[];for(const i of list){while(out.length>=2&&cross(out.at(-2),out.at(-1),i)<=0)out.pop();out.push(i);}return out;};
 return [...half(indices).slice(0,-1),...half([...indices].reverse()).slice(0,-1)];
}
export function wireframeOrbGeometryV4(time,seed,pose=null){
 const vertices=verticesAt(time,seed),weight=pose?.artWeight??0;let strikeVertex=null;
 if(weight>0){
  // Select the leading corner at the beginning of the committed action. A
  // rotating cage cannot switch the attacking corner midway through a strike.
  const start=verticesAt((pose.wireframeOrbActionStartTick??pose.presentationTick)*1000/60,seed),facing=pose.idleFacingX??1;
  let best=-Infinity;
  for(const [i,v]of start.entries()){const score=v.x*pose.direction.x*facing+v.y*pose.direction.y;if(score>best){best=score;strikeVertex=i;}}
  const size=pose.wireframeOrbScale??1,dx=pose.direction.x*pose.limb.extension,dy=pose.direction.y*pose.limb.extension,co=Math.cos(pose.body.rotation),si=Math.sin(pose.body.rotation);
  // Invert the production body's lean, stretch, elite scale and facing. The
  // actual lattice vertex then reaches the existing host contact face exactly.
  const x=(co*dx+si*dy)/(pose.body.scaleX*size*SCALE*facing),y=(-si*dx+co*dy)/(pose.body.scaleY*size*SCALE);
  const v=vertices[strikeVertex];v.x+=(x-v.x)*weight;v.y+=(y-v.y)*weight;
 }
 return {vertices,edges:WIREFRAME_ORB_EDGES_V4,rim:hullOf(vertices),strikeVertex};
}
function rimPath(c,vertices,rim){c.beginPath();c.moveTo(vertices[rim[0]].x,vertices[rim[0]].y);for(const i of rim.slice(1))c.lineTo(vertices[i].x,vertices[i].y);c.closePath();}
function core(c,flash,time,seed){
 c.save();c.beginPath();c.ellipse(0,0,5.2,4.8,0,0,TAU);c.fillStyle=color(flash,'#5ca9db');c.fill();c.clip();
 c.fillStyle=color(flash,'#2e5e91');c.beginPath();c.moveTo(-6,1);c.lineTo(.2,-.2);c.lineTo(6,1);c.lineTo(6,6);c.lineTo(-6,6);c.closePath();c.fill();
 c.fillStyle=color(flash,'#c4ecff');c.beginPath();c.moveTo(-6,-4);c.lineTo(1,-5);c.lineTo(-.2,-.2);c.lineTo(-5,1);c.closePath();c.fill();
 c.restore();c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.ellipse(0,0,5.2,4.8,0,0,TAU);c.stroke();
 c.save();if(!flash){c.shadowColor='#8cefff';c.shadowBlur=3;}
 c.fillStyle=color(flash,'#e6ffff');c.beginPath();c.arc(-.6,-.7,1.4+Math.sin(time/300+(seed%11))*.12,0,TAU);c.fill();c.restore();
}
export function drawWireframeOrbV4(c,m,time,seed){
 const pose=m.familyAttack,geometry=wireframeOrbGeometryV4(time,seed,pose),{vertices,edges,rim,strikeVertex}=geometry,flash=m.flashTimer;
 const outer=new Set(rim.map((a,i)=>[a,rim[(i+1)%rim.length]].sort((a,b)=>a-b).join('/')));
 c.save();c.translate(m.x+m.w/2,m.y+m.h/2);c.lineJoin='round';c.lineCap='round';
 rimPath(c,vertices,rim);c.fillStyle=flash?'#fff':'rgba(57,127,186,.10)';c.fill();
 // Dim rear struts stay behind the solid core; bright front struts pass in
 // front. Depth ordering gives the lattice a visible tumble at gameplay size.
 c.strokeStyle=color(flash,'#35618c');c.lineWidth=.85;
 for(const [a,b]of edges)if(!outer.has([a,b].join('/'))&&(vertices[a].z+vertices[b].z)<0&&a!==strikeVertex&&b!==strikeVertex){c.beginPath();c.moveTo(vertices[a].x,vertices[a].y);c.lineTo(vertices[b].x,vertices[b].y);c.stroke();}
 core(c,flash,time,seed);
 const front=edges.filter(([a,b])=>!outer.has([a,b].join('/'))&&((vertices[a].z+vertices[b].z)>=0||a===strikeVertex||b===strikeVertex));
 for(const [width,shade]of [[2.0,INK],[.95,color(flash,'#75c9f3')]]){
  c.lineWidth=width;c.strokeStyle=shade;
  for(const [a,b]of front){c.beginPath();c.moveTo(vertices[a].x,vertices[a].y);c.lineTo(vertices[b].x,vertices[b].y);c.stroke();}
 }
 // 1.2px blue wire plus 1.4px black on each side gives the same visible
 // 1.26-world-pixel main contour as the golem at this species' .9 scale.
 rimPath(c,vertices,rim);c.strokeStyle=INK;c.lineWidth=1.2+2*LINE;c.stroke();
 rimPath(c,vertices,rim);c.strokeStyle=color(flash,'#5ca9db');c.lineWidth=1.2;c.stroke();
 c.fillStyle=color(flash,'#c4ecff');for(const [i,v]of vertices.entries())if(v.z>0||i===strikeVertex){c.beginPath();c.arc(v.x,v.y,.7,0,TAU);c.fill();}
 c.restore();
}
