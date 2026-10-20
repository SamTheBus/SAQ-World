// Presentation-only cel materials. Lighting never changes collision or state.
// Shade filled vector surfaces in place. There is no full-frame pixel pass.
const contexts=new WeakMap(),rawContexts=new WeakMap(),colors=new Map();
const INK='#18232b';
function rgb(value){
 if(typeof value!=='string')return null;if(colors.has(value))return colors.get(value);
 let m=value.match(/^#([\da-f]{3,8})$/i),a=1,r,g,b;
 if(m){let h=m[1];if(h.length===3||h.length===4)h=[...h].map(c=>c+c).join('');if(h.length===6||h.length===8){r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);if(h.length===8)a=parseInt(h.slice(6),16)/255;}}
 else if((m=value.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/))){r=+m[1];g=+m[2];b=+m[3];a=m[4]===undefined?1:+m[4];}
 const result=Number.isFinite(r)?{r,g,b,a}:null;if(colors.size<2048)colors.set(value,result);return result;
}
const tone=(p,f,add=0)=>`rgba(${Math.min(255,Math.round(p.r*f+add))},${Math.min(255,Math.round(p.g*f+add))},${Math.min(255,Math.round(p.b*f+add))},${p.a})`;
function gradient(){const stops=[];return {celStops:stops,addColorStop(at,color){stops.push({at,color});}};}
function material(value){if(!value?.celStops)return value;const s=[...value.celStops].sort((a,b)=>a.at-b.at);return s[Math.floor(s.length*.6)]?.color??'#899b9f';}

export function celShadeContext(context,{mode='creature'}={}){
 const raw=rawContexts.get(context)??context;let modes=contexts.get(raw);if(!modes){modes=new Map();contexts.set(raw,modes);}if(modes.has(mode))return modes.get(mode);
 let bounds=null,matrix=null;const methods=new Map();
 const transform=()=>raw.getTransform?.()??{a:1,b:0,c:0,d:1,e:0,f:0};
 const include=(x,y)=>{const m=matrix??transform(),px=m.a*x+m.c*y+m.e,py=m.b*x+m.d*y+m.f;if(!bounds)bounds={l:px,r:px,t:py,b:py};else{bounds.l=Math.min(bounds.l,px);bounds.r=Math.max(bounds.r,px);bounds.t=Math.min(bounds.t,py);bounds.b=Math.max(bounds.b,py);}};
 function bands(args){
  const p=rgb(raw.fillStyle),b=bounds;if(!p||!b||p.a<.5||raw.globalAlpha<.45)return;
  const w=b.r-b.l,h=b.b-b.t,shapeMatrix=transform(),areaScale=Math.abs(shapeMatrix.a*shapeMatrix.d-shapeMatrix.b*shapeMatrix.c);
  if(w<4||h<4||w*h/Math.max(1e-8,areaScale)<120||Math.max(p.r,p.g,p.b)<12||Math.min(p.r,p.g,p.b)>247)return;
  if(typeof Path2D!=='function'||typeof Path2D.prototype.moveTo!=='function')return;
  const savedFill=raw.fillStyle,savedStroke=raw.strokeStyle,savedWidth=raw.lineWidth,savedBlur=raw.shadowBlur;
  // Clipping the existing path leaves its geometry and later stroke intact.
  raw.save();if(args.length&&typeof args[0]!=='string'){raw.restore();return;}raw.clip(...args);raw.shadowBlur=0;
  // Separate Path2D planes preserve the caller's current path and transform.
  // Project screen-space light into local coordinates, including mirrored art.
  const m=shapeMatrix,det=m.a*m.d-m.b*m.c;if(Math.abs(det)<1e-10){raw.restore();return;}
  const local=(x,y)=>[(m.d*(x-m.e)-m.c*(y-m.f))/det,(-m.b*(x-m.e)+m.a*(y-m.f))/det],pad=Math.hypot(w,h),l=b.l-pad,r=b.r+pad,cx=(b.l+b.r)*.5;
  const plane=(fraction,top)=>{const path=new Path2D();if(typeof path.moveTo!=='function')return null;const yl=b.t+h*fraction-.22*(l-cx),yr=b.t+h*fraction-.22*(r-cx),edge=top?b.t-pad:b.b+pad,points=[[l,yl],[r,yr],[r,edge],[l,edge]];path.moveTo(...local(...points[0]));for(const q of points.slice(1))path.lineTo(...local(...q));path.closePath();return path;};
  raw.fillStyle=tone(p,.63);const shadow=plane(.58,false);if(shadow)raw.fill(shadow);
  if(Math.min(p.r,p.g,p.b)<240){raw.fillStyle=tone(p,.84,44);const highlight=plane(.22,true);if(highlight)raw.fill(highlight);}
  raw.restore();
  raw.save();raw.shadowBlur=0;raw.strokeStyle=INK;raw.lineWidth=Math.max(.85,Math.min(1.35,raw.lineWidth));raw.stroke();raw.restore();
  raw.fillStyle=savedFill;raw.strokeStyle=savedStroke;raw.lineWidth=savedWidth;raw.shadowBlur=savedBlur;
 }
 const proxy=new Proxy(raw,{
  get(target,key){
   if(key==='createRadialGradient'||key==='createLinearGradient')return gradient;
   const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;if(methods.has(key))return methods.get(key);
   const fn=(...args)=>{
    if(key==='beginPath'){bounds=null;matrix=transform();}
    else if(key==='moveTo'||key==='lineTo')include(args[0],args[1]);
    else if(key==='quadraticCurveTo'||key==='bezierCurveTo'){for(let i=0;i<args.length;i+=2)include(args[i],args[i+1]);}
    else if(key==='arc'||key==='ellipse'){const [x,y,rx]=args,ry=key==='arc'?rx:args[3],a=key==='arc'?0:args[4];const ex=Math.hypot(rx*Math.cos(a),ry*Math.sin(a)),ey=Math.hypot(rx*Math.sin(a),ry*Math.cos(a));for(const dx of [-ex,ex])for(const dy of [-ey,ey])include(x+dx,y+dy);}
    else if(key==='rect'||key==='roundRect'){const [x,y,w,h]=args;for(const dx of [0,w])for(const dy of [0,h])include(x+dx,y+dy);}
    const result=Reflect.apply(value,target,args);
    if(key==='fill')bands(args);
    return result;
   };methods.set(key,fn);return fn;
  },
  set(target,key,value){if(key==='fillStyle'||key==='strokeStyle')value=material(value);else if(key==='shadowBlur')value=0;else if(key==='filter'&&typeof value==='string')value=value.replace(/blur\([^)]*\)/g,'');return Reflect.set(target,key,value,target);}
 });rawContexts.set(proxy,raw);modes.set(mode,proxy);return proxy;
}

