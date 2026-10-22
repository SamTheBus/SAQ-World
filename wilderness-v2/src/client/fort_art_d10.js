import {terrainHash} from './environment_motifs.js';
import {drawFortEquipmentRack} from './fort_equipment_display.js';
const TAU=Math.PI*2,OUT='#17211d',STONE_DARK='#3b4741',STONE='#647067',STONE_LIGHT='#929b8b',WOOD_DARK='#2b1b12',WOOD='#68401f',WOOD_LIGHT='#ad7040',RED='#74312d',BLUE='#2d4d61',CANVAS='#88704b',CANVAS_LIGHT='#b49a68';
const poly=(ctx,pts,fill,stroke=OUT,w=2)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();};
const shadow=(ctx,x,y,rx,ry)=>{ctx.fillStyle='rgba(8,14,11,.40)';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();};
const beam=(ctx,x,y,w,h)=>{ctx.fillStyle=WOOD_DARK;ctx.fillRect(x,y,w,h);ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(x+2,y+2,Math.max(1,w*.24),Math.max(1,h-4));};
function masonry(ctx,x,y,w,h,seed=1){
  ctx.fillStyle=STONE_DARK;ctx.fillRect(x,y,w,h);ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
  let row=0;for(let yy=y+3;yy<y+h-4;yy+=15,row++)for(let xx=x+4+((row&1)*11);xx<x+w-5;){const sw=20+terrainHash(Math.floor(xx),Math.floor(yy),seed)%22;
    poly(ctx,[[xx,yy],[Math.min(x+w-5,xx+sw),yy-2],[Math.min(x+w-6,xx+sw-2),Math.min(y+h-4,yy+11)],[xx+2,Math.min(y+h-3,yy+13)]],row%3===0?STONE_LIGHT:STONE,'#344038',1);xx+=sw+3;}
  ctx.fillStyle='#abb3a0';ctx.globalAlpha=.55;ctx.fillRect(x+3,y+3,w-7,4);ctx.globalAlpha=1;
}
export function drawFortBlockerD10(ctx,space,b,t){
  if(b.kind==='fort-prop-solid'){shadow(ctx,(b.x+b.width/2)*t,(b.y+b.height*.88)*t,b.width*t*.44,b.height*t*.17);return;}
  const x=b.x*t,y=b.y*t,w=b.width*t,h=b.height*t,vertical=h>w;
  shadow(ctx,x+w*.52,y+h+7,w*.48,Math.min(12,h*.22));
  // Wall ends overlap their tower bases. The full tower foundation is painted
  // to its collision edge so every corner reads as one joined structure.
  if(b.kind==='fort-tower-base')masonry(ctx,x-1,y+1,w+2,h-3,terrainHash(b.x,b.y,701));
  else if(b.kind==='fort-wall')masonry(ctx,vertical?x+2:x-3,vertical?y-3:y+2,vertical?w-4:w+6,vertical?h+6:h-4,terrainHash(b.x,b.y,701));
  else masonry(ctx,x+2,y+3,w-4,h-8,terrainHash(b.x,b.y,701));
  if(b.kind==='fort-wall'){
    if(vertical){const west=/west/.test(b.detail??''),inside=west?x+w-9:x+4,outer=west?x+4:x+w-8;
      ctx.fillStyle=west?'#758177':'#4c5851';poly(ctx,west?[[x+w-15,y+8],[x+w-4,y+5],[x+w-4,y+h-13],[x+w-15,y+h-8]]:[[x+4,y+5],[x+15,y+8],[x+15,y+h-8],[x+4,y+h-13]],ctx.fillStyle,'#344038',1);
      beam(ctx,inside,y+8,6,h-22);ctx.strokeStyle='#b6bea8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(outer,y+7);ctx.lineTo(outer,y+h-14);ctx.stroke();
    }else{beam(ctx,x+8,y+7,w-16,7);ctx.fillStyle='#9da691';ctx.fillRect(x+7,y+4,w-14,3);}
  }
}
export function fortDecorationAnchor(d,t){
  if(d.kind==='fort-keep-facade')return (d.y+d.height/2)*t;
  if(d.kind==='fort-gatehouse')return d.y*t+t*.92;
  return d.y*t+(d.kind==='fort-watchtower'?34:d.kind==='fort-banner'?25:20);
}
export function drawFortDecorationShadowD10(ctx,d,t){
  const x=d.x*t,y=d.y*t;
  if(d.kind==='fort-moss'||d.kind==='fort-vines'||d.kind==='fort-roots')return;
  const dims={
    'fort-keep-facade':[d.width*t*.43,18,(d.y+d.height/2)*t+10], 'fort-gatehouse':[220,18,y+42], 'fort-watchtower':[78,18,y+55],
    'fort-tent':[48,12,y+24], 'fort-lean-to':[45,11,y+22], 'fort-cart':[40,10,y+15], 'fort-well':[31,11,y+14],
    'fort-crates':[28,9,y+11], 'fort-supplies':[28,9,y+11], 'fort-barrels':[30,9,y+14], 'fort-table':[35,9,y+13],
    'fort-fire':[24,7,y+9], 'fort-shrub':[25,8,y+9]
  }[d.kind];if(dims)shadow(ctx,x,dims[2],dims[0],dims[1]);
}
function standard(ctx,x,y,color,flip=1){beam(ctx,x-3,y-27,6,55);poly(ctx,[[x+flip*3,y-22],[x+flip*26,y-16],[x+flip*21,y+12],[x+flip*3,y+5]],color,'#d1a64f',1.5);}
function keep(ctx,d,t){
  const cx=d.x*t+t/2,back=(d.y-d.height/2)*t,front=(d.y+d.height/2)*t,l=cx-d.width*t/2,r=cx+d.width*t/2;
  // Weathered stone lower mass and offset stair tower.
  masonry(ctx,l+16,back+102,r-l-32,front-back-108,811);masonry(ctx,r-104,back+58,82,front-back-64,829);
  // Steep shingled roof: separate lit left and shaded right planes, ridge and eaves.
  const ridgeY=back+26,eaveY=back+125;
  poly(ctx,[[l+1,eaveY],[cx,ridgeY],[cx,eaveY+13],[l+15,eaveY+25]],'#384641','#151d1a',3);
  poly(ctx,[[cx,ridgeY],[r-2,eaveY],[r-17,eaveY+25],[cx,eaveY+13]],'#232f2d','#151d1a',3);
  ctx.strokeStyle='#607067';ctx.lineWidth=2;for(let yy=ridgeY+15;yy<eaveY;yy+=14){ctx.beginPath();ctx.moveTo(l+14+(yy-ridgeY)*2.25,yy);ctx.lineTo(cx,yy+9);ctx.moveTo(cx,yy+9);ctx.lineTo(r-14-(yy-ridgeY)*2.25,yy);ctx.stroke();}
  beam(ctx,cx-7,ridgeY-2,14,111);beam(ctx,l+21,eaveY+13,r-l-42,8);
  // Gabled entrance breaks the long wall and keeps the door unmistakable.
  const gy=front-92;poly(ctx,[[cx-58,gy+34],[cx,gy-22],[cx+58,gy+34],[cx+50,front-4],[cx-50,front-4]],'#566259',OUT,3);
  poly(ctx,[[cx-66,gy+35],[cx,gy-35],[cx+66,gy+35],[cx+53,gy+47],[cx,gy-17],[cx-53,gy+47]],'#2b3835',OUT,3);
  beam(ctx,cx-47,gy+38,8,front-gy-43);beam(ctx,cx+39,gy+38,8,front-gy-43);beam(ctx,cx-43,gy+44,86,7);
  // The authoritative keep exit paints the door panel at its exact gameplay
  // contact. The façade supplies one gabled frame rather than a second door.
  standard(ctx,l+93,front-62,RED,1);standard(ctx,r-93,front-62,BLUE,-1);
  // Small offset chimney gives the silhouette a restrained asymmetry.
  masonry(ctx,r-88,back+12,30,61,857);ctx.fillStyle='#1e2926';ctx.fillRect(r-93,back+7,40,10);
}
function gatehouse(ctx,d,t){const x=d.x*t,y=d.y*t;for(const side of [-1,1]){const cx=x+side*104,l=cx-62;
  masonry(ctx,l,y-35,124,75,901+side);poly(ctx,[[l-7,y-35],[cx,y-67],[l+131,y-35],[l+118,y-15],[cx,y-45],[l+7,y-15]],side<0?'#354641':'#273733',OUT,3);
  beam(ctx,l+12,y-10,8,46);beam(ctx,l+104,y-10,8,46);standard(ctx,cx-side*43,y-3,side<0?RED:BLUE,-side);
 }
 // The upper crossbeam is intentionally a depth object: actors at the gate pass beneath it.
 beam(ctx,x-59,y-38,118,15);ctx.fillStyle='#b2753d';ctx.fillRect(x-51,y-34,102,4);for(const px of [-48,-22,22,48])beam(ctx,x+px-3,y-30,6,53);
}
function watchtower(ctx,d,t){const x=d.x*t,y=d.y*t,east=d.variant%2===1,south=d.variant>=2;
  // A five-tile tower cap fills the collision footprint and bridges both wall
  // runs. A broad grounded shadow is supplied by the depth shadow pass.
  masonry(ctx,x-73,y-13,146,66,977+d.variant);ctx.fillStyle='#27332f';ctx.fillRect(x-78,y-22,156,15);ctx.strokeStyle=OUT;ctx.lineWidth=3;ctx.strokeRect(x-78,y-22,156,15);
  for(const dx of [-66,-22,22,66]){ctx.fillStyle=STONE_LIGHT;ctx.fillRect(x+dx-7,y-34,14,16);ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.strokeRect(x+dx-7,y-34,14,16);}
  beam(ctx,x-70,y-6,140,9);for(const dx of [-65,57])beam(ctx,x+dx,y-8,8,60);
  poly(ctx,[[x-79,y-30],[x,y-70],[x+79,y-30],[x+64,y-8],[x,y-44],[x-64,y-8]],east?'#293936':'#344540',OUT,3);
  poly(ctx,[[x-70,y-29],[x,y-62],[x,y-45],[x-60,y-16]],'#52645a',OUT,1.5);poly(ctx,[[x,y-62],[x+70,y-29],[x+60,y-16],[x,y-45]],'#263431',OUT,1.5);
  ctx.fillStyle='#9ca88f';ctx.fillRect(east?x+43:x-63,y+7,20,5);ctx.fillStyle='rgba(10,16,13,.35)';ctx.fillRect(x-72,south?y+42:y+46,144,8);
}
function tent(ctx,d,t){const x=d.x*t,y=d.y*t,w=d.kind==='fort-lean-to'?78:94,h=d.kind==='fort-lean-to'?45:58;
  if(d.kind==='fort-lean-to'){beam(ctx,x-w/2,y+12,w,6);beam(ctx,x-w/2,y-h+10,5,h);beam(ctx,x+w/2-5,y-h+10,5,h);poly(ctx,[[x-w/2-5,y-h+12],[x+w/2+5,y-h+12],[x+w/2-4,y+8],[x-w/2+7,y+1]],'#526346',OUT,2);poly(ctx,[[x-w/2,y-h+14],[x,y-h+14],[x-4,y+1],[x-w/2+8,y]],'#74815a',OUT,1);}
  else{const ridge=y-42,front=y+20;ctx.fillStyle='rgba(8,12,10,.40)';ctx.beginPath();ctx.ellipse(x+4,front+7,55,13,0,0,TAU);ctx.fill();
    poly(ctx,[[x-48,front],[x-34,y-22],[x,ridge],[x,front]],CANVAS_LIGHT,OUT,2.5);poly(ctx,[[x,ridge],[x+34,y-22],[x+48,front],[x,front]],CANVAS,OUT,2.5);
    poly(ctx,[[x-36,front],[x,ridge+8],[x+36,front]],'#74603f',OUT,2);poly(ctx,[[x,ridge+10],[x-15,front],[x,front]],'#201914',OUT,1.5);poly(ctx,[[x,ridge+10],[x+15,front],[x,front]],'#9d8457',OUT,1.5);
    beam(ctx,x-3,ridge-5,6,67);ctx.strokeStyle='#d5bd83';ctx.lineWidth=1.5;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(x+side*2,ridge+2);ctx.lineTo(x+side*57,front+12);ctx.stroke();ctx.fillStyle=WOOD_LIGHT;ctx.beginPath();ctx.arc(x+side*58,front+13,3,0,TAU);ctx.fill();ctx.strokeStyle=OUT;ctx.stroke();}
    ctx.strokeStyle='#5f4c31';ctx.beginPath();ctx.moveTo(x-34,y-20);ctx.lineTo(x+34,y-20);ctx.stroke();}
}
function prop(ctx,d,t){const x=d.x*t,y=d.y*t,k=d.kind;
 if(k==='fort-banner')return standard(ctx,x,y,d.variant%2?BLUE:RED,d.variant%2?-1:1);
 if(k==='fort-tent'||k==='fort-lean-to')return tent(ctx,d,t);
 if(k==='fort-watchtower')return watchtower(ctx,d,t);
 if(k==='fort-cart'){ctx.fillStyle=WOOD_DARK;ctx.fillRect(x-37,y-17,60,29);ctx.strokeStyle=OUT;ctx.lineWidth=3;ctx.strokeRect(x-37,y-17,60,29);ctx.fillStyle=WOOD;ctx.fillRect(x-32,y-12,50,19);ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(x-29,y-9,44,5);beam(ctx,x+21,y-2,35,5);for(const dx of [-25,13]){ctx.fillStyle='#2b2821';ctx.beginPath();ctx.arc(x+dx,y+15,11,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=WOOD_LIGHT;ctx.beginPath();ctx.arc(x+dx,y+15,4,0,TAU);ctx.fill();}return;}
 if(k==='fort-well'){masonry(ctx,x-29,y-3,58,18,1001);ctx.fillStyle='#13201e';ctx.beginPath();ctx.ellipse(x,y-4,22,8,0,0,TAU);ctx.fill();beam(ctx,x-28,y-35,6,36);beam(ctx,x+22,y-35,6,36);beam(ctx,x-31,y-40,62,7);ctx.fillStyle=WOOD_LIGHT;ctx.beginPath();ctx.arc(x,y-20,7,0,TAU);ctx.fill();ctx.strokeStyle=OUT;ctx.stroke();return;}
 if(k==='fort-crates'||k==='fort-supplies'){for(const [dx,dy,s] of [[-16,-8,20],[5,-4,21],[-3,-25,17]]){ctx.fillStyle=WOOD;ctx.fillRect(x+dx,y+dy,s,s);ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.strokeRect(x+dx,y+dy,s,s);ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(x+dx+3,y+dy+3,s-6,4);ctx.strokeStyle=WOOD_DARK;ctx.beginPath();ctx.moveTo(x+dx+3,y+dy+5);ctx.lineTo(x+dx+s-3,y+dy+s-3);ctx.stroke();}return;}
 if(k==='fort-barrels'){for(const dx of [-14,9]){ctx.fillStyle='#69401f';ctx.fillRect(x+dx-11,y-9,22,24);ctx.fillStyle='#a66b38';ctx.beginPath();ctx.ellipse(x+dx,y-9,11,6,0,0,TAU);ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.stroke();for(const yy of [-4,10]){ctx.beginPath();ctx.moveTo(x+dx-10,y+yy);ctx.lineTo(x+dx+10,y+yy);ctx.stroke();}ctx.fillStyle='#ba7c45';ctx.fillRect(x+dx-8,y-6,4,17);}return;}
 if(k==='fort-weapon-rack'){drawFortEquipmentRack(ctx,x,y,d.variant);return;}
 if(k==='fort-training-target'){const lean=d.variant%2?.035:-.035;ctx.save();ctx.translate(x,y);ctx.rotate(lean);
   // Rough straw butt on a braced field frame: bound sides, imperfect paint,
   // shaded thickness and embedded arrows keep it readable from the game view.
   beam(ctx,-3,-2,6,31);beam(ctx,-25,23,50,7);beam(ctx,-22,8,6,25);beam(ctx,16,8,6,25);ctx.strokeStyle=WOOD_DARK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-19,23);ctx.lineTo(-29,38);ctx.moveTo(19,23);ctx.lineTo(29,38);ctx.stroke();
   ctx.fillStyle='#655033';ctx.beginPath();ctx.ellipse(3,-10,21,25,0,0,TAU);ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#c3a660';ctx.beginPath();ctx.ellipse(0,-13,21,25,0,0,TAU);ctx.fill();ctx.stroke();
   ctx.strokeStyle='#8d713d';ctx.lineWidth=1.3;for(let i=-17;i<=17;i+=5){ctx.beginPath();ctx.moveTo(i,-31+Math.abs(i)*.22);ctx.quadraticCurveTo(i+3,-12,i-2,9+Math.abs(i)*.25);ctx.stroke();}ctx.strokeStyle='#574326';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-13,22,12,0,0,TAU);ctx.stroke();ctx.beginPath();ctx.ellipse(0,-13,22,19,0,0,TAU);ctx.stroke();
   ctx.strokeStyle=RED;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(-1,-13,13,14,.08,0,TAU);ctx.stroke();ctx.fillStyle='#b8a15d';ctx.beginPath();ctx.ellipse(1,-12,5,6,-.15,0,TAU);ctx.fill();ctx.strokeStyle='#493928';ctx.lineWidth=2;ctx.stroke();
   for(const [ax,ay,angle] of d.variant%2?[[-7,-18,.17],[6,-8,-.12]]:[[5,-17,-.15],[-8,-7,.12]]){ctx.save();ctx.translate(ax,ay);ctx.rotate(angle);ctx.strokeStyle='#d3d9d7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(25,-8);ctx.stroke();poly(ctx,[[23,-8],[29,-12],[27,-5]],'#8d3431',OUT,1);ctx.restore();}ctx.restore();return;}
 if(k==='fort-fire'){for(let i=0;i<10;i++){const a=i/10*TAU,sx=x+Math.cos(a)*21,sy=y+6+Math.sin(a)*7;ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.fillStyle=i%3===0?STONE_LIGHT:STONE;ctx.beginPath();ctx.roundRect(-5.5,-4,11,8,3);ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(-3,-2.5,4,1.5);ctx.restore();}
   for(const [a,dy] of [[-.48,2],[.48,3],[0,5]]){ctx.save();ctx.translate(x,y+dy);ctx.rotate(a);ctx.fillStyle=WOOD;ctx.beginPath();ctx.roundRect(-18,-3.5,36,7,3);ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=1.8;ctx.stroke();ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(-12,-2,17,2);ctx.fillStyle='#17130f';ctx.fillRect(7,-2.7,8,5.4);ctx.restore();}
   ctx.fillStyle='#6f1d12';ctx.beginPath();ctx.ellipse(x,y+3,12,5,0,0,TAU);ctx.fill();for(const [dx,dy,r,c] of [[-6,2,2.5,'#ff6a18'],[1,4,3,'#ffb126'],[7,1,2,'#e33b13'],[-1,0,1.5,'#fff0a0']]){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,TAU);ctx.fill();}return;}
 if(k==='fort-table'){ctx.fillStyle=WOOD_DARK;ctx.fillRect(x-34,y-12,68,16);ctx.strokeStyle=OUT;ctx.lineWidth=2;ctx.strokeRect(x-34,y-12,68,16);ctx.fillStyle=WOOD;ctx.fillRect(x-30,y-9,60,9);ctx.fillStyle=WOOD_LIGHT;ctx.fillRect(x-27,y-7,54,3);for(const dx of [-27,22])beam(ctx,x+dx,y+3,6,17);return;}
 if(k==='fort-shrub'){ctx.fillStyle=['#2b6738','#397944','#4e7d42'][d.variant%3];for(const [dx,dy,r] of [[-14,1,13],[1,-8,17],[16,1,12]]){ctx.beginPath();ctx.arc(x+dx,y+dy,r,0,TAU);ctx.fill();ctx.strokeStyle='#173a22';ctx.lineWidth=2;ctx.stroke();}ctx.fillStyle='#7fa05d';ctx.beginPath();ctx.arc(x-3,y-13,7,0,TAU);ctx.fill();return;}
 if(k==='fort-vines'){ctx.strokeStyle='#3f6934';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y-26);ctx.bezierCurveTo(x+25,y-6,x-18,y+16,x+11,y+37);ctx.stroke();ctx.fillStyle='#76a253';for(const [dx,dy,a] of [[8,-14,.4],[-2,1,-.4],[6,17,.6]]){ctx.beginPath();ctx.ellipse(x+dx,y+dy,8,4,a,0,TAU);ctx.fill();}return;}
 if(k==='fort-roots'){ctx.strokeStyle='#684526';ctx.lineWidth=5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x,y-18);ctx.quadraticCurveTo(x+i*12,y+2,x+i*21,y+24);ctx.stroke();}return;}
 if(k==='fort-moss'){ctx.fillStyle='#668a4b';for(const [dx,dy,rx] of [[-22,0,19],[5,-4,22],[27,3,15]]){ctx.beginPath();ctx.ellipse(x+dx,y+dy,rx,6,0,0,TAU);ctx.fill();}}
}
export function drawFortDecorationD10(ctx,d,t){ctx.save();ctx.lineJoin='round';if(d.kind==='fort-keep-facade')keep(ctx,d,t);else if(d.kind==='fort-gatehouse')gatehouse(ctx,d,t);else prop(ctx,d,t);ctx.restore();}
export function drawFortKeepDoorD10(ctx,exit){const x=exit.x,y=exit.y;ctx.fillStyle='#21150f';ctx.beginPath();ctx.moveTo(x-27,y-44);ctx.quadraticCurveTo(x,y-68,x+27,y-44);ctx.lineTo(x+27,y+3);ctx.lineTo(x-27,y+3);ctx.closePath();ctx.fill();ctx.strokeStyle=OUT;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#754621';ctx.fillRect(x-19,y-42,38,44);ctx.fillStyle='#b8793c';ctx.fillRect(x-15,y-38,6,36);ctx.strokeStyle='#4a2a17';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#e0b552';ctx.beginPath();ctx.arc(x+10,y-18,3,0,TAU);ctx.fill();}
