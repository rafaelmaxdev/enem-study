import {mkdir,readFile,writeFile,rename,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {assertBackup} from './src/domain.ts';

function checkedState(raw){
 const state=structuredClone(raw),session=state?.session;
 assertBackup(state);
 if(session){
  const ids=new Set(state.questions.map(q=>q.id));
  const mapping=(value,check)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,v])=>ids.has(id)&&check(v));
  if(typeof session.id!=='string'||!Array.isArray(session.questionIds)||!session.questionIds.every(id=>ids.has(id))||new Set(session.questionIds).size!==session.questionIds.length||!Number.isInteger(session.index)||session.index<0||session.index>=Math.max(1,session.questionIds.length)||typeof session.finished!=='boolean'||!mapping(session.answers,v=>Number.isInteger(v)&&v>=0&&v<=4)||!mapping(session.submitted,v=>typeof v==='boolean')||!mapping(session.help,v=>['none','hint','ai','unknown'].includes(v)))throw new Error('A sessão de estudo está incompleta.');
  state.session=session;
 }
 return state;
}
function checkedDocuments(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Lista de PDFs inválida.');
 const entries=Object.entries(raw);
 if(entries.length>100)throw new Error('A coleção excede 100 PDFs.');
 for(const[id,d]of entries){
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||!d||typeof d.name!=='string'||d.name.length>280||typeof d.dataURL!=='string'||!/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(d.dataURL))throw new Error('PDF inválido.');
  const bytes=Buffer.from(d.dataURL.split(',')[1],'base64');
  if(bytes.length>35*1024*1024||bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('O PDF está inválido ou excede 35 MB.');
 }
 return Object.fromEntries(entries);
}
const latest=(a,b)=>!a?b:!b?a:Date.parse(a)>=Date.parse(b)?a:b;
function mergeMigration(remote,local){
 if(!remote)return local;
 const questions=new Map(remote.questions.map(q=>[q.id,q]));
 for(const q of local.questions){const old=questions.get(q.id);if(!old)questions.set(q.id,q);else if(q.status==='annulled')questions.set(q.id,{...old,status:'annulled'});}
 const attempts=new Map(remote.attempts.map(a=>[a.id,a]));
 for(const a of local.attempts)if(!attempts.has(a.id))attempts.set(a.id,a);
 const progress={...local.journey?.progress,...remote.journey?.progress};
 for(const topic of Object.keys(progress)){
  const a=remote.journey?.progress[topic]||{},b=local.journey?.progress[topic]||{};
  progress[topic]={read:!!(a.read||b.read),summary:!!(a.summary||b.summary),...(latest(a.reviewedAt,b.reviewedAt)?{reviewedAt:latest(a.reviewedAt,b.reviewedAt)}:{}),...(latest(a.completedAt,b.completedAt)?{completedAt:latest(a.completedAt,b.completedAt)}:{})};
 }
 const journey=remote.journey||local.journey;
 const sasReviews={...local.sasReviews,...remote.sasReviews};
 for(const id of Object.keys(sasReviews)){const a=remote.sasReviews?.[id],b=local.sasReviews?.[id];if(a&&b)sasReviews[id]=Date.parse(a.reviewedAt)>=Date.parse(b.reviewedAt)?a:b;}
 const readerA=remote.sasExamReader,readerB=local.sasExamReader;
 const exams={...readerB?.exams,...readerA?.exams};
 for(const id of Object.keys(exams)){
  const a=readerA?.exams[id],b=readerB?.exams[id];if(!a||!b)continue;
  const responses={...b.responses,...a.responses};
  for(const n of Object.keys(responses)){const x=a.responses[n],y=b.responses[n];if(x&&y)responses[n]=Date.parse(x.answeredAt)>=Date.parse(y.answeredAt)?x:y;}
  exams[id]={...(Date.parse(a.updatedAt)>=Date.parse(b.updatedAt)?a:b),responses};
 }
 const sasExamReader=readerA||readerB?{currentExam:(readerA||readerB).currentExam,exams}:undefined;
 return checkedState({...remote,...(sasExamReader?{sasExamReader}:{}),session:remote.session||local.session,sasSession:remote.sasSession||local.sasSession,sasReviews,questions:[...questions.values()],attempts:[...attempts.values()],checklist:{...local.checklist,...remote.checklist},...(journey?{journey:{currentTopic:journey.currentTopic,progress}}:{})});
}

export function createLocalStore(directory){
 const file=path.join(directory,'progresso.json'),previous=path.join(directory,'progresso-anterior.json');
 let pending=Promise.resolve();
 const serial=fn=>{const next=pending.catch(()=>{}).then(fn);pending=next;return next;};
 async function read(){
  let text;try{text=await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}
  try{const data=JSON.parse(text);if(data.format!=='enem-study'||!Number.isInteger(data.revision)||data.revision<1||!Array.isArray(data.migratedClients))throw new Error();data.state=checkedState(data.state);data.documents=checkedDocuments(data.documents);return data;}
  catch{throw new Error('O arquivo de progresso não pôde ser lido. A cópia anterior foi preservada; nenhum dado será substituído.');}
 }
 async function write(data,hasPrevious){
  const text=JSON.stringify(data);if(Buffer.byteLength(text)>200*1024*1024)throw new Error('O arquivo de estudo excede 200 MB.');
  await mkdir(directory,{recursive:true});
  await writeFile(file+'.tmp',text,'utf8');
  if(hasPrevious){await copyFile(file,previous+'.tmp');await rename(previous+'.tmp',previous);}
  await rename(file+'.tmp',file);
  return data;
 }
 return {
  file,
  read:()=>serial(read),
  migrate:(clientId,rawState,rawDocuments)=>serial(async()=>{
   if(typeof clientId!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(clientId))throw new Error('Identificação do navegador inválida.');
   const old=await read();if(old?.migratedClients.includes(clientId))return old;
   const state=checkedState(rawState),documents=checkedDocuments(rawDocuments);
   return write({format:'enem-study',revision:(old?.revision||0)+1,savedAt:new Date().toISOString(),migratedClients:[...(old?.migratedClients||[]),clientId],state:mergeMigration(old?.state,state),documents:{...documents,...old?.documents}},!!old);
  }),
  save:(revision,rawState,rawDocuments,replace=false)=>serial(async()=>{
   const old=await read();
   if(!old||revision!==old.revision){const e=new Error('Seu progresso mudou em outra aba ou navegador. Recarregue esta página para continuar com a versão atual.');e.status=409;throw e;}
   const state=rawState===undefined?old.state:checkedState(rawState);
   const documents=replace?checkedDocuments(rawDocuments):{...old.documents,...checkedDocuments(rawDocuments)};
   return write({...old,revision:old.revision+1,savedAt:new Date().toISOString(),state,documents},true);
  })
 };
}
