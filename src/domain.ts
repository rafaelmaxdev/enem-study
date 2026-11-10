export const subjects = ['Matemática','Física','Química','Biologia'] as const;
export type Subject = typeof subjects[number];
export type Difficulty = 'Fácil'|'Média'|'Difícil';
export const topics: Record<Subject,string[]> = {
 'Matemática':['Equações e Sistemas','Operações e notação científica','Razão, proporção e escalas','Porcentagem e juros','Grandezas e unidades','Estatística','Probabilidade','Análise Combinatória','Funções e Gráficos','Geometria plana','Geometria espacial','Projeção ortogonal','Pitágoras e trigonometria','Geometria analítica','PA e PG','Exponenciais e logaritmos','Inequações e domínio de funções','Simetrias e transformações'],
 'Física':['Cinemática e dinâmica','Trabalho, energia e potência','Hidrostática','Termologia e termodinâmica','Ondas e óptica','Eletricidade e magnetismo','Estática e equilíbrio','Gravitação e órbitas','Óptica geométrica','Eletrostática e campo elétrico'],
 'Química':['Estrutura atômica e ligações','Misturas e separação','Estequiometria','Soluções e concentrações','Termoquímica e cinética','Equilíbrio e pH','Eletroquímica','Química orgânica','Química ambiental','Gases','Radioatividade','Funções inorgânicas','Propriedades coligativas'],
 'Biologia':['Citologia e metabolismo','Genética e evolução','Ecologia','Fisiologia e saúde','Microbiologia e imunologia','Botânica e zoologia','Divisão celular e desenvolvimento','Biomas e sucessão ecológica']
};
export type Step = {title:string; text:string; math?:string};
export type Question = {
 id:string; subject:Subject; topic:string; difficulty:Difficulty; prompt:string; options:string[]; answer:number|null;
 source:'official'|'pdf'|'author'|'ai'; sourceName:string; year?:number; number?:number; page?:number; url?:string; keyUrl?:string; documentId?:string;
 images?:string[]; table?:{headers:string[];rows:string[][]}; hint:string; steps:Step[];
 status:'ready'|'draft'|'annulled'; verification:'official'|'math'|'manual'|'model'|'none';
 certificate?:{type:'system';a:number;b:number;c:number;d:number;e:number;f:number;target:'x'|'y';integer:boolean};
};
export type Attempt = {id:string;questionId:string;sessionId:string;subject:Subject;topic:string;difficulty:Difficulty;selected:number;correct:boolean;date:string;help:'none'|'hint'|'ai'|'unknown';annulled:boolean;historical?:boolean};
export type Source = {id:string;name:string;url:string;availability:string;permission:'unknown'|'public'|'confirmed';checkedAt?:string};
export type JourneyProgress={read?:boolean;summary?:boolean;reviewedAt?:string;completedAt?:string};
export type ExamResponse={selected:number;answeredAt:string;reviewed?:boolean};
export type ExamProgress={current:number;proofPage:number;updatedAt:string;responses:Record<string,ExamResponse>};
export type EdcleyExamProgress={current:number;responses:Record<string,number>};
export type State = {version:1;questions:Question[];attempts:Attempt[];checklist:Record<string,string>;sources:Source[];session:Session|null;sasSession?:Session|null;sasReviews?:Record<string,{attemptId:string;reviewedAt:string;resolved:boolean}>;sasExamReader?:{currentExam:string;exams:Record<string,ExamProgress>};edcleyExamReader?:{currentExam:string;exams:Record<string,EdcleyExamProgress>};officialExamReader?:{currentExam:string;exams:Record<string,EdcleyExamProgress>};historicalNote:string;journey?:{currentTopic:string;progress:Record<string,JourneyProgress>}};
export type Session = {id:string;questionIds:string[];answers:Record<string,number>;submitted:Record<string,boolean>;help:Record<string,Attempt['help']>;index:number;finished:boolean;scope?:Subject|'Todas'};
export const letters=['A','B','C','D','E'];
const safeURL=(value:unknown)=>{if(typeof value!=='string')return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const safeQuestionURL=(value:unknown,source:string)=>safeURL(value)||source==='pdf'&&typeof value==='string'&&/^\/sas\/[a-zA-Z0-9_-]+\.pdf(?:#page=\d+)?$/.test(value);
export function solveSystem(s:NonNullable<Question['certificate']>){
 const det=s.a*s.e-s.b*s.d;
 if(!Number.isFinite(det)||Math.abs(det)<1e-9)throw new Error('O sistema não tem resposta única.');
 const x=(s.c*s.e-s.b*s.f)/det,y=(s.a*s.f-s.c*s.d)/det;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||(s.integer&&(!Number.isInteger(x)||!Number.isInteger(y))))throw new Error('Quantidades incompatíveis com o enunciado.');
 if(Math.abs(s.a*x+s.b*y-s.c)>1e-7||Math.abs(s.d*x+s.e*y-s.f)>1e-7)throw new Error('Falha na conferência dos totais.');
 return {x,y};
}
export function validQuestion(q:Question){
 if(typeof q?.id!=='string'||typeof q.sourceName!=='string'||!['official','pdf','author','ai'].includes(q.source)||!['official','math','manual','model','none'].includes(q.verification)||q.url!==undefined&&!safeQuestionURL(q.url,q.source)||q.keyUrl!==undefined&&!safeQuestionURL(q.keyUrl,q.source))return false;
 if(q.images&&(!Array.isArray(q.images)||q.images.some(src=>typeof src!=='string'||!/^\/(?:official|sas)\/[a-zA-Z0-9_.-]+\.(webp|png|jpg)$/.test(src)&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src))))return false;
 if([q.year,q.number,q.page].some(n=>n!==undefined&&(!Number.isInteger(n)||n!<1)))return false;
 if(q.table&&(!Array.isArray(q.table.headers)||!q.table.headers.every(h=>typeof h==='string')||!Array.isArray(q.table.rows)||!q.table.rows.every(row=>Array.isArray(row)&&row.length===q.table!.headers.length&&row.every(v=>typeof v==='string'))))return false;
 if(!q||!subjects.includes(q.subject)||!topics[q.subject].includes(q.topic)||!['Fácil','Média','Difícil'].includes(q.difficulty)||typeof q.prompt!=='string'||!q.prompt.trim()||!Array.isArray(q.options)||q.options.length!==5||q.options.some(o=>typeof o!=='string'||!o.trim())||new Set(q.options.map(o=>o.trim().toLowerCase())).size!==5||!Number.isInteger(q.answer)||q.answer!<0||q.answer!>4||!Array.isArray(q.steps)||typeof q.hint!=='string')return false;
 if(q.source==='official'&&(!q.keyUrl||!q.url||!q.year||!q.number||q.verification!=='official'))return false;
 if(q.certificate){try{const s=solveSystem(q.certificate),val=s[q.certificate.target];const values=q.options.map(Number);if(values.filter(v=>Math.abs(v-val)<1e-7).length!==1||Math.abs(values[q.answer!]-val)>1e-7)return false;}catch{return false;}}
 return q.status==='ready'&&q.verification!=='none'&&q.steps.length>0&&q.steps.every(s=>s&&typeof s.title==='string'&&typeof s.text==='string'&&(s.math===undefined||typeof s.math==='string')&&!!s.title.trim()&&!!(s.text.trim()||s.math?.trim()));
}
export function fingerprint(q:Question){return(q.prompt+'|'+q.options.join('|')+'|'+(q.source==='official'?q.year+'-'+q.number:'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
// O estudante já fez as provas oficiais destes anos; mantemos os registros anteriores.
export function availableQuestion(q:Question){return validQuestion(q)&&!(q.source==='official'&&(q.year===2024||q.year===2025));}
export function dedupe(questions:Question[]){const seen=new Set<string>();return questions.filter(q=>{const k=fingerprint(q);if(seen.has(k))return false;seen.add(k);return true;});}
export function scoredAttempts(state:State){const qs=new Map(state.questions.map(q=>[q.id,q]));return state.attempts.filter(a=>!a.annulled&&!!qs.get(a.questionId)&&validQuestion(qs.get(a.questionId)!));}
export function annulQuestion(state:State,id:string):State{return {...state,questions:state.questions.map(q=>q.id===id?{...q,status:'annulled'}:q),attempts:state.attempts.map(a=>a.questionId===id?{...a,annulled:true}:a)};}
export function recordAnswer(state:State,q:Question,session:Session,selected:number,help:Attempt['help']):State{
 if(!validQuestion(q)||!Number.isInteger(selected)||selected<0||selected>4)throw new Error('Esta resposta não pode ser corrigida.');
 const id=session.id+':'+q.id;
 if(state.attempts.some(a=>a.id===id))return state;
 return {...state,attempts:[...state.attempts,{id,questionId:q.id,sessionId:session.id,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected,correct:selected===q.answer,date:new Date().toISOString(),help,annulled:false}]};
}
export function practiceFamily(q:Question){
 if(q.certificate){const s=q.certificate;return q.topic+':'+(s.a===s.b||s.d===s.e?'total-e-valor':'dois-recursos');}
 // Near-identical author templates differ only in their numerical data.
 return q.source==='author'||q.source==='ai'?q.topic+':'+q.prompt.toLowerCase().replace(/\d+(?:[.,]\d+)*/g,'#').replace(/\s+/g,' '):q.id;
}
export function variedQuestions(questions:Question[],limit=2){
 const counts=new Map<string,number>();
 return questions.filter(q=>{const key=practiceFamily(q),n=counts.get(key)||0;counts.set(key,n+1);return n<limit;});
}
export function selectQuestions(questions:Question[],filter:{subject:string;topic:string;source:string;difficulty:string;count:number},attempts:Attempt[]=[]){
 const last=new Map(attempts.map(a=>[a.questionId,a.date]));
 let pool=questions.filter(q=>availableQuestion(q)&&(filter.subject==='Todas'||filter.subject==='Ciências da Natureza'&&q.subject!=='Matemática'||q.subject===filter.subject)&&(filter.topic==='Todos'||q.topic===filter.topic)&&(filter.source==='all'||q.source===filter.source)&&(filter.difficulty==='Progressiva'||filter.difficulty==='Misturada'||q.difficulty===filter.difficulty));
 const ranks={official:0,pdf:1,author:2,ai:2};
 pool=pool.map(q=>({q,random:Math.random()})).sort((a,b)=>Number(last.has(a.q.id))-Number(last.has(b.q.id))||ranks[a.q.source]-ranks[b.q.source]||a.random-b.random).map(x=>x.q);
 if(filter.difficulty==='Progressiva')pool.sort((a,b)=>['Fácil','Média','Difícil'].indexOf(a.difficulty)-['Fácil','Média','Difícil'].indexOf(b.difficulty));
 return variedQuestions(pool).slice(0,filter.count);
}
export function assertBackup(value:unknown):asserts value is State{
 const s=value as State;
 if(!s||s.version!==1||!Array.isArray(s.questions)||!Array.isArray(s.attempts)||!s.checklist||typeof s.checklist!=='object'||!Array.isArray(s.sources))throw new Error('Backup incompatível. Nenhum dado foi alterado.');
 const ids=new Set<string>();
 for(const q of s.questions){if(!q.id||ids.has(q.id)||!subjects.includes(q.subject)||!topics[q.subject].includes(q.topic)||!Array.isArray(q.options)||q.options.length!==5||!Array.isArray(q.steps)||!['ready','draft','annulled'].includes(q.status)||(q.status==='ready'&&!validQuestion(q)))throw new Error('O backup contém questões incompletas.');ids.add(q.id);}
 const attemptIds=new Set<string>();
 for(const source of s.sources)if(!source||typeof source.id!=='string'||typeof source.name!=='string'||!safeURL(source.url)||typeof source.availability!=='string')throw new Error('O backup contém uma fonte inválida.');
 for(const value of Object.values(s.checklist))if(!['Não iniciado','A confirmar','Em estudo','Revisar','Concluído'].includes(value))throw new Error('O checklist do backup contém valores inválidos.');
 if(s.journey){
  const known=Object.values(topics).flat();
  if(!known.includes(s.journey.currentTopic)||!s.journey.progress||typeof s.journey.progress!=='object'||Array.isArray(s.journey.progress))throw new Error('A jornada do backup está incompleta.');
  for(const [topic,p] of Object.entries(s.journey.progress))if(!known.includes(topic)||!p||typeof p!=='object'||Array.isArray(p)||['read','summary'].some(k=>(p as Record<string,unknown>)[k]!==undefined&&typeof(p as Record<string,unknown>)[k]!=='boolean')||[p.reviewedAt,p.completedAt].some(v=>v!==undefined&&(typeof v!=='string'||!Number.isFinite(Date.parse(v)))))throw new Error('A jornada do backup contém uma etapa inválida.');
 }
 for(const a of s.attempts){if(!a.id||attemptIds.has(a.id)||!ids.has(a.questionId)||!subjects.includes(a.subject)||!Number.isInteger(a.selected)||a.selected<0||a.selected>4||typeof a.correct!=='boolean'||typeof a.annulled!=='boolean'||!Number.isFinite(Date.parse(a.date)))throw new Error('O histórico do backup está incompleto.');attemptIds.add(a.id);const q=s.questions.find(q=>q.id===a.questionId)!;a.correct=a.selected===q.answer;a.subject=q.subject;a.topic=q.topic;a.difficulty=q.difficulty;if(q.status==='annulled')a.annulled=true;}
 if(s.sasReviews!==undefined){
  if(!s.sasReviews||typeof s.sasReviews!=='object'||Array.isArray(s.sasReviews))throw new Error('As revisões SAS estão incompletas.');
  for(const [id,review] of Object.entries(s.sasReviews))if(!review||s.questions.find(q=>q.id===id)?.documentId!=='sas-2023-06'||!s.attempts.some(a=>a.id===review.attemptId&&a.questionId===id)||typeof review.resolved!=='boolean'||typeof review.reviewedAt!=='string'||!Number.isFinite(Date.parse(review.reviewedAt)))throw new Error('Uma revisão SAS está inválida.');
 }
 if(s.sasSession){
  const session=s.sasSession,qs=new Map(s.questions.map(q=>[q.id,q]));
  const mapping=(value:unknown,check:(v:unknown)=>boolean)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([id,v])=>ids.has(id)&&check(v));
  if(typeof session.id!=='string'||!['Todas',...subjects].includes(session.scope!)||!Array.isArray(session.questionIds)||session.questionIds.some(id=>qs.get(id)?.documentId!=='sas-2023-06')||new Set(session.questionIds).size!==session.questionIds.length||!Number.isInteger(session.index)||session.index<0||session.index>=Math.max(1,session.questionIds.length)||typeof session.finished!=='boolean'||!mapping(session.answers,v=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=4)||!mapping(session.submitted,v=>typeof v==='boolean')||!mapping(session.help,v=>['none','hint','ai','unknown'].includes(String(v))))throw new Error('O progresso SAS está incompleto.');
 }
 if(s.sasExamReader!==undefined){
  const r=s.sasExamReader,examId=(id:string)=>/^sas-(2020-0[1-7]|202[12]-0[1-6])$/.test(id);
  const date=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
  if(!r||!examId(r.currentExam)||!r.exams||typeof r.exams!=='object'||Array.isArray(r.exams))throw new Error('O acompanhamento dos simulados está incompleto.');
  for(const [id,p] of Object.entries(r.exams)){
   if(!examId(id)||!p||!Number.isInteger(p.current)||p.current<91||p.current>180||!Number.isInteger(p.proofPage)||p.proofPage<1||p.proofPage>200||!date(p.updatedAt)||!p.responses||typeof p.responses!=='object'||Array.isArray(p.responses))throw new Error('O acompanhamento contém uma posição inválida.');
   for(const [n,a] of Object.entries(p.responses))if(!/^(9[1-9]|1[0-7][0-9]|180)$/.test(n)||!a||!Number.isInteger(a.selected)||a.selected<0||a.selected>4||!date(a.answeredAt)||a.reviewed!==undefined&&typeof a.reviewed!=='boolean')throw new Error('O acompanhamento contém uma resposta inválida.');
  }
 }
 for(const [r,label] of [[s.edcleyExamReader,"dos simulados do Edcley"],[s.officialExamReader,"das provas do ENEM"]] as const){
  if(r===undefined)continue;
  const isExamId=(id:unknown)=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&id.length<=80;
  const isRecord=(value:unknown)=>!!value&&typeof value==='object'&&!Array.isArray(value);
  if(!isRecord(r)||!isExamId(r.currentExam)||!isRecord(r.exams)||!Object.hasOwn(r.exams,r.currentExam))throw new Error(`O progresso ${label} está incompleto.`);
  for(const [id,progress] of Object.entries(r.exams)){
   if(!isExamId(id)||!isRecord(progress)||!Number.isInteger(progress.current)||progress.current<1||progress.current>999||!isRecord(progress.responses))throw new Error(`O progresso ${label} contém uma questão inválida.`);
   for(const [number,answer] of Object.entries(progress.responses)){
    if(!/^[1-9]\d{0,2}$/.test(number)||!Number.isInteger(answer)||answer<0||answer>=letters.length)throw new Error(`O progresso ${label} contém uma resposta inválida.`);
   }
  }
 }
 s.session=null;
 if(typeof s.historicalNote!=='string')s.historicalNote='';
}
