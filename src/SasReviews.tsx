import {assetURL} from './hosting';
import {useState} from 'react';
import {BookOpen,Check,RotateCcw} from 'lucide-react';
import {Button,Card} from './components/ui';
import {letters,type State,type Subject} from './domain';
import {sasErrors,markSasReviewed} from './sas';
import {MathText,Steps} from './App';
import VideoLessons from './VideoLessons';
import {routePath} from './routes';

export default function SasReviews({state,update,scope}:{state:State;update:(fn:(s:State)=>State)=>void;scope:Subject|'Todas'}){
 const [tab,setTab]=useState<'pending'|'resolved'>('pending');
 const errors=sasErrors(state,scope),rows=errors[tab];
 return <Card className="form-card sas-reviews"><div className="section-title"><div><span className="eyebrow">SEU CADERNO DE REVISÃO</span><h2>Meus erros SAS</h2></div><RotateCcw size={21}/></div><p className="small muted">{scope==='Todas'?'Todas as matérias':scope}. Revise a questão e a aula; depois marque o check para mover para Resolvidos. Essa marcação não altera sua nota.</p>
  <div className="inline-row" role="group" aria-label="Lista de erros SAS"><Button variant={tab==='pending'?'default':'outline'} aria-pressed={tab==='pending'} onClick={()=>setTab('pending')}>Para revisar ({errors.pending.length})</Button><Button variant={tab==='resolved'?'default':'outline'} aria-pressed={tab==='resolved'} onClick={()=>setTab('resolved')}><Check/>Resolvidos ({errors.resolved.length})</Button></div>
  {!rows.length&&<p className="small muted" role="status">{tab==='pending'?'Nenhum erro pendente nesta seleção.':'Os itens marcados como revisados aparecerão aqui.'}</p>}
  <div className="sas-review-list">{rows.map(({question:q,attempt,resolved})=><div className="sas-review-row" key={q.id}>
   <details className="sas-review-question"><summary><strong>SAS 2023 · Questão {q.number}</strong><span className="small muted">{q.subject} · {q.topic}</span><span className="small">{resolved?'Ver questão e aula':'Abrir questão, explicação e aula'}</span></summary>
    <p className="small">Você marcou <strong>{letters[attempt.selected]}</strong>. Resposta correta: <strong>{letters[q.answer!]}</strong>.</p>
    {q.images?.length?q.images.map((src,i)=><a key={src} href={assetURL(src)} target="_blank" rel="noreferrer" aria-label={'Ampliar enunciado da questão '+q.number}><img className="question-picture" src={assetURL(src)} alt={`Questão ${q.number}: enunciado original com figuras e alternativas, parte ${i+1}`}/></a>):<><p><MathText text={q.prompt}/></p><ul>{q.options.map((option,i)=><li key={i}>{letters[i]}) <MathText text={option}/></li>)}</ul></>}
    <Steps steps={q.steps}/>
    <VideoLessons key={q.id} topic={q.topic} question={q.prompt}/>
    <Button asChild variant="outline"><a href={routePath({page:'contents',topic:q.topic,tab:'learn'})}><BookOpen/>Ver aula escrita de {q.topic}</a></Button>
   </details>
   <label className="sas-review-check"><input type="checkbox" checked={!!resolved} onChange={e=>{const checked=e.target.checked;update(s=>markSasReviewed(s,q.id,checked));}} aria-label={(resolved?'Devolver à revisão':'Marcar como revisada')+': questão '+q.number}/><span>{resolved?'Resolvido':'Marcar como revisado'}</span></label>
  </div>)}</div>
 </Card>;
}
