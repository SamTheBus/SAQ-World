import {BIOME_CODES} from '../shared/generation/planned_world_foundation_v1.js';
import {createNaturalProtection} from '../shared/generation/natural_clusters_v1.js';
// Inspection locations only, never placement/asset-selection gates. Bounded
// candidate sampling against any already accepted plan supplied by the host.
export function naturalClusterReviewTargets(asset,generator){
 const protect=createNaturalProtection(asset),counts={},found={};
 for(const row of asset.cellRows)for(const c of row.cells){
  const code=BIOME_CODES[asset.biomeIds[c[2]-1].replace('biome:','')];if(found[code]||(counts[code]??0)>=96)continue;counts[code]=(counts[code]??0)+1;
  const x=c[0]*64+32,y=row.y*52+26;if(protect.at(x,y))continue;
  let tile=null,blocked=0;for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const b=generator.tile(x+dx,y+dy);if(b.naturalClusterId&&b.collision==='2')blocked++;if(!tile&&Math.abs(dx)<=3&&Math.abs(dy)<=3&&b.collision==='1'&&[[1,0],[-1,0],[0,1],[0,-1]].every(([a,b])=>generator.tile(x+dx+a,y+dy+b).collision==='1'))tile={x:x+dx,y:y+dy};}
  if(tile&&blocked>=12)found[code]={id:'natural:'+code,label:'Natural cluster review · '+code+' · inspection only',tile};
 }
 return Object.keys(found).sort().map(k=>found[k]);
}
