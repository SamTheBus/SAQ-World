import {creaturePresentationD11_1} from '../shared/content/creature_presentation_d11_1.js';
// Drawing-only bounds for the revamped bodies. Authority/catalog projections
// retain their original data; collision hulls and attack reach are unchanged.
const bounds={
 wyrmling:{visualBounds:{x:-34,y:-39,width:68,height:55},effectBounds:{x:-52,y:-64,width:104,height:112},labels:{healthBarY:-44,levelLabelY:-50}},
 thorn_wyrm:{visualBounds:{x:-33,y:-33,width:66,height:48},effectBounds:{x:-54,y:-60,width:108,height:102}},
 cyber_wraith:{visualBounds:{x:-26,y:-40,width:52,height:54},effectBounds:{x:-76,y:-86,width:152,height:160}},
 rift_drifter:{visualBounds:{x:-24,y:-32,width:48,height:46},effectBounds:{x:-74,y:-82,width:148,height:156}},
 void_wraith:{visualBounds:{x:-29,y:-38,width:58,height:61},effectBounds:{x:-80,y:-86,width:160,height:164},labels:{healthBarY:-42,levelLabelY:-48}},
 void_spectre:{visualBounds:{x:-32,y:-36,width:64,height:62},effectBounds:{x:-80,y:-86,width:160,height:164},labels:{healthBarY:-45,levelLabelY:-51}},
 void_crawler:{visualBounds:{x:-23,y:-25,width:57,height:45},effectBounds:{x:-82,y:-86,width:164,height:164},labels:{healthBarY:-34,levelLabelY:-40}},
 void_orb:{visualBounds:{x:-24,y:-38,width:48,height:55},effectBounds:{x:-42,y:-56,width:84,height:84},labels:{healthBarY:-43,levelLabelY:-49}},
 corroded_golem:{visualBounds:{x:-27,y:-35,width:54,height:58},effectBounds:{x:-78,y:-86,width:156,height:164},labels:{healthBarY:-44,levelLabelY:-50}},
 marsh_ghost:{visualBounds:{x:-28,y:-37,width:56,height:60},effectBounds:{x:-70,y:-76,width:140,height:148},labels:{healthBarY:-48,levelLabelY:-54}},
 hell_bat:{visualBounds:{x:-25,y:-33,width:50,height:46},effectBounds:{x:-70,y:-70,width:140,height:140}},
 lava_serpent:{visualBounds:{x:-15,y:-23,width:43,height:31},effectBounds:{x:-70,y:-70,width:150,height:130}},
 cursed_blade:{visualBounds:{x:-24,y:-34,width:48,height:56},effectBounds:{x:-70,y:-85,width:140,height:150}},
 animated_armor:{visualBounds:{x:-24,y:-33,width:48,height:54},effectBounds:{x:-52,y:-62,width:104,height:114}},
 gargoyle:{visualBounds:{x:-28,y:-33,width:56,height:43},effectBounds:{x:-50,y:-56,width:100,height:96}},
 clockwork_scarab:{visualBounds:{x:-22,y:-26,width:44,height:33},effectBounds:{x:-26,y:-30,width:52,height:41}},
 temporal_watcher:{visualBounds:{x:-20,y:-30,width:40,height:47},effectBounds:{x:-24,y:-34,width:48,height:55}},
 clockwork_drone:{visualBounds:{x:-22,y:-27,width:44,height:38},effectBounds:{x:-26,y:-31,width:52,height:46}},
 star_weaver:{visualBounds:{x:-23,y:-29,width:46,height:39},effectBounds:{x:-27,y:-33,width:54,height:47}},
 neon_spider:{visualBounds:{x:-21,y:-30,width:42,height:38},effectBounds:{x:-25,y:-34,width:50,height:46}}
};
const profiles=new Map(Object.entries(bounds).map(([family,changes])=>[family,Object.freeze({...creaturePresentationD11_1(family),visualBounds:Object.freeze(changes.visualBounds),effectBounds:Object.freeze(changes.effectBounds),...(changes.labels?{labels:Object.freeze(changes.labels)}:{})})]));
export const creaturePresentationForRenderV3=family=>profiles.get(family)??creaturePresentationD11_1(family);
