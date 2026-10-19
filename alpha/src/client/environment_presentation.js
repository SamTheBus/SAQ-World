import {naturalVisualKind} from '../shared/generation/natural_clusters_v1.js';
import {plannedGroundPalette,drawPlannedSurfaceCell} from './planned_world_materials_v1.js';
import {drawRoadCell,drawRoadFillets,isRoad} from './road_presentation.js';
import {createEnvironmentLayout,obstacleTileVisualId,woodlandCanopyAt,naturalCanopyAt,naturalBasePose,naturalRockPose,naturalMarshPose,woodlandLandmarkForBlocker} from './environment_layout.js';
// SAQ source-derived outdoor materials and motifs, rasterized once per region.
// Geography/collision remain authoritative; decoration derives from campaign identity.
import {environmentWorldOffset,flowerMotion,environmentIdentity,environmentSeed,terrainHash,drawGuildBanner,drawDungeonProp,drawMushrooms,drawFlower,drawGrass,drawFern,drawLeafLitter,drawWoodlandStone,drawWoodlandLandmark,drawReeds,drawCanopy,drawRockCluster,drawThicketBase} from './environment_motifs.js';
import {drawFortBlockerD10,drawFortDecorationD10,drawFortDecorationShadowD10,drawFortKeepDoorD10,fortDecorationAnchor} from './fort_art_d10.js';
import {drawCaveBlockerD10,drawCaveDecorationD10,drawCaveDecorationShadowD10,caveDecorationAnchorD10} from './cave_art_d10.js';
import {drawRuinExteriorGroundD11_3,drawRuinExteriorRearD11_3,drawRuinExteriorArchD11_3} from './ruin_art_d11_3.js';
import {drawPlannedRuinModule,isPlannedRuinMasonry,drawPlannedRuinMasonry,drawPlannedRuinMasonryTile,drawPlannedRuinGroundDecoration,drawPlannedRuinRoots,plannedRuinEntranceFrames,drawPlannedRuinEntrance,drawPlannedRuinEntranceGround,drawPlannedRuinEntranceRear} from './planned_ruin_exterior_presentation.js';
import {depthItem} from './world_depth_presentation.js';
const TAU = Math.PI*2;
export function nearestRoadAnchor(space,exit,radius=5){const t=space.collision.tileSize,v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0,tx=Math.floor(exit.x/t),ty=Math.floor(exit.y/t),nearest=type=>{let best=null,distance=Infinity;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){if(v.terrain[ty+dy-oy]?.[tx+dx-ox]!==type)continue;const d=dx*dx+dy*dy;if(d<distance){distance=d;best={x:(tx+dx+.5)*t,y:(ty+dy+.5)*t};}}return best;};return nearest('r')??nearest('p');}
function polygon(ctx, points, fill, stroke = "#162e27") {
  ctx.beginPath(); points.forEach(([x,y],i)=>i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
  ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.stroke();
}
function building(ctx,b,tile) {
  const x=b.x*tile,y=b.y*tile,w=b.width*tile,h=b.height*tile;
  ctx.fillStyle="#20212a"; ctx.fillRect(x,y,w,h);
  ctx.fillStyle="#e5c992"; ctx.fillRect(x+3,y+h*.5,w-6,h*.5-3);
  ctx.strokeStyle="#4b2d20"; ctx.lineWidth=4; ctx.strokeRect(x+4,y+h*.5,w-8,h*.5-5);
  const blue = b.detail === "Vault" || b.detail === "Watch House";
  polygon(ctx,[[x+2,y+h*.53],[x+2,y+13],[x+w*.48,y+2],[x+w-2,y+13],[x+w-2,y+h*.53]],blue?"#304a81":"#a44229","#211c26");
  polygon(ctx,[[x+3,y+13],[x+w*.48,y+3],[x+w*.48,y+h*.43],[x+3,y+h*.53]],blue?"#5078b2":"#dc7540","#332137");
  ctx.strokeStyle=blue?"#90b6d9":"#ffb567"; ctx.lineWidth=1;
  for(let i=23;i<h*.5;i+=12) { ctx.beginPath();ctx.moveTo(x+6,y+i);ctx.lineTo(x+w-6,y+i-5);ctx.stroke(); }
  ctx.fillStyle="#362421";ctx.fillRect(x+w*.42,y+h*.72,w*.2,h*.27);
  ctx.fillStyle="#f1c40f";ctx.fillRect(x+14,y+h*.67,14,15);ctx.fillRect(x+w-28,y+h*.67,14,15);
  ctx.fillStyle="#394150";ctx.fillRect(x+w-22,y+6,9,19);ctx.fillStyle="#a8b3c4";ctx.fillRect(x+w-25,y+4,15,6);
  drawGuildBanner(ctx,x+w*.72,y+h*.53);
  ctx.font="600 10px Georgia";ctx.textAlign="center";
  const label=b.detail; const width=ctx.measureText(label).width+10;
  ctx.fillStyle="#1d2233";ctx.fillRect(x+w/2-width/2,y+h-17,width,14);
  ctx.fillStyle="#f2dda4";ctx.fillText(label,x+w/2,y+h-6);ctx.textAlign="left";
}
function drawFortBlocker(ctx,space,b,t){
  const offset=environmentWorldOffset(space),left=Math.floor(b.x),top=Math.floor(b.y),right=Math.ceil(b.x+b.width),bottom=Math.ceil(b.y+b.height),stone=['#59645b','#667067','#737b6e'],outline='#26312b';
  if(b.kind==='fort-prop-solid'){ctx.fillStyle='rgba(18,24,18,.42)';ctx.beginPath();ctx.ellipse((b.x+b.width/2)*t,(b.y+b.height*.82)*t,b.width*t*.48,b.height*t*.22,0,0,TAU);ctx.fill();return;}
  const x=b.x*t,y=b.y*t,w=b.width*t,h=b.height*t,n=terrainHash(left+offset.x/t,top+offset.y/t,941);
  ctx.fillStyle='rgba(12,20,16,.46)';ctx.beginPath();ctx.ellipse(x+w*.52,y+h+9,w*.5,Math.min(13,h*.28),0,0,TAU);ctx.fill();
  ctx.fillStyle='#3f4943';ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x+w,y+8);ctx.lineTo(x+w-3,y+h+5);ctx.lineTo(x+4,y+h+5);ctx.closePath();ctx.fill();
  ctx.fillStyle=stone[n%stone.length];ctx.beginPath();ctx.moveTo(x+2,y+2);ctx.lineTo(x+w-4,y+2);ctx.lineTo(x+w-10,y+h-8);ctx.lineTo(x+8,y+h-8);ctx.closePath();ctx.fill();ctx.strokeStyle=outline;ctx.lineWidth=2.25;ctx.stroke();
  ctx.fillStyle='#92998a';ctx.beginPath();ctx.moveTo(x+5,y+4);ctx.lineTo(x+w-7,y+4);ctx.lineTo(x+w-11,y+10);ctx.lineTo(x+9,y+10);ctx.closePath();ctx.fill();
  // Large uneven blocks read as hand-built masonry instead of a tile grid.
  ctx.strokeStyle='#3a443d';ctx.lineWidth=1.5;for(let row=0,yy=y+13;yy<y+h-7;row++,yy+=14){ctx.beginPath();ctx.moveTo(x+7,yy);ctx.lineTo(x+w-9,yy);ctx.stroke();let xx=x+8+((n>>>(row*3%21))&11);while(xx<x+w-13){const span=22+((terrainHash(Math.floor(xx/t),top+row,n)%19));ctx.beginPath();ctx.moveTo(xx,yy-13);ctx.lineTo(xx-2,yy);ctx.stroke();xx+=span;}}
  if(b.kind==='fort-wall'){const horizontal=b.width>=b.height;ctx.strokeStyle='#382418';ctx.lineWidth=6;ctx.beginPath();if(horizontal){ctx.moveTo(x+8,y+8);ctx.lineTo(x+w-8,y+8);}else{ctx.moveTo(x+8,y+7);ctx.lineTo(x+8,y+h-8);}ctx.stroke();ctx.strokeStyle='#a36c3d';ctx.lineWidth=2;ctx.stroke();}
  if(n%4===0){ctx.fillStyle='#66854d';ctx.beginPath();ctx.ellipse(x+w*.25,y+8,18,5,-.12,0,TAU);ctx.fill();ctx.fillStyle='#8da063';ctx.beginPath();ctx.ellipse(x+w*.31,y+6,10,3,.18,0,TAU);ctx.fill();}
}
function fortShadow(ctx,x,y,rx,ry){ctx.fillStyle='rgba(10,18,14,.42)';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function drawFortDecoration(ctx,d,t){
 const x=d.x*t,y=d.y*t,wood='#623a20',lightWood='#a66a38',stone='#677168',dark='#202b25',cloth=d.variant%2?'#304f66':'#7f2f2b';ctx.save();
 if(d.kind==='fort-keep-facade'){
  const w=d.width*t,h=d.height*t,l=x-w/2+t/2,top=y-h/2,front=top+h,doorX=x+t/2;fortShadow(ctx,doorX,front+13,w*.45,17);
  // Low three-quarter keep: broad roof plane, shallow south face and a clear door.
  polygon(ctx,[[l+134,top+78],[l+w-132,top+78],[l+w-145,front-104],[l+147,front-104]],'#744323','#251912');
  polygon(ctx,[[l+139,top+82],[doorX,top+58],[doorX,front-109],[l+151,front-109]],'#a16132','#251912');
  polygon(ctx,[[doorX,top+58],[l+w-138,top+82],[l+w-149,front-109],[doorX,front-109]],'#814725','#251912');
  ctx.strokeStyle='#c07b40';ctx.lineWidth=2;for(let yy=top+92;yy<front-114;yy+=20){ctx.beginPath();ctx.moveTo(l+148,yy);ctx.lineTo(l+w-146,yy);ctx.stroke();}
  ctx.fillStyle='#465149';ctx.beginPath();ctx.moveTo(l+13,front-70);ctx.lineTo(l+w-12,front-70);ctx.lineTo(l+w-4,front-7);ctx.lineTo(l+5,front-7);ctx.closePath();ctx.fill();ctx.strokeStyle='#26312b';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#747d70';for(let xx=l+17,i=0;xx<l+w-18;){const sw=28+((i*17)%23);ctx.beginPath();ctx.moveTo(xx,front-64+(i%2)*3);ctx.lineTo(Math.min(l+w-18,xx+sw),front-64);ctx.lineTo(Math.min(l+w-20,xx+sw-3),front-38);ctx.lineTo(xx+2,front-38);ctx.closePath();ctx.fill();ctx.strokeStyle='#3a443d';ctx.lineWidth=1.4;ctx.stroke();xx+=sw+3;i++;}
  ctx.fillStyle=wood;for(const xx of [l+30,l+w-37]){ctx.fillRect(xx,front-68,8,54);ctx.fillStyle=lightWood;ctx.fillRect(xx+2,front-66,2,49);ctx.fillStyle=wood;}
  for(const [dx,color] of [[-70,'#7f2f2b'],[70,'#304f66']]){ctx.strokeStyle='#2b1c13';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(doorX+dx,front-70);ctx.lineTo(doorX+dx,front-14);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(doorX+dx+3,front-65);ctx.lineTo(doorX+dx+(dx<0?27:-27),front-58);ctx.lineTo(doorX+dx+(dx<0?22:-22),front-31);ctx.lineTo(doorX+dx+3,front-39);ctx.closePath();ctx.fill();ctx.strokeStyle='#d3ad56';ctx.lineWidth=2;ctx.stroke();}
  ctx.fillStyle='#21150f';ctx.beginPath();ctx.moveTo(doorX-27,front-46);ctx.quadraticCurveTo(doorX,front-75,doorX+27,front-46);ctx.lineTo(doorX+27,front+7);ctx.lineTo(doorX-27,front+7);ctx.closePath();ctx.fill();ctx.fillStyle='#724323';ctx.fillRect(doorX-20,front-43,40,49);ctx.strokeStyle='#b77a3d';ctx.lineWidth=3;ctx.strokeRect(doorX-19,front-42,38,47);ctx.fillStyle='#ddb45b';ctx.beginPath();ctx.arc(doorX+10,front-18,3,0,TAU);ctx.fill();
 }
 else if(d.kind==='fort-gatehouse'){
  fortShadow(ctx,x,y+40,224,19);for(const side of [-1,1]){const cx=x+side*104,l=cx-63,r=cx+63;
   ctx.fillStyle='#414b45';ctx.beginPath();ctx.moveTo(l,y-38);ctx.lineTo(r,y-38);ctx.lineTo(r-5,y+38);ctx.lineTo(l+5,y+38);ctx.closePath();ctx.fill();ctx.strokeStyle='#253029';ctx.lineWidth=3;ctx.stroke();
   polygon(ctx,[[l-5,y-38],[cx,y-73],[r+5,y-38],[r-8,y-9],[l+8,y-9]],side<0?'#793f25':'#694126','#251912');
   polygon(ctx,[[l+2,y-37],[cx,y-67],[cx,y-12],[l+9,y-12]],side<0?'#aa6335':'#996038','#251912');
   ctx.fillStyle='#788176';for(let i=0,xx=l+10;xx<r-9;i++){const sw=23+(i*11)%19;ctx.beginPath();ctx.moveTo(xx,y-5+(i%2)*2);ctx.lineTo(Math.min(r-9,xx+sw),y-7);ctx.lineTo(Math.min(r-10,xx+sw-2),y+21);ctx.lineTo(xx+2,y+23);ctx.closePath();ctx.fill();ctx.strokeStyle='#38423b';ctx.lineWidth=1.3;ctx.stroke();xx+=sw+3;}
   ctx.fillStyle=wood;for(const px of [l+12,r-19]){ctx.fillRect(px,y-8,7,44);ctx.fillStyle=lightWood;ctx.fillRect(px+2,y-6,2,39);ctx.fillStyle=wood;}const bx=cx-side*43;ctx.strokeStyle='#302016';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(bx,y-34);ctx.lineTo(bx,y+22);ctx.stroke();ctx.fillStyle=side<0?'#7f2f2b':'#304f66';ctx.beginPath();ctx.moveTo(bx+side*2,y-30);ctx.lineTo(bx-side*22,y-24);ctx.lineTo(bx-side*18,y+4);ctx.lineTo(bx+side*2,y-4);ctx.closePath();ctx.fill();ctx.strokeStyle='#d3ad56';ctx.lineWidth=1.8;ctx.stroke();}
  ctx.fillStyle='#2f1d12';ctx.fillRect(x-55,y-36,110,13);ctx.fillStyle=lightWood;ctx.fillRect(x-49,y-33,98,4);for(const px of [-45,-20,20,45]){ctx.fillStyle='#3a2415';ctx.fillRect(x+px-3,y-32,6,42);}
 }
 else if(d.kind==='fort-watchtower'){
  fortShadow(ctx,x,y+28,44,13);ctx.fillStyle='#465149';ctx.beginPath();ctx.ellipse(x,y+5,45,34,0,0,TAU);ctx.fill();ctx.strokeStyle='#26312b';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#737d70';ctx.beginPath();ctx.ellipse(x,y-2,40,27,0,0,TAU);ctx.fill();ctx.stroke();polygon(ctx,[[x-47,y-8],[x,y-42],[x+47,y-8],[x+31,y+15],[x,y-18],[x-31,y+15]],cloth,'#251912');ctx.fillStyle='#b06a37';ctx.beginPath();ctx.moveTo(x-43,y-7);ctx.lineTo(x,y-36);ctx.lineTo(x,y-18);ctx.lineTo(x-30,y+10);ctx.closePath();ctx.fill();ctx.strokeStyle='#4c2e19';ctx.lineWidth=5;for(const dx of [-28,28]){ctx.beginPath();ctx.moveTo(x+dx,y+2);ctx.lineTo(x+dx,y+28);ctx.stroke();}
 }
 else if(d.kind==='fort-banner'){ctx.strokeStyle='#302016';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y-24);ctx.lineTo(x,y+23);ctx.stroke();ctx.fillStyle=cloth;ctx.beginPath();ctx.moveTo(x+2,y-20);ctx.lineTo(x+19,y-16);ctx.lineTo(x+16,y+11);ctx.lineTo(x+8,y+5);ctx.lineTo(x+2,y+9);ctx.closePath();ctx.fill();ctx.strokeStyle='#d4aa48';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(x+7,y-12);ctx.lineTo(x+14,y+1);ctx.moveTo(x+14,y-12);ctx.lineTo(x+7,y+1);ctx.stroke();}
 else if(d.kind==='fort-tent'||d.kind==='fort-lean-to'){const wide=d.kind==='fort-lean-to'?64:72;fortShadow(ctx,x,y+23,wide*.55,11);ctx.fillStyle=wood;ctx.fillRect(x-wide/2,y+16,wide,5);ctx.fillStyle=d.kind==='fort-lean-to'?'#586f45':'#6e5133';ctx.strokeStyle='#2c2319';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-wide/2-4,y+16);ctx.lineTo(x,y-25);ctx.lineTo(x+wide/2+4,y+16);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#9a7a4a';ctx.beginPath();ctx.moveTo(x,y-22);ctx.lineTo(x,y+14);ctx.lineTo(x+wide/2,y+16);ctx.closePath();ctx.fill();ctx.strokeStyle=wood;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-25);ctx.lineTo(x,y+21);ctx.stroke();}
 else if(d.kind==='fort-cart'){fortShadow(ctx,x,y+13,39,10);ctx.fillStyle=wood;ctx.fillRect(x-35,y-15,56,25);ctx.fillStyle=lightWood;ctx.fillRect(x-31,y-11,47,4);ctx.strokeStyle='#2b1b10';ctx.lineWidth=3;ctx.strokeRect(x-35,y-15,56,25);ctx.beginPath();ctx.moveTo(x+21,y+1);ctx.lineTo(x+47,y-7);ctx.stroke();for(const px of [-24,12]){ctx.fillStyle='#39291d';ctx.beginPath();ctx.arc(x+px,y+13,10,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#b0743d';ctx.beginPath();ctx.arc(x+px,y+13,3,0,TAU);ctx.fill();}}
 else if(d.kind==='fort-well'){fortShadow(ctx,x,y+11,29,10);ctx.fillStyle=stone;ctx.beginPath();ctx.ellipse(x,y+6,26,12,0,0,TAU);ctx.fill();ctx.strokeStyle='#343c38';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#142026';ctx.beginPath();ctx.ellipse(x,y+3,18,7,0,0,TAU);ctx.fill();ctx.fillStyle=wood;ctx.fillRect(x-25,y-30,4,34);ctx.fillRect(x+21,y-30,4,34);ctx.fillRect(x-27,y-32,54,5);ctx.fillStyle='#71502e';ctx.beginPath();ctx.arc(x,y-15,6,0,TAU);ctx.fill();}
 else if(d.kind==='fort-crates'||d.kind==='fort-supplies'){fortShadow(ctx,x,y+8,25,8);for(const [dx,dy,s] of [[-15,-7,19],[4,-3,20],[-2,-22,16]]){ctx.fillStyle=wood;ctx.fillRect(x+dx,y+dy,s,s);ctx.strokeStyle='#2a190f';ctx.lineWidth=2;ctx.strokeRect(x+dx,y+dy,s,s);ctx.strokeStyle=lightWood;ctx.beginPath();ctx.moveTo(x+dx+3,y+dy+3);ctx.lineTo(x+dx+s-3,y+dy+s-3);ctx.moveTo(x+dx+s-3,y+dy+3);ctx.lineTo(x+dx+3,y+dy+s-3);ctx.stroke();}}
 else if(d.kind==='fort-barrels'){fortShadow(ctx,x,y+12,30,9);for(const dx of [-14,8]){ctx.fillStyle='#734521';ctx.beginPath();ctx.ellipse(x+dx,y-8,11,6,0,0,TAU);ctx.fill();ctx.fillRect(x+dx-11,y-8,22,22);ctx.beginPath();ctx.ellipse(x+dx,y+14,11,6,0,0,TAU);ctx.fill();ctx.strokeStyle='#242723';ctx.lineWidth=2;for(const yy of [-5,8]){ctx.beginPath();ctx.moveTo(x+dx-10,y+yy);ctx.lineTo(x+dx+10,y+yy);ctx.stroke();}}}
 else if(d.kind==='fort-weapon-rack'){ctx.fillStyle=wood;ctx.fillRect(x-28,y+10,56,6);ctx.fillRect(x-24,y-20,5,34);ctx.fillRect(x+19,y-20,5,34);ctx.strokeStyle='#9eabb2';ctx.lineWidth=3;for(const dx of [-13,0,13]){ctx.beginPath();ctx.moveTo(x+dx,y-25);ctx.lineTo(x+dx,y+8);ctx.stroke();ctx.fillStyle='#c4ccd0';ctx.beginPath();ctx.moveTo(x+dx,y-29);ctx.lineTo(x+dx-4,y-20);ctx.lineTo(x+dx+4,y-20);ctx.closePath();ctx.fill();}}
 else if(d.kind==='fort-training-target'){ctx.fillStyle=wood;ctx.fillRect(x-3,y-2,6,25);ctx.fillRect(x-13,y+19,26,5);for(let r=15;r>3;r-=5){ctx.fillStyle=r%10?'#d7c28b':'#7e3029';ctx.beginPath();ctx.arc(x,y-10,r,0,TAU);ctx.fill();}ctx.fillStyle='#2d3030';ctx.beginPath();ctx.arc(x,y-10,3,0,TAU);ctx.fill();}
 else if(d.kind==='fort-fire'){fortShadow(ctx,x,y+8,26,8);ctx.strokeStyle='#6a4426';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x-19,y+10);ctx.lineTo(x+18,y-8);ctx.moveTo(x-18,y-8);ctx.lineTo(x+19,y+10);ctx.stroke();ctx.fillStyle='#d85a27';ctx.beginPath();ctx.moveTo(x-13,y+4);ctx.quadraticCurveTo(x-6,y-27,x,y-8);ctx.quadraticCurveTo(x+9,y-34,x+14,y+4);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd36a';ctx.beginPath();ctx.moveTo(x-6,y+3);ctx.quadraticCurveTo(x,y-18,x+7,y+3);ctx.closePath();ctx.fill();}
 else if(d.kind==='fort-table'){fortShadow(ctx,x,y+10,33,8);ctx.fillStyle=wood;ctx.fillRect(x-32,y-10,64,14);ctx.fillStyle=lightWood;ctx.fillRect(x-28,y-7,56,3);ctx.strokeStyle='#2b1b10';ctx.lineWidth=2;ctx.strokeRect(x-32,y-10,64,14);for(const px of [-25,20])ctx.fillRect(x+px,y+3,5,15);}
 else if(d.kind==='fort-shrub'){fortShadow(ctx,x,y+8,24,8);ctx.fillStyle=['#2c6b39','#3d7c42','#547f43','#356f49'][d.variant%4];for(const [dx,dy,r] of [[-14,1,13],[1,-7,17],[16,1,12]]){ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,TAU);ctx.fill();}ctx.fillStyle='#779856';ctx.beginPath();ctx.arc(x+5,y-12,7,0,TAU);ctx.fill();}
 else if(d.kind==='fort-vines'){ctx.strokeStyle='#426a35';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y-26);ctx.bezierCurveTo(x+25,y-6,x-18,y+16,x+11,y+37);ctx.stroke();ctx.fillStyle='#6f9850';for(const [dx,dy,a] of [[8,-14,.4],[-2,1,-.4],[6,17,.6]]){ctx.beginPath();ctx.ellipse(x+dx,y+dy,8,4,a,0,TAU);ctx.fill();}}
 else if(d.kind==='fort-roots'){ctx.strokeStyle='#674528';ctx.lineWidth=5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x,y-18);ctx.quadraticCurveTo(x+i*12,y+2,x+i*21,y+24);ctx.stroke();}}
 else if(d.kind==='fort-moss'){ctx.fillStyle='rgba(105,139,72,.78)';for(const [dx,dy,rx] of [[-22,0,19],[5,-4,22],[27,3,15]]){ctx.beginPath();ctx.ellipse(x+dx,y+dy,rx,6+(rx%5),0,0,TAU);ctx.fill();}}
 ctx.restore();
}
function drawFortKeepDoor(ctx,exit){const x=exit.x,y=exit.y;fortShadow(ctx,x,y+24,34,9);ctx.fillStyle='#4d5852';ctx.beginPath();ctx.moveTo(x-35,y-26);ctx.quadraticCurveTo(x,y-54,x+35,y-26);ctx.lineTo(x+35,y+20);ctx.lineTo(x-35,y+20);ctx.closePath();ctx.fill();ctx.strokeStyle='#27312c';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#92998a';ctx.beginPath();ctx.moveTo(x-29,y-26);ctx.quadraticCurveTo(x,y-47,x+29,y-26);ctx.lineTo(x+29,y-19);ctx.quadraticCurveTo(x,y-39,x-29,y-19);ctx.closePath();ctx.fill();ctx.fillStyle='#2a190f';ctx.beginPath();ctx.moveTo(x-24,y-22);ctx.quadraticCurveTo(x,y-43,x+24,y-22);ctx.lineTo(x+24,y+20);ctx.lineTo(x-24,y+20);ctx.closePath();ctx.fill();ctx.fillStyle='#774522';ctx.fillRect(x-18,y-22,36,41);ctx.strokeStyle='#c28a48';ctx.lineWidth=3;ctx.strokeRect(x-17,y-21,34,39);ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x,y+17);ctx.stroke();ctx.fillStyle='#e0b755';ctx.beginPath();ctx.arc(x+9,y-1,3,0,TAU);ctx.fill();}
// Dungeon's pre-rendered floors separate materials with opaque shapes and sparse
// coordinate-derived accents. Open-world meadow patches adapt that language; the
// g/f generation labels remain unchanged but no longer impose rectangular paint.
function drawGrassGround(ctx,bounds,seed,offset={x:0,y:0},biomeAt=()=>null){
  const palette=b=>plannedGroundPalette(b)??(b==='r'?['#756f58','#837b61','#666550']:b==='m'?['#315f50','#3a705a','#285449']:['#356f43','#43814b','#2f653c']);
  const minX=Math.floor(bounds.x/32)-1,maxX=Math.floor((bounds.x+bounds.width)/32)+1,minY=Math.floor(bounds.y/32)-1,maxY=Math.floor((bounds.y+bounds.height)/32)+1,code=(x,y)=>biomeAt(x*32+16,y*32+16)??'w';
  ctx.fillStyle=palette('w')[0];ctx.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);
  for(let y=minY;y<=maxY;y++){let start=minX,current=code(start,y);for(let x=minX+1;x<=maxX+1;x++){const next=x<=maxX?code(x,y):null;if(next===current)continue;if(current!=='w'){ctx.fillStyle=palette(current)[0];ctx.fillRect(start*32,y*32,(x-start)*32,32);}start=x;current=next;}}
  const feather=(x,y,a,b,vertical)=>{const n=terrainHash(Math.floor(x/32),Math.floor(y/32),seed+191),count=a==='w'||b==='w'?7:4;for(let i=0;i<count;i++){const along=-15+i*5+((n>>>(i*3%24))&3),cross=3+((n>>>(i*4+1)%24)&7),toward=i%2===0?a:b;ctx.fillStyle=palette(toward)[1+i%2];ctx.beginPath();if(vertical)ctx.ellipse(x+(toward===a?cross:-cross),y+along,6+(n+i)%6,4+(n>>>i)%5,(i-2.5)*.1,0,TAU);else ctx.ellipse(x+along,y+(toward===a?cross:-cross),4+(n>>>i)%5,6+(n+i)%6,(i-2.5)*.1,0,TAU);ctx.fill();}};
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const here=code(x,y),right=code(x+1,y),down=code(x,y+1);if(here!==right)feather((x+1)*32,y*32+16,here,right,true);if(here!==down)feather(x*32+16,(y+1)*32,here,down,false);}
  const step=128;
  for(let gy=Math.floor((bounds.y+offset.y)/step)-1;gy<=Math.floor((bounds.y+bounds.height+offset.y)/step)+1;gy++)
  for(let gx=Math.floor((bounds.x+offset.x)/step)-1;gx<=Math.floor((bounds.x+bounds.width+offset.x)/step)+1;gx++){
    const n=terrainHash(gx,gy,seed+53);if(n%3===0)continue;
    const cx=gx*step-offset.x+32+n%65,cy=gy*step-offset.y+32+(n>>>8)%65;
    const rx=48+(n>>>14)%29,ry=35+(n>>>20)%25;
    ctx.fillStyle=palette(biomeAt(cx,cy)??'w')[n%2?1:2];ctx.beginPath();
    // Smoothly joined irregular lobes, with crisp cel-shaded edges (no blur).
    const points=Array.from({length:10},(_,i)=>{const angle=i*TAU/10,r=.78+(terrainHash(gx+i,gy,seed+71)%24)/100;return [cx+Math.cos(angle)*rx*r,cy+Math.sin(angle)*ry*r];});
    const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];ctx.moveTo(...mid(points[9],points[0]));
    for(let i=0;i<10;i++)ctx.quadraticCurveTo(...points[i],...mid(points[i],points[(i+1)%10]));
    ctx.closePath();ctx.fill();
    if((biomeAt(cx,cy)??'w')==='w'&&n%4!==0){ctx.fillStyle=n%2?'#536b39':'#6f6134';ctx.globalAlpha=.32;ctx.beginPath();ctx.ellipse(cx-rx*.18,cy+ry*.08,rx*.38,ry*.22,(n%7-3)*.08,0,TAU);ctx.fill();ctx.globalAlpha=1;}
  }
}
function drawWoodlandRoadAccents(ctx,at,biomeAt,minX,maxX,minY,maxY,t,seed,offset){
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){if(!isRoad(at(x,y))||biomeAt(x*t+16,y*t+16)!=='w')continue;const n=terrainHash(x+offset.x/t,y+offset.y/t,seed+313);if(n%3===0)continue;const edges=[];if(!isRoad(at(x-1,y)))edges.push([4,12+(n>>>4)%10]);if(!isRoad(at(x+1,y)))edges.push([t-4,11+(n>>>7)%11]);if(!isRoad(at(x,y-1)))edges.push([11+(n>>>10)%11,4]);if(!isRoad(at(x,y+1)))edges.push([10+(n>>>13)%12,t-4]);if(!edges.length)continue;const [dx,dy]=edges[(n>>>16)%edges.length];drawLeafLitter(ctx,x*t+dx,y*t+dy,n);if(n%5===0)drawFern(ctx,x*t+dx+(dx<t/2?5:-5),y*t+dy+2,n,.72);}
}
function projectedBlockerTiles(blockers,bounds=null){const result=new Set(),left=bounds?Math.floor(bounds.x/32)-1:-Infinity,top=bounds?Math.floor(bounds.y/32)-1:-Infinity,right=bounds?Math.floor((bounds.x+bounds.width)/32)+1:Infinity,bottom=bounds?Math.floor((bounds.y+bounds.height)/32)+1:Infinity;for(const b of blockers??[])for(let y=Math.max(Math.floor(b.y),top);y<Math.min(Math.ceil(b.y+b.height),bottom);y++)for(let x=Math.max(Math.floor(b.x),left);x<Math.min(Math.ceil(b.x+b.width),right);x++)result.add(x+','+y);return result;}
export function woodlandGroundDetail(space,x,y,blockedTiles=null){
 const t=space.collision.tileSize,v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0,row=y-oy,col=x-ox,type=v.terrain[row]?.[col],biome=v.biomes?.[row]?.[col]??'o';
 // D9 clients expose projected terrain and blocker footprints, not authority
 // collision rows. Oldward's authored forest floor is `o` + `f`; Alderwatch
 // is `o` + `g`, so the town remains deliberately undressed.
 if(!((biome==='w'&&(type==='g'||type==='f'))||(biome==='o'&&type==='f'))||isRoad(type)||(blockedTiles??projectedBlockerTiles(v.blockers)).has(x+','+y))return null;
 const seed=environmentSeed(space),offset=environmentWorldOffset(space),wx=x+offset.x/t,wy=y+offset.y/t,n=terrainHash(wx,wy,seed),cluster=terrainHash(Math.floor(wx/4),Math.floor(wy/4),seed+19);
 // Only two of seven four-tile pockets dress, then one quarter of their cells.
 // This leaves large intentional rests while retaining small natural clusters.
 if(cluster%7>1||n%4!==0)return null;const px=x*t,py=y*t,dx=7+n%19,dy=11+(n>>>8)%17,kind=(n>>>13)%10;
 return {id:`${x},${y}:${kind}`,x:px+dx,y:py+dy,motionX:px+dx+offset.x,motionY:py+dy+offset.y,n,kind};
}
function drawWoodlandDetail(ctx,detail,bounds,flowers,art,pilot=null,space=null){
 if(!detail)return 0;const {x,y,motionX,motionY,n,kind}=detail;
 if(kind<=2){drawGrass(ctx,x,y,n);if(kind===2)drawLeafLitter(ctx,x-5,y+3,n);}
 else if(kind<=4)drawFern(ctx,x,y,n,.72+(n%3)*.08);
 else if(kind===5)drawLeafLitter(ctx,x,y,n);
 else if(kind===6){if(!pilot?.rock(ctx,space,x-5,y-5,10,n))drawWoodlandStone(ctx,x,y,n);}
 else if(kind===7)drawMushrooms(ctx,x,y,n);
 else{if(art&&flowers.length<4&&x>=bounds.x&&y>=bounds.y&&x<bounds.x+bounds.width&&y<bounds.y+bounds.height)flowers.push({x,y,n,motionX,motionY});else drawFlower(ctx,x,y,n);}
 return 1;
}
export function drawEnvironment(ctx,space,viewport=null,layout=createEnvironmentLayout(space),art=null){const work=prepareEnvironmentDrawing(ctx,space,viewport,layout,art);let next;do{next=work.next();}while(!next.done);return next.value;}
export function* prepareEnvironmentDrawing(ctx,space,viewport=null,layout=createEnvironmentLayout(space),art=null,pilot=null) {
  const c=space.collision,t=c.tileSize,v=space.visual;
  const seed=environmentSeed(space),offset=environmentWorldOffset(space);
  const ox=v.originTile?.x??0,oy=v.originTile?.y??0,terrainAt=(x,y)=>v.terrain[y-oy]?.[x-ox];
  const bounds=viewport??{x:0,y:0,width:c.width*t,height:c.height*t};
  const minX=c.endless?Math.floor(bounds.x/t):Math.max(0,Math.floor(bounds.x/t)),maxX=c.endless?Math.floor((bounds.x+bounds.width)/t):Math.min(c.width-1,Math.floor((bounds.x+bounds.width)/t));
  const minY=c.endless?Math.floor(bounds.y/t):Math.max(0,Math.floor(bounds.y/t)),maxY=c.endless?Math.floor((bounds.y+bounds.height)/t):Math.min(c.height-1,Math.floor((bounds.y+bounds.height)/t));
  // A single opaque ground pass precedes dirt. No later cell may erase a join.
  if(!pilot?.covers(space,bounds))drawGrassGround(ctx,bounds,seed,offset,(x,y)=>v.biomes?.[Math.floor(y/32)-oy]?.[Math.floor(x/32)-ox]);pilot?.drawGround(ctx,space,bounds);
  for(let y=minY-1;y<=maxY;y++)for(let x=minX-1;x<=maxX;x++) {
    if(!isRoad(terrainAt(x,y)))drawRoadFillets(ctx,terrainAt,x,y,t);
  }
  for(const material of ['r','p'])for(let y=minY-1;y<=maxY;y++)for(let x=minX-1;x<=maxX;x++) {
    if(terrainAt(x,y)===material)drawRoadCell(ctx,terrainAt,x,y,t,seed,offset,pilot?.eligible(space,x*t,y*t)?pilot.road:null);
  }
  pilot?.roadOverlay?.(ctx,space,bounds,terrainAt);
  const biomeAt=(x,y)=>v.biomes?.[Math.floor(y/t)-oy]?.[Math.floor(x/t)-ox];drawWoodlandRoadAccents(ctx,terrainAt,biomeAt,minX-1,maxX+1,minY-1,maxY+1,t,seed,offset);
  let paintedTerrainTiles=0,paintedBlockers=0,paintedDecorations=0;const flowers=[],obstacleVisualIds=[],woodlandDetailIds=[];
  for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
    yield;if(terrainAt(x,y)===undefined)continue;
    paintedTerrainTiles++;
    const type=terrainAt(x,y),n=terrainHash(x+offset.x/t,y+offset.y/t,seed),px=x*t,py=y*t;
    if(type==='v'){ctx.fillStyle='#070b12';ctx.fillRect(px,py,t,t);continue;}
    if(drawPlannedSurfaceCell(ctx,type,v.biomes?.[y-oy]?.[x-ox],x,y,t,seed,offset,terrainAt)){pilot?.drawSurface(ctx,space,type,x,y,t,terrainAt);continue;}
    if(!isRoad(type)) {
      const biome=v.biomes?.[y-oy]?.[x-ox]??'w';
      const cluster=terrainHash(Math.floor((x+offset.x/t)/3),Math.floor((y+offset.y/t)/3),seed+19);
      // Woodland uses the same coordinate-derived detail rule in fallback and
      // completed pages so raster replacement cannot visibly repopulate it.
      if(biome==='w'||biome==='o'){const detail=woodlandGroundDetail(space,x,y,layout.occupiedTiles);if(detail){paintedDecorations+=drawWoodlandDetail(ctx,detail,bounds,flowers,art,pilot,space);woodlandDetailIds.push(detail.id);}}
      else {const density=biome==='m'?4:6;
      if(cluster%4!==0&&n%density!==0&&layout.allowsSmall(px+8+n%17,py+12+(n>>>8)%16)){
        const dx=8+n%17,dy=12+(n>>>8)%16;
        if(biome==='r'){ctx.fillStyle=n%2?'#b5a675':'#504f45';ctx.beginPath();ctx.ellipse(px+dx,py+dy,2+n%3,1.3,0,0,TAU);ctx.fill();paintedDecorations++;if(n%7===0)drawGrass(ctx,px+dx-5,py+dy+3,n);}
        else if(biome==='m'){drawReeds(ctx,px+dx,py+dy,n);paintedDecorations++;if(cluster%5===0&&n%3===1){drawMushrooms(ctx,px+dx+7,py+dy+2);paintedDecorations++;}}
      }}
    }
  }
  for(const b of v.blockers) {
    yield;
    const x=b.x*t,y=b.y*t,w=b.width*t,h=b.height*t;
    if(x+w<=bounds.x||y+h<=bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)continue;
    paintedBlockers++;
    if(b.kind.startsWith('fort-'))drawFortBlockerD10(ctx,space,b,t);
    else if(b.kind==='cave-rock-wall')drawCaveBlockerD10(ctx,space,b,t);
    else if(isPlannedRuinMasonry(b))obstacleVisualIds.push(...drawPlannedRuinMasonry(ctx,space,b,bounds,pilot));else if(b.kind==='ruin-exterior-masonry'){} // Legacy facade owns its mask.

    else if(b.kind==="building") building(ctx,b,t);
    else if(b.kind==="fence") {
      ctx.fillStyle="#263d2c";ctx.fillRect(x,y,w,h);
      ctx.fillStyle="#ac713b";
      const horizontal=w>h;
      if(horizontal) {ctx.fillRect(x,y+10,w,5);ctx.fillRect(x,y+23,w,4);}
      else {ctx.fillRect(x+10,y,5,h);ctx.fillRect(x+23,y,4,h);}
      for(let i=0;i<(horizontal?w:h);i+=16)ctx.fillRect(x+(horizontal?i:7),y+(horizontal?7:i),horizontal?5:22,horizontal?22:5);
    }
    if(b.kind==='building'||b.kind==='fence')for(let ty=b.y;ty<b.y+b.height;ty++)for(let tx=b.x;tx<b.x+b.width;tx++)obstacleVisualIds.push(obstacleTileVisualId(b,tx,ty,'solid'));
  }
  for(const base of layout.treeBases){yield;const {x,y,w,h,n,biome}=base;if(x+w<=bounds.x||y+h<=bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)continue;if(!pilot?.base?.(ctx,space,x,y,w,n,biome))drawThicketBase(ctx,x,y,w,n,biome);obstacleVisualIds.push(base.id);}
  for(const rock of layout.rocks){yield;const {x,y,size,n,biome,organic}=rock;if(x+size<=bounds.x||y+size<=bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)continue;if(!pilot?.rock(ctx,space,x,y,size,n))drawRockCluster(ctx,x,y,size,n,biome,organic);obstacleVisualIds.push(rock.id);}
  for(const tree of layout.trees){yield;const {x,y,size,n}=tree;if(x+size<=bounds.x||y+size<=bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)continue;
    if(!pilot?.treeShadow?.(ctx,space,x,y,size,n)){ctx.fillStyle=tree.biome==='marsh'?'#183f34':'#214c2f';ctx.beginPath();ctx.ellipse(x+size*.5,y+size*.68,size*.4,size*.24,-.12,0,TAU);ctx.fill();}
    if(tree.biome==='marsh')drawReeds(ctx,x+size*.24,y+size*.83,n);
    if(!pilot?.tree(ctx,space,x,y,size,n)){if(art)art.tree(ctx,x,y,size,n);else drawCanopy(ctx,x,y,size,n);}obstacleVisualIds.push(tree.id);
  }
  for(const landmark of layout.landmarks??[]){yield;if(landmark.x<bounds.x-34||landmark.y<bounds.y-34||landmark.x>bounds.x+bounds.width+34||landmark.y>bounds.y+bounds.height+34)continue;drawWoodlandLandmark(ctx,landmark);paintedDecorations++;}
  for(const p of layout.props){yield;if(p.x<bounds.x-20||p.y<bounds.y-20||p.x>bounds.x+bounds.width+20||p.y>bounds.y+bounds.height+20)continue;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(.75,.75);drawDungeonProp(ctx,p,-16,-16,32);ctx.restore();
  }
  // Contact shadows belong to the immutable raster pages. The upper object is
  // replayed by the depth painter at its stable ground anchor.
  for(const d of v.decorations??[]){if(!d.kind.startsWith('fort-')&&!d.kind.startsWith('cave-'))continue;const x=d.x*t,y=d.y*t;if(x<bounds.x-560||y<bounds.y-320||x>bounds.x+bounds.width+560||y>bounds.y+bounds.height+320)continue;if(d.kind.startsWith('fort-'))drawFortDecorationShadowD10(ctx,d,t);else drawCaveDecorationShadowD10(ctx,d,t);}
  for(const d of v.decorations??[]){const margin=d.kind.startsWith('ruin-grove-')?128:32;if(d.plannedRuinExterior&&d.x*t>=bounds.x-margin&&d.y*t>=bounds.y-margin&&d.x*t<=bounds.x+bounds.width+margin&&d.y*t<=bounds.y+bounds.height+margin){drawPlannedRuinGroundDecoration(ctx,d,t,pilot);paintedDecorations++;}}
  for(const f of plannedRuinEntranceFrames(space))if(f.x>=bounds.x-192&&f.y>=bounds.y-192&&f.x<=bounds.x+bounds.width+192&&f.y<=bounds.y+bounds.height+192)drawPlannedRuinEntranceGround(ctx,f,pilot);
  // Exit signage occupies a passable marker, not a solid door or wall.
  for(const exit of space.exits) {
    if(exit.ferryLandingId||exit.siteKind==='civilian-tavern')continue; // Building art owns the door/sign; the standard context prompt supplies text.
    const exitPaintMargin=exit.siteKind==='woodland-ruin'?192:32;
    if(exit.x<bounds.x-exitPaintMargin||exit.y<bounds.y-exitPaintMargin||exit.x>bounds.x+bounds.width+exitPaintMargin||exit.y>bounds.y+bounds.height+exitPaintMargin)continue;
    if(exit.siteAction){
      if(exit.proceduralRuin)continue; // The original facade is projected independently of activation/exit culling.
      if(exit.siteKind==='woodland-fort-keep'||exit.siteKind==='woodland-cave')continue;
      if(exit.siteKind==='woodland-site-candidate'){
        // An unbound socket advertises only a generic functional Woodland
        // threshold. The package name and ruin facade appear only after the
        // authoritative content binding chooses this exact socket.
        const x=exit.x,y=exit.y,n=terrainHash(Math.floor(x/t),Math.floor(y/t),seed+811);
        ctx.fillStyle='#c5a66e';ctx.beginPath();ctx.moveTo(x-25,y+14);ctx.lineTo(x+25,y+14);ctx.lineTo(x+17,y+42);ctx.quadraticCurveTo(x,y+47,x-17,y+42);ctx.closePath();ctx.fill();
        ctx.fillStyle='#26382d';ctx.beginPath();ctx.ellipse(x,y+30,28,8,0,0,TAU);ctx.fill();
        for(const side of [-1,1]){ctx.fillStyle='#4c5751';ctx.strokeStyle='#202b26';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+side*28,y+13);ctx.lineTo(x+side*27,y-23);ctx.lineTo(x+side*17,y-29);ctx.lineTo(x+side*14,y+12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#879083';ctx.fillRect(x+side*(side<0?23:25)-3,y-20,5,22);}
        ctx.strokeStyle='#416e3d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-27,y-12);ctx.quadraticCurveTo(x-17,y-25,x-13,y-8);ctx.moveTo(x+27,y-17);ctx.quadraticCurveTo(x+20,y-28,x+14,y-7);ctx.stroke();ctx.fillStyle='#66a34f';for(const [dx,dy] of [[-24,-18],[-17,-23],[22,-22],[16,-15]]){ctx.beginPath();ctx.ellipse(x+dx,y+dy,5,3,(n%5-2)*.08,0,TAU);ctx.fill();}
        ctx.fillStyle='#e8dba6';ctx.strokeStyle='#19241f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-18);ctx.lineTo(x+6,y-10);ctx.lineTo(x,y-2);ctx.lineTo(x-6,y-10);ctx.closePath();ctx.fill();ctx.stroke();
        continue;
      }
      if(exit.siteKind==='woodland-ruin'){
        const x=exit.x,y=exit.y,n=terrainHash(Math.floor(x/t),Math.floor(y/t),seed+907);
        const roadAnchor=nearestRoadAnchor(space,exit);
        // Ground wear and loose masonry stay in the static raster. The tall
        // broken arch is replayed in the depth pass at its threshold anchor,
        // so player overlap is deliberate rather than a walk-through mismatch.
        drawRuinExteriorGroundD11_3(ctx,exit,n,roadAnchor,t);
        continue;
      }
      // Walkable stone threshold and an open frame, using Dungeon's cool
      // masonry faces/caps and guild colors; not a new obstructing building.
      const x=exit.x,y=exit.y;
      if(isRoad(terrainAt(Math.floor(x/t),Math.floor((y+34)/t)))){
        ctx.fillStyle='#c9a36a';ctx.beginPath();ctx.moveTo(x-24,y+14);ctx.lineTo(x+24,y+14);ctx.lineTo(x+15,y+42);ctx.quadraticCurveTo(x,y+47,x-15,y+42);ctx.closePath();ctx.fill();
      }
      ctx.fillStyle='#39475d';ctx.fillRect(x-27,y-20,54,44);
      ctx.fillStyle='#8295ad';ctx.fillRect(x-24,y+8,48,7);ctx.fillRect(x-27,y+19,54,6);
      ctx.fillStyle='#161e2b';ctx.fillRect(x-24,y-34,10,46);ctx.fillRect(x+14,y-34,10,46);
      ctx.fillStyle='#687f9f';ctx.fillRect(x-24,y-34,7,42);ctx.fillRect(x+14,y-34,7,42);
      ctx.fillStyle='#b4c5d7';ctx.fillRect(x-27,y-36,54,7);
      ctx.strokeStyle='#27364b';ctx.lineWidth=1.5;for(let j=-23;j<10;j+=10){ctx.beginPath();ctx.moveTo(x-24,y+j);ctx.lineTo(x-14,y+j);ctx.moveTo(x+14,y+j);ctx.lineTo(x+24,y+j);ctx.stroke();}
      ctx.save();ctx.translate(x-18,y-30);ctx.scale(.65,.65);drawGuildBanner(ctx,0,0);ctx.restore();
      ctx.font='bold 12px Georgia';ctx.textAlign='center';const label=exit.label.replace(/^Enter /,'');
      const width=ctx.measureText(label).width+14;ctx.fillStyle='#192233';ctx.fillRect(x-width/2,y+30,width,19);ctx.strokeStyle='#d4af37';ctx.lineWidth=1;ctx.strokeRect(x-width/2,y+30,width,19);
      ctx.fillStyle='#f1c40f';ctx.fillText(label,x,y+44);ctx.textAlign='left';continue;
    }
    ctx.strokeStyle="#dfc18a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(exit.x,exit.y,19,0,TAU);ctx.stroke();
    ctx.fillStyle="#e6d2a0";ctx.font="bold 15px Georgia";ctx.textAlign="center";
    ctx.fillText(exit.y<100?"↑":exit.y>700?"↓":exit.x<100?"←":"→",exit.x,exit.y+5);ctx.textAlign="left";
  }
  return Object.freeze({flowers,obstacleVisualIds,woodlandDetailIds,paintedTerrainTiles,paintedBlockers,paintedDecorations,totalTerrainTiles:c.width*c.height});
}

