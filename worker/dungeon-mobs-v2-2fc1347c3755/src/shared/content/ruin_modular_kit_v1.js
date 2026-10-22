import {freezeWire} from '../contracts/wire.js';
export const RUIN_MODULAR_VERSION='ruin-modular-scene-v1';
// Ports in source-pixel space, anchored at an authoritative tile center. One
// uniform scale per module; no independent axis scaling or silhouette clipping.
export const RUIN_MODULES=freezeWire({
 'straight-a':{sheet:'modular',crop:[44,232,323,177],origin:[34,153],scale:96/256,ports:{west:[0,0],east:[96,0]},cells:[[0,0],[1,0],[2,0],[3,0]]},
 'straight-b':{sheet:'modular',crop:[422,233,330,177],origin:[34,152],scale:96/269,ports:{west:[0,0],east:[96,0]},cells:[[0,0],[1,0],[2,0],[3,0]]},
 'end-cap':{sheet:'modular',crop:[1176,211,321,200],origin:[34,179],scale:.30,ports:{west:[0,0]},cells:[[0,0],[1,0],[2,0]]},
 'broken-end':{sheet:'modular',crop:[45,650,329,195],origin:[34,171],scale:.27,ports:{west:[0,0]},cells:[[0,0],[2,0]],clearCells:[[1,0]]},
 'collapsed':{sheet:'modular',crop:[421,658,328,190],origin:[34,163],scale:.27,ports:{west:[0,0]},cells:[[0,0],[1,0],[2,0]]},
 'door-collar':{sheet:'modular',crop:[792,583,313,276],origin:[34,244],scale:96/220,ports:{west:[0,0],east:[96,0]},cells:[[0,0],[1,0],[2,0],[3,0]]},
 'foundation':{sheet:'modular',crop:[1159,737,341,114],origin:[170,87],scale:.23,ports:{},cells:[]},
 'north-south':{sheet:'vertical',crop:[367,41,181,641],origin:[69,78],scale:96/492,visualOffset:[0,96-338*96/353],ports:{north:[0,0],south:[0,96]},cells:[[0,0],[0,1],[0,2],[0,3]]},
 'corner':{sheet:'vertical',crop:[858,102,478,497],origin:[82,464],scale:96/353,ports:{north:[0,-338*96/353],east:[96,0]},cells:[[0,-3],[0,-2],[0,-1],[0,0],[1,0],[2,0],[3,0]]},
 'broken-north-south':{sheet:'vertical',crop:[1642,73,218,587],origin:[67,78],scale:.17,ports:{north:[0,0]},cells:[[0,0],[0,1],[0,2]]}
});
export const ruinModulePose=(id,x,y)=>{const p=RUIN_MODULES[id];if(!p)throw Error('Unknown ruin module '+id);return freezeWire({id,x,y,ports:Object.fromEntries(Object.entries(p.ports).map(([name,[dx,dy]])=>[name,{x:x*32+16+dx+(p.visualOffset?.[0]??0),y:y*32+16+dy+(p.visualOffset?.[1]??0)}])),cells:p.cells.map(([dx,dy])=>({x:x+dx,y:y+dy})),clearCells:(p.clearCells??[]).map(([dx,dy])=>({x:x+dx,y:y+dy}))});};
