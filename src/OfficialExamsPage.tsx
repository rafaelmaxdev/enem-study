import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ExternalLink} from 'lucide-react';
import {Steps} from './App';
import {Button,Card,Select} from './components/ui';
import {letters,type State,type Step} from './domain';
import {assetURL} from './hosting';
import catalog from './official-exams.json';
import explanationIndex from './official-exam-explanations.json';
import officialQuestions from './official.json';
import expansion2022 from './expansion-2022.json';

const areas={matematica:'Matemática',natureza:'Ciências da Natureza'};
const ranked=(area:string)=>catalog.filter(exam=>exam.area===area).sort((a,b)=>a.accuracy-b.accuracy);
const idFor=(exam:(typeof catalog)[number])=>`${exam.year}-${exam.area}`;
const percent=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const nature2018:Partial<Record<number,Step[]>>={
 91:[
  {title:'Identifique a ligação que muda',text:'A luz faz o grupo azo (–N=N–) alternar entre as formas cis e trans. As duas formas têm as mesmas ligações, mas arranjos espaciais diferentes.'},
  {title:'Relacione a forma ao movimento',text:'Na forma cis, o polímero fica mais compacto. A mudança de comprimento da camada ligada ao silício faz a lâmina se curvar.'},
 ],
 92:[
  {title:'Compare a energia por litro',text:'Um litro de gasolina tem 700 g e libera 7.000 kcal. Um litro de etanol tem 800 g e libera 4.800 kcal.'},
  {title:'Iguale a energia dos percursos',text:'Os 40 L de gasolina liberam 280.000 kcal. Para liberar a mesma energia, o volume de etanol é 280.000 ÷ 4.800 ≈ 58,3 L.'},
 ],
 125:[
  {title:'Ordene as cores pelo desvio',text:'A frequência aumenta do vermelho para o verde e depois para o azul. Como o índice de refração também cresce com a frequência, o azul é o mais desviado pelo prisma.'},
  {title:'Siga os raios no espelho',text:'Na posição do espelho mostrada, o raio mais desviado sobe mais após a reflexão. No filme, de baixo para cima, aparecem vermelho, verde e azul.'},
 ],
 126:[
  {title:'Procure a carga negativa',text:'O tensoativo é aniônico. Nas estruturas, o grupo sulfonato (–SO₃⁻) é a parte que tem carga negativa e interage com a água.'},
  {title:'Compare as cadeias',text:'Entre as estruturas com sulfonato, a alternativa B tem a cadeia hidrocarbônica com várias ramificações. Essas ramificações dificultam a degradação biológica.'},
 ],
 127:[
  {title:'Leia o loco A',text:'A semente tem os alelos 1 e 2. Como a matriz tem 1 e 3, o alelo 2 veio do pólen. Isso deixa DP2 e DP5 como candidatas.'},
  {title:'Confirme no loco B',text:'A semente tem apenas a banda do alelo 3, o que indica que recebeu esse alelo dos dois genitores. Entre DP2 e DP5, somente DP5 apresenta o alelo 3 nesse loco.'},
 ],
 128:[
  {title:'Siga o ar que sai do carro',text:'No carro A, a vela curva desvia parte do jato de volta para a esquerda. Ao transferir quantidade de movimento para o ar nesse sentido, o conjunto recebe um impulso para a direita.'},
  {title:'Compare os dois arranjos',text:'No carro B, a ventoinha lança o jato diretamente para a esquerda. O arranjo A perde parte do efeito ao redirecionar o ar, por isso avança mais devagar que B.'},
 ],
};

