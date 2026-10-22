import {generateGear} from './generated_gear.js';
import {generateGear as legacyGenerateGear} from './generated_gear_v1.js';
import {prototypeRewardProgression} from './reward_progression.js';
import {copyWire,requireContract,canonicalStringify} from '../contracts/wire.js';
export function migrateGeneratedNouns(s){for(const p of Object.values(s.playersById)){const inv=p.inventory,terminal=new Set(Object.values(inv.d7?.salvaged??{}).map(r=>r.item.sourceEntityId));
 const fix=(container,id)=>{const g=container?.generated;if(!g||g.version!=='dungeon-gear-d7-v1'||terminal.has(id)||!['Plate Mail','Chain Mail','Full Plate Armor'].includes(g.definition.noun))return;
 requireContract(canonicalStringify(g)===canonicalStringify(legacyGenerateGear(g.seed,g.contentDepth)),'Invalid pre-migration generated gear');
 const rank=Object.values(inv.rewardsByEntityId).find(r=>r.sourceEntityId===id)?.episodeSource?.rank??['C','B','A','S'].find(r=>prototypeRewardProgression(r,id).sourceDepth===g.contentDepth);
 requireContract(rank,'Unknown historical prototype progression');const next=copyWire(generateGear(g.seed,prototypeRewardProgression(rank,id)));
 requireContract(canonicalStringify(next.affixes)===canonicalStringify(g.affixes)&&canonicalStringify(next.salvage)===canonicalStringify(g.salvage),'Migration rerolled gear');container.generated=next;};
 for(const item of Object.values(inv.itemsById))fix(item,item.sourceEntityId);
 for(const [id,ground] of Object.entries(inv.renewal?.groundBySourceId??{}))fix(ground.item,id);
 for(const [id,r] of Object.entries(inv.rewardsByEntityId))fix(r,id);
 }return s;}
