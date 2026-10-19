import { siteInstanceId } from './site_interiors.js';
import { createClientFixture } from './client_fixture.js';
import { createId } from './identities.js';
import { createActivityState, upgradeActivityState, ACTIVITY_FORMAT } from './activity_state.js';
import { copyWire, requireContract } from './wire.js';
import { WORLD1C_GREEN_SLIME_PROFILE } from '../content/index.js';
import { ORDINARY_ACQUIRE_RANGE } from '../content/ordinary_enemies.js';
import { manifestForState, isWorldPointSafe, areaAtWorldPosition } from './overworld.js';
import { collidesWithTiles } from '../rules/world_geometry.js';
import {progressionAtXp} from './player_progression.js';
import {resolvePlayerStats} from './player_stats.js';
import {updateHighestHeroLevel} from './participant_progression.js';
export function freePoint(collision,desired,radius=10,allowed=()=>true){let best=null,distance=Infinity;
  for(let y=0;y<collision.height;y++)for(let x=0;x<collision.width;x++){const p={x:(x+.5)*collision.tileSize,y:(y+.5)*collision.tileSize},d=Math.hypot(p.x-desired.x,p.y-desired.y);
    if(d<distance&&!collidesWithTiles(collision,p.x,p.y,radius)&&allowed(p)){best=p;distance=d;}}
  requireContract(best,'No valid fixture placement');return best;}
export function proofAnchors(state){const c=state.spacesByInstanceId[state.overworldInstanceId].collision,m=manifestForState(state),points=[copyWire(m.start.position)];
  for(let n=1;n<4;n++){let best=null,score=-1;for(let y=1;y<c.height;y+=3)for(let x=1;x<c.width;x+=3){const p={x:(x+.5)*c.tileSize,y:(y+.5)*c.tileSize};if(collidesWithTiles(c,p.x,p.y,10)||!areaAtWorldPosition(m,p))continue;
    const d=Math.min(...points.map(q=>Math.hypot(p.x-q.x,p.y-q.y)));if(d>score){score=d;best=p;}}
    requireContract(best,'Missing split proof anchor');points.push(best);}return points;}
