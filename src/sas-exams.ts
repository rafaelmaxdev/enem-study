import catalog from './sas-exams.json';
import type {State,ExamProgress} from './domain';

export const sasExams=catalog;
export type SasExam=typeof catalog[number];
export function examProgress(state:State,exam:SasExam):ExamProgress{
 return state.sasExamReader?.exams[exam.id]||{current:91,proofPage:exam.questions[0].proofPage||2,updatedAt:new Date().toISOString(),responses:{}};
}
export function saveExamProgress(state:State,id:string,progress:ExamProgress):State{
 return {...state,sasExamReader:{currentExam:id,exams:{...state.sasExamReader?.exams,[id]:progress}}};
}
export function examCounts(exam:SasExam,progress:ExamProgress){
 const answered=exam.questions.filter(q=>progress.responses[q.number]);
 return {answered:answered.length,correct:answered.filter(q=>q.answer!==null&&progress.responses[q.number].selected===q.answer).length,
  errors:answered.filter(q=>q.answer!==null&&progress.responses[q.number].selected!==q.answer&&!progress.responses[q.number].reviewed).length};
}
