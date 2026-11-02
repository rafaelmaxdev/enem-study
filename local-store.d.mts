import type {State} from './src/domain';
type Documents=Record<string,{name:string;dataURL:string}>;
type Profile={format:string;revision:number;savedAt:string;migratedClients:string[];state:State;documents:Documents};
export function createLocalStore(directory:string):{file:string;read:()=>Promise<Profile|null>;migrate:(clientId:string,state:State,documents?:Documents)=>Promise<Profile>;save:(revision:number,state?:State,documents?:Documents,replace?:boolean)=>Promise<Profile>};
