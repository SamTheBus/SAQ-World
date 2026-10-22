import {freezeWire} from '../contracts/wire.js';
import {ARACHNID_TREANT_PROFILE} from './bosses_d12_5.js';
import {collidesWithTiles} from '../rules/world_geometry.js';

// Dungeon's Zone 3 identity is named Brimstone Colossus and uses this AI key.
export const BRIMSTONE_ID='overlord_iron_vault';
export const BRIMSTONE_PROFILE=ARACHNID_TREANT_PROFILE;
export const BRIMSTONE=freezeWire({
 label:'BRIMSTONE COLOSSUS',range:220,recoveryTicks:120,
 strike:{telegraphTicks:24,recoveryTicks:50,radius:52,halfAngle:.95,damageNumerator:10},
 slam:{telegraphTicks:75,radius:64,damageNumerator:18},
 magma_vents:{telegraphTicks:75,count:2,boilTicks:270,flashTicks:18,reach:96,halfWidth:12,damageNumerator:13,maxActive:6}
});
export const brimstoneFortFloor=(site,index)=>site.familyId==='site-family:fort'&&site.sizeTier==='large'&&index===site.floorCount-1;
export function brimstoneLineClear(c,a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));
 for(let i=0;i<=n;i++){const q=i/n;if(collidesWithTiles(c,a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q,1))return false;}return true;
}
export function brimstoneVentArms(c,p){
 const arms={};for(const[key,dx,dy]of[['east',1,0],['west',-1,0],['north',0,-1],['south',0,1]]){
  let length=0;for(let d=2;d<=96;d+=2){if(collidesWithTiles(c,p.x+dx*d,p.y+dy*d,12))break;length=d;}arms[key]=length;
 }return arms;
}
export function brimstoneVentContains(v,p){
 const x=p.x-v.position.x,y=p.y-v.position.y;
 return Math.abs(y)<=12&&x>=-v.arms.west&&x<=v.arms.east||Math.abs(x)<=12&&y>=-v.arms.north&&y<=v.arms.south;
}
