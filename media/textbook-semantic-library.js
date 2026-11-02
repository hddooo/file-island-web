/* Authenticated, text-first textbook coordinator. No textbook data or local
 * persistence. Backend authorization is required on every semantic endpoint.
 * This component owns only its appended section, preserving host footers. */
(function (root) {
  'use strict';
  var sequence = 0;
  function errorText(error) {
    if (error && (error.status === 401 || error.code === 'session_changed')) return '로그인을 확인해 주세요. 교재는 로그인한 회원 계정으로 볼 수 있어요.';
    if (error && error.status === 403) return '서버에서 교재 접근을 허용하지 않았어요. 로그인 상태와 회원 권한을 확인해 주세요.';
    if (error && (error.status === 503 || error.code === 'textbook_not_configured' || error.code === 'textbook_semantic_not_configured')) return '회원용 텍스트 교재 저장소가 아직 설정되지 않았어요.';
    if (error && error.status === 404) return '요청한 원문 학습 자료가 아직 준비되지 않았어요.';
    if (error && error.code === 'timeout') return '원문 학습 자료를 불러오는 시간이 길어졌어요. 다시 시도해 주세요.';
    if (error && error.code === 'disabled') return '텍스트 교재를 불러올 서버가 연결되지 않았어요.';
    return '원문 학습 자료를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.';
  }
  function validManifest(manifest) {
    if (!manifest || manifest.schemaVersion !== 'hanq-semantic-manifest/1' || !Array.isArray(manifest.pages) || !Array.isArray(manifest.quizzes)) return false;
    if (manifest.fourChoices !== undefined && (!Array.isArray(manifest.fourChoices) || manifest.fourChoices.length > 8 || !manifest.fourChoices.every(function (q) { return q && /^[a-z]+$/.test(q.id) && Number.isInteger(q.itemCount) && q.itemCount > 0 && q.itemCount <= 200; }) || new Set(manifest.fourChoices.map(function (q) { return q.id; })).size !== manifest.fourChoices.length)) return false;
    var pages = new Set(), quizzes = new Set();
    return manifest.pages.every(function (page) {
      if (!page || !Number.isInteger(page.pdfPage) || page.pdfPage < 1 || page.pdfPage > 144 || pages.has(page.pdfPage)) return false;
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
      generation++; request++;
      if (unsubscribe) unsubscribe(); unsubscribe = null;
      cleanupChild();
      if (shell) shell.remove();
      host = null; shell = null; manifest = null; pages = []; quiz = null; choices = null; session = '';
      status = null; coverage = null; quizCount = null; panel = null; tabs = null;
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
    function changeMode(next) {
      mode = next;
      if (tabs) tabs.forEach(function (tab) { tab.setAttribute('aria-selected', String(tab.dataset.mode === mode)); });
      return loadSelection();
    }
    function loadSelection() {
      if (!manifest || !shell) return Promise.resolve();
      cleanupChild();
      var oldRetry = shell.querySelector('[data-semantic-retry]'); if (oldRetry) oldRetry.remove();
      var g = generation, r = ++request, selectedMode = mode;
      if (!valid(g, r)) return Promise.resolve();
      if ((selectedMode === 'text'||selectedMode === 'exam') && !pages.length) { setStatus('이 시대의 원문 텍스트 학습은 준비 중이에요.'); return Promise.resolve(); }
      if (selectedMode === 'quiz' && !quiz) { setStatus('이 시대의 교재 원문 빈칸은 준비 중이에요.'); return Promise.resolve(); }
      if (selectedMode === 'choices' && !choices) { setStatus('이 시대의 4지선다 연습은 준비 중이에요. 교재 빈칸에서 원문 문제를 볼 수 있어요.'); return Promise.resolve(); }
      setStatus(selectedMode === 'text' ? '원문 텍스트를 불러오는 중…' : '교재 원문 빈칸을 불러오는 중…');
      if (selectedMode === 'text'||selectedMode === 'exam') return loadContinuous(g, r);
      var n = pageNumber, quizId = selectedMode === 'choices' ? choices && choices.id : quiz && quiz.id;
      return Promise.resolve().then(function () {
        if (!valid(g, r)) return null;
        return selectedMode === 'text' ? api.textbookSemanticPage(n) : selectedMode === 'choices' ? api.textbookSemanticChoices(quizId) : api.textbookSemanticQuiz(quizId);
      }).then(function (data) {
        if (!valid(g, r)) return null;
        if (!data || (selectedMode === 'text' ? data.pdfPage !== n : selectedMode === 'choices' ? data.eraId !== quizId : data.id !== quizId)) throw new Error('invalid_semantic_data');
        if (selectedMode === 'quiz' && Array.isArray(data.items)) { quizCount = data.items.length; updateCoverage(); }
        var renderer = selectedMode === 'text' ? (options.pageRenderer || root.HanqTextbookSemantic) : selectedMode === 'choices' ? (options.choiceRenderer || root.HanqTextbookFourChoice) : (options.quizRenderer || root.HanqTextbookSourceQuiz);
        if (!renderer || typeof renderer.render !== 'function') throw new Error('semantic_renderer_unavailable');
        child = renderer.render(panel, data, {
          ownerId: api.state().ownerId,
          loadProgress: function () { if (!valid(g,r)) return Promise.reject(sessionError()); return api.textbookSourceWorkspace(quizId); },
          saveProgress: function (body) { if (!valid(g,r)) return Promise.reject(sessionError()); return api.saveTextbookSourceWorkspace(quizId,body); },
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
              return api.textbookSemanticFigure(id);
            }).then(function (blob) {
              if (!valid(g, r)) throw sessionError();
              return blob;
            });
          }
        });
        return child && child.ready;
      }).then(function () {
        if (!valid(g, r)) return;
        setStatus(selectedMode === 'text' ? '원문 텍스트 학습' : selectedMode === 'choices' ? '교재 기반 4지선다 연습 · 검수된 일부 문항' : '교재 원문 빈칸 · 원문 정답과 함께 학습');
      }).catch(function (error) {
        if (!valid(g, r)) return;
        cleanupChild(); setStatus(errorText(error)); retryButton();
      });
    }
    function sourceLabel(entry) {
      return entry.title || '학습 자료 ' + (pages.indexOf(entry) + 1);
    }
    function imageResolver(g, r, section) {
      return function (figure) {
        var id = figure && figure.assetId;
        if (!valid(g, r)) return Promise.reject(sessionError());
        if (typeof id !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(id) || typeof api.textbookSemanticFigure !== 'function') return Promise.reject(new Error('invalid_figure_id'));
        function fetchImage() {
          if (!valid(g, r)) throw sessionError();
          return Promise.resolve(api.textbookSemanticFigure(id)).then(function (blob) { if (!valid(g, r)) throw sessionError(); return blob; });
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
      var sections = [], queue = 0, loaded = 0, failed = 0;
      pages.forEach(function (entry) {
        var section = node('section', null, 'textbook-reader-page');
        section.id = panel.id + '-page-' + entry.pdfPage; section.setAttribute('data-reader-page', String(entry.pdfPage));
        var waiting = node('p', sourceLabel(entry) + ' · 본문을 불러오는 중…', 'textbook-reader-page-status');
        section.appendChild(waiting); panel.appendChild(section);
        sections.push({entry:entry, section:section});
      });
      function showPage(slot) {
        var entry = slot.entry, section = slot.section;
        return Promise.resolve().then(function () { if (!valid(g,r)) return null; return api.textbookSemanticPage(entry.pdfPage); }).then(function (data) {
          if (!valid(g,r)) return;
          if (!data || data.pdfPage !== entry.pdfPage) throw new Error('invalid_semantic_data');
          if (callbacks && callbacks.fixedMode) {
            if (!data.studySectionPartition || data.studySectionPartition.schemaVersion!=='hanq-study-sections/1') throw new Error('section_partition_unavailable');
            data=Object.assign({},data,{blocks:data.blocks.filter(function(b){return b.studySection===callbacks.studySection;})});
          }
          var view = renderer.render(section, data, {
            compactReviewStatus:true,
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
      return Promise.all([worker(),worker(),worker()]).then(function () { if (valid(g,r) && !failed) setStatus('교재 순서대로 이어 읽기 · 전체 ' + loaded + '개 자료'); });
    }
    function buildControls() {
      var declaredCount = quiz && [quiz.itemCount, quiz.questionCount, quiz.count].find(function (count) { return Number.isInteger(count) && count >= 0; });
      quizCount = Number.isInteger(declaredCount) ? declaredCount : null;
      coverage = node('p', null, 'textbook-status textbook-semantic-coverage'); coverage.setAttribute('data-semantic-coverage', '');
      shell.insertBefore(coverage, status); updateCoverage();
      var controls = node('div', null, 'textbook-controls');
      var nav = node('div'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', '교재 학습 방식');
      nav.style.display = 'flex'; nav.style.flexWrap = 'wrap'; nav.style.gap = '8px'; nav.style.alignItems = 'start';
      var panelId = 'textbook-semantic-panel-' + (++sequence);
      tabs = (callbacks && callbacks.fixedMode ? [] : [['text', '원문 학습'], ['quiz', '교재 빈칸']].concat(choices ? [['choices', '4지선다 연습']] : [])).map(function (value) {
        var tab = button(value[1], function () { changeMode(value[0]); });
        tab.dataset.mode = value[0]; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(mode === value[0])); tab.setAttribute('aria-controls', panelId);
        nav.appendChild(tab); return tab;
      });
      controls.appendChild(nav);
      if (!(callbacks && callbacks.fixedMode)) shell.insertBefore(controls, status);
      panel.setAttribute('id', panelId); panel.setAttribute('role', 'tabpanel');
      var supplements = node('nav', null, 'textbook-supplement-links'); supplements.setAttribute('aria-label', '교재 부록');
      [['front','교재 활용법·목차'],['people','인물사'],['regions','지역사·지도'],['credits','그림 출처·발행 정보']].forEach(function (item) {
        var link = node('a', item[1]); link.href = '#textbook/' + item[0];
        link.addEventListener('click', function (event) { if (callbacks && typeof callbacks.onEraChange === 'function') { event.preventDefault(); callbacks.onEraChange(item[0]); } });
        supplements.appendChild(link);
      });
      shell.appendChild(supplements);
    }
    function mount(element, selectedEra, hooks) {
      stop();
      if (!element) return Promise.resolve();
      host = element; eraId = selectedEra; callbacks = hooks || null; mode = hooks && hooks.initialMode === 'quiz' ? 'quiz' : hooks && hooks.initialMode === 'exam' ? 'exam' : 'text'; session = identity();
      shell = node('section', null, 'private-textbook textbook-semantic-library');
      status = node('p', null, 'textbook-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); shell.appendChild(status);
      panel = node('div', null, 'textbook-semantic-library-content'); shell.appendChild(panel); host.appendChild(shell);
      if (api && typeof api.onChange === 'function') unsubscribe = api.onChange(function () {
        if (host && session !== identity()) mount(host, eraId, callbacks);
      });
      if (!session) {
        setStatus('교재 원문 학습은 로그인한 회원이 볼 수 있어요.');
        var login = node('a', '로그인 화면으로'); login.href = '#account'; shell.appendChild(login);
        if(api&&api.hasSessionHint&&api.hasSessionHint()&&api.ensureSession){var mountGeneration=generation;setStatus('기존 로그인 세션을 복구하는 중…');return api.ensureSession().then(function(state){if(generation!==mountGeneration||host!==element)return;if(state.signedIn)return mount(element,selectedEra,hooks);setStatus('기존 로그인 세션을 복구하지 못했습니다. 다시 연결하거나 로그인해 주세요.');},function(){if(generation===mountGeneration)setStatus('로그인 서버에 연결하지 못했습니다. 다시 시도해 주세요.');});}
        return Promise.resolve();
      }
      var eraFor = options.eraFor || root.HanqPrivateTextbook && root.HanqPrivateTextbook.eraFor;
      era = eraFor && eraFor(eraId);
      if (!era || !Number.isInteger(era.from) || !Number.isInteger(era.to) || !api || typeof api.textbookSemanticManifest !== 'function') {
        setStatus('텍스트 교재 연결을 준비 중이에요.'); return Promise.resolve();
      }
      setStatus('회원용 원문 학습 자료를 확인하는 중…');
      var g = generation, r = ++request;
      return Promise.resolve().then(function () {
        if (!valid(g, r)) return null;
        return api.textbookSemanticManifest();
      }).then(function (data) {
        if (!valid(g, r)) return;
        if (!validManifest(data)) throw new Error('invalid_semantic_manifest');
        manifest = data;
        pages = data.pages.filter(function (page) { return page.pdfPage >= era.from && page.pdfPage <= era.to && (!(callbacks && callbacks.fixedMode && mode!=='quiz') || (page.studySectionCounts && page.studySectionCounts[callbacks.studySection]>0)); }).sort(function (a, b) { return a.pdfPage - b.pdfPage; });
        var quizEraId = era.id === 'samguk' ? 'ancient' : era.id;
        quiz = data.quizzes.find(function (entry) { return entry.eraId === quizEraId || entry.id === quizEraId; }) || null;
        choices = (data.fourChoices || []).find(function (entry) { return entry.eraId === era.id || entry.id === era.id; }) || null;
        buildControls(); return changeMode(mode === 'quiz' ? 'quiz' : mode==='exam' ? 'exam' : callbacks&&callbacks.fixedMode ? 'text' : pages.length || !quiz ? 'text' : 'quiz');
      }).catch(function (error) {
        if (!valid(g, r)) return;
        setStatus(errorText(error)); retryButton();
      });
    }
    return { mount: mount, stop: stop, hasUnsaved: function(){return !!(child&&child.hasUnsaved&&child.hasUnsaved());}, prepareLeave: function(){return child&&child.prepareLeave?child.prepareLeave():Promise.resolve();} };
  }
  var exported = { create: create, validManifest: validManifest, errorText: errorText };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (root.document) {
    var library = create(); exported.mount = library.mount; exported.stop = library.stop; exported.hasUnsaved=library.hasUnsaved; exported.prepareLeave=library.prepareLeave;
    root.HanqSemanticLibrary = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
