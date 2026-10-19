import {MULTIROOM_VERSION as V,MULTIROOM_POLICY as P} from '../content/multiroom_policy_v1.js';
import {multiroomRecipe,tileDistances} from '../generation/multiroom_v1.js';
import {canonicalStringify,requireContract as check} from './wire.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
// Cache only immutable expected recipes and their proof. Each mutable live
// field is checked on every call; an earlier valid authority object is never
// trusted after mutation. Avoid repeated graph flood fills in save/read cuts.
function matcher(expected){
 if(expected===null||typeof expected!=='object')return actual=>actual===expected;
 const array=Array.isArray(expected),fields=Reflect.ownKeys(expected).map(k=>({k,e:Object.getOwnPropertyDescriptor(expected,k).enumerable,m:matcher(expected[k])}));
 return (actual,seen)=>{if(!actual||typeof actual!=='object'||Array.isArray(actual)!==array||seen.has(actual))return false;const proto=Object.getPrototypeOf(actual);if(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null)return false;if(Reflect.ownKeys(actual).length!==fields.length)return false;seen.add(actual);for(const f of fields){const d=Object.getOwnPropertyDescriptor(actual,f.k);if(!d||!('value'in d)||d.enumerable!==f.e||!f.m(d.value,seen))return false;}return true;};
}
const proofs=new Map();
function proof(seed,family,tier,index){const k=seed+'/'+family+'/'+tier+'/'+index;if(!proofs.has(k)){const r=multiroomRecipe(seed,family,tier,index),d=tileDistances(r.collision,r.entrance),fields=Object.fromEntries(Object.entries(r).map(([k,v])=>[k,matcher(v)]));if(proofs.size>=128)proofs.delete(proofs.keys().next().value);proofs.set(k,{r,d,fields});}return proofs.get(k);}
export function validateMultiroomRecipe(f,seed,family,tier,index){const p=proof(seed,family,tier,index);for(const [k,m]of Object.entries(p.fields))check(m(f[k],new WeakSet()),'Multiroom immutable '+k+' drift');return f;}
export function validateMultiroomFloor(f,seed,family,tier,index){
 const {r,d,fields}=proof(seed,family,tier,index);for(const k of ['version','graph','collision','visual','entrance'])check(fields[k](f[k],new WeakSet()),'Multiroom immutable geometry drift');
 const at=p=>d[Math.floor(p.y/32)*f.collision.width+Math.floor(p.x/32)];
 check(f.graph.navigation.minimumRoomEdges>=P.minimumStairRoomEdges&&f.graph.navigation.optionalRoomIds.length>0&&at(r.stairAnchors.down)>=P.minimumStairRouteTiles,'Multiroom exploration/stair separation');
 for(const p of [f.entrance,r.stairAnchors.down,r.reward.position,...f.encounter.members.map(m=>m.position)])check(at(p)>=0&&!collidesWithTiles(f.collision,p.x,p.y,14),'Multiroom unreachable/hull-unsafe anchor');return f;
}
