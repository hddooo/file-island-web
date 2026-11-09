/* Browser-local presentation only. Does not own routes, accounts or learning data. */
(function (root) {
  'use strict';
  var doc=root.document, KEY='hanq:company-mode:v1', mode='default', queued=false, observer=null;
  var originalTitle=doc.title, originalIcon=null;
  try { if(root.localStorage.getItem(KEY)==='company')mode='company'; } catch (_) {}
  function enabled(){return mode==='company';}
  function isHistory(){return doc.documentElement.hasAttribute('data-company-document')||/^#(?:history|past-exams|chapter|formal-exams|wrongnotes|exams|run|textbook|reviews?)(?:\/|$)/.test(location.hash);}
  function syncControls(){doc.querySelectorAll('[data-company-mode-toggle]').forEach(function(b){b.setAttribute('aria-pressed',String(enabled()));var label=enabled()?'회사 모드 끄기':'회사 모드 켜기';if(b.textContent!==label)b.textContent=label;});}
  function apply(value){
    mode=value==='company'?'company':'default';
    // Keep the original theme attribute untouched, especially standalone readers.
    doc.documentElement.dataset.companyMode=enabled()?'on':'off';
    doc.documentElement.toggleAttribute('data-history-typography',isHistory());
    doc.documentElement.toggleAttribute('data-company-history',enabled()&&isHistory());
    var meta=doc.querySelector('meta[name="theme-color"]');if(meta)meta.content=enabled()?'#0d1117':'#050706';
    doc.title=enabled()?'Workspace · Files':originalTitle;
    var icon=doc.querySelector('link[rel="icon"]');
    if(icon){if(originalIcon===null)originalIcon=icon.getAttribute('href');icon.setAttribute('href',enabled()?'/media/company-mode-icon.svg':originalIcon);}
    syncControls();
    if(doc.body){sync();doc.dispatchEvent(new root.CustomEvent('hanq:display-mode-change',{detail:{mode:mode}}));}
  }
  function select(value){
    apply(value);var saved=true;
    try{root.localStorage.setItem(KEY,mode);}catch(_){saved=false;}
    var status=doc.querySelector('[data-company-status]');
    if(status)status.textContent=saved?'이 브라우저에 설정을 저장했습니다.': '선택을 저장할 수 없어 현재 탭에만 적용됩니다.';
    return saved;
  }
  function html(){return '<section class="company-setting" aria-labelledby="companyModeTitle"><div><h3 id="companyModeTitle">화면 설정</h3><p>회사 모드 · 지도와 캐릭터 대신 텍스트 목록과 코드 스타일로 표시합니다. 이 브라우저에서 다음 접속에도 유지됩니다.</p></div><button type="button" class="tool-btn" data-company-mode-toggle aria-pressed="'+enabled()+'">'+(enabled()?'회사 모드 끄기':'회사 모드 켜기')+'</button><p data-company-status role="status" aria-live="polite"></p></section>';}
  var directories={
    workspace:{name:'workspace',rows:[['history','#history','한국사','시대별 자료 및 문제'],['english','#toeic/map','TOEIC','어휘 · 문법 · 듣기 · 문제'],['sessions','#battle','퀴즈 대결','기존 대결 및 기록'],['collection','#rainbow','보관함 · 상점','파트너 및 보유 목록'],['ranking','#hall-of-fame','순위','명예의 전당'],['inquiries','/inquiries/','건의·문의','문의 작성 및 접수'],['settings','#account','마이페이지','내 정보 및 화면 설정']]},
    history:{name:'history',rows:[['chapters','#past-exams','시대별 학습','개념 · 핵심 요약 · 빈칸'],['exams','#formal-exams','실전모의고사','회차별 문제와 결과'],['review','#wrongnotes','오답노트','기존 기록 복습']]},
    english:{name:'english',rows:[['vocabulary','#toeic/notebook','Vocabulary','단어장'],['practice','#toeic/wrongnotes','Practice','파트별 실전 문제'],['grammar','#toeic/grammar','Grammar','문법'],['listening','#toeic/player','Listening','듣기 및 대본']]}
  };
  function element(tag,cls,text){var n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  function directory(key){
    var data=directories[key],box=element('section','company-directory');box.dataset.companyDirectory=key;box.setAttribute('aria-label',data.name+' 목록');
    var top=element('div','company-directory-head');top.append(element('strong','','workspace / '+data.name),element('span','',data.rows.length+' directories'));box.append(top);
    var list=element('div','company-file-list');
    data.rows.forEach(function(r){var a=element('a','company-file-row');a.href=r[1];var name=element('span','company-file-name');name.append(element('span','company-folder','▱'),element('span','',r[0]));var title=element('span','company-file-title',r[2]),desc=element('span','company-file-desc',r[3]);a.append(name,title,desc);list.append(a);});box.append(list);return box;
  }
  // Decorate native controls, never clone them or take over their routes/state.
  function nativeFile(node,name){
    if(!node)return;
    var label=node.querySelector(':scope > [data-company-added]');
    if(!label){label=element('span','company-native-file');label.setAttribute('data-company-added','');label.setAttribute('aria-hidden','true');node.insertBefore(label,node.firstChild);}
    if(label.textContent!==name)label.textContent=name;
    node.setAttribute('data-company-native-row','');
  }
  function nativeDirectory(node,path,count){if(node){var title=path+' / '+count+' files';if(node.getAttribute('data-company-native-directory')!==title)node.setAttribute('data-company-native-directory',title);}}
  function nativeDirectories(){
    doc.querySelectorAll('#app .toc:not(.hanq-rm__toc)').forEach(function(list){var rows=list.querySelectorAll(':scope > .period[data-id], :scope > .era-progress-row > .period[data-id]');if(!rows.length)return;nativeDirectory(list,'history / chapters',rows.length);rows.forEach(function(b,i){nativeFile(b,String(i+1).padStart(2,'0')+'-'+b.dataset.id+'.md');});});
    doc.querySelectorAll('#app .hanq-rm__toc').forEach(function(list){var rows=list.querySelectorAll(':scope > .period[data-group]');if(!rows.length)return;nativeDirectory(list,'history / reviews',rows.length);rows.forEach(function(b){nativeFile(b,b.dataset.group+'.md');});});
    doc.querySelectorAll('#app .tn-chapter-list').forEach(function(list){var rows=list.querySelectorAll(':scope > .tn-chapter-row');nativeDirectory(list,'english / vocabulary',rows.length);var index=0;rows.forEach(function(row){nativeFile(row.querySelector('.tn-chapter-open'),row.classList.contains('tn-selected-chapter')?'checked-words.md':'chapter-'+String(++index).padStart(2,'0')+'.md');nativeFile(row.querySelector('.tn-chapter-pdf'),'PDF');});});
    doc.querySelectorAll('#app .tn-recent-primary').forEach(function(list){var rows=list.querySelectorAll('.tn-recent-item');nativeDirectory(list,'vocabulary / recent',rows.length);rows.forEach(function(b,i){nativeFile(b,'entry-'+String(i+1).padStart(2,'0')+'.md');});});
    doc.querySelectorAll('#app .tn-add-note').forEach(function(b){nativeFile(b,'+ new-entry');});
    doc.querySelectorAll('#app .tg-chapter-cards').forEach(function(list){var rows=list.querySelectorAll(':scope > .tg-focus-index-row');nativeDirectory(list,'english / grammar',rows.length);rows.forEach(function(row,i){nativeFile(row.querySelector('.toeic-list-open'),'note-'+String(i+1).padStart(2,'0')+'.md');});});
    doc.querySelectorAll('#app .tc-group-list').forEach(function(list){var rows=list.querySelectorAll(':scope > .tc-group-row');nativeDirectory(list,'english / practice',rows.length);rows.forEach(function(row,i){var b=row.querySelector('.tc-group'),label=b&&b.querySelector('.tc-group-label'),part=label&&label.textContent.match(/Part\s+([0-9.,]+)/i);nativeFile(b,part?'part-'+part[1].replace(/[.,]/g,'-')+'.json':'group-'+String(i+1).padStart(2,'0')+'.json');});});
    // A live player may be parked outside #app while another route is open.
    doc.querySelectorAll('.lc-track-list').forEach(function(list){var rows=list.querySelectorAll('.lc-track');nativeDirectory(list,'listening / playlist',rows.length);rows.forEach(function(b,i){nativeFile(b,'track-'+String(i+1).padStart(3,'0')+'.mp3');});});
    doc.querySelectorAll('#hallHost .hall-page > section:not(.hall-podium)').forEach(function(list){nativeDirectory(list,'ranking / members.json',list.querySelectorAll('.hall-person').length);});
    doc.querySelectorAll('#hallHost .hall-podium').forEach(function(list){nativeDirectory(list,'ranking / leaders.json',list.querySelectorAll('.hall-podium-person').length);});
    historyDirectories();
  }
  function historyDirectories(){
    var stepFiles={0:'concept.md',1:'summary.md',2:'quiz.json',3:'practice.json',4:'review.md',5:'culture.md',6:'blank-quiz.md',7:'exam-patterns.md',8:'source-quiz.md'};
    doc.querySelectorAll('#app[data-company-history] .steps').forEach(function(list){var rows=list.querySelectorAll(':scope > .step[data-step]');if(!rows.length||list.closest('[hidden]'))return;nativeDirectory(list,'history / documents',rows.length);rows.forEach(function(b){nativeFile(b,stepFiles[b.dataset.step]||'document.md');});});
    ['gsr','jsr'].forEach(function(prefix){['topics','modes'].forEach(function(kind){doc.querySelectorAll('#app .'+prefix+'-'+kind).forEach(function(list){if(list.closest('[hidden]'))return;var key=kind==='topics'?'topic':'mode',rows=list.querySelectorAll(':scope > button[data-'+key+']');nativeDirectory(list,'history / '+(prefix==='gsr'?'goryeo':'joseon')+' / '+kind,rows.length);rows.forEach(function(b){nativeFile(b,b.dataset[key]+'.md');});});});});
    doc.querySelectorAll('#app .textbook-controls [role=tablist]').forEach(function(list){if(list.closest('[hidden]'))return;var rows=list.querySelectorAll(':scope > button[data-mode]');if(!rows.length)return;nativeDirectory(list,'history / source',rows.length);rows.forEach(function(b){nativeFile(b,b.dataset.mode+'.md');});});
    doc.querySelectorAll('#app .textbook-supplement-links').forEach(function(list){var rows=list.querySelectorAll('a[href^="#textbook/"]');if(!rows.length||list.closest('[hidden]'))return;nativeDirectory(list,'history / reference',rows.length);rows.forEach(function(a){nativeFile(a,a.getAttribute('href').split('/').pop()+'.md');});});
    doc.querySelectorAll('#formalExamHost .fe-rounds').forEach(function(list){var rows=list.querySelectorAll('.fe-round button[data-round]');if(!rows.length)return;nativeDirectory(list,'history / exams',rows.length);rows.forEach(function(b){nativeFile(b,'round-'+b.dataset.round+'.json');});});
    doc.querySelectorAll('#cbtWrongNotebookHost .fe-rounds').forEach(function(list){var rows=list.querySelectorAll(':scope > button[data-notebook-round]');if(!rows.length)return;nativeDirectory(list,'history / review',rows.length);rows.forEach(function(b){nativeFile(b,'round-'+b.dataset.notebookRound+'-wrong.json');});});
    doc.querySelectorAll('#formalExamHost .fe-reviews,#cbtWrongNotebookHost .fe-reviews').forEach(function(list){var rows=list.querySelectorAll(':scope > .fe-review > details > summary');if(!rows.length)return;nativeDirectory(list,'history / questions',rows.length);rows.forEach(function(s,i){var title=Array.from(s.childNodes).filter(function(n){return n.nodeType!==1||!n.hasAttribute('data-company-added');}).map(function(n){return n.textContent;}).join('');var m=title.match(/제(\d+)회\s+(\d+)번/);nativeFile(s,m?'round-'+m[1]+'-q'+m[2].padStart(3,'0')+'.md':'question-'+String(i+1).padStart(3,'0')+'.md');});});
  }
  function clearNativeDirectories(){doc.querySelectorAll('[data-company-added]').forEach(function(n){n.remove();});doc.querySelectorAll('[data-company-native-directory],[data-company-native-row]').forEach(function(n){n.removeAttribute('data-company-native-directory');n.removeAttribute('data-company-native-row');});}
  function sync(){
    queued=false;doc.documentElement.toggleAttribute('data-history-typography',isHistory());var app=doc.getElementById('app')||(doc.documentElement.hasAttribute('data-company-document')?doc.body:null);if(!app)return;
    syncControls();
    if(!enabled()){clearNativeDirectories();app.removeAttribute('data-company-history');doc.querySelectorAll('.company-image-note').forEach(function(n){n.remove();});app.querySelectorAll('.company-directory,.company-codebar').forEach(function(n){n.remove();});app.querySelectorAll('[data-company-map-original]').forEach(function(n){n.removeAttribute('data-company-map-original');});return;}
    var pane=app.querySelector(':scope > .device-content')||app;
    var historyText=isHistory();
    doc.documentElement.toggleAttribute('data-company-history',historyText);
    if(historyText)app.setAttribute('data-company-history','');else{app.removeAttribute('data-company-history');doc.querySelectorAll('.company-image-note').forEach(function(n){n.remove();});}
    // Hide media without replacement labels; normal-mode DOM remains intact.
    doc.querySelectorAll('.company-image-note').forEach(function(n){n.remove();});

    var map=app.querySelector('#worldMapHost'),english=app.querySelector('.toeic-travel-map'),history=app.querySelector('.history-home-hero');
    var key=map?'workspace':english?'english':history&&!app.querySelector('.toc')?'history':null;
    var current=app.querySelector('.company-directory');if(current&&current.dataset.companyDirectory!==key){current.remove();current=null;}
    if(key&&!current){current=directory(key);var before=map||english&&english.closest('.toeic-menu')||history;before.parentNode.insertBefore(current,before);}
    [map,english,history].filter(Boolean).forEach(function(n){n.setAttribute('data-company-map-original','');});
    if(key==='history'){var nav=app.querySelector('.history-travel-map,nav[aria-label="한국사 학습 지도"],nav[aria-label="메인 메뉴"]');if(nav)nav.setAttribute('data-company-map-original','');}
    var bar=pane.querySelector(':scope > .company-codebar');
    if(!bar){bar=element('div','company-codebar');bar.setAttribute('aria-hidden','true');pane.insertBefore(bar,pane.firstChild);}
    var path=location.pathname.indexOf('/inquiries')===0?'workspace / inquiries.md':location.hash.replace(/^#/, '').replace(/\//g,' / ')||'workspace';
    var barText=key?'Files / '+directories[key].name:'Code / '+path;
    if(bar.textContent!==barText)bar.textContent=barText;
    nativeDirectories();
    // CSS-only gutters: never replace text, controls, IDs, answers or reader ownership.
    var line=0;
    app.querySelectorAll('p,h2,h3,h4,.bubble,.tn-word,.tg-topic-title,.tc-question-text,.mock-stem,.textbook-source-quiz-item').forEach(function(n){
      if(n.closest('.company-directory,[data-company-native-directory],.company-setting,.company-codebar,.company-image-note,.device-crown,[data-company-map-original],.ac-sr,[hidden]')||!n.textContent.trim()||n.querySelector('p,h2,h3,h4'))return;
      var value=String(++line);if(n.getAttribute('data-company-line')!==value)n.setAttribute('data-company-line',value);
    });
  }
  function schedule(){if(queued)return;queued=true;root.queueMicrotask(sync);}
  function ready(){
    sync();var app=doc.getElementById('app')||(doc.documentElement.hasAttribute('data-company-document')?doc.body:null);if(doc.documentElement.hasAttribute('data-company-document'))doc.body.classList.add('company-document');if(app){observer=new root.MutationObserver(function(records){if(records.some(function(r){return !r.target.closest||!r.target.closest('.company-directory,.company-codebar,.company-image-note');}))schedule();});observer.observe(doc.body||app,{childList:true,subtree:true});}
  }
  doc.addEventListener('click',function(event){if(event.target.closest&&event.target.closest('[data-company-mode-toggle]'))select(enabled()?'default':'company');});
  root.addEventListener('storage',function(event){if(event.key===KEY||event.key===null)apply(event.newValue);});
  root.addEventListener('hashchange',schedule);root.addEventListener('popstate',schedule);root.addEventListener('pageshow',schedule);
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  root.HanqDisplayMode={select:select,current:function(){return mode;},html:html,refresh:schedule};
  apply(mode);
})(window);


