// Visual source: Dungeon dungeon_map.js drawBreakableProp, guild banners,
// mushrooms and woodland pollen; Idle SAQ entities.js forest foliage/flowers.
// Pure presentation. Placement and occupancy live in environment_layout.js.
const TAU=Math.PI*2;
const visualOffsets=new WeakMap();
export function environmentWorldOffset(space){const v=space.visual;if(!v?.worldAddress)return {x:0,y:0};let offset=visualOffsets.get(v);if(offset)return offset;const modulus=768n*(1n<<32n),fold=n=>Number((n%modulus+modulus)%modulus),a=v.worldAddress;offset={x:fold(BigInt(a.chunkX)*1024n+BigInt(Math.round(a.localX))-BigInt(v.originTile.x*32)),y:fold(BigInt(a.chunkY)*832n+BigInt(Math.round(a.localY))-BigInt(v.originTile.y*32))};visualOffsets.set(v,offset);return offset;}
export function environmentIdentity(space){return `${space.overworld?.seedHex??"authored"}/${space.overworld?.generatorVersion??0}/${space.overworld?.manifestId??space.instanceId??""}`;}
export function environmentSeed(space){let h=2166136261;for(const ch of environmentIdentity(space))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
export function terrainHash(x,y,seed){let h=Math.imul(x^seed,374761393)^Math.imul(y,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;}
export function drawGuildBanner(ctx,x,y){
  ctx.save();ctx.fillStyle='#991b1b';ctx.strokeStyle='#000000';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.lineTo(x+8,y+18);ctx.lineTo(x,y+24);ctx.lineTo(x-8,y+18);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#f1c40f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-6,y+2);ctx.lineTo(x+6,y+2);ctx.moveTo(x,y+5);ctx.lineTo(x,y+16);ctx.stroke();ctx.restore();
}
export function drawMushrooms(ctx,x,y){
  for(let i=0;i<3;i++){const sx=x+[-4,2,5][i],sy=y+(i%2===0?-2:3);
    ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx,sy+3);ctx.lineTo(sx,sy);ctx.stroke();
    ctx.fillStyle=i===1?'#2ecc71':'#00f0ff';ctx.beginPath();ctx.arc(sx,sy-1,3-i*.5,Math.PI,0);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffff';ctx.fillRect(sx-1,sy-2,1,1);
  }
}
// Idle's six-petal flower and leaves, reduced to underfoot scale; static hard
// color bands replace the side-view sway/gradient. Palette: game.js flowerColors.
const FLOWERS=['#e74c3c','#9b59b6','#f1c40f','#3498db','#e67e22','#e84393'];
export function drawFlower(ctx,x,y,n){
  ctx.save();ctx.translate(x,y);ctx.scale(.42,.42);
  ctx.strokeStyle='#1b5e20';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(0,-8,0,-16);ctx.stroke();
  ctx.fillStyle='#27ae60';ctx.beginPath();ctx.ellipse(-2,-6,5,2,Math.PI/4,0,TAU);ctx.ellipse(2,-10,4.5,1.8,-Math.PI/4,0,TAU);ctx.fill();
  for(let ring=0;ring<2;ring++){ctx.fillStyle=ring?FLOWERS[n%6]:'#7e1b1b';ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,cx=Math.cos(a)*(ring?5:6),cy=-16+Math.sin(a)*(ring?5:6);ctx.moveTo(cx+(ring?4.2:5),cy);ctx.arc(cx,cy,ring?4.2:5,0,TAU);}ctx.fill();}
  ctx.fillStyle='#f1c40f';ctx.beginPath();ctx.arc(0,-16,3,0,TAU);ctx.fill();ctx.restore();
}
export function drawGrass(ctx,x,y,n){
  // Idle's dark back blades, curved bright foreground blades; max height 7px.
  ctx.fillStyle=n%2?'#22683d':'#247645';ctx.beginPath();ctx.moveTo(x-6,y);ctx.quadraticCurveTo(x-7,y-5,x-9,y-6);ctx.quadraticCurveTo(x-2,y-6,x,y-2);ctx.quadraticCurveTo(x+2,y-8,x+4,y-7);ctx.lineTo(x+3,y);ctx.closePath();ctx.fill();
  ctx.fillStyle='#43ad62';ctx.beginPath();ctx.moveTo(x-2,y);ctx.quadraticCurveTo(x-4,y-6,x-4,y-7);ctx.quadraticCurveTo(x+1,y-5,x+1,y-1);ctx.quadraticCurveTo(x+6,y-5,x+7,y-3);ctx.lineTo(x+4,y+1);ctx.closePath();ctx.fill();
}
export function drawFern(ctx,x,y,n,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle='#173f28';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,3);ctx.quadraticCurveTo((n%5)-2,-5,1,-13);ctx.stroke();
  ctx.fillStyle=n%3?'#2f8a48':'#3d9a50';for(let i=0;i<4;i++){const py=-1-i*3,w=5-i*.55,side=i%2?-1:1;ctx.beginPath();ctx.ellipse(side*w*.48,py,w,1.8,side*(.24+i*.05),0,TAU);ctx.ellipse(-side*w*.42,py-1,w*.85,1.6,-side*(.22+i*.04),0,TAU);ctx.fill();}ctx.restore();
}
export function drawLeafLitter(ctx,x,y,n){
  const colors=['#9b6a2f','#c08a3b','#7a4c24','#d0a34d'];ctx.save();ctx.translate(x,y);for(let i=0;i<4;i++){const a=((n>>>(i*4))&15)*TAU/16,dx=((n>>>(i*5+2))&7)-3,dy=((n>>>(i*3+1))&5)-2;ctx.fillStyle=colors[(n+i)%colors.length];ctx.beginPath();ctx.ellipse(dx,dy,2.7,1.1,a,0,TAU);ctx.fill();}ctx.restore();
}
export function drawWoodlandStone(ctx,x,y,n){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#35483b';ctx.beginPath();ctx.ellipse(0,2,6,2.3,0,0,TAU);ctx.fill();ctx.fillStyle=n%2?'#78816d':'#6d7867';ctx.strokeStyle='#2c382f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-5,1);ctx.lineTo(-3,-4);ctx.lineTo(2,-6);ctx.lineTo(6,-1);ctx.lineTo(4,3);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#a7ad8c';ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,-5);ctx.lineTo(4,-2);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();ctx.restore();
}
function drawStump(ctx,x,y,n){ctx.save();ctx.translate(x,y);ctx.fillStyle='#263c27';ctx.beginPath();ctx.ellipse(0,5,9,3.5,0,0,TAU);ctx.fill();ctx.fillStyle='#68401f';ctx.strokeStyle='#2d1d11';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(6,-5);ctx.lineTo(5,5);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#b17b3d';ctx.beginPath();ctx.ellipse(.5,-5,6,2.5,0,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#704720';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(.5,-5,3,0,TAU);ctx.stroke();if(n%2)drawMushrooms(ctx,7,2);ctx.restore();}
function drawFallenLog(ctx,x,y,n){ctx.save();ctx.translate(x,y);ctx.rotate(((n>>>5)%7-3)*.06);ctx.fillStyle='#263c27';ctx.beginPath();ctx.ellipse(0,5,17,4,0,0,TAU);ctx.fill();ctx.fillStyle='#5d351c';ctx.strokeStyle='#28190e';ctx.lineWidth=1.4;ctx.beginPath();ctx.roundRect(-16,-3,31,8,4);ctx.fill();ctx.stroke();ctx.fillStyle='#8b5b2c';ctx.fillRect(-11,-2,17,2);ctx.fillStyle='#75964a';ctx.fillRect(-4,-4,9,2);ctx.beginPath();ctx.arc(15,1,4,0,TAU);ctx.fillStyle='#a9773d';ctx.fill();ctx.stroke();ctx.restore();}
export function drawReeds(ctx,x,y,n){
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=n%2?'#173f34':'#205544';ctx.lineWidth=1.8;
  for(let i=-5;i<=5;i+=5){ctx.beginPath();ctx.moveTo(i,2);ctx.quadraticCurveTo(i+(n+i)%3,-5,i+(n+i)%4-1,-10-Math.abs(i)/3);ctx.stroke();}
  ctx.fillStyle='#8ca55e';for(const i of [-5,0,5])ctx.fillRect(i-1,-10-Math.abs(i)/3,3,1.5);ctx.restore();
}
// Rocky-upland blockers use several low, irregular masses on a shared scree
// bed. The footprint stays readable without the former blue rectangular slab.
export function drawRockCluster(ctx,x,y,size,n,biome='r',organic=false){
  const colors=biome==='d'?['#8c7754','#cdb47d','#9e865f','#b59b6e','#524635','#ddc594']:biome==='s'?['#59676d','#c8d5d8','#889caa','#a9bfc8','#374a54','#e2eef1']:biome==='l'?['#353535','#78706a','#4b4541','#5a5550','#262b2a','#918679']:['#4f5147','#a79f83','#777667','#858475','#30342f','#c3b99b'];
  ctx.save();ctx.translate(x+size/2,y+size/2);const turn=((n>>>7)%7-3)*.025;ctx.rotate(turn);
  ctx.fillStyle=colors[0];ctx.beginPath();ctx.ellipse(0,size*.27,size*.48,size*.18,0,0,TAU);ctx.fill();
  const stones=organic?[[size*((n%7)-3)*.025,-size*.03,size*(.27+((n>>>3)%5)*.02),size*(.27+((n>>>6)%4)*.02)],[-size*(.19+((n>>>9)%3)*.03),size*(.05+((n>>>11)%4)*.025),size*.20,size*(.17+((n>>>13)%4)*.025)],[size*(.18+((n>>>15)%4)*.025),size*(.08+((n>>>17)%4)*.025),size*(.16+((n>>>19)%4)*.02),size*.18]]:[[-size*.18,size*.02,size*.29,size*.28],[size*.13,size*.08,size*.25,size*.22],[0,-size*.12,size*.24,size*.24]];
  for(let i=0;i<stones.length;i++){const [sx,sy,rx,ry]=stones[i],light=colors[i===2?1:i===1?2:3];
    ctx.fillStyle=light;ctx.strokeStyle=colors[4];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(sx-rx,sy+ry*.35);ctx.lineTo(sx-rx*.65,sy-ry*.55);ctx.lineTo(sx-rx*.05,sy-ry);ctx.lineTo(sx+rx*.78,sy-ry*.55);ctx.lineTo(sx+rx,sy+ry*.45);ctx.lineTo(sx+rx*.25,sy+ry);ctx.lineTo(sx-rx*.65,sy+ry*.8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=colors[5];ctx.beginPath();ctx.moveTo(sx-rx*.56,sy-ry*.44);ctx.lineTo(sx-rx*.04,sy-ry*.82);ctx.lineTo(sx+rx*.55,sy-ry*.48);ctx.lineTo(sx+rx*.18,sy-ry*.18);ctx.closePath();ctx.fill();
  }
  ctx.fillStyle='#c0ae77';for(const [px,py] of [[-size*.43,size*.3],[size*.4,size*.25],[size*.31,size*.38]]){ctx.beginPath();ctx.arc(px,py,1.4,0,TAU);ctx.fill();}ctx.restore();
}
// Collision-critical forest floor silhouette. Every blocked thicket cell owns
// one of these bases; taller canopies are decorative and may overlap or be
// rebuilt independently. The jittered joined shrubs avoid a tree-per-tile grid
// while keeping the full impassable footprint readable at player height.
export function drawThicketBase(ctx,x,y,size,n,biome='woodland'){
  const jx=(n%7)-3,jy=((n>>>4)%5)-2,marsh=biome==='marsh',cx=x+size*.5+jx,ground=y+size*.76+jy;
  ctx.save();
  // The joined undergrowth occupies the whole authoritative tile. Earlier
  // low shrub clumps left the north half looking walkable even though the
  // collision cell was solid. Slight overdraw joins neighboring cells and
  // prevents a false corridor at thicket or building edges.
  ctx.fillStyle=marsh?'#183f35':'#153d24';ctx.strokeStyle=marsh?'#102e29':'#102c18';ctx.lineWidth=1.8;ctx.beginPath();
  ctx.moveTo(x-2,y+size*.73);ctx.quadraticCurveTo(x+size*.02,y+size*.2,x+size*.2,y+3);ctx.quadraticCurveTo(x+size*.42,y-2,x+size*.55,y+5);ctx.quadraticCurveTo(x+size*.78,y-1,x+size+3,y+size*.22);ctx.lineTo(x+size+3,y+size*.84);ctx.quadraticCurveTo(x+size*.52,y+size+2,x-2,y+size*.82);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=marsh?'#173c33':'#183c24';ctx.beginPath();ctx.ellipse(cx,ground,size*.57,size*.24,((n>>>9)%5-2)*.035,0,TAU);ctx.fill();
  ctx.fillStyle=marsh?'#315d48':'#3b250f';
  for(const [dx,w,h] of [[-size*.2,5,15],[size*.13,6,18]]){ctx.fillRect(cx+dx-w/2,ground-h,w,h);ctx.fillStyle=marsh?'#486b4e':'#8b5428';ctx.fillRect(cx+dx-w/2+1,ground-h+3,2,h-4);ctx.fillStyle=marsh?'#315d48':'#3b250f';}
  const colors=marsh?['#1d5948','#28715a','#3b8464']:['#174b29','#226b38','#3c914b'];
  // Uneven three/four-clump silhouettes keep every blocked cell readable while
  // avoiding the five-bead row that made a long grove expose its tile grid.
  const lean=((n>>>10)%7-3)*size*.025,shrubs=[
    [-size*.31+lean,-size*(.11+(n%3)*.018),size*(.19+(n%2)*.025)],
    [-size*.05-lean,-size*(.2+((n>>>3)%3)*.018),size*(.23+((n>>>5)%2)*.025)],
    [size*.27+lean,-size*(.12+((n>>>7)%3)*.017),size*(.2+((n>>>9)%2)*.024)]
  ];
  if((n>>>12)%3!==0)shrubs.push([size*((n>>>15)%5-2)*.035,-size*.04,size*(.2+((n>>>18)%3)*.018)]);
  ctx.strokeStyle=marsh?'#102e29':'#102c18';ctx.lineWidth=1.6;
  for(let i=0;i<shrubs.length;i++){const [dx,dy,r]=shrubs[i];ctx.fillStyle=colors[(i+(n>>>12))%colors.length];ctx.beginPath();ctx.arc(cx+dx,ground+dy,r,0,TAU);ctx.fill();ctx.stroke();}
  if(!marsh){ctx.strokeStyle='#74451f';ctx.lineWidth=1.4;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(cx+side*3,ground-2);ctx.quadraticCurveTo(cx+side*10,ground+3,cx+side*(13+(n%4)),ground+6);ctx.stroke();}if(n%19===0)drawStump(ctx,cx,ground-3,n);else if(n%23===0)drawFallenLog(ctx,cx,ground-1,n);}
  if(marsh)drawReeds(ctx,cx-size*.34,ground+2,n);
  ctx.restore();
}
// Idle elder-oak canopy clumps and warm trunk, with hard cel bands. Constrained
// to the existing World's authoritative forest/thicket footprint by the caller.
export function drawCanopy(ctx,x,y,size,n){
  const variant=n%12;ctx.save();ctx.translate(x+size/2,y+size*.5);ctx.scale(size/100,size/100);
  ctx.strokeStyle='#25170c';ctx.lineWidth=2;ctx.fillStyle=variant%3===1?'#52301a':'#3b220c';ctx.beginPath();ctx.moveTo(-6,38);ctx.lineTo(-5,-2);ctx.lineTo(5,-2);ctx.lineTo(7,38);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#995929';ctx.fillRect(-4,7,3,27);
  if(variant%4===0){
    // Idle Highland Spruce: four staggered toothed boughs, source palette.
    const colors=['#11381c','#195c2b','#228b22','#58d68d'];
    for(let j=0;j<4;j++){const top=10-j*15,w=39-j*8,h=20-j*3;ctx.fillStyle=colors[j];ctx.strokeStyle='#081d0c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,top-h);ctx.lineTo(w,top+h);for(let i=1;i<=7;i++){const ratio=i/7;ctx.lineTo(w-ratio*w*2,top+h-Math.sin(ratio*Math.PI)*h*.2+(i%2===0?3:-2));}ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.restore();return;
  }
  if(variant%4===2){
    // Alder: irregular layered crown and a few pale leaf tips.
    const layer=(color,parts,outline=false)=>{ctx.fillStyle=color;ctx.beginPath();for(const [px,py,r] of parts){ctx.moveTo(px+r,py);ctx.arc(px,py,r,0,TAU);}ctx.fill();if(outline){ctx.strokeStyle='#0c2a17';ctx.lineWidth=3;ctx.stroke();}};
    layer('#153a21',[[-23,2,23],[3,-9,29],[27,2,20],[0,12,26]],true);layer(variant>7?'#287c43':'#236d3b',[[-18,-2,18],[2,-15,22],[22,-3,16],[2,7,20]]);layer('#56ad58',[[-10,-17,10],[12,-20,11],[24,-8,8]]);ctx.fillStyle='#a5cf65';for(const [px,py] of [[-17,-11],[7,-27],[27,-12]]){ctx.beginPath();ctx.arc(px,py,3,0,TAU);ctx.fill();}ctx.restore();return;
  }
  const layer=(color,clumps,outline=false)=>{ctx.fillStyle=color;ctx.beginPath();for(const [x,y,r] of clumps){ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,TAU);}ctx.fill();if(outline){ctx.strokeStyle='#081d0c';ctx.lineWidth=3;ctx.stroke();}};
  layer('#123318',[[0,-6,35],[-21,4,25],[21,4,25]],true);
  layer(n%3===0?'#25824b':'#1e8449',[[0,-12,30],[-17,0,23],[17,0,23]]);
  layer(n%3===0?'#74bf55':'#58bc70',[[-7,-22,17],[12,-15,13]]);
  ctx.restore();
}
export function drawWoodlandLandmark(ctx,landmark){
  const {x,y,n,type}=landmark;ctx.save();ctx.translate(x,y);ctx.fillStyle='#1f3b27';ctx.beginPath();ctx.ellipse(0,8,type==='shelter'?25:19,7,0,0,TAU);ctx.fill();
  // These motifs live inside authoritative grove blockers. Keep them low,
  // broken and embedded so none reads as an open doorway, named destination,
  // or route invitation.
  if(type==='ruin'){ctx.fillStyle='#626b60';ctx.strokeStyle='#26322b';ctx.lineWidth=1.4;for(const [px,py,w,h] of [[-16,1,12,7],[-2,-3,14,10],[11,3,8,6]]){ctx.save();ctx.translate(px,py);ctx.rotate(((n+px) % 5-2)*.06);ctx.fillRect(-w/2,-h,w,h);ctx.strokeRect(-w/2,-h,w,h);ctx.restore();}ctx.fillStyle='#8d967e';ctx.fillRect(-7,-7,9,3);ctx.fillStyle='#5e7f45';ctx.fillRect(-12,3,22,3);}
  else if(type==='shrine'){ctx.fillStyle='#687268';ctx.strokeStyle='#29342e';ctx.lineWidth=1.5;for(const [py,w] of [[5,18],[-1,14],[-7,10]]){ctx.fillRect(-w/2,py-5,w,6);ctx.strokeRect(-w/2,py-5,w,6);}ctx.fillStyle='#9ba187';ctx.beginPath();ctx.arc(0,-11,5,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#6d8a49';ctx.fillRect(-7,3,14,2);}
  else if(type==='camp'){drawFallenLog(ctx,-5,5,n);ctx.fillStyle='#596552';ctx.strokeStyle='#26312a';ctx.lineWidth=1.2;ctx.save();ctx.rotate(-.18);ctx.fillRect(4,-1,17,8);ctx.strokeRect(4,-1,17,8);ctx.restore();ctx.fillStyle='#8a5930';ctx.fillRect(8,3,10,2);}
  else if(type==='shelter'){ctx.strokeStyle='#352313';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-21,6);ctx.lineTo(18,-10);ctx.moveTo(-17,-8);ctx.lineTo(20,7);ctx.moveTo(-8,-14);ctx.lineTo(14,3);ctx.stroke();ctx.fillStyle='#4d6338';ctx.beginPath();ctx.moveTo(-17,-9);ctx.lineTo(16,-14);ctx.lineTo(20,-7);ctx.lineTo(-11,1);ctx.closePath();ctx.fill();ctx.strokeStyle='#24351f';ctx.lineWidth=1.3;ctx.stroke();}
  else if(type==='cart'){ctx.strokeStyle='#2d1c10';ctx.lineWidth=2;ctx.fillStyle='#6c4222';ctx.fillRect(-17,-8,27,13);ctx.strokeRect(-17,-8,27,13);ctx.beginPath();ctx.moveTo(10,1);ctx.lineTo(25,-5);ctx.stroke();for(const px of [-11,7]){ctx.fillStyle='#403022';ctx.beginPath();ctx.arc(px,7,7,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#a06a34';ctx.beginPath();ctx.arc(px,7,2,0,TAU);ctx.fill();}}
  else{ctx.strokeStyle='#29342e';ctx.lineWidth=1.5;ctx.fillStyle='#687268';ctx.beginPath();ctx.moveTo(-7,6);ctx.lineTo(-5,-12);ctx.lineTo(5,-15);ctx.lineTo(8,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#8c947e';ctx.fillRect(-3,-10,5,3);ctx.fillStyle='#5f8148';ctx.fillRect(-6,1,12,3);}
  ctx.restore();
}
// Dungeon's bounded woodland pollen, adapted to 256px world cells: no spawned
// particles, no gradients/glows, at most eight small marks inside the viewport.
export function drawEnvironmentAmbient(ctx,space,view,time){
  if(!space.overworld||space.site)return 0;
  const seed=environmentSeed(space),offset=environmentWorldOffset(space),t=space.collision.tileSize,v=space.visual;let count=0;
  ctx.save();ctx.fillStyle='#e4f2b5';
  for(let y=Math.floor((view.y+offset.y)/256);y<=Math.floor((view.y+view.height+offset.y)/256)&&count<8;y++)for(let x=Math.floor((view.x+offset.x)/256);x<=Math.floor((view.x+view.width+offset.x)/256)&&count<8;x++){
    const n=terrainHash(x,y,seed),px=x*256-offset.x+32+n%192+Math.sin(time/2400+n)*5,py=y*256-offset.y+32+(n>>>8)%192-Math.sin(time/3400+n)*9;
    if(px<view.x||py<view.y||px>view.x+view.width||py>view.y+view.height)continue;
    const terrain=v.terrain[Math.floor(py/t)-(v.originTile?.y??0)]?.[Math.floor(px/t)-(v.originTile?.x??0)];
    if(terrain!=='f'&&terrain!=='g')continue;
    ctx.globalAlpha=.2+.35*(.5+.5*Math.sin(time/1900+n));ctx.fillRect(px,py,1.4,1.4);count++;
  }ctx.restore();return count;
}
export const drawDungeonProp = function (ctx, prop, px, py, tileSize) {
    if (!prop) return;
    let cx = px + tileSize / 2;
    let cy = py + tileSize / 2;
    const isFlash = false; // Static facade ornament, no breakable ownership or rewards.

    ctx.save();

    // Base Drop Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (prop.type === "clay_pot") {
      ctx.fillStyle = isFlash ? "#ffffff" : "#d35400";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.5;

      // Bulbous Base
      ctx.beginPath();
      ctx.ellipse(cx, cy + 3, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!isFlash) {
        // Terracotta Shading Highlight
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.ellipse(cx - 3, cy + 1, 3.5, 4, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // Banding Lines
        ctx.strokeStyle = "#ba4a00";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(cx, cy + 3, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // Neck & Flared Rim
      ctx.fillStyle = isFlash ? "#ffffff" : "#e67e22";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 6, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (prop.type === "ancient_urn") {
      ctx.fillStyle = isFlash ? "#ffffff" : "#1e293b";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.8;

      // Sculpted Urn Body
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 8);
      ctx.quadraticCurveTo(cx - 11, cy - 2, cx - 8, cy + 8);
      ctx.lineTo(cx + 8, cy + 8);
      ctx.quadraticCurveTo(cx + 11, cy - 2, cx + 5, cy - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (!isFlash) {
        // Gold Runic Middle Band
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(cx - 9, cy - 2, 18, 3.5);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cx - 9, cy - 2, 18, 3.5);

        // Bronze Handles
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(cx - 9, cy - 3, 4, Math.PI / 2, (Math.PI * 3) / 2);
        ctx.arc(cx + 9, cy - 3, 4, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Rim Collar
      ctx.fillStyle = isFlash ? "#ffffff" : "#334155";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 9, 6.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (prop.type === "wooden_barrel") {
      ctx.fillStyle = isFlash ? "#ffffff" : "#5c3a21";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 2.0;

      // Curved Stave Body
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 10);
      ctx.quadraticCurveTo(cx - 12, cy, cx - 8, cy + 10);
      ctx.lineTo(cx + 8, cy + 10);
      ctx.quadraticCurveTo(cx + 12, cy, cx + 8, cy - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (!isFlash) {
        // Vertical Stave Dividers
        ctx.strokeStyle = "#3d1d0b";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - 10);
        ctx.lineTo(cx - 3, cy + 10);
        ctx.moveTo(cx + 3, cy - 10);
        ctx.lineTo(cx + 3, cy + 10);
        ctx.stroke();

        // Iron Hoops
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;

        ctx.beginPath();
        ctx.ellipse(cx, cy - 5, 10, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 10, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Top Cap
      ctx.fillStyle = isFlash ? "#ffffff" : "#78350f";
      ctx.strokeStyle = isFlash ? "#ffffff" : "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };

// Idle flower sway, slowed and phase-separated by stable motif identity.
export function flowerMotion(x,y,n,time){const h=terrainHash(Math.round(x),Math.round(y),n);return Math.sin(time*(.0007+(h%7)*.00008)+(h%6283)/1000)*(.07+(h%5)*.015);}
