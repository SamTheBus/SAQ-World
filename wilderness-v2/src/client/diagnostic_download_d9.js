// A diagnostic is assembled on demand, but its fatal incident was latched by
// the session at the moment authority stopped. No campaign data is mutated.
export function createDiagnosticDownloadD9({environment,document,runtimeId,readPayload}){
 let sequence=0;
 const filename=kind=>`SAQ-World-${kind}-${runtimeId}-${new Date().toISOString().replace(/[:.]/g,'-')}-${++sequence}.json`;
 const json=()=>JSON.stringify(readPayload(),null,2);
 function download(kind){
  const blob=new environment.Blob([json()],{type:'application/json'}),url=environment.URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename(kind);link.hidden=true;document.body.append(link);link.click();
  // Mobile Safari may resolve the blob after the click task has returned.
  environment.setTimeout(()=>link.remove(),10000);
  environment.setTimeout(()=>environment.URL.revokeObjectURL(url),60000);
  return link.download;
 }
 async function copy(){
  const value=json();
  if(environment.navigator.clipboard?.writeText){try{await environment.navigator.clipboard.writeText(value);return true;}catch{}}
  const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.focus();input.select();input.setSelectionRange(0,value.length);
  let succeeded=false;try{succeeded=Boolean(document.execCommand('copy'));}catch{}input.remove();return succeeded;
 }
 return Object.freeze({download,copy});
}
