/* Reuse existing access-controlled concept tables. No textbook bytes are bundled or persisted here. */
(function (root) {
'use strict';
var titles={modern:'광복과 대한민국',samguk:'삼국시대',nambuk:'남북국시대',opening:'개항기와 대한제국',colonial:'일제 강점기와 독립운동'};
var scopes={
 modern:/정부|헌법|개헌|민주|남북|정전|전쟁|부정|경제|올림픽|국회|외환|광복|수립/,
 samguk:/무덤|고분|천마|돌무지|석실|벽돌|모줄임|한성|웅진|사비|수도|금관|문화|고구려|백제|신라|가야/,
 nambuk:/신문왕|원성왕|독서삼품|국학|통일|신라|발해|문화|유적/,
 colonial:/통치|독립|무장|연합|의열|의용|광복|운동|민족|임시|만주|결사|수탈|이민/
};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x];});}
function section(id,key,title,body){return '<article class="weakness-material" data-weakness-part="'+key+'" id="weakness-part-'+id+'" aria-labelledby="weakness-part-'+id+'-title"><header><p class="material-priority">'+id+'순위 약점 보완</p><h2 tabindex="-1" id="weakness-part-'+id+'-title">'+title+'</h2></header><div class="material-controls"><button type="button" data-weakness-start>점검하기 · 50문항</button></div>'+body+'</article>';}
function slot(era){return '<section class="hw-source-section" data-source-era="'+era+'" aria-label="'+titles[era]+' 원래 표"><h3>'+titles[era]+' · 시대별 학습 표</h3><p role="status">시대별 학습에서 표를 불러오는 중이에요.</p></section>';}
function examAid(items){
 return '<aside class="hw-exam-aid"><h3>기출에서 다시 볼 연결</h3><ul>'+items.map(function(item){
   return '<li><strong>'+esc(item[1])+'</strong><p>'+esc(item[2])+'</p><small><a href="#formal-exams/materials-'+item[0].split('-')[0]+'">'+esc(item[0].replace('-','회 ')+'번 해설')+'</a></small></li>';
 }).join('')+'</ul></aside>';
}
function render(){
 var modern=examAid([['74-48','같은 외환 위기라도 정부를 구분','김영삼 정부 말 외환 위기 발생 → 김대중 정부에서 노사정 위원회 출범과 IMF 구제 금융 조기 상환.']]);
 var ancient=examAid([['75-03','천마총은 무덤, 천마도는 그림','천마총·금관총·황남대총 → 신라의 돌무지덧널무덤. 천마도는 천마총에서 나온 말다래 그림.'],['74-50','신문왕과 원성왕을 한 묶음으로 외우지 않기','신문왕은 국학 설치와 9주 5소경·9서당 10정 정비. 원성왕은 독서삼품과 실시.']]);
 var opening=examAid([['75-38','서로 다른 시대를 넘는 순서','중추원 관제 개편(1898) → 대한국 국제(1899) → 대동단결 선언(1917) → 제헌 헌법(1948).'],['75-35','지문에 나온 ‘재작년’부터 계산','관동 대지진(1923)이 재작년이라면 지문은 1925년. 1924년에 문을 연 경성 제국 대학 예과 학생은 볼 수 있어요.'],['74-38','의열단은 인물과 표적을 짝으로','박재혁 → 부산 경찰서, 김익상 → 조선 총독부, 김상옥 → 종로 경찰서.']]);
 return section(1,'modern','대한민국',modern+slot('modern'))+section(2,'ancient','고대사',(root.HanqWeaknessTimeline||'')+ancient+slot('samguk')+slot('nambuk'))+section(3,'opening-colonial','개화기·일제강점기',opening+slot('opening')+slot('colonial'));
}
function el(doc,tag,text,cls){var x=doc.createElement(tag);if(text)x.textContent=text;if(cls)x.className=cls;return x;}
function headingWords(lines){return (lines||[]).map(function(line){return (line.runs||line.spans||[]).map(function(run){return run.text||'';}).join('')||line.text||'';}).join(' ').trim();}
function tableWords(block){return (block.rows||[]).map(function(row){return (row.cells||[]).map(function(cell){return headingWords(cell.lines);}).join(' ');}).join(' ');}
function select(page,era,title){
 // Select whole original tables, including nested text, cells and visual
 // attachments. Keep a separate original heading/figure only when it has a
 // concrete visual-study cue, without rewriting source captions.
 var source=page.blocks.filter(function(b){return b.studySection==='concept';}),near=title||'',picked=[];
 var visual={samguk:/무덤|고분|천마|덧널|석실|벽돌|모줄임|한성|웅진|사비|수도|금관|경주|익산|장군총|고령|문화재|지도/,nambuk:/무덤|고분|석탑|불상|유적|지도|문화재|신라촌락|정혜|정효/,colonial:/독립군|광복군|무장.*투쟁|전투|국외.*기지|한중.*작전/}[era];
 function descendants(id){
   var ids=new Set([id]),n=0;
   while(n!==ids.size){n=ids.size;source.forEach(function(b){if(ids.has(b.sourceParentTableId))ids.add(b.id);});}
   return source.filter(function(b){return ids.has(b.id);});
 }
 source.forEach(function(b){
   if(b.type==='heading'){near=headingWords(b.lines)||near;return;}
   if(b.sourceParentTableId||b.sourceTargetCellId)return;
   if(b.type==='table'){
     var blocks=descendants(b.id),label=headingWords(b.sourceCaptionLines)||near;
     var text=blocks.map(function(x){return x.type==='table'?tableWords(x):headingWords(x.lines);}).join(' ');
     if(era==='modern'||era==='colonial'||scopes[era].test(label+' '+text))picked.push({label:label,blocks:blocks});
   }else if(b.type==='figure'&&visual&&!/^(?:decorative-|fragmented-cover-raster|full-page-raster)/.test(b.classification||'')){
     var caption=(b.caption||'')+' '+(b.alt||'');
     if(visual.test(caption)||visual.test(near)&&!(/^원문 그림(?: · .*)?$/.test(caption.trim())&&!b.assetId))
       picked.push({label:near||title||'원문 그림',blocks:[b]});
   }
 });
 return picked;
}
function mount(host,pdf){
 stop();
 var doc=host.ownerDocument,api=root.HanqApi,w=doc.defaultView,button=pdf.querySelector('button'),status=pdf.querySelector('[role=status]');
 var initial=api&&api.state&&api.state(),catalog=root.HanqPrivateTextbook,owns=function(){var x=api&&api.state&&api.state();return x&&initial&&x.signedIn&&!x.restoring&&x.ownerId&&x.ownerId===initial.ownerId&&x.epoch===initial.epoch;};
 var generation=0,children=[],aborts=[],unsubscribe=null,active=true;
 var runIsCurrent=function(g){return active&&generation===g&&owns()&&host.isConnected;};
 function destroyViews(){children.splice(0).forEach(function(x){if(x.cleanup)x.cleanup();else if(x.stop)x.stop();});aborts.splice(0).forEach(function(x){x.abort();});}
 cleanup=function(){active=false;generation++;destroyViews();if(unsubscribe)unsubscribe();};
 if(api&&api.onChange)unsubscribe=api.onChange(function(){if(!owns()){stop();host.querySelectorAll('[data-source-era]').forEach(function(t){while(t.children.length>1)t.lastElementChild.remove();});button.disabled=true;status.hidden=false;status.textContent='계정이 바뀌었어요. 약점 보완을 다시 열어 주세요.';}});
 function message(t,value){while(t.children.length>1)t.lastElementChild.remove();var p=el(doc,'p',value);p.setAttribute('role','status');t.append(p);}
 function generic(target,era,g,manifestPromise,revision){
   return manifestPromise.then(async function(m){
     if(!runIsCurrent(g))return;
     if(!catalog.revisionRoutesReady(doc,era,revision))throw Error('manifest pin unavailable');
     var range=catalog.eraFor(era,revision),meta=catalog.sourceInfo(revision);
     if(!root.HanqSemanticLibrary?.validManifest(m,meta.sha256))throw Error('invalid manifest');
     var entries=m.pages.filter(function(p){return Number.isInteger(p.pdfPage)&&p.pdfPage>=range.from&&p.pdfPage<=range.to&&p.studySectionCounts&&p.studySectionCounts.concept>0;}).sort(function(a,b){return a.pdfPage-b.pdfPage;});
     var results=[];
     for(var offset=0;offset<entries.length;offset+=2){
       if(!runIsCurrent(g))return;
       var chunk=await Promise.all(entries.slice(offset,offset+2).map(async function(entry){
         var p=await api.textbookSemanticPage(entry.pdfPage,revision);
         if(p.pdfPage!==entry.pdfPage||p.sourceSha256!==meta.sha256||p.studySectionPartition?.schemaVersion!=='hanq-study-sections/1'||!Array.isArray(p.blocks))throw Error('invalid source page');
         return {page:p,parts:select(p,era,entry.title)};
       }));
       results.push.apply(results,chunk);
     }
     if(!runIsCurrent(g))return;
     if(!results.some(function(x){return x.parts.some(function(p){return p.blocks.some(function(b){return b.type==='table'&&!b.sourceParentTableId;});});}))throw Error('missing tables');
     while(target.children.length>1)target.lastElementChild.remove();
     var promises=[];
     results.forEach(function(result){
       result.parts.forEach(function(part){
         var wrapper=el(doc,'section',null,'hw-source'),paper=el(doc,'div',null,'hw-concept-table textbook-semantic-library history-notes-design');
         paper.dataset.historyEdition=meta.edition.startsWith('81')?'81':'79';
         wrapper.append(paper);target.append(wrapper);
         var shown=root.HanqTextbookSemantic.render(paper,Object.assign({},result.page,{blocks:part.blocks,sourceBlanks:[],generatedPractice:[]}),{
           compactReviewStatus:true,isFigureAvailable:function(f){return (m.figures||[]).some(function(x){return x.id===f.assetId;});},
           resolveFigure:function(f){if(!runIsCurrent(g))return Promise.reject(Error('account changed'));return api.textbookSemanticFigure(f.assetId,revision).then(function(b){if(!runIsCurrent(g))throw Error('account changed');return b;});}
         });children.push(shown);promises.push(shown.ready.then(async function(){
           var imgs=Array.from(paper.querySelectorAll('img'));
           await Promise.all(imgs.map(function(img){img.loading='eager';return img.decode?img.decode().catch(function(){}):Promise.resolve();}));
         }));
       });
     });
     await Promise.all(promises);
   });
 }
 async function opening(target,g){
   var transport=root.HanqOpeningScriptTransport?.fromDocument(doc,api);if(!transport)throw Error('opening source unavailable');
   var abort=new w.AbortController();aborts.push(abort);
   var input=await transport.loadBundle({signal:abort.signal});
   var reader=root.HanqOpeningScriptReader,prep=await reader.prepare(input,await transport.loadStructure({signal:abort.signal}),transport.presentation);
   if(!runIsCurrent(g))return;
   while(target.children.length>1)target.lastElementChild.remove();
   var count=0,assets=[];
   prep.bundle.topics.forEach(function(topic){
      var frame=el(doc,'section',null,'hw-source hw-opening-source');
      var paper=el(doc,'div');frame.append(paper);target.append(frame);
      var shown=reader.mount(paper,prep,{initialTopic:topic.id,studyTablesOnly:true,externalNavigation:true,loadFigure:function(name,options){
        if(!runIsCurrent(g))return Promise.reject(Error('account changed'));
        return transport.loadFigure(name,options);
      }});
      count+=frame.querySelectorAll('table').length;children.push(shown);assets.push(shown.ready);
   });
   if(!count)throw Error('missing opening tables');
   await Promise.all(assets);
 }
 async function load(){
   var g=++generation;destroyViews();button.disabled=true;status.hidden=false;status.textContent='자료를 불러오는 중이에요.';
   var targets=Array.from(host.querySelectorAll('[data-source-era]'));
   targets.forEach(function(t){message(t,'시대별 학습에서 표를 불러오는 중이에요.');});
   var rev=catalog?catalog.currentRevision(doc,null):null,m;
   if(owns()&&catalog&&api.textbookSemanticManifest)m=Promise.resolve().then(function(){return api.textbookSemanticManifest(rev);});
   else m=Promise.resolve(null);
   var ready=0;
   await Promise.all(targets.map(async function(t){
     var era=t.dataset.sourceEra;
     try{await (era==='opening'?opening(t,g):generic(t,era,g,m,rev));if(runIsCurrent(g))ready++;}
     catch(e){if(runIsCurrent(g)){message(t,'이 구간의 원래 표를 불러오지 못했어요.');var a=el(doc,'button','자료 다시 불러오기','tool-btn');a.type='button';a.onclick=load;t.append(a);}}
   }));
   if(!runIsCurrent(g))return;
   button.disabled=ready!==targets.length;
   var imageProblem=host.querySelector('[data-figure-unavailable],figure[data-error],.textbook-semantic-figure-status');
   status.textContent=button.disabled?'빠진 자료가 있어요. 다시 불러오면 PDF로 저장할 수 있어요.':imageProblem?'일부 원문 그림이 아직 보이지 않아요. 표시된 자료는 PDF로 저장할 수 있어요.':'인쇄 화면에서 PDF로 저장할 수 있어요.';
   if(!button.disabled&&imageProblem){var retry=el(doc,'button','원문 그림 다시 불러오기','tool-btn');retry.type='button';retry.onclick=load;status.append(doc.createTextNode(' '),retry);}
 }
 button.onclick=function(){if(!button.disabled&&owns()&&host.isConnected&&!host.hidden)w.print();};
 load();
}
var cleanup=null;
function stop(){if(cleanup){var f=cleanup;cleanup=null;f();}}
root.HanqWeaknessStudyContent={render:render,mount:mount,stop:stop,select:select};
}(window));
