import {useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ExternalLink} from 'lucide-react';
import {Button,Card,Select} from './components/ui';
import {letters,type State} from './domain';
import {edcleyChannel,edcleyExams} from './edcley-exams';
import {assetURL} from './hosting';

type Props = {state:State; update:(change:(state:State)=>State)=>void};

export default function EdcleyExamsPage({state,update}:Props){
 const reader=state.edcleyExamReader;
 const exam=edcleyExams.find(item=>item.id===reader?.currentExam)??edcleyExams[0];
 const progress=reader?.exams[exam.id];
 const current=exam.questions.findIndex(question=>question.number===progress?.current);
 const index=Math.max(0,current);
 const question=exam.questions[index];
 const response=progress?.responses[question.number];
 const answered=exam.questions.filter(item=>progress?.responses[item.number]!==undefined);
 const correct=answered.filter(item=>progress?.responses[item.number]===item.answer).length;

 function go(id:string,number:number){
  update(s=>{
   const exams=s.edcleyExamReader?.exams;
   return {...s,edcleyExamReader:{currentExam:id,exams:{...exams,[id]:{current:number,responses:exams?.[id]?.responses??{}}}}};
  });
 }

 function submit(selected:number){
  update(s=>{
   const exams=s.edcleyExamReader?.exams;
   const responses=exams?.[exam.id]?.responses??{};
   if(responses[question.number]!==undefined)return s;
   const progress={current:question.number,responses:{...responses,[question.number]:selected}};
   return {...s,edcleyExamReader:{currentExam:exam.id,exams:{...exams,[exam.id]:progress}}};
  });
 }

 return <>
  <div className="intro">
   <span className="eyebrow">Segundo dia do ENEM</span>
   <h1>Simulados do Edcley</h1>
   <p>Escolha uma lista de Matemática e Ciências da Natureza. A correção e a resolução aparecem abaixo da sua resposta.</p>
  </div>

  <Card className="form-card">
   <Select label="Caderno de questões" value={exam.id} onChange={event=>{
    const next=edcleyExams.find(item=>item.id===event.target.value);
    if(next)go(next.id,reader?.exams[next.id]?.current??next.questions[0].number);
   }}>
    {edcleyExams.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
   </Select>
   <div className="section-title">
    <span className="small">{answered.length} de {exam.questions.length} respondidas · {correct} acertos</span>
    <a className="small underline" href={edcleyChannel} target="_blank" rel="noreferrer">Canal de origem <ExternalLink size={12} className="inline"/></a>
   </div>
   <progress className="exam-progress" value={answered.length} max={exam.questions.length} aria-label="Progresso no caderno"/>
   <div className="exam-number-grid" aria-label="Navegar pelas questões">
    {exam.questions.map(item=>{
     const selected=progress?.responses[item.number];
     const result=selected===undefined?'':selected===item.answer?'correct':'wrong';
     return <button key={item.number} type="button" className={'exam-number '+result+(item.number===question.number?' current':'')}
      aria-label={'Questão '+item.number+(result==='correct'?', correta':result==='wrong'?', incorreta':'')}
      aria-current={item.number===question.number?'step':undefined} onClick={()=>go(exam.id,item.number)}>
      {item.number}{result&&<span aria-hidden="true">{result==='correct'?'✓':'!'}</span>}
     </button>;
    })}
   </div>
  </Card>

  <EdcleyQuestion key={exam.id+':'+question.number} question={question} response={response} onSubmit={submit} original={!exam.id.startsWith('capes-')&&!question.adapted}/>

  <div className="section-title">
   <Button variant="outline" disabled={index===0} onClick={()=>go(exam.id,exam.questions[index-1].number)}><ArrowLeft/>Anterior</Button>
   <Button variant="outline" disabled={index===exam.questions.length-1} onClick={()=>go(exam.id,exam.questions[index+1].number)}>Próxima<ArrowRight/></Button>
  </div>

 </>;
}

function EdcleyQuestion({question,response,onSubmit,original}:{
 question:(typeof edcleyExams)[number]['questions'][number];
 response:number|undefined;
 onSubmit:(choice:number)=>void;
 original:boolean;
}){
 const [choice,setChoice]=useState<number|null>(null);
 return <Card className="question-card edcley-question">
  <div className="section-title">
   <h2>Questão {question.number}</h2>
   <span className="tag">{question.subject}</span>
  </div>
  <p className="small muted">{original?'Questão':'Questão adaptada'}{question.sourceNumber&&' '+question.sourceNumber} da página {question.page} do PDF.</p>
  {question.image
   ? <><p className="sr-only">{question.prompt}</p><a href={assetURL(question.image)} target="_blank" rel="noreferrer">
      <img className="exam-pdf-image" src={assetURL(question.image)} alt={question.imageOptions?'Enunciado e alternativas ilustradas. Abra para ampliar.':'Enunciado com a figura ou tabela original. Abra para ampliar.'}/>
     </a></>
   : <p className="question-text whitespace-pre-line">{question.prompt}</p>}
  <fieldset className="question-options" disabled={response!==undefined}>
   <legend className="sr-only">Alternativas da questão {question.number}</legend>
   {question.options.map((option,index)=>{
    const result=response===undefined?'':index===question.answer?'correct':index===response?'wrong':'';
    return <label key={index} className={'option '+result}>
     <input type="radio" name="edcley-answer" checked={(response??choice)===index} onChange={()=>setChoice(index)}/>
     <span className="option-letter">{letters[index]}</span>{!question.imageOptions&&' '+option}
    </label>;
   })}
  </fieldset>
  {response===undefined
   ? <Button disabled={choice===null} onClick={()=>{if(choice!==null)onSubmit(choice);}}>Confirmar resposta<Check/></Button>
   : <div className={'feedback '+(response===question.answer?'':'wrong')} role="status">
     <h3>{response===question.answer?'Resposta correta':'Você marcou '+letters[response]}</h3>
     <p><strong>Alternativa {letters[question.answer]}</strong>{!question.imageOptions&&' · '+question.options[question.answer]}</p>
     {question.explanationImage
      ? <><p className="sr-only">{question.explanation}</p><a href={assetURL(question.explanationImage)} target="_blank" rel="noreferrer">
         <img className="exam-pdf-image" src={assetURL(question.explanationImage)} alt="Comentário de resolução do PDF. Abra para ampliar."/>
        </a></>
      : <p className="whitespace-pre-line">{question.explanation}</p>}
    </div>}
 </Card>;
}
