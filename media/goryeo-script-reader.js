(function (root) {
  'use strict';
  // A data-injected reader. No endpoint, credentials, storage, grading or release-gate overrides.
  const colors = new Set(['#0070a3','#ff0000','#808080','#bfbfbf','#9b9ba8','#289b6e','#ed7d31','#000000','#ffff00','#0000ff','#1d9a78']);
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
      if(/^\|/.test(line) && /^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i+1]||'')) {
        const wrap=doc.createElement('div');wrap.className='gsr-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','원문 비교표, 가로 스크롤');
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
    if(!root.HanqGoryeoStructure.isPrepared(prepared))throw Error('goryeo_not_prepared');const bundle=prepared.bundle,viewTopics=bundle.topics;
    options=options||{};const doc=host.ownerDocument,win=doc.defaultView;
    if(!bundle || bundle.schema!=='hanq-goryeo-script/1' || !/^[a-f0-9]{64}$/.test(bundle.source.sha256) || !Array.isArray(bundle.segments) || !Array.isArray(bundle.topics))throw Error('Invalid private study bundle');
    if(bundle.segments.some(s=>!['study','practice','answers','metadata'].includes(s.kind)||typeof s.markdown!=='string'))throw Error('Invalid source segments');
    if(!viewTopics.length)throw Error('goryeo_no_stage_topic');
    const initialTopic=viewTopics.some(t=>t.id===options.initialTopic)?options.initialTopic:viewTopics[0].id;
    let alive=true,epoch=0,topic=initialTopic,mode=options.initialMode||'study',dialog=null;const urls=new Set(),drafts=new Map(),layoutObservers=[];
    const shell=doc.createElement('section');shell.className='goryeo-script-reader';host.replaceChildren(shell);
    function el(tag,text,cls){const e=doc.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
    function button(text,fn){const e=el('button',text);e.type='button';e.onclick=fn;return e;}
    const header=el('header',null,'gsr-header');header.append(el('p','HISTORY / GORYEO','gsr-eyebrow'),el('h1',prepared.rootTitle));
    const orientation=el('div',null,'gsr-orientation');renderMarkdown(doc,orientation,prepared.orientationMarkdown,figure);header.append(orientation);
    const nav=el('nav',null,'gsr-topics');nav.setAttribute('aria-label','고려 학습 주제');
    viewTopics.forEach(t=>{const b=button(t.title,()=>navigate(t.id,mode==='exam'?'exam':'study'));b.dataset.topic=t.id;nav.append(b);});header.append(nav);
    const modes=el('nav',null,'gsr-modes');modes.setAttribute('aria-label','자료 구분');
    [['study','개념 학습'],['exam','시험에는 이렇게 나온다'],['practice','빈칸 퀴즈']].forEach(([id,title])=>{const b=button(title,()=>navigate(topic,id));b.dataset.mode=id;b.dataset.navigationNumber=String(modes.children.length+1).padStart(2,'0');modes.append(b);});header.append(modes);shell.append(header);
    const layout=el('div',null,'gsr-layout'),toc=el('nav',null,'gsr-toc'),body=el('main',null,'gsr-body');toc.setAttribute('aria-label','현재 주제 목차');layout.append(toc,body);shell.append(layout);
    function dismissImage(){if(!dialog)return;const d=dialog;dialog=null;if(d.node.open)d.node.close();d.node.remove();if(d.release)d.release();if(d.opener.isConnected)d.opener.focus();}
    function closeImage(){if(win.history.state&&win.history.state.goryeoImage){win.history.back();}else dismissImage();}
    function showImage(src,alt,opener){dismissImage();const d=el('dialog',null,'gsr-image-dialog');d.setAttribute('aria-label',alt);const close=button('이미지 닫기',closeImage),img=el('img');let zoomed=false;
      const zoom=button('원래 크기로 확대',()=>{zoomed=!zoomed;img.style.maxWidth=zoomed?'none':'100%';zoom.textContent=zoomed?'화면 너비에 맞추기':'원래 크기로 확대';});
      img.src=src;img.alt=alt;d.append(close,zoom,img);doc.body.append(d);dialog={node:d,opener,release:options.acquireModalLock&&options.acquireModalLock()};win.history.pushState(Object.assign({},win.history.state,{goryeoImage:true}),'');d.addEventListener('cancel',e=>{e.preventDefault();closeImage();});d.addEventListener('close',()=>{if(dialog&&dialog.node===d)dismissImage();});d.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();(doc.activeElement===close?zoom:close).focus();}});try{d.showModal();close.focus();}catch(e){dismissImage();throw e;}}
    let figureAbort=null,figureQueue=[],figureActive=0;
    function clearImages(){layoutObservers.splice(0).forEach(observer=>observer.disconnect());if(figureAbort)figureAbort.abort();figureAbort=new win.AbortController();figureQueue.splice(0).forEach(job=>job.reject(Error('aborted')));dismissImage();urls.forEach(u=>win.URL.revokeObjectURL(u));urls.clear();}
    function pumpFigures(){while(figureActive<2&&figureQueue.length){const job=figureQueue.shift();if(job.signal.aborted){job.reject(Error('aborted'));continue;}figureActive++;Promise.resolve().then(()=>{if(job.signal.aborted)throw Error('aborted');return options.loadFigure(job.name,{signal:job.signal});}).then(job.resolve,job.reject).finally(()=>{figureActive--;pumpFigures();});}}
    function loadFigure(name,signal){return new Promise((resolve,reject)=>{figureQueue.push({name,signal,resolve,reject});pumpFigures();});}
    function figure(parent,name,alt){
      const f=el('figure'),caption=el('figcaption',alt);f.dataset.figure=name;parent.append(f);f.append(caption);if(['p042-01.png','p042-02.png','p047-01.png','p048-01.png','p053-03.png'].includes(name))caption.hidden=true;
      if(!bundle.figures.includes(name) || !options.loadFigure){f.append(el('p','이 그림은 비공개 자료 연결 후 볼 수 있습니다.','gsr-image-status'));return;}
      const generation=epoch,signal=figureAbort.signal;const status=el('p','', 'gsr-image-status');status.setAttribute('role','status');f.append(status);
      const retry=button('그림 다시 불러오기',attempt);retry.className='gsr-image-retry';retry.hidden=true;f.append(retry);
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
          if(img.naturalWidth<=240&&img.naturalHeight<=120)f.classList.add('gsr-small-figure');
          b.setAttribute('aria-label',caption.textContent+' 확대');b.append(img);f.prepend(b);status.textContent='';const fallback=f.querySelector('.gsr-badge-fallback');if(fallback)fallback.hidden=true;
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
      orientation.hidden=mode!=='study';nav.querySelectorAll('button').forEach(b=>{if(mode==='study'||mode==='exam')b.setAttribute('aria-current',String(b.dataset.topic===topic));else b.removeAttribute('aria-current');});
      modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.mode===(mode==='answers'?'practice':mode))));
      const t=viewTopics.find(t=>t.id===topic)||viewTopics[0];topic=t.id;
      body.append(el('h2',mode==='study'?t.title:mode==='exam'?t.title+' · 시험에는 이렇게 나온다':mode==='practice'?'고려 빈칸 문제':'고려 교재 정답'));
      if(mode==='practice'||mode==='answers')body.append(el('p','고려 전체 공통 100문항','gsr-review-scope'));
      if(mode==='practice'||mode==='answers')body.append(button(mode==='answers'?'빈칸 퀴즈로 돌아가기':'교재 정답 보기',()=>navigate(topic,mode==='answers'?'practice':'answers')));
      if(mode==='answers'){
        const notice=el('section',null,'gsr-reveal');notice.append(el('p','교재 정답입니다. 먼저 문제를 풀어 본 뒤 확인하세요.'));
        notice.append(button('교재 정답 펼치기',()=>{notice.remove();renderSegments(t);}));body.append(notice);return;
      }
      if(mode==='practice')body.append(el('p','빈칸을 생각한 뒤 임시 답안을 적어 보세요. 화면을 닫으면 답안은 사라지며 기존 학습 기록에는 저장되지 않습니다.','gsr-note'));
      renderSegments(t);
    }
    function renderReview(){
      for(const section of prepared.review){
        const article=el('article',null,'gsr-source-card');article.id='review-'+mode+'-'+section.id;article.dataset.kind=mode;
        const heading=el('h3');inline(doc,heading,section.titleMarkdown.trim());article.append(heading);
        if(mode==='practice')for(const q of section.questions){
          const item=el('section',null,'gsr-question');item.dataset.questionId=q.id;renderMarkdown(doc,item,q.markdown,figure);
          for(const field of q.fields){let anchor=item;if(field.markdown){anchor=el('div',null,'gsr-subprompt');renderMarkdown(doc,anchor,field.markdown,figure);item.append(anchor);}inlineDraft(anchor,field.id,heading.textContent+' '+field.label+'번 임시 답안',!!field.markdown);}
          if(q.optionsMarkdown){const options=el('div',null,'gsr-options');renderMarkdown(doc,options,q.optionsMarkdown,figure);item.append(options);}article.append(item);
        }else{const list=el('ol',null,'gsr-answer-list');for(const a of section.answers){const item=el('li');item.value=a.number;item.dataset.answerId=a.id;renderMarkdown(doc,item,a.markdown,figure);list.append(item);}article.append(list);}
        body.append(article);const link=button(heading.textContent,()=>{heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});});toc.append(link);
      }
    }
    function inlineDraft(container,key,label,colonSlot){
      const nodes=[],walk=doc.createTreeWalker(container,4);while(walk.nextNode())nodes.push(walk.currentNode);
      const candidates=nodes.flatMap(node=>Array.from(node.textContent.matchAll(/\(([\s\u3000]+(?:,[\s\u3000]+)*)\)|[\u3000]{2,}/g),match=>({node,match})));
      if(candidates.length>1||(!candidates.length&&(!colonSlot||!/:\s*$/.test(container.textContent))))throw Error('source_blank_anchor');
      const found=candidates[0],original=found?found.match[0]:'',parts=original.startsWith('(')?original.slice(1,-1).split(',').length:1;
      const group=el('span',null,'gsr-draft gsr-inline-blank');group.dataset.fieldId=key;group.dataset.sourceBlank=original;group.dataset.parts=String(parts);
      const values=parts>1?String(drafts.get(key)||'').split(','):[drafts.get(key)||''];const inputs=[];
      container.id=container.id||'gsr-prompt-'+key;group.setAttribute('role','group');group.setAttribute('aria-label',label);
      if(original.startsWith('('))group.append(doc.createTextNode('('));
      for(let index=0;index<parts;index++){if(index)group.append(doc.createTextNode(','));const input=el('input');input.type='text';input.className='gsr-blank-input';input.dataset.part=String(index);input.value=values[index]||'';input.autocomplete='off';input.spellcheck=false;input.setAttribute('autocapitalize','off');input.setAttribute('aria-label',label+(parts>1?' · '+(index+1)+'번째 빈칸':''));input.setAttribute('aria-describedby',container.id);input.oninput=()=>drafts.set(key,inputs.map(i=>i.value).join(parts>1?',':''));inputs.push(input);group.append(input);}
      if(original.startsWith('('))group.append(doc.createTextNode(')'));
      if(found){const {node,match}=found,tail=node.splitText(match.index);tail.deleteData(0,original.length);tail.before(group);}else{const paragraph=container.querySelector('p:last-child')||container;paragraph.append(doc.createTextNode(' '),group);}
    }
    function renderSegments(t){if(mode==='practice'||mode==='answers'){renderReview();return;}prepared.segments.filter(s=>selected(s,t)&&s.markdown.trim()).forEach(s=>{
      const article=el('article',null,'gsr-source-card');article.id=s.id;article.dataset.kind=s.kind;article.dataset.page=s.page;
      renderProjected(article,s);if(article.childElementCount)body.append(article);
      article.querySelectorAll('figure').forEach(f=>{const p=f.previousElementSibling,c=f.querySelector('figcaption'),suffix=' · PDF '+s.page+'쪽';if(p&&p.tagName==='P'&&p.children.length===1&&p.firstElementChild.tagName==='STRONG'&&c.textContent===p.textContent+suffix)p.remove();if(c.textContent.endsWith(suffix))c.textContent=c.textContent.slice(0,-suffix.length);});
    });

      if(mode==='exam'&&!body.querySelector('.gsr-source-card'))body.append(el('p','이 단원에는 별도의 시험 선택지 항목이 없습니다.','gsr-note'));
      body.querySelectorAll('.gsr-source-card').forEach(article=>{
      const examNames={'exam-early':'고려 초기','exam-aristocratic':'문벌 귀족','exam-military':'무신 집권','exam-yuan':'원 간섭기','exam-late':'고려 말','exam-society-economy':'사회·경제'},examId=article.querySelector('table[data-structure]')?.dataset.structure,examName=mode==='exam'?examNames[examId]:null;
     const group=el('details'),title=article.querySelector('h3,h4'),summary=el('summary',examName||(title?title.textContent:'학습 안내'));group.append(summary);toc.append(group);
      const headings=Array.from(article.querySelectorAll('h3,h4'));
      (headings.length?headings:[article]).forEach((heading,index)=>{if(!heading.id)heading.id=article.id+'-section-'+index;const a=el('button',heading===article?'학습 내용 읽기':examName||heading.textContent);a.type='button';a.onclick=()=>{for(let node=heading.parentElement;node&&node!==body;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});};group.append(a);});
    });}
    function renderProjected(article,segment){
      const parts=segment.markdown.split(/(@@(?:table1[5-9]|table2[0-2]|gallery-culture|exam-society-economy|exam-early|exam-military|exam-aristocratic|exam-yuan|exam-late|early-diagram)@@)/);
      parts.forEach(part=>{
        const token=/^@@(.+)@@$/.exec(part);
        if(!token){if(mode==='study')renderMarkdown(doc,article,part,figure);return;}
        if((mode==='exam')!==token[1].startsWith('exam-'))return;
        if(token[1]==='early-diagram'){
          const section=el('section',null,'gsr-early-diagram');section.setAttribute('aria-label','고려 초기 왕계');section.dataset.owner='early-kings';section.append(el('h3',prepared.earlyTitle));figure(section,'p042-01.png','고려 초기 왕계');
          const description=el('details');description.append(el('summary','텍스트 설명'));renderMarkdown(doc,description,prepared.diagramText,figure);section.append(description);article.append(section);return;
        }
        if(token[1]==='gallery-culture'){const gallery=el('section',null,'gsr-culture-gallery');gallery.dataset.owner='gallery-culture';prepared.gallery.figures.forEach(id=>sourceFigure(gallery,id));article.append(gallery);return;}
        renderSourceTable(article,prepared.tables.find(t=>t.id===token[1]));
      });
    }
    function sourceFigure(parent,id){const f=prepared.figures.find(x=>x.id===id);if(!f)throw Error('goryeo_figure_missing');const holder=el('div');holder.dataset.owner=f.owner;parent.append(holder);figure(holder,f.name,f.captionMarkdown?'['+f.captionMarkdown.trim()+']':'무역 지도');}
    function renderBands(parent,bands){for(const band of bands||[]){const block=el('div',null,band.panels.length?'gsr-independent-panels':'gsr-content-band');block.dataset.band=band.id;parent.append(block);renderMarkdown(doc,block,band.markdown,figure);renderBands(block,band.panels);band.figures.forEach(id=>sourceFigure(block,id));}}
    function renderSourceTable(parent,t){
      const wrap=el('div',null,'gsr-structure-scroll'),table=el('table',null,'gsr-structure-table');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.dataset.structure=t.id;table.dataset.structure=t.id;
      const title=el('h4',null,'gsr-table-title');title.id='gs-'+t.id+'-title';inline(doc,title,t.captionMarkdown.replace(/^#+ /,'').trim());parent.append(title);
      const caption=el('caption',null,'gsr-visually-hidden');caption.id='gs-'+t.id+'-caption';caption.textContent=title.textContent;table.append(caption);table.setAttribute('aria-labelledby',title.id);table.setAttribute('role','table');wrap.setAttribute('aria-labelledby',title.id);
      const hint=el('p','좌우로 밀어 표를 읽으세요.','gsr-scroll-hint');hint.id='gs-'+t.id+'-hint';hint.hidden=true;parent.append(hint);wrap.setAttribute('aria-describedby',hint.id);
      table.classList.add(t.id==='table15'?'gsr-period-grid':t.id==='table16'?'gsr-ruler-grid':t.id==='table22'?'gsr-independent-grid':'gsr-exam-grid');
      const cols=el('colgroup');(t.id==='table15'?[140,196,196,196,196,196]:t.id==='table16'?[150,470,280]:t.columns===4?[150,430,150,430]:t.columns===3?[120,160,480]:[160,600]).forEach(width=>{const col=el('col');col.style.width=width+'px';cols.append(col);});table.append(cols);
      const rows=new Map(),head=el('thead');head.setAttribute('role','rowgroup');table.append(head);let body=null;
      if(t.headers){const tr=el('tr');t.headers.forEach((text,i)=>{const th=el('th',text);th.id='gs-'+t.id+'-column-'+(i+1);th.scope='col';tr.append(th);});head.append(tr);}
      else if(!t.headerRow){const tr=el('tr'),a=el('th','구분'),b=el('th','내용');a.id='gs-'+t.id+'-category';b.id='gs-'+t.id+'-content';a.scope='col';b.scope=t.columns>2?'colgroup':'col';b.colSpan=t.columns-1;tr.append(a,b);head.append(tr);}
      for(let y=1;y<=t.rows;y++){
        const row=el('tr');row.setAttribute('role','row');row.dataset.row=y;rows.set(y,row);
        if(t.headerRow&&y===1)head.append(row);
        else{
          if(!body||((t.id.startsWith('exam-')||t.id==='table17')&&t.cells.some(c=>c.column===1&&c.row===y))){body=el('tbody');body.setAttribute('role','rowgroup');table.append(body);}
          body.append(row);
        }
      }
      for(const c of [...t.cells].sort((a,b)=>a.row-b.row||a.column-b.column)){
        const header=(t.headerRow&&c.row===1)||c.column===1||c.isHeader,cell=el(header?'th':'td');cell.id=c.id;cell.rowSpan=c.rowspan;cell.colSpan=c.colspan;cell.dataset.cell=c.row+':'+c.column;
        cell.setAttribute('role',header?(t.headerRow&&c.row===1?'columnheader':'rowheader'):'cell');
        if(t.id==='table16')cell.style.setProperty('--gsr-mobile-row',c.figure?11:c.row===6?11+c.column:2*c.row-2+c.column);
        if(header)cell.scope=t.headerRow&&c.row===1?'col':c.rowspan>1?'rowgroup':'row';
        else{
          const rowHeaders=t.cells.filter(h=>(t.id!=='table22'||Math.floor((h.column-1)/2)===Math.floor((c.column-1)/2))&&(h.column===1||h.isHeader)&&h.column<c.column&&h.row<=c.row+c.rowspan-1&&h.row+h.rowspan>c.row).map(h=>h.id);
          const colHeaders=t.headers?['gs-'+t.id+'-column-'+c.column]:t.headerRow?t.cells.filter(h=>h.row===1&&h.column>=c.column&&h.column<c.column+c.colspan).map(h=>h.id):['gs-'+t.id+'-content'];cell.setAttribute('headers',[...rowHeaders,...colHeaders].join(' '));
        }
        if(c.contentRole)cell.dataset.contentRole=c.contentRole;
        if(c.isHeader&&c.column>1&&t.id!=='table22'){cell.classList.add('gsr-nested-label');cell.setAttribute('headers',t.cells.filter(h=>h.column<c.column&&h.isHeader&&h.row<=c.row&&h.row+h.rowspan>c.row).map(h=>h.id).join(' '));}
        if(c.sourceId)cell.dataset.sourceOwner=c.sourceId;
        if(c.figure){cell.dataset.owner='table16';figure(cell,c.figure,'고려 초기 지도');}
        else{if(c.label)cell.append(doc.createTextNode(c.label));if(c.insets?.length){for(const part of c.parts){const block=el('div',null,part.inset?'gsr-inset':'gsr-content-band');renderMarkdown(doc,block,part.markdown,figure);cell.append(block);}}else renderMarkdown(doc,cell,c.markdown,figure);renderBands(cell,c.bands);(c.figures||[]).forEach(id=>sourceFigure(cell,id));if(c.noteMarkdown){const note=el('div',null,'gsr-source-note');renderMarkdown(doc,note,c.noteMarkdown,figure);cell.append(note);}}
        if(c.contentFigure){cell.dataset.owner=c.sourceId;figure(cell,c.contentFigure,t.cells.filter(h=>h.isHeader&&h.row<=c.row&&h.row+h.rowspan>c.row).map(h=>h.markdown).join(' '));}
        rows.get(c.row).append(cell);
      }
      wrap.append(table);parent.append(wrap);
      if(win.ResizeObserver){const resize=new win.ResizeObserver(()=>{hint.hidden=wrap.scrollWidth<=wrap.clientWidth+1;});resize.observe(wrap);resize.observe(table);layoutObservers.push(resize);}
    }

    function navigate(nextTopic,nextMode){topic=nextTopic;mode=nextMode;const state={source:bundle.source.sha256,topic,mode};win.history.pushState(Object.assign({},win.history.state,{goryeoScript:state}),'',options.routeForMode?options.routeForMode(mode):undefined);render();}
    function pop(){if(dialog&&!(win.history.state&&win.history.state.goryeoImage)){dismissImage();return;}dismissImage();const s=win.history.state&&win.history.state.goryeoScript;if(s&&s.source===bundle.source.sha256&&viewTopics.some(t=>t.id===s.topic)&&['study','exam','practice','answers'].includes(s.mode)){topic=s.topic;mode=s.mode;}else{topic=initialTopic;mode=options.modeFromLocation?options.modeFromLocation():options.initialMode||'study';}render();}
    if(!options.externalNavigation)win.addEventListener('popstate',pop);pop();
    return {handlePopState(){if(!alive)return false;pop();return true;},stop(){alive=false;epoch++;clearImages();drafts.clear();win.removeEventListener('popstate',pop);shell.remove();}};
  }
  root.HanqGoryeoScriptReader={mount,inline,renderMarkdown,prepare:bundle=>root.HanqGoryeoStructure.prepare(bundle)};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqGoryeoScriptReader;
})(typeof window==='object'?window:globalThis);
