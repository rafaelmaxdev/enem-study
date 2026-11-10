import type {Subject} from './domain';
import apostas2026 from './edcley-2026.json';
import telegram2026 from './edcley-telegram-2026.json';
import revisoes2026 from './edcley-revisoes-2026.json';

export const edcleyChannel='https://t.me/edcleymateriais';

type Question = {
 number:number;
 page:number;
 subject:Subject;
 prompt:string;
 options:string[];
 answer:number;
 explanation:string;
 image?:string;
 imageOptions?:boolean;
 explanationImage?:string;
 sourceNumber?:number;
 adapted?:boolean;
};
type Exam = {id:string; title:string; questions:Question[]};

// Keep the original ID for saved progress, but order the duplicate as Parte 3.
const sortKey=(id:string)=>id==='apostas-2026-parte-15'?'apostas-2026-parte-3':id;

export const edcleyExams:Exam[]=([...apostas2026,...telegram2026,...revisoes2026] as Exam[])
 .sort((a,b)=>sortKey(a.id).localeCompare(sortKey(b.id),'pt-BR',{numeric:true}));
