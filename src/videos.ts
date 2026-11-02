import data from './video-lessons.json';
export type VideoLesson={videoId:string;title:string;channel:string;startSeconds:number;durationSeconds:number;focus:string;kind:'preferred'|'alternative'|'supplement';chapterTitle?:string;checkedAt:string;playlistId?:string;tags?:string[]};
export const videoLessons=data as Record<string,VideoLesson[]>;
export function videosForTopic(topic:string,question=''){
 const videos=videoLessons[topic]||[];
 if(!question)return videos;
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const text=normalize(question),score=(v:VideoLesson)=>(v.tags||[]).reduce((sum,tag)=>sum+(text.includes(normalize(tag))?1:0),0);
 return [...videos].sort((a,b)=>score(b)-score(a));
}
export function videoURL(video:VideoLesson){const url=new URL('https://www.youtube.com/watch');url.searchParams.set('v',video.videoId);if(video.playlistId)url.searchParams.set('list',video.playlistId);if(video.startSeconds)url.searchParams.set('t',video.startSeconds+'s');return url.toString();}
export function timeLabel(seconds:number){const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=Math.floor(seconds%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;}