export async function createActivityFixture({sha256,nextToken,campaignSeed,proofCase='A',hostilesPerGroup=6,populationEnabled=false,sitesEnabled=false}){
  requireContract(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].includes(proofCase)&&Number.isInteger(hostilesPerGroup)&&hostilesPerGroup>=1&&hostilesPerGroup<=10,'Invalid activity fixture');
  const standardWorld=['A','F','G','H','I','J','K','L','M','N','O'].includes(proofCase),legacy=await createClientFixture({sha256,nextToken,campaignSeed,scenario:'procedural',populationEnabled,sitesEnabled,manualPrimary:true,playerCount:['H','I','J','K','L','M','N','O'].includes(proofCase)?2:standardWorld?1:4}),old=copyWire(legacy.initialState);
  delete old.campaign.encounterProof;
  const {spaceInstanceId,spaceId,spaceRevision,collision}=old.space,entitiesById=old.space.entitiesById;
  for(const a of Object.values(entitiesById))a.residency={spaceInstanceId,residencyRevision:1};
  const state={format:ACTIVITY_FORMAT,protocolVersion:1,ticksPerSecond:60,tick:0,content:old.content,campaign:old.campaign,session:old.session,playersById:old.playersById,
    spacesByInstanceId:{[spaceInstanceId]:{spaceInstanceId,spaceId,spaceRevision,collision}},entitiesById,groupsById:{},primary:old.primary,eventEmission:{lastEventSequence:0},appliedCommandsById:{},appliedClientSequences:Object.fromEntries(old.session.playerIds.map(id=>[id,0])),lastAppliedAuthorityOrder:0,identitySequence:0,residencyHistoryByEntityId:Object.fromEntries(Object.values(old.playersById).map(p=>[p.entityId,{'1':{spaceInstanceId,spaceRevision:1,residencyRevision:1,tick:0,afterEventSequence:0,afterAuthorityOrder:0,endTick:null,endEventSequence:null,endAuthorityOrder:null}}])),primaryContextsById:{},overworldInstanceId:spaceInstanceId,proofCase};
  const m=manifestForState(state),anchors=proofAnchors(state);
  if(!standardWorld){const second=createId('spaceInstanceId',nextToken('spaceInstanceId'));state.spacesByInstanceId[second]={spaceInstanceId:second,spaceId:createId('spaceId',nextToken('spaceId')),spaceRevision:1,collision:{tileSize:32,width:32,height:32,tiles:Array.from({length:32},(_,i)=>i===0||i===31?'0'.repeat(32):'0'+'1'.repeat(30)+'0')}};}
  const groupPoints=standardWorld?[m.sites.find(s=>s.artifactEligible!==false)?.position??m.sites[0].position]:anchors;
  for(let n=0;n<(populationEnabled?0:groupPoints.length);n++){
    const point=groupPoints[n],site=m.sites[n%m.sites.length],groupId=`ordinary:${site.locationId}:${n}`,entityIds=[];
    const p=WORLD1C_GREEN_SLIME_PROFILE;
    for(let j=0;j<(standardWorld?1:hostilesPerGroup);j++){const entityId=createId('entityId',nextToken('entityId'));entityIds.push(entityId);
      const position=freePoint(collision,{x:point.x+180+(j%3)*28,y:point.y+Math.floor(j/3)*28},p.hullRadius,q=>!isWorldPointSafe(m,q)&&areaAtWorldPosition(m,q)&&(proofCase==='A'||Math.hypot(q.x-point.x,q.y-point.y)>=180)&&!entityIds.slice(0,-1).some(id=>Math.hypot(entitiesById[id].position.x-q.x,entitiesById[id].position.y-q.y)<24));
      entitiesById[entityId]={entityId,contentDefinitionId:p.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:p.team,hp:copyWire(p.maxHp),maxHp:copyWire(p.maxHp),position,
        hullRadius:p.hullRadius,combatRadius:p.combatRadius,movementIntent:{x:0,y:0},moveSpeed:p.moveSpeed,alive:true,attackDamage:copyWire(p.attackDamage),attackReach:p.attackReach,attackReachMode:p.attackReachMode,
        attackDelayTicks:p.attackDelayTicks,attackTimer:p.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:{kind:'simpleMelee',acquireRange:128,updatesApplied:0},residency:{spaceInstanceId,residencyRevision:1}};}
    state.groupsById[groupId]={groupId,siteId:site.locationId,spaceInstanceId,entityIds,cleared:false,lastRequiredTick:null};}
  if(populationEnabled)for(const g of m.population.groups){
    const entityIds=[];for(const member of g.members){const p=state.content.definitionsById[member.profileId],entityId=member.entityId;entityIds.push(entityId);
      entitiesById[entityId]={entityId,contentDefinitionId:p.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:p.team,hp:copyWire(p.maxHp),maxHp:copyWire(p.maxHp),position:copyWire(member.position),
        hullRadius:p.hullRadius,combatRadius:p.combatRadius,movementIntent:{x:0,y:0},moveSpeed:p.moveSpeed,alive:true,attackDamage:copyWire(p.attackDamage),attackReach:p.attackReach,attackReachMode:p.attackReachMode,
        attackDelayTicks:p.attackDelayTicks,attackTimer:p.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:{kind:'simpleMelee',acquireRange:ORDINARY_ACQUIRE_RANGE,updatesApplied:0},residency:{spaceInstanceId,residencyRevision:1}};
    }
    state.groupsById[g.groupId]={groupId:g.groupId,siteId:null,regionId:g.regionId,spaceInstanceId,entityIds,cleared:false,lastRequiredTick:null};
  }
  if(m.siteInteriors){state.campaign.sitesById={};
    for(const d of m.siteInteriors){const instance=siteInstanceId(state.campaign.campaignId,d.siteId);
      requireContract(!state.spacesByInstanceId[instance],'Site instance collision');
      state.spacesByInstanceId[instance]={spaceId:d.logicalSpaceId,spaceInstanceId:instance,spaceRevision:1,collision:copyWire(d.collision)};
      state.campaign.sitesById[d.siteId]={spaceInstanceId:instance,conqueredTick:null};
      for(const g of d.groups){const entityIds=[];for(const member of g.members){const p=state.content.definitionsById[member.profileId],entityId=member.entityId;entityIds.push(entityId);
        requireContract(!entitiesById[entityId],'Site entity collision');
        entitiesById[entityId]={entityId,contentDefinitionId:p.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:p.team,hp:copyWire(p.maxHp),maxHp:copyWire(p.maxHp),position:copyWire(member.position),
          hullRadius:p.hullRadius,combatRadius:p.combatRadius,movementIntent:{x:0,y:0},moveSpeed:p.moveSpeed,alive:true,attackDamage:copyWire(p.attackDamage),attackReach:p.attackReach,attackReachMode:p.attackReachMode,
          attackDelayTicks:p.attackDelayTicks,attackTimer:p.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:{kind:'simpleMelee',acquireRange:ORDINARY_ACQUIRE_RANGE,updatesApplied:0},residency:{spaceInstanceId:instance,residencyRevision:1}};
      }
      state.groupsById[g.groupId]={groupId:g.groupId,siteId:d.siteId,spaceInstanceId:instance,entityIds,cleared:false,lastRequiredTick:null};}
    }
  }
  if(!standardWorld){const ids=Object.values(state.playersById).map(p=>p.entityId),second=Object.keys(state.spacesByInstanceId).find(id=>id!==spaceInstanceId);
    ids.forEach((id,i)=>{const a=state.entitiesById[id],index=proofCase==='C'?Math.floor(i/2):proofCase==='D'?i:0;
      a.position=freePoint(collision,{x:anchors[index].x+(i%2)*24,y:anchors[index].y+Math.floor(i/2)*24},a.hullRadius);
      if(proofCase==='E'&&i>=2){a.residency.spaceInstanceId=second;a.position={x:400+(i-2)*24,y:400};}});}
  for(const p of Object.values(state.playersById))state.residencyHistoryByEntityId[p.entityId]['1'].spaceInstanceId=entitiesById[p.entityId].residency.spaceInstanceId;
  const upgraded=copyWire(upgradeActivityState(state));
  // Case L starts at the normal Level 2 provision threshold so a reviewer can
  // claim and swap among Shield, Dagger, and Tome without changing production.
  if(proofCase==='L')for(const player of Object.values(upgraded.playersById)){player.progression=copyWire(progressionAtXp(100,player.d8));player.d8=updateHighestHeroLevel(player.d8,player.progression.level);const profile=resolvePlayerStats(player),actor=upgraded.entitiesById[player.entityId];actor.hp=copyWire(profile.maxHp);actor.maxHp=copyWire(profile.maxHp);actor.attackDamage=copyWire(profile.attack);}
  return {initialState:createActivityState(upgraded),localPlayerId:legacy.localPlayerId,generationDiagnostics:legacy.generationDiagnostics};
}
