import {useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,CircleHelp,ExternalLink,Share2} from 'lucide-react';
import {subjectIcons} from './components/subject-icons';
import {Button,Card} from './components/ui';
import {letters,type State} from './domain';
import {edcleyChannel,edcleyExams} from './edcley-exams';
import {assetURL} from './hosting';
import {routePath,type EdcleyQuestionRoute} from './routes';

type Props = {state:State; update:(change:(state:State)=>State)=>void; onZoom:(src:string)=>void; sharedQuestion?:EdcleyQuestionRoute; onLeaveSharedQuestion:()=>void};

const resolutionSubheadings=new Set([
 'Lógica','Análise dimensional','Razão e proporção','Regra de três',
 'Sacada matemática','Conceito-chave','Por que as outras erram','Dica de prova',
]);

function resultFor(exam:(typeof edcleyExams)[number],state:State){
 const responses=state.edcleyExamReader?.exams[exam.id]?.responses;
 let answered=0,correct=0;
 for(const question of exam.questions){
  const selected=responses?.[question.number];
  if(selected===undefined)continue;
  answered++;
  if(selected===question.answer)correct++;
 }
 return {
  answered,correct,
  complete:answered===exam.questions.length,
  accuracy:answered?Math.round(correct/answered*100):null,
 };
}

function ExamStatus({result,total}:{result:ReturnType<typeof resultFor>;total:number}){
 if(result.complete)return <span className="edcley-exam-status complete">✓ Concluído · {result.accuracy}% de acertos</span>;
 if(result.answered)return <span className="edcley-exam-status ongoing">Em andamento · {result.answered} de {total} respondidas</span>;
 return null;
}

