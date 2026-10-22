// Commutative observed-cell summary. Reobserving a tile cannot add duplicate
// counts. Terrain majority and transport symbols occupy independent channels.
const CODES='wormadstlOWLRTHV';
export function mergeObservedSummaryV2(prior,row,oldTiles,size,offsetX,offsetY){
 const counts=prior?.counts?.map(c=>c.slice())??Array.from({length:64},()=>Array(CODES.length).fill(0));
 for(let y=0;y<26;y++)for(let x=0;x<32;x++){
  const c=row.tiles[y*32+x],old=oldTiles?.[y*32+x]??'?';if(c==='?'||c===old)continue;
  const sx=Math.floor((offsetX*32+x)*8/(size*32)),sy=Math.floor((offsetY*26+y)*8/(size*26)),n=counts[sy*8+sx],a=CODES.indexOf(old),b=CODES.indexOf(c);if(a>=0)n[a]--;if(b>=0)n[b]++;
  if(n.some(v=>v<0))throw Error('Invalid observed summary counts');
 }
 const features=[],tiles=counts.map(n=>{let best=-1,index=-1;for(let i=0;i<12;i++)if(n[i]>best&&n[i]>0){index=i;best=n[i];}features.push(n[14]||n[15]?'H':n[12]?'R':n[13]?'T':'?');return index>=0?CODES[index]:features.at(-1)==='?'?'?':'w';}).join('');
 return {tiles,features:features.join(''),counts};
}
