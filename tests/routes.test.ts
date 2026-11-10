import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readRoute,routePath} from '../src/routes';
import {lessons,nextLesson,syncJourneyCompletion} from '../src/journey';
import {initialState} from '../src/seed';
import {splitMath} from '../src/math-text';
test('endereços abrem páginas, assuntos e abas diretamente',()=>{
 for(const page of ['contents','study','library','performance','settings','sas','sasPractice','sasExams','edcleyExams','officialExams'] as const){const r={page,topic:null,tab:'learn' as const};assert.deepEqual(readRoute(routePath(r)),r);}
 for(const lesson of lessons)for(const tab of ['learn','summary','practice'] as const){const r={page:'contents' as const,topic:lesson.topic,tab};assert.deepEqual(readRoute(routePath(r)),r);}
 assert.equal(readRoute('/jornada/inexistente').topic,null);
});
test('link compartilhado do Edcley identifica o caderno e a questão',()=>{
 const route={page:'edcleyExams',topic:null,tab:'learn',edcleyQuestion:{examId:'apostas-2026-parte-1',number:4}} as const;
 const address=routePath(route);
 assert.equal(address,'/simulados-edcley/apostas-2026-parte-1/4');
 assert.deepEqual(readRoute(address),route);
 assert.equal(readRoute('/simulados-edcley/apostas-2026-parte-1/0').edcleyQuestion,undefined);
});
test('preços em reais permanecem texto e fórmulas continuam separadas',()=>{
 const prices='A simples custa R$ 12 e a estampada R$ 18. Total R$ 222.';
 assert.deepEqual(splitMath(prices),[prices]);
 assert.deepEqual(splitMath('R$ 12 e $x+y=15$; R$ 18.'),['R$ 12 e ','$x+y=15$','; R$ 18.']);
 assert.deepEqual(splitMath('Veja $$x=2$$.'),['Veja ','$$x=2$$','.']);
});

test('avançar após as cinco questões de operações abre o próximo módulo pendente',()=>{
 const state=initialState(),topic='Operações e notação científica';
 const ids=['inep-2022-d2-c7-175','inep-2022-d2-c7-144','sas-2023-06-149','sas-2023-06-142','inep-2022-d2-c7-148'];
 state.attempts=ids.map((id,i)=>{const q=state.questions.find(q=>q.id===id)!;return {id:'advance-'+i,sessionId:'done',questionId:id,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:q.answer!,correct:true,date:'2026-10-31T12:00:00Z',help:'none' as const,annulled:false};});
 const saved=syncJourneyCompletion(state),next=nextLesson(saved,topic)!;
 assert.equal(saved.checklist[topic],'Concluído');assert.equal(next.topic,'Porcentagem e juros');
 const target={page:'contents' as const,topic:next.topic,tab:'learn' as const};
 assert.equal(routePath(target),'/jornada/porcentagem-e-juros/aprender');assert.deepEqual(readRoute(routePath(target)),target);
});
