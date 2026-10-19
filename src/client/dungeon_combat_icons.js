// Exact paths/colors from supplied Dungeon assets.js AssetCatalog.uiIcons.
export const DUNGEON_COMBAT_ICONS=Object.freeze({
 block:{color:'#3498db',path:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'},
 parry:{color:'#9b59b6',path:'M4 20L20 4M4 20L2 22M5 15L9 19M20 20L4 4M20 20L22 22M15 19L19 15'},
 critDamage:{color:'#e67e22',path:'M12 2l3 5.5 5.5-3-3 5.5 5.5 3-5.5 3 3 5.5-5.5-3-3 5.5-3-5.5-5.5 3 3-5.5-5.5-3 5.5-3-3-5.5 5.5 3z'},
 barrier:{color:'#9b59b6',path:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'}
});
let critPath;
export function drawDungeonCrit(ctx,x,y,size){critPath??=new Path2D(DUNGEON_COMBAT_ICONS.critDamage.path);ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/24,size/24);ctx.fillStyle='#e67e22';ctx.strokeStyle='#190f20';ctx.lineWidth=3;ctx.lineJoin='round';ctx.fill(critPath);ctx.stroke(critPath);ctx.restore();}
export function barrierSvg(){const a=DUNGEON_COMBAT_ICONS.barrier;return `<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="${a.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${a.path}"/></svg>`;}

const defensePaths=new Map();
export function drawDungeonDefense(ctx,kind,x,y,size=18){const icon=DUNGEON_COMBAT_ICONS[kind];if(!icon)return;let path=defensePaths.get(kind);if(!path){path=new Path2D(icon.path);defensePaths.set(kind,path);}ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/24,size/24);ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#150e20';ctx.lineWidth=5;ctx.stroke(path);ctx.strokeStyle=icon.color;ctx.lineWidth=2.3;ctx.stroke(path);if(kind==='block'){ctx.fillStyle='#25445a';ctx.fill(path);ctx.stroke(path);}ctx.restore();}