export function drawEnvironmentMarkers(ctx,space){
  // Functional names are dynamic overlays so a long phone-readable label can
  // cross a 256px raster-page boundary without being clipped by either page.
  // Decorative landmarks never enter space.exits and receive no treatment.
  for(const exit of space.exits??[])if(exit.siteAction&&exit.proceduralRuin){const label=exit.label.replace(/^Enter /,''),y=exit.y-196;ctx.font='600 11px Georgia';ctx.textAlign='center';const width=ctx.measureText(label).width+12;ctx.fillStyle='#19241fdd';ctx.fillRect(exit.x-width/2,y,width,17);ctx.fillStyle='#e8dba6';ctx.fillText(label,exit.x,y+12);ctx.textAlign='left';}
  for(const exit of space.exits??[])if(exit.siteAction&&!exit.proceduralRuin&&['woodland-site-candidate','woodland-ruin'].includes(exit.siteKind)){
    const ruin=exit.siteKind==='woodland-ruin',label=ruin?'Overgrown Ruin':'Unidentified Woodland Site',labelY=ruin?exit.y-196:exit.y+51;ctx.font=ruin?'600 10px Georgia':'bold 12px Georgia';ctx.textAlign='center';const width=ctx.measureText(label).width+(ruin?10:12);ctx.fillStyle='#19241fdd';ctx.fillRect(exit.x-width/2,labelY,width,ruin?15:17);ctx.strokeStyle='#91a36c';ctx.strokeRect(exit.x-width/2,labelY,width,ruin?15:17);ctx.fillStyle='#e8dba6';ctx.fillText(label,exit.x,labelY+(ruin?11:12));ctx.textAlign='left';
  }
  if(space.settlementSafe) {
    // Painted checkpoint medallion: deliberately walkable, no service action.
    const marker=space.overworld?.safeRegions[0]?.marker??{x:528,y:368,label:"ALDERWATCH"};
    ctx.strokeStyle="#d4bc7a";ctx.lineWidth=2;ctx.beginPath();ctx.arc(marker.x,marker.y,22,0,TAU);ctx.stroke();
    ctx.font="11px Georgia";ctx.fillStyle="#eadca5";ctx.textAlign="center";ctx.fillText(marker.label,marker.x,marker.y+38);ctx.textAlign="left";
  }
  const clue=space.overworld?.siteClue?.trailhead;
  if(clue){
    // A low trail stone is a direction clue, not an entrance or remote map
    // reveal. Its location is the already-walkable historical egress.
    ctx.save();ctx.translate(clue.x,clue.y);ctx.fillStyle='#273a30';ctx.strokeStyle='#17251e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,9);ctx.lineTo(-7,-13);ctx.quadraticCurveTo(0,-18,8,-12);ctx.lineTo(11,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#70a85c';ctx.beginPath();ctx.ellipse(-1,-5,6,3,-.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b9cc85';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-5,1);ctx.lineTo(5,-9);ctx.stroke();ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillStyle='#e4d8a3';ctx.fillText(`${clue.trailLabel??'Woodland trail'} · ${clue.direction}`,0,25);ctx.textAlign='left';ctx.restore();
  }
  // A continuous trail now carries the navigation cue. Freestanding FRONTIER
  // signage made seamless geography read like a level boundary.
}
export function drawCollisionCoverageDebug(ctx,space,view){
 const t=space.collision.tileSize,v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0;ctx.save();ctx.font='8px monospace';ctx.textAlign='center';
 for(const b of v.blockers??[])if(['thicket','trees','rock','building','fence','cave-rock-wall','ruin-exterior-masonry'].includes(b.kind)||b.kind.startsWith('fort-'))for(let ty=b.y;ty<b.y+b.height;ty++)for(let tx=b.x;tx<b.x+b.width;tx++){const x=tx*t,y=ty*t;if(x+t<view.x||y+t<view.y||x>view.x+view.width||y>view.y+view.height)continue;const code=v.biomes?.[ty-oy]?.[tx-ox]??(b.kind==='rock'?'r':'w'),authored=b.kind==='cave-rock-wall'||b.kind==='ruin-exterior-masonry'||b.kind.startsWith('fort-'),kind=b.kind==='building'||b.kind==='fence'||authored?'solid':naturalVisualKind(code,b.kind),coverage=kind==='solid'?1:kind==='tree'?0.92:kind==='rock'?0.86:0.88,margin=(1-Math.sqrt(coverage))*t/2;ctx.fillStyle='rgba(227,65,55,.18)';ctx.fillRect(x,y,t,t);ctx.strokeStyle='rgba(255,91,73,.9)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,t-1,t-1);ctx.fillStyle='rgba(80,226,122,.18)';ctx.fillRect(x+margin,y+margin,t-margin*2,t-margin*2);ctx.strokeStyle='rgba(99,255,145,.95)';ctx.strokeRect(x+margin,y+margin,t-margin*2,t-margin*2);ctx.fillStyle='#efffe9';ctx.fillText(Math.round(coverage*100)+'%',x+t/2,y+t/2+3);}
 ctx.textAlign='left';ctx.restore();
}
export function drawRequiredObstacleVisual(ctx,space,b,tx,ty,pilot=null){
 if(isPlannedRuinMasonry(b))return drawPlannedRuinMasonryTile(ctx,space,b,tx,ty,pilot);
 const t=space.collision.tileSize,v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0,seed=environmentSeed(space),offset=environmentWorldOffset(space),code=v.biomes?.[ty-oy]?.[tx-ox]??(b.kind==='rock'?'r':'w'),n=terrainHash(tx+offset.x/t,ty+offset.y/t,seed+113),visualKind=naturalVisualKind(code,b.kind),id=obstacleTileVisualId(b,tx,ty,visualKind);
 if(b.kind==='building'){building(ctx,b,t);return obstacleTileVisualId(b,tx,ty,'solid');}if(b.kind==='fence'){const x=b.x*t,y=b.y*t,w=b.width*t,h=b.height*t;ctx.fillStyle='#263d2c';ctx.fillRect(x,y,w,h);ctx.fillStyle='#ac713b';const horizontal=w>h;if(horizontal){ctx.fillRect(x,y+10,w,5);ctx.fillRect(x,y+23,w,4);}else{ctx.fillRect(x+10,y,5,h);ctx.fillRect(x+23,y,4,h);}return obstacleTileVisualId(b,tx,ty,'solid');}
 if(visualKind==='rock'){const p=b.naturalClusterId?naturalRockPose(n,tx,ty,t):{x:tx*t-2,y:ty*t+2,size:t+4};if(!pilot?.rock(ctx,space,p.x,p.y,p.size,n))drawRockCluster(ctx,p.x,p.y,p.size,n,code,Boolean(b.naturalClusterId));}else if(code==='m'){const {x,y,size}=b.naturalClusterId?naturalMarshPose(n,tx,ty,t):{x:tx*t-8+(n%3-1),y:ty*t-15+((n>>>4)%3-1),size:t+16};ctx.fillStyle='#183f34';ctx.beginPath();ctx.ellipse(x+size*.5,y+size*.68,size*.4,size*.24,-.12,0,TAU);ctx.fill();drawReeds(ctx,x+size*.24,y+size*.83,n);drawCanopy(ctx,x,y,size,n);}else{const p=b.naturalClusterId?naturalBasePose(n,tx,ty,t):{x:tx*t,y:ty*t,w:t};if(!pilot?.base?.(ctx,space,p.x,p.y,p.w,n,'woodland'))drawThicketBase(ctx,p.x,p.y,p.w,n,'woodland');if((b.naturalClusterId?naturalCanopyAt:woodlandCanopyAt)(n,tx+offset.x/t,ty+offset.y/t,seed)){const x=tx*t-11+(n%9-4),y=ty*t-18+((n>>>4)%7-3),size=t+18+(n>>>12)%7;if(!pilot?.tree(ctx,space,x,y,size,n))drawCanopy(ctx,x,y,size,n);}}return id;
}
export function drawEnvironmentFallback(ctx,space,bounds,pilot=null){
 const c=space.collision,t=c.tileSize,v=space.visual,ox=v.originTile?.x??0,oy=v.originTile?.y??0,seed=environmentSeed(space),offset=environmentWorldOffset(space),at=(x,y)=>v.terrain[y-oy]?.[x-ox],biomeAt=(x,y)=>v.biomes?.[Math.floor(y/t)-oy]?.[Math.floor(x/t)-ox];
 const obstacleVisualIds=[],woodlandDetailIds=[],blockedTiles=projectedBlockerTiles(v.blockers,bounds);
 if(!pilot?.covers(space,bounds))drawGrassGround(ctx,bounds,seed,offset,biomeAt);pilot?.drawGround(ctx,space,bounds);const minX=Math.floor(bounds.x/t)-1,maxX=Math.floor((bounds.x+bounds.width)/t)+1,minY=Math.floor(bounds.y/t)-1,maxY=Math.floor((bounds.y+bounds.height)/t)+1;
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(!isRoad(at(x,y)))drawRoadFillets(ctx,at,x,y,t);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){drawPlannedSurfaceCell(ctx,at(x,y),biomeAt(x*t+16,y*t+16),x,y,t,seed,offset,at);pilot?.drawSurface(ctx,space,at(x,y),x,y,t,at);}
 for(const material of ['r','p'])for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(at(x,y)===material)drawRoadCell(ctx,at,x,y,t,seed,offset,pilot?.eligible(space,x*t,y*t)?pilot.road:null);
 pilot?.roadOverlay?.(ctx,space,bounds,at);drawWoodlandRoadAccents(ctx,at,biomeAt,minX,maxX,minY,maxY,t,seed,offset);for(const exit of space.exits??[])if(exit.siteAction&&!exit.proceduralRuin&&exit.siteKind==='woodland-ruin'&&exit.x>=bounds.x-192&&exit.y>=bounds.y-192&&exit.x<=bounds.x+bounds.width+192&&exit.y<=bounds.y+bounds.height+192){const n=terrainHash(Math.floor(exit.x/t),Math.floor(exit.y/t),seed+907);drawRuinExteriorGroundD11_3(ctx,exit,n,nearestRoadAnchor(space,exit),t);}let paintedDecorations=0;for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const detail=woodlandGroundDetail(space,x,y,blockedTiles);if(!detail)continue;paintedDecorations+=drawWoodlandDetail(ctx,detail,bounds,[],null,pilot,space);woodlandDetailIds.push(detail.id);}
  for(const b of v.blockers){const bx=b.x*t,by=b.y*t,bw=b.width*t,bh=b.height*t;if(bx+bw<=bounds.x||by+bh<=bounds.y||bx>=bounds.x+bounds.width||by>=bounds.y+bounds.height)continue;
  if(b.kind.startsWith('fort-'))drawFortBlockerD10(ctx,space,b,t);else if(b.kind==='cave-rock-wall')drawCaveBlockerD10(ctx,space,b,t);
    else if(isPlannedRuinMasonry(b))obstacleVisualIds.push(...drawPlannedRuinMasonry(ctx,space,b,bounds,pilot));else if(b.kind==='ruin-exterior-masonry'){} // Legacy facade owns its mask.
else if(b.kind==='building'){building(ctx,b,t);for(let ty=b.y;ty<b.y+b.height;ty++)for(let tx=b.x;tx<b.x+b.width;tx++)obstacleVisualIds.push(obstacleTileVisualId(b,tx,ty,'solid'));}else if(b.kind==='fence'){ctx.fillStyle='#754923';ctx.fillRect(bx,by,bw,bh);for(let ty=b.y;ty<b.y+b.height;ty++)for(let tx=b.x;tx<b.x+b.width;tx++)obstacleVisualIds.push(obstacleTileVisualId(b,tx,ty,'solid'));}
  else for(let ty=b.y;ty<b.y+b.height;ty++)for(let tx=b.x;tx<b.x+b.width;tx++){const x=tx*t,y=ty*t;if(x+t<=bounds.x||y+t<=bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)continue;obstacleVisualIds.push(drawRequiredObstacleVisual(ctx,space,b,tx,ty,pilot));}
 }
 for(const b of v.blockers){const landmark=woodlandLandmarkForBlocker(space,b);if(!landmark||landmark.x<bounds.x-34||landmark.y<bounds.y-34||landmark.x>bounds.x+bounds.width+34||landmark.y>bounds.y+bounds.height+34)continue;drawWoodlandLandmark(ctx,landmark);paintedDecorations++;}
 for(const d of v.decorations??[]){const margin=d.kind.startsWith('ruin-grove-')?128:32;if(d.plannedRuinExterior&&d.x*t>=bounds.x-margin&&d.y*t>=bounds.y-margin&&d.x*t<=bounds.x+bounds.width+margin&&d.y*t<=bounds.y+bounds.height+margin){drawPlannedRuinGroundDecoration(ctx,d,t,pilot);paintedDecorations++;}}
 for(const f of plannedRuinEntranceFrames(space))if(f.x>=bounds.x-192&&f.y>=bounds.y-192&&f.x<=bounds.x+bounds.width+192&&f.y<=bounds.y+bounds.height+192)drawPlannedRuinEntranceGround(ctx,f,pilot);
 return {paintedTerrainTiles:(maxX-minX+1)*(maxY-minY+1),paintedBlockers:v.blockers.length,paintedDecorations,totalTerrainTiles:c.width*c.height,flowers:[],obstacleVisualIds,woodlandDetailIds};
}

