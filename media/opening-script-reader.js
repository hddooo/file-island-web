(function (root) {
  'use strict';
  // A data-injected reader. No endpoint, credentials, storage, grading or release-gate overrides.
  const colors = new Set(['#0070a3','#ff0000','#808080','#bfbfbf','#9b9ba8','#289b6e','#ed7d31','#000000','#ffff00','#0000ff','#1d9a78']);
  function inline(doc, target, text) {
    const tokens = /(<\/?(?:span|strong|u|br)\b[^>]*>|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/gi;
    let cursor=0, current=target; const stack=[];
    for (const m of text.matchAll(tokens)) {
      current.append(doc.createTextNode(text.slice(cursor,m.index))); cursor=m.index+m[0].length;
      if (m[2] || m[3]) { const e=doc.createElement(m[2]?'strong':'em'); e.setAttribute('data-history-source-emphasis',''); inline(doc,e,m[2]||m[3]); current.append(e); }
      else if(m[4]) { // Preserve labels; do not auto-link private sources to public delivery URLs.
        const e=doc.createElement('span'); e.textContent=m[4]; current.append(e);
      } else {
        const tag=/^<\/?(\w+)/.exec(m[0])[1].toLowerCase();
        if(/^<\//.test(m[0])) { if(stack.length && stack[stack.length-1].tag===tag) current=stack.pop().parent; else current.append(doc.createTextNode(m[0])); }
        else if(/^<br\s*\/?\s*>$/i.test(m[0])) current.append(doc.createElement('br'));
        else if(/^(strong|u)$/.test(tag) && new RegExp('^<'+tag+'\\s*>$','i').test(m[0])) {
          const e=doc.createElement(tag);e.setAttribute('data-history-source-emphasis','');current.append(e);stack.push({tag,parent:current});current=e;
        } else if(tag==='span') {
          const match=/^<span\s+style="color:(#[0-9a-f]{6})"\s*>$/i.exec(m[0]);
          if(match && colors.has(match[1].toLowerCase())) {
            const e=doc.createElement('span'); e.dataset.sourceColor=match[1].toLowerCase();if(e.dataset.sourceColor!=='#000000')e.setAttribute('data-history-source-emphasis','');
            // Grey ink remains distinct while retaining readable contrast on paper.
            const sourceColor=match[1].toLowerCase();e.style.setProperty('color',({'#bfbfbf':'#626872','#9b9ba8':'#626872','#808080':'#626872','#ff0000':'#b51f25','#0000ff':'#2546b8','#1d9a78':'#176952','#289b6e':'#176952','#ffff00':'#765800','#ed7d31':'#995016'})[sourceColor]||sourceColor,'important');
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
      if(/^\|/.test(line))throw Error('opening_unprojected_table');
      if(/^\s*[-+] /.test(line)) {
        const ul=doc.createElement('ul'),levels=[{indent:/^\s*/.exec(line)[0].length,list:ul,last:null}];
        while(i<lines.length && /^\s*[-+] /.test(lines[i])){
          const item=/^(\s*)[-+] (.*)$/.exec(lines[i++]),indent=item[1].length;
          while(levels.length>1&&indent<levels[levels.length-1].indent)levels.pop();
          let level=levels[levels.length-1];
          if(indent>level.indent&&level.last){const child=doc.createElement('ul');level.last.append(child);level={indent,list:child,last:null};levels.push(level);}
          const parts=[item[2]];while(i<lines.length&&/^\s+\S/.test(lines[i])&&!/^\s*[-+] /.test(lines[i])&&/^\s*/.exec(lines[i])[0].length>indent)parts.push(lines[i++]);const li=doc.createElement('li');inline(doc,li,parts.join('\n'));li.style.whiteSpace='pre-wrap';level.list.append(li);level.last=li;
        }
        host.append(ul);continue;
      }
      const p=doc.createElement('p'), parts=[];
      while(i<lines.length && lines[i].trim() && (!parts.length || !/^(#{1,6} |!\[|\s*[-+] |\|)/.test(lines[i])))parts.push(lines[i++]);
      inline(doc,p,parts.join('\n'));p.style.whiteSpace='pre-wrap';host.append(p);
    }
  }
  function mount(host,prepared,options) {
    if(!root.HanqOpeningStructure.isPrepared(prepared))throw Error('opening_not_prepared');const bundle=prepared.bundle,viewTopics=bundle.topics;
    options=options||{};const doc=host.ownerDocument,win=doc.defaultView;
    if(!bundle || bundle.schema!=='hanq-opening-script/1' || !/^[a-f0-9]{64}$/.test(bundle.source.sha256) || !Array.isArray(bundle.segments) || !Array.isArray(bundle.topics))throw Error('Invalid private study bundle');
    if(bundle.segments.some(s=>!['study','practice','answers','metadata'].includes(s.kind)||typeof s.markdown!=='string'))throw Error('Invalid source segments');
    if(!viewTopics.length)throw Error('opening_no_stage_topic');
    const initialTopic=viewTopics.some(t=>t.id===options.initialTopic)?options.initialTopic:viewTopics[0].id;
    let alive=true,epoch=0,topic=initialTopic,mode=options.initialMode||'study',dialog=null;const urls=new Set(),drafts=new Map(),layoutObservers=[];
    const shell=doc.createElement('section');shell.className='opening-script-reader';host.replaceChildren(shell);
    function el(tag,text,cls){const e=doc.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
    function button(text,fn){const e=el('button',text);e.type='button';e.onclick=fn;return e;}
    const header=el('header',null,'osr-header');header.append(el('p','HISTORY / OPENING','osr-eyebrow'),el('h1'));
    inline(doc,header.querySelector('h1'),prepared.rootTitleMarkdown);
    const orientation=el('div',null,'osr-orientation');renderMarkdown(doc,orientation,prepared.orientationMarkdown,figure);header.append(orientation);
    const nav=el('nav',null,'osr-topics');nav.setAttribute('aria-label','개화기 학습 주제');
    viewTopics.forEach(t=>{const b=button(t.title,()=>navigate(t.id,mode==='exam'?'exam':'study'));b.dataset.topic=t.id;nav.append(b);});header.append(nav);
    const modes=el('nav',null,'osr-modes');modes.setAttribute('aria-label','자료 구분');
    [['study','개념 학습'],['exam','시험에는 이렇게 나온다'],['practice','빈칸 퀴즈']].forEach(([id,title])=>{const b=button(title,()=>navigate(topic,id));b.dataset.mode=id;b.dataset.navigationNumber=String(modes.children.length+1).padStart(2,'0');modes.append(b);});header.append(modes);shell.append(header);
    const layout=el('div',null,'osr-layout'),toc=el('nav',null,'osr-toc'),body=el('main',null,'osr-body');toc.setAttribute('aria-label','현재 주제 목차');layout.append(toc,body);shell.append(layout);
    function dismissImage(){if(!dialog)return;const d=dialog;dialog=null;if(d.node.open)d.node.close();d.node.remove();if(d.release)d.release();if(d.opener.isConnected)d.opener.focus();}
    function closeImage(){if(win.history.state&&win.history.state.openingImage){win.history.back();}else dismissImage();}
    function showImage(src,alt,opener){dismissImage();const d=el('dialog',null,'osr-image-dialog');d.setAttribute('aria-label',alt);const close=button('이미지 닫기',closeImage),img=el('img');let zoomed=false;
      const zoom=button('원래 크기로 확대',()=>{zoomed=!zoomed;img.style.maxWidth=zoomed?'none':'100%';zoom.textContent=zoomed?'화면 너비에 맞추기':'원래 크기로 확대';});
      img.src=src;img.alt=alt;d.append(close,zoom,img);doc.body.append(d);dialog={node:d,opener,release:options.acquireModalLock&&options.acquireModalLock()};win.history.pushState(Object.assign({},win.history.state,{openingImage:true}),'');d.addEventListener('cancel',e=>{e.preventDefault();closeImage();});d.addEventListener('close',()=>{if(dialog&&dialog.node===d)dismissImage();});d.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();(doc.activeElement===close?zoom:close).focus();}});try{d.showModal();close.focus();}catch(e){dismissImage();throw e;}}
    let figureAbort=null,figureQueue=[],figureActive=0;
    let glossaryTerms=null;
    function clearImages(){if(glossaryTerms){glossaryTerms.stop();glossaryTerms=null;}layoutObservers.splice(0).forEach(observer=>observer.disconnect());if(figureAbort)figureAbort.abort();figureAbort=new win.AbortController();figureQueue.splice(0).forEach(job=>job.reject(Error('aborted')));dismissImage();urls.forEach(u=>win.URL.revokeObjectURL(u));urls.clear();}
    function pumpFigures(){while(figureActive<2&&figureQueue.length){const job=figureQueue.shift();if(job.signal.aborted){job.reject(Error('aborted'));continue;}figureActive++;Promise.resolve().then(()=>{if(job.signal.aborted)throw Error('aborted');return options.loadFigure(job.name,{signal:job.signal});}).then(job.resolve,job.reject).finally(()=>{figureActive--;pumpFigures();});}}
    function loadFigure(name,signal){return new Promise((resolve,reject)=>{figureQueue.push({name,signal,resolve,reject});pumpFigures();});}
    function figure(parent,name,alt){
      const f=el('figure'),caption=el('figcaption',alt);f.dataset.figure=name;parent.append(f);f.append(caption);
      if(!bundle.figures.includes(name) || !options.loadFigure){f.append(el('p','이 그림은 비공개 자료 연결 후 볼 수 있습니다.','osr-image-status'));return;}
      const generation=epoch,signal=figureAbort.signal;const status=el('p','', 'osr-image-status');status.setAttribute('role','status');f.append(status);
      const retry=button('그림 다시 불러오기',attempt);retry.className='osr-image-retry';retry.hidden=true;f.append(retry);
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
          if(img.naturalWidth<=240&&img.naturalHeight<=120)f.classList.add('osr-small-figure');
          b.setAttribute('aria-label',caption.textContent+' 확대');b.append(img);f.prepend(b);status.textContent='';const fallback=f.querySelector('.osr-badge-fallback');if(fallback)fallback.hidden=true;
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
      if(s.kind!=='study' || s.page<t.from || s.page>t.to)return false;
      return true;
    }
    function render(){epoch++;clearImages();body.replaceChildren();toc.replaceChildren();
      orientation.hidden=mode!=='study';nav.querySelectorAll('button').forEach(b=>{if((mode==='practice'||mode==='answers')&&options.workspace)b.removeAttribute('aria-current');else b.setAttribute('aria-current',String(b.dataset.topic===topic));});
      modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.mode===(mode==='answers'?'practice':mode))));
      const t=viewTopics.find(t=>t.id===topic)||viewTopics[0];topic=t.id;
      body.append(el('h2',mode==='study'?t.title:mode==='exam'?'시험에는 이렇게 나온다!':mode==='practice'?'개화기 빈칸 문제':'개화기 교재 정답'));
      if(mode==='practice'&&options.workspace){body.replaceChildren();options.workspace.show(body);return;}
      if(mode==='practice'||mode==='answers'){const toggle=button(mode==='answers'?'빈칸 퀴즈로 돌아가기':'교재 정답 보기',()=>navigate(topic,mode==='answers'?'practice':'answers'));toggle.dataset.mode=mode==='answers'?'practice':'answers';body.append(toggle);}
      if(mode==='practice'||mode==='answers')body.append(el('p',t.title+' · '+prepared.review.filter(g=>g.topic===topic).reduce((n,g)=>n+g.questions.length,0)+'문항','osr-review-scope'));
      if(mode==='answers'){
        const notice=el('section',null,'osr-reveal');notice.append(el('p','교재 정답입니다. 먼저 문제를 풀어 본 뒤 확인하세요.'));
        notice.append(button('교재 정답 펼치기',()=>{notice.remove();renderSegments(t);}));body.append(notice);return;
      }
      if(mode==='practice')body.append(el('p','빈칸을 생각한 뒤 임시 답안을 적어 보세요. 화면을 닫으면 답안은 사라지며 기존 학습 기록에는 저장되지 않습니다.','osr-note'));
      renderSegments(t);
      if(mode==='study'&&root.HanqHistory81Glossary)glossaryTerms=root.HanqHistory81Glossary.mount(body,'opening',bundle.source.sha256);
    }
    function renderReview(){
      if(mode==='practice'&&prepared.presentation.practiceGuidanceTopics.includes(topic))renderMarkdown(doc,body,prepared.practiceGuidance,figure);
      for(const section of prepared.review.filter(g=>g.topic===topic)){
        const article=el('article',null,'osr-source-card');article.id='opening-review-'+mode+'-'+section.id;article.dataset.kind=mode;
        const heading=el('h3');inline(doc,heading,section.titleMarkdown.trim());article.append(heading);
        if(mode==='practice')for(const q of section.questions){
          const item=el('section',null,'osr-question');item.dataset.questionId=q.id;renderMarkdown(doc,item,q.markdown,figure);if(q.blankMarkdown)renderMarkdown(doc,item,q.blankMarkdown,figure);
          for(const field of q.fields){if(field.markdown)renderMarkdown(doc,item,field.markdown,figure);const label=el('label','나의 임시 답안 '+field.label+'번','osr-draft'),input=el('textarea');input.rows=2;input.value=drafts.get(field.id)||'';input.setAttribute('aria-label',heading.textContent+' '+field.label+'번 임시 답안');input.oninput=()=>drafts.set(field.id,input.value);label.append(input);item.append(label);}
          if(q.optionsMarkdown){const options=el('div',null,'osr-options');renderMarkdown(doc,options,q.optionsMarkdown,figure);item.append(options);}article.append(item);
        }else{const list=el('ol',null,'osr-answer-list');for(const a of section.answers){const item=el('li');item.value=a.number;item.dataset.answerId=a.id;renderMarkdown(doc,item,a.markdown,figure);list.append(item);}article.append(list);for(const note of section.notes||[])renderMarkdown(doc,article,note,figure);}
        body.append(article);const link=button(heading.textContent,()=>{heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});});toc.append(link);
      }
    }
    const examItems=new Set(prepared.presentation.examItems);
    function renderSegments(t){if(mode!=='study'&&mode!=='exam'){renderReview();return;}prepared.segments.filter(s=>selected(s,t)&&s.markdown.trim()&&s.items.some(id=>!prepared.presentation.hiddenItems.includes(id)&&examItems.has(id)===(mode==='exam'))).forEach(s=>{
      const article=el('article',null,'osr-source-card');article.id=s.id;article.dataset.kind=mode;article.dataset.page=s.page;
      renderProjected(article,s);body.append(article);
      article.querySelectorAll('figure').forEach(f=>{const p=f.previousElementSibling,c=f.querySelector('figcaption'),suffix=' · PDF '+s.page+'쪽';if(p&&p.tagName==='P'&&p.children.length===1&&p.firstElementChild.tagName==='STRONG'&&c.textContent===p.textContent+suffix)p.remove();if(c.textContent.endsWith(suffix))c.textContent=c.textContent.slice(0,-suffix.length);});
    });

      if(mode==='exam'&&!body.querySelector('.osr-source-card'))body.append(el('p','이 주제에는 별도의 시험 선택지 구간이 없습니다.','osr-note'));
      body.querySelectorAll('.osr-source-card').forEach(article=>{
      const group=el('details'),title=article.querySelector('h3,h4'),summary=el('summary',(title?title.textContent:'학습 안내'));group.append(summary);toc.append(group);
      const headings=Array.from(article.querySelectorAll('h3,h4'));
      (headings.length?headings:[article]).forEach((heading,index)=>{if(!heading.id)heading.id=article.id+'-section-'+index;const a=el('button',heading===article?'이 쪽 읽기':heading.textContent);a.type='button';a.onclick=()=>{for(let node=heading.parentElement;node&&node!==body;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});};group.append(a);});
    });}
    function renderProjected(article,segment){
      if(mode==='study')for(const heading of segment.headings)renderMarkdown(doc,article,heading,figure);
      for(const id of segment.items){
        if(prepared.presentation.hiddenItems.includes(id)||examItems.has(id)!==(mode==='exam'))continue;
        if(prepared.presentation.itemKinds[id]==='timeline'){const f=prepared.figures.find(f=>f.events.length);const block=el('section',null,'osr-timeline');block.dataset.owner=f.owner;figure(block,f.name,prepared.presentation.timelineAlt);const list=el('ol');for(const e of f.events){const li=el('li');renderMarkdown(doc,li,e.dateMarkdown+' '+e.eventMarkdown,figure);list.append(li);}const details=el('details');details.append(el('summary','사건 순서 읽기'),list);block.append(details);article.append(block);}
        else if(prepared.presentation.itemKinds[id]==='photos'){for(const f of prepared.figures.filter(f=>f.owner===prepared.presentation.photoOwners[id]))sourceFigure(article,f.id);}
        else if(prepared.presentation.itemKinds[id]==='gallery'){const gallery=el('div',null,'osr-gallery');for(const row of [...new Set(prepared.figures.filter(f=>f.owner===id).map(f=>f.galleryRow))]){const group=el('div',null,'osr-gallery-row');group.style.setProperty('--osr-gallery-columns',prepared.figures.filter(f=>f.owner===id&&f.galleryRow===row).length);for(const f of prepared.figures.filter(f=>f.owner===id&&f.galleryRow===row))sourceFigure(group,f.id);gallery.append(group);}article.append(gallery);}
        else if(prepared.blocks.some(b=>b.id===id))renderMarkdown(doc,article,prepared.blocks.find(b=>b.id===id).markdown,figure);
        else renderSourceTable(article,prepared.tables.find(t=>t.id===id));
      }
    }
    function sourceFigure(parent,id){const f=prepared.figures.find(x=>x.id===id);if(!f)throw Error('opening_figure_missing');const holder=el('div');holder.dataset.owner=f.owner;parent.append(holder);figure(holder,f.name,f.captionMarkdown.trim().replace(/^[-+]\s+/,''));}
    function renderSourceTable(parent,t){
      const block=el('section',null,'osr-table-block');parent.append(block);parent=block;const toolbar=el('div',null,'osr-table-toolbar');if(t.nested)toolbar.classList.add('osr-nested-toolbar');parent.append(toolbar);
      const wrap=el('div',null,'osr-structure-scroll'),table=el('table',null,'osr-structure-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.dataset.structure=t.id;table.dataset.structure=t.id;table.dataset.layout=prepared.presentation.layouts[t.id]||'';if(t.atomicGrid||table.dataset.layout==='hierarchy')table.dataset.atomic='true';
      const title=el('h4',null,'osr-table-title');title.id='os-'+t.id+'-title';inline(doc,title,t.captionMarkdown.replace(/^#+ /,'').trim());if(t.nested){title.hidden=true;title.textContent=parent.parentElement?.querySelector('th')?.textContent||'';}toolbar.append(title);
      const caption=el('caption',null,'osr-visually-hidden');caption.id='os-'+t.id+'-caption';caption.textContent=title.textContent;table.append(caption);table.setAttribute('aria-labelledby',title.id);table.setAttribute('role','table');wrap.setAttribute('aria-labelledby',title.id);
      const hint=el('p','좌우로 밀어 표를 읽으세요.','osr-scroll-hint');hint.id='os-'+t.id+'-hint';hint.hidden=true;toolbar.append(hint);wrap.setAttribute('aria-describedby',hint.id);
      table.classList.add('osr-source-grid');
      const cols=el('colgroup');for(let i=0;i<t.columns;i++)cols.append(el('col'));table.append(cols);
      const rows=new Map(),head=el('thead');head.setAttribute('role','rowgroup');table.append(head);let body=null;
      if(t.headers){const tr=el('tr');t.headers.forEach((text,i)=>{const th=el('th',text);th.id='os-'+t.id+'-column-'+(i+1);th.scope='col';tr.append(th);});head.append(tr);}
      else if(!t.headerRow){const tr=el('tr'),a=el('th','구분'),b=el('th','내용');a.id='os-'+t.id+'-category';b.id='os-'+t.id+'-content';a.scope='col';b.scope=t.columns>2?'colgroup':'col';b.colSpan=t.columns-1;tr.append(a,b);head.append(tr);}
      for(let y=1;y<=t.rows;y++){
        const row=el('tr');row.setAttribute('role','row');row.dataset.row=y;rows.set(y,row);
        if(t.headerRow&&y===1)head.append(row);
        else{
          if(!body){body=el('tbody');body.setAttribute('role','rowgroup');table.append(body);}
          body.append(row);
        }
      }
      for(const c of [...t.cells].sort((a,b)=>a.row-b.row||a.column-b.column)){
        const header=(t.headerRow&&c.row===1)||(!t.atomicGrid&&c.column===1)||c.isHeader,cell=el(header?'th':'td');cell.id=c.id;cell.rowSpan=c.rowspan;cell.colSpan=c.colspan;cell.dataset.cell=c.row+':'+c.column;
        cell.setAttribute('role',header?(t.headerRow&&c.row===1?'columnheader':'rowheader'):'cell');
        if(header)cell.scope=t.headerRow&&c.row===1?'col':c.rowspan>1?'rowgroup':'row';
        else{
          const rowHeaders=c.owner?[c.owner,...(t.cells.find(h=>h.id===c.owner)?.owner?[t.cells.find(h=>h.id===c.owner).owner]:[])]:t.cells.filter(h=>((!t.atomicGrid&&h.column===1)||h.isHeader)&&h.column<c.column&&h.row<=c.row+c.rowspan-1&&h.row+h.rowspan>c.row).map(h=>h.id);
          const colHeaders=t.headers?['os-'+t.id+'-column-'+c.column]:t.headerRow?t.cells.filter(h=>h.row===1&&h.column<c.column+c.colspan&&h.column+h.colspan>c.column).map(h=>h.id):['os-'+t.id+'-content'];cell.setAttribute('headers',[...rowHeaders,...colHeaders].join(' '));
        }
        if(c.contentRole)cell.dataset.contentRole=c.contentRole;
        if(c.isHeader&&c.column>1){cell.classList.add('osr-nested-label');cell.setAttribute('headers',c.owner||(!t.atomicGrid?t.cells.filter(h=>h.column<c.column&&h.isHeader&&h.row<=c.row&&h.row+h.rowspan>c.row).map(h=>h.id).join(' '):''));}
        if(c.sourceId)cell.dataset.sourceOwner=c.sourceId;
        {if(c.label)cell.append(doc.createTextNode(c.label));if(c.insets?.length){renderMarkdown(doc,cell,c.allPartsBeforeInsets?c.markdown:c.parts[0].markdown,figure);for(const inset of c.insets){const block=el('aside',null,c.allPartsBeforeInsets?'osr-inset osr-quote-inset':'osr-inset');block.dataset.owner=c.sourceId;renderMarkdown(doc,block,inset.titleMarkdown,figure);for(const item of inset.itemsMarkdown)renderMarkdown(doc,block,item,figure);cell.append(block);}}else if(Number.isInteger(c.rankedCount)){for(let i=0;i<c.parts.length;i++){const part=el('div',null,i<c.rankedCount?'osr-ranked':'osr-supplementary');renderMarkdown(doc,part,c.parts[i].markdown,figure);cell.append(part);}}else renderMarkdown(doc,cell,c.markdown,figure);(c.nestedTables||[]).forEach(id=>renderSourceTable(cell,prepared.tables.find(t=>t.id===id)));(c.figures||[]).forEach(id=>sourceFigure(cell,id));if(c.noteMarkdown){const note=el('div',null,'osr-source-note');renderMarkdown(doc,note,c.noteMarkdown,figure);cell.append(note);}}
        rows.get(c.row).append(cell);
      }
      wrap.append(table);parent.append(wrap);
      if(win.ResizeObserver){const resize=new win.ResizeObserver(()=>{wrap.style.setProperty('--osr-visible-width',wrap.clientWidth+'px');hint.hidden=wrap.scrollWidth<=wrap.clientWidth+1;});resize.observe(wrap);resize.observe(table);layoutObservers.push(resize);}
    }

    function navigate(nextTopic,nextMode){topic=nextTopic;mode=nextMode;const state={source:bundle.source.sha256,topic,mode};win.history.pushState(Object.assign({},win.history.state,{openingScript:state}),'',options.routeForMode?options.routeForMode(mode):undefined);render();}
    function pop(){if(dialog&&!(win.history.state&&win.history.state.openingImage)){dismissImage();return;}dismissImage();const s=win.history.state&&win.history.state.openingScript;if(s&&s.source===bundle.source.sha256&&viewTopics.some(t=>t.id===s.topic)&&['study','exam','practice','answers'].includes(s.mode)){topic=s.topic;mode=s.mode;}else{topic=initialTopic;mode=options.modeFromLocation?options.modeFromLocation():options.initialMode||'study';}render();}
    if(!options.externalNavigation)win.addEventListener('popstate',pop);pop();
    return {handlePopState(){if(!alive)return false;pop();return true;},stop(){alive=false;epoch++;clearImages();drafts.clear();win.removeEventListener('popstate',pop);shell.remove();}};
  }
  root.HanqOpeningScriptReader={mount,inline,renderMarkdown,prepare:(bundle,data,presentation)=>root.HanqOpeningStructure.prepare(bundle,data,presentation)};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqOpeningScriptReader;
})(typeof window==='object'?window:globalThis);
