import {copyWire,freezeWire} from '../contracts/wire.js';
import {WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_TEMPLATE} from './woodland_ruin_d9.js';
import {WOODLAND_FORT_PACKAGE,WOODLAND_FORT_TEMPLATE} from './woodland_fort_d10.js';
import {WOODLAND_CAVE_PACKAGE,WOODLAND_CAVE_TEMPLATE} from './woodland_cave_d10.js';
import {buildDefinedFunctionalSiteD10,buildDefinedWorldCompoundD10} from './site_definition_runtime_d10.js';
import {SITE_CONTAINMENT_D11_2} from './encounter_motion_d11_2.js';

export const WOODLAND_RUIN_D11_VERSION='woodland-overgrown-ruin-d11.2-v1';
export const WOODLAND_RUIN_D11_3_VERSION='woodland-overgrown-ruin-d11.3-v1';
export const WOODLAND_RUIN_D11_3_1_VERSION='woodland-overgrown-ruin-d11.3.1-v1';
export const WOODLAND_RUIN_D11_3_2_VERSION='woodland-overgrown-ruin-d11.3.2-v1';
export const WOODLAND_FORT_D11_VERSION='woodland-fort-d11.2-v1';
export const WOODLAND_CAVE_D11_VERSION='woodland-cave-d11.2-v1';

const packageFor=(base,packageVersion,contentHash)=>freezeWire({...copyWire(base),packageVersion,contentHash});
const templateFor=(base,version,members)=>freezeWire({...copyWire(base),version,encounter:{...copyWire(base.encounter),members}});

export const WOODLAND_RUIN_D11_PACKAGE=packageFor(WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_D11_VERSION,'6cab2bbc36ece4cd13d9f486c005e8862e2c99da9482d0aaa0fd79d354904350');
export const WOODLAND_RUIN_D11_TEMPLATE=templateFor(WOODLAND_RUIN_TEMPLATE,WOODLAND_RUIN_D11_VERSION,[
 {family:'gargoyle',x:304,y:240},{family:'cursed_blade',x:464,y:240}
]);
export const WOODLAND_RUIN_D11_DEFINITION=freezeWire({package:WOODLAND_RUIN_D11_PACKAGE,template:WOODLAND_RUIN_D11_TEMPLATE,groupSuffix:'overgrown-court',containment:SITE_CONTAINMENT_D11_2.woodlandRuin});

