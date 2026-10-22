// Six real orbit coins around the established magical nucleus. One existing
// coin makes a short contact strike; no extra coin or projectile is created.
const TAU=Math.PI*2,SCALE=.7,INK='#11151a',LINE=1.26/SCALE,TILT=Math.PI/12;
const color=(flash,hex)=>flash?'#fff':hex;
function orbit(time,seed,weight=0,strike=0,spin=0){
 const hover=Math.sin(time/150)*3*(1-weight),phase=(seed%23)*.17;
 return Array.from({length:6},(_,id)=>{
  const angle=time/600+id*TAU/6+phase+spin;
  const radius=18+Math.sin(time/150+id)*3*(1-weight)-5*weight*(1-strike);
  return {id,x:Math.cos(angle)*radius*1.3,y:hover+Math.sin(angle)*radius*.5,z:Math.sin(angle),rx:1.2+6*Math.abs(Math.sin(angle*2)),ry:7.2,tilt:TILT};
 });
}
export function coinElementalGeometryV4(time,seed,pose=null){
 const weight=pose?.artWeight??0,strike=pose?.strikeBlend??0;
 const coins=orbit(time,seed,weight,strike,pose?.limb.spin??0);let strikeCoin=null;
 if(weight>0){
  // Selection depends on the committed clock/sequence, never the moving target.
  const start=(pose.coinElementalActionStartTick??pose.presentationTick??time*.06)*1000/60;
  const visible=orbit(start,seed).filter(c=>c.z>=0);
  strikeCoin=visible[(((seed>>>0)+(pose.coinElementalActionSequence??0)*13)>>>0)%visible.length].id;
  const coin=coins[strikeCoin],size=pose.coinElementalScale??1,facing=pose.idleFacingX??1;
  const co=Math.cos(pose.body.rotation),si=Math.sin(pose.body.rotation),scale=SCALE*size;
  const dx=pose.direction.x*pose.limb.extension,dy=pose.direction.y*pose.limb.extension;
  const tip={x:(co*dx+si*dy)/(pose.body.scaleX*scale*facing),y:(-si*dx+co*dy)/(pose.body.scaleY*scale)};
  const length=Math.hypot(tip.x,tip.y)||1,ux=tip.x/length,uy=tip.y/length;
  const ct=Math.cos(coin.tilt),st=Math.sin(coin.tilt),axisX=ux*ct+uy*st,axisY=-ux*st+uy*ct;
  const radius=1/Math.sqrt((axisX/coin.rx)**2+(axisY/coin.ry)**2);
  // Translate the rigid ellipse. Its actual near edge, not its center, meets
  // the hit face after the production lean, facing and elite scale.
  coin.x+=(tip.x-ux*radius-coin.x)*weight;
  coin.y+=(tip.y-uy*radius-coin.y)*weight;
  coin.z=coin.z*(1-weight)+weight;
 }
 return {coins,strikeCoin,hover:Math.sin(time/150)*3*(1-weight),ringScale:1-5/18*weight*(1-strike)};
}
function coin(c,cn,flash){
 c.save();c.translate(cn.x,cn.y);c.rotate(cn.tilt);
 c.fillStyle=color(flash,'#a16b27');c.beginPath();c.ellipse(0,0,cn.rx,cn.ry,0,0,TAU);c.fill();
 const face=Math.max(.3,cn.rx-.95);
 c.save();c.beginPath();c.ellipse(-.25,-.45,face,6,0,0,TAU);c.fillStyle=color(flash,'#edba49');c.fill();c.clip();
 c.fillStyle=color(flash,'#c58a2c');c.beginPath();c.moveTo(-face,0);c.bezierCurveTo(-face*.6,4,face*.7,5,face,0);c.lineTo(face,7);c.lineTo(-face,7);c.closePath();c.fill();
 c.fillStyle=color(flash,'#f9d976');c.beginPath();c.moveTo(-face,-2);c.quadraticCurveTo(-face*.5,-6,face*.7,-5);c.lineTo(face*.6,-3.5);c.quadraticCurveTo(-face*.4,-4,-face,-2);c.closePath();c.fill();
 c.restore();
 if(cn.rx>3){
  c.strokeStyle=color(flash,'#936126');c.lineWidth=.8;c.beginPath();c.ellipse(-.25,-.45,face*.69,4.3,0,0,TAU);c.stroke();
  c.fillStyle=color(flash,'#fff0b4');c.beginPath();c.ellipse(-face*.3,-3.3,face*.23,.85,-.25,0,TAU);c.fill();
 }
 c.strokeStyle=INK;c.lineWidth=LINE;c.beginPath();c.ellipse(0,0,cn.rx,cn.ry,0,0,TAU);c.stroke();c.restore();
}
function rings(c,g,front,flash){
 c.save();c.translate(0,g.hover);c.strokeStyle=flash?'rgba(255,255,255,.5)':'rgba(235,188,80,.34)';c.lineWidth=.9;
 for(const [rx,ry,angle]of [[22,7,Math.PI/6],[26,8,-Math.PI/4]]){
  c.beginPath();c.ellipse(0,0,rx*g.ringScale,ry*g.ringScale,angle,front?0:Math.PI,front?Math.PI:TAU);c.stroke();
 }
 c.restore();
}
function core(c,g,flash){
 // Keep the source's soft nucleus; the authored coins carry the cel contours.
 const gradient=c.createRadialGradient(0,g.hover,1,0,g.hover,10);
 gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.5,color(flash,'#ffd700'));gradient.addColorStop(1,flash?'rgba(255,255,255,0)':'rgba(255,215,0,0)');
 c.fillStyle=gradient;c.beginPath();c.arc(0,g.hover,12,0,TAU);c.fill();
}
export function drawCoinElementalV4(c,m,time,seed){
 const geometry=coinElementalGeometryV4(time,seed,m.familyAttack),flash=m.flashTimer;
 c.save();c.translate(m.x+m.w/2,m.y+m.h/2);c.lineJoin='round';c.lineCap='round';
 rings(c,geometry,false,flash);
 for(const cn of geometry.coins.filter(c=>c.z<0).sort((a,b)=>a.z-b.z))coin(c,cn,flash);
 core(c,geometry,flash);rings(c,geometry,true,flash);
 for(const cn of geometry.coins.filter(c=>c.z>=0).sort((a,b)=>a.z-b.z))coin(c,cn,flash);
 c.restore();
}
