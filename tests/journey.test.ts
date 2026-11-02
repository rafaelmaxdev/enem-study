import {testState as initialState} from './fixtures';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {initialState as unusedInitialState,initialQuestions,systemQuestion} from '../src/seed';
import {topics,assertBackup,type Attempt} from '../src/domain';
import {lessons,topicStats,updateJourney,progressFor,practicePlan,practiceProgress,moduleComplete,nextLesson,syncJourneyCompletion,reviewDue} from '../src/journey';

test('a jornada cobre os49blocos com aulas completas, exemplos, resumos e fontes',()=>{
 const known=Object.entries(topics).flatMap(([subject,list])=>list.map(topic=>subject+':'+topic));
 assert.equal(lessons.length,49);assert.deepEqual(lessons.map(l=>l.subject+':'+l.topic).sort(),known.sort());
 const visuals=['system','proportion','graph','geometry','probability','circuit','energy','wave','matter','reaction','ecosystem','cell','genetics','statistics','triangle','exponential','hydrostatic','battery','orthographic','lens','division'];
 for(const l of lessons){
  assert.ok(l.title&&l.why&&l.minutes>0&&l.practiceTarget>=4&&l.practiceTarget<=14,l.topic);
  assert.ok(l.goals.length>=3&&l.sections.length>=3&&l.examples.length>=2&&l.summary.length>=4&&l.pitfalls.length>=2&&l.recall.length>=2,l.topic);
  assert.ok(l.sections.every(s=>s.text.length>=80),l.topic+' explicações insuficientes');
  assert.ok(l.examples.every(e=>e.prompt&&e.steps.length>=2&&e.steps.every(s=>s.title&&s.text)),l.topic+' exemplos incompletos');
  assert.ok(l.sources.length&&l.sources.every(s=>s.title&&new URL(s.url).protocol==='https:'),l.topic);
  if(l.visual)assert.ok(visuals.includes(l.visual),l.topic+' visual desconhecido');
  const check=(value:unknown)=>{if(typeof value==='string'){for(const m of value.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g))katex.renderToString(m[1]||m[2],{throwOnError:true});}else if(Array.isArray(value))value.forEach(check);else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(k==='math')katex.renderToString(String(v),{throwOnError:true});else check(v);}};
  check(l);
 }
});

test('ler aula e resumo não altera tentativas nem conclui domínio',()=>{
 const state=initialState(),before=structuredClone(state.attempts);
 const next=updateJourney(updateJourney(state,'Equações e Sistemas',{read:true}),'Equações e Sistemas',{summary:true});
 assert.deepEqual(next.attempts,before);assert.equal(next.checklist['Equações e Sistemas'],'Em estudo');
 assert.equal(topicStats(next,'Equações e Sistemas').strong,false);assert.equal(topicStats(next,'Equações e Sistemas').independent,0);
 assert.equal(progressFor(next,'Equações e Sistemas').summary,true);
 assertBackup(next);assert.equal(next.journey?.progress['Equações e Sistemas'].read,true);
 const bad=structuredClone(next);bad.journey!.progress['Equações e Sistemas'].reviewedAt='invalid';assert.throws(()=>assertBackup(bad));
});

test('evidência independente usa questões distintas e a última tentativa, sem contar ajuda desconhecida',()=>{
 const state=initialState(),qs=initialQuestions.filter(q=>q.topic==='Equações e Sistemas').slice(0,5);
 const row=(q:typeof qs[number],i:number):Attempt=>({id:'j-'+i,sessionId:'s-'+i,questionId:q.id,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:q.answer!,correct:true,date:new Date(Date.UTC(2026,9,29,10,i)).toISOString(),help:'none',annulled:false});
 state.attempts=qs.map(row);assert.equal(topicStats(state,'Equações e Sistemas').strong,true);
 const repeat={...row(qs[0],10),id:'repeat',correct:false,selected:(qs[0].answer!+1)%5};state.attempts.push(repeat);
 assert.equal(topicStats(state,'Equações e Sistemas').answered,5);assert.equal(topicStats(state,'Equações e Sistemas').accuracy,80);
 state.attempts.push({...row(qs[1],11),help:'hint'});assert.equal(topicStats(state,'Equações e Sistemas').strong,false);
});

test('prática tem assuntos corretos, quantidade limitada e dificuldades variadas disponíveis',()=>{
 const state=initialState();
 for(const l of lessons){const p=practicePlan(state,l);assert.ok(p.available>0,l.topic+' precisa ter questões');assert.ok(p.questions.length>0&&p.questions.length<=14&&p.questions.length<=p.available,l.topic);assert.equal(new Set(p.questions.map(q=>q.id)).size,p.questions.length);assert.ok(p.questions.every(q=>q.subject===l.subject&&q.topic===l.topic));assert.ok(p.questions.every(q=>q.source!=='official'||![2024,2025].includes(q.year!)));}
 const sis=lessons.find(l=>l.topic==='Equações e Sistemas')!,p=practicePlan(state,sis);
 assert.ok(new Set(p.questions.map(q=>q.difficulty)).size>=2);
 const errors=practicePlan(state,sis,'errors');assert.equal(errors.questions.length,1);assert.equal(errors.questions[0].id,'SIS-03');
});

