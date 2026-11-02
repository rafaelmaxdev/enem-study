import type {State} from './domain';
export function startingProgress():Omit<State,'questions'>{
 return {version:1,attempts:[],checklist:{},sources:[{id:'inep',name:'Acervo oficial do Inep',url:'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',availability:'Disponível',permission:'public'}],session:null,historicalNote:''};
}
