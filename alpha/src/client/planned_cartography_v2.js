// Reads observed map pages only, never unrevealed planning geography.
const COLORS={w:'#43815c',a:'#879e58',m:'#588879',r:'#939183',d:'#c9ae73',s:'#cbdfe4',t:'#3d7756',l:'#766577',O:'#214b65',W:'#458caa',L:'#376d94'};
const WATER=new Set(['O','W','L']),FEATURES=new Set(['R','T','H','V']);
export const PLANNED_MAP_MAX_LEVEL=3;
export const plannedMapFeature=c=>c==='H'||c==='V'?'bridge':c==='R'?'road':c==='T'?'trail':null;
export function drawPlannedCartographyV2(ctx,page,x,y,cw,ch,cols,rows,neighbor=null){
 const outside=(px,py)=>px<0||py<0||px>=cols||py>=rows,at=(px,py)=>outside(px,py)?neighbor?.(px,py,'tiles')??'?':page.tiles[py*cols+px],feature=(px,py)=>outside(px,py)?neighbor?.(px,py,'features')??'?':page.features?.[py*cols+px]??at(px,py);
 for(let py=0;py<rows;py++)for(let px=0;px<cols;px++){const c=at(px,py);if(c==='?')continue;ctx.fillStyle=COLORS[c]??'#56785d';ctx.fillRect(x+px*cw,y+py*ch,cw+.2,ch+.2);}
 // Crisp geographic samples replace expanded blobs. Outlines mark observed
 // land-water boundaries only; the edge of exploration is not a coastline.
 ctx.strokeStyle='#a9c4c5';ctx.lineWidth=.8;ctx.beginPath();
 for(let py=0;py<rows;py++)for(let px=0;px<cols;px++){const c=at(px,py);if(c==='?'||WATER.has(c))continue;const xx=x+px*cw,yy=y+py*ch;for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(WATER.has(at(px+dx,py+dy))){if(dx){ctx.moveTo(xx+(dx>0?cw:0),yy);ctx.lineTo(xx+(dx>0?cw:0),yy+ch);}else{ctx.moveTo(xx,yy+(dy>0?ch:0));ctx.lineTo(xx+cw,yy+(dy>0?ch:0));}}}ctx.stroke();
 for(const kind of ['trail','road','bridge']){
  ctx.strokeStyle=kind==='trail'?'#d4c093':kind==='road'?'#ffda75':'#edf9ff';ctx.lineWidth=kind==='trail'?1.1:kind==='road'?2:3;ctx.lineCap='round';ctx.setLineDash(kind==='trail'?[2.5,2]:[]);ctx.beginPath();
  for(let py=0;py<rows;py++)for(let px=0;px<cols;px++){const f=feature(px,py);if(plannedMapFeature(f)!==kind)continue;const xx=x+(px+.5)*cw,yy=y+(py+.5)*ch;let linked=false;for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(plannedMapFeature(feature(px+dx,py+dy))){ctx.moveTo(xx,yy);ctx.lineTo(xx+dx*cw*.55,yy+dy*ch*.55);linked=true;}if(!linked){ctx.moveTo(xx-.6,yy);ctx.lineTo(xx+.6,yy);}}
  ctx.stroke();ctx.setLineDash([]);
 }
}
