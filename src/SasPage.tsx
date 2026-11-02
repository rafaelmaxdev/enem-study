import {useState} from 'react';
import {ArrowRight,Check,BookOpen} from 'lucide-react';
import {Button,Card,Select} from './components/ui';
import {subjects,type State,type Subject} from './domain';
import {sasProgress} from './sas';
import SasReviews from './SasReviews';
export default function SasPage({state,onStart,update}:{state:State;update:(fn:(s:State)=>State)=>void;onStart:(scope:Subject|'Todas')=>void}){
 const [scope,setScope]=useState<Subject|'Todas'>(state.sasSession?.scope||'Todas');
 const progress=sasProgress(state,scope),all=sasProgress(state);
 return <>
  <div className="intro"><span className="eyebrow">SEU BANCO DE SIMULADOS</span><h1>Questões SAS</h1><p>Responda no seu ritmo, por matéria ou com todas juntas. Pode pausar e continuar depois.</p></div>
  <Card className="journey-hero"><div><span className="eyebrow">PROGRESSO GERAL</span><h2>{all.answered} de {all.total} questões respondidas</h2><p>{all.pending.length?`Faltam ${all.pending.length} para completar o banco disponível.`:'✓ Todas as questões disponíveis foram respondidas.'}</p></div><BookOpen/></Card>
  <div className="progress-track" role="progressbar" aria-label="Banco SAS respondido" aria-valuemin={0} aria-valuemax={all.total} aria-valuenow={all.answered}><div className="progress-fill" style={{width:(all.total?100*all.answered/all.total:0)+'%'}}/></div>
  <SasReviews state={state} update={update} scope={scope}/>
  <Card className="form-card"><h2>Escolha como responder</h2><Select label="Matérias da sessão" value={scope} onChange={e=>setScope(e.target.value as Subject|'Todas')}><option value="Todas">Todas as matérias</option>{subjects.map(subject=><option key={subject}>{subject}</option>)}</Select><p><strong>{progress.answered} de {progress.total} respondidas</strong> · {progress.pending.length} restantes nesta seleção.</p><p className="small muted">As respostas que você já deu na Jornada também contam. Trocar a matéria mantém o progresso; as questões respondidas saem da fila. Os erros ficam em “Meus erros SAS”, nesta página, junto das aulas e resoluções.</p><Button disabled={!progress.pending.length} onClick={()=>onStart(scope)}>{progress.pending.length?<>{state.sasSession?.scope===scope&&!state.sasSession.finished?'Continuar sessão':progress.answered?'Continuar com as restantes':'Começar sessão'}<ArrowRight/></>:<><Check/>Seleção concluída</>}</Button></Card>
  <div className="stats-grid">{subjects.map(subject=>{const p=sasProgress(state,subject);return <Card className="stats-card" key={subject}><h3>{subject}</h3><strong className="metric-value">{p.answered} / {p.total}</strong><span className="small muted">{p.pending.length?`${p.pending.length} restantes`:'✓ Concluída'}</span><Button variant="outline" disabled={!p.pending.length} onClick={()=>onStart(subject)}>Responder {subject}<ArrowRight/></Button></Card>;})}</div>
  <p className="small muted">Banco atual: 6º simulado SAS 2023, segundo dia. Enunciados e resoluções completos ficam disponíveis durante a prática. Seu ponto de parada e as alternativas marcadas são salvos neste computador.</p>
 </>;
}
