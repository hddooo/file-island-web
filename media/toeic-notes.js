(function(root){'use strict';
 var parts=[['1','Part 1'],['2','Part 2'],['3-4','Part 3·4'],['5-6','Part 5·6'],['7','Part 7'],['unclassified','분류 미지정']],active=null,memory=null,detailMemory={owner:null,values:new Map()};
 var fields=[['meaning','문맥상 뜻'],['synonyms','동의어·유사표현 (한 줄에 하나, 최대 3개)'],['example','영어 원문 예문'],['translation','한국어 해석'],['structure','문장 구조'],['confusion','혼동 표현'],['sourceText','원문 · 사진에서 옮긴 문장'],['sourceReference','출처 · 사진 이름이나 메모']];
 function english(n){return (n.example||'').split('\n').filter(function(line){return !/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(line);}).join('\n');}
 function translation(n){return n.translation||(n.example||'').split('\n').filter(function(line){return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(line);}).join('\n');}
 function meaningDisplay(n){var refinements={
  'redeem':['교환하다, 상환하다; 되찾다, 만회하다','포인트를 사용해 혜택으로 교환하다'],
  'wallpaper':['벽지','사무실에 붙일 벽지'],
  'be suspended from ~':['매달려 있다; 정직·정학 처분을 받다','~에 매달려 있다'],
  'refer to':['언급하다; 참고하다, 참조하다','~을 참고하다 / 참조하다'],
  'a portion of':['~의 일부','도로의 일부 구간'],
  'secretary':['비서','']
 };var expected={"redeem": "이 문맥에서는 포인트를 사용해 혜택으로 교환하다", "wallpaper": "벽지 · 이 문맥에서는 사무실에 붙일 벽지", "be suspended from ~": "이 문맥에서는 ~에 매달려 있다", "refer to": "이 문맥에서는 ~을 참고하다 / 참조하다", "a portion of": "~의 일부 · 여기서는 도로의 일부 구간", "secretary": "이 문맥에서는 비서"};var expression=n.expression.normalize('NFKC').trim().toLowerCase(),refined=refinements[expression];if(refined&&n.meaning===expected[expression])return{general:refined[0],context:refined[1]};var match=(n.meaning||'').match(/^([\s\S]*?)\n\(이 문맥에서는:\s*([\s\S]*?)\)$/);return match?{general:match[1],context:match[2]}:{general:n.meaning,context:''};}
 function cleanNotebookText(value){return String(value||'').replace(/\((?:\d+번(?:에서는|에서|은|는)?\s*[:：]?|보기\s*[A-D]\b)[\s\S]*?\)/g,'').replace(/(?:^|\n)\s*\d+번(?:에서는|에서|은|는)\s*[:：][^\n]*/g,'').replace(/[ \t]+\n/g,'\n').trim();}
 function noteLayout(n){
  var base=meaningDisplay(n),text=cleanNotebookText(base.general),marker=/\s*(?:자주\s*쓰는\s*결합|Tip)\s*[:：]\s*/i,sections=text.split(marker),tips=[];
  function add(value){cleanNotebookText(value).split(/\n+|,\s*(?=[A-Za-z])/).map(function(x){return x.trim().replace(/^(?:Tip\s*[:：]|자주\s*쓰는\s*결합\s*[:：])\s*/i,'');}).filter(Boolean).forEach(function(line){if(tips.indexOf(line)<0)tips.push(line);});}
  sections.slice(1).forEach(add);add(n.structure);add(n.confusion);
  var label=n.expression.trim(),normalized=label.toLowerCase();
  if(normalized==='eligible'){tips=['be eligible for + 명사 (~의 자격이 있는)','be eligible to + 동사원형 (~할 자격이 있는)'];}
  if(/^appreciation\s+of\b/i.test(label)){label='appreciation of';['appreciation of nature — 자연에 대한 감상·이해','appreciation of art — 예술에 대한 감상·이해'].forEach(function(line){if(tips.indexOf(line)<0)tips.push(line);});}
  var special=/would\s+have\s+been\s+able\s+to/i.test(n.expression)&&/wouldn['’]t\s+have\s+been\s+able\s+to/i.test(n.expression);
  var result={forms:special?[{expression:'would have been able to + V',meaning:'~할 수 있었을 텐데'},{expression:'wouldn’t have been able to + V',meaning:'~할 수 없었을 텐데'}]:null,general:special?'':sections[0].trim(),context:cleanNotebookText(base.context),tips:tips,title:special?'would have been able to + V\nwouldn’t have been able to + V':label.replace(/\s+\/\s+(?=(?:Had|If)\b)/gi,'\n').replace(/\s+\/\s+/g,label.length>55?'\n':' / '),verbHint:special?'V = 동사원형':''};
  var labelInfo=root.HanqVocabularyLabels&&root.HanqVocabularyLabels.get(n);if(labelInfo){result.title=labelInfo.title;if(!special){result.forms=null;result.verbHint='';}result.partOfSpeech=labelInfo.partOfSpeech||n.partOfSpeech;result.usageReference=n.expression+'\n'+cleanNotebookText(n.meaning);result.tips.unshift(n.expression+' — '+cleanNotebookText(base.general).split('\n')[0]);if(labelInfo.meaning)result.general=labelInfo.meaning;result.context='';}return result;
 }

 function key(s){return s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
 function stop(){if(active)active.stop();active=null;}
 var PAGE_SIZE=50;
 var chapterPromise=null;
 function validateChapters(data){
  var seen=new Set(),ids=new Set();
  if(!data||data.schemaVersion!==1||data.version!=='vocabulary-chapters-v1'||!Array.isArray(data.chapters)||!data.chapters.length)throw Error('invalid chapter manifest');
  data.chapters.forEach(function(c){
   if(!c||!/^vocab-\d{3}-v1$/.test(c.id)||ids.has(c.id)||typeof c.title!=='string'||c.version!==1||!Array.isArray(c.wordIds)||!c.wordIds.length||c.wordIds.length>PAGE_SIZE||!['preparing','ready'].includes(c.examStatus)||(c.examStatus==='ready'&&!/^vocab-00[1-3]-v1$/.test(c.id)))throw Error('invalid chapter');
   ids.add(c.id);c.wordIds.forEach(function(id){if(typeof id!=='string'||!id.length||seen.has(id))throw Error('duplicate chapter word');seen.add(id);});
  });if(data.retiredWordIds&&(!Array.isArray(data.retiredWordIds)||data.retiredWordIds.some(function(id){return !seen.has(id);})||new Set(data.retiredWordIds).size!==data.retiredWordIds.length))throw Error('invalid retired words');return data;
 }
 function loadChapters(){
  if(!chapterPromise){var controller=new AbortController(),timer=root.setTimeout(function(){controller.abort();},10000);
   chapterPromise=root.fetch('/media/vocabulary-chapters-v1.json',{signal:controller.signal}).then(function(r){if(!r.ok)throw Error('chapter unavailable');return r.json();}).then(validateChapters).catch(function(e){chapterPromise=null;throw e;}).finally(function(){root.clearTimeout(timer);});
  }
  return chapterPromise;
 }
 function chapterGroups(data,words){
  var byId=new Map(),retired=new Set(data.retiredWordIds||[]),order=[],seen=new Set();
  words.forEach(function(n){if(n&&n.id&&!byId.has(n.id))byId.set(n.id,n);});
  data.chapters.forEach(function(c){c.wordIds.forEach(function(id){if(!retired.has(id)&&byId.has(id)&&!seen.has(id)){seen.add(id);order.push(byId.get(id));}});});
  var remaining=Array.from(byId.values()).filter(function(n){return !retired.has(n.id)&&!seen.has(n.id);}).sort(function(a,b){var ad=Date.parse(a.createdAt||a.addedOn||''),bd=Date.parse(b.createdAt||b.addedOn||'');return (Number.isFinite(ad)?ad:0)-(Number.isFinite(bd)?bd:0)||String(a.id).localeCompare(String(b.id));});
  order=order.concat(remaining);var groups=[];for(var i=0;i<order.length;i+=PAGE_SIZE){var number=Math.floor(i/PAGE_SIZE)+1,items=order.slice(i,i+PAGE_SIZE);groups.push({id:'vocab-'+String(number).padStart(3,'0')+'-v1',title:'Chapter '+number,version:1,expected:items.length,retired:0,words:items});}
  return{chapters:groups,unassigned:[],retired:Array.from(byId.values()).filter(function(n){return retired.has(n.id);})};
 }
 var CHECK_KEY='hanq:toeic:word-checks:v1',checkMemory={ids:[],onlyChecked:false};
 function readChecks(){try{var raw=root.localStorage.getItem(CHECK_KEY);if(raw===null)return{ids:[],onlyChecked:false};if(raw.length>1000000)throw Error('invalid checks');var d=JSON.parse(raw);if(!d||!Array.isArray(d.ids)||d.ids.length>10000||typeof d.onlyChecked!=='boolean')throw Error('invalid checks');return{ids:Array.from(new Set(d.ids.filter(function(id){return typeof id==='string'&&/^[a-zA-Z0-9:_%.()~-]{1,200}$/.test(id);}))),onlyChecked:d.onlyChecked};}catch(e){return{ids:checkMemory.ids.slice(),onlyChecked:checkMemory.onlyChecked,storageError:true};}}
 // Beside the word only part-of-speech tags: labels such as 관용 표현·구문·불가산·-ing형 notes are dropped from the header.
 function posTags(text){var found=[];String(text||'').replace(/대명사|자동사|타동사|형용사|부사|명사구|명사|동사|전치사|접속사/g,function(m){if(found.indexOf(m)<0)found.push(m);return m;});if(found.indexOf('자동사')>=0||found.indexOf('타동사')>=0)found=found.filter(function(m){return m!=='동사';});return found.join(' ');}
 function decoratePosBadges(host){var labels={'형용사':'형','부사':'부','명사':'명','명사구':'명','대명사':'대.명','자동사':'자.동','타동사':'타.동','동사':'동','전치사':'전','접속사':'접'};host.querySelectorAll('.tn-card-pos,.tn-tips li,.tn-pair-gloss,.tn-card-meaning').forEach(function(parent){var walker=document.createTreeWalker(parent,NodeFilter.SHOW_TEXT),nodes=[],n;while((n=walker.nextNode()))if(!n.parentElement.closest('.tn-pos-badge'))nodes.push(n);nodes.forEach(function(node){var text=node.nodeValue,re=/\[?(대명사|자동사|타동사|형용사|부사|명사구|명사|동사|전치사|접속사)\]?/g,m,last=0,fragment=document.createDocumentFragment();while((m=re.exec(text))){fragment.appendChild(document.createTextNode(text.slice(last,m.index)));var badge=document.createElement('span');badge.className='tn-pos-badge';badge.textContent=labels[m[1]];badge.title=m[1];badge.setAttribute('aria-label',m[1]);fragment.appendChild(badge);last=re.lastIndex;}if(last){fragment.appendChild(document.createTextNode(text.slice(last)));node.replaceWith(fragment);}});});}
 // Export only learning content already returned by the authorized notebook request.
 function contentExport(notes,supplemental,archived){
  var strings=['id','part','expression','partOfSpeech','meaning','example','translation','structure','confusion','sourceText','sourceReference','exampleSource','exampleKind','originalExample','originalTranslation','supplementaryExample','supplementaryTranslation'];
  function pick(n){var item={};strings.forEach(function(k){if(typeof n[k]==='string')item[k]=n[k];});if(Number.isInteger(n.revision)&&n.revision>=0)item.revision=n.revision;if(Array.isArray(n.synonyms))item.synonyms=n.synonyms.filter(function(x){return typeof x==='string';});return item;}
  var data={kind:'hanq-vocabulary-content',schemaVersion:1,notes:notes.map(pick),supplemental:supplemental.map(pick),archived:archived.map(pick)};
  data.counts={notes:data.notes.length,supplemental:data.supplemental.length,archived:data.archived.length};return data;
 }
 function mount(host,opts){stop();var checkStore=null,checkState=null;var api=opts.api,session=root.HanqAuthSession,alive=true,ticket=0,owner=null,notes=[],archived=[],searchIndex=new Map(),shown={},testMode=false,query=focusQuery(),focusPending=!!query,batch=0,loaded=false,part='',draft=null,baseline='',busy=false,off,unregister,recallToCarry=null,localChecks=readChecks(),checked=new Set(localChecks.ids),onlyChecked=localChecks.onlyChecked,checkStorageError=!!localChecks.storageError;
  var chapters=null,chapterError=false,chapterLoading=false,chapterView=initialChapterView(),recentPopup=null,canManage=false,visibility=null;
  // 주소에서 넘어온 단어(opts.focusTerm)는 검색어 문자열로만 쓴다. 기존 노트는 같은 검색 색인으로 찾고 새 노트를 만들지 않는다.
  function focusQuery(){var t=opts&&opts.focusTerm;return typeof t==='string'?t.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,300):'';}
  function el(tag,text,parent){var n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n;}
  function btn(text,fn,parent){var b=el('button',text,parent);b.type='button';b.addEventListener('click',fn);return b;}
  function state(){return api&&api.state?api.state():{};}
  function identity(){var s=state();return s.signedIn&&s.ownerId||null;}
  function valid(){return alive&&owner&&owner===identity();}
  function capture(){if(!draft)return null;var form=host.querySelector('form');if(form&&form.dataset.noteOwner===owner&&form.dataset.noteId===draft.id)Array.from(form.elements).forEach(function(n){if(n.name)draft[n.name]=n.name==='synonyms'?n.value.split('\n').map(function(x){return x.trim();}).filter(Boolean):n.value;});return JSON.parse(JSON.stringify(draft));}
  function dirty(){return !!draft&&JSON.stringify(capture())!==baseline;}
  function remember(){if(owner&&draft&&dirty())memory={owner:owner,draft:capture()};else memory=null;}
  function discard(){if(dirty()&&!root.confirm('아직 저장하지 않은 내용이 있어요. 편집을 닫을까요?'))return false;draft=null;memory=null;return true;}
  function notice(text){var n=host.querySelector('[role="status"]');if(n)n.textContent=text;}
  function error(e){return e&&e.code==='duplicate_expression'?'같은 표현이 있어요. 기존 노트를 열어 내용을 보태 주세요.':e&&e.code==='note_conflict'?'다른 탭에서 노트가 바뀌었거나 이전 저장이 완료됐을 수 있어요. 목록을 새로 불러온 뒤 내용을 비교해 주세요.':e&&e.code==='merge_too_long'?'합친 내용이 너무 길어요. 내용을 줄인 뒤 다시 시도해 주세요.':e&&e.status===401?'로그인을 다시 확인해 주세요.':e&&e.status===404?'노트를 찾지 못했어요. 목록을 다시 불러와 주세요.':'연결 또는 저장을 확인하지 못했어요. 입력은 유지됩니다. 다시 시도해 주세요.';}
  function controlsDisabled(value){busy=value;host.querySelectorAll('button,input,select,textarea').forEach(function(n){n.disabled=value;});}
  function skeleton(){host.replaceChildren();host.className='tn';var top=el('div',undefined,host);top.className='tn-top';el('p','TOEIC Vocabulary',top);btn(opts.backLabel||'← 한국사',function(){if(discard())opts.onHome();},top);el('h1','TOEIC Vocabulary',host);var n=el('p','',host);n.setAttribute('role','status');n.setAttribute('aria-live','polite');}
  function authScreen(){skeleton();var s=state();if(s.restoring){notice('로그인을 확인하고 있어요…');return;}el('h2','로그인 회원용 단어장',host);el('p','로그인하면 회원공개 단어장을 볼 수 있어요.',host);btn('로그인 · 회원가입',function(){if(session)session.remember(opts.returnTo||'#toeic',null);opts.onAccount();},host);}
  async function load(){var t=++ticket,who=owner;notice('노트를 불러오고 있어요…');try{var d=await(root.HanqStudyPresentation?HanqStudyPresentation.take(api,'notebook',function(){return api.toeicNotes();}):api.toeicNotes());if(!alive||t!==ticket||who!==identity())return;capture();acceptNotebook(d);draw();}catch(e){if(!alive||t!==ticket||who!==identity())return;notice(error(e));var n=host.querySelector('.tn-retry');if(!n){n=btn('목록 다시 불러오기',load,host);n.className='tn-retry';}}}
  function open(note,progress){if(busy||!valid()||!canManage||!discard())return;recallToCarry=progress||null;draft=note?Object.assign({partOfSpeech:'',translation:'',synonyms:[]},JSON.parse(JSON.stringify(note))):{id:root.crypto.randomUUID(),part:part||'unclassified',partOfSpeech:'',translation:'',synonyms:[],expression:'',meaning:'',structure:'',example:'',confusion:'',sourceText:'',sourceReference:'',revision:0};baseline=JSON.stringify(draft);draw();var f=host.querySelector('[name="expression"]');if(!f)f=host.querySelector('[name="example"]');if(f)f.focus();}
  function supplementalEntries(){return root.HanqToeicSupplement&&root.HanqToeicSupplement.vocabularyEntries?root.HanqToeicSupplement.vocabularyEntries(notes):[];}
  function allWords(){return notes.concat(supplementalEntries().map(function(n){return Object.assign({},n,{supplement:true});}));}
  function initialChapterView(){
   if(query)return 'all';
   var saved=root.history&&root.history.state&&root.history.state.hanqVocabulary;
   if(saved&&saved.version===1&&/^mini-vocab-00[1-3]-v1$/.test(saved.chapterId||''))return 'contents';
   if(saved&&saved.version===1&&saved.chapterId==='unassigned')return 'all';
   if(saved&&saved.version===1&&/^(?:all|unassigned|vocab-\d{3}-v1)$/.test(saved.chapterId||'')){
    query=typeof saved.query==='string'?saved.query.slice(0,300):'';return saved.chapterId;
   }return 'contents';
  }
  function groups(){return chapters?chapterGroups(chapters,allWords().filter(function(n){return !isLyComparison(n);})):null;}
  function chapterWords(all){
   if(chapterView==='all')return all;
   var g=groups();if(!g)return [];
   if(chapterView==='unassigned')return g.unassigned;
   var c=g.chapters.find(function(c){return c.id===chapterView;});return c?c.words:[];
  }
  async function ensureChapters(){
   if(chapters||chapterLoading)return;chapterLoading=true;chapterError=false;
   try{var d=await loadChapters();if(!alive)return;chapters=d;}catch(e){if(!alive)return;chapterError=true;}
   finally{chapterLoading=false;if(valid())draw();}
  }
  function navigateChapter(id,term){
   if(!valid())return;rememberDetails();chapterView=id;query=term||'';batch=0;
   var previous=root.history.state||{};
   root.history.pushState(Object.assign({},previous,{hanq:true,view:'toeic/notebook',depth:(previous.depth||0)+1,hanqVocabulary:{version:1,chapterId:id,query:query}}),'','#toeic/notebook');
   draw();var heading=host.querySelector('.tn-chapter-heading')||host.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}
  }
  function printWords(c,words,settings){
   if(!valid()||!c||!words.length)return;
   var who=owner;
   var win=root.open('','_blank');if(!win){notice('인쇄창을 열 수 없어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.');return;}
   win.document.title='단어장 인쇄 준비';win.document.body.textContent='단어장 인쇄본을 준비하고 있어요…';
   function show(){if(!valid()||owner!==who||win.closed){if(!win.closed)win.close();return;}root.HanqVocabularyPrint.render(win,c,words,noteLayout,Object.assign({},settings||{},{isCurrent:function(){return valid()&&owner===who;}}));}
   if(root.HanqVocabularyPrint){show();return;}
   var script=document.createElement('script');script.src='/media/vocabulary-print.js';script.onload=show;script.onerror=function(){if(!win.closed)win.document.body.textContent='인쇄 기능을 불러오지 못했어요. 창을 닫고 다시 시도해 주세요.';script.remove();};document.head.appendChild(script);
  }
  function printChapter(c){if(!c||c.words.length!==c.expected)return;printWords(c,c.words,{allowMissingSupplement:true,hideMeaning:testMode});}
  function visibleWords(onlySelected){var needle=key(query),all=allWords(),scope=chapterView==='contents'?all:chapterWords(all);return scope.filter(function(n){return !isLyComparison(n)&&(!(chapters&&chapters.retiredWordIds||[]).includes(n.id)||!!needle)&&(!onlySelected||checked.has(n.id))&&(!needle||(n.supplement?key(n.searchText||[n.expression,n.meaning,n.example,n.translation].join(' ')):searchIndex.get(n.id)||'').includes(needle));});}
  function checkedViewReady(){return !!(valid()&&loaded&&checkStore&&checkState&&checkState.ready&&!checkState.error);}
  function checkedPrintReady(){return !!(valid()&&loaded&&checkStore&&checkState&&checkState.ready&&!checkState.saving&&!checkState.error&&!checkState.storageError&&!checkState.canImport);}
  function printVisible(onlySelected){if(onlySelected&&!checkedPrintReady())return;var words=visibleWords(onlySelected);if(!words.length)return;printWords({id:onlySelected?'checked':'visible',title:onlySelected?'체크한 단어':'현재 단어 목록'},words,{allowMissingSupplement:true,hideMeaning:testMode});}
  function drawChapterNavigation(){
   if(chapterView==='contents')return;var nav=el('nav',undefined,host);nav.className='tn-chapter-nav';nav.setAttribute('aria-label','단어장 학습 메뉴');
   if(chapterView!=='contents')btn('← Chapter 목차',function(){navigateChapter('contents');},nav);

   if(chapterView!=='contents'){
    var g=groups(),c=g&&g.chapters.find(function(c){return c.id===chapterView;});
    el('h2',chapterView==='all'?'전체 단어':chapterView==='unassigned'?'단어 학습':c?c.title:'Chapter 학습',host).className='tn-chapter-heading';
    if(c&&c.retired)el('p','기존 구성 중 '+c.retired+'개는 보관했어요. 나머지 단어와 순서는 그대로예요.',host).className='tn-chapter-overview';
    if(chapterView!=='all'&&!chapters){el('p',chapterError?'챕터 구성을 불러오지 못했어요. 전체 단어는 계속 볼 수 있어요.':'챕터 구성을 불러오는 중…',host);if(chapterError)btn('챕터 다시 불러오기',ensureChapters,host);}
    else if(c&&c.words.length!==c.expected)el('p','현재 불러온 단어 '+c.words.length+'개 / 등록된 '+c.expected+'개. 기존 챕터 구성은 유지됩니다.',host);
    else if(chapterView!=='all'&&chapterView!=='unassigned'&&!c){el('p','이 챕터를 찾지 못했어요. 목차에서 다시 선택해 주세요.',host);}
   }
  }
  function closeRecentWord(restore){
   var current=recentPopup;if(!current)return;recentPopup=null;current.track.classList.remove('is-reading');
   if(current.dialog.open)current.dialog.close();current.dialog.remove();
   if(restore&&valid()){var target=current.opener.isConnected?current.opener:Array.from(host.querySelectorAll('.tn-recent-primary .tn-recent-item')).find(function(n){return n.dataset.recentWordId===current.wordId;})||host.querySelector('.tn-recent-track');if(target)target.focus({preventScroll:true});}
  }
  function showRecentWord(word,opener,track){
   if(!valid()||recentPopup)return;
   var dialog=el('dialog'),title=el('h2'),layout=noteLayout(word),header=el('header',undefined,dialog);
   dialog.className='tn-recent-dialog';dialog.dataset.vocabularyId=word.id;title.id='tn-recent-word-title';title.textContent=word.expression;header.appendChild(title);dialog.setAttribute('aria-labelledby',title.id);
   var close=btn('닫기',function(){closeRecentWord(true);},header);close.setAttribute('aria-label','단어 뜻 닫기');
   if(word.partOfSpeech)el('small',word.partOfSpeech,dialog).className='tn-recent-pos';
   el('p',layout.forms?layout.forms.map(function(f){return f.expression+' — '+f.meaning;}).join('\n'):layout.general||word.meaning||'등록된 뜻이 없어요.',dialog).className='tn-recent-meaning';
   if(layout.context)el('p',layout.context,dialog).className='tn-recent-context';
   var exampleText=english(word),exampleTranslation=translation(word);
   if(exampleText){var example=el('p',undefined,dialog);example.className='tn-original tn-recent-example';if(root.HanqToeicExampleText)root.HanqToeicExampleText.render(example,word.expression,exampleText);else example.textContent=exampleText;}
   if(exampleTranslation)el('p',exampleTranslation,dialog).className='tn-translation tn-recent-context';
   if(layout.tips.length){var tips=el('section',undefined,dialog);tips.className='tn-recent-tips';el('h3','Tip',tips);var tipList=el('ul',undefined,tips);layout.tips.forEach(function(line){el('li',line,tipList);});}
   if(word.sourceReference)el('small',word.sourceReference,dialog).className='tn-recent-source';
   recentPopup={dialog:dialog,opener:opener,track:track,wordId:word.id};track.classList.add('is-reading');document.body.appendChild(dialog);
   dialog.addEventListener('cancel',function(e){e.preventDefault();closeRecentWord(true);});dialog.addEventListener('close',function(){if(recentPopup&&recentPopup.dialog===dialog)closeRecentWord(true);});
   dialog.addEventListener('click',function(e){if(e.target!==dialog)return;var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeRecentWord(true);});
   dialog.showModal();close.focus({preventScroll:true});
  }
  function recentNavigation(){closeRecentWord(false);}
  function recentPointer(e){host.querySelectorAll('.tn-recent-track.is-touch-reading').forEach(function(track){if(!track.contains(e.target)&&!(recentPopup&&recentPopup.dialog.contains(e.target)))track.classList.remove('is-touch-reading');});}
  function renderRecentWords(section){
   var recent=allWords().filter(function(n){return !isLyComparison(n)&&(!(chapters&&chapters.retiredWordIds||[]).includes(n.id));}).map(function(n,i){var raw=n.addedOn||n.createdAt,ts=typeof raw==='string'?Date.parse(raw):NaN;return {word:n,time:ts,index:i};}).filter(function(x){return Number.isFinite(x.time)&&x.time<=Date.now()+86400000;}).sort(function(a,b){return b.time-a.time||a.index-b.index;}).slice(0,12);
   if(!recent.length)return;var box=el('section',undefined,section);box.className='tn-recent';box.setAttribute('aria-label','최근 추가된 단어');
   var track=el('div',undefined,box);track.className='tn-recent-track';track.tabIndex=0;track.setAttribute('aria-label','최근 단어 · 단어를 누르면 뜻 보기');var strip=el('div',undefined,track);strip.className='tn-recent-strip';
   function make(duplicate){var group=el('div',undefined,strip);group.className=duplicate?'tn-recent-copy':'tn-recent-primary';if(duplicate)group.setAttribute('aria-hidden','true');recent.forEach(function(x){var item=btn(x.word.expression,function(){showRecentWord(x.word,duplicate?track:item,track);},group);item.className='tn-recent-item';item.dataset.recentWordId=x.word.id;item.setAttribute('aria-haspopup','dialog');if(duplicate){item.tabIndex=-1;item.addEventListener('pointerdown',function(e){e.preventDefault();});}});}
   make(false);make(true);if(recentPopup){recentPopup.track=track;track.classList.add('is-reading');}track.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')track.classList.add('is-touch-reading');});
  }
  function renderContents(){
   if(!valid()||draft&&draft.revision===0)return;var old=host.querySelector('.tn-chapter-contents');if(old)old.remove();
   var section=el('section',undefined,host);section.className='tn-chapter-contents';
   section.setAttribute('aria-label','단어장 Chapter 목차');
   if(!loaded){el('p','단어장을 불러오는 중…',section);return;}
   if(!chapters){el('p',chapterError?'챕터 구성을 불러오지 못했어요. 다시 불러와 주세요.':'챕터 구성을 불러오는 중…',section);if(chapterError)btn('챕터 다시 불러오기',ensureChapters,section);return;}
   var g=groups(),total=g.chapters.reduce(function(sum,c){return sum+c.words.length;},0)+g.unassigned.length;
   renderRecentWords(section);
   var list=el('ol',undefined,section);list.className='tn-chapter-list';
   function chapterRow(title,total,marked,open,pdf,disabled){var row=el('li',undefined,list);row.className='tn-chapter-row';var go=btn('',open,row);go.className='tn-chapter-open';go.disabled=!!disabled;go.setAttribute('aria-label',title+' 단어 학습 · 전체 '+total+'개 · 체크 '+marked+'개');el('strong',title,go);var stats=el('span',undefined,go);stats.className='tn-chapter-stats';el('span','전체 '+total+'개',stats);el('span','체크 '+marked+'개',stats);var exportButton=btn('',function(event){event.stopPropagation();pdf();},row);exportButton.innerHTML='<svg viewBox="0 0 24 28" width="24" height="28" aria-hidden="true" focusable="false"><path d="M5 1.5h9l5 5V26H5zM14 1.5V7h5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><text x="12" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="700" fill="currentColor">PDF</text></svg>';exportButton.className='tn-chapter-pdf';exportButton.title=title+' PDF 출력';exportButton.setAttribute('aria-label',title+' PDF 출력');return {row:row,open:go,pdf:exportButton};}
   var selectedCount=visibleWords(true).length;var selected=chapterRow('체크한 단어만 보기',selectedCount,selectedCount,function(){onlyChecked=true;navigateChapter('all');},function(){printVisible(true);},!checkedViewReady());selected.row.classList.add('tn-selected-chapter');selected.pdf.disabled=!checkedPrintReady()||!selectedCount;
   g.chapters.forEach(function(c){var marked=c.words.filter(function(n){return checked.has(n.id);}).length,row=chapterRow(c.title,c.words.length,marked,function(){onlyChecked=false;navigateChapter(c.id);},function(){printChapter(c);},!c.words.length);row.row.dataset.chapterId=c.id;row.pdf.disabled=!c.words.length;});

  }
  function persistChecks(){if(checkStore){checkStore.replace(Array.from(checked));return;}checkMemory={ids:Array.from(checked),onlyChecked:onlyChecked};updateCheckTools();}
  function syncCheckUi(){var n=host.querySelector('.tn-check-warning');if(!n||!checkState)return;n.dataset.state=checkState.ready&&!checkState.saving&&!checkState.error&&!checkState.storageError&&!checkState.canImport?'ready':'notice';n.replaceChildren();var text=!checkState.ready?(checkState.error?'체크 목록을 불러오지 못했어요. 기존 기록은 유지돼요.':'체크 목록을 계정에서 불러오는 중…'):checkState.saving?'체크 저장 중…':checkState.error==='conflict'?'다른 기기에서 체크가 바뀌었어요. 이 기기의 변경은 아직 저장되지 않았어요.':checkState.error?'체크 저장을 확인하지 못했어요. 이 기기의 변경은 유지돼요.':checkState.storageError?'기기 임시 저장을 못 했어요. 계정 저장 상태를 확인해 주세요.':'체크는 해제할 때까지 계정에 저장돼요.';el('span',text,n);if(checkState.error)btn('내 변경 다시 저장',function(){checkStore.retry();},n);if(checkState.canImport)btn('이 기기의 기존 체크 '+localChecks.ids.length+'개 가져오기',function(){if(root.confirm('이 기기의 기존 체크가 현재 계정의 기록이 맞나요? 한 계정에 한 번만 가져옵니다.'))checkStore.importLocal();},n);host.querySelectorAll('.tn-word-check input').forEach(function(x){x.disabled=!checkState.ready;});}
  // Filter and meaning toggles change only the view: they never write the checked list.
  function setOnlyChecked(value){onlyChecked=value;batch=0;if(!checkStore)checkMemory={ids:Array.from(checked),onlyChecked:onlyChecked};updateCheckTools();renderCards();var t=host.querySelector('.tn-checked-only');if(t&&document.activeElement&&!host.contains(document.activeElement))t.focus();}
  // Open eye while meanings show, slashed eye while hidden; the name says what pressing does next.
  function drawMeaningToggle(b){var action=testMode?'뜻 보기':'뜻 가리기';b.setAttribute('aria-label',action);b.title=action;b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'+(testMode?'<path d="M3 3l18 18"/>':'')+'</svg>';b.dataset.meaning=testMode?'hidden':'shown';}
  function chapterCheckedCount(){return chapterWords(allWords()).filter(function(n){return !isLyComparison(n)&&checked.has(n.id);}).length;}
  function updateCheckTools(){var count=notes.concat(supplementalEntries()).filter(function(n){return checked.has(n.id);}).length,label=host.querySelector('.tn-check-count'),filter=host.querySelector('.tn-checked-only'),reset=host.querySelector('.tn-clear-checks'),warning=host.querySelector('.tn-check-warning');if(label){var inChapter=chapterCheckedCount();label.textContent=String(inChapter);label.setAttribute('aria-label',(chapterView==='all'?'전체':'이 Chapter')+' 체크 '+inChapter+'개');label.title=label.getAttribute('aria-label');}if(filter){filter.textContent=onlyChecked?'전체 보기':'체크한 단어만 보기';filter.setAttribute('aria-describedby','tn-check-count');filter.setAttribute('aria-pressed',String(onlyChecked));}if(label)label.id='tn-check-count';var checkedPdf=host.querySelector('.tn-checked-pdf');if(checkedPdf)checkedPdf.disabled=!checkedPrintReady()||!visibleWords(true).length;if(reset)reset.disabled=checked.size===0;if(warning&&!checkStore)warning.textContent=checkStorageError?'기존 체크를 기기에서 읽지 못했어요.':'';syncCheckUi();}
  function decorateCheck(card,n){card.dataset.vocabularyId=n.id;var label=el('label',undefined,card);label.className='tn-word-check';var input=el('input',undefined,label);input.type='checkbox';input.checked=checked.has(n.id);input.setAttribute('aria-label',n.expression+' 체크');el('span','체크',label);card.classList.toggle('tn-is-checked',input.checked);input.onchange=function(){if(!valid())return;if(input.checked)checked.add(n.id);else checked.delete(n.id);card.classList.toggle('tn-is-checked',input.checked);persistChecks();updateCheckTools();if(onlyChecked){var before=Array.from(host.querySelectorAll('.tn-word-check input')),at=before.indexOf(input);renderCards();var after=host.querySelectorAll('.tn-word-check input'),target=after[Math.min(at,after.length-1)]||host.querySelector('.tn-checked-only');if(target)target.focus();}};}
  function detailKey(node){var card=node.closest('[data-vocabulary-id],[data-note-id]'),scope=card||node.closest('.tn-pair-tip');if(!scope)return null;var id=card&&(card.dataset.vocabularyId||card.dataset.noteId)||'adverb-pairs';return id+'::'+(scope===node?'self':Array.from(scope.querySelectorAll('details')).indexOf(node));}
  function detailStore(){if(detailMemory.owner!==owner)detailMemory={owner:owner,values:new Map()};return detailMemory.values;}
  function rememberDetails(){var list=host.querySelector('.tn-readonly-list');if(!valid()||testMode||!list||list.dataset.detailMode==='true'||list.dataset.detailOwner!==owner)return;var store=detailStore();list.querySelectorAll('details').forEach(function(n){var k=detailKey(n);if(k)store.set(k,n.open);});}
  function restoreDetails(list){if(testMode||!valid())return;var store=detailStore();list.querySelectorAll('details').forEach(function(n){var k=detailKey(n);if(k&&store.has(k))n.open=store.get(k);});}
  function draw(){capture();rememberDetails();if(root.HanqToeicRecall)root.HanqToeicRecall.stop();if(!valid()){authScreen();return;}skeleton();host.dataset.chapterView=chapterView;if(draft){if(draft.revision===0)renderAddEditor();else renderExampleEditor();return;}if(loaded&&canManage){var add=btn('단어 추가',function(){if(valid()&&canManage&&!busy)open();},host);add.className='tool-btn tn-add-note';}drawChapterNavigation();if(chapterView==='contents'){renderContents();return;}var tools=el('div',undefined,host);tools.className='tn-tools';var controls=el('div',undefined,tools);controls.className='tn-check-tools';var filterGroup=el('div',undefined,controls);filterGroup.className='tn-check-filter';var filter=btn('',function(){setOnlyChecked(!onlyChecked);},filterGroup);filter.className='tool-btn tn-checked-only';var checkedPdf=btn('체크한 단어 PDF 출력',function(){printVisible(true);},filterGroup);checkedPdf.className='tool-btn tn-checked-pdf';checkedPdf.disabled=true;var badge=el('span','',filterGroup);badge.className='tn-check-count';var mode=btn('',function(){rememberDetails();testMode=!testMode;drawMeaningToggle(mode);host.dataset.vocabularyTest=String(testMode);renderCards();},controls);mode.className='tool-btn tn-test-toggle';drawMeaningToggle(mode);host.dataset.vocabularyTest=String(testMode);var warning=el('p','',host);warning.className='tn-check-warning';warning.setAttribute('role','status');updateCheckTools();var list=el('section',undefined,host);list.className='tn-readonly-list';list.dataset.detailOwner=owner;list.addEventListener('toggle',function(e){if(testMode||!valid()||list.dataset.detailOwner!==owner||!e.target.isConnected)return;var k=detailKey(e.target);if(k)detailStore().set(k,e.target.open);},true);var searchStatus=el('span','',host);searchStatus.className='tn-search-status';searchStatus.setAttribute('role','status');searchStatus.setAttribute('aria-live','polite');renderCards();}

  function isLyComparison(n){return /^(?:hard(?:\/|↔)hardly|high(?:\/|↔)highly|late(?:\/|↔)lately|near(?:\/|↔)nearly|close(?:\/|↔)closely|free(?:\/|↔)freely|wide(?:\/|↔)widely)$/.test(key(n.expression).replace(/\s+/g,''));}
  function editableExample(n){return !!n&&!n.supplement&&!n.originalExample&&n.revision>0&&key(n.expression)!=='press conference'&&String(n.sourceReference||'').indexOf('hanq:adverb-pairs:v1')!==0;}
  function renderCards(){if(draft&&draft.revision===0)return;if(chapterView==='contents'){renderContents();return;}var list=host.querySelector('.tn-readonly-list');if(!list)return;rememberDetails();list.dataset.detailMode=String(testMode);list.replaceChildren();host.querySelectorAll('.tn-inline-editor').forEach(function(n){n.remove();});if(!loaded){el('p','단어장을 불러오고 있어요…',list);return;}var needle=key(query),all=allWords(),scope=chapterWords(all),matches=scope.filter(function(n){return !(isLyComparison(n))&&(!(chapters&&chapters.retiredWordIds||[]).includes(n.id)||!!needle)&&(!onlyChecked||checked.has(n.id))&&(!needle||(n.supplement?key(n.searchText||[n.expression,n.meaning,n.example,n.translation].join(' ')):searchIndex.get(n.id)||'').includes(needle));});batch=Math.max(0,Math.min(batch,Math.ceil(matches.length/PAGE_SIZE)-1));var searchStatus=host.querySelector('.tn-search-status');if(searchStatus)searchStatus.textContent=(needle?'검색 결과 ':'')+matches.length+'개';if(!matches.length){var empty=el('div',undefined,list);empty.className='tn-empty-checked';el('p',onlyChecked?(needle?'체크한 단어 중 검색 결과가 없어요.':(chapterView==='all'?'':'이 Chapter에 ')+'체크한 단어가 없어요.'):(notes.length?'검색 결과가 없어요.':'등록한 표현이 없어요.'),empty);if(onlyChecked)btn('전체 보기',function(){setOnlyChecked(false);},empty).className='tool-btn tn-show-all';}matches.forEach(function(n){var card=el('article',undefined,list);card.className='tn-word-card';card.dataset.noteId=n.id;decorateCheck(card,n);var header=el('div',undefined,card);header.className='tn-word-header';var title=el('div',undefined,header);title.className='tn-word-title';var layout=noteLayout(n),formMeanings=[];if(layout.forms){card.classList.add('tn-expression-card');layout.forms.forEach(function(f,i){var block=el('div',undefined,title);block.className='tn-expression-form';el('h3',f.expression,block);var gloss=el('p',f.meaning,block);gloss.className='tn-form-meaning';gloss.id='tn-form-'+n.id+'-'+i;formMeanings.push(gloss);});}else el('h3',layout.title,title);if(layout.verbHint)el('small',layout.verbHint,title).className='tn-verb-hint';el('small',posTags(layout.partOfSpeech||n.partOfSpeech||''),header).className='tn-card-pos';var actions=el('div',undefined,header);actions.className='tn-word-actions';var toggle=el('span',undefined,actions);toggle.hidden=true;var pattern=({'a portion of':'a portion of + 명사','range from a to b':'range from A to B','be suspended from ~':'be suspended from + 명사','refer to':'refer to + 명사','in exchange for':'in exchange for + 명사'})[n.expression.toLowerCase()];if(pattern&&!layout.usageReference)el('strong',pattern,title).className='tn-pattern';var meanings=layout,meaning=el('div',undefined,card);meaning.className='tn-card-meaning';el('span',meanings.general,meaning).className='tn-general-meaning';if(meanings.context)el('small','(이 문맥에서는: '+meanings.context+')',meaning).className='tn-context-meaning';var pressConference=key(n.expression)==='press conference',original=pressConference?'Thank you for attending this press conference.':english(n),extraTranslations=[],trans,paired=String(n.sourceReference||'').indexOf('hanq:adverb-pairs:v1')===0;if(paired){card.classList.add('tn-adverb-pair-card');var ens=original.split('\n').filter(Boolean),kos=translation(n).split('\n');ens.forEach(function(line,i){var ex=el('p',undefined,card);ex.className='tn-original';if(root.HanqToeicExampleText)root.HanqToeicExampleText.render(ex,n.expression,line);else ex.textContent=line;var ko=el('p',kos[i]||'',card);ko.className='tn-translation';if(!trans)trans=ko;else{ko.id='tn-translation-'+n.id+'-'+i;extraTranslations.push(ko);}});}else{if(original){var example=el('p',undefined,card);example.className='tn-original';if(root.HanqToeicExampleText)root.HanqToeicExampleText.render(example,n.expression,original);else example.textContent=original;}trans=el('p',pressConference?'이 기자회견에 참석해 주셔서 감사합니다.':translation(n),card);trans.className='tn-translation';}var related=el('div',undefined,card);related.className='tn-related';if(paired)layout.tips=[n.structure,n.confusion].join('\n').split('\n').filter(Boolean);if(layout.tips.length){var tips=el('section',undefined,related);tips.className='tn-tips';el('h4','Tip:',tips);var tipList=el('ul',undefined,tips);var selectedTips=layout.tips.filter(function(line){return line.length<=140;}).slice(0,2);if(layout.title.toLowerCase()==='press conference')selectedTips=['hold a press conference: 기자회견을 열다'];if(layout.title.toLowerCase()==='hesitant')selectedTips=['[형용사] be hesitant to + 동사원형: ~하기를 망설이다','[자동사] hesitate to + 동사원형: ~하기를 망설이다 (be 없음)'];selectedTips.forEach(function(line){el('li',line,tipList);});var remainingTips=layout.tips.filter(function(line){return selectedTips.indexOf(line)<0;});if(remainingTips.length){var reference=el('details',undefined,related);reference.className='tn-tip-reference';el('summary','추가 참고 · 기존 설명',reference);remainingTips.forEach(function(line){el('p',line,reference);});}}if(layout.usageReference){var usage=el('details',undefined,related);usage.className='tn-usage-reference';el('summary','표현·기존 뜻',usage);el('p',layout.usageReference,usage);}if(root.HanqVocabularyParaphrases)root.HanqVocabularyParaphrases.render(related,n);(n.synonyms||[]).forEach(function(text){el('p',text,related);});var extra=el('details',undefined,card);extra.className='tn-extra';el('summary','Tip · Paraphrase · 예문',extra);if(canManage&&editableExample(n)){var edit=btn('예문 수정',function(){open(n);},extra);edit.className='tool-btn tn-edit-example';edit.dataset.noteId=n.id;edit.setAttribute('aria-label',n.expression+' 예문 수정');}Array.from(card.children).forEach(function(child){if(child!==extra&&!child.matches('.tn-word-header,.tn-card-pos,.tn-card-meaning,.tn-word-check'))extra.appendChild(child);});card.querySelectorAll('.tn-pattern,.tn-verb-hint,.tn-context-meaning').forEach(function(child){extra.appendChild(child);});var lexeme=el('div',undefined,card);lexeme.className='tn-lexeme';lexeme.appendChild(header);lexeme.appendChild(meaning);card.insertBefore(lexeme,extra);var mainExample=el('div',undefined,card);mainExample.className='tn-example-main';if(n.exampleSource){var sourceLabel=extra.querySelector('.tn-example-label');if(sourceLabel)mainExample.appendChild(sourceLabel);}var primary=extra.querySelector('.tn-original');if(primary)mainExample.appendChild(primary);mainExample.appendChild(trans);if(n.supplementaryExample){var supplement=el('section',undefined,related);supplement.className='tn-supplementary-example';el('small','보충 예문 · 직접 작성',supplement);el('p',n.supplementaryExample,supplement);if(n.supplementaryTranslation)el('p',n.supplementaryTranslation,supplement);}card.insertBefore(mainExample,extra);var forms={rise:'rise → rose → risen',lay:'lay → laid → laid',seek:'seek → sought → sought',lead:'lead → led → led',hold:'hold → held → held',build:'build → built → built',choose:'choose → chose → chosen',buy:'buy → bought → bought',sell:'sell → sold → sold',bring:'bring → brought → brought',find:'find → found → found',send:'send → sent → sent',write:'write → wrote → written',make:'make → made → made',begin:'begin → began → begun',forget:'forget → forgot → forgotten'};var formText=/동사/.test(layout.partOfSpeech||n.partOfSpeech||'')&&forms[layout.title.toLowerCase()];if(formText){var formInfo=el('div',formText,card);formInfo.className='tn-useful-forms';formInfo.setAttribute('aria-label','동사 변화');card.insertBefore(formInfo,extra);}extra.querySelector('summary').textContent='Tip · Paraphrase';meaning.id='tn-meaning-'+n.id;trans.id='tn-translation-'+n.id;related.id='tn-related-'+n.id;toggle.setAttribute('aria-controls',[meaning.id,trans.id,related.id].concat(extraTranslations.map(function(n){return n.id;})).concat(formMeanings.map(function(n){return n.id;})).join(' '));function display(){var visible=!testMode;extra.hidden=!visible;if(!visible)extra.open=false;meaning.hidden=trans.hidden=related.hidden=!visible;extraTranslations.forEach(function(n){n.hidden=!visible;});formMeanings.forEach(function(n){n.hidden=!visible;});card.querySelectorAll('.tn-card-pos,.tn-source-context,.tn-verb-hint,.tn-source-note').forEach(function(n){n.hidden=!visible;});card.classList.toggle('tn-test-mode',!visible);}display();});decoratePosBadges(host);focusPending=false;syncCheckUi();var extra=list.querySelector('.tn-research-vocabulary');if(extra){Array.from(extra.querySelectorAll('.tn-word-card')).forEach(function(card){list.appendChild(card);});extra.remove();}matches.forEach(function(n){var card=Array.from(list.querySelectorAll('.tn-word-card')).find(function(c){return c.dataset.vocabularyId===n.id;});if(card)list.appendChild(card);});restoreDetails(list);}
  function acceptNotebook(data){
   notes=data.notes;archived=data.archived||[];canManage=data.canManage===true;visibility=data.visibility;loaded=true;
   searchIndex=new Map(notes.map(function(n){return[n.id,key([n.expression,n.meaning,n.example,n.translation,(n.synonyms||[]).join(' ')].join(' '))];}));
  }
  function addedNote(note,message){
   notes=notes.filter(function(n){return n.id!==note.id;});notes.unshift(note);
   searchIndex.set(note.id,key([note.expression,note.meaning,note.example,note.translation,(note.synonyms||[]).join(' ')].join(' ')));
   draft=null;baseline='';memory=null;busy=false;onlyChecked=false;testMode=false;chapterView='all';query=note.expression;
   var previous=root.history.state||{};root.history.replaceState(Object.assign({},previous,{hanqVocabulary:{version:1,chapterId:'all',query:query}}),'');
   draw();notice(message||'단어장에 추가했어요.');var heading=host.querySelector('.tn-chapter-heading');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  function renderAddEditor(){
   var editor=el('section',undefined,host);editor.className='tn-add-editor';editor.setAttribute('aria-labelledby','tn-add-heading');
   el('h2','단어 추가',editor).id='tn-add-heading';
   var disclosure=el('p',visibility==='members'?'이 단어장은 로그인한 회원에게 공개돼요. 저장하면 단어와 뜻·예문이 함께 추가돼요.':'저장 버튼을 누르면 단어장에 추가돼요.',editor);disclosure.className='tn-add-disclosure';
   var form=el('form',undefined,editor);form.dataset.noteOwner=owner;form.dataset.noteId=draft.id;form.setAttribute('aria-label','새 단어 입력');
   [['expression','영어 단어 · 표현 (필수)',300,1],['meaning','뜻 (필수)',6000,2],['example','영어 예문',6000,3],['translation','예문 해석',6000,3],['partOfSpeech','품사',30,1]].forEach(function(f){
    var label=el('label',f[1],form),input=el(f[3]===1?'input':'textarea',undefined,label);input.name=f[0];input.maxLength=f[2];input.value=draft[f[0]]||'';if(f[3]>1)input.rows=f[3];if(f[0]==='expression'||f[0]==='meaning')input.required=true;
   });
   var actions=el('div',undefined,form);actions.className='tn-actions';var save=el('button','저장',actions);save.type='submit';save.disabled=!loaded||!canManage||busy;
   btn('취소',function(){if(busy)return;if(discard()){draw();var add=host.querySelector('.tn-add-note');if(add)add.focus();}},actions);
   form.addEventListener('submit',submitNewNote);
   if(busy)controlsDisabled(true);else if(!loaded)notice('단어장을 확인하고 있어요…');else if(!canManage)notice('이 계정에서는 단어를 추가할 수 없어요.');
  }
  async function submitNewNote(event){
   event.preventDefault();if(busy||!valid()||!loaded||!canManage||!draft||draft.revision!==0)return;
   capture();draft.expression=draft.expression.trim();draft.meaning=draft.meaning.trim();
   if(!draft.expression||!draft.meaning){notice('영어 단어와 뜻을 입력해 주세요.');return;}
   var who=owner,t=++ticket,id=draft.id,payload={part:'unclassified',revision:0};
   ['expression','meaning','example','translation','partOfSpeech','structure','confusion','sourceText','sourceReference'].forEach(function(name){payload[name]=draft[name]||'';});payload.synonyms=[];
   function current(){return alive&&who===identity()&&t===ticket;}
   controlsDisabled(true);notice('저장 여부를 확인하고 있어요…');
   try{
    // A fresh authorized read precedes every attempt, including a restored draft or a lost response.
    var latest=await api.toeicNotes();if(!current())return;acceptNotebook(latest);
    var saved=notes.concat(archived).find(function(n){return n.id===id;});
    if(saved){if(archived.some(function(n){return n.id===id;})){notice('이 단어는 이미 저장된 뒤 보관되었어요. 입력을 닫고 목록을 확인해 주세요.');return;}addedNote(saved,'이전에 저장된 단어를 확인했어요.');return;}
    if(!canManage){notice('이 계정에서는 단어를 추가할 수 없어요. 입력은 유지됩니다.');return;}
    if(notes.concat(archived).some(function(n){return n.part===payload.part&&key(n.expression)===key(payload.expression);})){notice('같은 표현이 이미 있어요. 입력은 유지되며 기존 단어를 바꾸지 않았어요.');return;}
    notice('저장 중…');
    try{
     var result=await api.saveToeicNote(id,payload);if(!current())return;
     if(!result||!result.note||result.note.id!==id)throw Error('unconfirmed note response');
     addedNote(result.note);
    }catch(err){
     if(!current())return;
     // Do not blindly repeat an uncertain write. Verify the stable UUID through the read API first.
     try{var verified=await api.toeicNotes();if(!current())return;acceptNotebook(verified);var found=notes.find(function(n){return n.id===id;});if(found){addedNote(found,'단어장에 저장된 것을 확인했어요.');return;}}catch(readError){if(!current())return;}
     notice(err&&err.code==='duplicate_expression'?'같은 표현이 이미 있어요. 입력은 유지됩니다.':err&&err.status===403?'이 계정에서는 단어를 추가할 수 없어요. 입력은 유지됩니다.':'저장을 확인하지 못했어요. 입력은 유지됩니다. 저장을 다시 누르면 먼저 저장 여부를 확인해요.');
    }
   }catch(err){if(current())notice('단어장을 확인하지 못해 저장하지 않았어요. 입력은 유지됩니다. 연결을 확인한 뒤 다시 시도해 주세요.');}
   finally{if(current()&&draft){controlsDisabled(false);var submit=host.querySelector('.tn-add-editor button[type="submit"]');if(submit)submit.disabled=!canManage;}}
  }
  // Editing examples is explicit and does not expose merge/archive or change note identity.
  function closeExampleEditor(id,message){
   draft=null;baseline='';memory=null;busy=false;draw();
   var trigger=Array.from(host.querySelectorAll('.tn-edit-example')).find(function(b){return b.dataset.noteId===id;});
   if(trigger){var details=trigger.closest('details');if(details)details.open=true;trigger.focus({preventScroll:true});}
   if(message)notice(message);
  }
  function renderExampleEditor(){
   var editor=el('section',undefined,host);editor.className='tn-add-editor tn-example-editor';editor.setAttribute('aria-labelledby','tn-example-heading');
   el('h2',draft.expression+' · 예문 수정',editor).id='tn-example-heading';
   el('p',visibility==='members'?'저장하면 회원공개 단어장의 예문과 해석이 수정돼요.':'저장하면 예문과 해석이 수정돼요.',editor).className='tn-add-disclosure';
   var form=el('form',undefined,editor);form.dataset.noteOwner=owner;form.dataset.noteId=draft.id;form.setAttribute('aria-label','예문 수정');
   [['example','영어 예문'],['translation','예문 해석']].forEach(function(f){var label=el('label',f[1],form),input=el('textarea',undefined,label);input.name=f[0];input.maxLength=6000;input.rows=4;input.value=draft[f[0]]||'';});
   var actions=el('div',undefined,form);actions.className='tn-actions';var save=el('button','저장',actions);save.type='submit';save.disabled=!loaded||!canManage||busy;
   btn('취소',function(){if(busy)return;var id=draft.id;if(discard())closeExampleEditor(id);},actions);
   form.addEventListener('submit',submitExampleEdit);if(busy)controlsDisabled(true);
  }
  async function submitExampleEdit(event){
   event.preventDefault();if(busy||!valid()||!loaded||!canManage||!draft||draft.revision<=0)return;
   capture();var who=owner,t=++ticket,id=draft.id,revision=draft.revision,edited={example:draft.example,translation:draft.translation||''};
   function current(){return alive&&who===identity()&&t===ticket;}
   function matches(note){return note&&note.example===edited.example&&note.translation===edited.translation;}
   function saved(note){notes=notes.map(function(n){return n.id===id?note:n;});searchIndex.set(id,key([note.expression,note.meaning,note.example,note.translation,(note.synonyms||[]).join(' ')].join(' ')));closeExampleEditor(id,'예문과 해석을 저장했어요.');}
   controlsDisabled(true);notice('저장 여부를 확인하고 있어요…');
   try{
    var latest=await api.toeicNotes();if(!current())return;acceptNotebook(latest);
    if(!canManage){notice('이 계정에서는 예문을 수정할 수 없어요.');return;}
    var note=notes.find(function(n){return n.id===id;});
    if(!editableExample(note)){notice('이 항목은 현재 수정할 수 없어요. 입력은 유지됩니다.');return;}
    if(matches(note)){saved(note);return;}
    if(note.revision!==revision){notice('다른 곳에서 내용이 바뀌었어요. 취소한 뒤 최신 내용을 확인해 주세요. 입력은 유지됩니다.');return;}
    var payload={};['part','expression','meaning','structure','confusion','sourceText','sourceReference','partOfSpeech','synonyms','revision'].forEach(function(field){payload[field]=note[field];});
    payload.example=edited.example;payload.translation=edited.translation;
    try{
     var result=await api.saveToeicNote(id,payload);if(!current())return;
     if(!result||!result.note||result.note.id!==id||!matches(result.note))throw Error('Unconfirmed save response');
     saved(result.note);
    }catch(err){
     if(!current())return;
     // Reconcile uncertain saves before allowing another attempt. CAS remains the server guard.
     try{var verified=await api.toeicNotes();if(!current())return;acceptNotebook(verified);var found=notes.find(function(n){return n.id===id;});if(matches(found)){saved(found);return;}}catch(readError){if(!current())return;}
     notice(error(err));
    }
   }catch(err){if(current())notice('단어장을 확인하지 못해 저장하지 않았어요. 입력은 유지됩니다.');}
   finally{if(current()&&draft){controlsDisabled(false);var submit=host.querySelector('.tn-example-editor button[type="submit"]');if(submit)submit.disabled=!canManage;}}
  }
  function renderEditor(editor){if(!draft){editor.hidden=true;return;}editor.hidden=false;el('h2',draft.revision?'노트 편집':'새 노트',editor);var form=el('form',undefined,editor),label=el('label','표현 (필수)',form),select;form.dataset.noteOwner=owner;form.dataset.noteId=draft.id;var input=el('input',undefined,label);input.name='expression';input.required=true;input.maxLength=300;input.value=draft.expression;label=el('label','형태 · 품사',form);input=el('input',undefined,label);input.name='partOfSpeech';input.maxLength=30;input.value=draft.partOfSpeech||'';fields.forEach(function(f){var l=el('label',f[1],form),n=el('textarea',undefined,l);n.name=f[0];n.maxLength=6000;n.rows=f[0]==='sourceText'?4:3;n.value=f[0]==='synonyms'?(draft.synonyms||[]).join('\n'):draft[f[0]]||'';});var actions=el('div',undefined,form);actions.className='tn-actions';var save=el('button','저장',actions);save.type='submit';btn('편집 닫기',function(){if(discard())draw();},actions);form.onsubmit=async function(e){e.preventDefault();if(busy||!valid())return;capture();if(draft.synonyms.length>3){notice('동의어·유사표현은 최대 3개까지 적어 주세요.');return;}if(!key(draft.expression)){notice('단어 · 구문을 입력해 주세요.');return;}var who=owner,payload=JSON.parse(JSON.stringify(draft)),id=payload.id;['id','createdAt','updatedAt'].forEach(function(k){delete payload[k];});ticket++;controlsDisabled(true);notice('저장 중…');try{var d=await api.saveToeicNote(id,payload);if(!alive||who!==identity())return;draft=d.note;baseline=JSON.stringify(draft);memory=null;notes=notes.filter(function(n){return n.id!==id;});notes.unshift(d.note);draw();notice('내 계정에 저장했어요.');}catch(err){if(valid()){notice(error(err));controlsDisabled(false);}}finally{busy=false;}};
   if(draft.revision&&notes.length>1){var merge=el('details',undefined,editor);el('summary','중복 노트 합치기',merge);el('p','선택한 노트의 내용을 이 노트에 덧붙입니다. 현재 표현을 유지하고, 합쳐진 노트는 목록에서 사라져요.',merge);label=el('label','합칠 노트',merge);select=el('select',undefined,label);select.setAttribute('aria-label','합칠 노트');notes.filter(function(n){return n.id!==draft.id;}).forEach(function(n){var o=el('option',n.expression,select);o.value=n.id;});var chooser=select;btn('선택한 노트 합치기',async function(){if(busy||!valid())return;if(dirty()){notice('편집한 내용을 먼저 저장한 뒤 합쳐 주세요.');return;}var source=notes.find(function(n){return n.id===chooser.value;});if(!source||!root.confirm('“'+source.expression+'” 내용을 이 노트에 합칠까요? 원래 노트는 합쳐진 뒤 목록에서 사라집니다.'))return;var who=owner;ticket++;controlsDisabled(true);try{var d=await api.mergeToeicNotes(draft.id,{sourceId:source.id,sourceRevision:source.revision,targetRevision:draft.revision});if(!alive||who!==identity())return;notes=notes.filter(function(n){return n.id!==source.id&&n.id!==d.note.id;});notes.unshift(d.note);draft=d.note;baseline=JSON.stringify(draft);memory=null;draw();notice('내용과 출처를 한 노트에 합쳤어요.');}catch(e){if(valid()){notice(error(e));controlsDisabled(false);}}finally{busy=false;}},merge);}
  }
  function identityChanged(){if(!alive)return;var who=identity(),s=state();if(who===owner){if(!who)authScreen();return;}closeRecentWord(false);ticket++;busy=false;canManage=false;visibility=null;if(s.authReason==='expired')remember();else if(!who||memory&&memory.owner!==who)memory=null;if(root.HanqToeicRecall)root.HanqToeicRecall.stop();if(checkStore)checkStore.stop();checkStore=null;checkState=null;checked=new Set();owner=who;if(owner&&root.HanqWordChecks&&api.wordChecks){checkStore=root.HanqWordChecks.create(api,owner,localChecks.ids,function(st){if(!valid())return;checkState=st;checked=new Set(st.ids);updateCheckTools();renderCards();});}notes=[];searchIndex.clear();archived=[];shown={};testMode=false;query=focusQuery();chapterView=initialChapterView();focusPending=!!query;batch=0;loaded=false;draft=null;baseline='';if(unregister){unregister();unregister=null;}if(!owner){authScreen();return;}var restored=session&&session.takeDraft('toeic-notes',owner)||memory&&memory.owner===owner&&memory.draft;if(restored){draft=restored;baseline='';}if(session)unregister=session.register('toeic-notes',{ownerId:owner,capture:capture});draw();load();ensureChapters();}
  function storageChanged(){/* Account checks are refreshed from the server; legacy globals are never merged. */}
  root.addEventListener('storage',storageChanged);root.addEventListener('popstate',recentNavigation);root.addEventListener('hashchange',recentNavigation);document.addEventListener('pointerdown',recentPointer);
  function beforeUnload(e){if(dirty()){e.preventDefault();e.returnValue='';}}
  root.addEventListener('beforeunload',beforeUnload);off=api&&api.onChange?api.onChange(identityChanged):null;active={stop:function(){closeRecentWord(false);root.removeEventListener('popstate',recentNavigation);root.removeEventListener('hashchange',recentNavigation);document.removeEventListener('pointerdown',recentPointer);rememberDetails();if(root.HanqToeicRecall)root.HanqToeicRecall.stop();if(checkStore)checkStore.stop();remember();alive=false;ticket++;if(off)off();if(unregister)unregister();root.removeEventListener('beforeunload',beforeUnload);root.removeEventListener('storage',storageChanged);host.replaceChildren();}};identityChanged();if(api&&api.ensureSession)api.ensureSession().then(identityChanged,function(){if(alive)authScreen();});return active;
 }
 // A different account or explicit logout must never inherit an in-memory note draft.
 if(root.HanqApi&&root.HanqApi.onChange)root.HanqApi.onChange(function(s){if(!s.signedIn||detailMemory.owner&&detailMemory.owner!==s.ownerId)detailMemory={owner:null,values:new Map()};if(s.authReason==='logout'||s.authReason==='remote'||s.signedIn&&memory&&memory.owner!==s.ownerId)memory=null;});
 root.HanqToeicNotes={mount:mount,stop:stop,expressionKey:key,noteLayout:noteLayout,contentExport:contentExport,validateChapters:validateChapters,chapterGroups:chapterGroups};
})(typeof window!=='undefined'?window:globalThis);


