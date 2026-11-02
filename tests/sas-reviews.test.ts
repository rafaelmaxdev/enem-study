import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {initialState} from '../src/seed';
import {recordAnswer,scoredAttempts,annulQuestion,assertBackup,type State,type Session} from '../src/domain';
import {sasProgress,sasErrors,markSasReviewed} from '../src/sas';
import {createLocalStore} from '../local-store.mjs';

function wrong(state=initialState(),id='error-1'){
 const q=sasProgress(state,'Biologia').questions[0];
 const session:Session={id,questionIds:[q.id],answers:{},submitted:{},help:{},index:0,finished:false};
 return {state:recordAnswer(state,q,session,(q.answer!+1)%5,'none'),question:q};
}
test('erros SAS anteriores são recuperados com filtro por matéria, sem misturar exercícios de outras fontes',()=>{
 const {state,question}=wrong();
 assert.equal(sasErrors(state).pending.length,1);assert.equal(sasErrors(state,'Biologia').pending[0].question.id,question.id);
 assert.equal(sasErrors(state,'Matemática').pending.length,0);assert.equal(sasErrors(state).resolved.length,0);
 assert.equal(sasErrors(annulQuestion(state,question.id)).pending.length,0);
});
test('check move para resolvidos e desmarcar devolve, preservando notas e a fila da sessão',()=>{
 const {state,question}=wrong();const attempts=structuredClone(scoredAttempts(state));
 const resolved=markSasReviewed(state,question.id,true,'2026-10-31T20:00:00Z');
 assert.equal(sasErrors(resolved).pending.length,0);assert.equal(sasErrors(resolved).resolved[0].question.id,question.id);
 assert.deepEqual(scoredAttempts(resolved),attempts);assert.deepEqual(resolved.sasSession,state.sasSession);
 const reopened=markSasReviewed(resolved,question.id,false,'2026-10-31T20:01:00Z');
 assert.equal(sasErrors(reopened).pending.length,1);assert.equal(sasErrors(reopened).resolved.length,0);
 assert.equal(markSasReviewed(state,'SIS-01',true),state);
});
test('um novo erro reabre o item resolvido e tentativas repetidas não duplicam cartões',()=>{
 const first=wrong(),reviewed=markSasReviewed(first.state,first.question.id,true);
 const second=wrong(reviewed,'error-2').state;
 assert.equal(sasErrors(second).pending.length,1);assert.equal(sasErrors(second).resolved.length,0);
 const correctSession:Session={id:'correct-later',questionIds:[first.question.id],answers:{},submitted:{},help:{},index:0,finished:false};
 const corrected=recordAnswer(second,first.question,correctSession,first.question.answer!,'none');
 // Resolution is an explicit checklist action; a correct retry does not erase the previous error.
 assert.equal(sasErrors(corrected).pending.length,1);
 const fixed=markSasReviewed(corrected,first.question.id,true);assert.equal(sasErrors(fixed).resolved.length,1);
 const bad=structuredClone(fixed);bad.sasReviews![first.question.id].attemptId='missing';assert.throws(()=>assertBackup(bad));
 const invalid=structuredClone(fixed);invalid.sasReviews![first.question.id].reviewedAt='invalid';assert.throws(()=>assertBackup(invalid));
 assertBackup(structuredClone(fixed));
});
test('revisões persistem no arquivo e backup; migração respeita a alteração mais recente',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-reviews-'));
 try{
  const first=wrong(),resolved=markSasReviewed(first.state,first.question.id,true,'2026-10-31T20:00:00Z');
  const store=createLocalStore(dir);const profile=await store.migrate('browser-a',resolved,{});
  const loaded=await createLocalStore(dir).read();assert.equal(sasErrors(loaded!.state).resolved.length,1);
  const reopened=markSasReviewed(loaded!.state,first.question.id,false,'2026-10-31T20:01:00Z');
  await store.save(profile.revision,reopened,{});
  const merged=await store.migrate('browser-b',resolved,{});assert.equal(sasErrors(merged.state).pending.length,1);
  const backup=structuredClone(merged.state);assertBackup(backup);assert.deepEqual(backup.sasReviews,merged.state.sasReviews);
 }finally{const target=path.resolve(dir);assert.ok(target.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(target).startsWith('enem-'));await rm(target,{recursive:true,force:true});}
});
