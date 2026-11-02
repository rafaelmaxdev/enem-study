import {availableQuestion,scoredAttempts,type State,type Session,type Subject} from './domain';
export function sasProgress(state:State,scope:Subject|'Todas'='Todas'){
 const questions=state.questions.filter(q=>q.documentId==='sas-2023-06'&&availableQuestion(q)&&(scope==='Todas'||q.subject===scope)).sort((a,b)=>(a.number||0)-(b.number||0));
 const answered=new Set(scoredAttempts(state).map(a=>a.questionId));
 const pending=questions.filter(q=>!answered.has(q.id));
 return {questions,pending,total:questions.length,answered:questions.length-pending.length};
}
export function sasErrors(state:State,scope:Subject|'Todas'='Todas'){
 const questions=new Map(sasProgress(state,scope).questions.map(q=>[q.id,q]));
 const errors=new Map<string,ReturnType<typeof scoredAttempts>[number]>();
 for(const attempt of [...scoredAttempts(state)].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)))if(!attempt.correct&&questions.has(attempt.questionId))errors.set(attempt.questionId,attempt);
 const rows=[...errors.values()].map(attempt=>({question:questions.get(attempt.questionId)!,attempt,resolved:state.sasReviews?.[attempt.questionId]?.attemptId===attempt.id&&state.sasReviews[attempt.questionId].resolved})).sort((a,b)=>Date.parse(b.attempt.date)-Date.parse(a.attempt.date));
 return {pending:rows.filter(row=>!row.resolved),resolved:rows.filter(row=>row.resolved)};
}
export function markSasReviewed(state:State,questionId:string,resolved:boolean,now=new Date().toISOString()):State{
 const rows=sasErrors(state),row=[...rows.pending,...rows.resolved].find(row=>row.question.id===questionId);
 if(!row)return state;
 return {...state,sasReviews:{...state.sasReviews,[questionId]:{attemptId:row.attempt.id,reviewedAt:now,resolved}}};
}
export function startSasSession(state:State,scope:Subject|'Todas',id:string):State{
 const progress=sasProgress(state,scope),old=state.sasSession;
 if(!progress.pending.length)return state;
 const pendingIds=new Set(progress.pending.map(q=>q.id));
 if(old?.scope===scope&&!old.finished&&old.questionIds.some(qid=>pendingIds.has(qid))){
  const questionIds=old.questionIds.filter(qid=>progress.questions.some(q=>q.id===qid)&&(old.submitted[qid]||pendingIds.has(qid)));
  // Preserve the current answer/explanation; otherwise resume the first unanswered item.
  const current=old.questionIds[old.index];
  const index=questionIds.includes(current)?questionIds.indexOf(current):Math.max(0,questionIds.findIndex(qid=>pendingIds.has(qid)));
  const extra=progress.pending.filter(q=>!questionIds.includes(q.id)).map(q=>q.id);
  return {...state,sasSession:{...old,questionIds:[...questionIds,...extra],index}};
 }
 const session:Session={id,scope,questionIds:progress.pending.map(q=>q.id),answers:{...old?.answers},submitted:{},help:{...old?.help},index:0,finished:false};
 return {...state,sasSession:session};
}
