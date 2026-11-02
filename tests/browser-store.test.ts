import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {readBrowserProfile,commitBrowserProfile} from '../src/browser-store';
import {initialState} from '../src/seed';
import {startingProgress} from '../src/starting-progress.pages';
import {assetURL,pageURL} from '../src/hosting';
const fresh=()=>({...initialState(),...startingProgress()});
async function database(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(crypto.randomUUID(),1);r.onupgradeneeded=()=>{r.result.createObjectStore('state');r.result.createObjectStore('pdfs');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function pdfs(db:IDBDatabase){return new Promise<File[]>(resolve=>{const r=db.transaction('pdfs').objectStore('pdfs').getAll();r.onsuccess=()=>resolve(r.result);});}
test('Pages começa sem histórico e usa caminhos sob o repositório',()=>{
 assert.equal(fresh().attempts.length,0);assert.deepEqual(fresh().checklist,{});assert.equal(fresh().historicalNote,'');
 assert.equal(assetURL('/sas/prova.pdf#page=2','/enem-study/'),'/enem-study/sas/prova.pdf#page=2');
 assert.equal(assetURL('https://example.org/a','/enem-study/'),'https://example.org/a');
 assert.equal(assetURL('data:image/png;base64,AA','/enem-study/'),'data:image/png;base64,AA');
 assert.equal(pageURL('/simulados-sas',true,'/enem-study/'),'/enem-study/#/simulados-sas');
 assert.equal(pageURL('/simulados-sas',false),'/simulados-sas');
});
test('progresso no navegador reabre respostas, sessão e PDF sem servidor',async()=>{
 const db=await database();try{
  const first=await readBrowserProfile(db,fresh),state=first.state;
  state.session={id:'practice',questionIds:['SIS-01'],answers:{'SIS-01':2},submitted:{'SIS-01':true},help:{},index:0,finished:false};
  state.sasExamReader={currentExam:'sas-2020-01',exams:{'sas-2020-01':{current:92,proofPage:2,updatedAt:new Date().toISOString(),responses:{91:{selected:4,answeredAt:new Date().toISOString()}}}}};
  const file=new File(['%PDF-1.7\n%%EOF'],'test.pdf',{type:'application/pdf'});
  const saved=await commitBrowserProfile(db,first.revision,state,[{id:'pdf1',file}]);
  const reopened=await readBrowserProfile(db,fresh);
  assert.deepEqual(reopened,saved);assert.deepEqual(reopened.state.session,state.session);assert.equal((await pdfs(db)).length,1);
  const wrong={...state,version:2} as never;assert.throws(()=>commitBrowserProfile(db,saved.revision,wrong));assert.deepEqual(await readBrowserProfile(db,fresh),saved);
 }finally{db.close();}
});
test('abas concorrentes não sobrescrevem dados e restauração troca PDFs e progresso juntos',async()=>{
 const db=await database();try{
  const first=await readBrowserProfile(db,fresh),file=new File(['%PDF-1.7'],'old.pdf');
  const saved=await commitBrowserProfile(db,first.revision,first.state,[{id:'old',file}]);
  await assert.rejects(commitBrowserProfile(db,first.revision,first.state,[],true),/outra aba/);assert.equal((await pdfs(db)).length,1);
  const restored=await commitBrowserProfile(db,saved.revision,fresh(),[],true);
  assert.equal((await pdfs(db)).length,0);assert.equal(restored.revision,saved.revision+1);
  const results=await Promise.allSettled([commitBrowserProfile(db,restored.revision,fresh()),commitBrowserProfile(db,restored.revision,fresh())]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.filter(x=>x.status==='rejected').length,1);
 }finally{db.close();}
});
