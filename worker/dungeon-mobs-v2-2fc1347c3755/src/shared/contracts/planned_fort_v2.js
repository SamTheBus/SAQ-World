import {PLANNED_FORT_V2,DEEP_FORT_FIXTURE_ID,plannedFortIdsV2} from '../content/planned_fort_policy_v2.js';
import {canonicalStringify,requireContract as check} from './wire.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
// Exact selected Alpha/isolated-fixture commits. Other seeds are qualified by
// the pure generator scan, not silently admitted as live campaigns.
export function validateFortReservationV2(root,r){
 const p=r.socket.provenance,q=r.parcel,fixture=root.plannedWorld.assetId==='fort-deep-fixture';
 check(root.plannedWorld.fortPrototype===PLANNED_FORT_V2&&plannedFortIdsV2(root.plannedWorld).includes(p.reservationId)&&q.version===PLANNED_FORT_V2,'Unselected Fort V2 reservation');
 const expected=Array.from({length:3},(_,y)=>Array.from({length:3},(_,x)=>({x:248+x,y:220+y}))).flat();
 check(p.reservationId===(fixture?DEEP_FORT_FIXTURE_ID:'repeatable-slot:fort:tropical:large:01')&&p.sizeTier===(fixture?'deep':'large')&&p.band===5&&same(p.footprintChunks,expected)&&same(p.approachChunks,[{x:249,y:223},{x:249,y:224},{x:249,y:225}]),'Fort V2 selected capacity drift');
 check(r.siteId===r.socket.siteId&&r.packageId==='procedural-fort-family'&&q.siteId===r.siteId&&q.packageId===r.packageId&&q.familyId==='site-family:fort'&&same(q.socket,r.socket)&&q.tier===p.sizeTier&&q.layoutSeed===r.socket.siteSeed&&q.label===(fixture?'Deep Fort fixture':'Tropical Fort'),'Fort V2 parcel identity drift');
 check(p.assetHash===root.plannedWorld.assetHash&&p.planHash===root.plannedWorld.planHash&&q.tileX===String(1024*32+7944)&&q.tileY===String(1024*26+5720)&&q.width===80&&q.height===70&&q.roadAnchor.tileX===String(1024*32+7983)&&q.roadAnchor.tileY===String(1024*26+5789),'Fort V2 geometry commitment drift');
 check(r.socket.entrance.chunkX===String(1024+249)&&r.socket.entrance.chunkY===String(1024+221)&&r.socket.entrance.localX===528&&r.socket.entrance.localY===((5753%26)+.5)*32,'Fort V2 entrance drift');
 check(q.pages.length===expected.length&&q.pages.every((c,i)=>c.chunkX===String(1024+expected[i].x)&&c.chunkY===String(1024+expected[i].y)),'Fort V2 page inventory drift');
 return r;
}
