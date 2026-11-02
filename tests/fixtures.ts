import {initialState as emptyState} from '../src/seed';
import type {Attempt} from '../src/domain';
export function testState(){const state=emptyState();state.attempts=['SIS-01','SIS-02','SIS-03'].map((id,i)=>{const q=state.questions.find(q=>q.id===id)!;return {id:'fixture-'+i,questionId:id,sessionId:'fixture',subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:i===2?(q.answer!+1)%5:q.answer!,correct:i!==2,date:'2000-01-01T00:00:00Z',help:'unknown',annulled:false} as Attempt;});return state;}