// Fresh-campaign D11.3 presentation package. The stable socket/site identity is
// unchanged; the package version makes the revised collision and authored
// environment immutable and independently reproducible.
const RUIN_D11_3_ROWS=[
 '222222222222222222222222',
 '222200000000000000002222',
 '222001111111111111100222',
 '220011111111111111110022',
 '220111111111111111111022',
 '220111111111111111111022',
 '201111111111111111111102',
 '201111011111111110111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201101111111111111011102',
 '201111111111111111111102',
 '220111111111111111111022',
 '220011111111111111110022',
 '222011111111111111110222',
 '222201111111111111102222',
 '222220000011110000022222',
 '222222200011110002222222',
 '222222222011110222222222',
 '222222222222222222222222'
];
const RUIN_D11_3_DECORATIONS=[
 {kind:'ruin-light-shaft',x:11.9,y:2.8,variant:0},
 {kind:'sconce',x:5.2,y:5.1,variant:0},{kind:'sconce',x:18.7,y:5.1,variant:1},
 {kind:'ruin-broken-pillar',x:6.5,y:7.6,variant:0},{kind:'ruin-broken-pillar',x:17.5,y:7.6,variant:1},
 {kind:'ruin-collapsed-masonry',x:4.5,y:12.7,variant:0},{kind:'ruin-collapsed-masonry',x:19.1,y:12.4,variant:1},
 {kind:'ruin-weapon-shrine',x:12,y:4.6,variant:0},{kind:'ruin-gargoyle-perch',x:8.1,y:4.4,variant:0},
 {kind:'ruin-wall-roots',x:3.7,y:8.6,variant:0},{kind:'ruin-wall-vines',x:20.1,y:7.1,variant:1},
 {kind:'ruin-rubble-flat',x:8.8,y:13.2,variant:0},{kind:'ruin-rubble-flat',x:15.8,y:11.8,variant:1},
 {kind:'ruin-moss-patch',x:7.2,y:10.7,variant:0},{kind:'ruin-moss-patch',x:16.6,y:8.9,variant:1},
 {kind:'ruin-reward-alcove',x:18,y:4.5,variant:0},{kind:'ruin-threshold-weeds',x:12,y:17.2,variant:0}
];
export const WOODLAND_RUIN_D11_3_PACKAGE=packageFor(WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_D11_3_VERSION,'b975d1f335b63f69fa6c6e8a3f5ea2bf5c07f0fb57a7365386c13597b46addc9');
export const WOODLAND_RUIN_D11_3_TEMPLATE=freezeWire({
 ...copyWire(WOODLAND_RUIN_TEMPLATE),version:WOODLAND_RUIN_D11_3_VERSION,
 collision:{tileSize:32,width:24,height:20,tiles:[...RUIN_D11_3_ROWS]},entrance:{x:384,y:560},
 rooms:[
  {roomId:'broken-threshold',role:'arrival',x:10,y:15,width:4,height:4},
  {roomId:'roofless-hall',role:'encounter',x:4,y:4,width:16,height:10},
  {roomId:'reliquary-alcove',role:'reward',x:16,y:2,width:4,height:5}
 ],
 decorations:copyWire(RUIN_D11_3_DECORATIONS),
 encounter:{rank:'C',members:[{family:'gargoyle',x:304,y:304},{family:'cursed_blade',x:464,y:304}]},
 reward:{kind:'chest',art:'chest',position:{x:576,y:176}},
 visual:{version:'woodland-ruin-presentation-d11.3-v1',originTile:{x:0,y:0},terrain:[...RUIN_D11_3_ROWS],blockers:[],decorations:copyWire(RUIN_D11_3_DECORATIONS)}
});
export const WOODLAND_RUIN_D11_3_DEFINITION=freezeWire({package:WOODLAND_RUIN_D11_3_PACKAGE,template:WOODLAND_RUIN_D11_3_TEMPLATE,groupSuffix:'overgrown-court',containment:SITE_CONTAINMENT_D11_2.woodlandRuin});

const RUIN_D11_3_1_ROWS=[...RUIN_D11_3_ROWS];
// Authored structural bases: gargoyle perch (7..9), weapon shrine (10..13),
// and the two reward-alcove shoulders (16 and 20). The chest aisle at 17..19
// and every flat moss/rubble treatment remain walkable.
RUIN_D11_3_1_ROWS[5]=[...RUIN_D11_3_ROWS[5]].map((value,x)=>[7,8,9,10,11,12,13,16,20].includes(x)?'0':value).join('');
export const WOODLAND_RUIN_D11_3_1_PACKAGE=packageFor(WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_D11_3_1_VERSION,'8f1f6e34778ddede3ee4f0861ae004f1715d317a3e5193783d150a244b03fb39');
export const WOODLAND_RUIN_D11_3_1_TEMPLATE=freezeWire({
 ...copyWire(WOODLAND_RUIN_D11_3_TEMPLATE),version:WOODLAND_RUIN_D11_3_1_VERSION,
 collision:{...copyWire(WOODLAND_RUIN_D11_3_TEMPLATE.collision),tiles:[...RUIN_D11_3_1_ROWS]},
 visual:{...copyWire(WOODLAND_RUIN_D11_3_TEMPLATE.visual),version:'woodland-ruin-presentation-d11.3.1-v1',terrain:[...RUIN_D11_3_1_ROWS]}
});
export const WOODLAND_RUIN_D11_3_1_DEFINITION=freezeWire({package:WOODLAND_RUIN_D11_3_1_PACKAGE,template:WOODLAND_RUIN_D11_3_1_TEMPLATE,groupSuffix:'overgrown-court',containment:SITE_CONTAINMENT_D11_2.woodlandRuin});

