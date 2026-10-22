import {collidesWithTiles} from '../rules/world_geometry.js';
import {copyWire,requireContract as check} from '../contracts/wire.js';

export const ELITE_REVIEW_PROOF_CASE_D12_4='F';
export const SWIFT_COMMANDER_REVIEW_PROOF_CASE_D12_4D='G';
export const GLACIAL_WARDEN_REVIEW_PROOF_CASE_D12_4E='H';
export const TOXIC_DECAY_REVIEW_PROOF_CASE_D12_4F='I';
export const IRON_CITADEL_REVIEW_PROOF_CASE_D12_4G='J';
export const BLOOD_BERSERKER_REVIEW_PROOF_CASE_D12_4H_A='K';
export const NULLIFIER_REVIEW_PROOF_CASE_D12_4I='L';
export const WEB_WEAVER_REVIEW_PROOF_CASE_D12_4J='M';
export const SLAG_SHAPER_REVIEW_PROOF_CASE_D12_4K='N';

const point=cell=>({x:(cell.x+.5)*32,y:(cell.y+.5)*32});
const openLine=(collision,a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(d/8));for(let i=0;i<=steps;i++){const t=i/steps;if(collidesWithTiles(collision,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,2))return false;}return true;};
const cells=room=>room.openCells.map(value=>{const [x,y]=value.split(',').map(Number);return {x,y};});

function nearest(candidates,desired,accepted,predicate){
 const ordered=candidates.filter(cell=>predicate(point(cell))).sort((a,b)=>{const pa=point(a),pb=point(b),da=(pa.x-desired.x)**2+(pa.y-desired.y)**2,db=(pb.x-desired.x)**2+(pb.y-desired.y)**2;return da-db||a.y-b.y||a.x-b.x;});
 const selected=ordered.find(cell=>accepted.every(other=>Math.hypot(point(cell).x-other.x,point(cell).y-other.y)>=40));check(selected,'Vitality Weaver review chamber lacks authored clearance');return point(selected);
}

// This is reached only through the existing explicit activity proof case. It
// does not alter ordinary cave generation, reservations, or spawn odds.
export function vitalityWeaverReviewRosterD12_4(state,reservation,floor){
 if(state.proofCase!==ELITE_REVIEW_PROOF_CASE_D12_4||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Vitality Weaver review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 const insideOffsets=[[-64,0],[64,0],[0,-64]];
 for(const [dx,dy] of insideOffsets){const desired={x:anchor.x+dx,y:anchor.y+dy},chosen=nearest(available,desired,accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=48&&d<=112&&openLine(floor.collision,anchor,p);});accepted.push(chosen);}
 const outside=nearest(available,{x:anchor.x,y:anchor.y+160},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>120&&d<=224&&openLine(floor.collision,anchor,p);});accepted.push(outside);
 const families=[...original.map(row=>row.family),...original.map(row=>row.family)];
 return accepted.map((position,index)=>({memberKey:`elite-review:${floor.index}:${index}`,family:families[index]??original[0].family,position:copyWire(position),roomId}));
}

// Case G uses the same authored reference chamber without changing production
// cave rosters. Index 0 is the Commander, index 1 is the already-supported
// Weaver, and the remaining three entries stay ordinary enemies.
export function swiftCommanderReviewRosterD12_4D(state,reservation,floor){
 if(state.proofCase!==SWIFT_COMMANDER_REVIEW_PROOF_CASE_D12_4D||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Swift Commander review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 for(const [dx,dy] of [[-96,0],[96,0],[0,-96]]){const desired={x:anchor.x+dx,y:anchor.y+dy},chosen=nearest(available,desired,accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=64&&d<=136&&openLine(floor.collision,anchor,p);});accepted.push(chosen);}
 const outside=nearest(available,{x:anchor.x,y:anchor.y+176},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>140&&d<=240&&openLine(floor.collision,anchor,p);});accepted.push(outside);
 const families=[...original.map(row=>row.family),...original.map(row=>row.family)];
 return accepted.map((position,index)=>({memberKey:`swift-review:${floor.index}:${index}`,family:families[index]??original[0].family,position:copyWire(position),roomId}));
}

// Case H installs one Warden and one ordinary comparison actor in the existing
// authored reference chamber. Player placement remains participant authority.
export function glacialWardenReviewRosterD12_4E(state,reservation,floor){
 if(state.proofCase!==GLACIAL_WARDEN_REVIEW_PROOF_CASE_D12_4E||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Glacial Warden review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 const ordinary=nearest(available,{x:anchor.x+96,y:anchor.y},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=64&&d<=136&&openLine(floor.collision,anchor,p);});accepted.push(ordinary);
 const families=[...original.map(row=>row.family),...original.map(row=>row.family)];return accepted.map((position,index)=>({memberKey:`glacial-review:${floor.index}:${index}`,family:families[index]??original[0].family,position:copyWire(position),roomId}));
}

