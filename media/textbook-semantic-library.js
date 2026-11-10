/* Authenticated, text-first textbook coordinator. No textbook data or local
 * persistence. Backend authorization is required on every semantic endpoint.
 * This component owns only its appended section, preserving host footers. */
(function (root) {
  'use strict';
  var sequence = 0;
  var sourceCatalog = root.HanqPrivateTextbook;
  if (!sourceCatalog && typeof module !== 'undefined' && module.exports) sourceCatalog = require('./private-textbook');
  function sourceInfo(revision) { return sourceCatalog && sourceCatalog.sourceInfo(revision); }

  function errorText(error) {
    if (error && (error.status === 401 || error.code === 'session_changed')) return '로그인을 확인해 주세요. 교재는 로그인한 회원 계정으로 볼 수 있어요.';
    if (error && error.status === 403) return '서버에서 교재 접근을 허용하지 않았어요. 로그인 상태와 회원 권한을 확인해 주세요.';
    if (error && (error.status === 503 || error.code === 'textbook_not_configured' || error.code === 'textbook_semantic_not_configured')) return '회원용 텍스트 교재 저장소가 아직 설정되지 않았어요.';
    if (error && error.status === 404) return '요청한 원문 학습 자료가 아직 준비되지 않았어요.';
    if (error && error.code === 'timeout') return '원문 학습 자료를 불러오는 시간이 길어졌어요. 다시 시도해 주세요.';
    if (error && error.code === 'disabled') return '텍스트 교재를 불러올 서버가 연결되지 않았어요.';
    return '원문 학습 자료를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.';
  }
  function validManifest(manifest, expectedRevision) {
    var info=manifest&&manifest.source&&sourceInfo(manifest.source.sha256);
    if(!info || expectedRevision!=null&&info.sha256!==expectedRevision || manifest.source.totalPdfPages!==info.totalPdfPages || manifest.source.revision!=null&&manifest.source.revision!==info.sha256)return false;
    if (!manifest || manifest.schemaVersion !== 'hanq-semantic-manifest/1' || !Array.isArray(manifest.pages) || !Array.isArray(manifest.quizzes)) return false;
    if (manifest.fourChoices !== undefined && (!Array.isArray(manifest.fourChoices) || manifest.fourChoices.length > 8 || !manifest.fourChoices.every(function (q) { return q && /^[a-z]+$/.test(q.id) && Number.isInteger(q.itemCount) && q.itemCount > 0 && q.itemCount <= 200; }) || new Set(manifest.fourChoices.map(function (q) { return q.id; })).size !== manifest.fourChoices.length)) return false;
    var pages = new Set(), quizzes = new Set();
    return manifest.pages.every(function (page) {
      if (!page || !Number.isInteger(page.pdfPage) || page.pdfPage < 1 || page.pdfPage > info.totalPdfPages || pages.has(page.pdfPage)) return false;
      pages.add(page.pdfPage); return true;
    }) && manifest.quizzes.every(function (quiz) {
      if (!quiz || typeof quiz.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(quiz.id) || quizzes.has(quiz.id)) return false;
      quizzes.add(quiz.id); return true;
    });
  }
  function create(options) {
    options = options || {};
    var api = options.api || root.HanqApi, doc = options.document || root.document;
    var host = null, shell = null, child = null, children = [], imageObserver = null, deferredImages = new Map(), unsubscribe = null, generation = 0, request = 0, session = '';
    var eraId = null, callbacks = null, era = null, manifest = null, pages = [], quiz = null, choices = null, mode = 'text', pageNumber = null;
    var status = null, coverage = null, quizCount = null, panel = null, tabs = null;
    var sourceRevision=null, sourceSha=null, editionSelect=null, sourceChanging=false, original=null, modeControls=null, originalAction=null, routeSnapshot=null, restoringRoute=null;
    var win=doc.defaultView||root;
    function baseLocation(href) { var u=new URL(href);u.searchParams.delete('textbookOriginal');u.searchParams.delete('textbookOriginalSource');return u.href; }
    function captureRoute() { if(win.location&&/^https?:/.test(win.location.href)){var state=Object.assign({},win.history.state||{});delete state.textbookOriginal;routeSnapshot={href:baseLocation(win.location.href),state:state};} }
    function dismissOriginal(focus) {
      if(!original)return;var item=original;original=null;item.reader.stop();if(item.dialog.open&&item.dialog.close)item.dialog.close();item.dialog.remove();if(focus&&item.opener&&item.opener.isConnected)item.opener.focus();
    }
    function closeOriginal() {
      if(!original)return;
      if(original.pushed&&win.history.state&&win.history.state.textbookOriginal){win.history.back();return;}
      var u=new URL(win.location.href),state=Object.assign({},win.history.state||{});u.searchParams.delete('textbookOriginal');u.searchParams.delete('textbookOriginalSource');delete state.textbookOriginal;win.history.replaceState(state,'',u);dismissOriginal(true);
    }
    function openOriginal(n,opener,push) {
      if(!manifest||!sourceSha||!sourceCatalog||!sourceCatalog.create||!Number.isInteger(n))return;
      var info=sourceInfo(sourceSha),sourceEra=sourceCatalog.erasFor(sourceSha).find(function(e){return n>=e.from&&n<=e.to;});
      if(!info||!sourceEra||n>info.totalPdfPages)return;
      dismissOriginal(false);
      var dialog=node('dialog',null,'textbook-original-dialog');dialog.setAttribute('aria-modal','true');
      var heading=node('h2',info.edition+' · 원문 전체·확대');heading.id='textbook-original-title-'+(++sequence);dialog.setAttribute('aria-labelledby',heading.id);
      var head=node('div',null,'textbook-original-head');head.appendChild(heading);var close=button('닫기',closeOriginal);head.appendChild(close);dialog.appendChild(head);
      var body=node('div',null,'textbook-original-body');dialog.appendChild(body);doc.body.appendChild(dialog);
      var state=win.history.state&&win.history.state.textbookOriginal;
      var item={dialog:dialog,reader:sourceCatalog.create({api:api,document:doc}),opener:opener||doc.activeElement,page:n,pushed:push!==false||!!(state&&state.pushed&&state.sourceSha===sourceSha)};original=item;
      if(push!==false){var u=new URL(win.location.href);u.searchParams.set('textbookOriginal',String(n));u.searchParams.set('textbookOriginalSource',sourceSha);win.history.pushState(Object.assign({},win.history.state||{},{depth:((win.history.state&&win.history.state.depth)||0)+1,textbookOriginal:{sourceSha:sourceSha,page:n,pushed:true}}),'',u);}
      dialog.addEventListener('cancel',function(e){e.preventDefault();closeOriginal();});dialog.addEventListener('close',function(){if(original===item)dismissOriginal(true);});
      dialog.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var nodes=Array.from(dialog.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')).filter(function(n){return n.getClientRects().length;});if(!nodes.length)return;var first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}});
      if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');close.focus();
      item.reader.mount(body,sourceEra.id,{sourceRevision:sourceRevision,initialPage:n,initialMode:'page',initialZoom:'fit',enhanced:false,compact:true,onPageChange:function(page,revision){if(original!==item||revision!==sourceSha)return;item.page=page;var u=new URL(win.location.href);u.searchParams.set('textbookOriginal',String(page));u.searchParams.set('textbookOriginalSource',revision);win.history.replaceState(Object.assign({},win.history.state||{},{textbookOriginal:{sourceSha:revision,page:page,pushed:item.pushed}}),'',u);}});
    }
    function handlePopState(event) {
      if(restoringRoute&&win.location.href===restoringRoute){restoringRoute=null;return true;}
      if(!shell||!host||!host.isConnected||!routeSnapshot)return false;
      if(baseLocation(win.location.href)!==routeSnapshot.href){dismissOriginal(false);return false;}
      var state=event&&event.state&&event.state.textbookOriginal;
      if(state&&state.sourceSha===sourceSha&&Number.isInteger(state.page)){if(!original||original.page!==state.page)openOriginal(state.page,null,false);return true;}
      if(original){dismissOriginal(true);return true;}return false;
    }
    function restoreSourceRoute() {
      if(!shell||!routeSnapshot||win.location.href===routeSnapshot.href)return;
      var from=win.history.state&&win.history.state.depth,to=routeSnapshot.state&&routeSnapshot.state.depth,delta=to-from;
      if(Number.isInteger(from)&&Number.isInteger(to)&&delta&&Math.abs(delta)<50){restoringRoute=routeSnapshot.href;win.history.go(delta);}
      else win.history.pushState(routeSnapshot.state,'',routeSnapshot.href);
    }
    function scopedEditions() { return !!doc.querySelector('meta[name="hanq-textbook-reviewed-eras"]'); }
    function editionValue() { return scopedEditions()&&sourceRevision==null?'':sourceSha||''; }
    function switchEdition(next) {
      if(sourceChanging||original){if(editionSelect)editionSelect.value=editionValue();return;}
      if(!sourceInfo(next))return;
      var g=generation,element=host,id=eraId,hooks=Object.assign({},callbacks||{},{sourceRevision:next,initialMode:mode});
      sourceChanging=true;if(editionSelect){editionSelect.value=editionValue();editionSelect.disabled=true;}
      Promise.resolve().then(function(){return child&&child.hasUnsaved&&child.hasUnsaved()?child.prepareLeave():null;}).then(function(){
        if(g!==generation||!host||session!==identity())return;
        if(callbacks&&callbacks.onSourceChange)callbacks.onSourceChange(next);
        return mount(element,id,hooks);
      }).catch(function(error){if(g===generation){sourceChanging=false;if(error&&error.code==='leave_cancelled'){if(editionSelect){editionSelect.disabled=false;editionSelect.value=editionValue();}return;}if(editionSelect){editionSelect.disabled=false;editionSelect.value=editionValue();}setStatus('현재 판본의 답안을 저장하지 못했어요. 판본을 바꾸지 않았습니다. 저장을 다시 확인해 주세요.');}});
    }
    function buildEditionControl() {
      if(sourceCatalog.singleEdition(doc))return;
      if(!sourceCatalog||!sourceCatalog.revisionRoutesReady||!sourceCatalog.revisionRoutesReady(doc,eraId))return;
      var box=node('div',null,'textbook-edition-controls'),label=node('label','교재 판본'),select=node('select');select.setAttribute('data-textbook-revision','');
      (sourceCatalog&&sourceCatalog.revisions||[]).forEach(function(item){var o=node('option',item.edition+(item.totalPdfPages===147?' · 개정 교재':' · 기존 교재'));o.value=scopedEditions()&&item.sha256===sourceInfo(null).sha256?'':item.sha256;select.appendChild(o);});
      if(!sourceInfo(sourceRevision)){var unknown=node('option','알 수 없는 판본');unknown.value=String(sourceRevision);unknown.disabled=true;select.appendChild(unknown);}
      select.value=sourceInfo(sourceRevision)?editionValue():String(sourceRevision);select.addEventListener('change',function(){switchEdition(select.value||null);});editionSelect=select;label.appendChild(select);box.appendChild(label);shell.insertBefore(box,status);
    }
    function validDataSource(data,selectedMode){if(!data)return false;if(selectedMode==='choices')return data.sourceSha256===sourceSha&&!!choices&&data.sourceQuizSha256===choices.sourceQuizSha256;return (selectedMode==='quiz'?data.source&&data.source.sha256:data.sourceSha256)===sourceSha;}

    function identity() {
      var state = api && typeof api.state === 'function' ? api.state() : null;
      return state && state.signedIn && !state.restoring && state.ownerId ? String(state.ownerId) + ':' + String(state.epoch) : '';
    }
    function node(tag, text, className) {
      var element = doc.createElement(tag);
      if (text != null) element.textContent = text;
      if (className) element.className = className;
      return element;
    }
    function cleanupChild() {
      if (child && typeof child.cleanup === 'function') child.cleanup();
      child = null;
      children.forEach(function (item) { item.cleanup(); }); children = [];
      if (imageObserver) imageObserver.disconnect(); imageObserver = null;
      deferredImages.forEach(function (tasks) { tasks.forEach(function (task) { task.cancel(); }); }); deferredImages.clear();
      if (panel) panel.replaceChildren();
    }
    function stop() {
      dismissOriginal(false);
      generation++; request++;
      if (unsubscribe) unsubscribe(); unsubscribe = null;
      cleanupChild();
      if (shell) shell.remove();
      host = null; shell = null; manifest = null; pages = []; quiz = null; choices = null; session = '';
      status = null; coverage = null; quizCount = null; panel = null; tabs = null; pageNumber=null; modeControls=null;originalAction=null;editionSelect=null; sourceChanging=false;
    }
    function valid(g, r) { return !!shell && generation === g && request === r && !!session && session === identity(); }
    function sessionError() { var e = new Error('session_changed'); e.code = 'session_changed'; return e; }
    function setStatus(text) { if (status) status.textContent = text; }
    function updateCoverage() {
      if (!coverage) return;
      var countLabel = !quiz ? '빈칸 0문항' : Number.isInteger(quizCount) ? '빈칸 ' + quizCount + '문항' : '빈칸 자료 1개 · 문항 수 확인 중';
      coverage.textContent = '이 범위의 학습 자료 · ' + countLabel + (choices ? ' · 4지선다 ' + choices.itemCount + '문항' : '');
    }
    function button(text, action) {
      var element = node('button', text); element.type = 'button'; element.addEventListener('click', action); return element;
    }
    function retryButton() {
      if (!shell || shell.querySelector('[data-semantic-retry]')) return;
      var retry = button('다시 시도', function () { if (host) mount(host, eraId, callbacks); });
      retry.setAttribute('data-semantic-retry', ''); shell.appendChild(retry);
    }
    function requestMode(next) {
      if(sourceChanging||original||next===mode)return;
      var g=generation;sourceChanging=true;
      Promise.resolve().then(function(){return child&&child.hasUnsaved&&child.hasUnsaved()?child.prepareLeave():null;}).then(function(){
        if(g!==generation||!host||session!==identity())return;
        sourceChanging=false;if(callbacks&&callbacks.onModeChange)callbacks.onModeChange(next);captureRoute();return changeMode(next);
      }).catch(function(error){if(g===generation){sourceChanging=false;if(error&&error.code==='leave_cancelled'){if(editionSelect){editionSelect.disabled=false;editionSelect.value=editionValue();}return;}setStatus('현재 답안을 저장하지 못했어요. 학습 방식을 바꾸지 않았습니다.');}});
    }
    function changeMode(next) {
      mode = next;
      if(originalAction){originalAction.hidden=next!=='quiz'&&next!=='choices';originalAction.disabled=true;}
      if(modeControls)modeControls.hidden=!!(callbacks&&callbacks.fixedMode&&next!=='quiz'&&next!=='choices');
      if (tabs) tabs.forEach(function (tab) { tab.setAttribute('aria-selected', String(tab.dataset.mode === mode)); });
      return loadSelection();
    }
    function loadSelection() {
      if (!manifest || !shell) return Promise.resolve();
      cleanupChild();
      var oldRetry = shell.querySelector('[data-semantic-retry]'); if (oldRetry) oldRetry.remove();
      var g = generation, r = ++request, selectedMode = mode, boundRevision=sourceRevision;
      if (!valid(g, r)) return Promise.resolve();
      if ((selectedMode === 'text'||selectedMode === 'exam') && !pages.length) { setStatus('이 시대의 원문 텍스트 학습은 준비 중이에요.'); return Promise.resolve(); }
      if (selectedMode === 'quiz' && !quiz) { setStatus('이 시대의 교재 원문 빈칸은 준비 중이에요.'); return Promise.resolve(); }
      if (selectedMode === 'choices' && !choices) { setStatus('선택한 판본에는 이 시대의 4지선다 연습이 제공되지 않아요. 교재 빈칸에서 원문 문제를 볼 수 있어요.'); return Promise.resolve(); }
      setStatus(selectedMode === 'text' ? '원문 텍스트를 불러오는 중…' : '교재 원문 빈칸을 불러오는 중…');
      if (selectedMode === 'text'||selectedMode === 'exam') return loadContinuous(g, r);
      var n = pageNumber, quizId = selectedMode === 'choices' ? choices && choices.id : quiz && quiz.id;
      return Promise.resolve().then(function () {
        if (!valid(g, r)) return null;
        return selectedMode === 'text' ? api.textbookSemanticPage(n,boundRevision) : selectedMode === 'choices' ? api.textbookSemanticChoices(quizId,boundRevision) : api.textbookSemanticQuiz(quizId,boundRevision);
      }).then(function (data) {
        if (!valid(g, r)) return null;
        if (!data || !validDataSource(data,selectedMode) || (selectedMode === 'text' ? data.pdfPage !== n : selectedMode === 'choices' ? data.eraId !== quizId : data.id !== quizId)) throw new Error('invalid_semantic_data');
        if(selectedMode==='quiz'&&data.source&&Array.isArray(data.source.pdfPages))pageNumber=data.source.pdfPages[0];if(selectedMode==='choices'&&data.items&&data.items[0]&&data.items[0].sourceQuestion)pageNumber=data.items[0].sourceQuestion.source.pdfPage;
        if (selectedMode === 'quiz' && Array.isArray(data.items)) { quizCount = data.items.length; updateCoverage(); }
        var renderer = selectedMode === 'text' ? (options.pageRenderer || root.HanqTextbookSemantic) : selectedMode === 'choices' ? (options.choiceRenderer || root.HanqTextbookFourChoice) : (options.quizRenderer || root.HanqTextbookSourceQuiz);
        if (!renderer || typeof renderer.render !== 'function') throw new Error('semantic_renderer_unavailable');
        child = renderer.render(panel, data, {
          ownerId: api.state().ownerId,
          manualSave: selectedMode==='quiz',
          sourceRevision:sourceSha,
          sourcePromptStyles:selectedMode==='quiz'&&manifest.sourcePromptStylesByQuiz?manifest.sourcePromptStylesByQuiz[quizId]:undefined,
          loadProgress: function () { if (!valid(g,r)) return Promise.reject(sessionError()); return api.textbookSourceWorkspace(quizId,boundRevision); },
          saveProgress: function (body) { if (!valid(g,r)) return Promise.reject(sessionError()); return api.saveTextbookSourceWorkspace(quizId,body,boundRevision); },
          isFigureAvailable: function (figure) {
            var entry = pages.find(function (p) { return p.pdfPage === n; });
            return !!(entry && entry.figuresAvailable !== false && Array.isArray(manifest.figures) && manifest.figures.some(function (f) { return f.id === figure.assetId; }));
          },
          resolveFigure: function (figure) {
            if (!valid(g, r)) return Promise.reject(sessionError());
            var id = figure && figure.assetId;
            if (typeof id !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(id) || typeof api.textbookSemanticFigure !== 'function') return Promise.reject(new Error('invalid_figure_id'));
            return Promise.resolve().then(function () {
              if (!valid(g, r)) throw sessionError();
              return api.textbookSemanticFigure(id,boundRevision);
            }).then(function (blob) {
              if (!valid(g, r)) throw sessionError();
              return blob;
            });
          }
        });
        return child && child.ready;
      }).then(function () {
        if (!valid(g, r)) return;
        if(originalAction)originalAction.disabled=false;
        if(selectedMode!=='text'&&selectedMode!=='exam')setStatus('');
      }).catch(function (error) {
        if (!valid(g, r)) return;
        cleanupChild(); setStatus(errorText(error)); retryButton();
      });
    }
    function sourceLabel(entry) {
      return entry.title || '학습 자료 ' + (pages.indexOf(entry) + 1);
    }
    function imageResolver(g, r, section) {
      var boundRevision=sourceRevision;
      return function (figure) {
        var id = figure && figure.assetId;
        if (!valid(g, r)) return Promise.reject(sessionError());
        if (typeof id !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(id) || typeof api.textbookSemanticFigure !== 'function') return Promise.reject(new Error('invalid_figure_id'));
        function fetchImage() {
          if (!valid(g, r)) throw sessionError();
          return Promise.resolve(api.textbookSemanticFigure(id,boundRevision)).then(function (blob) { if (!valid(g, r)) throw sessionError(); return blob; });
        }
        var Observer = options.IntersectionObserver || doc.defaultView && doc.defaultView.IntersectionObserver;
        var target = section.querySelector('[data-source-asset="' + id + '"]') || section;
        if (!Observer) return Promise.resolve().then(fetchImage);
        if (!imageObserver) imageObserver = new Observer(function (entries) {
          if (!valid(g,r)) return;
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var tasks = deferredImages.get(entry.target); deferredImages.delete(entry.target); if (imageObserver) imageObserver.unobserve(entry.target);
            (tasks || []).forEach(function (task) { task.load(); });
          });
        }, {rootMargin:'800px 0px'});
        return new Promise(function (resolve, reject) {
          var task = {load:function () { Promise.resolve().then(fetchImage).then(resolve, reject); }, cancel:function () { reject(sessionError()); }};
          var tasks = deferredImages.get(target) || []; tasks.push(task); deferredImages.set(target, tasks); imageObserver.observe(target);
        });
      };
    }
    function loadContinuous(g, r) {
      var renderer = options.pageRenderer || root.HanqTextbookSemantic;
      if (!renderer || typeof renderer.render !== 'function') { setStatus(errorText({})); retryButton(); return Promise.resolve(); }
      var sections = [], queue = 0, loaded = 0, failed = 0, boundRevision=sourceRevision;
      pages.forEach(function (entry) {
        var section = node('section', null, 'textbook-reader-page');
        section.id = panel.id + '-page-' + entry.pdfPage; section.setAttribute('data-reader-page', String(entry.pdfPage));
        var waiting = node('p', sourceLabel(entry) + ' · 본문을 불러오는 중…', 'textbook-reader-page-status');
        section.appendChild(waiting); panel.appendChild(section);
        sections.push({entry:entry, section:section});
      });
      function showPage(slot) {
        var entry = slot.entry, section = slot.section;
        return Promise.resolve().then(function () { if (!valid(g,r)) return null; return api.textbookSemanticPage(entry.pdfPage,boundRevision); }).then(function (data) {
          if (!valid(g,r)) return;
          if (!validDataSource(data,'text') || data.pdfPage !== entry.pdfPage) throw new Error('invalid_semantic_data');
          if (callbacks && callbacks.fixedMode) {
            if (!data.studySectionPartition || data.studySectionPartition.schemaVersion!=='hanq-study-sections/1') throw new Error('section_partition_unavailable');
            data=Object.assign({},data,{blocks:data.blocks.filter(function(b){return b.studySection===callbacks.studySection;})});
          }
          var view = renderer.render(section, data, {
            compactReviewStatus:true,blankRecall:!!(callbacks&&callbacks.blankRecall),
            isFigureAvailable:function (figure) { return entry.figuresAvailable !== false && Array.isArray(manifest.figures) && manifest.figures.some(function (f) { return f.id === figure.assetId; }); },
            resolveFigure:imageResolver(g,r,section)
          });
          children.push(view); loaded++;
          // All text is loaded automatically. Image promises deliberately do not
          // block later source pages; only nearby illustrations fetch Blobs.
          Promise.resolve(view.ready).catch(function () {});
        }).catch(function (error) {
          if (!valid(g,r)) return;
          if (error && (error.status === 401 || error.status === 403 || error.code === 'session_changed')) {
            request++; cleanupChild(); setStatus(errorText(error)); retryButton(); return;
          }
          failed++; section.replaceChildren(node('p', sourceLabel(entry) + ' · ' + errorText(error), 'textbook-reader-page-status'));
          var retry = button('이 구간 다시 불러오기', function () { retry.disabled = true; failed--; return showPage(slot); }); retry.setAttribute('data-page-retry', ''); section.appendChild(retry);
        }).then(function () {
          if (valid(g,r)) setStatus('교재 순서대로 이어 읽기 · ' + loaded + '/' + pages.length + '개 자료' + (failed ? ' · ' + failed + '구간 다시 불러오기 필요' : ''));
        });
      }
      function worker() {
        if (!valid(g,r) || queue >= sections.length) return Promise.resolve();
        return showPage(sections[queue++]).then(worker);
      }
      return Promise.all([worker(),worker(),worker()]).then(function () { if (valid(g,r) && !failed) setStatus(''); });
    }
    function buildControls() {
      var declaredCount = quiz && [quiz.itemCount, quiz.questionCount, quiz.count].find(function (count) { return Number.isInteger(count) && count >= 0; });
      quizCount = Number.isInteger(declaredCount) ? declaredCount : null;
      coverage = node('p', null, 'textbook-status textbook-semantic-coverage'); coverage.setAttribute('data-semantic-coverage', '');
      coverage.hidden = true;
      shell.insertBefore(coverage, status); updateCoverage();
      var controls = node('div', null, 'textbook-controls');modeControls=controls;
      var nav = node('div'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', '교재 학습 방식');
      nav.style.display = 'flex'; nav.style.flexWrap = 'wrap'; nav.style.gap = '8px'; nav.style.alignItems = 'start';
      var panelId = 'textbook-semantic-panel-' + (++sequence);
      var modes=callbacks&&callbacks.fixedMode?(mode==='quiz'||mode==='choices')&&(choices||mode==='choices')?[['quiz','교재 빈칸']].concat(choices?[['choices','4지선다 연습']]:[]):[]:[['text','원문 학습'],['quiz','교재 빈칸']].concat(choices?[['choices','4지선다 연습']]:[]);
      tabs = modes.map(function (value) {
        var tab = button(value[1], function () { requestMode(value[0]); });
        tab.dataset.mode = value[0]; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(mode === value[0])); tab.setAttribute('aria-controls', panelId);
        nav.appendChild(tab); return tab;
      });
      controls.appendChild(nav);
      shell.insertBefore(controls, status);
      panel.setAttribute('id', panelId); panel.setAttribute('role', 'tabpanel');
      if(callbacks&&callbacks.fixedMode)return;
      var supplements = node('nav', null, 'textbook-supplement-links'); supplements.setAttribute('aria-label', '교재 부록');
      (sourceCatalog.singleEdition(doc)?[['people','인물사'],['regions','지역사·지도']]:[['front','교재 활용법·목차'],['people','인물사'],['regions','지역사·지도'],['credits','그림 출처·발행 정보']]).forEach(function (item) {
        var link = node('a', item[1]); link.href = '#textbook/' + item[0];
        link.addEventListener('click', function (event) { if (callbacks && typeof callbacks.onEraChange === 'function') { event.preventDefault(); callbacks.onEraChange(item[0]); } });
        supplements.appendChild(link);
      });
      shell.appendChild(supplements);
    }
    function mount(element, selectedEra, hooks) {
      stop();
      if (!element) return Promise.resolve();
      host = element; eraId = selectedEra; callbacks = hooks || null; sourceRevision=sourceCatalog.currentRevision(doc,hooks&&hooks.sourceRevision!=null?hooks.sourceRevision:null);sourceSha=sourceInfo(sourceRevision)&&sourceInfo(sourceRevision).sha256;captureRoute();mode = hooks && ['quiz','exam','choices'].indexOf(hooks.initialMode)>=0 ? hooks.initialMode : 'text'; session = identity();
      shell = node('section', null, 'private-textbook textbook-semantic-library');
      var notesEdition = sourceSha === 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de' ? '81' : sourceSha === '35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442' ? '79' : null;
      if (notesEdition) { shell.classList.add('history-notes-design'); shell.setAttribute('data-history-edition', notesEdition); }
      status = node('p', null, 'textbook-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); shell.appendChild(status);
      panel = node('div', null, 'textbook-semantic-library-content'); shell.appendChild(panel); host.appendChild(shell);buildEditionControl();
      if (api && typeof api.onChange === 'function') unsubscribe = api.onChange(function () {
        if (host && session !== identity()) mount(host, eraId, callbacks);
      });
      if (!session) {
        setStatus('교재 원문 학습은 로그인한 회원이 볼 수 있어요.');
        var login = node('a', '로그인 화면으로'); login.href = '#account'; shell.appendChild(login);
        if(api&&api.hasSessionHint&&api.hasSessionHint()&&api.ensureSession){var mountGeneration=generation;setStatus('기존 로그인 세션을 복구하는 중…');return api.ensureSession().then(function(state){if(generation!==mountGeneration||host!==element)return;if(state.signedIn)return mount(element,selectedEra,hooks);setStatus('기존 로그인 세션을 복구하지 못했습니다. 다시 연결하거나 로그인해 주세요.');},function(){if(generation===mountGeneration)setStatus('로그인 서버에 연결하지 못했습니다. 다시 시도해 주세요.');});}
        return Promise.resolve();
      }
      if(!sourceSha){setStatus('알 수 없는 교재 판본입니다. 기존 교재를 명시적으로 선택해 주세요.');var legacy=button('기존 79회 교재 열기',function(){switchEdition(null);});legacy.setAttribute('data-legacy-textbook','');shell.appendChild(legacy);return Promise.resolve();}
      if(sourceRevision!=null&&(!sourceCatalog||!sourceCatalog.revisionRoutesReady||!sourceCatalog.revisionRoutesReady(doc,eraId,sourceRevision))){setStatus('선택한 판본은 서버 연결 검수가 끝난 뒤 열립니다.');if(sourceCatalog.singleEdition(doc))return Promise.resolve();var pendingLegacy=button('기존 79회 교재 열기',function(){switchEdition(null);});pendingLegacy.setAttribute('data-legacy-textbook','');shell.appendChild(pendingLegacy);return Promise.resolve();}
      var eraFor = options.eraFor || root.HanqPrivateTextbook && root.HanqPrivateTextbook.eraFor;
      era = eraFor && eraFor(eraId,sourceRevision);
      if (!era || !Number.isInteger(era.from) || !Number.isInteger(era.to) || !api || typeof api.textbookSemanticManifest !== 'function') {
        setStatus('텍스트 교재 연결을 준비 중이에요.'); return Promise.resolve();
      }
      setStatus('회원용 원문 학습 자료를 확인하는 중…');
      var g = generation, r = ++request;
      return Promise.resolve().then(function () {
        if (!valid(g, r)) return null;
        return api.textbookSemanticManifest(sourceRevision);
      }).then(function (data) {
        if (!valid(g, r)) return;
        if (!validManifest(data,sourceSha)) throw new Error('invalid_semantic_manifest');
        manifest = data;
        pages = data.pages.filter(function (page) { return page.pdfPage >= era.from && page.pdfPage <= era.to && (!(callbacks && callbacks.fixedMode && mode!=='quiz') || (page.studySectionCounts && page.studySectionCounts[callbacks.studySection]>0)); }).sort(function (a, b) { return a.pdfPage - b.pdfPage; });
        var quizEraId = era.id === 'samguk' ? 'ancient' : era.id;
        quiz = data.quizzes.find(function (entry) { return entry.eraId === quizEraId || entry.id === quizEraId; }) || null;
        choices = (data.fourChoices || []).find(function (entry) { return entry.eraId === era.id || entry.id === era.id; }) || null;
        buildControls();var ready=changeMode(mode === 'quiz' ? 'quiz' : mode==='choices'?'choices':mode==='exam' ? 'exam' : callbacks&&callbacks.fixedMode ? 'text' : pages.length || !quiz ? 'text' : 'quiz');var u=new URL(win.location.href),originalPage=Number(u.searchParams.get('textbookOriginal'));if(u.searchParams.get('textbookOriginalSource')===sourceSha&&Number.isInteger(originalPage)&&originalPage>0)Promise.resolve(ready).then(function(){if(valid(g,request))openOriginal(originalPage,null,false);});return ready;
      }).catch(function (error) {
        if (!valid(g, r)) return;
        setStatus(errorText(error)); retryButton();if(sourceRevision!=null&&!sourceCatalog.singleEdition(doc)){var fallback=button('기존 79회 교재 열기',function(){switchEdition(null);});fallback.setAttribute('data-legacy-textbook','');shell.appendChild(fallback);}
      });
    }
    return { handlePopState:handlePopState, restoreSourceRoute:restoreSourceRoute, mount: mount, stop: stop, hasUnsaved: function(){return !!(child&&child.hasUnsaved&&child.hasUnsaved());}, prepareLeave: function(){return child&&child.prepareLeave?child.prepareLeave():Promise.resolve();} };
  }
  var exported = { create: create, validManifest: validManifest, errorText: errorText };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (root.document) {
    var library = create(); exported.mount = library.mount; exported.stop = library.stop; exported.handlePopState=library.handlePopState;exported.restoreSourceRoute=library.restoreSourceRoute;exported.hasUnsaved=library.hasUnsaved; exported.prepareLeave=library.prepareLeave;
    root.HanqSemanticLibrary = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
