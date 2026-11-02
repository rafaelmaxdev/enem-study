import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {sasExams,examProgress,saveExamProgress,examCounts,examComplete,yearCompletion} from '../src/sas-exams';
import {initialState} from '../src/seed';
import {assertBackup} from '../src/domain';
import {createLocalStore} from '../local-store.mjs';
import pagePreviews from '../src/sas-page-previews.json';

test('PDFs grandes têm uma imagem leve e íntegra para cada página do leitor',async()=>{
 for(const e of sasExams)for(const [url,pages] of [[e.proofURL,e.proofPages],[e.resolutionURL,e.resolutionPageCount]] as const){
  if((await stat(path.join('public',url))).size<=8_000_000)continue;
  const base=(pagePreviews as Record<string,string>)[url];assert.ok(base);
  for(let page=1;page<=pages;page++){
   const image=await readFile(path.join('public',`${base}-${page}.webp`));
   assert.equal(image.subarray(0,4).toString(),'RIFF');assert.equal(image.subarray(8,12).toString(),'WEBP');
   assert.ok(image.length>1000&&image.length<2_000_000);
  }
 }
});

test('19 cadernos têm pares de PDFs, 90 chaves e páginas dentro dos limites',async()=>{
 assert.equal(sasExams.length,19);
 assert.deepEqual([2020,2021,2022].map(y=>sasExams.filter(e=>e.year===y).length),[7,6,6]);
 for(const e of sasExams){
  assert.deepEqual(e.questions.map(q=>q.number),Array.from({length:90},(_,i)=>i+91));
  for(const url of [e.proofURL,e.resolutionURL])assert.equal((await readFile(path.join('public',url))).subarray(0,5).toString(),'%PDF-');
  for(const q of e.questions){assert.ok(q.answer!==null&&q.answer>=0&&q.answer<=4);assert.ok(q.proofPage===null||q.proofPage>=1&&q.proofPage<=e.proofPages);assert.ok(q.resolutionPages.length&&q.resolutionPages.every(p=>p>=1&&p<=e.resolutionPageCount));if(e.resolutionPageCount===90)assert.deepEqual(q.resolutionPages,[q.number-90]);}
 }
});
test('acompanhamento mantém respostas e revisões sem modificar sessões e tentativas',()=>{
 const state=initialState(),exam=sasExams[0],p=examProgress(state,exam),answer=exam.questions[0].answer!;
 const next=saveExamProgress(state,exam.id,{...p,current:92,responses:{91:{selected:answer,answeredAt:'2026-11-01T12:00:00Z'},92:{selected:(exam.questions[1].answer!+1)%5,answeredAt:'2026-11-01T12:01:00Z'}}});
 assert.deepEqual(next.attempts,state.attempts);assert.equal(next.session,state.session);assert.equal(next.sasSession,state.sasSession);
 assert.deepEqual(examCounts(exam,examProgress(next,exam)),{answered:2,correct:1,errors:1});
 next.sasExamReader!.exams[exam.id].responses[92].reviewed=true;
 assert.equal(examCounts(exam,examProgress(next,exam)).errors,0);
 const restored=structuredClone(next);assertBackup(restored);assert.deepEqual(restored.sasExamReader,next.sasExamReader);
 for(const corrupt of [()=>{restored.sasExamReader!.exams[exam.id].current=181;},()=>{restored.sasExamReader!.exams[exam.id].current=92;restored.sasExamReader!.exams[exam.id].responses[92].selected=5;}]){corrupt();assert.throws(()=>assertBackup(restored));}
});
test('salvamento local e migração entre navegadores preservam respostas de ambos',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'enem-reader-'));
 try{
  const exam=sasExams[0],state=initialState(),p=examProgress(state,exam);
  const a=saveExamProgress(state,exam.id,{...p,current:92,updatedAt:'2026-11-01T12:00:00Z',responses:{91:{selected:0,answeredAt:'2026-11-01T12:00:00Z'}}});
  const store=createLocalStore(directory),first=await store.migrate('reader-a',a,{});
  const b=saveExamProgress(state,exam.id,{...p,current:93,updatedAt:'2026-11-01T13:00:00Z',responses:{92:{selected:1,answeredAt:'2026-11-01T13:00:00Z'}}});
  const merged=await store.migrate('reader-b',b,{});
  assert.equal(merged.state.sasExamReader!.exams[exam.id].current,93);
  assert.equal(Object.keys(merged.state.sasExamReader!.exams[exam.id].responses).length,2);
  const saved=await store.save(merged.revision,merged.state);
  assert.deepEqual((await createLocalStore(directory).read())!.state.sasExamReader,saved.state.sasExamReader);
  assert.deepEqual(merged.state.attempts,first.state.attempts);
 }finally{assert.ok(directory.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(directory).startsWith('enem-reader-'));await rm(directory,{recursive:true,force:true});}
});


test('conclusão do simulado exige cada questão respondida, sem transformar revisão em acerto',()=>{
 const state=initialState(),exam=sasExams[0],progress=examProgress(state,exam);
 assert.equal(examComplete(state,exam),false);
 progress.responses=Object.fromEntries(exam.questions.slice(0,-1).map(q=>[q.number,{selected:(q.answer!+1)%5,answeredAt:'2000-01-01T00:00:00Z',reviewed:true}]));
 let saved=saveExamProgress(state,exam.id,progress);assert.equal(examComplete(saved,exam),false);
 progress.responses[180]={selected:(exam.questions[89].answer!+1)%5,answeredAt:'2000-01-01T00:00:00Z',reviewed:true};
 saved=saveExamProgress(state,exam.id,progress);
 assert.equal(examComplete(saved,exam),true);assert.equal(examCounts(exam,progress).correct,0);assert.equal(examCounts(exam,progress).answered,90);
 delete progress.responses[103];progress.responses[999]={selected:0,answeredAt:'2000-01-01T00:00:00Z'};
 assert.equal(examComplete(saveExamProgress(state,exam.id,progress),exam),false);
 assert.deepEqual(state.attempts,saved.attempts);
});
test('check do ano exige todos os seus simulados e ignora conclusões de outros anos',()=>{
 let state=initialState();assert.deepEqual(yearCompletion(state,2020),{completed:0,total:7});
 const finish=(id:string)=>{const exam=sasExams.find(e=>e.id===id)!;state=saveExamProgress(state,id,{...examProgress(state,exam),responses:Object.fromEntries(exam.questions.map(q=>[q.number,{selected:q.answer!,answeredAt:'2000-01-01T00:00:00Z'}]))});};
 finish('sas-2020-01');finish('sas-2021-01');assert.deepEqual(yearCompletion(state,2020),{completed:1,total:7});
 for(const exam of sasExams.filter(e=>e.year===2020))finish(exam.id);
 assert.deepEqual(yearCompletion(state,2020),{completed:7,total:7});assert.deepEqual(yearCompletion(state,2021),{completed:1,total:6});
});
