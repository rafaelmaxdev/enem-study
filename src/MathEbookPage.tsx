import {useRef} from 'react';
import {ArrowLeft,ArrowRight,ExternalLink} from 'lucide-react';
import ExamAnswer from './components/ExamAnswer';
import {Button,Card,Select} from './components/ui';
import {letters,type State} from './domain';
import {assetURL} from './hosting';
import lists from './math-ebook.json';

const driveFile='https://drive.google.com/file/d/1Ljdztd0p4XTDzRTtaYbwVzb67fhdn-Dz/view';
const listId=(index:number)=>`qp-${String(index+1).padStart(2,'0')}`;

export default function MathEbookPage({state,update,onZoom}:{
 state:State;
 update:(change:(state:State)=>State)=>void;
 onZoom:(src:string)=>void;
}){
 const heading=useRef<HTMLHeadingElement>(null);
 const reader=state.mathEbookReader;
 const listIndex=Math.max(0,lists.findIndex((_,index)=>listId(index)===reader?.currentExam));
 const id=listId(listIndex);
 const list=lists[listIndex];
 const progress=reader?.exams[id];
 const number=Math.min(progress?.current??1,list.questions.length);
 const current=list.questions[number-1];
 const response=progress?.responses[number];
 const answered=list.questions.filter((_,index)=>progress?.responses[index+1]!==undefined).length;
 const correct=list.questions.filter((question,index)=>progress?.responses[index+1]===question.answer).length;

 function save(nextId:string,nextNumber:number,choice?:number){
  update(saved=>{
   const exams=saved.mathEbookReader?.exams;
   const responses=exams?.[nextId]?.responses??{};
   return {...saved,mathEbookReader:{currentExam:nextId,exams:{
    ...exams,[nextId]:{current:nextNumber,responses:choice===undefined||responses[nextNumber]!==undefined
     ? responses : {...responses,[nextNumber]:choice}},
   }}};
  });
 }

 function go(next:number){
  save(id,next);
  heading.current?.scrollIntoView({block:'start'});
 }

 function pages(files:string[],label:string){
  return files.map((file,index)=>{
   const src=`/codigo-enem/${file}`;
   const description=`${label} ${number}${files.length>1?`, parte ${index+1}`:''}`;
   return <button key={file} className="question-picture-button justify-self-center"
    type="button" onClick={()=>onZoom(src)} aria-label={`Ampliar ${description.toLowerCase()}`}>
    <img className="w-full max-w-[36rem] rounded" src={assetURL(src)} alt={description}/>
   </button>;
  });
 }

 return <>
  <div className="section-title">
   <h1>Código do ENEM · Matemática</h1>
   <Button variant="outline" asChild>
    <a href={driveFile} target="_blank" rel="noreferrer">Abrir e-book original<ExternalLink/></a>
   </Button>
  </div>
  <Card className="form-card">
   <Select label="Lista de questões" value={id} onChange={event=>{
    const next=event.target.value;
    save(next,reader?.exams[next]?.current??1);
   }}>
    {lists.map((item,index)=>{
     const key=listId(index);
     const responses=reader?.exams[key]?.responses;
     const count=item.questions.filter((_,i)=>responses?.[i+1]!==undefined).length;
     return <option key={key} value={key}>QP {key.slice(3)} · {item.title}{count>0&&` · ${count===item.questions.length?'Concluído':`${count}/${item.questions.length} respondidas`}`}</option>;
    })}
   </Select>
   <p className="small" aria-live="polite">
    {answered===list.questions.length&&'✓ Concluído · '}
    {answered} de {list.questions.length} respondidas · {correct} acertos
    {answered>0&&` (${Math.round(100*correct/answered)}%)`}
   </p>
   <progress className="exam-progress" value={answered} max={list.questions.length} aria-label="Progresso na lista"/>
   <div className="exam-number-grid" aria-label="Navegar pelas questões">
    {list.questions.map((item,index)=>{
     const position=index+1;
     const selected=progress?.responses[position];
     const result=selected===undefined?'':selected===item.answer?'correct':'wrong';
     const status=result==='correct'?', correta':result==='wrong'?', incorreta':'';
     return <button key={position} type="button" className={`exam-number ${result} ${position===number?'current':''}`}
      aria-current={position===number?'step':undefined} aria-label={`Questão ${position}${status}`}
      onClick={()=>go(position)}>
      {position}{result&&<span aria-hidden="true">{result==='correct'?'✓':'!'}</span>}
     </button>;
    })}
   </div>
  </Card>
  <Card className="form-card">
   <h2 ref={heading}>Questão {number} <span className="small muted">· {list.title}</span></h2>
   {pages(current.question,'Questão')}
   <ExamAnswer key={`${id}:${number}`} answer={letters[current.answer]} response={response} onSubmit={choice=>save(id,number,choice)}/>
   {response!==undefined&&<section className="grid gap-3 border-t border-border pt-4">
    <h3>Resolução comentada</h3>
    {pages(current.solution,'Resolução da questão')}
   </section>}
  </Card>
  <div className="section-title">
   <Button variant="outline" disabled={number===1} onClick={()=>go(number-1)}><ArrowLeft/>Anterior</Button>
   <Button variant="outline" disabled={number===list.questions.length} onClick={()=>go(number+1)}>Próxima<ArrowRight/></Button>
  </div>
 </>;
}
