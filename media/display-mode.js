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
    workspace:{name:'workspace',rows:[['history','#history','한국사','시대별 자료 및 문제'],['english','#toeic/map','TOEIC','어휘 · 문법 · 듣기 · 문제'],['sessions','#battle','퀴즈 대결','기존 대결 및 기록'],['collection','#rainbow','보관함 · 상점','파트너 및 보유 목록'],['ranking','#hall-of-fame','순위','명예의 전당'],['inquiries','/inquiries/','건의·문의','문의 작성 및 접수'],['settings','#account','MyPage','내 정보 및 화면 설정']]},
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
  function sync(){
    queued=false;var app=doc.getElementById('app')||(doc.documentElement.hasAttribute('data-company-document')?doc.body:null);if(!app)return;
    syncControls();
    if(!enabled()){app.removeAttribute('data-company-history');app.querySelectorAll('.company-image-note').forEach(function(n){n.remove();});app.querySelectorAll('.company-directory,.company-codebar').forEach(function(n){n.remove();});app.querySelectorAll('[data-company-map-original]').forEach(function(n){n.removeAttribute('data-company-map-original');});return;}
    var pane=app.querySelector(':scope > .device-content')||app;
    var historyText=isHistory();
    doc.documentElement.toggleAttribute('data-company-history',historyText);
    if(historyText)app.setAttribute('data-company-history','');else{app.removeAttribute('data-company-history');app.querySelectorAll('.company-image-note').forEach(function(n){n.remove();});}
    if(historyText){(doc.body||pane).querySelectorAll('img,svg:not(button svg):not(a svg),canvas,video,iframe').forEach(function(n){
      if(n.closest('.device-crown,[data-company-map-original],.company-image-note')||n.nextElementSibling&&n.nextElementSibling.classList.contains('company-image-note'))return;
      var alt=n.getAttribute('alt')||n.getAttribute('aria-label')||'',note=element('span','company-image-note',alt?'// image: '+alt:'// 이미지 자료 생략 · 일반 모드에서 확인');
      n.insertAdjacentElement('afterend',note);
    });}

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
    // CSS-only gutters: never replace text, controls, IDs, answers or reader ownership.
    var line=0;
    app.querySelectorAll('p,h2,h3,h4,.bubble,.tn-word,.tg-topic-title,.tc-question-text,.mock-stem,.textbook-source-quiz-item').forEach(function(n){
      if(n.closest('.company-directory,.company-setting,.company-codebar,.company-image-note,.device-crown,[data-company-map-original],.ac-sr,[hidden]')||!n.textContent.trim()||n.querySelector('p,h2,h3,h4'))return;
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
