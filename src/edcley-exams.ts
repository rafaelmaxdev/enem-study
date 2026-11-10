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

export const edcleyExams:Exam[]=([...apostas2026,...telegram2026,...revisoes2026] as Exam[])
 .sort((a,b)=>a.id.localeCompare(b.id,'pt-BR',{numeric:true}));