export default function OfficialExamsPage({state,update,onZoom}:{
 state:State;
 update:(change:(state:State)=>State)=>void;
 onZoom:(src:string)=>void;
}){
 const heading=useRef<HTMLHeadingElement>(null);
 const reader=state.officialExamReader;
 const exam=catalog.find(item=>idFor(item)===reader?.currentExam)??ranked('matematica')[0];
 const id=idFor(exam);
 const area=areas[exam.area as keyof typeof areas];
 const editions=ranked(exam.area);
 const progress=reader?.exams[id];
 const questions=Array.from(exam.answers,(answer,index)=>({number:exam.first+index,answer,page:exam.pages[index]}));
 const index=Math.max(0,questions.findIndex(item=>item.number===progress?.current));
 const question=questions[index];
 const response=progress?.responses[question.number];
 const solution=exam.solutions[index];
 // The index stores dataset row offsets or IDs of questions already in the app.
 const explanation=explanationIndex[id as keyof typeof explanationIndex]?.[index];
 const valid=questions.filter(item=>item.answer!=='-');
 const answered=valid.filter(item=>progress?.responses[item.number]!==undefined);
 const correct=answered.filter(item=>letters[progress!.responses[item.number]]===item.answer).length;

 function save(nextId:string,number:number,choice?:number){
  update(s=>{
   const exams=s.officialExamReader?.exams;
   const responses=exams?.[nextId]?.responses??{};
   return {...s,officialExamReader:{currentExam:nextId,exams:{
    ...exams,[nextId]:{current:number,responses:choice===undefined||responses[number]!==undefined?responses:{...responses,[number]:choice}},
   }}};
  });
 }

 function choose(next:(typeof catalog)[number]){
  const nextId=idFor(next);
  save(nextId,reader?.exams[nextId]?.current??next.first);
 }

 function go(number:number){
  save(id,number);
  heading.current?.scrollIntoView({block:'start'});
 }

 const image=`/enem-oficial/${exam.year}-${exam.day}-${question.page}.webp`;
 return <>
  <div className="intro">
   <span className="eyebrow">Aplicação regular · Caderno azul</span>
   <h1>Provas do ENEM</h1>
   <p>Pratique Matemática e Ciências da Natureza separadamente. Cada área tem seu próprio ranking e progresso.</p>
  </div>
  <Card className="form-card">
   <div className="form-grid">
    <Select label="Área da prova" value={exam.area} onChange={event=>{
     const next=catalog.find(item=>item.year===exam.year&&item.area===event.target.value);
     if(next)choose(next);
    }}>
     {Object.entries(areas).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </Select>
    <Select label="Edição do ENEM" value={exam.year} onChange={event=>{
     const next=editions.find(item=>item.year===Number(event.target.value));
     if(next)choose(next);
    }}>
     {editions.map((item,i)=><option key={item.year} value={item.year}>ENEM {item.year} · {i+1}º mais difícil · {percent.format(item.accuracy)}% de acertos</option>)}
    </Select>
   </div>
   <p className="small muted">Ranking de 2017 a 2025 por área, da menor à maior taxa média de acertos nas questões válidas. <a className="underline" href="https://profrafaelteixeira.com.br/raio-x-da-tri-do-enem/#como-calculei" target="_blank" rel="noreferrer">Fonte dos dados</a></p>
   <p className="small" aria-live="polite">{answered.length===valid.length&&'✓ Concluído · '}{answered.length} de {valid.length} respondidas · {correct} acertos{answered.length>0&&` (${Math.round(100*correct/answered.length)}%)`}</p>
   <progress className="exam-progress" value={answered.length} max={valid.length} aria-label="Progresso na prova"/>
   <div className="exam-number-grid" aria-label="Navegar pelas questões">
    {questions.map(item=>{
     const selected=progress?.responses[item.number];
     const annulled=item.answer==='-';
     const result=annulled?'answered':selected===undefined?'':letters[selected]===item.answer?'correct':'wrong';
     const status=annulled?', anulada':result==='correct'?', correta':result==='wrong'?', incorreta':'';
     return <button key={item.number} type="button" className={`exam-number ${result} ${item.number===question.number?'current':''}`}
      aria-label={`Questão ${item.number}${status}`} aria-current={item.number===question.number?'step':undefined} onClick={()=>go(item.number)}>
      {item.number}{result&&<span aria-hidden="true">{annulled?'–':result==='correct'?'✓':'!'}</span>}
     </button>;
    })}
   </div>
  </Card>
  <Card className="form-card">
   <div className="section-title">
    <h2 ref={heading}>Questão {question.number} <span className="small muted">· ENEM {exam.year} · {area}</span></h2>
    <div className="inline-row">
     <a className="small underline" href={`${exam.pdf}#page=${question.page}`} target="_blank" rel="noreferrer">Prova original<ExternalLink size={12} className="inline ml-1"/></a>
     <a className="small underline" href={exam.key} target="_blank" rel="noreferrer">Gabarito oficial<ExternalLink size={12} className="inline ml-1"/></a>
    </div>
   </div>
   <button type="button" className="question-picture-button" onClick={()=>onZoom(image)} aria-label="Ampliar página da prova">
    <img className="exam-pdf-image" src={assetURL(image)} alt={`Página ${question.page} do caderno azul com a questão ${question.number}. O PDF original permite selecionar o texto.`}/>
   </button>
   <OfficialAnswer key={id+':'+question.number} answer={question.answer} response={response}
    onSubmit={choice=>save(id,question.number,choice)}/>
   {(question.answer==='-'?Boolean(solution):response!==undefined)&&<OfficialExplanation key={'explanation:'+id+':'+question.number}
    year={exam.year} number={question.number} answer={question.answer} explanation={explanation} solution={solution}/>}
  </Card>
  <div className="section-title">
   <Button variant="outline" disabled={index===0} onClick={()=>go(questions[index-1].number)}><ArrowLeft/>Anterior</Button>
   <Button variant="outline" disabled={index===questions.length-1} onClick={()=>go(questions[index+1].number)}>Próxima<ArrowRight/></Button>
  </div>
 </>;
}

function OfficialExplanation({year,number,answer,explanation,solution}:{
 year:number;number:number;answer:string;explanation?:string|number|null;solution:string|null;
}){
 const offset=typeof explanation==='number'?explanation:null;
 const localSteps:Step[]|undefined=typeof explanation==='string'
  ? (expansion2022.find(q=>q.id===explanation)??officialQuestions.find(q=>q.id===explanation))?.steps
  : year===2018?nature2018[number]:undefined;
 const [remote,setRemote]=useState<string|null|undefined>(undefined);

 useEffect(()=>{
  if(offset===null)return;
  const controller=new AbortController();
  const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]);
  const query=new URLSearchParams({
   dataset:'candido-ai/enem-ocr',config:'default',split:'train',offset:String(offset),length:'1',
  });
  async function load(){
   try{
    const result=await fetch(`https://datasets-server.huggingface.co/rows?${query}`,{signal});
    if(!result.ok)throw new Error('Explicação indisponível');
    const data=await result.json();
    const entry=data.rows?.[0];
    const row=entry?.row;
    const text=row?.cot_explanation;
    const matches=entry?.row_idx===offset&&row?.id===`enem_${year}_q${number}`
     &&row.correct_answer===answer&&!entry.truncated_cells?.includes('cot_explanation');
    if(!controller.signal.aborted)setRemote(matches&&typeof text==='string'?text.trim()||null:null);
   }catch{
    if(!controller.signal.aborted)setRemote(null);
   }
  }
  void load();
  return ()=>controller.abort();
 },[offset,year,number,answer]);

 const solutionNumber=solution?.split('-')[1];
 const solutionSection=encodeURIComponent(`Resolução comentada da questão ${solutionNumber}`);
 return <section className="grid gap-2 border-t border-border pt-4">
  <h3>Resolução comentada</h3>
  {localSteps&&<Steps steps={localSteps}/>}
  {offset!==null&&remote===undefined&&<p className="small muted" role="status">Carregando explicação…</p>}
  {offset!==null&&remote===null&&<p className="small muted" role="status">A explicação do ENEM-OCR está indisponível.</p>}
  {remote&&<>
   <p className="whitespace-pre-line leading-relaxed">{remote}</p>
   <p className="small muted">Explicação gerada por IA · <a className="underline" href="https://huggingface.co/datasets/candido-ai/enem-ocr" target="_blank" rel="noreferrer">ENEM-OCR</a></p>
  </>}
  {solution&&!localSteps&&<a className="small underline" href={`https://plataformaassaad.com.br/${solution}/#:~:text=${solutionSection}&text=Resolu%C3%A7%C3%A3o%20Em%20Texto`} target="_blank" rel="noreferrer">
   {remote?'Ver resolução alternativa na Plataforma Assaad':'Ver resolução na Plataforma Assaad'}<ExternalLink size={12} className="inline ml-1"/>
  </a>}
  {year===2025&&<p className="small muted">A resolução usa o caderno amarelo, em que a mesma questão pode ter outro número.</p>}
 </section>;
}

function OfficialAnswer({answer,response,onSubmit}:{answer:string;response?:number;onSubmit:(choice:number)=>void}){
 const [choice,setChoice]=useState<number|null>(null);
 if(answer==='-')return <p className="notice">Questão anulada pelo Inep. Ela fica fora da contagem de respostas e acertos.</p>;
 return <>
  <fieldset className="exam-answers" disabled={response!==undefined}>
   <legend className="sr-only">Sua resposta</legend>
   {letters.map((letter,i)=><label key={letter} className={`exam-answer ${(response??choice)===i?'selected':''}`}>
    <input type="radio" name="official-exam-answer" checked={(response??choice)===i} onChange={()=>setChoice(i)}/>{letter}
   </label>)}
  </fieldset>
  {response===undefined
   ? <Button disabled={choice===null} onClick={()=>{if(choice!==null)onSubmit(choice);}}>Confirmar resposta<Check/></Button>
   : <p className={'feedback '+(letters[response]===answer?'':'wrong')} role="status">Você marcou {letters[response]}. Gabarito: {answer}.</p>}
 </>;
}
