import {drawTavernEntrance} from './tavern_exterior_presentation.js';
import {frontage} from '../shared/generation/settlement_geometry_v1.js';
// Temporary procedural architecture, adapted to the existing canvas material
// language. It is exterior art; signs do not imply functional services.
const intersects=(x,y,w,h,v)=>x+w>v.x&&x<v.x+v.width&&y+h>v.y&&y<v.y+v.height;
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();}
export function drawSettlementBuilding(c,b){
 const x=b.x*32,y=b.y*32,w=b.w*32,h=b.h*32,n=Number(b.id.split(':').at(-1));
 const colors=b.kind==='home'?['#855840','#675c56','#976d47','#5f7772']:b.kind==='civic'?['#596c73']:b.label.includes('Forge')?['#534c49']:b.kind==='service'?['#775746']:['#796b42'];
 const color=colors[n%colors.length],ridge=y+h*.48-22;
 c.strokeStyle='#302b25';c.lineWidth=2;
 c.fillStyle='#0005';c.fillRect(x+9,y+9,w,h+5);
 c.fillStyle=n%2?'#b8ae90':'#c4bda4';c.fillRect(x,y-18,w,h+18);
 c.fillStyle='#837358';c.fillRect(x,y+h-42,w,42);
 for(let px=x+8;px<x+w;px+=48){c.fillStyle='#574936';c.fillRect(px,y+h-40,7,40);}
 polygon(c,[[x-4,y-26],[x+w+4,y-26],[x+w+4,ridge],[x-4,ridge]],color);
 polygon(c,[[x-4,ridge],[x+w+4,ridge],[x+w+4,y+h-44],[x-4,y+h-44]],color);
 c.fillStyle='#fff1';c.fillRect(x,y-24,w,ridge-y+24);
 c.strokeStyle='#17191440';c.lineWidth=1;
 for(let py=y-16;py<y+h-44;py+=13){c.beginPath();c.moveTo(x,py);c.lineTo(x+w,py);c.stroke();for(let px=x+(Math.floor(py/13)%2)*10;px<x+w;px+=28){c.beginPath();c.moveTo(px,py);c.lineTo(px+3,py+10);c.stroke();}}
 c.strokeStyle='#b4a185';c.lineWidth=5;c.beginPath();c.moveTo(x-4,ridge);c.lineTo(x+w+4,ridge);c.stroke();
 // Chimneys, dormers, and front windows vary without changing footprint.
 c.fillStyle='#706655';c.fillRect(x+w*.72,y+h*.22-38,21,34);c.fillStyle='#b7ad98';c.fillRect(x+w*.72-3,y+h*.22-40,27,7);
 for(let px=x+23;px<x+w-15;px+=61){c.fillStyle='#3b443a';c.fillRect(px,y+h-31,18,21);c.fillStyle='#cfb975';c.fillRect(px+2,y+h-28,6,15);c.fillRect(px+10,y+h-28,6,15);c.fillStyle='#867352';c.fillRect(px-3,y+h-10,24,5);}
 if(b.kind==='home'&&n%3===0){polygon(c,[[x+w*.3-19,ridge+10],[x+w*.3,ridge-15],[x+w*.3+19,ridge+10]],'#aaa387');c.fillStyle='#394c48';c.fillRect(x+w*.3-9,ridge-2,18,13);}
 if(/Chapel|Parish/.test(b.label)){c.fillStyle='#b1aca0';c.fillRect(x+w*.46,y-48,28,55);polygon(c,[[x+w*.46-7,y-48],[x+w*.46+14,y-83],[x+w*.46+35,y-48]],'#65756e');c.strokeStyle='#c9b577';c.lineWidth=4;c.beginPath();c.moveTo(x+w*.46+14,y-96);c.lineTo(x+w*.46+14,y-80);c.moveTo(x+w*.46+8,y-90);c.lineTo(x+w*.46+20,y-90);c.stroke();}
 const [dx,dy]=b.doorPoint,p=b.porch;const doorX=dx*32+16,doorY=dy*32;
 c.fillStyle='#302f26';c.strokeStyle='#bba37b';c.lineWidth=3;
 if(b.doorSide==='south'){c.fillRect(doorX-15,doorY-38,30,38);c.strokeRect(doorX-15,doorY-38,30,38);}
 else if(b.doorSide==='north'){c.fillRect(doorX-15,doorY-17,30,17);c.strokeRect(doorX-15,doorY-17,30,17);}
 else {const xx=b.doorSide==='east'?(b.x+b.w)*32:b.x*32;c.fillRect(xx-10,dy*32+1,20,30);c.strokeRect(xx-10,dy*32+1,20,30);}
 // Signs live beside door frontage, at human scale rather than HUD words.
 const f=frontage(b);
 if(b.kind!=='home'&&!b.label.includes('Tavern')){c.fillStyle='#8b7047';c.fillRect(f.x+32,f.y-23,4,29);c.fillStyle='#473828';c.strokeStyle='#cbb783';c.lineWidth=1;c.fillRect(f.x+26,f.y-31,30,19);c.strokeRect(f.x+26,f.y-31,30,19);c.fillStyle='#dbcda3';c.font='bold 11px Georgia';c.textAlign='center';c.fillText(b.label.includes('Forge')?'⚒':b.label.includes('Tavern')||b.label.includes('Merchant')?'♜':b.kind==='civic'?'✦':'◆',f.x+41,f.y-17);c.textAlign='left';}
 if(b.label.includes('Tavern'))drawTavernEntrance(c,b,f);
 if(b.label.includes('Forge')){c.fillStyle='#514d42';c.fillRect(p.x*32+5,p.y*32+6,23,21);c.fillStyle='#e79736';c.fillRect(p.x*32+8,p.y*32+10,17,10);c.fillStyle='#7e8782';c.fillRect(p.x*32+6,p.y*32+27,22,7);}
 if(/Merchant|Tavern/.test(b.label)&&b.doorSide==='south'){polygon(c,[[doorX-45,doorY-8],[doorX+45,doorY-8],[doorX+48,doorY+14],[doorX-48,doorY+14]],'#776e4d');for(let q=-36;q<=36;q+=24){c.fillStyle='#c1b387';c.fillRect(doorX+q,doorY-8,12,22);}}
 if(/Civic|Guard/.test(b.label)){c.fillStyle='#48726e';c.fillRect(x+8,y+h-39,12,28);c.fillStyle='#d5bd75';c.fillRect(x+12,y+h-30,4,12);}
}