// Case I keeps production encounter tables unchanged. The elite and ordinary
// comparison actor use the same authored family in one open review chamber.
export function toxicDecayReviewRosterD12_4F(state,reservation,floor){
 if(state.proofCase!==TOXIC_DECAY_REVIEW_PROOF_CASE_D12_4F||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Toxic Decay review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 const ordinary=nearest(available,{x:anchor.x+112,y:anchor.y},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=72&&d<=160&&openLine(floor.collision,anchor,p);});accepted.push(ordinary);
 const family=original[0].family;return accepted.map((position,index)=>({memberKey:`toxic-review:${floor.index}:${index}`,family,position:copyWire(position),roomId}));
}

// Case J keeps production encounter tables unchanged. Index 0 is the Citadel,
// indices 1 and 2 are same-family Guard recipients, and index 3 is the ordinary
// comparison actor outside the inclusive 100px aura.
export function ironCitadelReviewRosterD12_4G(state,reservation,floor){
 if(state.proofCase!==IRON_CITADEL_REVIEW_PROOF_CASE_D12_4G||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Iron Citadel review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 for(const [dx,dy] of [[-64,0],[64,0]]){const chosen=nearest(available,{x:anchor.x+dx,y:anchor.y+dy},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=48&&d<=100&&openLine(floor.collision,anchor,p);});accepted.push(chosen);}
 const outside=nearest(available,{x:anchor.x,y:anchor.y+160},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>100&&d<=224&&openLine(floor.collision,anchor,p);});accepted.push(outside);
 const family=original[0].family;return accepted.map((position,index)=>({memberKey:`citadel-review:${floor.index}:${index}`,family,position:copyWire(position),roomId}));
}

// Case K keeps production encounters unchanged. Index 0 is the Berserker,
// indices 1-3 are same-group recipients inside 110px, and index 4 is an
// ordinary comparison actor outside the aura with room to observe decay.
export function bloodBerserkerReviewRosterD12_4H_A(state,reservation,floor){
 if(state.proofCase!==BLOOD_BERSERKER_REVIEW_PROOF_CASE_D12_4H_A||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Berserker review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 for(const [dx,dy] of [[-64,0],[64,0],[0,-96]]){const chosen=nearest(available,{x:anchor.x+dx,y:anchor.y+dy},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=48&&d<=110&&openLine(floor.collision,anchor,p);});accepted.push(chosen);}
 const outside=nearest(available,{x:anchor.x,y:anchor.y+176},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>110&&d<=240&&openLine(floor.collision,anchor,p);});accepted.push(outside);
 const family=original[0].family;return accepted.map((position,index)=>({memberKey:`berserker-review:${floor.index}:${index}`,family,position:copyWire(position),roomId}));
}

// Case L is review-only. The source and comparison actor share one authored
// chamber; the generated irregular cave wall supplies a genuine LOS break.
export function nullifierReviewRosterD12_4I(state,reservation,floor){
 if(state.proofCase!==NULLIFIER_REVIEW_PROOF_CASE_D12_4I||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Nullifier review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 const ordinary=nearest(available,{x:anchor.x+112,y:anchor.y},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=72&&d<=160&&openLine(floor.collision,anchor,p);});accepted.push(ordinary);
 const family=original[0].family;return accepted.map((position,index)=>({memberKey:`nullifier-review:${floor.index}:${index}`,family,position:copyWire(position),roomId}));
}

// Case M is review-only. The generated chamber provides an open casting area,
// while its irregular perimeter supplies real wall geometry for LOS review.
export function webWeaverReviewRosterD12_4J(state,reservation,floor){
 if(state.proofCase!==WEB_WEAVER_REVIEW_PROOF_CASE_D12_4J||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Web Weaver review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 const ordinary=nearest(available,{x:anchor.x+112,y:anchor.y},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=72&&d<=176&&openLine(floor.collision,anchor,p);});accepted.push(ordinary);
 const family=original[0].family;return accepted.map((position,index)=>({memberKey:`web-weaver-review:${floor.index}:${index}`,family,position:copyWire(position),roomId}));
}

// Case N is review-only. Its open chamber leaves room for two pools while the
// irregular generated perimeter supplies real wall geometry for LOS review.
export function slagShaperReviewRosterD12_4K(state,reservation,floor){
 if(state.proofCase!==SLAG_SHAPER_REVIEW_PROOF_CASE_D12_4K||floor.index!==0||reservation?.parcel?.placementProvenance?.guaranteed!==true||reservation.parcel.placementProvenance.ordinal!==0)return null;
 const original=floor.encounter.members,roomId=original[0]?.roomId,room=floor.graph.rooms.find(row=>row.roomId===roomId);check(room&&original.every(member=>member.roomId===roomId),'Slag Shaper review encounter requires one cavern');
 const available=cells(room).filter(cell=>!collidesWithTiles(floor.collision,point(cell).x,point(cell).y,10)),center=point({x:room.cx,y:room.cy}),accepted=[],anchor=nearest(available,center,accepted,()=>true);accepted.push(anchor);
 const ordinary=nearest(available,{x:anchor.x+112,y:anchor.y},accepted,p=>{const d=Math.hypot(p.x-anchor.x,p.y-anchor.y);return d>=72&&d<=176&&openLine(floor.collision,anchor,p);});accepted.push(ordinary);
 const family=original[0].family;return accepted.map((position,index)=>({memberKey:`slag-shaper-review:${floor.index}:${index}`,family,position:copyWire(position),roomId}));
}
