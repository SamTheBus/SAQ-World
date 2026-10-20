import {depthItem} from './world_depth_presentation.js';
import {celShadeContext} from './cel_materials_v1.js';
import {drawFortEquipmentRack} from './fort_equipment_display.js';
import {drawCaveDecorationD10,caveDecorationAnchorD10,drawCaveInteriorExitD10,drawCaveSurfaceD10} from './cave_art_d10.js';
import {drawRuinSurfaceD11_3,drawRuinDecorationD11_3,ruinDecorationAnchorD11_3,isRuinDepthDecorationD11_3,drawRuinInteriorExitD11_3} from './ruin_art_d11_3.js';
// Bounded presentation adaptation of H4A dungeon_map.js preRenderStaticMap:
// stone floor/mortar, masonry caps, south wall faces and cast shadow. No globals.
export function createSiteEnvironment(canvas) {
  const pages=new Map();let identity=null,builds=0,caveSurface=null,ruinSurface=null;
  function drawTile(ctx,v,x,y,t,mode='standard'){
    const ox=v.originTile.x,oy=v.originTile.y,at=(cx,cy)=>v.terrain[cy-oy]?.[cx-ox],type=at(x,y),px=x*t,py=y*t;
    const ruin=mode==='ruin',fort=mode==='fort',cave=mode==='cave';
    if(cave){const n=(x*71+y*137)>>>0;ctx.fillStyle='#070c0d';ctx.fillRect(px,py,t,t);if(type==='1'){ctx.fillStyle=['#26332f','#2d3a35','#32403a'][n%3];ctx.beginPath();ctx.moveTo(px,py+2+(n%4));ctx.lineTo(px+t-2,py);ctx.lineTo(px+t,py+t-3);ctx.lineTo(px+2,py+t);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(116,137,119,.15)';ctx.beginPath();ctx.ellipse(px+8+(n%17),py+9+((n>>>5)%15),8+(n%6),3+(n%3),(n%7-3)*.08,0,Math.PI*2);ctx.fill();if((n%5)===0){ctx.strokeStyle='rgba(12,18,17,.48)';ctx.beginPath();ctx.moveTo(px+3,py+24);ctx.quadraticCurveTo(px+15,py+17,px+29,py+26);ctx.stroke();}}else{ctx.fillStyle=['#26312f','#303b37','#38443e'][n%3];ctx.beginPath();ctx.moveTo(px+1,py+5);ctx.lineTo(px+9+(n%7),py+1);ctx.lineTo(px+t-2,py+6);ctx.lineTo(px+t-5,py+t-2);ctx.lineTo(px+3,py+t-5);ctx.closePath();ctx.fill();ctx.strokeStyle='#111a18';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#59675e';ctx.beginPath();ctx.moveTo(px+5,py+7);ctx.lineTo(px+18,py+3);ctx.lineTo(px+27,py+8);ctx.lineTo(px+14,py+12);ctx.closePath();ctx.fill();if(at(x,y+1)==='1'){ctx.fillStyle='#161f1c';ctx.fillRect(px,py+t-10,t,8);ctx.fillStyle='#0b1110';ctx.fillRect(px,py+t-2,t,2);}}return;}
    ctx.fillStyle=fort?'#090806':'#05030a';ctx.fillRect(px,py,t,t);
    if(type==='1'){
      if(fort){
        const n=(x*71+y*137)>>>0;ctx.fillStyle=['#4b4435','#544a37','#484133'][n%3];ctx.fillRect(px,py,t,t);
        ctx.fillStyle='rgba(218,181,112,.11)';ctx.beginPath();ctx.moveTo(px+2,py+4);ctx.lineTo(px+t-3,py+2+(n%3));ctx.lineTo(px+t-8,py+7+(n%3));ctx.lineTo(px+5,py+9);ctx.closePath();ctx.fill();
        if(n%4===0){ctx.strokeStyle='rgba(31,24,17,.28)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px+4,py+t-5);ctx.quadraticCurveTo(px+t*.45,py+t-10,px+t-3,py+t-6);ctx.stroke();}
      }else{
        ctx.fillStyle=ruin?'#17251f':'#121822';ctx.fillRect(px,py,t,t);
        ctx.fillStyle=(ruin?['#34463a','#2b3d34','#25362f']:['#222a38','#1d2532','#161c28'])[(x*71+y*137)%3];ctx.fillRect(px+1,py+1,t-2,t-2);
        ctx.fillStyle=ruin?'rgba(190,215,164,.10)':'rgba(224,242,254,.06)';ctx.fillRect(px+2,py+2,t-4,1);
        ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(px+2,py+t-3,t-3,2);
        if(ruin&&(x*31+y*17)%7===0){ctx.fillStyle='#52734a';ctx.beginPath();ctx.ellipse(px+7+(x*5+y)%18,py+13+(x+y*3)%12,5,2.5,(x-y)*.2,0,Math.PI*2);ctx.fill();}
      }
      if(at(x,y-1)==='0'){ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(px,py,t,7);}
    }else if(type==='0'){
      const south=at(x,y+1)==='1';
      ctx.fillStyle=fort?'#30352f':ruin?'#293632':'#2a3548';ctx.fillRect(px,py,t,t);
      ctx.fillStyle=fort?['#657065','#737b6e','#59645c'][(x*13+y*7)%3]:ruin?'#617067':'#3a475c';ctx.beginPath();ctx.moveTo(px+2,py+3);ctx.lineTo(px+t-3,py+1);ctx.lineTo(px+t-1,py+t-4);ctx.lineTo(px+3,py+t-2);ctx.closePath();ctx.fill();
      ctx.strokeStyle=fort?'#28312c':'#0a0e17';ctx.lineWidth=fort?1.6:1;ctx.stroke();if(fort){ctx.fillStyle='#92998a';ctx.beginPath();ctx.moveTo(px+4,py+4);ctx.lineTo(px+t-5,py+3);ctx.lineTo(px+t-8,py+7);ctx.lineTo(px+6,py+8);ctx.closePath();ctx.fill();ctx.strokeStyle='#414c45';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+3,py+17+((x+y)%3));ctx.lineTo(px+t-3,py+15+((x*3+y)%4));ctx.stroke();}
      if(south){ctx.fillStyle=fort?'#343a34':'#161e2b';ctx.fillRect(px,py+t-10,t,8);ctx.fillStyle=fort?'#1b211d':'#0a0e17';ctx.fillRect(px,py+t-2,t,2);}
    }
    if(!fort)for(const d of v.decorations?.filter(p=>p.x===x&&p.y===y)??[])drawLegacyDecoration(ctx,d,px,py);
  }
  function drawLegacyDecoration(ctx,d,px,py){
    if(d.kind==='sconce'){ctx.fillStyle='#090e16';ctx.fillRect(px+12,py+17,8,12);ctx.fillStyle='#967443';ctx.fillRect(px+14,py+19,4,8);ctx.fillStyle='#e7ba66';ctx.fillRect(px+12,py+12,8,9);ctx.fillStyle='#ffedb1';ctx.fillRect(px+15,py+13,3,6);}
    else if(d.kind==='vine'){ctx.strokeStyle='#3f733e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+5,py+1);ctx.bezierCurveTo(px+20,py+8,px+4,py+18,px+24,py+31);ctx.stroke();}
    else if(d.kind==='roots'){ctx.strokeStyle='#655036';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(px+16,py+8);ctx.quadraticCurveTo(px+8+i*9,py+17,px+3+i*12,py+30);ctx.stroke();}}
    else if(d.kind==='rubble'){ctx.fillStyle='#68736c';for(let i=0;i<4;i++)ctx.fillRect(px+5+i*6,py+19-(i%2)*4,7,6);}
    else if(d.kind==='mushrooms'){ctx.fillStyle='#d9c69a';ctx.fillRect(px+10,py+22,2,6);ctx.fillRect(px+18,py+19,2,8);ctx.fillStyle='#a96a58';ctx.beginPath();ctx.arc(px+11,py+21,4,Math.PI,0);ctx.arc(px+19,py+18,5,Math.PI,0);ctx.fill();}
  }
  function drawKeepDecoration(ctx,d,t){
    const x=d.x*t,y=d.y*t;
    if(['fort-table','fort-storage'].includes(d.kind)&&d.width){const raw={...d,x:0,y:0};delete raw.width;delete raw.height;ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(-d.width*t/2,-d.height*t/2,d.width*t,d.height*t);ctx.clip();ctx.scale(d.width*t/(d.kind==='fort-table'?116:74),d.height*t/64);drawKeepDecoration(ctx,raw,t);ctx.restore();return;}
    ctx.save();ctx.lineJoin='round';
    if(d.kind==='fort-rug'){
      const w=d.width*t,h=d.height*t;ctx.fillStyle='rgba(16,12,9,.38)';ctx.fillRect(x+5,y+7,w,h);ctx.fillStyle='#321b1b';ctx.fillRect(x,y,w,h);ctx.fillStyle='#873b32';ctx.fillRect(x+5,y+5,w-10,h-10);ctx.strokeStyle='#ddb967';ctx.lineWidth=3;ctx.strokeRect(x+10,y+10,w-20,h-20);for(let i=0;i<5;i++){ctx.fillStyle='#cfaa5d';ctx.fillRect(x+i*w/4-2,y-5,4,6);ctx.fillRect(x+i*w/4-2,y+h-1,4,6);}
    }else if(d.kind==='fort-table'){
      ctx.fillStyle='rgba(10,8,6,.38)';ctx.beginPath();ctx.ellipse(x+4,y+11,58,24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#382416';ctx.beginPath();ctx.roundRect(x-55,y-27,116,49,6);ctx.fill();ctx.strokeStyle='#21170f';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#805936';ctx.beginPath();ctx.roundRect(x-50,y-24,106,39,5);ctx.fill();ctx.fillStyle='#b57b45';ctx.fillRect(x-45,y-20,96,5);ctx.fillStyle='#d5c28d';ctx.fillRect(x-17,y-12,28,20);ctx.strokeStyle='#574b34';ctx.lineWidth=2;ctx.strokeRect(x-17,y-12,28,20);ctx.strokeStyle='#8c3330';ctx.beginPath();ctx.moveTo(x-14,y+4);ctx.lineTo(x+7,y-8);ctx.stroke();
    }else if(d.kind==='fort-storage'){
      ctx.fillStyle='rgba(10,8,6,.4)';ctx.beginPath();ctx.ellipse(x+4,y+25,42,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#352419';ctx.beginPath();ctx.roundRect(x-35,y-31,74,64,5);ctx.fill();ctx.strokeStyle='#21170f';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#68492f';ctx.fillRect(x-30,y-25,64,50);ctx.fillStyle='#9d7041';ctx.fillRect(x-27,y-22,58,7);ctx.strokeStyle='#c49a58';ctx.lineWidth=3;ctx.strokeRect(x-30,y-25,64,50);ctx.beginPath();ctx.moveTo(x+2,y-25);ctx.lineTo(x+2,y+25);ctx.moveTo(x-30,y);ctx.lineTo(x+34,y);ctx.stroke();ctx.fillStyle='#d7b75e';ctx.fillRect(x-2,y-3,8,8);
    }else if(d.kind==='fort-weapon-rack'){
      drawFortEquipmentRack(ctx,x,y,d.variant);
    }else if(d.kind==='fort-banner'){
      const color=d.variant%2?'#284c3c':'#7e322d';ctx.fillStyle='#c9a45c';ctx.fillRect(x-4,y-26,8,58);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+1,y-20);ctx.lineTo(x+(d.variant%2?-31:31),y-12);ctx.lineTo(x+(d.variant%2?-26:26),y+23);ctx.lineTo(x+1,y+13);ctx.closePath();ctx.fill();ctx.strokeStyle='#e3c775';ctx.stroke();
    }else if(d.kind==='sconce'){
      // The shared lighting presentation owns the iron bracket, animated
      // three-layer flame, embers and projected light.
    }else if(d.kind==='fort-bench'){
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-46,y-8,94,28);ctx.fillStyle='#754d2d';ctx.fillRect(x-48,y-15,96,18);ctx.fillStyle='#af7d48';ctx.fillRect(x-44,y-12,88,9);ctx.fillStyle='#3b2819';ctx.fillRect(x-37,y+2,8,17);ctx.fillRect(x+29,y+2,8,17);
    }else if(d.kind==='fort-map'){
      ctx.fillStyle='#4a3420';ctx.fillRect(x-58,y-10,116,12);ctx.fillStyle='#d2bb7e';ctx.fillRect(x-48,y-5,96,52);ctx.strokeStyle='#6b714c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-39,y+34);ctx.quadraticCurveTo(x-10,y+5,x+9,y+28);ctx.quadraticCurveTo(x+25,y+40,x+40,y+10);ctx.stroke();ctx.fillStyle='#7d2d2a';ctx.beginPath();ctx.arc(x+22,y+18,5,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function drawKeepStair(ctx,stair){ctx.save();if(Number.isInteger(stair.stairFacing)){ctx.translate(stair.x,stair.y);ctx.rotate(stair.stairFacing*Math.PI/2);ctx.translate(-stair.x,-stair.y);}ctx.fillStyle='#151512';ctx.fillRect(stair.x-26,stair.y-30,52,50);for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#a89872':'#786d57';const y=stair.y-24+i*8;ctx.fillRect(stair.x-22,y,44,6);ctx.fillStyle='#403b30';ctx.fillRect(stair.x-22,y+6,44,2);}ctx.strokeStyle='#c9b174';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(stair.x-27,stair.y+16);ctx.lineTo(stair.x-27,stair.y-27);ctx.moveTo(stair.x+27,stair.y+16);ctx.lineTo(stair.x+27,stair.y-27);ctx.stroke();ctx.restore();}
  function drawKeepDoor(ctx,door){
    ctx.save();ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(door.x-35,door.y-30,70,49);ctx.fillStyle='#786e5e';ctx.fillRect(door.x-33,door.y-28,66,43);ctx.fillStyle='#2d1c12';ctx.fillRect(door.x-23,door.y-18,46,33);ctx.fillStyle='#765033';for(let i=0;i<5;i++)ctx.fillRect(door.x-20+i*9,door.y-16,6,31);ctx.fillStyle='#d6b15e';ctx.fillRect(door.x+14,door.y-2,5,5);ctx.restore();
  }
  return Object.freeze({draw(ctx,space,view){
    const site=space.site??space.functionalSite,v=space.visual,t=space.collision.tileSize,size=8,extent=size*t,mode=['woodland-ruin','procedural-ruin','procedural-crypt'].includes(site.siteKind)?'ruin':['woodland-fort','procedural-fort'].includes(site.siteKind)?'fort':site.siteKind==='woodland-cave'?'cave':'standard';
    const surfaceIdentity=['procedural-fort','procedural-ruin','procedural-crypt','woodland-cave'].includes(site.siteKind)?site.contentHash+'/'+space.spaceInstanceId:site.contentHash;if(identity!==surfaceIdentity){pages.clear();caveSurface=null;ruinSurface=null;identity=surfaceIdentity;}
    ctx.fillStyle=mode==='fort'?'#090806':'#05030a';ctx.fillRect(view.x,view.y,view.width,view.height);
    if(mode==='cave'){
      if(!caveSurface){caveSurface=canvas.ownerDocument.createElement('canvas');caveSurface.width=space.collision.width*t;caveSurface.height=space.collision.height*t;drawCaveSurfaceD10(celShadeContext(caveSurface.getContext('2d'),{mode:'world'}),space);builds++;}
      const sx=Math.max(0,Math.floor(view.x)),sy=Math.max(0,Math.floor(view.y)),sw=Math.min(caveSurface.width-sx,Math.ceil(view.width)),sh=Math.min(caveSurface.height-sy,Math.ceil(view.height));if(sw>0&&sh>0)ctx.drawImage(caveSurface,sx,sy,sw,sh,sx,sy,sw,sh);
      return {paintedTerrainTiles:space.collision.width*space.collision.height,paintedBlockers:space.visual.blockers?.length??0,totalTerrainTiles:space.collision.width*space.collision.height};
    }
    if(mode==='ruin'&&space.visual.version.startsWith('woodland-ruin-presentation-d11.3')){
      if(!ruinSurface){ruinSurface=canvas.ownerDocument.createElement('canvas');ruinSurface.width=space.collision.width*t;ruinSurface.height=space.collision.height*t;drawRuinSurfaceD11_3(celShadeContext(ruinSurface.getContext('2d'),{mode:'world'}),space);builds++;}
      const sx=Math.max(0,Math.floor(view.x)),sy=Math.max(0,Math.floor(view.y)),sw=Math.min(ruinSurface.width-sx,Math.ceil(view.width)),sh=Math.min(ruinSurface.height-sy,Math.ceil(view.height));if(sw>0&&sh>0)ctx.drawImage(ruinSurface,sx,sy,sw,sh,sx,sy,sw,sh);
      return {paintedTerrainTiles:space.collision.width*space.collision.height,paintedBlockers:space.visual.blockers?.length??0,totalTerrainTiles:space.collision.width*space.collision.height};
    }
    let painted=0;for(let py=Math.max(0,Math.floor(view.y/extent));py<=Math.min(Math.ceil(space.collision.height/size)-1,Math.floor((view.y+view.height)/extent));py++)for(let px=Math.max(0,Math.floor(view.x/extent));px<=Math.min(Math.ceil(space.collision.width/size)-1,Math.floor((view.x+view.width)/extent));px++){
      const key=px+','+py;let page=pages.get(key);if(page)pages.delete(key);else {
        page=canvas.ownerDocument.createElement('canvas');page.width=extent;page.height=extent;const pc=celShadeContext(page.getContext('2d'),{mode:'world'});pc.translate(-px*extent,-py*extent);
        for(let y=py*size;y<Math.min(space.collision.height,(py+1)*size);y++)for(let x=px*size;x<Math.min(space.collision.width,(px+1)*size);x++)drawTile(pc,v,x,y,t,mode);
        builds++;
      }
      pages.set(key,page);while(pages.size>24)pages.delete(pages.keys().next().value);ctx.drawImage(page,px*extent,py*extent);painted+=size*size;
    }
    if(site.siteKind==='procedural-fort')for(const stair of space.exits?.filter(e=>['up','down'].includes(e.siteAction?.direction))??[])drawKeepStair(ctx,stair);
    const door=space.exits[0];if(door&&!['fort','cave','ruin'].includes(mode)){ctx.fillStyle='#667582';ctx.fillRect(door.x-23,door.y-16,46,32);for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#bac3c5':'#8e9ea5';ctx.fillRect(door.x-20,door.y-14+i*7,40,4);}ctx.fillStyle='#ecdcac';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('Exit',door.x,door.y+32);ctx.textAlign='left';}
    return {paintedTerrainTiles:painted,paintedBlockers:v.blockers?.length??0,totalTerrainTiles:space.collision.width*space.collision.height};
  },depthItems(space,view){
    const site=space.site??space.functionalSite;if(!['woodland-fort','procedural-fort','woodland-cave','woodland-ruin','procedural-ruin','procedural-crypt'].includes(site?.siteKind))return [];
    const t=space.collision.tileSize,items=[],visible=(x,y,p=110)=>x>=view.x-p&&y>=view.y-p&&x<=view.x+view.width+p&&y<=view.y+view.height+p;
    if(site.siteKind==='woodland-cave'){
      for(const d of space.visual.decorations??[]){if(d.kind==='cave-light-shaft')continue;const x=d.x*t,y=d.y*t;if(!visible(x,y,140))continue;items.push(depthItem({id:'site-decoration/'+(d.id??`${d.kind}/${d.x}/${d.y}`),anchorX:x,anchorY:caveDecorationAnchorD10(d,t),draw:ctx=>drawCaveDecorationD10(ctx,d,t)}));}
      const door=space.exits?.find(e=>e.siteAction?.direction==='exit');if(door&&visible(door.x,door.y,100))items.push(depthItem({id:'site-exit/'+door.exitId,anchorX:door.x,anchorY:door.y+25,draw:ctx=>drawCaveInteriorExitD10(ctx,door)}));return items;
    }
    if(['woodland-ruin','procedural-ruin','procedural-crypt'].includes(site.siteKind)){
      for(const d of space.visual.decorations??[]){if(!isRuinDepthDecorationD11_3(d))continue;const x=d.x*t,y=d.y*t;if(!visible(x,y,140))continue;items.push(depthItem({id:'site-decoration/'+(d.id??`${d.kind}/${d.x}/${d.y}`),anchorX:x,anchorY:ruinDecorationAnchorD11_3(d,t),draw:ctx=>drawRuinDecorationD11_3(ctx,d,t)}));}
      for(const stair of space.exits?.filter(e=>['up','down'].includes(e.siteAction?.direction))??[])if(visible(stair.x,stair.y))items.push(depthItem({id:'ruin-stair/'+stair.exitId,anchorX:stair.x,anchorY:stair.y,draw:ctx=>drawKeepStair(ctx,stair)}));const door=site.siteKind==='procedural-ruin'?space.exits?.find(e=>e.siteAction?.direction==='exit'):space.exits?.[0];if(door&&visible(door.x,door.y,110))items.push(depthItem({id:'site-exit/'+door.exitId,anchorX:door.x,anchorY:door.y+27,draw:ctx=>drawRuinInteriorExitD11_3(ctx,door)}));return items;
    }
    for(const d of space.visual.decorations??[]){if(d.kind==='sconce')continue;const x=d.x*t,y=d.y*t;if(!visible(x,y,140))continue;
      const anchorY=y+(d.kind==='fort-map'?50:d.kind==='fort-banner'?31:d.kind==='fort-storage'?34:d.kind==='fort-table'?24:22);
      items.push(depthItem({id:'site-decoration/'+(d.id??`${d.kind}/${d.x}/${d.y}`),anchorX:x,anchorY,draw:ctx=>drawKeepDecoration(ctx,d,t)}));
    }
    const door=site.siteKind==='procedural-fort'?space.exits?.find(e=>e.siteAction?.direction==='exit'):space.exits?.[0];if(door&&visible(door.x,door.y))items.push(depthItem({id:'site-exit/'+door.exitId,anchorX:door.x,anchorY:door.y+(site.siteKind==='procedural-fort'?-32:20),draw:ctx=>drawKeepDoor(ctx,door)}));
    return items;
  },clear(){pages.clear();caveSurface=null;ruinSurface=null;identity=null;},resources:()=>({siteRasterPages:pages.size+(caveSurface?1:0)+(ruinSurface?1:0),siteRasterBytes:pages.size*256*256*4+(caveSurface?caveSurface.width*caveSurface.height*4:0)+(ruinSurface?ruinSurface.width*ruinSurface.height*4:0),siteRasterBuilds:builds})});
}
