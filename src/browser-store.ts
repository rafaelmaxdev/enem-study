import {assertBackup,type State,type Session} from './domain';
export type BrowserProfile={revision:number;state:State};
// Backup validation intentionally clears a practice session; opening saved work must retain it.
export function checkedBrowserState(raw:State){
 const state=structuredClone(raw),session=state.session;assertBackup(state);
 if(session){
  const ids=new Set(state.questions.map(q=>q.id));
  const mapping=(v:unknown,check:(x:unknown)=>boolean)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([id,x])=>session.questionIds.includes(id)&&check(x));
  if(typeof session.id!=='string'||!Array.isArray(session.questionIds)||!session.questionIds.every(id=>ids.has(id))||new Set(session.questionIds).size!==session.questionIds.length||!Number.isInteger(session.index)||session.index<0||session.index>=Math.max(1,session.questionIds.length)||typeof session.finished!=='boolean'||!mapping(session.answers,v=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=4)||!mapping(session.submitted,v=>typeof v==='boolean')||!mapping(session.help,v=>['none','hint','ai','unknown'].includes(String(v))))throw new Error('A sessão salva está incompleta.');
  state.session=session as Session;
 }
 return state;
}
export function readBrowserProfile(db:IDBDatabase,initial:()=>State){
 return new Promise<BrowserProfile>((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),r=store.get('profile');let profile:BrowserProfile,error:unknown;
  r.onsuccess=()=>{try{profile=r.result||{revision:0,state:initial()};if(!Number.isInteger(profile.revision)||profile.revision<0)throw new Error('O progresso salvo não pôde ser lido.');profile.state=checkedBrowserState(profile.state);if(!r.result)store.put(profile,'profile');}catch(e){error=e;tx.abort();}};
  tx.oncomplete=()=>resolve(profile);tx.onerror=tx.onabort=()=>reject(error||tx.error||new Error('Não foi possível abrir o progresso neste navegador.'));
 });
}
export function commitBrowserProfile(db:IDBDatabase,revision:number,state?:State,documents:{id:string;file:File}[]=[],replace=false){
 const checked=state?checkedBrowserState(state):undefined;
 return new Promise<BrowserProfile>((resolve,reject)=>{
  const tx=db.transaction(['state','pdfs'],'readwrite'),store=tx.objectStore('state'),r=store.get('profile');let profile:BrowserProfile,error:unknown;
  r.onsuccess=()=>{try{const old=r.result as BrowserProfile;if(!old||old.revision!==revision)throw new Error('Seu progresso mudou em outra aba. Recarregue esta página antes de continuar.');profile={revision:revision+1,state:checked||old.state};store.put(profile,'profile');if(replace)tx.objectStore('pdfs').clear();for(const d of documents)tx.objectStore('pdfs').put(d.file,d.id);}catch(e){error=e;tx.abort();}};
  tx.oncomplete=()=>resolve(profile);tx.onerror=tx.onabort=()=>reject(error||tx.error||new Error('Não foi possível salvar. Exporte um backup e confira o espaço disponível no navegador.'));
 });
}