test('revisão usa tempo decorrido sem alterar notas e aceita backups antigos sem jornada',()=>{
 const state=initialState();assertBackup(state);
 const stamp='2026-10-29T12:00:00Z';assert.throws(()=>updateJourney(state,'Ecologia',{read:true,summary:true,completedAt:stamp}));
 const lesson=lessons.find(l=>l.topic==='Equações e Sistemas')!;
 state.attempts=state.questions.filter(q=>q.topic===lesson.topic&&q.status==='ready'&&!(q.source==='official'&&[2024,2025].includes(q.year!))).slice(0,lesson.practiceTarget).map((q,i)=>({id:'complete-'+i,sessionId:'complete',questionId:q.id,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:q.answer!,correct:true,date:stamp,help:'none',annulled:false}));
 const next=updateJourney(state,'Equações e Sistemas',{read:true,summary:true,completedAt:stamp});
 assert.equal(reviewDue(next,'Equações e Sistemas',Date.parse(stamp)+86400000),false);
 assert.equal(reviewDue(next,'Equações e Sistemas',Date.parse(stamp)+2*86400000),true);
 const updated=updateJourney(next,'Equações e Sistemas',{reviewedAt:'2026-10-31T12:00:00Z'});
 assert.equal(reviewDue(updated,'Equações e Sistemas',Date.parse('2026-10-31T13:00:00Z')),false);
 assert.deepEqual(next.attempts,state.attempts);
});

test('arredondamento não transforma menos de80%em boa evidência',()=>{
 const state=initialState();state.questions=Array.from({length:49},(_,i)=>systemQuestion('ratio-'+i,30+i*5,40));
 state.attempts=state.questions.map((q,i)=>({id:'ratio-attempt-'+i,sessionId:'ratio',questionId:q.id,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:i<39?q.answer!:(q.answer!+1)%5,correct:i<39,date:'2026-10-29T10:00:00Z',help:'none',annulled:false}));
 assert.equal(topicStats(state,'Equações e Sistemas').accuracy,79.6);
 assert.equal(topicStats(state,'Equações e Sistemas').strong,false);
});


test('a prática parcial não conclui o módulo e a rodada pode ser retomada mesmo após sair',()=>{
 const state=initialState(),lesson=lessons.find(l=>l.topic==='Equações e Sistemas')!;
 const ids=practicePlan(state,lesson).questions.map(q=>q.id);
 state.session={id:'partial',questionIds:ids,submitted:{[ids[0]]:true},answers:{[ids[0]]:0},help:{},index:1,finished:true};
 const p=practiceProgress(state,lesson);
 assert.equal(p.resumable,true);assert.equal(p.complete,false);assert.ok(p.remaining>0);
 assert.throws(()=>updateJourney(state,lesson.topic,{read:true,summary:true,completedAt:new Date().toISOString()}));
 state.session.submitted=Object.fromEntries(ids.map(id=>[id,true]));
 assert.equal(practiceProgress(state,lesson).resumable,false);
});


test('conclusão automática usa tentativas antigas sem exigir leitura, preserva notas e sugere o próximo módulo',()=>{
 const state=initialState(),lesson=lessons.find(l=>l.topic==='Equações e Sistemas')!;
 const qs=practicePlan(state,lesson).questions;
 state.attempts=qs.map((q,i)=>({id:'auto-'+i,sessionId:'auto',questionId:q.id,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:i?q.answer!:(q.answer!+1)%5,correct:!!i,date:'2026-10-31T12:00:00Z',help:'none',annulled:false}));
 const before=structuredClone(state.attempts),next=syncJourneyCompletion(state);
 assert.equal(moduleComplete(next,lesson),true);assert.equal(next.checklist[lesson.topic],'Concluído');
 assert.equal(progressFor(next,lesson.topic).read,undefined);assert.equal(progressFor(next,lesson.topic).summary,undefined);
 assert.equal(progressFor(next,lesson.topic).completedAt,'2026-10-31T12:00:00Z');
 assert.deepEqual(next.attempts,before);assert.equal(syncJourneyCompletion(next),next);
 assert.equal(nextLesson(next,lesson.topic)?.topic,'Operações e notação científica');
 assert.ok(topicStats(next,lesson.topic).errors.length>0);
});
test('próximo módulo pula concluídos na ordem da jornada e termina sem reiniciar',()=>{
 const state=initialState(),first=lessons.find(l=>l.topic==='Equações e Sistemas')!;
 state.journey={currentTopic:first.topic,progress:Object.fromEntries(lessons.map(l=>[l.topic,{completedAt:'2026-10-31T12:00:00Z'}]))};
 assert.equal(nextLesson(state,first.topic),null);
 delete state.journey.progress['Porcentagem e juros'];
 assert.equal(nextLesson(state,first.topic)?.topic,'Porcentagem e juros');
});
