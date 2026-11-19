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
// Registry entries describe public exam concepts only, never a member's results.
// Public question/concept pairs checked against the maintained CBT explanation.
// Apply only if the exact visible phrase resolves to one cell in the pinned source.
var currentBook='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
var openingBook='255c37fb68122a329cca00ae1c15035590b6a7b21f601e4a5b5f7515fdfbf695';
var verifiedMappings=[
 {era:'modern',round:74,number:45,text:'발췌 개헌',page:129,block:'81-p129-table1',cell:'81-p129-table1-source-r5-c0',sourceSha:currentBook},
 {era:'modern',round:74,number:48,text:'노사정 위원회',page:135,block:'81-p135-table1',cell:'81-p135-table1-source-r1-c1',sourceSha:currentBook},
 {era:'modern',round:75,number:46,text:'한미 상호 방위조약',page:129,block:'81-p129-table1',cell:'81-p129-table1-source-r4-c1',sourceSha:currentBook},
 {era:'modern',round:75,number:47,text:'3·1 민주 구국 선언',page:131,block:'81-p131-table1',cell:'81-p131-table1-source-r5-c1',sourceSha:currentBook},
 {era:'samguk',round:74,number:3,text:'경당 설치',page:17,block:'81-p017-table1',cell:'81-p017-table1-source-r4-c1',sourceSha:currentBook},
 {era:'samguk',round:74,number:4,text:'대가야 정복',page:23,block:'81-p023-table1',cell:'81-p023-table1-source-r4-c1',sourceSha:currentBook},
 {era:'samguk',round:75,number:3,text:'천마도',page:24,block:'81-p024-table1',cell:'81-p024-table1-source-r2-c3',sourceSha:currentBook},
 {era:'samguk',round:75,number:9,text:'사비 천도',page:20,block:'81-p020-table1',cell:'81-p020-table1-source-r6-c2',sourceSha:currentBook},
 {era:'samguk',round:75,number:9,text:'남부여',page:20,block:'81-p020-table1',cell:'81-p020-table1-source-r6-c2',sourceSha:currentBook},
 {era:'opening',round:75,number:33,text:'이토 히로부미 사살',page:105,cell:'os-table38-t38-r4-c3-content',sourceSha:openingBook},
 {era:'colonial',round:74,number:38,text:'김익상',page:117,block:'81-p117-table1',cell:'81-p117-table1-source-r1-c1',sourceSha:currentBook},
 {era:'colonial',round:74,number:38,text:'김상옥',page:117,block:'81-p117-table1',cell:'81-p117-table1-source-r1-c1',sourceSha:currentBook},
 {era:'colonial',round:74,number:42,text:'한국독립군',page:118,block:'81-p118-table1',cell:'81-p118-table1-source-r1-c1',sourceSha:currentBook},
 {era:'colonial',round:74,number:42,text:'대전자령 전투',page:118,block:'81-p118-table1',cell:'81-p118-table1-source-r1-c2',sourceSha:currentBook},
 {era:'colonial',round:75,number:35,text:'경성제국대학',page:109,block:'81-p109-table1',cell:'81-p109-table1-source-r6-c2',sourceSha:currentBook}
];
var runId=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function eligibleMapping(m){
 return m&&Object.hasOwn(titles,m.era)&&Number.isInteger(m.round)&&m.round>=67&&m.round<=80&&Number.isInteger(m.number)&&m.number>=1&&m.number<=50&&typeof m.text==='string'&&m.text.length>=2&&m.text.trim()===m.text&&(!m.anchor||typeof m.anchor==='string')&&(!m.page||Number.isInteger(m.page))&&(!m.block||typeof m.block==='string')&&(!m.cell||typeof m.cell==='string')&&(!m.sourceSha||/^[a-f0-9]{64}$/.test(m.sourceSha));
}
function resetCutoff(owner){return root.HanqLearningReset?.cutoff(owner,'history')||0;}
async function readResults(api,mappings,owner,current){
 var keys=new Map(),out=new Map();
 mappings.filter(eligibleMapping).forEach(function(m){if(!keys.has(m.round))keys.set(m.round,new Set());keys.get(m.round).add(m.number);});
 if(!keys.size||typeof api?.cbt!=='function'||!current())return out;
 var before=resetCutoff(owner),list=await api.cbt('GET','/api/v1/cbt/runs');
 if(!current()||resetCutoff(owner)!==before||!Array.isArray(list?.runs))return out;
 var recent=new Map();
 list.runs.forEach(function(r){
   if(!r||!keys.has(r.round)||r.status!=='final'||r.kind==='review'||!runId.test(r.id||''))return;
   var at=Date.parse(r.finalAt);if(!Number.isFinite(at)||at<=before)return;
   var prior=recent.get(r.round);
   if(!prior||at>prior.at)recent.set(r.round,{id:r.id,at:at,ambiguous:false});
   else if(at===prior.at&&r.id!==prior.id)prior.ambiguous=true;
 });
 for(var pair of recent){
   if(!current()||resetCutoff(owner)!==before)return new Map();
   var round=pair[0],run=pair[1];if(run.ambiguous)continue;
   var path='/api/v1/cbt/runs/'+run.id,detail;
   try{detail=await api.cbt('GET',path);}catch(_){continue;}
   if(!current()||resetCutoff(owner)!==before)return new Map();
   if(detail?.run?.id!==run.id||detail.run.round!==round||detail.run.status!=='final'||detail.run.kind==='review'||Date.parse(detail.run.finalAt)!==run.at||!Array.isArray(detail.items))continue;
   var items=detail.items;
   if(items.length!==50||items.some(function(q,i){return !q||q.position!==i||q.exam!==round||!Number.isInteger(q.number)||q.number<1||q.number>50||q.questionId!==('exam-'+round+'-'+String(q.number).padStart(2,'0'))||typeof q.version!=='string'||!q.version||!Array.isArray(q.options)||q.options.length!==5||q.options.some(function(o){return !o||typeof o.id!=='string';});})||new Set(items.map(function(q){return q.number;})).size!==50)continue;
   var marks=null;
   if(items.some(function(q){return keys.get(round).has(q.number)&&q.review?.status==='correct';})){
     try{
       var stars=await api.cbt('GET',path+'/stars'),sig=JSON.stringify(items.map(function(q){return[q.questionId,q.version,q.options.map(function(o){return o.id;})];}));
       if(stars?.signature===sig&&Array.isArray(stars.flags)&&stars.flags.length===items.length&&stars.flags.every(function(x){return typeof x==='boolean';})&&(!before||(Date.parse(stars.resetAt)||0)>=before))marks=stars.flags;
     }catch(_){}
   }
   if(!current()||resetCutoff(owner)!==before)return new Map();
   items.forEach(function(q){if(!keys.get(round).has(q.number))return;var kind=q.review?.status==='wrong'?'wrong':q.review?.status==='correct'&&marks?.[q.position]?'star':null;if(kind)out.set(round+':'+q.number,kind);});
 }
 return out;
}
function clearHighlights(host){
 host.querySelectorAll('[data-hw-result-label]').forEach(function(x){x.remove();});
 host.querySelectorAll('mark[data-hw-result-mark]').forEach(function(x){var parent=x.parentNode;x.replaceWith.apply(x,Array.from(x.childNodes));parent.normalize();});
}
function highlightExact(host,mappings,results){
 clearHighlights(host);
 var doc=host.ownerDocument,planned=[];
 mappings.filter(eligibleMapping).forEach(function(m){
   var kind=results.get(m.round+':'+m.number);if(kind!=='wrong'&&kind!=='star')return;
   var matches=[];
   Array.from(host.querySelectorAll('[data-source-era] td,[data-source-era] th')).forEach(function(cell){
     if(cell.closest('[data-source-era]').dataset.sourceEra!==m.era||cell.querySelector('td,th'))return;
     var page=cell.closest('[data-hw-pdf-page],.osr-source-card[data-page]'),source=cell.closest('[data-hw-source-sha]');
     if(m.cell&&(m.era==='opening'?cell.id:cell.dataset.sourceCell)!==m.cell||m.page&&Number(page?.dataset.hwPdfPage||page?.dataset.page)!==m.page||m.sourceSha&&source?.dataset.hwSourceSha!==m.sourceSha||m.block&&cell.closest('[data-source-block]')?.dataset.sourceBlock!==m.block)return;
     var nodes=[],text='',walker=doc.createTreeWalker(cell,4);
     while(walker.nextNode()){
       var n=walker.currentNode;
       if(n.parentElement.closest('button,script,style,svg,[hidden]'))continue;
       nodes.push({node:n,start:text.length});text+=n.data;
     }
     if(m.anchor&&!text.includes(m.anchor))return;
     for(var at=text.indexOf(m.text);at!==-1;at=text.indexOf(m.text,at+1)){
       var stop=at+m.text.length,parts=nodes.filter(function(n){return n.start<stop&&n.start+n.node.data.length>at;}).map(function(n){return {node:n.node,start:Math.max(at-n.start,0),end:Math.min(stop-n.start,n.node.data.length)};});
       if(parts.length)matches.push({cell:cell,parts:parts,kind:kind,round:m.round,number:m.number});
     }
   });
   if(matches.length===1)planned.push(matches[0]); // Ambiguous sources never receive an inferred tag.
 });
 var groups=[];
 planned.forEach(function(p){
   var old=groups.find(function(x){return x.parts.length===p.parts.length&&x.parts.every(function(n,i){var m=p.parts[i];return n.node===m.node&&n.start===m.start&&n.end===m.end;});});
   if(old){if(!old.labels.some(function(x){return x.round===p.round&&x.number===p.number;}))old.labels.push(p);}
   else groups.push({parts:p.parts,labels:[p]});
 });
 // Skip partially overlapping candidates rather than disturbing verbatim source markup.
 groups=groups.filter(function(p,i,all){return !all.some(function(q,j){return i!==j&&p.parts.some(function(a){return q.parts.some(function(b){return a.node===b.node&&a.start<b.end&&b.start<a.end;});});});});
 groups.sort(function(a,b){var x=a.parts[0],y=b.parts[0];return x.node===y.node?y.start-x.start:x.node.compareDocumentPosition(y.node)&4?1:-1;});
 groups.forEach(function(p){
   var end;
   p.parts.forEach(function(n){
     var original=n.node,selected=original.splitText(n.start);
     selected.splitText(n.end-n.start);
     var mark=el(doc,'mark',null,'hw-result-mark');mark.dataset.hwResultMark=p.labels.some(function(x){return x.kind==='wrong';})?'wrong':'star';
     selected.replaceWith(mark);mark.append(selected);end=mark;
   });
   var tags=p.labels.map(function(x){var tag=el(doc,'span',(x.kind==='wrong'?'오답':'★ 정답·별표')+' · '+x.round+'회 '+x.number+'번','hw-result-label');tag.dataset.hwResultLabel=x.kind;return tag;});
   end.after.apply(end,tags);
 });
 return {matches:groups.length,labels:groups.reduce(function(n,p){return n+p.labels.length;},0)};
}
function mount(host,pdf){
 stop();
 var doc=host.ownerDocument,api=root.HanqApi,w=doc.defaultView,button=pdf.querySelector('button'),status=pdf.querySelector('[role=status]');
 var initial=api&&api.state&&api.state(),catalog=root.HanqPrivateTextbook,owns=function(){var x=api&&api.state&&api.state();return x&&initial&&x.signedIn&&!x.restoring&&x.ownerId&&x.ownerId===initial.ownerId&&x.epoch===initial.epoch;};
 var generation=0,children=[],aborts=[],unsubscribe=null,active=true,sourceReady=false;
 var evidenceBox=el(doc,'div',null,'hw-result-tools'),evidenceButton=el(doc,'button','내 오답·별표 표시','tool-btn'),evidenceStatus=el(doc,'p','검증된 기출과 연결되는 표 구절만 표시해요.');
 evidenceButton.type='button';evidenceStatus.setAttribute('role','status');evidenceBox.append(evidenceButton,evidenceStatus);
 if(verifiedMappings.length&&typeof api?.cbt==='function')host.prepend(evidenceBox);
 var runIsCurrent=function(g){return active&&generation===g&&owns()&&host.isConnected;};
 function destroyViews(){clearHighlights(host);children.splice(0).forEach(function(x){if(x.cleanup)x.cleanup();else if(x.stop)x.stop();});aborts.splice(0).forEach(function(x){x.abort();});}
 cleanup=function(){active=false;generation++;destroyViews();evidenceBox.remove();if(unsubscribe)unsubscribe();if(offReset)offReset();};
 var offReset=root.HanqLearningReset?.onChange(function(){clearHighlights(host);evidenceStatus.textContent='필요하면 내 기출 기록을 다시 표시해 주세요.';});
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
         paper.dataset.hwPdfPage=result.page.pdfPage;paper.dataset.hwSourceSha=meta.sha256;
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
      var paper=el(doc,'div');if(transport.sourceSha256)frame.dataset.hwSourceSha=transport.sourceSha256;frame.append(paper);target.append(frame);
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
   var g=++generation;sourceReady=false;destroyViews();evidenceButton.disabled=true;button.disabled=true;status.hidden=false;status.textContent='자료를 불러오는 중이에요.';
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
   sourceReady=ready>0;evidenceButton.disabled=!sourceReady;
   if(!button.disabled&&imageProblem){var retry=el(doc,'button','원문 그림 다시 불러오기','tool-btn');retry.type='button';retry.onclick=load;status.append(doc.createTextNode(' '),retry);}
 }
 evidenceButton.onclick=async function(){
   var g=generation,owner=initial?.ownerId,cutoff=resetCutoff(owner);
   var current=function(){return runIsCurrent(g)&&resetCutoff(owner)===cutoff;};
   if(!sourceReady||!current()||evidenceButton.disabled)return;
   evidenceButton.disabled=true;clearHighlights(host);
   evidenceStatus.textContent='내 기출 기록을 확인하는 중이에요.';
   try{
     var rows=await readResults(api,verifiedMappings,owner,current);
     if(!current())return;
     var shown=highlightExact(host,verifiedMappings,rows);
     evidenceStatus.textContent=shown.labels?'기출과 연결된 표 구절 '+shown.matches+'곳을 표시했어요.':'내 기록에서 이 표의 구절과 정확히 연결되는 오답·정답 별표가 없어요.';
   }catch(_){if(current())evidenceStatus.textContent='기출 기록을 불러오지 못했어요. 다시 시도해 주세요.';}
   finally{if(runIsCurrent(g))evidenceButton.disabled=!sourceReady;}
 };
 button.onclick=function(){if(!button.disabled&&owns()&&host.isConnected&&!host.hidden)w.print();};
 load();
}
var cleanup=null;
function stop(){if(cleanup){var f=cleanup;cleanup=null;f();}}
root.HanqWeaknessStudyContent={render:render,mount:mount,stop:stop,select:select,highlights:{readResults:readResults,render:highlightExact,clear:clearHighlights,verifiedMappings:verifiedMappings}};
}(window));