// Authored raster kits are prepared once at decode. Broad color regions and
// discrete tones replace surface noise; alpha and image geometry stay exact.
export function prepareCelTexture(canvas,{terrain=false}={}){
 const c=canvas.getContext('2d',{willReadFrequently:true});if(typeof c.getImageData!=='function')return canvas;
 const w=canvas.width,h=canvas.height;if(!w||!h)return canvas;
 const image=c.getImageData(0,0,w,h);if(!image?.data)return canvas;const src=new Uint8ClampedArray(image.data),out=image.data,radius=terrain?4:2;
 // Summed-area color averaging is linear in pixel count, even for large kits.
 const stride=w+1,n=stride*(h+1),sums=[new Float64Array(n),new Float64Array(n),new Float64Array(n),new Float64Array(n)];
 for(let y=1;y<=h;y++){const row=[0,0,0,0];for(let x=1;x<=w;x++){const i=((y-1)*w+x-1)*4,a=src[i+3]/255;for(let k=0;k<4;k++){row[k]+=k===3?a:src[i+k]*a;sums[k][y*stride+x]=sums[k][(y-1)*stride+x]+row[k];}}}
 const sum=(a,l,t,r,b)=>a[b*stride+r]-a[t*stride+r]-a[b*stride+l]+a[t*stride+l];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(!src[i+3])continue;const l=Math.max(0,x-radius),t=Math.max(0,y-radius),r=Math.min(w,x+radius+1),b=Math.min(h,y+radius+1),weight=sum(sums[3],l,t,r,b)||1;
  const v=[0,1,2].map(k=>sum(sums[k],l,t,r,b)/weight),lum=v[0]*.2126+v[1]*.7152+v[2]*.0722;
  const level=lum<55?38:lum<100?77:lum<150?125:lum<199?177:223,scale=level/Math.max(1,lum);
  for(let k=0;k<3;k++)out[i+k]=Math.max(0,Math.min(255,Math.round(v[k]*scale/12)*12));
  // Keep the original alpha edge. A dark inner contour belongs to sprites only.
  if(!terrain&&src[i+3]>160&&[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([xx,yy])=>xx<0||yy<0||xx>=w||yy>=h||src[(yy*w+xx)*4+3]<100))for(let k=0;k<3;k++)out[i+k]=[24,35,43][k];
 }
 c.putImageData(image,0,0);return canvas;
}
