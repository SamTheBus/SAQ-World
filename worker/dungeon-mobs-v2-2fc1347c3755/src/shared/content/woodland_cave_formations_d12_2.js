import {freezeWire,requireContract as check} from '../contracts/wire.js';

export const WOODLAND_CAVE_FORMATION_CATALOG_D12_2_VERSION='woodland-cave-formations-d12-2-v1';
const dirs={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]};

function authored(moduleId,category,silhouette,sourceMask,socketDirections=['north','east','south','west']){
 const mask=sourceMask.map(row=>[...row]);const h=mask.length,w=mask[0].length;
 const sockets=socketDirections.map(direction=>{const [dx,dy]=dirs[direction],x=dx<0?0:dx>0?w-1:Math.floor(w/2),y=dy<0?0:dy>0?h-1:Math.floor(h/2);for(let n=-1;n<=1;n++){const sx=x+(dy?n:0),sy=y+(dx?n:0);if(mask[sy]?.[sx]!==undefined)mask[sy][sx]='1';const ix=sx-dx,iy=sy-dy;if(mask[iy]?.[ix]!==undefined)mask[iy][ix]='1';}return {socketId:direction,direction,x,y,width:3};});
 const rows=mask.map(row=>row.join(''));return freezeWire({moduleId,category,silhouette,dimensions:{width:w,height:h},terrainMask:[...rows],collisionMask:[...rows],sockets,permittedRotations:[0,90,180,270],permittedReflections:['none','horizontal'],minimumActorClearanceTiles:3});
}

export const WOODLAND_CAVE_FORMATIONS_D12_2=freezeWire([
 authored('chamber-kidney','chamber','kidney',['00011111000','00111111110','01111111111','11111111111','11111111110','01111111110','00111111100','00011111000','00001110000']),
 authored('chamber-teardrop','chamber','teardrop',['000111000','001111100','011111110','111111111','111111111','111111111','011111110','011111110','001111100','000111000','000010000']),
 authored('chamber-split-lobed','chamber','split-lobed',['0011100011100','0111110111110','1111111111111','1111111111111','1111111111111','0111111111110','0011110111100','0001100011000','0001000010000']),
 authored('chamber-crescent','chamber','crescent',['000111111000','001111111110','011111111111','111111111111','111111100011','111111000011','011111100111','001111111110','000111111000','000011110000']),
 authored('chamber-offset','chamber','offset',['0001111000','0011111110','0111111111','1111111111','1111111110','0111111110','0011111111','0011111111','0001111110','0000111100','0000111000','0000010000']),
 authored('chamber-pinched','chamber','pinched',['0011111111000','0111111111100','1111111111110','1111110001111','1111100001111','1111110011111','0111111111110','0011111111100','0001111111000']),
 authored('cavern-broad-grotto','large','broad-grotto',['00001111111100000','00111111111111100','01111111111111110','11111111111111111','11111111111111111','11111111111111111','11111111111111111','11111111111111111','01111111111111110','00111111111111100','00011111111111000','00001111111110000','00000111111100000']),
 authored('cavern-amphitheater','large','amphitheater',['0000011111111000000','0001111111111111000','0011111111111111100','0111111111111111110','1111111111111111111','1111111111111111111','1111111111111111111','1111111111111111111','0111111111111111110','0011111111111111100','0001111111111111000','0000111111111110000','0000001111111000000']),
 authored('cavern-double-lobe','large','double-lobed',['00111110001111100','01111111011111110','11111111111111111','11111111111111111','11111111111111111','11111111111111111','01111111111111110','00111111111111100','00111111111111100','01111111111111110','11111111111111111','01111111011111110','00111110001111100','00011100000111000','00001000000010000']),
 authored('passage-straight','passage','straight',['000000000','111111111','111111111','111111111','000000000'],['west','east']),
 authored('passage-bent','passage','bent',['111000000','111000000','111111100','011111110','001111111','000001111','000001111','000001111','000000000'],['west','south']),
 authored('passage-narrowing','passage','narrowing',['000000000','111110000','111111111','111111111','111110000','000000000','000000000'],['west','east']),
 authored('passage-widening','passage','widening',['000000000','000011111','111111111','111111111','000011111','000011111','000000000'],['west','east']),
 authored('junction-y','junction','Y-junction',['0001111000000','0001111000000','0001111000000','0011111100000','0111111111110','1111111111111','1111111111111','0111111111110','0011111100000','0001111000000','0001111000000']),
 authored('junction-t','junction','T-junction',['0000011100000','0000011100000','0000011100000','1111111111111','1111111111111','1111111111111','0000111110000','0000111110000','0000011100000']),
 authored('junction-irregular-fork','junction','irregular-fork',['000011100000000','000111110000000','001111111100000','111111111111111','111111111111111','111111111111111','001111111111100','000111100111100','000111000011100','000110000011000','000100000001000']),
 authored('alcove-collapsed','alcove','collapsed-pocket',['000111000','001111100','011111110','111111111','111111110','011111100','001110000'],['south']),
 authored('alcove-mineral','alcove','mineral-pocket',['00011111000','00111111100','01111111110','11111111111','11111111110','01111111100','00111110000'],['south']),
 authored('alcove-bone','alcove','bone-pocket',['0001111000','0011111110','0111111111','1111111111','1111111110','0111111100','0011111000','0001110000'],['south']),
 authored('transition-slope','transition','descending-slope',['00011111000','00111111100','01111111110','11111111111','11111111111','01111111110','00111111100','00011111000','00001110000']),
 authored('reward-pocket','reward','reward-nook',['0000111110000','0001111111000','0011111111100','0111111111110','1111111111111','1111111111111','0111111111110','0011111111100','0001111111000'],['south'])
]);

export const WOODLAND_CAVE_FORMATIONS_BY_ID_D12_2=Object.freeze(Object.fromEntries(WOODLAND_CAVE_FORMATIONS_D12_2.map(row=>[row.moduleId,row])));

export function validateWoodlandCaveFormationCatalogD12_2(){
 const ids=new Set(),counts={chamber:0,large:0,passage:0,junction:0,alcove:0,transition:0,reward:0};
 for(const f of WOODLAND_CAVE_FORMATIONS_D12_2){check(!ids.has(f.moduleId),'Duplicate Cave formation');ids.add(f.moduleId);counts[f.category]++;check(f.collisionMask.length===f.dimensions.height&&f.collisionMask.every(row=>row.length===f.dimensions.width&&/^[01]+$/.test(row)),'Invalid Cave formation mask');check(f.sockets.length&&f.sockets.every(s=>s.width>=3&&dirs[s.direction]),'Invalid Cave formation socket');}
 check(counts.chamber>=6&&counts.large>=3&&counts.passage>=4&&counts.junction>=3&&counts.alcove>=3&&counts.transition>=1&&counts.reward>=1,'Incomplete natural Cave formation catalog');return true;
}
