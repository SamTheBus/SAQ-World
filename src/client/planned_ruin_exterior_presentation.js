// Temporary, source-authored masonry using the existing ruin stone/root palette.
// Masonry bases consume admitted rectangles. The entry reuses the original
// ruined building and doorway; tall art is replayed with the existing depth rules.
import {terrainHash,environmentWorldOffset} from './environment_motifs.js';
import {obstacleTileVisualId} from './environment_layout.js';
import {drawRuinDecorationD11_3,drawRuinExteriorGroundD11_3,drawRuinExteriorRearD11_3,drawRuinExteriorArchD11_3} from './ruin_art_d11_3.js';

export const isPlannedRuinMasonry=b=>b.kind==='ruin-exterior-masonry'&&b.plannedRuinExterior===true;
export function drawPlannedRuinMasonryTile(ctx,space,b,tx,ty,pilot=null){
 if(pilot?.ruin?.wall(ctx,space,b,tx,ty))return obstacleTileVisualId(b,tx,ty,'solid');
 const t=space.collision.tileSize,x=tx*t,y=ty*t,offset=environmentWorldOffset(space),n=terrainHash(tx+offset.x/t,ty+offset.y/t,6173),v=space.visual,woodland=v.biomes?.[ty-(v.originTile?.y??0)]?.[tx-(v.originTile?.x??0)]==='w';
 // An opaque foundation covers every solid cell, including broken cap recesses.
 ctx.fillStyle=b.presentationPart==='entry-structure'?'#3e4b40':'#303831';ctx.fillRect(x,y,t,t);
 if(b.presentationPart==='entry-structure')return obstacleTileVisualId(b,tx,ty,'solid');
 // Large fractured blocks, shared across adjacent tiles. Clipping keeps every
 // raised face within the admitted wall base and preserves page seams.
 ctx.save();ctx.beginPath();ctx.rect(x,y,t,t);ctx.clip();
 for(let row=ty;row<=ty;row++)for(let col=Math.floor(tx/2)-1;col<=Math.floor(tx/2)+1;col++){
  const shift=(row%2)*t,left=col*t*2+shift,top=row*t,k=terrainHash(col+Math.floor(offset.x/t/2),row+offset.y/t,7193),w=t*2-5,h=t-5,j=k%5;if(left+w<=x||left>=x+t)continue;
  ctx.fillStyle=['#687062','#777e6c','#848977','#626d60'][k%4];ctx.strokeStyle='#2b362c';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(left+3,top+4+j);ctx.lineTo(left+w*.42,top+2);ctx.lineTo(left+w-2,top+4);ctx.lineTo(left+w,top+h-4);ctx.lineTo(left+w*.64,top+h);ctx.lineTo(left+2,top+h-2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#a0a68d';ctx.beginPath();ctx.moveTo(left+4,top+5+j);ctx.lineTo(left+w*.42,top+3);ctx.lineTo(left+w-3,top+5);ctx.lineTo(left+w-7,top+10);ctx.lineTo(left+7,top+11+j);ctx.closePath();ctx.fill();
  if(k%3===0){ctx.strokeStyle='#3c4939';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(left+w*.57,top+5);ctx.lineTo(left+w*.48,top+13);ctx.lineTo(left+w*.61,top+21);ctx.stroke();}
 }
 ctx.restore();
 // Exposed northern caps and southern foot faces follow the admitted rectangle.
 if(ty===b.y){ctx.fillStyle='#9c9d87';ctx.beginPath();ctx.moveTo(x+1,y+2);ctx.lineTo(x+t*.3,y+2+(n%4));ctx.lineTo(x+t*.58,y+1);ctx.lineTo(x+t-1,y+3);ctx.lineTo(x+t-2,y+8);ctx.lineTo(x+2,y+7);ctx.closePath();ctx.fill();}
 if(ty===b.y+b.height-1){ctx.fillStyle='#40483d';ctx.fillRect(x,y+t-6,t,6);ctx.fillStyle='#7d816b';ctx.fillRect(x+2,y+t-6,t-4,2);}
 if(n%5===0){ctx.strokeStyle='#333c32';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x+t*.45,y+8);ctx.lineTo(x+t*.36,y+14);ctx.lineTo(x+t*.52,y+19);ctx.stroke();}
 if(woodland&&n%3===0){ctx.fillStyle='#5c7547';ctx.beginPath();ctx.ellipse(x+8+n%14,y+7+(n>>>5)%17,6,3,.25,0,Math.PI*2);ctx.fill();}
 return obstacleTileVisualId(b,tx,ty,'solid');
}
export function drawPlannedRuinMasonry(ctx,space,b,bounds,pilot=null){
 const t=space.collision.tileSize,ids=[];
 for(let ty=Math.max(b.y,Math.floor(bounds.y/t));ty<Math.min(b.y+b.height,Math.ceil((bounds.y+bounds.height)/t));ty++)for(let tx=Math.max(b.x,Math.floor(bounds.x/t));tx<Math.min(b.x+b.width,Math.ceil((bounds.x+bounds.width)/t));tx++)ids.push(drawPlannedRuinMasonryTile(ctx,space,b,tx,ty,pilot));
 return ids;
}
export function drawPlannedRuinGroundDecoration(ctx,d,t,pilot=null){
 if(pilot?.ruin?.decoration(ctx,d,t))return;
 const x=d.x*t,y=d.y*t;ctx.save();
 if(d.kind==='ruin-rubble-flat'){
  // Loose, low stones are decoration, not a second invisible obstruction.
  for(const [dx,dy,w,h] of [[-18,-4,14,8],[0,-10,19,10],[18,4,12,7],[-5,8,11,6]]){ctx.fillStyle='#454e3f';ctx.beginPath();ctx.ellipse(x+dx+1,y+dy+3,w*.6,h*.55,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#848571';ctx.beginPath();ctx.moveTo(x+dx-w/2,y+dy);ctx.lineTo(x+dx-w/3,y+dy-h/2);ctx.lineTo(x+dx+w/2,y+dy-h/3);ctx.lineTo(x+dx+w/3,y+dy+h/2);ctx.lineTo(x+dx-w/2,y+dy+h/3);ctx.closePath();ctx.fill();}
 }else if(d.kind==='ruin-threshold-weeds'){
  ctx.strokeStyle='#6b8250';ctx.lineWidth=1.5;for(const [dx,dy] of [[-15,2],[-9,7],[12,4],[18,-2]]){ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx-3,y+dy-7);ctx.moveTo(x+dx,y+dy);ctx.lineTo(x+dx+4,y+dy-6);ctx.stroke();}
 }
 ctx.restore();
}
export function drawPlannedRuinRoots(ctx,d,t){drawRuinDecorationD11_3(ctx,d,t);}
export function plannedRuinEntranceFrames(space){return (space.visual?.decorations??[]).filter(d=>d.plannedRuinExterior&&d.kind==='ruin-entry-facade').map(d=>({id:d.id,worldX:d.x+environmentWorldOffset(space).x/32-32768,worldY:d.y+environmentWorldOffset(space).y/32-26624,x:d.x*space.collision.tileSize,y:d.y*space.collision.tileSize,seed:terrainHash(d.x+environmentWorldOffset(space).x/32,d.y+environmentWorldOffset(space).y/32,7729),t:space.collision.tileSize}));}
export function drawPlannedRuinEntranceGround(ctx,f,pilot=null){if(pilot?.ruin?.entrance(ctx,f,'ground'))return;drawRuinExteriorGroundD11_3(ctx,f,f.seed,null,f.t);}
export function drawPlannedRuinEntranceRear(ctx,f,pilot=null){if(pilot?.ruin?.entrance(ctx,f,'rear'))return;drawRuinExteriorRearD11_3(ctx,f,f.seed);}
export function drawPlannedRuinEntrance(ctx,f,pilot=null){if(pilot?.ruin?.entrance(ctx,f,'front'))return;drawRuinExteriorArchD11_3(ctx,f,f.seed);}

export function drawPlannedRuinModule(ctx,d,t,pilot=null){pilot?.ruin?.module?.(ctx,d,t);}
