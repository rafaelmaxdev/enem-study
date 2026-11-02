import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLocalStore} from '../local-store.mjs';
import {initialState} from '../src/seed';
import {sasProgress,startSasSession} from '../src/sas';
import {subjects,recordAnswer,assertBackup,annulQuestion,type State} from '../src/domain';

function answerFirst(state:State){
 const session=state.sasSession!,q=state.questions.find(q=>q.id===session.questionIds[0])!;
 return {...recordAnswer(state,q,session,q.answer!,'none'),sasSession:{...session,answers:{...session.answers,[q.id]:q.answer!},submitted:{...session.submitted,[q.id]:true}}};
}
test('banco SAS contém todos os 80 itens disponíveis, com contagem por matéria sem duplicatas',()=>{
 const state=initialState(),all=sasProgress(state);
 assert.equal(all.total,80);assert.equal(all.pending.length,80);
 assert.equal(subjects.reduce((sum,subject)=>sum+sasProgress(state,subject).total,0),80);
 const next=startSasSession(state,'Todas','sas-all');
 assert.equal(next.sasSession!.questionIds.length,80);assert.equal(new Set(next.sasSession!.questionIds).size,80);
 assert.ok(all.questions.every(q=>q.documentId==='sas-2023-06'));
});
test('pausa preserva alternativa, ajuda e ponto de parada sem alterar a sessão dos módulos',()=>{
 const state=initialState();state.session={id:'module',questionIds:['SIS-01'],index:0,answers:{},submitted:{},help:{},finished:false};
 const next=startSasSession(state,'Física','sas-physics'),session=next.sasSession!;
 session.index=1;const id=session.questionIds[1];session.answers[id]=2;session.help[id]='hint';
 const resumed=startSasSession(structuredClone(next),'Física','unused-new-id');
 assert.deepEqual(resumed.sasSession,session);assert.deepEqual(resumed.session,state.session);
 assertBackup(resumed);assert.equal(resumed.sasSession!.answers[id],2);
});
test('trocar matéria/todas não repete questões respondidas, inclusive respostas da Jornada',()=>{
 const state=answerFirst(startSasSession(initialState(),'Matemática','sas-math'));
 const answeredId=state.sasSession!.questionIds[0];
 const all=startSasSession(state,'Todas','sas-all');
 assert.equal(sasProgress(all).answered,1);assert.ok(!all.sasSession!.questionIds.includes(answeredId));
 const math=startSasSession(all,'Matemática','sas-math-2');
 assert.ok(!math.sasSession!.questionIds.includes(answeredId));
 assert.ok(math.sasSession!.questionIds.every(id=>math.questions.find(q=>q.id===id)?.subject==='Matemática'));
 const removed=annulQuestion(math,math.sasSession!.questionIds[0]);
 assert.equal(sasProgress(removed).total,79);
});
test('terminar o banco não reinicia uma rodada nem inclui exercícios de outras fontes',()=>{
 let state=startSasSession(initialState(),'Todas','sas-complete');
 for(const id of state.sasSession!.questionIds){const q=state.questions.find(q=>q.id===id)!;state=recordAnswer(state,q,state.sasSession!,q.answer!,'none');}
 assert.equal(sasProgress(state).pending.length,0);assert.equal(sasProgress(state).answered,80);
 assert.equal(startSasSession(state,'Todas','never'),state);
 const bad=structuredClone(state);bad.sasSession!.questionIds=['SIS-01'];assert.throws(()=>assertBackup(bad));
});
test('arquivo local e migração entre navegadores preservam a sessão SAS separada',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-sas-'));
 try{
  const state=answerFirst(startSasSession(initialState(),'Química','sas-local'));
  const store=createLocalStore(dir);await store.migrate('browser-a',state,{});
  const loaded=await createLocalStore(dir).read();assert.deepEqual(loaded!.state.sasSession,state.sasSession);
  const merged=await store.migrate('browser-b',initialState(),{});assert.deepEqual(merged.state.sasSession,state.sasSession);
  assert.equal(sasProgress(merged.state,'Química').answered,1);
 }finally{const target=path.resolve(dir);assert.ok(target.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(target).startsWith('enem-'));await rm(target,{recursive:true,force:true});}
});