// The D11.3.2 site geometry is deliberately identical to D11.3.1. Its new
// immutable package/presentation versions identify the deterministic material
// treatment used by fresh campaigns without rewriting the accepted baseline.
export const WOODLAND_RUIN_D11_3_2_PACKAGE=packageFor(WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_D11_3_2_VERSION,'fc5a1d75f2a96b1fef0eceac18adbeee2db1005028f81c8a4e029ac2464fde29');
export const WOODLAND_RUIN_D11_3_2_TEMPLATE=freezeWire({
 ...copyWire(WOODLAND_RUIN_D11_3_1_TEMPLATE),version:WOODLAND_RUIN_D11_3_2_VERSION,
 visual:{...copyWire(WOODLAND_RUIN_D11_3_1_TEMPLATE.visual),version:'woodland-ruin-presentation-d11.3.2-v1'}
});
export const WOODLAND_RUIN_D11_3_2_DEFINITION=freezeWire({package:WOODLAND_RUIN_D11_3_2_PACKAGE,template:WOODLAND_RUIN_D11_3_2_TEMPLATE,groupSuffix:'overgrown-court',containment:SITE_CONTAINMENT_D11_2.woodlandRuin});

export const WOODLAND_FORT_D11_PACKAGE=packageFor(WOODLAND_FORT_PACKAGE,WOODLAND_FORT_D11_VERSION,'f79728292e714330b5139fbca3c4e14b57722b17d45b013a2e7bc50162485a22');
export const WOODLAND_FORT_D11_TEMPLATE=templateFor(WOODLAND_FORT_TEMPLATE,WOODLAND_FORT_D11_VERSION,[
 {family:'animated_armor',x:544,y:720},{family:'golem',x:1072,y:656},{family:'animated_armor',x:784,y:848}
]);
export const WOODLAND_FORT_D11_DEFINITION=freezeWire({package:WOODLAND_FORT_D11_PACKAGE,template:WOODLAND_FORT_D11_TEMPLATE,groupSuffix:'fort-courtyard',containment:SITE_CONTAINMENT_D11_2.woodlandFort});

export const WOODLAND_CAVE_D11_PACKAGE=packageFor(WOODLAND_CAVE_PACKAGE,WOODLAND_CAVE_D11_VERSION,'323224093373a765f1b05a3a57ca6608874fbf18f9f0dce9ab156145a666da38');
export const WOODLAND_CAVE_D11_TEMPLATE=templateFor(WOODLAND_CAVE_TEMPLATE,WOODLAND_CAVE_D11_VERSION,[
 {family:'rust_nibbler',x:352,y:288},{family:'golem',x:496,y:288},{family:'rust_nibbler',x:416,y:384}
]);
export const WOODLAND_CAVE_D11_DEFINITION=freezeWire({package:WOODLAND_CAVE_D11_PACKAGE,template:WOODLAND_CAVE_D11_TEMPLATE,groupSuffix:'hollow-depths',containment:SITE_CONTAINMENT_D11_2.woodlandCave});

export const buildWoodlandRuinD11=(state,site,binding,options)=>buildDefinedFunctionalSiteD10(state,site,binding,WOODLAND_RUIN_D11_DEFINITION,options);
export const buildWoodlandRuinD11_3=(state,site,binding,options)=>buildDefinedFunctionalSiteD10(state,site,binding,WOODLAND_RUIN_D11_3_DEFINITION,options);
export const buildWoodlandRuinD11_3_1=(state,site,binding,options)=>buildDefinedFunctionalSiteD10(state,site,binding,WOODLAND_RUIN_D11_3_1_DEFINITION,options);
export const buildWoodlandRuinD11_3_2=(state,site,binding,options)=>buildDefinedFunctionalSiteD10(state,site,binding,WOODLAND_RUIN_D11_3_2_DEFINITION,options);
export const buildWoodlandFortD11=(state,parcel,binding,options)=>buildDefinedWorldCompoundD10(state,parcel,binding,WOODLAND_FORT_D11_DEFINITION,options);
export const buildWoodlandCaveD11=(state,site,binding,options)=>buildDefinedFunctionalSiteD10(state,site,binding,WOODLAND_CAVE_D11_DEFINITION,options);
