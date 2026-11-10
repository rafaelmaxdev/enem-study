import type {State} from './domain';

const capesDuplicates:{from:string;to:string;numbers:Record<number,number>}[]=[
 {from:'capes-2025-parte-1',to:'apostas-2026-parte-1',numbers:{2:17,4:19,6:21,8:23,9:24,12:27,13:28,15:30,19:34}},
 {from:'capes-2025-parte-4',to:'apostas-2026-parte-4',numbers:{2:43,3:44,4:30,5:45,7:47,8:48,11:51,15:55,16:56}},
];

export function mergeEdcleyProgress(state:State):State{
 const reader=state.edcleyExamReader;
 if(!reader||!capesDuplicates.some(({from})=>reader.exams[from]))return state;
 const exams={...reader.exams};
 let currentExam=reader.currentExam;
 for(const {from,to,numbers} of capesDuplicates){
  const legacy=exams[from];
  if(!legacy)continue;
  const existing=exams[to];
  const transferred:Record<string,number>={};
  for(const [number,answer] of Object.entries(legacy.responses)){
   const target=numbers[Number(number)];
   if(target!==undefined)transferred[target]=answer;
  }
  const wasOpen=currentExam===from;
  exams[to]={
   current:(wasOpen?numbers[legacy.current]:existing?.current)??existing?.current??numbers[legacy.current]??1,
   responses:{...transferred,...existing?.responses},
  };
  delete exams[from];
  if(wasOpen)currentExam=to;
 }
 return {...state,edcleyExamReader:{currentExam,exams}};
}
