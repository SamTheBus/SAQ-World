// Dungeon preRenderStaticMap uses neighboring floor cells for exposed material
// faces and hard edge accents. Outdoor connectivity/fillets adapt that rule;
// grass art comes from the existing Idle SAQ foreground port. Static only.
import {terrainHash} from './environment_motifs.js';
const dirt='#c5a069',trailDirt='#d0b788';
export const isRoad=type=>type==='r'||type==='p'||type==='H'||type==='V';
export function roadMask(at,x,y){return (isRoad(at(x,y-1))?1:0)|(isRoad(at(x+1,y))?2:0)|(isRoad(at(x,y+1))?4:0)|(isRoad(at(x-1,y))?8:0);}
export function drawRoadCell(ctx,at,x,y,t,seed,offset={x:0,y:0},texture=null){
 if(at(x,y)==='H'||at(x,y)==='V')return roadMask(at,x,y);
 const mask=roadMask(at,x,y),n=terrainHash(x+offset.x/t,y+offset.y/t,seed),north=mask&1,east=mask&2,south=mask&4,west=mask&8;
 const trail=at(x,y)==='p',inset=trail?6:2,body=trail?trailDirt:dirt;
 const px=x*t,py=y*t;
 const nwRoad=!trail&&at(x-1,y-1)==='r',neRoad=!trail&&at(x+1,y-1)==='r',swRoad=!trail&&at(x-1,y+1)==='r',seRoad=!trail&&at(x+1,y+1)==='r';
 const l=west||nwRoad||swRoad?-1:inset+n%2,r=east||neRoad||seRoad?t+1:t-inset-(n>>>4)%2,top=north||nwRoad||neRoad?-1:inset+(n>>>8)%2,bottom=south||swRoad||seRoad?t+1:t-inset-(n>>>12)%2;
 const nw=!north&&!west?9:0,ne=!north&&!east?9:0,se=!south&&!east?9:0,sw=!south&&!west?9:0;
 ctx.save();ctx.translate(px,py);ctx.beginPath();ctx.moveTo(l+nw,top);ctx.lineTo(r-ne,top);ctx.quadraticCurveTo(r,top,r,top+ne);ctx.lineTo(r,bottom-se);ctx.quadraticCurveTo(r,bottom,r-se,bottom);ctx.lineTo(l+sw,bottom);ctx.quadraticCurveTo(l,bottom,l,bottom-sw);ctx.lineTo(l,top+nw);ctx.quadraticCurveTo(l,top,l+nw,top);ctx.closePath();ctx.fillStyle=body;ctx.fill();
 if(texture){ctx.save();ctx.clip();texture(ctx,trail?'p':'r',n,t,px+offset.x,py+offset.y);ctx.restore();}
 // A trail's last cell flares into the established road, with a lighter throat.
 if(trail){for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(at(x+dx,y+dy)==='r'){
   ctx.save();ctx.translate(t/2,t/2);ctx.rotate(Math.atan2(dy,dx)+Math.PI/2);
   ctx.beginPath();ctx.moveTo(-t/2+2,-t/2-1);ctx.quadraticCurveTo(0,-t/2-7,t/2-2,-t/2-1);ctx.quadraticCurveTo(t/2-7,-5,7,4);ctx.lineTo(-7,4);ctx.quadraticCurveTo(-t/2+7,-5,-t/2+2,-t/2-1);ctx.closePath();ctx.fillStyle=trailDirt;ctx.fill();ctx.restore();
 }}
 // Main roads have a deliberate ochre shoulder; trails have no outlined verge.
 if(!trail){ctx.strokeStyle='#aa824e';ctx.lineWidth=1.6;ctx.beginPath();
   if(!north){ctx.moveTo(l+9,top+1);ctx.quadraticCurveTo(t/2,top+2,r-9,top+1);}
   if(!south){ctx.moveTo(l+9,bottom-1);ctx.quadraticCurveTo(t/2,bottom-2,r-9,bottom-1);}
   if(!west){ctx.moveTo(l+1,top+9);ctx.quadraticCurveTo(l+2,t/2,l+1,bottom-9);}
   if(!east){ctx.moveTo(r-1,top+9);ctx.quadraticCurveTo(r-2,t/2,r-1,bottom-9);}ctx.stroke();
 }
 if(n%(trail?7:3)===0){ctx.fillStyle=trail?'#dcc596':'#dfbc80';const dx=10+n%7,dy=12+(n>>>8)%7;ctx.beginPath();ctx.moveTo(dx-4,dy);ctx.quadraticCurveTo(dx+2,dy-2,dx+(trail?5:10),dy);ctx.lineTo(dx+4,dy+(trail?1:2));ctx.closePath();ctx.fill();}
 if(!trail&&n%5===0){ctx.fillStyle='#987548';ctx.fillRect(10+n%10,19+(n>>>6)%5,3,1.2);ctx.fillStyle='#e3cca0';ctx.fillRect(10+n%10,18+(n>>>6)%5,2,1);}
 ctx.restore();return mask;
}
export function drawRoadFillets(ctx,at,x,y,t){
 // A grass cell between two connected dirt sides fills only the inner corner.
 // This creates one T/cross intersection silhouette without rectangular overlays.
 const px=x*t,py=y*t;
 for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
  if(!isRoad(at(x+dx,y))||!isRoad(at(x,y+dy))||!isRoad(at(x+dx,y+dy)))continue;
  const trail=at(x+dx,y)==='p'||at(x,y+dy)==='p',r=trail?4:10;ctx.fillStyle=trail?trailDirt:dirt;
  ctx.save();ctx.translate(px+(dx>0?t:0),py+(dy>0?t:0));ctx.scale(-dx,-dy);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r,0);ctx.quadraticCurveTo(1,1,0,r);ctx.closePath();ctx.fill();ctx.restore();
 }
}
