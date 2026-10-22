import {collidesWithTiles} from '../rules/world_geometry.js';
import {copyWire,requireContract as check} from '../contracts/wire.js';

export const ARACHNID_TREANT_REVIEW_PROOF_CASE_D12_5A='O';

const point=cell=>({x:(cell.x+.5)*32,y:(cell.y+.5)*32});
const cells=room=>room.openCells.map(value=>{const [x,y]=value.split(',').map(Number);return {x,y};});

// Review-only authored roster. Production cave rosters and site distribution
// never call this branch. The three summon shells are present in provenance at
// admission time, but boss authority keeps them dormant until phase two.
export function arachnidTreantReviewRosterD12_5A(state,reservation,floor){
 if(state.proofCase!==ARACHNID_TREANT_REVIEW_PROOF_CASE_D12_5A||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const room=[...floor.graph.rooms].sort((a,b)=>b.openCells.length-a.openCells.length||a.roomId.localeCompare(b.roomId))[0];check(room,'Arachnid Treant review requires a cavern');
 const desired=point({x:room.cx,y:room.cy}),available=cells(room).map(point).filter(p=>!collidesWithTiles(floor.collision,p.x,p.y,34)).sort((a,b)=>Math.hypot(a.x-desired.x,a.y-desired.y)-Math.hypot(b.x-desired.x,b.y-desired.y)||a.y-b.y||a.x-b.x);
 let anchor=null,summons=null;
 for(const candidate of available){const positions=[0,1,2].map(i=>({x:candidate.x+Math.cos(i*Math.PI*2/3)*54,y:candidate.y+Math.sin(i*Math.PI*2/3)*54}));if(positions.every((p,i)=>!collidesWithTiles(floor.collision,p.x,p.y,10)&&positions.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=24))){anchor=candidate;summons=positions;break;}}
 check(anchor&&summons,'Arachnid Treant review chamber lacks boss clearance');
 return [
  {memberKey:`treant-review:${floor.index}:boss`,family:null,role:'arachnid-treant',position:copyWire(anchor),roomId:room.roomId},
  ...summons.map((position,index)=>({memberKey:`treant-review:${floor.index}:cocoon-${index}`,family:index===1?'slime':'sprout',role:'treant-cocoon',summonOrdinal:index,position:copyWire(position),roomId:room.roomId})),
 ];
}
