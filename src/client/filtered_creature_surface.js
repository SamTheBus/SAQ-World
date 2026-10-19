// Presentation-only scratch surface. Keep the existing per-primitive filter,
// shadow, pose and device-space transform, but bound raster work to the body.
// One canvas per destination context; no actor, tick or world-state cache.
const surfaces=new WeakMap();
const STATE=['fillStyle','strokeStyle','globalAlpha','globalCompositeOperation','filter','shadowColor','shadowBlur','shadowOffsetX','shadowOffsetY','lineWidth','lineCap','lineJoin','miterLimit','font','textAlign','textBaseline','direction','imageSmoothingEnabled','imageSmoothingQuality'];
export function drawFilteredCreatureSurface(ctx,frame,paint){
 const doc=ctx.canvas?.ownerDocument;
 if(!doc||typeof ctx.getTransform!=='function'||ctx.filter==='none'){paint(ctx);return false;}
 const m=ctx.getTransform(),pad=64,left=frame.x-pad,top=frame.y-pad,right=frame.x+frame.width+pad,bottom=frame.y+frame.height+pad;
 const corners=[[left,top],[right,top],[left,bottom],[right,bottom]].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f})),x=Math.floor(Math.min(...corners.map(p=>p.x))),y=Math.floor(Math.min(...corners.map(p=>p.y))),w=Math.ceil((Math.ceil(Math.max(...corners.map(p=>p.x)))-x)/32)*32,h=Math.ceil((Math.ceil(Math.max(...corners.map(p=>p.y)))-y)/32)*32;
 // Unusual zoom/transform uses the original path. Never clip an oversized body.
 if(w<1||h<1||w>512||h>512){paint(ctx);return false;}
 let surface=surfaces.get(ctx);if(!surface){const canvas=doc.createElement('canvas');surface={canvas,context:canvas.getContext('2d')};surfaces.set(ctx,surface);}
 const canvas=surface.canvas,c=surface.context;
 if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 c.resetTransform();c.clearRect(0,0,w,h);for(const name of STATE)c[name]=ctx[name];c.setLineDash(ctx.getLineDash());c.lineDashOffset=ctx.lineDashOffset;
 c.setTransform(m.a,m.b,m.c,m.d,m.e-x,m.f-y);paint(c);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.filter='none';ctx.shadowColor='rgba(0,0,0,0)';ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.globalAlpha=1;ctx.drawImage(canvas,x,y);ctx.restore();
 return true;
}
