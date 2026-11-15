import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import lists from '../src/math-ebook.json';
import {assertBackup,letters} from '../src/domain';
import {initialState} from '../src/seed';

test('as 84 listas do e-book têm 563 questões com gabarito e resolução',()=>{
 assert.equal(lists.length,84);
 assert.equal(lists.flatMap(list=>list.questions).length,563);
 assert.equal(lists[0].questions.map(question=>letters[question.answer]).join(''),'DDADEAD');
 for(const [listIndex,list] of lists.entries()){
  assert.ok(list.title&&list.questions.length>0);
  for(const [questionIndex,question] of list.questions.entries()){
   const prefix=`qp-${String(listIndex+1).padStart(2,'0')}-${String(questionIndex+1).padStart(2,'0')}`;
   assert.ok(letters[question.answer]);
   for(const [kind,files] of [['q',question.question],['r',question.solution]] as const){
    assert.ok(files.length>0);
    for(const [index,file] of files.entries()){
     assert.equal(file,`${prefix}-${kind}-${index+1}.webp`);
     assert.ok(existsSync(new URL(`../public/codigo-enem/${file}`,import.meta.url)));
    }
   }
  }
 }
});

test('o backup preserva o progresso do e-book',()=>{
 const state=initialState();
 state.mathEbookReader={currentExam:'qp-01',exams:{'qp-01':{current:1,responses:{1:3}}}};
 const restored=structuredClone(state);
 assertBackup(restored);
 assert.deepEqual(restored.mathEbookReader,state.mathEbookReader);
});
