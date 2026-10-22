import {campaignTavernTarget} from './campaign_tavern_v1.js';
import { canonicalStringify, closedRecord, requireContract, safeInteger } from './wire.js';
import { createId, validateId } from './identities.js';
import { validateHex } from './hashing.js';
import { collidesWithTiles } from '../rules/world_geometry.js';
export { collidesWithTiles } from '../rules/world_geometry.js';
import { ORDINARY_ENEMIES, ORDINARY_ACQUIRE_RANGES, resolveOrdinaryProfile } from '../content/ordinary_enemies.js';
import { BASELINE_PROGRESSION_POWER } from './threat_power.js';
import {functionalSiteTransitionTargetD9} from './functional_site_d9.js';

export const SITE_RECIPE_VERSION = 'bounded-stone-rooms-d2-v1';
export const SITE_INTERACTION_RADIUS = 64;
export const SITE_EXIT_PROTECTION_TICKS = 120; // User-approved two seconds at 60 Hz.
const same = (a,b) => canonicalStringify(a) === canonicalStringify(b);
// A bijection of a generated site token within one campaign namespace. This is
// stable identity, not a security primitive. Registry collisions still fail closed.
export function siteInstanceId(campaignId, siteId) {
  validateId('campaignId',campaignId); validateId('locationId',siteId);
  const token=(BigInt('0x'+campaignId.slice(4))^BigInt('0x'+siteId.slice(4))).toString(16).padStart(32,'0');
  return createId('spaceInstanceId',token);
}
function point(p,c,r=10) {
  closedRecord(p,['x','y']); safeInteger(p.x,0); safeInteger(p.y,0);
  requireContract(!collidesWithTiles(c,p.x,p.y,r),'Illegal site anchor/member');
}
export function reachableSiteTiles(c,entrance) {
  const key=(x,y)=>y*c.width+x, queue=[[Math.floor(entrance.x/c.tileSize),Math.floor(entrance.y/c.tileSize)]],seen=new Set();
  for(let i=0;i<queue.length;i++) { const [x,y]=queue[i],k=key(x,y);
    if(x<0||y<0||x>=c.width||y>=c.height||seen.has(k)||collidesWithTiles(c,(x+.5)*c.tileSize,(y+.5)*c.tileSize,10))continue;
    seen.add(k); queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  return seen;
}
export function validateSiteInteriors(m,overworldCollision=null) {
  if(!m.siteInteriors)return;
  requireContract(Array.isArray(m.siteInteriors)&&m.siteInteriors.length===1,'D2 interior budget');
  const allIds=new Set(m.population?.groups.flatMap(g=>[g.groupId,...g.members.map(a=>a.entityId)])??[]);
  for(const d of m.siteInteriors) {
    closedRecord(d,['recipeVersion','siteId','logicalSpaceId','contentHash','collision','entrance','returnAnchor','rooms','groups','decorations','progressionPower']);
    requireContract(d.recipeVersion===SITE_RECIPE_VERSION&&d.progressionPower===BASELINE_PROGRESSION_POWER,'Unknown site recipe/progression');
    const site=m.sites.find(s=>s.locationId===d.siteId);requireContract(site,'Unknown interior site');validateId('spaceId',d.logicalSpaceId);validateHex(d.contentHash,32);
    requireContract(d.logicalSpaceId!==m.logicalSpaceId&&!m.chunks.some(c=>c.chunkId===d.logicalSpaceId),'Site logical identity collision');
    const c=d.collision;closedRecord(c,['tileSize','width','height','tiles']);requireContract(c.tileSize===32,'Site tile scale');safeInteger(c.width,24,64);safeInteger(c.height,24,64);
    requireContract(c.tiles.length===c.height&&c.tiles.every(row=>typeof row==='string'&&row.length===c.width&&/^[012]+$/.test(row)),'Site collision rows');
    requireContract(c.tiles[0].split('').every(t=>t!=='1')&&c.tiles.at(-1).split('').every(t=>t!=='1')&&c.tiles.every(r=>r[0]!=='1'&&r.at(-1)!=='1'),'Unbounded site perimeter');
    point(d.entrance,c);closedRecord(d.returnAnchor,['x','y']);
    requireContract(Math.hypot(d.returnAnchor.x-site.position.x,d.returnAnchor.y-site.position.y)<=SITE_INTERACTION_RADIUS,'Return anchor detached from semantic entrance');
    if(overworldCollision)point(d.returnAnchor,overworldCollision);
    else {safeInteger(d.returnAnchor.x);safeInteger(d.returnAnchor.y);}
    const reached=reachableSiteTiles(c,d.entrance),reaches=p=>reached.has(Math.floor(p.y/32)*c.width+Math.floor(p.x/32));
    requireContract(c.tiles.reduce((n,row)=>n+[...row].filter(t=>t==='1').length,0)===reached.size,'Disconnected site floor');
    requireContract(d.rooms.length===4&&d.rooms.filter(r=>r.role==='arrival').length===1,'Site room budget/arrival');
    const roomIds=new Set();for(const r of d.rooms) {closedRecord(r,['roomId','role','x','y','width','height']);
      requireContract(typeof r.roomId==='string'&&!roomIds.has(r.roomId)&&['arrival','encounter'].includes(r.role),'Invalid site room');roomIds.add(r.roomId);
      safeInteger(r.x,1,c.width-2);safeInteger(r.y,1,c.height-2);safeInteger(r.width,7,13);safeInteger(r.height,7,13);
      for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++)requireContract(c.tiles[y]?.[x]==='1'&&reaches({x:x*32+16,y:y*32+16}),'Invalid/unreachable room');
    }
    const arrival=d.rooms.find(r=>r.role==='arrival');requireContract(d.entrance.x>arrival.x*32&&d.entrance.x<(arrival.x+arrival.width)*32&&d.entrance.y>arrival.y*32&&d.entrance.y<(arrival.y+arrival.height)*32,'Entrance outside arrival room');
    requireContract(d.groups.length===3,'Site encounter budget');const occupiedRooms=new Set(),placements=[];
    for(const g of d.groups) {closedRecord(g,['groupId','roomId','required','members']);
      const room=d.rooms.find(r=>r.roomId===g.roomId);requireContract(room?.role==='encounter'&&!occupiedRooms.has(g.roomId)&&g.required===true,'Required encounter room binding');occupiedRooms.add(g.roomId);
      requireContract(g.groupId.startsWith('site:'+d.siteId+':')&&!allIds.has(g.groupId)&&g.members.length===2,'Site group identity/capacity');allIds.add(g.groupId);
      for(const a of g.members) {closedRecord(a,['entityId','enemyDefinitionId','profileId','position']);validateId('entityId',a.entityId);requireContract(!allIds.has(a.entityId),'Site actor collision');allIds.add(a.entityId);
        const enemy=ORDINARY_ENEMIES.find(e=>e.enemyDefinitionId===a.enemyDefinitionId);requireContract(enemy&&a.profileId===resolveOrdinaryProfile(enemy,site.siteTier).contentDefinitionId,'Site threat must use site tier');
        point(a.position,c);requireContract(reaches(a.position)&&Math.hypot(a.position.x-d.entrance.x,a.position.y-d.entrance.y)>320,'Unsafe/unreachable site population');
        requireContract(placements.every(p=>Math.hypot(p.x-a.position.x,p.y-a.position.y)>=24),'Overlapping site placements');placements.push(a.position);
        requireContract(a.position.x>room.x*32&&a.position.x<(room.x+room.width)*32&&a.position.y>room.y*32&&a.position.y<(room.y+room.height)*32,'Site member outside assigned room');
      }
    }
    requireContract(d.decorations.length<=8,'Site decoration budget');for(const p of d.decorations) {closedRecord(p,['kind','x','y']);safeInteger(p.x,1,c.width-2);safeInteger(p.y,1,c.height-2);requireContract(p.kind==='sconce'&&c.tiles[p.y][p.x]==='0'&&c.tiles[p.y+1][p.x]==='1','Invalid sconce');}
  }
}
export function validateSiteState(s,m) {
  if(!m.siteInteriors){requireContract(s.campaign.sitesById===undefined,'Legacy campaign cannot acquire interior state');return;}
  const records=s.campaign.sitesById;requireContract(records&&same(Object.keys(records).sort(),m.siteInteriors.map(d=>d.siteId).sort()),'Site state inventory');
  for(const d of m.siteInteriors){const r=records[d.siteId];closedRecord(r,['spaceInstanceId','conqueredTick']);
    requireContract(r.spaceInstanceId===siteInstanceId(s.campaign.campaignId,d.siteId)&&r.spaceInstanceId!==s.overworldInstanceId,'Site instance binding');
    const space=s.spacesByInstanceId[r.spaceInstanceId];requireContract(space?.spaceId===d.logicalSpaceId&&same(space.collision,d.collision),'Stored site geometry mismatch');
    const cleared=d.groups.every(g=>s.groupsById[g.groupId]?.cleared);requireContract(s.encounterEconomy?(!cleared||r.conqueredTick!==null):cleared===(r.conqueredTick!==null),'Site conquest/group mismatch');if(r.conqueredTick!==null)safeInteger(r.conqueredTick,0,s.tick);
    for(const g of d.groups){const live=s.groupsById[g.groupId];requireContract(live?.siteId===d.siteId&&live.spaceInstanceId===r.spaceInstanceId&&same(live.entityIds,g.members.map(a=>a.entityId)),'Site group binding');
      for(const a of g.members)requireContract(s.entitiesById[a.entityId]?.contentDefinitionId===a.profileId&&ORDINARY_ACQUIRE_RANGES.includes(s.entitiesById[a.entityId].ai?.acquireRange),'Site actor profile mismatch');}
  }
}
export function siteTransitionTarget(s,m,actor,payload) {
  if(s.d9World?.settlementInterior?.siteId===payload.siteId)return campaignTavernTarget(s,actor,payload);
  if(s.d9World&&/^site:[a-f0-9]{32}$/.test(payload.siteId))return functionalSiteTransitionTargetD9(s,actor,payload);
  if(payload.direction==='extract')return null;
  const d=m.siteInteriors?.find(d=>d.siteId===payload.siteId),record=s.campaign.sitesById?.[payload.siteId];if(!d||!record||!actor.alive||s.primary.actorsById[actor.entityId]?.current)return null;
  const entering=payload.direction==='enter',source=entering?s.overworldInstanceId:record.spaceInstanceId;
  const anchor=entering?m.sites.find(site=>site.locationId===d.siteId).position:d.entrance;
  if(actor.residency.spaceInstanceId!==source||Math.hypot(actor.position.x-anchor.x,actor.position.y-anchor.y)>SITE_INTERACTION_RADIUS)return null;
  // A wall cannot make an interaction accessible through it.
  const c=s.spacesByInstanceId[source].collision,steps=Math.ceil(Math.hypot(actor.position.x-anchor.x,actor.position.y-anchor.y)/4);
  for(let n=0;n<=steps;n++){const f=steps?n/steps:0;if(collidesWithTiles(c,actor.position.x+(anchor.x-actor.position.x)*f,actor.position.y+(anchor.y-actor.position.y)*f,actor.hullRadius))return null;}
  return {spaceInstanceId:entering?record.spaceInstanceId:s.overworldInstanceId,position:entering?d.entrance:d.returnAnchor};
}
