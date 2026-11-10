import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import catalog from '../src/official-exams.json';
import explanationIndex from '../src/official-exam-explanations.json';
import officialQuestions from '../src/official.json';
import expansion2022 from '../src/expansion-2022.json';
import {assertBackup} from '../src/domain';
import {initialState} from '../src/seed';

test('cada edição tem Matemática e Natureza com numeração, páginas e gabaritos do caderno azul',()=>{
 assert.equal(catalog.length,18);
 for(let year=2017;year<=2025;year++){
  const editions=catalog.filter(exam=>exam.year===year);
  assert.deepEqual(editions.map(exam=>exam.area).sort(),['matematica','natureza']);
  for(const exam of editions){
   const math=exam.area==='matematica';
   assert.equal(exam.day,2);
   assert.equal(exam.first,math?136:91);
   assert.match(exam.answers,/^[A-E-]{45}$/);
   assert.equal(exam.pages.length,45);
   assert.ok(exam.accuracy>0&&exam.accuracy<100);
   for(const page of exam.pages)assert.ok(existsSync(new URL(`../public/enem-oficial/${year}-${exam.day}-${page}.webp`,import.meta.url)));
  }
 }
 const toughest=(area:string)=>catalog.filter(exam=>exam.area===area).sort((a,b)=>a.accuracy-b.accuracy)[0];
 assert.equal(toughest('matematica').year,2019);
 assert.equal(toughest('natureza').year,2018);
 assert.equal(catalog.find(exam=>exam.year===2022&&exam.area==='matematica')?.answers[157-136],'-');
});

test('backup preserva respostas das provas oficiais separadamente das demais',()=>{
 const state=initialState();
 state.officialExamReader={currentExam:'2019-matematica',exams:{'2019-matematica':{current:136,responses:{136:0}}}};
 const restored=structuredClone(state);
 assertBackup(restored);
 assert.deepEqual(restored.officialExamReader,state.officialExamReader);
 restored.officialExamReader!.exams['2019-matematica'].responses[136]=5;
 assert.throws(()=>assertBackup(restored),/provas do ENEM.*resposta inválida/);
});

test('resoluções levam à questão correspondente na Plataforma Assaad',()=>{
 assert.equal(catalog.flatMap(exam=>exam.solutions).filter(Boolean).length,809);
 for(const exam of catalog){
  assert.equal(exam.solutions.length,45);
  for(const [index,slug] of exam.solutions.entries()){
   if(slug===null){
    assert.equal(exam.answers[index],'-');
    continue;
   }
   const number=slug.match(/^questao-(\d+)-/);
   assert.ok(number);
   assert.ok(slug.includes(String(exam.year)));
   if(exam.year===2025){
    assert.ok(slug.includes('caderno-amarelo'));
    assert.ok(Number(number[1])>=exam.first&&Number(number[1])<exam.first+45);
   }else{
    assert.ok(slug.includes('caderno-azul'));
    assert.equal(Number(number[1]),exam.first+index);
   }
  }
 }
 const math2025=catalog.find(exam=>exam.year===2025&&exam.area==='matematica')!;
 assert.equal(math2025.solutions[0],'questao-146-caderno-amarelo-enem-2025-dia-2');
});

test('índice de resoluções até 2024 só aponta para questões válidas',()=>{
 const localQuestions=new Map([...officialQuestions,...expansion2022].map(q=>[q.id,q]));
 const offsets=new Set<number>();
 assert.equal(Object.keys(explanationIndex).length,16);
 for(const exam of catalog){
  const entries=explanationIndex[`${exam.year}-${exam.area}` as keyof typeof explanationIndex];
  if(exam.year>2024){
   assert.equal(entries,undefined);
   continue;
  }
  assert.equal(entries.length,45);
  assert.ok(entries.some(entry=>entry!==null));
  for(const [index,entry] of entries.entries()){
   if(entry===null)continue;
   assert.match(exam.answers[index],/^[A-E]$/);
   if(typeof entry==='number'){
    assert.ok(Number.isSafeInteger(entry)&&entry>=0&&!offsets.has(entry));
    offsets.add(entry);
   }else{
    const question=localQuestions.get(entry);
    assert.ok(question?.steps.length);
    assert.equal(question.year,exam.year);
    assert.equal('ABCDE'[question.answer],exam.answers[index]);
    if(question.url===exam.pdf)assert.equal(question.number,exam.first+index);
   }
  }
 }
});
