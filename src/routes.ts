import {pageURL} from './hosting';
import {lessons} from './journey';
export type Page='study'|'library'|'performance'|'contents'|'settings'|'sas'|'sasPractice'|'sasExams'|'edcleyExams'|'officialExams';
export type LessonTab='learn'|'summary'|'practice';
export type EdcleyQuestionRoute={examId:string;number:number};
export type Route={page:Page;topic:string|null;tab:LessonTab;edcleyQuestion?:EdcleyQuestionRoute};
const paths:Record<Page,string>={contents:'/jornada',study:'/questoes',library:'/biblioteca',performance:'/desempenho',settings:'/preferencias',sas:'/sas',sasPractice:'/sas/praticar',sasExams:'/simulados-sas',edcleyExams:'/simulados-edcley',officialExams:'/provas-enem'};
const tabs:Record<LessonTab,string>={learn:'aprender',summary:'resumo',practice:'praticar'};
export const slug=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function routePath(route:Route){
 const base=paths[route.page];
 if(route.page==='edcleyExams'&&route.edcleyQuestion){
  const {examId,number}=route.edcleyQuestion;
  return pageURL(`${base}/${examId}/${number}`);
 }
 return pageURL(base+(route.page==='contents'&&route.topic?'/'+slug(route.topic)+'/'+tabs[route.tab]:''));
}
export function readRoute(path:string):Route{
 const [base,topic,tab,extra]=path.split('/').filter(Boolean);
 const page=base==='sas'&&topic==='praticar'?'sasPractice':(Object.keys(paths) as Page[]).find(key=>paths[key]==='/'+base)||'contents';
 if(page==='edcleyExams'&&!extra&&topic&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic)&&tab&&/^[1-9]\d{0,2}$/.test(tab)){
  return {page,topic:null,tab:'learn',edcleyQuestion:{examId:topic,number:Number(tab)}};
 }
 return {page,topic:page==='contents'?lessons.find(l=>slug(l.topic)===topic)?.topic||null:null,tab:(Object.keys(tabs) as LessonTab[]).find(key=>tabs[key]===tab)||'learn'};
}
