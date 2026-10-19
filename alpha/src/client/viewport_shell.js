// Presentation capability adapter. No browser access at module import.
export function measureWorldViewport(environment) {
  const valid=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
  const fallback=(primary,secondary)=>valid(primary)?primary:valid(secondary)?secondary:1;
  const viewport=environment.visualViewport,root=environment.document.documentElement;
  const visual=valid(viewport?.width)&&valid(viewport?.height);
  const offset=value=>Number.isFinite(value)?Math.max(0,value):0;
  return Object.freeze({
    left:visual?offset(viewport.offsetLeft):0,top:visual?offset(viewport.offsetTop):0,
    width:Math.max(1,Math.round(visual?viewport.width:fallback(root.clientWidth,environment.innerWidth))),
    height:Math.max(1,Math.round(visual?viewport.height:fallback(root.clientHeight,environment.innerHeight)))
  });
}

export function coordinateWorldViewport({environment,shell,onResize=()=>{}}) {
  let frame=null,disposed=false;
  const listeners=[];
  function update(){if(disposed)return;const bounds=measureWorldViewport(environment);
    for(const name of ['left','top','width','height']){const value=bounds[name]+'px';if(shell.style[name]!==value)shell.style[name]=value;}
    shell.style.right='auto';shell.style.bottom='auto';onResize();
  }
  function request(){if(disposed)return;update();if(frame!==null)environment.cancelAnimationFrame(frame);
    frame=environment.requestAnimationFrame(()=>{frame=null;update();});
  }
  function listen(target,type){if(!target?.addEventListener)return;target.addEventListener(type,request);listeners.push(()=>target.removeEventListener(type,request));}
  for(const type of ['resize','orientationchange','pageshow'])listen(environment,type);
  for(const type of ['resize','scroll'])listen(environment.visualViewport,type);
  function destroy(){disposed=true;if(frame!==null)environment.cancelAnimationFrame(frame);frame=null;listeners.forEach(remove=>remove());}
  const hide=event=>{if(!event.persisted){destroy();environment.removeEventListener('pagehide',hide);}};
  environment.addEventListener('pagehide',hide);
  request();
  return Object.freeze({destroy:()=>{destroy();environment.removeEventListener('pagehide',hide);}});
}
