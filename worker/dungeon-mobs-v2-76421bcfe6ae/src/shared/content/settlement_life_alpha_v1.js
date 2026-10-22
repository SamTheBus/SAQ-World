import {freezeWire} from '../contracts/wire.js';
// Development population binding. Generic service rules do not inspect Alpha coordinates.
export const LIFE_VILLAGE_ID='settlement-slot:village-outpost:02';
export const LIFE_VILLAGE_ORIGIN=freezeWire({x:4480,y:7592});
export const LIFE_NPCS=freezeWire([
 {id:'civilian:alpha:town:mara',name:'Mara',role:'general',roleLabel:'General merchant',settlementId:'settlement-slot:town:05',buildingId:'town-open:roof:004',band:3,tile:{x:5912,y:5750},space:'exterior',color:'#567867'},
 {id:'civilian:alpha:town:bren',name:'Bren',role:'smith',roleLabel:'Smith',settlementId:'settlement-slot:town:05',buildingId:'town-open:roof:006',band:3,tile:{x:5870,y:5778},space:'exterior',color:'#82604b'},
 {id:'civilian:alpha:town:ada',name:'Ada',role:'innkeeper',roleLabel:'Innkeeper',settlementId:'settlement-slot:town:05',buildingId:'town-open:roof:008',band:3,tile:{x:9,y:6},space:'tavern-ground',color:'#876657'},
 {id:'civilian:alpha:village:ila',name:'Ila',role:'general',roleLabel:'General merchant',settlementId:LIFE_VILLAGE_ID,buildingId:'village:roof:002',band:2,tile:{x:4497,y:7610},space:'exterior',color:'#58766d'},
 {id:'civilian:alpha:village:oren',name:'Oren',role:'smith',roleLabel:'Smith',settlementId:LIFE_VILLAGE_ID,buildingId:'village:roof:003',band:2,tile:{x:4532,y:7607},space:'exterior',color:'#8d6c49'},
 {id:'civilian:alpha:village:nell',name:'Nell',role:'innkeeper',roleLabel:'Innkeeper · tavern veranda',settlementId:LIFE_VILLAGE_ID,buildingId:'village:roof:002',band:2,tile:{x:4499,y:7610},space:'exterior',color:'#81657a'}
]);
