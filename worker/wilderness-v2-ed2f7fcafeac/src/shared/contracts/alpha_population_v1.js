import {wildernessSelection} from '../content/wilderness_v2.js';
import {WILDERNESS_RESERVATIONS} from '../content/wilderness_reservations_v2.js';
import {ALPHA_POPULATION_VERSION,ALPHA_POPULATION_HASH,hasAlphaPopulation,newPopulationSelection} from '../content/alpha_site_population_v1.js';
import {ALPHA_POPULATION_RESERVATIONS} from '../content/alpha_population_reservations_v1.js';
import {requireContract as check} from './wire.js';
// Compile the immutable commitment once. Every live field is still checked;
// no mutable authority record is cached or trusted after an earlier check.
// Descriptors reject getters, hidden fields, symbols and aliases just as the
// former canonical wire-copy comparison did, without copying/stringifying
// both full records on every eligibility/projection call.
function exactMatcher(expected){
 if(expected===null||typeof expected!=='object')return actual=>actual===expected;
 const array=Array.isArray(expected),keys=Reflect.ownKeys(expected),fields=keys.map(key=>{const d=Object.getOwnPropertyDescriptor(expected,key);return {key,enumerable:d.enumerable,match:exactMatcher(d.value)};});
 return (actual,seen)=>{
  if(!actual||typeof actual!=='object'||Array.isArray(actual)!==array||seen.has(actual))return false;
  const proto=Object.getPrototypeOf(actual);if(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null)return false;
  if(Reflect.ownKeys(actual).length!==keys.length)return false;seen.add(actual);
  for(const f of fields){const d=Object.getOwnPropertyDescriptor(actual,f.key);if(!d||!('value'in d)||d.enumerable!==f.enumerable||!f.match(d.value,seen))return false;}
  return true;
 };
}
const commitments=new Map([...ALPHA_POPULATION_RESERVATIONS,...WILDERNESS_RESERVATIONS].map(r=>[r.socket.provenance.reservationId,{socket:exactMatcher(r.socket),reservation:exactMatcher(r)}]));
export function validatePopulationSocket(s){const e=commitments.get(s.provenance.reservationId);check(e&&newPopulationSelection(s.provenance.reservationId)&&s.provenance.populationHash===ALPHA_POPULATION_HASH&&e.socket(s,new WeakSet()),'Population socket commitment/geometry drift');return s;}
export function validatePopulationReservation(root,r){const e=commitments.get(r.socket.provenance.reservationId);check(root.plannedWorld?.assetId==='alpha'&&hasAlphaPopulation(root.plannedWorld)&&(!wildernessSelection(r.socket.provenance.reservationId)||root.plannedWorld?.wildernessVersion==='wilderness-distribution-v2-native')&&e&&newPopulationSelection(r.socket.provenance.reservationId)&&e.reservation(r,new WeakSet()),'Population reservation commitment drift');return r;}