export default function EdcleyExamsPage({state,update,onZoom,sharedQuestion,onLeaveSharedQuestion}:Props){
 const picker=useRef<HTMLDetailsElement>(null);
 const pickerTrigger=useRef<HTMLElement>(null);
 const reader=state.edcleyExamReader;
 const sharedExam=edcleyExams.find(item=>item.id===sharedQuestion?.examId&&item.questions.some(q=>q.number===sharedQuestion.number));
 const exam=sharedExam??edcleyExams.find(item=>item.id===reader?.currentExam)??edcleyExams[0];
 const progress=reader?.exams[exam.id];
 const current=exam.questions.findIndex(question=>question.number===(sharedExam?sharedQuestion?.number:progress?.current));
 const index=Math.max(0,current);
 const question=exam.questions[index];
 const response=progress?.responses[question.number];
 const result=resultFor(exam,state);
 const {answered,correct,complete,accuracy}=result;

 function closePicker(){
  if(picker.current)picker.current.open=false;
  pickerTrigger.current?.focus();
 }

 function go(id:string,number:number){
  if(sharedQuestion)onLeaveSharedQuestion();
  update(s=>{
   const exams=s.edcleyExamReader?.exams;
   return {...s,edcleyExamReader:{currentExam:id,exams:{...exams,[id]:{current:number,responses:exams?.[id]?.responses??{}}}}};
  });
 }

 function submit(selected:number){
  update(s=>{
   const exams=s.edcleyExamReader?.exams;
   const responses=exams?.[exam.id]?.responses??{};
   if(responses[question.number]===selected)return s;
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
   <div className="field">
    <span id="edcley-picker-label">Caderno de questões</span>
    <details ref={picker} className="edcley-exam-picker" onKeyDown={event=>{
     if(event.key==='Escape'&&event.currentTarget.open){
      event.preventDefault();
      closePicker();
     }
    }}>
     <summary ref={pickerTrigger} aria-labelledby="edcley-picker-label edcley-picker-current">
      <span id="edcley-picker-current">{exam.title}<ExamStatus result={result} total={exam.questions.length}/></span>
      <ChevronDown size={16} aria-hidden="true"/>
     </summary>
     <div className="edcley-exam-options" role="group" aria-labelledby="edcley-picker-label">
      {edcleyExams.map(item=><button key={item.id} type="button" aria-current={item.id===exam.id?true:undefined} onClick={()=>{
       if(item.id!==exam.id)go(item.id,reader?.exams[item.id]?.current??item.questions[0].number);
       closePicker();
      }}>
       {item.title}<ExamStatus result={item.id===exam.id?result:resultFor(item,state)} total={item.questions.length}/>
      </button>)}
     </div>
    </details>
   </div>
   <div className="section-title">
    <span className="small" aria-live="polite">{complete&&<><strong>✓ Concluído</strong> · </>}{answered} de {exam.questions.length} respondidas · {correct} acertos{accuracy!==null&&` (${accuracy}%)`}</span>
    <a className="small underline" href={edcleyChannel} target="_blank" rel="noreferrer">Canal de origem <ExternalLink size={12} className="inline"/></a>
   </div>
   <progress className="exam-progress" value={answered} max={exam.questions.length} aria-label="Progresso no caderno"/>
   <div className="exam-number-grid" aria-label="Navegar pelas questões">
    {exam.questions.map(item=>{
     const selected=progress?.responses[item.number];
     const result=selected===undefined?'':selected===item.answer?'correct':'wrong';
     const SubjectIcon=subjectIcons[item.subject]??CircleHelp;
     return <button key={item.number} type="button" className={'exam-number '+result+(item.number===question.number?' current':'')}
      aria-label={'Questão '+item.number+(result==='correct'?', correta':result==='wrong'?', incorreta':'')}
      title={SubjectIcon===CircleHelp?'Matéria não identificada':item.subject}
      aria-current={item.number===question.number?'step':undefined} onClick={()=>go(exam.id,item.number)}>
      <SubjectIcon className="exam-subject-icon" aria-hidden="true"/>
      {item.number}{result&&<span aria-hidden="true">{result==='correct'?'✓':'!'}</span>}
     </button>;
    })}
   </div>
  </Card>

  <EdcleyQuestion key={exam.id+':'+question.number} exam={exam} question={question} response={response} onSubmit={submit} onZoom={onZoom} original={!question.adapted}/>

  <div className="section-title">
   <Button variant="outline" disabled={index===0} onClick={()=>go(exam.id,exam.questions[index-1].number)}><ArrowLeft/>Anterior</Button>
   <Button variant="outline" disabled={index===exam.questions.length-1} onClick={()=>go(exam.id,exam.questions[index+1].number)}>Próxima<ArrowRight/></Button>
  </div>

 </>;
}

function EdcleyQuestion({exam,question,response:savedResponse,onSubmit,onZoom,original}:{
 exam:(typeof edcleyExams)[number];
 question:(typeof edcleyExams)[number]['questions'][number];
 response:number|undefined;
 onSubmit:(choice:number)=>void;
 onZoom:Props['onZoom'];
 original:boolean;
}){
 const [choice,setChoice]=useState<number|null>(null);
 const [editing,setEditing]=useState(false);
 const [shareMessage,setShareMessage]=useState('');
 const [manualShare,setManualShare]=useState('');
 const response=editing?undefined:savedResponse;
 const {image,explanationImage}=question;

 async function share(includeAnswer:boolean){
  const title=`Questão ${question.number} · ${exam.title}`;
  const address=routePath({page:'edcleyExams',topic:null,tab:'learn',edcleyQuestion:{examId:exam.id,number:question.number}});
  const lines=[title,question.prompt];
  if(image)lines.push('Imagem do enunciado: '+new URL(assetURL(image),window.location.origin).href);
  if(!question.imageOptions)lines.push(question.options.map((option,index)=>`${letters[index]}) ${option}`).join('\n'));
  if(includeAnswer&&savedResponse!==undefined)lines.push(`Minha resposta: ${letters[savedResponse]}\nGabarito: ${letters[question.answer]}`);
  lines.push('Abrir no ENEM Study: '+new URL(address,window.location.origin).href);
  const text=lines.join('\n\n');
  setShareMessage('');
  setManualShare('');
  try{
   if(navigator.share){
    await navigator.share({title,text});
    return;
   }
  }catch(error){
   if(error instanceof DOMException&&error.name==='AbortError')return;
  }
  try{
   await navigator.clipboard.writeText(text);
   setShareMessage('Questão copiada.');
  }catch{
   setManualShare(text);
   setShareMessage('Selecione e copie o texto abaixo.');
  }
 }

 return <Card className="question-card edcley-question">
  <div className="section-title">
   <h2>Questão {question.number}</h2>
   <span className="tag">{question.subject}</span>
  </div>
  <details>
   <summary className="inline-flex items-center gap-2 text-sm font-medium"><Share2 size={16} aria-hidden="true"/>Compartilhar questão</summary>
   <div className="inline-row mt-2">
    <Button type="button" variant="outline" size="sm" onClick={()=>void share(false)}>Só a questão</Button>
    <Button type="button" variant="outline" size="sm" disabled={savedResponse===undefined} onClick={()=>void share(true)}>Com minha resposta e gabarito</Button>
   </div>
   {savedResponse===undefined&&<p className="small muted">Confirme sua resposta para compartilhar com gabarito.</p>}
   <p role="status" className="small muted">{shareMessage}</p>
   {manualShare&&<textarea className="text-input" rows={5} aria-label="Texto para compartilhar" value={manualShare} readOnly onFocus={event=>event.currentTarget.select()}/>}
  </details>
  <p className="small muted">{original?'Questão':'Questão adaptada'}{question.sourceNumber&&' '+question.sourceNumber} da página {question.page} do PDF.</p>
  {image
   ? <><p className="sr-only">{question.prompt}</p><button type="button" className="question-picture-button" onClick={()=>onZoom(image)} aria-label="Ampliar enunciado">
      <img className="exam-pdf-image" src={assetURL(image)} alt={question.imageOptions?'Enunciado e alternativas ilustradas.':'Enunciado com a figura ou tabela original.'}/>
     </button></>
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
   ? <div className={editing?'inline-row':'grid'}>
     <Button disabled={choice===null||choice===savedResponse} onClick={()=>{
      if(choice===null)return;
      onSubmit(choice);
      setEditing(false);
     }}>{editing?'Salvar alteração':'Confirmar resposta'}<Check/></Button>
     {editing&&<Button variant="outline" onClick={()=>setEditing(false)}>Cancelar</Button>}
    </div>
   : <>
     <div className={'feedback '+(response===question.answer?'':'wrong')} role="status">
      <h3>{response===question.answer?'Resposta correta':'Você marcou '+letters[response]}</h3>
      <p><strong>Alternativa {letters[question.answer]}</strong>{!question.imageOptions&&' · '+question.options[question.answer]}</p>
     </div>
     <div>
      <Button variant="outline" onClick={()=>{
       setChoice(response);
       setEditing(true);
      }}>Alterar resposta</Button>
     </div>
     <section className="grid gap-3 border-t border-border pt-5" aria-labelledby="edcley-resolution">
      <h3 id="edcley-resolution">Resolução comentada</h3>
      {explanationImage
       ? <><p className="sr-only">{question.explanation}</p><button type="button" className="question-picture-button" onClick={()=>onZoom(explanationImage)} aria-label="Ampliar resolução">
          <img className="exam-pdf-image" src={assetURL(explanationImage)} alt="Comentário de resolução do PDF."/>
         </button></>
       : <div className="grid max-w-[74ch] gap-4 text-sm">
          {question.explanation.trim().split(/\n\s*\n/).map((paragraph,index)=>{
           const firstBreak=paragraph.indexOf('\n');
           const heading=firstBreak===-1?paragraph.trim():paragraph.slice(0,firstBreak).trim();
           if(resolutionSubheadings.has(heading)||/^Passo \d+\s*[:.–-]/i.test(heading)){
            const body=firstBreak===-1?'':paragraph.slice(firstBreak+1).trim();
            return <div key={index} className={body?'grid gap-1':undefined}>
             <h4 className="font-semibold">{heading}</h4>
             {body&&<p className="whitespace-pre-line">{body}</p>}
            </div>;
           }
           return <p key={index} className="whitespace-pre-line">{paragraph.trim()}</p>;
          })}
         </div>}
     </section>
    </>}
 </Card>;
}
