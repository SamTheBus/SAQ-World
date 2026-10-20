import {freezeWire,requireContract as check} from '../contracts/wire.js';

export const CREATURE_PRESENTATION_D11_1_VERSION='world-creature-presentation-d11.1-v1';

const row=(family,values)=>({
 version:CREATURE_PRESENTATION_D11_1_VERSION,
 family,
 painterFrame:{...values.painterFrame},
 visualScale:values.visualScale,
 drawOffset:{x:values.drawOffset.x,y:values.drawOffset.y},
 visualBounds:{...values.visualBounds},
 groundAnchor:{x:values.groundAnchor.x,y:values.groundAnchor.y},
 contactShadow:{...values.contactShadow},
 labels:{...values.labels},
 effectBounds:{...values.effectBounds},
 paletteKey:values.paletteKey
});

// Final bounds are measured in World pixels after scale and offset. They are
// presentation contracts only; collision and combat continue to use profiles.
export const CREATURE_PRESENTATIONS_D11_1=freezeWire([
 row('sprout',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:1,drawOffset:{x:0,y:0},visualBounds:{x:-14,y:-25,width:28,height:27},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:10,ry:3,alpha:.22},labels:{healthBarY:-33,levelLabelY:-38},effectBounds:{x:-16,y:-28,width:32,height:32},paletteKey:'woodland-natural'}),
 row('golem',{painterFrame:{x:-13,y:-26,width:26,height:26},visualScale:.7,drawOffset:{x:0,y:0},visualBounds:{x:-18,y:-24,width:36,height:37},groundAnchor:{x:0,y:5.4},contactShadow:{x:0,y:3,rx:13,ry:3.5,alpha:.25},labels:{healthBarY:-31,levelLabelY:-37},effectBounds:{x:-20,y:-27,width:40,height:43},paletteKey:'woodland-stone'}),
 row('slime',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:1,drawOffset:{x:0,y:0},visualBounds:{x:-14,y:-24,width:28,height:27},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.2},labels:{healthBarY:-32,levelLabelY:-38},effectBounds:{x:-16,y:-27,width:32,height:32},paletteKey:'woodland-natural'}),
 row('gargoyle',{painterFrame:{x:-14,y:-26,width:28,height:26},visualScale:.82,drawOffset:{x:0,y:0},visualBounds:{x:-21,y:-27,width:42,height:35},groundAnchor:{x:0,y:4.95},contactShadow:{x:0,y:2,rx:13,ry:3.5,alpha:.28},labels:{healthBarY:-34,levelLabelY:-40},effectBounds:{x:-24,y:-31,width:48,height:42},paletteKey:'ruin-weathered-stone'}),
 row('rust_nibbler',{painterFrame:{x:-14,y:-24,width:28,height:24},visualScale:.68,drawOffset:{x:-1,y:0},visualBounds:{x:-19,y:-14,width:38,height:18},groundAnchor:{x:0,y:4.05},contactShadow:{x:-1,y:2,rx:10,ry:2.5,alpha:.27},labels:{healthBarY:-23,levelLabelY:-29},effectBounds:{x:-22,y:-18,width:44,height:25},paletteKey:'cave-rust'}),
 row('animated_armor',{painterFrame:{x:-14,y:-26,width:28,height:26},visualScale:.76,drawOffset:{x:0,y:0},visualBounds:{x:-20,y:-28,width:40,height:34},groundAnchor:{x:0,y:5.4},contactShadow:{x:0,y:2,rx:13,ry:3.5,alpha:.3},labels:{healthBarY:-35,levelLabelY:-41},effectBounds:{x:-23,y:-33,width:46,height:42},paletteKey:'fort-weathered-iron'}),
 row('cursed_blade',{painterFrame:{x:-13,y:-25,width:26,height:25},visualScale:.78,drawOffset:{x:0,y:-1},visualBounds:{x:-24,y:-27,width:48,height:48},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:10,ry:2.5,alpha:.25},labels:{healthBarY:-34,levelLabelY:-40},effectBounds:{x:-26,y:-30,width:52,height:53},paletteKey:'ruin-haunted-iron'}),
 row('thorn_wyrm',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.82,drawOffset:{x:0,y:0},visualBounds:{x:-16,y:-27,width:46,height:34},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-33,levelLabelY:-39},effectBounds:{x:-20,y:-31,width:54,height:42},paletteKey:'woodland-thorn'}),
 row('wyrmling',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.7,drawOffset:{x:0,y:0},visualBounds:{x:-16,y:-33,width:46,height:43},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-39,levelLabelY:-45},effectBounds:{x:-20,y:-37,width:54,height:51},paletteKey:'mountain-frost'}),
 row('magma_elemental',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.74,drawOffset:{x:0,y:0},visualBounds:{x:-23,y:-35,width:46,height:46},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-41,levelLabelY:-47},effectBounds:{x:-27,y:-39,width:54,height:54},paletteKey:'inferno-magma'}),
 row('lava_serpent',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.78,drawOffset:{x:0,y:0},visualBounds:{x:-15,y:-23,width:43,height:31},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-29,levelLabelY:-35},effectBounds:{x:-19,y:-27,width:51,height:39},paletteKey:'inferno-lava'}),
 row('hell_bat',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.78,drawOffset:{x:0,y:0},visualBounds:{x:-21,y:-33,width:42,height:40},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-39,levelLabelY:-45},effectBounds:{x:-25,y:-37,width:50,height:48},paletteKey:'inferno-bat'}),
 row('slag_slime',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.75,drawOffset:{x:0,y:0},visualBounds:{x:-19,y:-27,width:38,height:36},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-33,levelLabelY:-39},effectBounds:{x:-23,y:-31,width:46,height:44},paletteKey:'inferno-slag'}),
 row('swamp_basilisk',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.78,drawOffset:{x:0,y:0},visualBounds:{x:-15,y:-24,width:43,height:33},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-30,levelLabelY:-36},effectBounds:{x:-19,y:-28,width:51,height:41},paletteKey:'swamp-basilisk'}),
 row('toxic_fly',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.8,drawOffset:{x:0,y:0},visualBounds:{x:-19,y:-37,width:38,height:47},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-43,levelLabelY:-49},effectBounds:{x:-23,y:-41,width:46,height:55},paletteKey:'swamp-toxic'}),
 row('marsh_ghost',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.78,drawOffset:{x:0,y:0},visualBounds:{x:-18,y:-32,width:36,height:47},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-38,levelLabelY:-44},effectBounds:{x:-22,y:-36,width:44,height:55},paletteKey:'swamp-phantom'}),
 row('corroded_golem',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.7,drawOffset:{x:0,y:0},visualBounds:{x:-20,y:-31,width:40,height:44},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-37,levelLabelY:-43},effectBounds:{x:-24,y:-35,width:48,height:52},paletteKey:'swamp-corroded'}),
 row('void_orb',{painterFrame:{x:-12,y:-24,width:24,height:24},visualScale:0.75,drawOffset:{x:0,y:0},visualBounds:{x:-21,y:-33,width:42,height:47},groundAnchor:{x:0,y:4.5},contactShadow:{x:0,y:2,rx:11,ry:3,alpha:.24},labels:{healthBarY:-39,levelLabelY:-45},effectBounds:{x:-25,y:-37,width:50,height:55},paletteKey:'void-singularity'})
]);

for(const profile of CREATURE_PRESENTATIONS_D11_1){
 check(Number.isFinite(profile.visualScale)&&profile.visualScale>0&&profile.visualScale<=1.25,'Creature visual scale');
 for(const group of ['painterFrame','drawOffset','visualBounds','groundAnchor','contactShadow','labels','effectBounds'])for(const value of Object.values(profile[group]))check(Number.isFinite(value),'Creature presentation metric');
 check(profile.visualBounds.width>0&&profile.visualBounds.height>0&&profile.effectBounds.width>=profile.visualBounds.width&&profile.effectBounds.height>=profile.visualBounds.height,'Creature presentation bounds');
}

export const creaturePresentationD11_1=family=>CREATURE_PRESENTATIONS_D11_1.find(row=>row.family===family)??null;
