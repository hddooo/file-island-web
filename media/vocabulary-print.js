/* Content stays in a same-origin print window. No upload, storage or account writes. */
(function(root){'use strict';
 function text(v){return String(v||'').replace(/\s+/g,' ').trim();}
 function rows(words,layout,support){return words.map(function(n){var d=layout(n),meaning=d.forms?d.forms.map(function(f){return f.meaning;}).join(' / '):d.general;
  var pair=root.HanqVocabularyParaphrases&&root.HanqVocabularyParaphrases.get(n),usage=support.usage[n.expression],learning=support.learningExamples&&support.learningExamples[n.expression];
  return{id:n.id,word:text(d.title),pos:text(d.partOfSpeech||n.partOfSpeech),meaning:text(String(meaning||'').split('\n')[0]),example:text(learning?learning.example:n.example),translation:text(learning?learning.translation:n.translation||support.translations[n.example]),usage:text(usage).split(' — ')[0],paraphrase:pair&&pair.items.slice(0,1).map(function(p){return text(p.expression)+' — '+text(p.meaning);}).join(' · ')||'',context:!learning&&n.exampleKind==='source_context',exampleKind:learning?'authored_learning':n.exampleKind,originalExample:text(n.example),source:text(n.exampleSource||n.sourceReference)};
 });}
 function render(win,chapter,words,layout,options){
  options=options||{};
  if(!win||win.closed)return;var doc=win.document;
  doc.open();doc.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>');doc.close();
  doc.title='HanQ '+chapter.title+' 단어장';
  function el(tag,value,parent){var n=doc.createElement(tag);if(value!=null)n.textContent=value;if(parent)parent.appendChild(n);return n;}
  var controls=el('nav',null,doc.body);controls.className='print-controls';el('strong',chapter.title+' · '+words.length+'개',controls);
  var hint=el('p','예문·해석·함께 쓰는 표현·패러프레이즈를 포함한 인쇄 분량을 확인하고 있어요.',controls);
  var button=el('button','인쇄창 열기 · PDF로 저장',controls);button.type='button';button.disabled=true;button.onclick=function(){win.focus();win.print();};
  Promise.all([root.fetch('/media/vocabulary-print.css').then(function(r){if(!r.ok)throw Error('style');return r.text();}),root.fetch('/media/vocabulary-print-support.json').then(function(r){if(!r.ok)throw Error('support');return r.json();})]).then(function(values){
   if(win.closed)return;if(options.isCurrent&&!options.isCurrent()){win.close();return;}var style=el('style',values[0],doc.head),data=rows(words,layout,values[1]);
   var missing=data.filter(function(d){return(options.allowMissingSupplement?['word','meaning']:['example','translation','usage','paraphrase']).some(function(k){return !d[k];});});
   if(missing.length){hint.textContent=options.allowMissingSupplement?'표현 또는 뜻이 없는 '+missing.length+'개 항목을 확인해 주세요.':'예문·해석·표현 정보가 없는 '+missing.length+'개 항목을 확인해야 합니다. 일부 내용을 뺀 PDF는 만들지 않아요.';doc.body.dataset.fit='missing';return;}
   data.forEach(function(d,i){d.number=i+1;});var groups=data.map(function(d){return[d];});
   function page(){var p=el('main',null,doc.body);p.className='vocabulary-paper';p.dataset.chapterId=chapter.id;var head=el('header',null,p);el('span','HanQ · TOEIC VOCABULARY',head).className='print-brand';el('h1',chapter.title+' · 단어장',head);el('p',data.length+'개',head);var grid=el('div',null,p);grid.className='print-columns';var cols=[el('ol',null,grid),el('ol',null,grid)];el('footer','',p);return{node:p,cols:cols};}
   function item(group,i){
    var d=group[0],li=el('li');li.className='print-example-group';var exampleId='print-example-'+i,translationId='print-translation-'+i;
    var unit=el('section',null,li);unit.className='print-word-unit';unit.dataset.wordId=d.id;unit.dataset.wordNumber=String(d.number);unit.dataset.exampleKind=d.exampleKind||'usage';unit.setAttribute('aria-describedby',options.hideMeaning?exampleId:exampleId+' '+translationId);
    var top=el('div',null,unit);top.className='print-word-line';el('span',String(d.number).padStart(2,'0'),top).className='print-number';el('strong',d.word,top).className='print-word';if(!options.hideMeaning){el('span',d.pos,top).className='print-pos';el('span',d.meaning,top).className='print-meaning';}
    
    var ex=el('p',d.example,unit);ex.className='print-example';ex.id=exampleId;ex.lang='en';if(!options.hideMeaning){var ko=el('p',d.translation,unit);ko.className='print-translation';ko.id=translationId;
    var pairs=el('p',null,unit);pairs.className='print-pairs';if(d.usage)el('span','Tip. '+d.usage,pairs).className='print-usage';if(d.usage&&d.paraphrase)el('span',' / ',pairs).className='print-pair-separator';if(d.paraphrase)el('span','≈ '+d.paraphrase,pairs).className='print-paraphrase';}return li;
   }
   return Promise.resolve(doc.fonts&&doc.fonts.ready).then(function(){
    if(win.closed)return;if(options.isCurrent&&!options.isCurrent()){win.close();return;}
    function paginate(){
     Array.from(doc.querySelectorAll('.vocabulary-paper')).forEach(function(n){n.remove();});var pages=[page()],current=pages[0],column=0,oversized=false;
     groups.forEach(function(d,i){var n=item(d,i),col=current.cols[column];col.appendChild(n);if(col.scrollHeight>col.clientHeight+1&&col.children.length>1){n.remove();if(column===0)column=1;else{current=page();pages.push(current);column=0;}col=current.cols[column];col.appendChild(n);}if(col.scrollHeight>col.clientHeight+1)oversized=true;});
     return{pages:pages,overflow:oversized||pages.some(function(p){return p.cols.some(function(c){return c.scrollHeight>c.clientHeight+1;});})};
    }
    var layoutResult=paginate(),bodyPt=10.5,pages=layoutResult.pages,count=pages.length,overflow=layoutResult.overflow;
    var last=pages[pages.length-1],tail=Array.from(last.node.querySelectorAll('li')),bestCut=tail.length,bestGap=Infinity;
    if(tail.length>1){for(var cut=1;cut<tail.length;cut++){tail.forEach(function(n,i){last.cols[i<cut?0:1].appendChild(n);});if(last.cols.some(function(c){return c.scrollHeight>c.clientHeight+1;}))continue;var hs=last.cols.map(function(c){return Array.from(c.children).reduce(function(v,n){return v+n.getBoundingClientRect().height;},0);});if(Math.abs(hs[0]-hs[1])<bestGap){bestGap=Math.abs(hs[0]-hs[1]);bestCut=cut;}}tail.forEach(function(n,i){last.cols[i<bestCut?0:1].appendChild(n);});}
    pages.forEach(function(p,i){p.node.dataset.fit=overflow?'overflow':'ready';p.node.querySelector('footer').textContent=chapter.title+' · '+(i+1)+' / '+count+(data.some(function(d){return d.exampleKind==='authored_learning';})?' · 일부 예문은 학습용으로 보완':'');});
    doc.body.dataset.pages=String(count);doc.body.dataset.bodyPt=String(bodyPt);doc.body.dataset.fit=overflow?'overflow':'ready';
    button.disabled=overflow;
    hint.textContent=overflow?'한 항목이 인쇄 영역보다 길어 출력 확인이 필요해요.':'A4 '+count+'쪽 · '+(options.hideMeaning?'뜻과 해석을 가린 인쇄본':'뜻과 제공된 예문·보충 표현 포함')+' · 세로 · 배율 100% · 머리글/바닥글 끄기. 인쇄창에서 “PDF로 저장”을 선택하세요.';
   });
  }).catch(function(){if(!win.closed){doc.body.dataset.fit='error';hint.textContent='인쇄 서식을 불러오지 못했어요. 창을 닫고 다시 열어 주세요.';}});
  win.opener=null;
 }
 root.HanqVocabularyPrint={rows:rows,render:render};
})(window);
