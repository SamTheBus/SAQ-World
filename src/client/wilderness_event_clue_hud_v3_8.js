// Presentation only. Clues appear within nearby terrain, never as a global
// quest GPS, and stay out of the way of the main HUD and touch controls.
export function createWoodlandClueHudV3_8(document) {
 const root=document.createElement('aside');
 root.id='woodland-clue-v3-8';root.hidden=true;
 root.setAttribute('aria-label','Nearby wilderness clue');
 root.setAttribute('data-gameplay-hud','');
 const heading=document.createElement('strong'),message=document.createElement('span');
 root.append(heading,message);
 const style=document.createElement('style');
 style.textContent=[
 '#woodland-clue-v3-8{position:fixed;z-index:7;top:calc(114px + var(--world-safe-top,0px));left:calc(10px + var(--world-safe-left,0px));max-width:242px;box-sizing:border-box;padding:8px 12px 9px;pointer-events:none;border:1px solid rgba(158,141,93,.57);border-left:3px solid #9f9761;border-radius:3px 8px 8px 3px;background:linear-gradient(125deg,rgba(19,27,23,.94),rgba(13,21,23,.86));box-shadow:0 5px 19px rgba(0,0,0,.34);color:#e1d7b8;font:12px/1.4 Georgia,serif;text-shadow:0 1px 1px #0009}',
 '#woodland-clue-v3-8[hidden]{display:none!important}',
 '#woodland-clue-v3-8 strong{display:block;font:700 10px/1.4 system-ui,sans-serif;letter-spacing:.15em;text-transform:uppercase;color:#b5b99b;margin-bottom:3px}',
 '#woodland-clue-v3-8 span{display:block}',
 '@media(max-width:600px){#woodland-clue-v3-8{top:calc(115px + var(--world-safe-top,0px));max-width:min(186px,48vw);padding:7px 9px;font-size:11px}}',
 '@media(prefers-reduced-motion:reduce){#woodland-clue-v3-8{transition:none}}'
 ].join('\n');
 document.head.append(style);
 (document.getElementById('world-app')??document.body).append(root);
 let previous='';
 function refresh(model,visible=true){
   const clue=model?.woodlandPilotClues?.[0];
   const show=Boolean(visible&&clue&&model?.space?.overworld);
   root.hidden=!show;
   if(!show){previous='';return;}
   const next=(clue.stage==='sighted'?'DISCOVERED':'WILDERNESS SIGN')+'|'+clue.text+'|'+clue.direction+'|'+clue.state;
   if(next===previous)return;
   previous=next;
   heading.textContent=clue.state==='completed'?'CLEARED':clue.stage==='sighted'?'DISCOVERY NEARBY':'WILDERNESS SIGN';
   message.textContent=clue.text+(clue.direction==='nearby'?'':' · '+clue.direction);
 }
 return Object.freeze({refresh,destroy(){root.remove();style.remove();}});
}
