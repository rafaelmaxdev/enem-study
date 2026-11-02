import {testState as initialState} from './fixtures';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {initialState as unusedInitialState} from '../src/seed';

test('API local compartilha o arquivo, recusa origem externa e rejeita gravação desatualizada', {timeout:20000},async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'enem-api-'));
 const probe=createServer();await new Promise<void>(resolve=>probe.listen(0,'127.0.0.1',resolve));
 const port=(probe.address() as {port:number}).port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
 const root=path.dirname(fileURLToPath(new URL('../server.mjs',import.meta.url)));
 const child=spawn(process.execPath,['--import','tsx','server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),ENEM_DATA_DIR:dir,OPENAI_API_KEY:''},stdio:'ignore',windowsHide:true});
 const url='http://127.0.0.1:'+port;
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url+'/api/status')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}assert.ok(ready);
  assert.equal((await fetch(url+'/api/profile',{headers:{Origin:'https://example.com'}})).status,403);
  const post=(data:unknown)=>fetch(url+'/api/profile',{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify(data)});
  assert.equal((await(await fetch(url+'/api/profile')).json()).profile,null);
  const first=await(await post({mode:'migrate',clientId:'browser-a',state:initialState(),documents:{}})).json();assert.equal(first.profile.state.attempts.length,3);
  const state=first.profile.state;state.checklist.Ecologia='Em estudo';
  const saved=await(await post({mode:'save',revision:first.profile.revision,state})).json();assert.ok(saved.revision>first.profile.revision);
  assert.equal((await post({mode:'save',revision:first.profile.revision,state:initialState()})).status,409);
  const otherBrowser=await(await fetch(url+'/api/profile')).json();assert.equal(otherBrowser.profile.state.checklist.Ecologia,'Em estudo');
  const disk=JSON.parse(await readFile(path.join(dir,'progresso.json'),'utf8'));assert.equal(disk.state.checklist.Ecologia,'Em estudo');
  assert.equal((await fetch(url+'/data/progresso.json')).headers.get('content-type')?.startsWith('application/json'),false);
 }finally{
  child.kill();await new Promise<void>(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',()=>resolve());});
  assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(dir).startsWith('enem-'));
  await rm(dir,{recursive:true,force:true});
 }
});
