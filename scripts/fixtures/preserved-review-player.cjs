// Retained common catalog regression: exercise the player directly. Owner menu
// behavior is separately covered by test-focused-review and test-goryeo-focused.
module.exports=function(w){
 const menu=w.HanqReviewMenu,mount=menu.mount,stop=menu.stop;let key=null;
 menu.mount=function(host,opts,group,part){
  if(!group||!['ancient','goryeo','joseon','opening','colonial','modern'].includes(group)){menu.stop();host.replaceChildren();return mount(host,opts,group,part);}
  stop();w.HanqReviewPlayer.stop();host.replaceChildren();if(key)delete w.HANQ_MEMORY_REVIEWS[key];key='__preserved_test__';
  let deck=w.HANQ_PERIOD_REVIEWS&&w.HANQ_PERIOD_REVIEWS.route(group,part);
  if(!deck&&group==='joseon'){deck={...w.HANQ_MEMORY_REVIEWS.joseon,cards:w.HANQ_MEMORY_REVIEWS.joseon.cards.filter(c=>!part||part==='all'||c.stage==='cross'||c.stage===(part==='joseon-early'?'early':'late'))};}
  if(!deck&&group!=='ancient'&&group!=='goryeo')deck=w.HANQ_MEMORY_REVIEWS[part==='islands'?'islands':group];
  if(!deck){const id=group==='goryeo'?'goryeo':part==='baekje'?'samguk':part;if(id&&id!=='all')deck=w.HANQ_MEMORY_REVIEWS[id];else deck={cards:['prehistory','gojoseon','samguk','nambuk'].flatMap(x=>w.HANQ_MEMORY_REVIEWS[x].cards)};}
  w.HANQ_MEMORY_REVIEWS[key]=deck;let playerHost=host;if(group==='joseon'){const select=w.document.createElement('select');select.className='hanq-rm__select';for(const id of ['all','joseon-early','joseon-late']){const o=w.document.createElement('option');o.value=id;o.textContent=id+' 공통';select.appendChild(o);}select.value=part||'all';select.onchange=()=>menu.mount(host,opts,group,select.value);host.appendChild(select);playerHost=w.document.createElement('div');host.appendChild(playerHost);}
  if(part==='islands'){const note=w.document.createElement('p');note.className='hanq-rm__related';note.textContent='이전과 이후';host.appendChild(note);}
  w.HanqReviewPlayer.mount(playerHost,key,group==='ancient'&&part&&part!=='all'?'고대사 · '+deck.title:group==='ancient'?'고대사':'고려');
 };
 menu.stop=function(){stop();w.HanqReviewPlayer.stop();if(key){delete w.HANQ_MEMORY_REVIEWS[key];key=null;}};
};
