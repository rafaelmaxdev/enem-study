import {testState as initialState} from './fixtures';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createLocalStore} from '../local-store.mjs';
import {initialState as unusedInitialState} from '../src/seed';

async function cleanup(dir:string){const target=path.resolve(dir);assert.ok(target.startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(target).startsWith('enem-'));await rm(target,{recursive:true,force:true});}
const pdf={name:'minha-prova.pdf',dataURL:'data:application/pdf;base64,'+Buffer.from('%PDF-1.7\n%%EOF').toString('base64')};
test('migração mantém sessão, PDFs e tentativas; reabrir em outro processo lê o mesmo arquivo',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-store-'));
 try{
  const store=createLocalStore(dir),state=initialState();
  state.session={id:'sessao',questionIds:['SIS-01'],index:0,answers:{'SIS-01':2},submitted:{},help:{'SIS-01':'hint'},finished:false};
  const first=await store.migrate('browser-a',state,{pdf1:pdf});
  assert.equal(first.state.session?.id,'sessao');assert.equal(first.state.attempts.length,3);
  const again=await store.migrate('browser-a',initialState(),{});assert.equal(again.revision,first.revision);
  const reopened=await createLocalStore(dir).read();assert.equal(reopened?.state.session?.answers['SIS-01'],2);assert.deepEqual(reopened?.documents.pdf1,pdf);
  assert.equal(JSON.parse(await readFile(store.file,'utf8')).format,'enem-study');
 }finally{await cleanup(dir);}
});

test('migração de outro navegador reúne tentativas sem duplicar histórico ou perder o progresso',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-merge-'));
 try{
  const store=createLocalStore(dir),a=initialState(),b=initialState();
  a.journey={currentTopic:'Ecologia',progress:{Ecologia:{read:true}}};
  b.journey={currentTopic:'Equações e Sistemas',progress:{Ecologia:{summary:true}}};
  b.attempts.push({...b.attempts[0],id:'brave-new',sessionId:'brave',date:'2026-10-29T15:00:00Z'});
  await store.migrate('browser-a',a,{pdf1:pdf});const merged=await store.migrate('browser-b',b,{});
  assert.equal(merged.state.attempts.length,4);assert.equal(merged.state.journey?.currentTopic,'Ecologia');
  assert.equal(merged.state.journey?.progress.Ecologia.read,true);assert.equal(merged.state.journey?.progress.Ecologia.summary,true);
  assert.deepEqual(merged.documents.pdf1,pdf);
 }finally{await cleanup(dir);}
});

test('gravações concorrentes não sobrescrevem versão nova; a cópia anterior permanece utilizável',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-conflict-'));
 try{
  const store=createLocalStore(dir),first=await store.migrate('browser-a',initialState(),{});
  const a=structuredClone(first.state),b=structuredClone(first.state);a.checklist.Ecologia='Em estudo';b.checklist.Ecologia='Concluído';
  const results=await Promise.allSettled([store.save(first.revision,a),store.save(first.revision,b)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const rejected=results.find(r=>r.status==='rejected') as PromiseRejectedResult;assert.equal(rejected.reason.status,409);
  assert.equal((await store.read())?.state.checklist.Ecologia,'Em estudo');
  const previous=JSON.parse(await readFile(path.join(dir,'progresso-anterior.json'),'utf8'));assert.equal(previous.revision,first.revision);
 }finally{await cleanup(dir);}
});

test('dados inválidos e arquivo danificado bloqueiam gravação sem apagar progresso',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-invalid-'));
 try{
  const store=createLocalStore(dir),first=await store.migrate('browser-a',initialState(),{pdf1:pdf});
  const before=await readFile(store.file,'utf8');
  await assert.rejects(store.save(first.revision,{version:1} as never));
  await assert.rejects(store.save(first.revision,undefined,{'../bad':pdf}));
  await assert.rejects(store.save(first.revision,undefined,{pdf2:{name:'fake.pdf',dataURL:'data:application/pdf;base64,AAAA'}}));
  assert.equal(await readFile(store.file,'utf8'),before);
  await writeFile(store.file,'broken');await assert.rejects(store.read());await assert.rejects(store.save(first.revision,initialState()));
  assert.equal(await readFile(store.file,'utf8'),'broken');
 }finally{await cleanup(dir);}
});

test('restauração substitui estado e PDFs juntos e preserva a versão anterior',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-restore-'));
 try{
  const store=createLocalStore(dir),first=await store.migrate('browser-a',initialState(),{pdf1:pdf});
  const restored=initialState();restored.journey={currentTopic:'Radioatividade',progress:{}};
  const saved=await store.save(first.revision,restored,{},true);
  assert.deepEqual(saved.documents,{});assert.equal(saved.state.journey?.currentTopic,'Radioatividade');
  assert.deepEqual(JSON.parse(await readFile(path.join(dir,'progresso-anterior.json'),'utf8')).documents.pdf1,pdf);
 }finally{await cleanup(dir);}
});
