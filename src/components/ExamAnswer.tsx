import {useState} from 'react';
import {Check} from 'lucide-react';
import {letters} from '../domain';
import {Button} from './ui';

export default function ExamAnswer({answer,response,onSubmit}:{answer:string;response?:number;onSubmit:(choice:number)=>void}){
 const [choice,setChoice]=useState<number|null>(null);
 if(answer==='-')return <p className="notice">Questão anulada pelo Inep. Ela fica fora da contagem de respostas e acertos.</p>;
 return <>
  <fieldset className="exam-answers" disabled={response!==undefined}>
   <legend className="sr-only">Sua resposta</legend>
   {letters.map((letter,i)=><label key={letter} className={`exam-answer ${(response??choice)===i?'selected':''}`}>
    <input type="radio" name="exam-answer" checked={(response??choice)===i} onChange={()=>setChoice(i)}/>{letter}
   </label>)}
  </fieldset>
  {response===undefined
   ? <Button disabled={choice===null} onClick={()=>{if(choice!==null)onSubmit(choice);}}>Confirmar resposta<Check/></Button>
   : <p className={'feedback '+(letters[response]===answer?'':'wrong')} role="status">Você marcou {letters[response]}. Gabarito: {answer}.</p>}
 </>;
}
