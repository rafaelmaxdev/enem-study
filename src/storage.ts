import {browserOnly,assetBase} from './hosting';
import {readBrowserProfile,commitBrowserProfile} from './browser-store';
import {assertBackup,type State} from './domain';
import {mergeEdcleyProgress} from './edcley-progress';
import {initialState} from './seed';
const dbPromise=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(browserOnly?'enem-study-pages:'+assetBase:'enem-study',1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function read<T>(store:string,key:string):Promise<T|undefined>{const db=await dbPromise;return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function write(store:string,key:string,value:unknown){const db=await dbPromise;return new Promise<void>((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
type DocumentData={name:string;dataURL:string};
type Profile={revision:number;state:State;documents:Record<string,DocumentData>;migratedClients:string[]};
let revision:number|null=null,documents:Record<string,DocumentData>={},conflicted=false;
let pending=Promise.resolve();
const clientId=localStorage.getItem('enem-client-id')||crypto.randomUUID();localStorage.setItem('enem-client-id',clientId);
async function profileRequest(data?:unknown){
 const response=await fetch('/api/profile',data===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const result=await response.json();if(!response.ok){if(response.status===409)conflicted=true;throw new Error(result.error||'Não foi possível acessar o arquivo de progresso.');}return result;
}
function acceptProfile(p:Profile){revision=p.revision;documents=p.documents;return p.state;}
async function legacyPDFs(){const db=await dbPromise;return new Promise<{id:string;file:File}[]>((resolve,reject)=>{const tx=db.transaction('pdfs');const store=tx.objectStore('pdfs');const keys=store.getAllKeys(),values=store.getAll();tx.oncomplete=()=>resolve(keys.result.map((key,i)=>({id:String(key),file:values.result[i]})));tx.onerror=()=>reject(tx.error);});}
export async function loadState(){
 if(browserOnly){const p=await readBrowserProfile(await dbPromise,initialState);revision=p.revision;return mergeEdcleyProgress(p.state);}
 let p=(await profileRequest()).profile as Profile|null;
 if(!p||!p.migratedClients.includes(clientId)){
  const legacy=await read<State>('state','current'),docs:Record<string,DocumentData>={};
  for(const {id,file}of await legacyPDFs())docs[id]={name:file.name||'documento.pdf',dataURL:await blobToBase64(new Blob([file],{type:'application/pdf'}))};
  p=(await profileRequest({mode:'migrate',clientId,state:legacy||initialState(),documents:docs})).profile;
 }
 const state=mergeEdcleyProgress(acceptProfile(p!));await write('state','current',state).catch(()=>{});return state;
}
function enqueue(fn:()=>Promise<void>){const next=pending.catch(()=>{}).then(fn);pending=next;return next;}
async function persist(state?:State,docs?:Record<string,DocumentData>,replace=false){
 if(browserOnly){if(revision===null)throw new Error('Abra o progresso antes de salvar.');const files=Object.entries(docs||{}).map(([id,d])=>({id,file:fileFromData(d)}));const p=await commitBrowserProfile(await dbPromise,revision,state,files,replace);revision=p.revision;return;}
 if(conflicted)throw new Error('Recarregue esta página para usar o progresso mais recente antes de continuar.');
 const result=await profileRequest({mode:replace?'replace':'save',revision,state,documents:docs});revision=result.revision;
 if(docs)documents=replace?docs:{...documents,...docs};
 if(state)await write('state','current',state).catch(()=>{});
}
export function saveState(state:State){const snapshot=structuredClone(state);return enqueue(()=>persist(snapshot));}
export function savePDF(id:string,file:Blob){return enqueue(async()=>{if(browserOnly){const saved=file instanceof File?file:new File([file],'documento.pdf',{type:'application/pdf'});const p=await commitBrowserProfile(await dbPromise,revision!,undefined,[{id,file:saved}]);revision=p.revision;return;}const dataURL=await blobToBase64(new Blob([file],{type:'application/pdf'}));await persist(undefined,{[id]:{name:file instanceof File?file.name:'documento.pdf',dataURL}});await write('pdfs',id,file).catch(()=>{});});}
function fileFromData(d:DocumentData){const bytes=Uint8Array.from(atob(d.dataURL.split(',')[1]),c=>c.charCodeAt(0));return new File([bytes],d.name,{type:'application/pdf'});}
export async function loadPDF(id:string){if(browserOnly)return read<File>('pdfs',id);return documents[id]?fileFromData(documents[id]):undefined;}
export async function listPDFs(){if(browserOnly)return legacyPDFs();return Object.entries(documents).map(([id,data])=>({id,file:fileFromData(data)}));}
export function download(name:string,data:string,type='application/json'){const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function blobToBase64(blob:Blob){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result as string);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
export async function exportBackup(state:State){const docs:Record<string,{name:string;dataURL:string}>={};for(const {id,file} of await listPDFs())docs[id]={name:file.name||'documento.pdf',dataURL:await blobToBase64(file)};download('enem-study-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({format:'enem-study',state,documents:docs}));}
export async function importBackup(file:File){
 if(file.size>200*1024*1024)throw new Error('O backup excede 200 MB.');
 const data=JSON.parse(await file.text());if(data.format!=='enem-study')throw new Error('Selecione um backup do ENEM Study.');assertBackup(data.state);
 const state=mergeEdcleyProgress(data.state);
 const documents:{id:string;file:File}[]=[];
 for(const [id,raw]of Object.entries(data.documents||{})){
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw new Error('Identificador de PDF inválido no backup.');
  const entry=typeof raw==='string'?{name:'documento.pdf',dataURL:raw}:raw as {name:string;dataURL:string};
  if(!entry||typeof entry.dataURL!=='string'||!/^data:application\/pdf;base64,/.test(entry.dataURL))throw new Error('Arquivo PDF inválido no backup.');
  const bytes=Uint8Array.from(atob(entry.dataURL.split(',')[1]),c=>c.charCodeAt(0));
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('O backup contém um arquivo que não é PDF.');
  documents.push({id,file:new File([bytes],entry.name||'documento.pdf',{type:'application/pdf'})});
 }
 // The single local file commits state and PDFs together before updating the browser cache.
 const docs=Object.fromEntries(await Promise.all(documents.map(async d=>[d.id,{name:d.file.name,dataURL:await blobToBase64(d.file)}] as const)));
 await enqueue(()=>persist(state,docs,true));
 if(browserOnly)return state;
 const db=await dbPromise;await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['state','pdfs'],'readwrite');tx.objectStore('pdfs').clear();for(const d of documents)tx.objectStore('pdfs').put(d.file,d.id);tx.objectStore('state').put(state,'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}).catch(()=>{});
 return state;
}
