import {creaturePresentationD11_1} from '../shared/content/creature_presentation_d11_1.js';
// Drawing-only bounds for the revamped bodies. Authority/catalog projections
// retain their original data; collision hulls and attack reach are unchanged.
const bounds={
 clockwork_scarab:{visualBounds:{x:-22,y:-26,width:44,height:33},effectBounds:{x:-26,y:-30,width:52,height:41}},
 temporal_watcher:{visualBounds:{x:-20,y:-30,width:40,height:47},effectBounds:{x:-24,y:-34,width:48,height:55}},
 clockwork_drone:{visualBounds:{x:-22,y:-27,width:44,height:38},effectBounds:{x:-26,y:-31,width:52,height:46}},
 neon_spider:{visualBounds:{x:-21,y:-28,width:42,height:36},effectBounds:{x:-25,y:-32,width:50,height:44}}
};
const profiles=new Map(Object.entries(bounds).map(([family,changes])=>[family,Object.freeze({...creaturePresentationD11_1(family),visualBounds:Object.freeze(changes.visualBounds),effectBounds:Object.freeze(changes.effectBounds)})]));
export const creaturePresentationForRenderV3=family=>profiles.get(family)??creaturePresentationD11_1(family);
