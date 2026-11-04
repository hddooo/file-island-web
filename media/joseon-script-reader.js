(function (root) {
  'use strict';
  // A data-injected reader. No endpoint, credentials, storage, grading or release-gate overrides.
  const colors = new Set(['#0070a3','#ff0000','#808080','#bfbfbf','#9b9ba8','#289b6e','#ed7d31','#000000','#ffff00']);
  // Display-only audit of this immutable source. Never apply positional rules to another edition.
  const editorialSource='8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1';
  const editorialDrop=new Set([93,165,247,394,430,504,514,534,560,609,920,988,1015,1084,1111,1139,1216,1296,1345,1377,1386,1411,1432,1455,1457,1484,1570,1698,1783,1791,1836,1845,1864,2216]);
  const editorialTitle=new Set([67,73,102,116,556]);
  function readingMarkdown(segment,sourceSha){
    if(sourceSha!==editorialSource||!Number.isInteger(segment.startLine))return segment.markdown;
    return segment.markdown.split('\n').map((line,index)=>{
      const number=segment.startLine+index;
      if(/^#### 원문 퀴즈(?: · .*|)$/.test(line))return line.replace('원문 퀴즈','빈칸 문제');
      if(/^#### 원문 인쇄 정답(?: · 〈정답〉|)$/.test(line))return '#### 교재 정답';
      // These source-bound tables contain two editorial coordinate columns before the content.
      if(((segment.kind==='answers'&&[64,72].includes(segment.page))||(number>=1620&&number<=1630))&&/^\|/.test(line)){
        const cells=line.replace(/^\||\|\s*$/g,'').split('|');
        if(cells.length===3)return '| '+cells[2].trim().replace(/^번호 · 인쇄 정답$/,'번호 · 교재 정답')+' |';
      }
      if(segment.kind==='answers'&&segment.page===87&&line==='| 원문 번호 | 인쇄 답안 |')return '| 번호 | 교재 정답 |';
      if([75,487].includes(number))return line.replace('원문 순서·왕','왕').replace('원문 업적','업적');
      if(number===181)return line.replace('원문 화살표 글자','관계');
      if(editorialDrop.has(number)||/^\*PDF \d+쪽\(인쇄 \d+쪽\), (?:배치에 따른 설명|원문 캡션)\. 아래 이미지 목록에 원문 배치 좌표를 기록했습니다\.\*$/.test(line)||/^### PDF \d+쪽$/.test(line)||/^원문 (?:머리말:|바닥글:|인쇄 쪽수(?::| ))/.test(line))return '';
      if(editorialTitle.has(number))return line.slice(0,line.indexOf(' · '));
      if([118,119,120].includes(number))return line.replace(/^- [^:]+: /,'- ');
      if(number===179)return line.replace('세종 셀 오른쪽, 위에서 ','');
      if(number===485)return line.replace('위 행 14–19대, 아래 행 20–25대. 원문에서 ','').replace('을 한 테두리로 묶고 ',' · ').replace('라고 표시하였다.','');
      if([78,81,82,88,495,499].includes(number))return line.replace('원문 회색 왕명, 업적란 없음','—');
      if(number===1107)return line.replace('배치·','');
      if(number===1109)return line.replace('위쪽 오른편의 ','');
      if(number===1110)return line.replace('아래쪽 왼편 ','');
      if(number===1534)return line.replace('도판은 왼쪽부터 ','').replace(' 순서이다.','');
      if([1572,1578,1585,1591,1595,1601,1607,1612].includes(number))return line.replace(/(왼쪽|오른쪽) 묶음 — /,'');
      if(number===1618)return line.replace(' 배치','');
      if(number===1781)return line.replace(' — 독립 병합 셀','');
      if(number===1876)return line.replace(' 배치','');
      if(number>=1878&&number<=1888)return line.replace(/^- [^:]+: /,'- ');
      if([2218,2238,2256,2275,2298].includes(number))return line.replace(/ — (왼쪽|오른쪽) (위|가운데|아래)$/,'');
      return line;
    }).join('\n');
  }
  function inline(doc, target, text) {
    const tokens = /(<\/?(?:span|strong|u|br)\b[^>]*>|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/gi;
    let cursor=0, current=target; const stack=[];
    for (const m of text.matchAll(tokens)) {
      current.append(doc.createTextNode(text.slice(cursor,m.index))); cursor=m.index+m[0].length;
      if (m[2] || m[3]) { const e=doc.createElement(m[2]?'strong':'em'); inline(doc,e,m[2]||m[3]); current.append(e); }
      else if(m[4]) { // Preserve labels; do not auto-link private sources to public delivery URLs.
        const e=doc.createElement('span'); e.textContent=m[4]; current.append(e);
      } else {
        const tag=/^<\/?(\w+)/.exec(m[0])[1].toLowerCase();
        if(/^<\//.test(m[0])) { if(stack.length && stack[stack.length-1].tag===tag) current=stack.pop().parent; else current.append(doc.createTextNode(m[0])); }
        else if(/^<br\s*\/?\s*>$/i.test(m[0])) current.append(doc.createElement('br'));
        else if(/^(strong|u)$/.test(tag) && new RegExp('^<'+tag+'\\s*>$','i').test(m[0])) {
          const e=doc.createElement(tag);current.append(e);stack.push({tag,parent:current});current=e;
        } else if(tag==='span') {
          const match=/^<span\s+style="color:(#[0-9a-f]{6})"\s*>$/i.exec(m[0]);
          if(match && colors.has(match[1].toLowerCase())) {
            const e=doc.createElement('span'); e.dataset.sourceColor=match[1].toLowerCase();
            // Grey ink remains distinct while retaining readable contrast on paper.
            e.style.color=['#bfbfbf','#9b9ba8','#808080'].includes(match[1].toLowerCase())?'#626872':match[1];
            current.append(e);stack.push({tag,parent:current});current=e;
          } else current.append(doc.createTextNode(m[0]));
        } else current.append(doc.createTextNode(m[0]));
      }
    }
    current.append(doc.createTextNode(text.slice(cursor)));
  }
  function renderMarkdown(doc, host, markdown, figure) {
    const lines=markdown.split('\n'); let i=0;
    while(i<lines.length) {
      const line=lines[i]; if(!line.trim()){i++;continue;}
      let m;
      if((m=/^!\[([^\]]*)\]\((p\d{3}-\d{2}\.png)\)$/.exec(line))) {figure(host,m[2],m[1]);i++;continue;}
      if((m=/^(#{1,6}) (.*)$/.exec(line))) {const e=doc.createElement('h'+Math.min(5,Math.max(2,m[1].length-1)));inline(doc,e,m[2]);host.append(e);i++;continue;}
      if(/^\|/.test(line) && /^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i+1]||'')) {
        const wrap=doc.createElement('div');wrap.className='jsr-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','원문 비교표, 가로 스크롤');
        const table=doc.createElement('table');let first=true;
        while(i<lines.length && /^\|/.test(lines[i])) {
          const row=lines[i++]; if(/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(row))continue;
          const tr=doc.createElement('tr');row.replace(/^\||\|\s*$/g,'').split('|').forEach(c=>{const td=doc.createElement(first?'th':'td');if(first)td.scope='col';inline(doc,td,c.trim());tr.append(td);});table.append(tr);first=false;
        }
        wrap.append(table);host.append(wrap);continue;
      }
      if(/^\s*[-+] /.test(line)) {
        const ul=doc.createElement('ul'),levels=[{indent:/^\s*/.exec(line)[0].length,list:ul,last:null}];
        while(i<lines.length && /^\s*[-+] /.test(lines[i])){
          const item=/^(\s*)[-+] (.*)$/.exec(lines[i++]),indent=item[1].length;
          while(levels.length>1&&indent<levels[levels.length-1].indent)levels.pop();
          let level=levels[levels.length-1];
          if(indent>level.indent&&level.last){const child=doc.createElement('ul');level.last.append(child);level={indent,list:child,last:null};levels.push(level);}
          const li=doc.createElement('li');inline(doc,li,item[2]);level.list.append(li);level.last=li;
        }
        host.append(ul);continue;
      }
      const p=doc.createElement('p'), parts=[];
      while(i<lines.length && lines[i].trim() && (!parts.length || !/^(#{1,6} |!\[|\s*[-+] |\|)/.test(lines[i])))parts.push(lines[i++]);
      inline(doc,p,parts.join('\n'));p.style.whiteSpace='pre-wrap';host.append(p);
    }
  }
  function mount(host,bundle,options) {
    options=options||{};const doc=host.ownerDocument,win=doc.defaultView;
    if(!bundle || bundle.schema!=='hanq-joseon-script/1' || !/^[a-f0-9]{64}$/.test(bundle.source.sha256) || !Array.isArray(bundle.segments) || !Array.isArray(bundle.topics))throw Error('Invalid private study bundle');
    if(bundle.segments.some(s=>!['study','practice','answers','metadata'].includes(s.kind)||typeof s.markdown!=='string'))throw Error('Invalid source segments');
    const initialTopic=bundle.topics.some(t=>t.id===options.initialTopic)?options.initialTopic:'early';
    let alive=true,epoch=0,topic=initialTopic,mode='study',dialog=null;const urls=new Set(),drafts=new Map();
    const shell=doc.createElement('section');shell.className='joseon-script-reader';host.replaceChildren(shell);
    function el(tag,text,cls){const e=doc.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
    function button(text,fn){const e=el('button',text);e.type='button';e.onclick=fn;return e;}
    const header=el('header',null,'jsr-header');header.append(el('p','HISTORY / JOSEON','jsr-eyebrow'),el('h1','조선, 흐름을 따라 읽기'),el('p','왕의 흐름에서 제도와 생활, 문화까지. 주제를 골라 차근차근 읽어 보세요.'));
    const nav=el('nav',null,'jsr-topics');nav.setAttribute('aria-label','조선 학습 주제');
    bundle.topics.forEach(t=>{const b=button(t.title,()=>navigate(t.id,'study'));b.dataset.topic=t.id;nav.append(b);});header.append(nav);
    const modes=el('nav',null,'jsr-modes');modes.setAttribute('aria-label','자료 구분');
    [['study','본문 읽기'],['practice','빈칸 문제'],['answers','교재 정답']].forEach(([id,title])=>{const b=button(title,()=>navigate(topic,id));b.dataset.mode=id;modes.append(b);});header.append(modes);shell.append(header);
    const layout=el('div',null,'jsr-layout'),toc=el('nav',null,'jsr-toc'),body=el('main',null,'jsr-body');toc.setAttribute('aria-label','현재 주제 목차');layout.append(toc,body);shell.append(layout);
    function dismissImage(){if(!dialog)return;const d=dialog;dialog=null;if(d.node.open)d.node.close();d.node.remove();if(d.release)d.release();if(d.opener.isConnected)d.opener.focus();}
    function closeImage(){if(win.history.state&&win.history.state.joseonImage){win.history.back();}else dismissImage();}
    function showImage(src,alt,opener){dismissImage();const d=el('dialog',null,'jsr-image-dialog');d.setAttribute('aria-label',alt);const close=button('이미지 닫기',closeImage),img=el('img');let zoomed=false;
      const zoom=button('원래 크기로 확대',()=>{zoomed=!zoomed;img.style.maxWidth=zoomed?'none':'100%';zoom.textContent=zoomed?'화면 너비에 맞추기':'원래 크기로 확대';});
      img.src=src;img.alt=alt;d.append(close,zoom,img);doc.body.append(d);dialog={node:d,opener,release:options.acquireModalLock&&options.acquireModalLock()};win.history.pushState(Object.assign({},win.history.state,{joseonImage:true}),'');d.addEventListener('cancel',e=>{e.preventDefault();closeImage();});d.addEventListener('close',()=>{if(dialog&&dialog.node===d)dismissImage();});d.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();(doc.activeElement===close?zoom:close).focus();}});try{d.showModal();close.focus();}catch(e){dismissImage();throw e;}}
    let figureAbort=null,figureQueue=[],figureActive=0;
    function clearImages(){if(figureAbort)figureAbort.abort();figureAbort=new win.AbortController();figureQueue.splice(0).forEach(job=>job.reject(Error('aborted')));dismissImage();urls.forEach(u=>win.URL.revokeObjectURL(u));urls.clear();}
    function pumpFigures(){while(figureActive<2&&figureQueue.length){const job=figureQueue.shift();if(job.signal.aborted){job.reject(Error('aborted'));continue;}figureActive++;Promise.resolve().then(()=>{if(job.signal.aborted)throw Error('aborted');return options.loadFigure(job.name,{signal:job.signal});}).then(job.resolve,job.reject).finally(()=>{figureActive--;pumpFigures();});}}
    function loadFigure(name,signal){return new Promise((resolve,reject)=>{figureQueue.push({name,signal,resolve,reject});pumpFigures();});}
    function figure(parent,name,alt){
      const f=el('figure'),caption=el('figcaption',alt);f.dataset.figure=name;parent.append(f);f.append(caption);
      if(!bundle.figures.includes(name) || !options.loadFigure){f.append(el('p','이 그림은 비공개 자료 연결 후 볼 수 있습니다.','jsr-image-status'));return;}
      const generation=epoch,signal=figureAbort.signal;const status=el('p','', 'jsr-image-status');status.setAttribute('role','status');f.append(status);
      const retry=button('그림 다시 불러오기',attempt);retry.className='jsr-image-retry';retry.hidden=true;f.append(retry);
      let pending=false;
      function current(){return alive&&generation===epoch&&!signal.aborted;}
      async function attempt(){
        if(pending||!current())return;pending=true;retry.hidden=true;status.textContent='그림 불러오는 중…';delete f.dataset.error;
        let url=null,b=null,stage='image_unavailable';
        try{
          const blob=await loadFigure(name,signal);if(!current())return;
          // Native Blob validation works across realms; integrity is checked by the transport.
          try{win.Blob.prototype.slice.call(blob,0,0);}catch(_){throw Error('image_blob');}
          if(blob.type!=='image/png')throw Error('image_mime');
          stage='image_url';url=win.URL.createObjectURL(blob);urls.add(url);stage='image_dom';b=button('',()=>showImage(url,caption.textContent,b));const img=el('img');img.alt=caption.textContent;
          await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('image_decode'));img.src=url;});
          if(!current())return;
          if(img.naturalWidth<=240&&img.naturalHeight<=120)f.classList.add('jsr-small-figure');
          b.setAttribute('aria-label',caption.textContent+' 확대');b.append(img);f.prepend(b);status.textContent='';const fallback=f.querySelector('.jsr-badge-fallback');if(fallback)fallback.hidden=true;
        }catch(error){
          if(url){win.URL.revokeObjectURL(url);urls.delete(url);}if(!current())return;
          const code=error&& (error.code||error.message),known=['timeout','network','aborted','session_changed','invalid_private_response','script_integrity_unavailable','script_figure_mime','script_figure_size','script_figure_digest','image_blob','image_mime','image_decode'];
          f.dataset.error=known.includes(code)?code:error&&Number.isInteger(error.status)&&error.status>=400&&error.status<=599?'http_'+error.status:stage;
          status.textContent=code==='timeout'?'그림 전송 시간이 초과되었습니다.':code==='image_decode'?'그림을 표시하지 못했습니다.':'그림을 불러오지 못했습니다.';retry.hidden=false;
        }finally{pending=false;}
      }
      attempt();
    }
    function selected(s,t){
      if(mode==='answers'||mode==='practice')return s.kind===mode; // Source groups retained; no invented canonical question mapping.
      if(s.kind!=='study' || s.page<t.from || s.page>t.to)return false;
      return true;
    }
    function render(){epoch++;clearImages();body.replaceChildren();toc.replaceChildren();
      nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.topic===topic)));
      modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.mode===mode)));
      const t=bundle.topics.find(t=>t.id===topic)||bundle.topics[0];topic=t.id;
      body.append(el('h2',mode==='study'?t.title:mode==='practice'?'조선 빈칸 문제':'조선 인쇄 정답'));
      if(mode==='answers'){
        const notice=el('section',null,'jsr-reveal');notice.append(el('p','교재 정답입니다. 먼저 문제를 풀어 본 뒤 확인하세요.'));
        notice.append(button('인쇄 정답 펼치기',()=>{notice.remove();renderSegments(t);}));body.append(notice);return;
      }
      if(mode==='practice')body.append(el('p','빈칸을 생각한 뒤 임시 답안을 적어 보세요. 화면을 닫으면 답안은 사라지며 기존 학습 기록에는 저장되지 않습니다.','jsr-note'));
      renderSegments(t);
    }
    function renderSegments(t){bundle.segments.filter(s=>selected(s,t)).forEach(s=>{
      const article=el('article',null,'jsr-source-card');article.id=s.id;article.dataset.kind=s.kind;article.dataset.page=s.page;
      article.append(el('p',s.page?'PDF '+s.page+'쪽 · 인쇄 '+(s.page-7)+'쪽':'원문 안내','jsr-source-label'));renderMarkdown(doc,article,readingMarkdown(s,bundle.source.sha256),figure);body.append(article);
      if(mode==='practice')Array.from(article.querySelectorAll('p')).forEach((p,i)=>{const m=/^\((\d+)\) /.exec(p.textContent);if(!m)return;const key=s.id+'-'+i,label=el('label','나의 임시 답안 · '+m[1]+'번','jsr-draft'),input=el('textarea');input.rows=2;input.value=drafts.get(key)||'';input.setAttribute('aria-label','PDF '+s.page+'쪽 '+m[1]+'번 임시 답안');input.oninput=()=>drafts.set(key,input.value);label.append(input);p.after(label);});
      article.querySelectorAll('figure').forEach(f=>{const p=f.previousElementSibling,c=f.querySelector('figcaption'),suffix=' · PDF '+s.page+'쪽';if(p&&p.tagName==='P'&&p.children.length===1&&p.firstElementChild.tagName==='STRONG'&&c.textContent===p.textContent+suffix)p.remove();if(c.textContent.endsWith(suffix))c.textContent=c.textContent.slice(0,-suffix.length);});
    });
      if(mode==='study'&&bundle.source.sha256===editorialSource){connectTable23();connectLaterTables();connectCulture();}
      body.querySelectorAll('.jsr-source-card').forEach(article=>{
      const group=el('details'),title=article.querySelector('h3,h4'),summary=el('summary',(title?title.textContent:'학습 안내')+' · '+article.dataset.page);group.append(summary);toc.append(group);
      const headings=Array.from(article.querySelectorAll('h3,h4'));
      (headings.length?headings:[article]).forEach((heading,index)=>{heading.id=article.id+'-section-'+index;const a=el('button',heading===article?'이 쪽 읽기':heading.textContent);a.type='button';a.onclick=()=>{for(let node=heading.parentElement;node&&node!==body;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});};group.append(a);});
    });}
    function connectTable23(){
      const pages=[60,61].map(page=>body.querySelector('.jsr-source-card[data-page="'+page+'"]'));
      if(pages.some(p=>!p))return;
      const titles=pages.map(p=>Array.from(p.children).find(e=>e.tagName==='H3'&&/^〈표 23〉/.test(e.textContent)));
      if(titles.some(t=>!t))return;
      const groups=[];
      pages.forEach((p,index)=>{let group=null;const nodes=Array.from(p.children).slice(Array.from(p.children).indexOf(titles[index])+1);nodes.forEach(node=>{if(node.tagName==='H4'){group={heading:node,page:60+index,nodes:[]};groups.push(group);}else if(group)group.nodes.push(node);});});
      const diagrams=['p060-03.png','p061-01.png'].map(name=>body.querySelector('[data-figure="'+name+'"]'));
      const badgeNames=['p061-03.png','p061-02.png','p061-04.png','p061-05.png'];
      const badges=badgeNames.map(name=>{const figure=body.querySelector('[data-figure="'+name+'"]'),label=figure&&figure.querySelector('figcaption').textContent;return {figure,reference:Array.from(pages[1].querySelectorAll('li [data-source-color]')).find(e=>e.textContent===label)};});
      // Validate the reviewed structure before moving any nodes; never guess at another layout.
      if(groups.length!==10||groups.filter(g=>g.page===60).length!==2||diagrams.some(f=>!f)||badges.some(b=>!b.figure||!b.reference))return;
      const article=el('article',null,'jsr-source-card jsr-connected-source');article.id=pages[0].id+'-table23';article.dataset.kind='study';article.dataset.page='60–61';
      article.append(el('p','PDF 60–61쪽 · 인쇄 53–54쪽','jsr-source-label'));
      const table=el('table',null,'jsr-king-table'),caption=el('caption'),head=el('thead'),headRow=el('tr'),tbody=el('tbody');
      caption.append(titles[0]);['구분','내용'].forEach(text=>{const th=el('th',text);th.scope='col';headRow.append(th);});head.append(headRow);table.append(caption,head,tbody);article.append(table);pages[0].after(article);
      groups.forEach(group=>{const row=el('tr'),th=el('th'),td=el('td');th.scope='row';th.append(group.heading,el('small','PDF '+group.page,'jsr-row-source'));td.append(...group.nodes);row.append(th,td);tbody.append(row);group.cell=td;});
      const subordinate=groups[0].cell.querySelector('p'),sublist=subordinate&&subordinate.nextElementSibling;
      if(subordinate&&sublist&&sublist.tagName==='UL'){const nested=el('section',null,'jsr-subperson');subordinate.before(nested);nested.append(subordinate,sublist);}
      [1,2].forEach((rowIndex,i)=>{const cell=groups[rowIndex].cell,layout=el('div',null,'jsr-diagram-row'),copy=el('div');copy.append(...Array.from(cell.childNodes));diagrams[i].querySelector('figcaption').hidden=true;layout.append(copy,diagrams[i]);cell.append(layout);});
      badges.forEach(({figure,reference})=>{figure.classList.add('jsr-inline-figure');figure.dataset.studyLabel=reference.textContent;figure.querySelector('figcaption').hidden=true;reference.replaceWith(figure);reference.classList.add('jsr-badge-fallback');figure.prepend(reference);});
      pages[1].remove();
      // Only the two reviewed diagram transcriptions; Table 23 content stays expanded.
      const intro=Array.from(pages[0].children),first=body.querySelector('[data-figure="p060-01.png"]'),second=body.querySelector('[data-figure="p060-02.png"]');
      const headings=intro.filter(n=>n.tagName==='H3');
      if(first&&second&&headings.length===2){
        const blocks=headings.map((h,i)=>intro.slice(intro.indexOf(h),i===0?intro.indexOf(headings[1]):intro.length));
        if(blocks[0].map(n=>n.tagName).join() ==='H3,P,P'&&blocks[1].map(n=>n.tagName).join()==='H3,P,DIV'){
          [first,second].forEach((f,i)=>{const detail=el('details',null,'jsr-transcription');detail.append(el('summary','\uD14D\uC2A4\uD2B8 \uC124\uBA85'),...blocks[i]);f.after(detail);});
        }
      }
    }
    function connectLaterTables(){
      const page=n=>body.querySelector('.jsr-source-card[data-page="'+n+'"]');
      const sections=article=>{const result=[];let current=null;Array.from(article.children).forEach(node=>{if(node.tagName==='H4'){current={heading:node,nodes:[],page:article.dataset.page};result.push(current);}else if(current)current.nodes.push(node);});return result;};
      const rename=(node,text)=>{node.dataset.originalHeading=node.textContent;const target=node.children.length===1&&node.firstElementChild.tagName==='STRONG'?node.firstElementChild:node;target.textContent=text;};
      const description=(figure,nodes)=>{const details=el('details',null,'jsr-transcription');details.append(el('summary','텍스트 설명'),...nodes);figure.after(details);};
      function build(number,pages,title,groups){
        const article=el('article',null,'jsr-source-card jsr-connected-source');article.id=pages[0].id+'-table'+number;article.dataset.page=pages.map(p=>p.dataset.page).join('–');article.dataset.kind='study';
        article.append(el('p','PDF '+pages[0].dataset.page+'–'+pages[pages.length-1].dataset.page+'쪽','jsr-source-label'));
        const table=el('table',null,'jsr-outline-table');table.dataset.table=number;table.setAttribute('role','table');
        const caption=el('caption');caption.append(title);const cols=el('colgroup');for(let i=0;i<3;i++)cols.append(el('col'));
        const head=el('thead'),headRow=el('tr'),category=el('th','구분'),content=el('th','내용');category.scope='col';content.scope='colgroup';content.colSpan=2;content.id=article.id+'-content';headRow.append(category,content);head.append(headRow);table.append(caption,cols,head);
        groups.forEach((group,gi)=>{const section=el('tbody');section.dataset.group=group.name;section.setAttribute('role','rowgroup');
          const main=el('th',null,'jsr-main-header');main.scope='rowgroup';main.rowSpan=group.rows.length;main.id=article.id+'-group-'+gi;main.setAttribute('role','rowheader');const heading=group.heading||el('h4',group.name);if(!group.heading)heading.dataset.layoutLabel='true';main.append(heading);
          if(group.subtitle){const sub=el('small',group.subtitle,'jsr-group-subtitle');sub.dataset.layoutLabel='true';main.append(sub);}
          group.rows.forEach((item,ri)=>{const row=el('tr');row.setAttribute('role','row');row.dataset.subrow=item.label||'';if(ri===0)row.append(main);
            const cell=el('td');cell.setAttribute('role','cell');const headerIds=[main.id,content.id];
            if(item.heading){const sub=el('th',null,'jsr-sub-header');sub.scope='row';sub.id=main.id+'-row-'+ri;sub.setAttribute('role','rowheader');sub.append(item.heading);row.append(sub);headerIds.push(sub.id);}else cell.colSpan=2;
            if(ri>0){const context=el('span',group.name,'jsr-parent-context');context.dataset.layoutLabel='true';context.setAttribute('aria-hidden','true');(item.heading?row.lastElementChild:cell).prepend(context);}
            cell.setAttribute('headers',headerIds.join(' '));cell.append(...item.nodes);cell.append(el('small','PDF '+item.page,'jsr-row-source'));row.append(cell);section.append(row);item.cell=cell;
          });table.append(section);
        });article.append(table);pages[0].before(article);pages.forEach(p=>p.remove());return article;
      }
      if(page(66)&&page(67)){
        const pages=[page(66),page(67)],parts=pages.flatMap(sections),names=['선조','광해군','인조','효종','현종','숙종','경종','영조','정조','세도정치'];
        const labels=[['임진왜란'],['대동법'],['정묘호란 / 후금','병자호란 / 청'],[],[],[],[],['균역법'],[],['순조','철종']];
        const title=Array.from(pages[0].children).find(n=>n.tagName==='H3'&&n.textContent.startsWith('〈표 24〉')),map=pages[0].querySelector('[data-figure="p066-01.png"]');
        const groups=parts.map((part,i)=>{const rows=[{nodes:[],page:part.page}],expected=labels[i]||[];part.nodes.forEach(n=>{const j=expected.indexOf(n.textContent.replace(names[i]+' → ',''));if(n.tagName==='P'&&j>=0)rows.push({heading:n,label:expected[j],nodes:[],page:part.page});else rows[rows.length-1].nodes.push(n);});return {name:names[i],heading:part.heading,rows};});
        if(title&&map&&parts.length===10&&parts.every((p,i)=>p.heading.textContent===names[i])&&groups.every((g,i)=>g.rows.length===labels[i].length+1)){
          groups.forEach(g=>g.rows.forEach(r=>{if(r.heading)rename(r.heading,r.label);}));
          build(24,pages,title,groups);const imjin=groups[0].rows[1],mapTitle=imjin.nodes.find(n=>n.tagName==='P'&&n.textContent==='임진왜란 지도'),legend=mapTitle&&mapTitle.nextElementSibling;
          imjin.cell.append(map);if(mapTitle&&legend&&legend.tagName==='UL'){mapTitle.remove();description(map,[legend]);}
        }
      }
      if(page(73)&&page(74)&&page(75)){
        const pages=[page(73),page(74),page(75)],parts=pages.flatMap(sections);
        const expected=['통치 체제 — 〈중앙 정치 기구〉','통치 체제 — 〈지방 행정 조직〉','군사제도','교육','마을 자치','외교 — 여진','외교 — 명','외교 — 청','외교 — 일본','토지제도','수취제도','사회제도','신분 계층','종교 — 천주교','종교 — 동학','조선후기 사회 — 평등으로 가는 시기','조선후기 경제 — 대동법','조선후기 경제 — 균역법','조선후기 경제 — 계속'];
        const title=Array.from(pages[0].children).find(n=>n.tagName==='P'&&n.textContent.startsWith('〈표 25〉')),figures=['p073-01.png','p073-02.png','p073-03.png'].map(name=>pages[0].querySelector('[data-figure="'+name+'"]'));
        if(!title||parts.length!==expected.length||parts.some((p,i)=>p.heading.textContent!==expected[i])||figures.some(f=>!f))return;
        const groups=[],single=i=>{const p=parts[i];groups.push({name:p.heading.textContent,heading:p.heading,rows:[{nodes:p.nodes,page:p.page}]});};
        rename(parts[0].heading,'〈중앙 정치 기구〉');rename(parts[1].heading,'〈지방 행정 조직〉');
        groups.push({name:'통치 체제',rows:[{nodes:[parts[0].heading,...parts[0].nodes,parts[1].heading,...parts[1].nodes],page:'73'}]});
        [2,3,4].forEach(single);
        function children(name,indices){const rows=indices.map(i=>{const p=parts[i],label=p.heading.textContent.split(' — ')[1];if(label==='계속'){p.heading.remove();return {nodes:p.nodes,page:p.page};}rename(p.heading,label);return {heading:p.heading,label,nodes:p.nodes,page:p.page};});groups.push({name,rows});}
        children('외교',[5,6,7,8]);[9,10,11,12].forEach(single);children('종교',[13,14]);
        rename(parts[15].heading,'조선후기 사회');single(15);groups[groups.length-1].subtitle='평등으로 가는 시기';children('조선후기 경제',[16,17,18]);
        const article=build(25,pages,title,groups),cell=groups[0].rows[0].cell;
        const wrapper=Array.from(cell.children).find(n=>n.tagName==='P'&&n.textContent==='도식의 연결 관계'),list=wrapper&&wrapper.nextElementSibling;
        if(list&&list.tagName==='UL'&&list.children.length===2){Array.from(list.children).forEach((li,i)=>{const ul=el('ul');ul.append(li);description(figures[i],[ul]);});list.remove();wrapper.remove();}
        // Keep the original era heading as section context without repeating page continuation wrappers.
        const context=el('h3','③ 조선의 사회·경제');context.dataset.layoutLabel='true';article.insertBefore(context,article.querySelector('table'));
      }
    }
    function connectCulture(){
      const page=n=>body.querySelector('.jsr-source-card[data-page="'+n+'"]'),compact=s=>s.replace(/[\[\]\s]/g,'');
      const description=(figure,nodes)=>{const d=el('details',null,'jsr-transcription');d.append(el('summary','텍스트 설명'),...nodes);figure.after(d);return d;};
      function table(article,number,title,groups,nested=false){
        const t=el('table',null,'jsr-outline-table jsr-culture-table'+(nested?' jsr-culture-nested':''));t.dataset.table=number;t.setAttribute('role','table');
        const cap=el('caption'),heading=el('h3');heading.append(...title.childNodes);cap.append(heading);title.before(t);title.remove();const cols=el('colgroup');for(let i=0;i<(nested?3:2);i++)cols.append(el('col'));
        const head=el('thead'),hr=el('tr'),category=el('th','구분'),content=el('th','내용');category.scope=nested?'colgroup':'col';category.colSpan=nested?2:1;content.scope='col';content.id=article.id+'-t'+number+'-content';hr.append(category,content);head.append(hr);t.append(cap,cols,head);
        groups.forEach((g,gi)=>{const section=el('tbody');section.dataset.group=g.name;section.setAttribute('role','rowgroup');const main=el('th',null,'jsr-main-header');main.scope=g.rows.length>1?'rowgroup':'row';main.rowSpan=g.rows.length;main.colSpan=nested&&g.rows.length===1?2:1;main.id=article.id+'-t'+number+'-group-'+gi;main.setAttribute('role','rowheader');
          const h=g.heading||el('h4',g.name);if(!g.heading)h.dataset.layoutLabel='true';main.append(h);
          g.rows.forEach((r,ri)=>{const tr=el('tr'),td=el('td');tr.setAttribute('role','row');td.setAttribute('role','cell');tr.dataset.subrow=r.label||'';if(ri===0)tr.append(main);const ids=[main.id,content.id];
            if(r.heading){const sub=el('th',null,'jsr-sub-header');sub.scope='row';sub.id=main.id+'-'+ri;sub.setAttribute('role','rowheader');sub.append(r.heading);tr.append(sub);ids.push(sub.id);if(ri>0){const context=el('span',g.name,'jsr-parent-context');context.dataset.layoutLabel='true';context.setAttribute('aria-hidden','true');sub.prepend(context);}}
            td.setAttribute('headers',ids.join(' '));td.append(...r.nodes);tr.append(td);section.append(tr);
          });t.append(section);
        });return t;
      }
      function gallery(article,number,entries,remove){
        const figures=entries.map(([name,owner,period])=>({figure:article.querySelector('[data-figure="'+name+'"]'),owner,period}));if(figures.some(f=>!f.figure))return null;
        const section=el('section',null,'jsr-culture-gallery');section.dataset.gallery=number;section.setAttribute('aria-label','PDF '+number+' 그림');figures[0].figure.before(section);
        figures.forEach(({figure,owner,period})=>{figure.dataset.owner=owner;if(period)figure.dataset.period=period;section.append(figure);});remove.forEach(n=>n.remove());return section;
      }
      const late=page(65);
      if(late){const nodes=Array.from(late.children),first=late.querySelector('[data-figure="p065-01.png"]'),second=late.querySelector('[data-figure="p065-02.png"]'),heading=nodes.find(n=>n.tagName==='H3'),group=nodes[4],timeline=nodes[5],printed=nodes[6],branches=nodes[7];
        if(first&&second&&heading&&heading.textContent==='② 조선 후기'&&timeline?.querySelectorAll('tr').length===13&&branches?.children.length===7&&printed?.textContent==='[붕당정치의 흐름]'){
          first.before(heading);const emphasis=group.querySelectorAll('strong');if(emphasis.length===2){const sedo=emphasis[1];group.replaceChildren(sedo,doc.createTextNode(': 순조·헌종·철종'));}
          description(first,[group,timeline]);second.querySelector('figcaption').textContent='붕당정치의 흐름';printed.remove();
          Array.from(branches.children).slice(0,3).forEach(li=>Array.from(li.childNodes).filter(n=>n.nodeType===3).forEach(n=>{n.textContent=n.textContent.replace(' 점선이 이 분기점을 가리킨다.','').replace(' 점선 화살표가 X를 가리킨다.','').replace(': 북인 아래로 이어진 선 끝에 ',': 북인 → ').replace('. ',' · ');}));description(second,[branches]);
          late.dataset.presentation='late-introduction';
        }
      }
      const p79=page(79);
      if(p79){const nodes=Array.from(p79.children),title=nodes.find(n=>n.tagName==='P'&&n.textContent.startsWith('〈표 26〉')),end=nodes.find(n=>n.tagName==='P'&&n.textContent.startsWith('〈표 27〉')),start=nodes.indexOf(title)+1,parts=nodes.slice(start,nodes.indexOf(end));
        const names=['태조','태종','세종 — 우리 것을 반영한 문화유산','세조','성종','명종','선조','광해군','영조','정조','순조','조선 말'];
        if(title&&end&&parts.length===24&&names.every((name,i)=>parts[i*2].tagName==='P'&&parts[i*2].textContent===name&&parts[i*2+1].tagName==='UL')){
          const groups=names.map((name,i)=>{const h=el('h4');h.append(...parts[i*2].childNodes);parts[i*2].remove();return {name,heading:h,rows:[{nodes:[parts[i*2+1]]}]};});
          const sejong=groups[2].heading.firstElementChild;if(sejong){sejong.textContent='세종';sejong.append(el('span',' — 우리 것을 반영한 문화유산','jsr-row-subtitle'));}
          table(p79,26,title,groups);const native=end.nextElementSibling,summary=native&&native.nextElementSibling;
          if(summary?.tagName==='P'&&summary.textContent==='[천상열차분야지도], [혼일강리역대국도지도], [수원 화성], [조선왕조의궤]')gallery(p79,79,[['p079-01.png','table26/태조'],['p079-02.png','table26/태종'],['p079-03.png','table26/정조'],['p079-04.png','table27/조선왕조의궤']],[summary]);
        }
      }
      const p80=page(80);
      if(p80){const nodes=Array.from(p80.children),title=nodes.find(n=>n.tagName==='P'&&n.textContent.startsWith('〈표 28〉')),start=nodes.indexOf(title)+1,parts=nodes.slice(start,start+16),footnote=nodes[start+16],label=nodes[start+17],duplicates=nodes[start+18];
        const names=['유교 / 서원','유교 / 이황','유교 / 이이','양명학','건축','지도','기타','도기'];
        if(title&&names.every((name,i)=>parts[i*2]?.tagName==='H4'&&parts[i*2].textContent===name&&parts[i*2+1]?.tagName==='UL')&&footnote?.textContent.startsWith('\\*사액 서원:')){
          const rows=names.map((name,i)=>({heading:parts[i*2],nodes:[parts[i*2+1]],label:name})),groups=[];
          rows.slice(0,3).forEach(r=>{r.heading.dataset.originalHeading=r.heading.textContent;r.label=r.label.split(' / ')[1];r.heading.textContent=r.label;});groups.push({name:'유교',rows:rows.slice(0,3)});
          rows.slice(3).forEach(r=>groups.push({name:r.label,heading:r.heading,rows:[{nodes:r.nodes}]}));
          // Literal footnote marker in this reviewed line must not consume the following bold term.
          const note=rows[0].nodes[0].querySelector('li>ul>li');if(note){note.replaceChildren(doc.createTextNode('→ 명종 때 사액*을 받아 '),el('strong','소수 서원'),doc.createTextNode('이 됨'));}
          table(p80,28,title,groups,true);footnote.firstChild.textContent=footnote.firstChild.textContent.replace(/^\\\*/, '*');footnote.classList.add('jsr-study-footnote');
          const entries=[['p080-01.png','table28/유교/서원'],['p080-02.png','table28/건축'],['p080-03.png','table28/건축'],['p080-04.png','table28/건축'],['p080-05.png','table28/지도'],['p080-06.png','table28/지도'],['p080-07.png','table28/도기','전기'],['p080-08.png','table28/도기','중기'],['p080-09.png','table28/도기','후기']];
          if(label?.textContent==='도판'&&duplicates?.querySelectorAll('td').length===9&&entries.every(([name],i)=>compact(duplicates.querySelectorAll('td')[i].textContent)===compact(p80.querySelector('[data-figure="'+name+'"] figcaption')?.textContent||'')))gallery(p80,80,entries,[label,duplicates]);
        }
      }
      const p82=page(82);
      if(p82){const nodes=Array.from(p82.children),title=nodes.find(n=>n.tagName==='P'&&n.textContent.startsWith('〈표 30〉')),start=nodes.indexOf(title)+1,parts=nodes.slice(start,start+4),label=nodes[start+4],duplicates=nodes[start+5];
        const order=['p082-01.png','p082-02.png','p082-04.png','p082-03.png','p082-05.png','p082-08.png','p082-06.png','p082-07.png','p082-09.png','p082-10.png','p082-11.png'];
        if(title&&parts[0]?.textContent==='조선 전기'&&parts[2]?.textContent==='조선 후기'&&parts[1]?.tagName==='UL'&&parts[3]?.tagName==='UL'&&duplicates?.children.length===11&&order.every((name,i)=>compact(duplicates.children[i].textContent)===compact(p82.querySelector('[data-figure="'+name+'"] figcaption')?.textContent||''))){
          table(p82,30,title,[{name:'조선 전기',heading:parts[0],rows:[{nodes:[parts[1]]}]},{name:'조선 후기',heading:parts[2],rows:[{nodes:[parts[3]]}]}]);
          for(const name of ['p082-04.png','p082-09.png','p082-11.png']){const star=duplicates.children[order.indexOf(name)].querySelector('[data-source-color="#ff0000"]'),caption=p82.querySelector('[data-figure="'+name+'"] figcaption');if(star){caption.textContent=caption.textContent.replace('★','');caption.append(star);}}
          gallery(p82,82,order.map(name=>[name,['p082-01.png','p082-02.png'].includes(name)?'gallery82/전기':'gallery82/후기']),[label,duplicates]);
        }
      }
      [p79,p80,p82].filter(Boolean).forEach(article=>{if(article.querySelector('.jsr-culture-table'))Array.from(article.children).filter(n=>n.tagName==='H3'&&n.textContent==='학습 내용').forEach(n=>n.remove());});
    }
    function navigate(nextTopic,nextMode){topic=nextTopic;mode=nextMode;const state={source:bundle.source.sha256,topic,mode};win.history.pushState(Object.assign({},win.history.state,{joseonScript:state}),'');render();}
    function pop(){if(dialog&&!(win.history.state&&win.history.state.joseonImage)){dismissImage();return;}dismissImage();const s=win.history.state&&win.history.state.joseonScript;if(s&&s.source===bundle.source.sha256&&bundle.topics.some(t=>t.id===s.topic)&&['study','practice','answers'].includes(s.mode)){topic=s.topic;mode=s.mode;}else{topic=initialTopic;mode='study';}render();}
    if(!options.externalNavigation)win.addEventListener('popstate',pop);pop();
    return {handlePopState(){if(!alive)return false;pop();return true;},stop(){alive=false;epoch++;clearImages();drafts.clear();win.removeEventListener('popstate',pop);shell.remove();}};
  }
  root.HanqJoseonScriptReader={mount,inline,renderMarkdown,readingMarkdown};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqJoseonScriptReader;
})(typeof window==='object'?window:globalThis);
