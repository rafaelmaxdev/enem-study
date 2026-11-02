import {startingProgress} from './starting-progress';
import officialData from './official.json';
import sasData from './sas-2023-06.json';
import mathPractice from './lessons/math-practice.json';
import naturePractice from './lessons/nature-practice.json';
import expansion2022 from './expansion-2022.json';
import projectionPractice from './lessons/projection-practice.json';
import coveragePractice from './lessons/coverage-practice.json';
import {type Question,type State,type Subject,solveSystem,validQuestion,dedupe,practiceFamily} from './domain';
export function systemQuestion(id:string,x:number,y:number,a=3,b=2,d=2,e=5):Question{
 const c=a*x+b*y,f=d*x+e*y;
 const options=[x-10,x-5,x,x+5,x+10].map(String);
 const q:Question={id,subject:'Matemática',topic:'Equações e Sistemas',difficulty:'Média',prompt:`Uma fábrica monta kits escolares A e B. Cada kit A usa ${a} cadernos e ${d} canetas; cada kit B usa ${b} cadernos e ${e} canetas. Foram usados exatamente ${c} cadernos e ${f} canetas, sem sobras. Quantos kits A foram montados?`,options,answer:2,source:'author',sourceName:'Autoral · ENEM Study',hint:'Defina x e y como as quantidades de kits. Escreva uma equação para cada tipo de material.',steps:[{title:'Cadernos utilizados',text:`${a} por kit A e ${b} por kit B.`,math:`${a}x+${b}y=${c}`},{title:'Canetas utilizadas',text:`${d} por kit A e ${e} por kit B.`,math:`${d}x+${e}y=${f}`},{title:'Resolver e conferir',text:`A solução única é x=${x} e y=${y}. Conferindo: ${a}×${x}+${b}×${y}=${c}; ${d}×${x}+${e}×${y}=${f}.`}],status:'ready',verification:'math',certificate:{type:'system',a,b,c,d,e,f,target:'x',integer:true}};
 solveSystem(q.certificate!);if(!validQuestion(q))throw new Error('Falha ao construir questão.');return q;
}
const systems=Array.from({length:12},(_,i)=>systemQuestion('system-'+i,20+i*5,20+(i%4)*5));
const cinema:Question={id:'SIS-01',subject:'Matemática',topic:'Equações e Sistemas',difficulty:'Média',prompt:'Em uma sessão de cinema foram vendidos 120 ingressos, entre inteiras e meias. A inteira custava R$30 e a meia R$15. A arrecadação foi de R$2.700. Quantas inteiras foram vendidas?',options:['40','50','60','70','80'],answer:2,source:'author',sourceName:'Exercício do histórico',hint:'Separe o total de ingressos do total arrecadado.',steps:[{title:'Quantidade',text:'x representa inteiras; y representa meias.',math:'x+y=120'},{title:'Arrecadação',text:'Cada preço multiplica sua quantidade.',math:'30x+15y=2700'},{title:'Eliminação',text:'Subtraindo 15 vezes a primeira equação da segunda, 15x=900; portanto x=60 e y=60.'}],status:'ready',verification:'math',certificate:{type:'system',a:1,b:1,c:120,d:30,e:15,f:2700,target:'x',integer:true}};
const kits=systemQuestion('SIS-02',30,40);
const school:Question={...cinema,id:'SIS-03',prompt:'Uma escola montou 80 kits, dos tipos A e B. Cada kit A contém 2 cadernos, e cada kit B contém 4 cadernos. Foram usados exatamente 230 cadernos. Quantos kits A foram montados?',options:['25','30','35','40','45'],answer:4,hint:'Use x+y=80 para a quantidade de kits e outra equação para os cadernos.',steps:[{title:'80 kits montados',text:'Quantidade A + quantidade B.',math:'x+y=80'},{title:'230 cadernos usados',text:'2 cadernos por A; 4 por B.',math:'2x+4y=230'},{title:'Igualar os coeficientes de x',text:'Multiplique a primeira equação por 2.',math:'2x+2y=160'},{title:'Subtrair',text:'A segunda menos a equação anterior elimina x.',math:'2y=70\Rightarrow y=35'},{title:'Encontrar A',text:'Dos 80 kits, 35 são B.',math:'x=80-35=45'},{title:'Conferir',text:'45+35=80 kits; 2×45+4×35=230 cadernos. Se x=30, y=50 e seriam usados 260 cadernos.'}],certificate:{type:'system',a:1,b:1,c:80,d:2,e:4,f:230,target:'x',integer:true}};
const custom:Question[]=[];
function add(subject:Subject,topic:string,prompt:string,options:string[],answer:number,hint:string,text:string,difficulty:Question['difficulty']='Média'){custom.push({id:'curated-'+custom.length,subject,topic,prompt,options,answer,hint,steps:[{title:'Resolução',text}],difficulty,source:'author',sourceName:'Autoral · ENEM Study',status:'ready',verification:'manual'});}
add('Física','Trabalho, energia e potência','Um chuveiro de 5.500 W é utilizado por 20 minutos por dia durante 30 dias. Qual é o consumo de energia nesse período?',['5,5 kWh','11 kWh','27,5 kWh','55 kWh','110 kWh'],3,'Converta potência para kW e tempo total para horas.','5.500 W=5,5 kW. O tempo total é 600 minutos=10 horas. E=5,5×10=55 kWh.','Fácil');
add('Física','Cinemática e dinâmica','Uma ambulância percorre 36 km em 30 minutos, mantendo velocidade média constante. Qual é essa velocidade média?',['18 km/h','36 km/h','54 km/h','72 km/h','108 km/h'],3,'Expresse o tempo em horas.','30 minutos=0,5 hora. v=36/0,5=72 km/h.','Fácil');
add('Física','Hidrostática','Um mergulhador está a 5 m de profundidade. Adote densidade da água de 1.000 kg/m³ e g=10 m/s². Qual é a pressão manométrica nessa profundidade?',['5.000 Pa','10.000 Pa','25.000 Pa','50.000 Pa','100.000 Pa'],3,'A pressão manométrica considera somente a coluna de água.','p=ρgh=1000×10×5=50.000 Pa.');
add('Química','Soluções e concentrações','Um laboratório dissolve 12 g de sal e completa o volume da solução para 300 mL. Qual é a concentração em g/L?',['4','12','24','36','40'],4,'Converta o volume final da solução para litros.','300 mL=0,300 L. C=m/V=12/0,300=40 g/L.','Fácil');
add('Química','Estequiometria','Na síntese de água, 2H₂+O₂→2H₂O. Dispondo de 4 mol de H₂ e excesso de O₂, quantos mol de água podem ser formados?',['1','2','3','4','8'],3,'Compare os coeficientes de H₂ e de água.','A proporção H₂:H₂O é 2:2, ou 1:1. Logo 4 mol de H₂ formam 4 mol de água.','Fácil');
add('Biologia','Genética e evolução','Em uma planta, A é dominante sobre a. Duas plantas heterozigotas Aa são cruzadas. Qual é a probabilidade de um descendente apresentar genótipo aa?',['0%','25%','50%','75%','100%'],1,'Cada progenitor pode fornecer A ou a, com a mesma probabilidade.','As combinações são AA, Aa, aA e aa, equiprováveis. Apenas uma entre quatro é aa: 25%.','Fácil');
add('Biologia','Ecologia','Em uma cadeia capim → gafanhoto → sapo → cobra, o uso de um pesticida persistente e pouco biodegradável pode causar biomagnificação. Em qual organismo se espera a maior concentração do composto?',['Capim','Gafanhoto','Sapo','Cobra','Concentração igual em todos'],3,'Observe o nível trófico mais alto.','Na biomagnificação, a concentração de contaminantes aumenta nos níveis tróficos superiores. A cobra ocupa o nível mais alto dessa cadeia.');
add('Biologia','Fisiologia e saúde','Após uma refeição rica em carboidratos, qual hormônio atua principalmente na redução da glicemia, favorecendo a captação de glicose pelas células?',['Glucagon','Adrenalina','Insulina','Melatonina','Tiroxina'],2,'O hormônio é secretado pelas células beta do pâncreas.','A insulina promove a captação de glicose em tecidos sensíveis e favorece seu armazenamento, reduzindo a glicemia.','Fácil');
export const initialQuestions=[cinema,kits,school,...systems,...custom,...officialData as Question[],...sasData as Question[],...mathPractice as Question[],...naturePractice as Question[],...expansion2022 as Question[],...projectionPractice as Question[],...coveragePractice as Question[]];
export function mergeBundledQuestions(saved:State):State{
 const bundled=new Map(initialQuestions.map(q=>[q.id,q]));
 const next={...saved,questions:dedupe([...saved.questions.map(old=>old.status!=='annulled'&&bundled.has(old.id)?bundled.get(old.id)!:old),...initialQuestions.filter(q=>!saved.questions.some(old=>old.id===q.id))])};
 const session=next.session,questions=new Map(next.questions.map(q=>[q.id,q]));
 if(session&&session.questionIds.length&&session.questionIds.every(id=>questions.get(id)?.topic==='Equações e Sistemas')){
  const answered=session.questionIds.filter(id=>session.submitted[id]),counts=new Map<string,number>();
  for(const id of answered){const key=practiceFamily(questions.get(id)!);counts.set(key,(counts.get(key)||0)+1);}
  const pending=session.questionIds.filter(id=>!session.submitted[id]).filter(id=>{const key=practiceFamily(questions.get(id)!),n=counts.get(key)||0;counts.set(key,n+1);return n<2;}).slice(0,Math.max(0,4-answered.length));
  const ids=new Set([...answered,...pending]),questionIds=session.questionIds.filter(id=>ids.has(id));
  const current=session.questionIds[session.index];
  next.session={...session,questionIds,index:Math.max(0,questionIds.indexOf(ids.has(current)?current:pending[0]||questionIds[questionIds.length-1])),finished:!pending.length||session.finished};
 }
 return next;
}
export function initialState():State{return {...startingProgress(),questions:initialQuestions};}
