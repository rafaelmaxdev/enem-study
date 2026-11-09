import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {assertBackup,letters} from '../src/domain';
import {edcleyExams} from '../src/edcley-exams';
import {initialState} from '../src/seed';

test('cadernos do Edcley têm IDs estáveis e questões com resolução e uma alternativa correta',()=>{
 assert.ok(edcleyExams.length>0);
 assert.equal(new Set(edcleyExams.map(exam=>exam.id)).size,edcleyExams.length);
 for(const exam of edcleyExams){
  assert.ok(exam.questions.length>0);
  assert.equal(new Set(exam.questions.map(q=>q.number)).size,exam.questions.length);
  for(const q of exam.questions){
   assert.ok(q.page>0&&q.number>0&&q.prompt.trim()&&q.explanation.trim());
   assert.ok(q.options.length>=4&&q.options.length<=letters.length);
   assert.equal(new Set(q.options).size,q.options.length);
   assert.ok(q.options.every(option=>option.trim()));
   assert.ok(Number.isInteger(q.answer)&&q.options[q.answer]);
   for(const image of [q.image,q.explanationImage])if(image)assert.ok(existsSync(new URL('../public'+image,import.meta.url)),image);
   if(q.imageOptions)assert.ok(q.image);
  }
 }
});

test('as quatro partes de 2026 mantêm a numeração do PDF e a seleção do segundo dia',()=>{
 const parts=[1,2,4,15].map(part=>edcleyExams.find(exam=>exam.id==='apostas-2026-parte-'+part)!);
 assert.deepEqual(parts.map(exam=>[exam.id,exam.questions.length]),[
  ['apostas-2026-parte-1',28],['apostas-2026-parte-2',34],
  ['apostas-2026-parte-4',44],['apostas-2026-parte-15',32],
 ]);
 assert.equal(parts[3].questions.find(q=>q.number===9)?.options.length,4);
 assert.ok(!parts[3].questions.some(q=>q.number===16));
});

test('as postagens do recorte têm um caderno por material e não duplicam a Parte 3',()=>{
 const catalog=edcleyExams.filter(exam=>!exam.id.startsWith('capes-'));
 assert.equal(catalog.length,19);
 assert.equal(catalog.reduce((total,exam)=>total+exam.questions.length,0),1364);
 assert.equal(catalog.find(exam=>exam.id==='apostas-2026-parte-15')?.title.includes('Partes 3 e 15'),true);
 const review=catalog.find(exam=>exam.id==='revisao-2026-geral')!;
 assert.equal(review.questions.find(q=>q.number===75)?.sourceNumber,15);
 assert.equal(review.questions.find(q=>q.number===75)?.answer,4);
});

test('backup mantém a alternativa A e rejeita respostas fora do gabarito',()=>{
 const state=initialState();
 const exam=edcleyExams[0],number=exam.questions[0].number;
 state.edcleyExamReader={currentExam:exam.id,exams:{[exam.id]:{current:number,responses:{[number]:0}}}};
 const backup=JSON.parse(JSON.stringify(state));
 assertBackup(backup);
 assert.deepEqual(backup.edcleyExamReader,state.edcleyExamReader);
 backup.edcleyExamReader!.exams[exam.id].responses[number]=5;
 assert.throws(()=>assertBackup(backup),/resposta inválida/);
});