// Preparation and resource ownership are isolated from accepted drawing code.
import {createEnvironmentCache as createCache} from './environment_cache.js';
export function prepareEnvironmentDepthItems(space,view,layout,art,time,pilot=null){
 const items=[],t=space.collision.tileSize,inside=(x,y,pad=96)=>x>=view.x-pad&&y>=view.y-pad&&x<=view.x+view.width+pad&&y<=view.y+view.height+pad;
 // Canopies are already present in the cached ground raster. Replaying their
 // immutable sprite in the depth pass supplies occlusion without rebuilding
 // the static page each frame.
 for(const tree of layout.trees??[]){const {x,y,size,n}=tree;if(!inside(x+size/2,y+size*.65,size)||pilot?.hasTree&&!pilot.hasTree(space,x,y,size,n))continue;items.push(depthItem({id:'tree/'+tree.id,anchorX:x+size/2,anchorY:y+size*.78,draw:ctx=>{if(!pilot?.tree(ctx,space,x,y,size,n)){if(art?.tree)art.tree(ctx,x,y,size,n);else drawCanopy(ctx,x,y,size,n);}}}));}
 for(const d of space.visual?.decorations??[]){if(!d.kind.startsWith('fort-')&&!d.kind.startsWith('cave-')||d.kind==='cave-trail-stones')continue;const x=d.x*t,y=d.y*t;if(!inside(x,y,560))continue;items.push(depthItem({id:'environment/'+(d.id??`${d.kind}/${d.x}/${d.y}`),anchorX:x,anchorY:d.kind.startsWith('fort-')?fortDecorationAnchor(d,t):caveDecorationAnchorD10(d,t),draw:ctx=>d.kind.startsWith('fort-')?drawFortDecorationD10(ctx,d,t,time):drawCaveDecorationD10(ctx,d,t)}));}
 for(const f of plannedRuinEntranceFrames(space))if(inside(f.x,f.y,320)){items.push(depthItem({id:'environment/'+f.id+'/rear',anchorX:f.x,anchorY:f.y-180,draw:ctx=>drawPlannedRuinEntranceRear(ctx,f,pilot)}));items.push(depthItem({id:'environment/'+f.id+'/arch',anchorX:f.x,anchorY:f.y+22,draw:ctx=>drawPlannedRuinEntrance(ctx,f,pilot)}));}
 for(const d of space.visual?.decorations??[])if(d.plannedRuinExterior&&d.kind.startsWith('ruin-module-')&&inside(d.x*t,d.y*t,256))items.push(depthItem({id:'environment/'+d.id,anchorX:d.x*t,anchorY:pilot?.ruin?.moduleAnchor?.(d,t)??d.y*t,draw:ctx=>drawPlannedRuinModule(ctx,d,t,pilot)}));
 for(const d of space.visual?.decorations??[])if(pilot?.ruin?.active?.()&&d.plannedRuinExterior&&d.kind.startsWith('ruin-grove-')&&inside(d.x*t,d.y*t,160))items.push(depthItem({id:'environment/'+d.id,anchorX:d.x*t,anchorY:d.y*t,draw:ctx=>drawPlannedRuinGroundDecoration(ctx,d,t,pilot)}));
 for(const d of space.visual?.decorations??[])if(d.plannedRuinExterior&&d.kind==='ruin-wall-roots'&&inside(d.x*t,d.y*t,96))items.push(depthItem({id:'environment/'+d.id,anchorX:d.x*t,anchorY:d.y*t+25,draw:ctx=>drawPlannedRuinRoots(ctx,d,t)}));
 for(const exit of space.exits??[])if(exit.siteAction&&!exit.proceduralRuin&&exit.siteKind==='woodland-ruin'&&inside(exit.x,exit.y,240)){const seed=terrainHash(Math.floor(exit.x/t),Math.floor(exit.y/t),environmentSeed(space)+907);items.push(depthItem({id:'exit/'+exit.exitId+'/ruin-rear',anchorX:exit.x,anchorY:exit.y-180,draw:ctx=>drawRuinExteriorRearD11_3(ctx,exit,seed)}));items.push(depthItem({id:'exit/'+exit.exitId+'/ruin-arch',anchorX:exit.x,anchorY:exit.y+22,draw:ctx=>drawRuinExteriorArchD11_3(ctx,exit,seed)}));}
 for(const exit of space.exits??[])if(exit.siteAction&&exit.siteKind==='woodland-fort-keep'&&inside(exit.x,exit.y,96))items.push(depthItem({id:'exit/'+exit.exitId,anchorX:exit.x,anchorY:exit.y+(exit.proceduralFort?-70:22),draw:ctx=>drawFortKeepDoorD10(ctx,exit)}));
 return items;
}
export function createEnvironmentCache(canvas,{authoredArt=null,...options}={}){return createCache(canvas,{...options,prepareDrawing:(ctx,space,view,layout,art)=>prepareEnvironmentDrawing(ctx,space,view,layout,art,authoredArt),prepareDepthItems:(space,view,layout,art,time)=>prepareEnvironmentDepthItems(space,view,layout,art,time,authoredArt),drawFallback:(ctx,space,bounds)=>drawEnvironmentFallback(ctx,space,bounds,authoredArt),drawRequiredObstacle:(ctx,space,b,tx,ty)=>drawRequiredObstacleVisual(ctx,space,b,tx,ty,authoredArt)});}
