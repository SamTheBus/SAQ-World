import {WORLD_COMBAT_VERSION as V,WORLD_COMBAT_POLICY as P} from '../content/world_combat_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
const cache=new Map();
export function populateCombatRooms(base,seed,family,tier,index){const key=[seed,family,tier,index].join('/');if(cache.has(key))return cache.get(key);
 const rooms=base.graph.rooms.filter(r=>r.role!=='arrival'),ranked=rooms.map(r=>({r,n:hash(V+key+r.roomId)})).sort((a,b)=>a.n-b.n),chosen=ranked.slice(0,Math.min(P.floorPacks[tier],rooms.length)),members=[],packs=[];
 const families=family==='cave'?['slime','rust_nibbler','gargoyle']:family==='fort'?['animated_armor','gargoyle','golem']:['cursed_blade','gargoyle','rust_nibbler'];
 for(const [i,{r,n}] of chosen.entries()){const count=6+n%3,candidates=[];for(let dy=-r.ry+2;dy<=r.ry-2;dy++)for(let dx=-r.rx+2;dx<=r.rx-2;dx++){const p={x:(r.cx+dx)*32+16,y:(r.cy+dy)*32+16};if(collidesWithTiles(base.collision,p.x,p.y,14)||Math.hypot(p.x-base.entrance.x,p.y-base.entrance.y)<192||Math.hypot(p.x-base.stairAnchors.down.x,p.y-base.stairAnchors.down.y)<64||Math.hypot(p.x-base.reward.position.x,p.y-base.reward.position.y)<48)continue;candidates.push({p,n:hash(V+key+r.roomId+dx+','+dy)});}candidates.sort((a,b)=>a.n-b.n);const used=[];for(const c of candidates){if(used.every(p=>Math.hypot(p.x-c.p.x,p.y-c.p.y)>=40)){used.push(c.p);if(used.length===count)break;}}check(used.length===count,'Combat room capacity exhausted');packs.push({roomId:r.roomId,count});for(const [j,p] of used.entries())members.push({memberKey:family+':horde:'+index+':'+i+':'+j,family:families[(n+j)%families.length],roomId:r.roomId,position:p,...(family==='fort'?{eliteAffixId:i===0&&j===0&&index>0?(['swift_commander','slag_shaper','iron_citadel'][Math.min(2,index-1)]):null}:{})});}
 const result=freezeWire({...base,encounter:{rank:'C',combatVersion:V,packs,members}});if(cache.size>=128)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
