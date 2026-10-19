import {drawIronChest} from './iron_chest_art.js';
import {drawArachnidTreantD12_5A} from './boss_presentation_d12_5.js';
import {createExtractionPortalPresentationD12_5C} from './extraction_portal_presentation_d12_5c.js';

// First-use translucent Canvas paths can compile/rasterize slowly on the GPU.
// Exercise the existing painters on a disposable bounded surface while the
// client is preparing, before input/authority resumes. Never paint it onscreen.
// These are presentation samples, not actors, rewards or authoritative portals.
export function createCompletionArtPreparation(canvas){
 let attempted=false,prepared=false;
 function prepare(){
  if(attempted)return prepared;
  attempted=true;
  const doc=canvas.ownerDocument;if(!doc?.createElement)return false;
  try{
   const surface=doc.createElement('canvas');surface.width=surface.height=256;
   const c=surface.getContext('2d');if(!c)return false;
   c.translate(128,128);c.scale(1.5,1.5);c.globalAlpha=.45;
   for(const lid of [0,.5,1])drawIronChest(c,0,0,0,lid);
   drawArachnidTreantD12_5A(c,{boss:{shieldActive:false,shieldBrokenTick:null},position:{x:0,y:0},alive:false,deathAge:18,presentationFacingX:1},30);
   const sample={tick:30,space:{exits:[{exitId:'warm-completion',x:0,y:0,extractionPortal:{visible:true,activatedTick:0}}]}};
   for(const item of createExtractionPortalPresentationD12_5C().depthItems(sample,{x:-128,y:-128,width:256,height:256}))item.draw(c);
   // Complete preparation now, rather than deferring GPU work to first reveal.
   // Both the surface and readback are discarded; neither is a scenery cache.
   c.getImageData(0,0,256,256);prepared=true;
  }catch{
   // Optional raster preparation cannot prevent play on an unsupported/lost
   // context. The original visible painters remain the rendering path.
  }
  return prepared;
 }
 return Object.freeze({prepare,inspect:()=>Object.freeze({attempted,prepared,maxSurfacePixels:256*256,retainedSurfaces:0})});
}
