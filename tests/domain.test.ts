import {testState as initialState} from './fixtures';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validQuestion,availableQuestion,solveSystem,recordAnswer,scoredAttempts,annulQuestion,selectQuestions,dedupe,assertBackup,practiceFamily,type Session} from '../src/domain';
import {initialQuestions,initialState as unusedInitialState,systemQuestion,mergeBundledQuestions} from '../src/seed';
test('todo o banco inicial tem dados completos e uma resposta registrada',()=>{assert.ok(initialQuestions.length>40);for(const q of initialQuestions)assert.ok(validQuestion(q),q.id);assert.equal(new Set(initialQuestions.map(q=>q.id)).size,initialQuestions.length);});
test('kits antigos fracionários são rejeitados; sistemas sem resposta única também',()=>{for(const s of[{a:3,b:2,c:160,d:2,e:5,f:190},{a:4,b:2,c:180,d:3,e:5,f:210},{a:1,b:1,c:10,d:2,e:2,f:20}])assert.throws(()=>solveSystem({...s,type:'system',integer:true,target:'x'}));});
test('gerador confere integralidade, totais e alternativa única em muitas combinações',()=>{for(let x=20;x<120;x+=5)for(let y=10;y<70;y+=5){const q=systemQuestion('test',x,y);assert.ok(validQuestion(q));assert.deepEqual(solveSystem(q.certificate!),{x,y});}});
test('mesma submissão não duplica; uma nova sessão pode repetir questão',()=>{const state=initialState(),q=state.questions[0];const s:Session={id:'new',questionIds:[q.id],answers:{},submitted:{},help:{},index:0,finished:false};const once=recordAnswer(state,q,s,0,'none'),twice=recordAnswer(once,q,s,0,'none');assert.equal(once.attempts.length,state.attempts.length+1);assert.equal(twice.attempts.length,once.attempts.length);assert.equal(recordAnswer(twice,q,{...s,id:'another'},0,'none').attempts.length,once.attempts.length+1);});
test('retirar questão elimina todas as suas tentativas do desempenho',()=>{const state=initialState();assert.equal(scoredAttempts(state).length,3);const next=annulQuestion(state,'SIS-03');assert.equal(scoredAttempts(next).length,2);assert.equal(next.attempts.find(a=>a.questionId==='SIS-03')?.annulled,true);});
test('seleção exclui rascunhos e questões retiradas, prioriza fontes oficiais',()=>{const state=initialState();const all=selectQuestions(state.questions,{subject:'Todas',topic:'Todos',source:'all',difficulty:'Misturada',count:20});assert.equal(all.length,20);assert.equal(all[0].source,'official');const altered=state.questions.map(q=>({...q,status:'draft' as const}));assert.equal(selectQuestions(altered,{subject:'Todas',topic:'Todos',source:'all',difficulty:'Misturada',count:20}).length,0);});
test('alternativas duplicadas e incompatibilidade do certificado impedem exibição',()=>{const q=systemQuestion('test',30,40);assert.equal(validQuestion({...q,options:['30','30','35','40','45']}),false);assert.equal(validQuestion({...q,answer:1}),false);assert.equal(validQuestion({...q,status:'draft'}),false);});
test('backup malformado não substitui dados; backup válido recalcula correção',()=>{assert.throws(()=>assertBackup({version:1}));const state=initialState();state.attempts[0].correct=false;assertBackup(state);assert.equal(state.attempts[0].correct,true);});
test('questões repetidas são eliminadas',()=>{const q=initialQuestions[0];assert.equal(dedupe([q,{...q,id:'different-id'}]).length,1);});

test('atualização do banco preserva tentativas, progresso, questões próprias e exclusões',()=>{
 const saved=initialState();
 const custom=systemQuestion('my-question',75,45);saved.questions=[...saved.questions.filter(q=>q.source!=='pdf'),custom];
 saved.questions[0]={...saved.questions[0],status:'annulled'};
 const attempts=structuredClone(saved.attempts),checklist=structuredClone(saved.checklist);
 const updated=mergeBundledQuestions(saved),again=mergeBundledQuestions(updated);
 assert.deepEqual(updated.attempts,attempts);assert.deepEqual(updated.checklist,checklist);
 assert.equal(updated.questions.find(q=>q.id===custom.id),custom);
 assert.equal(updated.questions.find(q=>q.id===saved.questions[0].id)?.status,'annulled');
 assert.deepEqual(again,updated);
 assert.equal(updated.questions.filter(q=>q.documentId==='sas-2023-06').length,initialQuestions.filter(q=>q.documentId==='sas-2023-06').length);
});

test('preferência por evitar ENEM 2024 e 2025 não apaga nem invalida o histórico',()=>{
 const state=initialState(),old=state.questions.find(q=>q.source==='official'&&q.year===2024)!;
 assert.ok(validQuestion(old));assert.equal(availableQuestion(old),false);
 const session:Session={id:'old-exam',questionIds:[old.id],answers:{},submitted:{},help:{},index:0,finished:false};
 const withHistory=recordAnswer(state,old,session,old.answer!,'none');
 assert.ok(scoredAttempts(withHistory).some(a=>a.questionId===old.id));
 const pool=selectQuestions(state.questions,{subject:'Todas',topic:'Todos',source:'all',difficulty:'Misturada',count:1000});
 assert.ok(pool.every(q=>q.source!=='official'||![2024,2025].includes(q.year!)));
});

test('PDFs locais aceitam somente endereços e imagens conhecidos, sem caminhos externos ou travessia',()=>{
 const q=initialQuestions.find(q=>q.documentId==='sas-2023-06');assert.ok(q,'O simulado deve estar incluído.');
 assert.ok(validQuestion(q));
 for(const url of ['/sas/../secret.pdf','/sas/evil.pdf?redirect=https://example.com','file:///C:/secret.pdf','//evil.com/test.pdf'])assert.equal(validQuestion({...q,url}),false,url);
 assert.equal(validQuestion({...q,images:['/sas/../secret.webp']}),false);
});


test('seleção limita a duas variações de um mesmo sistema, mesmo com números e materiais diferentes',()=>{
 const qs=Array.from({length:12},(_,i)=>systemQuestion('variant-'+i,30+i*5,40,3+i,2,2,5));
 const chosen=selectQuestions(qs,{subject:'Matemática',topic:'Equações e Sistemas',source:'all',difficulty:'Misturada',count:10});
 assert.equal(chosen.length,2);assert.equal(new Set(chosen.map(practiceFamily)).size,1);
});
test('rodada antiga é encurtada sem apagar respostas, tentativas ou mudar o gabarito',()=>{
 const state=initialState();const qs=state.questions.filter(q=>q.id.startsWith('system-')).slice(0,10);
 state.session={id:'old-round',questionIds:qs.map(q=>q.id),submitted:{[qs[0].id]:true,[qs[1].id]:true,[qs[2].id]:true},answers:{[qs[0].id]:2,[qs[1].id]:1,[qs[2].id]:2},help:{},index:3,finished:false};
 const next=mergeBundledQuestions(state);
 assert.deepEqual(next.attempts,state.attempts);assert.deepEqual(next.session!.answers,state.session.answers);
 assert.deepEqual(next.session!.questionIds,qs.slice(0,3).map(q=>q.id));assert.equal(next.session!.finished,true);
 assert.deepEqual(mergeBundledQuestions(next),next);
});
