import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {assertBackup,letters} from '../src/domain';
import {edcleyExams} from '../src/edcley-exams';
import {mergeEdcleyProgress} from '../src/edcley-progress';
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
 const catalog=edcleyExams;
 assert.equal(catalog.length,19);
 assert.equal(catalog.reduce((total,exam)=>total+exam.questions.length,0),1364);
 assert.deepEqual(catalog.slice(0,4).map(exam=>exam.id),[
  'apostas-2026-parte-1','apostas-2026-parte-2','apostas-2026-parte-15','apostas-2026-parte-4',
 ]);
 assert.equal(catalog[2].title,'Apostas ENEM 2026 · Parte 3 · Matemática e Natureza');
 const review=catalog.find(exam=>exam.id==='revisao-2026-geral')!;
 assert.equal(review.questions.find(q=>q.number===75)?.sourceNumber,15);
 assert.equal(review.questions.find(q=>q.number===75)?.answer,4);
});

test('respostas do Capes vão para as questões equivalentes sem substituir respostas de Apostas',()=>{
 const state=initialState();
 state.edcleyExamReader={currentExam:'capes-2025-parte-1',exams:{
  'capes-2025-parte-1':{current:15,responses:{2:1,4:0,6:2,8:4,9:1,12:1,13:3,15:2,19:3}},
  'capes-2025-parte-4':{current:5,responses:{2:3,3:1,4:0,5:3,7:1,8:0,11:2,15:0,16:0}},
  'apostas-2026-parte-1':{current:14,responses:{14:2,17:0}},
 }};
 const merged=mergeEdcleyProgress(state);
 assert.deepEqual(merged.edcleyExamReader,{currentExam:'apostas-2026-parte-1',exams:{
  'apostas-2026-parte-1':{current:30,responses:{14:2,17:0,19:0,21:2,23:4,24:1,27:1,28:3,30:2,34:3}},
  'apostas-2026-parte-4':{current:45,responses:{30:0,43:3,44:1,45:3,47:1,48:0,51:2,55:0,56:0}},
 }});
 assertBackup(structuredClone(merged));
 assert.equal(mergeEdcleyProgress(merged),merged);
 assert.equal(state.edcleyExamReader.currentExam,'capes-2025-parte-1');
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
