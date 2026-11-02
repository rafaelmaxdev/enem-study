import math from './lessons/math.json';
import nature from './lessons/physics-chemistry.json';
import biology from './lessons/biology.json';
import projection from './lessons/projection.json';
import coverage from './lessons/coverage.json';
import {subjects,availableQuestion,scoredAttempts,selectQuestions,variedQuestions,type Question,type State,type Subject,type Step,type JourneyProgress} from './domain';

export type Lesson={subject:Subject;topic:string;title:string;minutes:number;priority:'Fundamento'|'Alta'|'Complementar';why:string;goals:string[];sections:Step[];examples:{title:string;prompt:string;steps:Step[]}[];summary:string[];pitfalls:string[];recall:{question:string;answer:string}[];practiceTarget:number;visual?:string;sources:{title:string;url:string}[]};
export const lessons=[...math,...projection,...nature,...biology,...coverage] as Lesson[];
export const prioritySource='https://prod-assets-saseducacao.s3.amazonaws.com/public/2026-04/RAIO-X_ENEM%20SAS.pdf';
export function topicStats(state:State,topic:string){
 const rows=scoredAttempts(state).filter(a=>a.topic===topic);
 const latest=new Map<string,typeof rows[number]>();
 for(const row of [...rows].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)))latest.set(row.questionId,row);
 const distinct=[...latest.values()],independent=distinct.filter(a=>a.help==='none');
 const correct=independent.filter(a=>a.correct).length;
 const accuracy=independent.length?Math.round(1000*correct/independent.length)/10:null;
 const errors=distinct.filter(a=>!a.correct);
 return {answered:distinct.length,independent:independent.length,accuracy,errors,strong:independent.length>=5&&correct/independent.length>=.8};
}
export function progressFor(state:State,topic:string):JourneyProgress{return state.journey?.progress[topic]||{};}
export function practiceProgress(state:State,lesson:Lesson){
 const pool=state.questions.filter(q=>availableQuestion(q)&&q.subject===lesson.subject&&q.topic===lesson.topic);
 const ids=new Set(pool.map(q=>q.id));
 const attempted=new Set(scoredAttempts(state).filter(a=>ids.has(a.questionId)).map(a=>a.questionId));
 const answered=variedQuestions(pool.filter(q=>attempted.has(q.id))).length;
 const target=Math.min(lesson.practiceTarget,variedQuestions(pool).length);
 const session=state.session;
 const resumable=!!session&&session.questionIds.length>0&&session.questionIds.every(id=>ids.has(id))&&session.questionIds.some(id=>!session.submitted[id]);
 return {answered,target,remaining:Math.max(0,target-answered),complete:target>0&&answered>=target,resumable};
}
export function moduleComplete(state:State,lesson:Lesson){return !!progressFor(state,lesson.topic).completedAt||practiceProgress(state,lesson).complete;}
export function nextLesson(state:State,topic:string){
 const order=subjects.flatMap(subject=>lessons.filter(l=>l.subject===subject).sort((a,b)=>['Fundamento','Alta','Complementar'].indexOf(a.priority)-['Fundamento','Alta','Complementar'].indexOf(b.priority)));
 const index=order.findIndex(l=>l.topic===topic);
 return [...order.slice(index+1),...order.slice(0,Math.max(0,index))].find(l=>!moduleComplete(state,l))||null;
}
export function syncJourneyCompletion(state:State):State{
 let next=state;
 for(const lesson of lessons){
  if(progressFor(next,lesson.topic).completedAt||!practiceProgress(next,lesson).complete)continue;
  const rows=scoredAttempts(next).filter(a=>a.topic===lesson.topic);
  const stamp=rows.map(a=>a.date).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
  next={...next,checklist:{...next.checklist,[lesson.topic]:'Concluído'},journey:{currentTopic:next.journey?.currentTopic||lesson.topic,progress:{...next.journey?.progress,[lesson.topic]:{...progressFor(next,lesson.topic),completedAt:stamp}}}};
 }
 return next;
}
export function updateJourney(state:State,topic:string,patch:JourneyProgress):State{
 const next={...progressFor(state,topic),...patch};
 const lesson=lessons.find(l=>l.topic===topic);
 if(patch.completedAt&&(!lesson||!practiceProgress(state,lesson).complete))throw new Error('Complete a meta de questões antes de concluir o módulo.');
 return {...state,journey:{currentTopic:topic,progress:{...state.journey?.progress,[topic]:{...progressFor(state,topic),...patch}}},checklist:{...state.checklist,[topic]:patch.completedAt?'Concluído':state.checklist[topic]==='Concluído'?'Concluído':'Em estudo'}};
}
export function reviewDue(state:State,topic:string,now=Date.now()){
 const p=progressFor(state,topic);
 return !!p.completedAt&&now-Date.parse(p.reviewedAt||p.completedAt)>=2*86400000;
}
export function practicePlan(state:State,lesson:Lesson,mode:'mixed'|'errors'|'challenge'='mixed'){
 const stats=topicStats(state,lesson.topic),attempts=scoredAttempts(state);
 let pool=state.questions.filter(q=>availableQuestion(q)&&q.subject===lesson.subject&&q.topic===lesson.topic);
 if(mode==='errors'){const ids=new Set(stats.errors.map(a=>a.questionId));pool=pool.filter(q=>ids.has(q.id));}
 if(mode==='challenge')pool=pool.filter(q=>q.difficulty==='Difícil');
 if(mode==='mixed')pool=selectQuestions(pool,{subject:lesson.subject,topic:lesson.topic,source:'all',difficulty:'Misturada',count:pool.length},attempts);
 const target=mode==='errors'?Math.min(6,pool.length):mode==='challenge'?Math.min(4,pool.length):lesson.practiceTarget;
 const count=Math.min(target,pool.length);
 const pick=(questions:Question[],n:number,difficulty='Misturada')=>selectQuestions(questions,{subject:lesson.subject,topic:lesson.topic,source:'all',difficulty,count:n},attempts);
 if(mode!=='mixed')return {questions:pick(pool,count),target,available:pool.length};
 // Build a varied set first, then progress from easier to harder without repeating IDs.
 const chosen:Question[]=[];
 for(const difficulty of ['Fácil','Média','Difícil'])chosen.push(...pick(pool.filter(q=>!chosen.some(c=>c.id===q.id)),Math.min(count-chosen.length,Math.max(1,Math.round(count*(difficulty==='Média'?.5:.25)))),difficulty));
 chosen.push(...pick(pool.filter(q=>!chosen.some(c=>c.id===q.id)),count-chosen.length));
 const order=['Fácil','Média','Difícil'];chosen.sort((a,b)=>order.indexOf(a.difficulty)-order.indexOf(b.difficulty));
 return {questions:chosen,target,available:pool.length};
}
