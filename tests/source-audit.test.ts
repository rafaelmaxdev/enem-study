import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialQuestions} from '../src/seed';
import {validQuestion} from '../src/domain';
const json=(file:string)=>JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'));

test('a contagem SAS corresponde a um único simulado com90revisões e80itens incluídos',()=>{
 const reviewed=json('tests/fixtures/sas-review.json') as {number:number;valid:boolean}[];
 const summary=json('tests/fixtures/sas-summary.json');
 const used=initialQuestions.filter(q=>q.documentId==='sas-2023-06');
 assert.equal(reviewed.length,90);assert.equal(new Set(reviewed.map(q=>q.number)).size,90);
 assert.equal(used.length,80);assert.ok(used.every(validQuestion));
 assert.deepEqual(used.map(q=>q.number).sort((a,b)=>a!-b!),reviewed.filter(q=>q.valid).map(q=>q.number).sort((a,b)=>a-b));
 assert.deepEqual(summary.excluded.map((q:{number:number})=>q.number).sort((a:number,b:number)=>a-b),reviewed.filter(q=>!q.valid).map(q=>q.number).sort((a,b)=>a-b));
 const audit=json('tests/fixtures/curriculum-audit.json');assert.equal(audit.sas.fullyReviewedSecondDayExams,1);assert.equal(audit.sas.otherSASReviewed,0);
 assert.equal(audit.sas.totalChannelExams,null);
});

test('questões oficiais2022 não são contadas como SAS e a anulada157 não entra no banco',()=>{
 const report=json('tests/fixtures/inep-import-audit.json');
 const official=initialQuestions.filter(q=>q.source==='official'&&q.year===2022);
 assert.equal(report.extracted,90);assert.equal(official.length,38);
 assert.ok(!official.some(q=>q.number===157));
 assert.deepEqual(official.map(q=>q.number).sort((a,b)=>a!-b!),report.numbers.sort((a:number,b:number)=>a-b));
 assert.ok(official.every(q=>q.keyUrl?.includes('2022_GB_impresso_D2_CD7.pdf')&&q.url?.includes('2022_PV_impresso_D2_CD7.pdf')));
});
