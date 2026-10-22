import {freezeWire,requireContract as check} from '../contracts/wire.js';

export const WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION='woodland-cave-modules-d12-1-v1';

const roomMask=(kind)=>{
 const masks={
  small:['001111100','011111110','111111111','111111111','111111111','111111111','111111111','011111110','001111100'],
  large:['011111110','111111111','111111111','111111111','111111111','111111111','111111111','111111111','011111110'],
  branch:['000111000','011111110','111111111','111111111','111111111','111111111','111111111','011111110','000111000']
 };
 return masks[kind];
};
const sockets=freezeWire([
 {socketId:'north',direction:'north',x:4,y:0,width:3},
 {socketId:'east',direction:'east',x:8,y:4,width:3},
 {socketId:'south',direction:'south',x:4,y:8,width:3},
 {socketId:'west',direction:'west',x:0,y:4,width:3}
]);
const anchors=freezeWire({
 entrance:[{x:4,y:6}],exit:[{x:4,y:2}],
 decorations:[{x:2,y:2},{x:6,y:2},{x:2,y:6},{x:6,y:6}],
 encounters:[{x:3,y:4},{x:6,y:4},{x:4,y:2},{x:4,y:6}]
});
const zones=freezeWire([
 {kind:'socket-clearance',x:3,y:0,width:3,height:9},
 {kind:'socket-clearance',x:0,y:3,width:9,height:3}
]);
const clone=value=>JSON.parse(JSON.stringify(value));
const chamber=(moduleId,role,mask='small')=>freezeWire({
 moduleId,role,dimensions:{width:9,height:9},terrainMask:roomMask(mask),collisionMask:roomMask(mask),
 sockets:clone(sockets),anchors:clone(anchors),reservedZones:clone(zones),permittedRotations:[0,90,180,270],permittedReflections:['none','horizontal'],minimumActorClearanceTiles:3
});
const tunnel=(moduleId,role,mask,connections)=>freezeWire({
 moduleId,role,dimensions:{width:mask[0].length,height:mask.length},terrainMask:[...mask],collisionMask:[...mask],
 sockets:connections,anchors:{entrance:[],exit:[],decorations:[],encounters:[]},reservedZones:[],
 permittedRotations:[0,90,180,270],permittedReflections:['none','horizontal'],minimumActorClearanceTiles:3
});

export const WOODLAND_CAVE_MODULES_D12_1=freezeWire([
 chamber('arrival-chamber','arrival','branch'),
 chamber('small-encounter-chamber','small-encounter','small'),
 chamber('large-encounter-chamber','large-encounter','large'),
 tunnel('straight-tunnel','straight-tunnel',['111111','111111','111111'],[
  {socketId:'west',direction:'west',x:0,y:1,width:3},{socketId:'east',direction:'east',x:5,y:1,width:3}
 ]),
 tunnel('turning-tunnel','turning-tunnel',['11100','11100','11111','00111','00111'],[
  {socketId:'west',direction:'west',x:0,y:1,width:3},{socketId:'south',direction:'south',x:3,y:4,width:3}
 ]),
 chamber('junction-chamber','junction','large'),
 tunnel('loop-connector','loop-connector',['111111','111111','111111'],[
  {socketId:'west',direction:'west',x:0,y:1,width:3},{socketId:'east',direction:'east',x:5,y:1,width:3}
 ]),
 chamber('reward-dead-end','reward-dead-end','branch'),
 chamber('stairs-up-chamber','stairs-up','branch'),
 chamber('stairs-down-chamber','stairs-down','branch'),
 chamber('final-reward-chamber','final-reward','large')
]);

export const WOODLAND_CAVE_MODULES_BY_ID_D12_1=Object.freeze(Object.fromEntries(WOODLAND_CAVE_MODULES_D12_1.map(module=>[module.moduleId,module])));

export function validateWoodlandCaveModuleCatalogD12_1(){
 const roles=new Set(),ids=new Set();
 for(const module of WOODLAND_CAVE_MODULES_D12_1){
  check(!ids.has(module.moduleId)&&module.dimensions.width===module.collisionMask[0].length&&module.dimensions.height===module.collisionMask.length,'Invalid Cave module identity or dimensions');ids.add(module.moduleId);roles.add(module.role);
  check(module.collisionMask.every(row=>row.length===module.dimensions.width&&/^[01]+$/.test(row))&&module.terrainMask.length===module.dimensions.height,'Invalid Cave module mask');
  check(module.sockets.every(socket=>['north','east','south','west'].includes(socket.direction)&&socket.width>=module.minimumActorClearanceTiles),'Invalid Cave module socket');
  check(module.minimumActorClearanceTiles>=3&&module.permittedRotations.length>0&&module.permittedReflections.length>0,'Invalid Cave module clearance/transform');
 }
 for(const role of ['arrival','small-encounter','large-encounter','straight-tunnel','turning-tunnel','junction','loop-connector','reward-dead-end','stairs-up','stairs-down','final-reward'])check(roles.has(role),'Missing required Cave module role');
 return true;
}
