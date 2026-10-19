import {terrainHash} from './environment_motifs.js';
// Coverage is deliberately partial. These palettes extend the existing World
// ground/road renderer; they are not eight completed biome artwork kits.
export const plannedGroundPalette=code=>({a:['#768b43','#8e9c54','#637b39'],d:['#b7a376','#c6b186','#a99569'],s:['#b8c9ce','#d0dce0','#9cbbc3'],t:['#266743','#397a51','#1d563e'],l:['#47474b','#58545a','#383d43']}[code]??null);
export function drawPlannedSurfaceCell(c,type,biome,x,y,t,seed,offset,at){
 if(!['O','W','L','C','K','H','V'].includes(type))return false;const px=x*t,py=y*t,n=terrainHash(x+offset.x/t,y+offset.y/t,seed+1301),water=['O','W','L'].includes(type);
 if(type==='H'||type==='V'){
  // Crosswise planks and perimeter beams; the deck is the actual walkable tile.
  c.fillStyle='#725237';c.fillRect(px,py,t,t);c.fillStyle='#a28053';c.strokeStyle='#503e30';c.lineWidth=1;
  for(let i=0;i<4;i++){const k=i*8;c.fillStyle=(n+i)%3?'#a28053':'#947149';if(type==='H'){c.fillRect(px+k+1,py,6,t);c.strokeRect(px+k+1,py+1,6,t-2);}else{c.fillRect(px,py+k+1,t,6);c.strokeRect(px+1,py+k+1,t-2,6);}}
  c.fillStyle='#483e32';c.strokeStyle='#c3a76e';const sides=type==='H'?[[0,-1],[0,1]]:[[-1,0],[1,0]];for(const [dx,dy] of sides)if(at(x+dx,y+dy)!==type){if(dx){c.fillRect(px+(dx>0?t-4:0),py,4,t);c.fillStyle='#c3a76e';c.fillRect(px+(dx>0?t-3:1),py,1,t);}else{c.fillRect(px,py+(dy>0?t-4:0),t,4);c.fillStyle='#c3a76e';c.fillRect(px,py+(dy>0?t-3:1),t,1);}c.fillStyle='#483e32';}
 }else if(water){c.fillStyle=type==='O'?'#23536a':type==='L'?'#326d76':'#3e7b83';c.fillRect(px,py,t,t);c.strokeStyle=type==='O'?'#397285':'#73a5a5';c.globalAlpha=.38;c.lineWidth=1.3;c.beginPath();const yy=py+7+n%19;c.moveTo(px+3,yy);c.quadraticCurveTo(px+13,yy-3,px+25,yy+1);c.stroke();c.globalAlpha=1;
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(at(x+dx,y+dy)&&!['O','W','L','v'].includes(at(x+dx,y+dy))){c.fillStyle='#82a49b';c.globalAlpha=.55;if(dx)c.fillRect(px+(dx>0?t-3:0),py,3,t);else c.fillRect(px,py+(dy>0?t-3:0),t,3);c.globalAlpha=1;}
 }else{c.fillStyle=type==='K'?(biome==='l'?'#656064':'#7e847b'):biome==='m'?'#7a8364':biome==='s'?'#c3d2d5':biome==='l'?'#5b5250':'#b0a071';c.fillRect(px,py,t,t);c.fillStyle=type==='K'?'#a8afa2':'#d0be96';for(let i=0;i<3;i++){const dx=5+(n>>>(i*4))%23,dy=5+(n>>>(i*5))%23;c.beginPath();c.ellipse(px+dx,py+dy,type==='K'?3+i:1.5,type==='K'?2:1,0,0,Math.PI*2);c.fill();}}
 return true;
}
