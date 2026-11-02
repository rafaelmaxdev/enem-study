import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {lessons} from '../src/journey';
import {videoLessons,videoURL,videosForTopic,timeLabel} from '../src/videos';
import VideoLessons from '../src/VideoLessons';

test('todos os 49 blocos têm aulas reais identificadas com canal e tema',()=>{
 assert.equal(Object.keys(videoLessons).length,49);
 for(const lesson of lessons){
  const videos=videoLessons[lesson.topic];assert.ok(videos?.length,lesson.topic);
  assert.equal(new Set(videos.map(v=>v.videoId+':'+v.startSeconds)).size,videos.length);
  for(const video of videos){
   assert.match(video.videoId,/^[A-Za-z0-9_-]{11}$/);assert.ok(video.title&&video.channel&&video.focus&&video.checkedAt);
   assert.ok(Number.isInteger(video.startSeconds)&&video.startSeconds>=0);
   if(video.startSeconds){assert.ok(video.durationSeconds>video.startSeconds&&video.chapterTitle);}
   const source=JSON.parse(readFileSync(new URL('./fixtures/videos/'+video.videoId+'.json',import.meta.url),'utf8'));
   assert.equal(video.title,source.title);assert.equal(video.channel,source.channel);
   assert.ok(['OK','SEARCH_LISTING'].includes(source.status));
   if(video.startSeconds)assert.ok(source.chapters.some((c:{title:string;start:number})=>c.start===video.startSeconds&&c.title===video.chapterTitle));
  }
 }
});
test('professores indicados aparecem primeiro e Goulart fica como opção de Biologia',()=>{
 const preferred={'Matemática':'curió','Física':'boaro','Química':'café com química','Biologia':'samuel cunha'};
 for(const lesson of lessons){
  const videos=videoLessons[lesson.topic];
  if(['Projeção ortogonal','Simetrias e transformações'].includes(lesson.topic)){assert.equal(videos[0].kind,'supplement');continue;}
  assert.ok(videos[0].channel.toLowerCase().includes(preferred[lesson.subject]),lesson.topic);
  if(lesson.subject==='Biologia')assert.ok(videos.some(v=>v.channel.includes('Goulart')),lesson.topic);
 }
 assert.ok(!videoLessons['Equações e Sistemas'].some(v=>v.title.includes('3x3')));
});
test('link e player iniciam no trecho confirmado, mantendo a playlist alternativa',()=>{
 const video=videoLessons['Pitágoras e trigonometria'].find(v=>v.startSeconds>0)!;
 assert.equal(video.startSeconds,250);assert.equal(timeLabel(250),'4:10');assert.equal(timeLabel(3723),'1:02:03');
 const url=new URL(videoURL(video));assert.equal(url.hostname,'www.youtube.com');assert.equal(url.searchParams.get('t'),'250s');assert.equal(url.searchParams.get('list'),video.playlistId);
});
test('explicação de mutualismo prioriza relações ecológicas sem modificar a ordem da aula geral',()=>{
 const before=videoLessons.Ecologia.map(v=>v.videoId);
 const selected=videosForTopic('Ecologia','A relação entre raízes e fungos beneficia ambas as espécies.');
 assert.equal(selected[0].videoId,'cpmcIciaIWc');assert.deepEqual(videoLessons.Ecologia.map(v=>v.videoId),before);
});
test('aula renderiza links e alternativas, sem carregar player antes do clique',()=>{
 const html=renderToStaticMarkup(createElement(VideoLessons,{topic:'Pitágoras e trigonometria'}));
 assert.ok(html.includes('Videoaulas deste assunto')&&html.includes('Assistir aqui')&&html.includes('Abrir no YouTube'));
 assert.ok(html.includes('t=250s')&&html.includes('Relações Trigonométricas'));
 assert.ok(!html.includes('<iframe'));
 assert.equal(renderToStaticMarkup(createElement(VideoLessons,{topic:'tema inexistente'})),'');
});
