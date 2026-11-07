/* HanQ 계정 화면(#account) — 로그인·회원가입·내 프로필·서버 풀이 기록·이 기기 기록 가져오기·프리미엄(1개월 5,000원)·
 * 서버 오답노트와 프리미엄 오답 다시 풀기·오답 모의고사. window.HanqAccountUI
 *
 *  - 배포본은 서버 연결(window.HanqApi, https://hanq-api.onrender.com)이 켜져 있다. meta를 비운 오프라인 모드에서는 계정 기능 없이
 *    ‘이 기기에만 저장’ 안내만 보인다. 로그인한 퀴즈 제출은 서버에 저장하고, 게스트 퀴즈와 실전 모의는 이 기기에 저장한다.
 *  - 프리미엄 화면 표시는 서버가 알려 준 상태로만 그린다. 실제 허용·거절은 서버가 한다(버튼을 켜도 서버가 거절하면 그 말을 보여 줌).
 *  - 서버 오답 다시 풀기·오답 모의고사는 서버가 문제를 고르고, 답을 저장하고, 채점한다. 이 화면은 서버의 결과를 그리기만 한다
 *    (이 기기의 오답 모의고사 컨트롤러 run-controller.js는 쓰지 않는다).
 *  - 이 기기의 학습 기록(localStorage 'hanq:')은 읽기만 한다. 가져오기는 사용자가 확인란을 고르고 누를 때만, 500건씩.
 *  - 실제 결제는 아직 없다. 서버가 개발용 테스트 결제를 켠 경우에만 ‘개발용 테스트 결제(실제 결제 아님)’ 버튼이 보인다.
 */
(function (root) {
  'use strict';
  var SYM = ['', '①', '②', '③', '④', '⑤'];
  var ui = { container: null, ctx: null, tok: 0, authMode: 'signin', notice: '', histCursor: null, hist: [], replaySubs: {}, replayPos: {}, replaySel: {}, runPos: {}, runConfirm: false, timer: null, offset: 0, ownerId: null, watching: false };

  function A() { return root.HanqApi || null; }

  /* 화면 상태는 계정(owner)마다 따로: 계정이 바뀌면(로그아웃 · 다른 탭의 다른 계정 로그인) 이전 계정의 기록 목록·풀던 위치·
     고른 답·제출 번호를 모두 버린다. 다시 풀기·모의고사의 위치만 이 탭의 sessionStorage에 계정별로 남긴다(토큰·답은 저장하지 않음). */
  var POS_KEY = 'hanqacct:pos:';
  function sstore() { try { return root.sessionStorage || null; } catch (e) { return null; } }
  function savePos() {
    var s = sstore(); if (!s || !ui.ownerId) return;
    try { s.setItem(POS_KEY + ui.ownerId, JSON.stringify({ replay: ui.replayPos, run: ui.runPos })); } catch (e) {}
  }
  function loadPos() {
    var s = sstore(), out = { replay: {}, run: {} }; if (!s || !ui.ownerId) return out;
    try {
      var d = JSON.parse(s.getItem(POS_KEY + ui.ownerId) || 'null');
      ['replay', 'run'].forEach(function (k) { var m = d && d[k]; if (m && typeof m === 'object') Object.keys(m).forEach(function (id) { if (/^[0-9a-f-]{36}$/.test(id) && Number.isInteger(m[id]) && m[id] >= 0 && m[id] < 200) out[k][id] = m[id]; }); });
    } catch (e) {}
    return out;
  }
  function resetOwnerState(ownerId) {
    ui.partPending=false;ui.runFlight = null; // 이전 계정의 답 저장 응답은 새 계정 화면·커서를 건드리지 못한다
    clearPet();
    ui.ownerId = ownerId || null;ui.clock=null;ui.expiredNotice=null;
    ui.hist = []; ui.histCursor = null; ui.replaySubs = {}; ui.replaySel = {}; ui.runConfirm = false;
    var p = loadPos(); ui.replayPos = p.replay; ui.runPos = p.run;
  }
  function watchOwner() {
    var api = A(); if (ui.watching || !api || typeof api.onChange !== 'function') return;
    ui.watching = true;
    if (root.HanqAccountSync && typeof root.HanqAccountSync.onChange === 'function') root.HanqAccountSync.onChange(function () { updateSync(); var x=root.HanqAccountSync.state();if(x.phase==='done'&&x.imported>0&&x.ownerId===ui.ownerId&&ui.view==='main'&&root.HanqMyRecords&&root.HanqMyRecords.refresh)root.HanqMyRecords.refresh(); });
    api.onChange(function (st) {
      var id = st && st.signedIn && st.user ? st.user.id : null;
      if(id===ui.ownerId&&st.premium&&!st.premium.active&&/^(run|replay)\//.test(ui.view||'')&&ui.container&&ui.container.isConnected){ui.tok++;stopTimer();paint('<p role="status">이용권을 확인해 주세요. 기록은 보존돼요.</p>');ui.ctx.go('notes');return;}
      if(st.premium&&!st.premium.active&&ui.container){var paidHistory=ui.container.querySelector('.ac-study-history');if(paidHistory)paidHistory.remove();}
      if (id === ui.ownerId) {
        var C = root.HanqCharacters, host = $('#acCharacter');
        if ((ui.view === 'main'||ui.view==='toeic-records') && st.profileStatus === 'ready' && C && C.confirmed(st) && host && host.isConnected) {
          var points = fmtPoints(st.growth.points),evolutionKey=JSON.stringify(st.partners||st.partnerEvolution||null);
          if (host.dataset.growthPoints !== points||host.dataset.evolutionKey!==evolutionKey) {
            host.dataset.growthPoints = points;host.dataset.evolutionKey=evolutionKey;
            var restoreFocus = host.contains(root.document.activeElement);
            C.mount(host, st); on('#acCharacter .ac-pet', 'click', petGrowth); on('#acCharacter .ac-evolve','click',evolvePet); applyPetSay();
            if (restoreFocus) focusFirst('#acCharacter .ac-pet');
          }
        }
        return;
      }
      var hadOwner = !!ui.ownerId;
      resetOwnerState(id);
      // 이전 계정이 있던 화면이 지금 보이면, 그 계정의 개인 내용(이메일·기록·오답·풀던 문제)을 곧바로 지우고 지금 계정으로 다시 그린다.
      // (처음 로그인처럼 이전 계정이 없을 때는 그 동작을 한 쪽에서 이미 다시 그리므로 여기서 또 그리지 않는다)
      if (!hadOwner || !ui.ctx || !ui.container || !ui.container.isConnected) return;
      stopTimer();
      var msg = id ? MSG.owner_switched : '로그인이 끝났어요. 이전 계정의 화면 내용은 지웠어요. 이 기기의 학습 기록은 그대로예요.';
      if (ui.view !== 'main' || ui.container.querySelector('.ac-replay,.ac-run')) { ui.notice = msg; ui.ctx.go('notes'); return; }
      ui.tok++; // 이전 계정으로 불러오던 응답은 그리지 않음
      paint('<p class="hp-notice ac-notice" role="status">' + esc(msg) + '</p>');
      ui.notice = msg;
      // 다시 그리는 동안 me() 등이 onChange를 다시 부르지만 계정이 같으므로 위에서 바로 돌아간다(반복 없음)
      renderMain();
    });
  }
  function R() { return root.HanqQuizReview || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function qtext(s) { return esc(s).replace(/\n/g, '<br>'); }
  function kst(iso) {
    var t = Date.parse(iso); if (!Number.isFinite(t)) return '';
    var d = new Date(t + 9 * 3600 * 1000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getUTCFullYear() + '.' + p(d.getUTCMonth() + 1) + '.' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
  }
  function clock(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(x).padStart(2, '0'); }

  var MSG = {
    daily_study_limit: '오늘의 오답노트 도전 5회를 모두 사용했어요. 한국 시간 자정 이후 다시 도전할 수 있어요. 완료 기록은 계속 볼 수 있어요.',
    network: '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.',
    timeout: '서버가 제때 답하지 않았어요. 잠시 뒤 다시 시도해 주세요.',
    disabled: '서버 연결이 꺼져 있어요.',
    refresh_outcome_uncertain: '로그인 복원 결과를 확인하지 못했어요. 안전하게 다시 로그인해 주세요.',
    remember_unavailable: '지금은 서버에서 로그인 유지를 지원하지 않아요. 일반 로그인으로 다시 시도해 주세요.',
    session_coordination_unavailable: '이 브라우저에서는 안전한 로그인 유지를 지원하지 않아요. 일반 로그인으로 다시 시도해 주세요.',
    invalid_credentials: '이메일 또는 비밀번호가 맞지 않아요.',
    email_taken: '이미 가입한 이메일이에요. 로그인해 주세요.',
    weak_password: '비밀번호는 10자 이상 128자 이하로, 너무 단순하지 않게 정해 주세요(이메일과 같으면 안 돼요).',
    invalid_email: '이메일 주소를 확인해 주세요.',
    invalid_display_name: '이름은 1–40자로, < > 같은 기호 없이 써 주세요.',
    too_many_failed_signins: '로그인 실패가 많아 이 계정의 로그인을 잠시 막았어요. 15분쯤 뒤 다시 시도해 주세요.',
    rate_limited: '요청이 너무 많아요. 1분쯤 뒤 다시 시도해 주세요.',
    csrf_rejected: '이 주소에서는 서버에 로그인할 수 없어요(서버의 허용 주소 설정이 필요해요).',
    unauthorized: '로그인이 필요해요.', invalid_token: '로그인이 끝났어요. 다시 로그인해 주세요.', invalid_refresh: '로그인이 끝났어요. 다시 로그인해 주세요.',
    refresh_reused: '보안을 위해 모든 기기의 로그인을 끝냈어요. 다시 로그인해 주세요.',
    wrong_current_password: '지금 비밀번호가 맞지 않아요.',
    premium_required: '프리미엄 이용권(30일 5,000원)이 있어야 해요. 서버가 이용권을 확인하지 못했어요.',
    payment_provider_unavailable: '온라인 결제는 아직 준비 중이에요. 주문을 만들지 않았고 결제도 되지 않았어요.',
    payment_declined: '결제가 거절됐어요. 이용권은 주어지지 않았어요.',
    payment_mismatch: '결제 결과가 주문(금액·통화·주문 번호)과 맞지 않아 이용권을 주지 않았어요.',
    payment_reused: '이미 다른 주문에 쓴 결제예요. 이용권을 주지 않았어요.',
    nickname_taken:'이미 사용하는 닉네임이에요. 다른 닉네임을 골라 주세요.',
    chapter_locked:'출석하면 순서대로 시대가 열려요.',
    order_closed: '이미 끝난 주문이에요. 새로 구매해 주세요.',
    not_enough_wrongs: '서로 다른 오답(지금 내용 기준)이 10문제 이상이어야 오답 모의고사를 만들 수 있어요.',
    nothing_to_replay: '서버에 다시 풀 오답이 없어요.',
    import_key_owned_by_another_account: '이 브라우저의 기록은 이미 다른 계정으로 가져갔어요. 기록이 섞이지 않도록 이 계정에는 가져오지 않아요.',
    import_cap_reached: '한 브라우저에서 가져올 수 있는 기록(5,000건)을 다 썼어요.',
    run_expired: '시간이 끝나 마감 전에 저장된 답으로 채점했어요.', run_final: '이미 채점한 모의고사예요.', run_not_started: '먼저 시작해 주세요.',
    already_answered: '이미 답한 문제예요.', submission_conflict: '같은 제출 번호로 다른 답을 보냈어요. 화면을 새로 고쳐 주세요.',
    invalid_option: '이 문제에 없는 보기예요.', not_found: '찾지 못했어요(내 기록만 열 수 있어요).',
    'no-import-key': '이 브라우저는 저장 공간을 쓸 수 없어 가져오기 키를 안전하게 보관할 수 없어요. 다른 계정과 기록이 섞이지 않도록 가져오기를 하지 않아요.',
    session_changed: '다른 탭에서 다른 계정으로 로그인해 이 화면의 요청을 보내지 않았어요. 이전 계정의 화면 내용은 지웠어요.',
    owner_switched: '다른 탭에서 다른 계정으로 로그인해 로그인한 계정이 바뀌었어요. 이전 계정의 화면 내용은 지우고 지금 계정으로 다시 보여 줘요.',
    password_changed: '그 사이에 비밀번호가 바뀌었어요. 다시 로그인해 주세요.',
    internal_error: '서버 오류로 요청을 처리하지 못했어요. 다시 시도해 주세요.',
    invalid_response: '서버 응답이 올바르지 않아 반영하지 않았어요. 잠시 뒤 다시 시도해 주세요.',
    storage: '이 브라우저 저장 공간을 쓸 수 없어요.',
    schema_not_ready: '서버 저장소 설정이 완료되지 않아 요청을 처리할 수 없어요. 운영자 확인이 필요해요.',
    profile_incomplete: '서버가 성장 정보 일부를 보내지 않았어요. 잠시 뒤 다시 확인해 주세요.',
    test_premium_disabled: '지금은 테스트용 무료 전환을 쓸 수 없어요. 결제는 되지 않았어요.'
  };
  function errMsg(e) { var c = e && e.code; return MSG[c] || ('요청을 처리하지 못했어요' + (c ? ' (' + esc(c) + ')' : '') + '.'); }
  var SKIP = { 'unknown-question-or-version': '지금 서버에 없는 문제이거나 예전 내용 버전', 'mode-mismatch': '문제 종류가 맞지 않음', 'unknown-option': '지금 문제에 없는 보기', 'unanswered-record': '답하지 않은 모의고사 문항', 'duplicate-in-request': '같은 기록이 두 번', 'conflicts-with-earlier-import': '예전에 가져온 기록과 맞지 않음' };

  function title(kind, id) {
    if (kind === 'mock') { var m = /^exam-(\d\d)-(\d\d)$/.exec(id || ''); return m ? '기출 제' + m[1] + '회 ' + Number(m[2]) + '번' : '기출'; }
    var QC = root.HANQ_QUIZ_CATALOG, it = QC && QC.questions && Object.prototype.hasOwnProperty.call(QC.questions, id) ? QC.questions[id] : null;
    var t = it ? String(it.q || '').replace(/\s+/g, ' ') : '';
    return '퀴즈 · ' + (t ? (t.length > 40 ? t.slice(0, 40) + '…' : t) : '(지금 앱에 없는 문제)');
  }
  function eraName(id) { var c = ui.ctx && typeof ui.ctx.eraTitle === 'function' ? ui.ctx.eraTitle(id) : ''; return c || ''; }

  /* ---------- 공용 그리기 ---------- */
  function paint(html) {
    if (!ui.container) return;
    closeGrowth(false);
    if(root.HanqInquiries)root.HanqInquiries.stop();
    if(root.HanqImageViewer)root.HanqImageViewer.close(true);
    if(root.HanqCharacters&&root.HanqCharacters.stop)root.HanqCharacters.stop();
    ui.container.innerHTML=html;ui.container.classList.toggle('ac-profile-root',!!ui.container.querySelector('.ac-me'));
    if(root.HanqWorldScene)root.HanqWorldScene.sync();
    [].slice.call(ui.container.querySelectorAll('.ac-q .mock-image')).forEach(function(img){
      if(!root.HanqImageViewer)return;
      img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-haspopup','dialog');img.setAttribute('aria-label',img.alt+' · 크게 보기');
      var enlarge=function(){var host=img.closest('.ac-q');var images=[].slice.call(host.querySelectorAll('.mock-image')).map(function(x){return {src:x.getAttribute('src'),alt:x.alt,common:x.classList.contains('mock-common-image')};});root.HanqImageViewer.open(images,img);};
      img.addEventListener('click',enlarge);img.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();enlarge();}});
    });
  }
  /* 늦게 온 응답이 이미 떠난 화면을 다시 그리지 않게: 그 응답을 기다리던 화면(view)이 지금도 열려 있을 때만 */
  function stillOn(view) { return ui.view === view && !!ui.container && ui.container.isConnected; }
  function busy(on) { if (ui.container) ui.container.setAttribute('aria-busy', on ? 'true' : 'false'); }
  function $(s) { return ui.container ? ui.container.querySelector(s) : null; }
  function on(sel, ev, fn) { var el = $(sel); if (el) el.addEventListener(ev, fn); return el; }
  function stopTimer() { if (ui.timer) { clearInterval(ui.timer); ui.timer = null; } }
  function focusFirst(sel) { var el = $(sel); if (!el) return false; if (!el.hasAttribute('tabindex') && (/^H\d$/.test(el.tagName) || /^(P|DIV)$/.test(el.tagName))) el.setAttribute('tabindex', '-1'); try { el.focus({ preventScroll: true }); } catch (e) {} return true; }
  function connLine(st) {
    if (!st.enabled) return '';
    if (st.status === 'offline') return '<p class="hp-notice ac-conn is-off" role="status">서버에 연결하지 못했어요.</p>';
    return '<p class="ac-conn is-on">서버 연결됨' + (st.signedIn && st.user ? ' · ' + esc(st.user.email) + ' 로그인' : ' · 로그인 전') + '</p>';
  }

  function questionHtml(it, sel, result, idPrefix) {
    var p = it.item || {}, R0 = R(), order = it.optionOrder || (p.options || []).map(function (o) { return o.id; });
    var byId = {}; (p.options || []).forEach(function (o) { byId[o.id] = o; });
    var graded = !!result, gid = idPrefix + 'Q';
    var mark = function (id) { return graded ? (id === result.correctOptionId ? ' is-correct' : (id === result.optionId ? ' is-wrong' : '')) : ''; };
    if (it.kind === 'mock') {
      var imgs = (p.commonImage ? '<figure class="mock-common"><figcaption>공통 자료 · ' + esc(p.commonLabel || '') + '</figcaption><div class="mock-image-wrap"><img class="mock-image mock-common-image" src="' + esc(p.commonImage) + '" alt="제' + esc(p.exam) + '회 공통 자료" loading="lazy"></div></figure>' : '') +
        '<div class="mock-image-wrap"><img class="mock-image" src="' + esc(p.image) + '" alt="제' + esc(p.exam) + '회 ' + esc(p.number) + '번 문제 그림" loading="lazy"></div>';
      return '<article class="mock-question ac-q" data-question="' + esc(it.questionId || p.id) + '" data-version="' + esc(it.version || p.v) + '"><div class="mock-meta"><strong id="' + gid + '">제' + esc(p.exam) + '회 심화 · ' + esc(p.number) + '번</strong><span>배점 ' + esc(p.points) + '점</span></div>' + imgs +
        '<div class="mock-choices" role="radiogroup" aria-labelledby="' + gid + '">' + order.map(function (id, i) {
          var k = /-option-([1-5])$/.exec(id), s = k ? SYM[Number(k[1])] : SYM[i + 1], onSel = sel === id;
          return '<button type="button" class="mock-choice ac-choice' + (onSel ? ' selected' : '') + (graded && id === result.correctOptionId ? ' right' : '') + (graded && id === result.optionId && !result.correct ? ' wrong' : '') + '" role="radio" aria-checked="' + (onSel ? 'true' : 'false') + '" data-option="' + esc(id) + '"' + (graded ? ' disabled' : '') + ' aria-label="' + s + '번' + (graded && id === result.correctOptionId ? ' · 정답' : '') + '">' + s + '</button>';
        }).join('') + '</div></article>';
    }
    var letters = 'ㄱㄴㄷㄹㅁㅂ';
    return '<article class="question ac-q"><div class="qtext" id="' + gid + '"><small class="qsection">' + esc(R0 && R0.mcPrompt ? R0.mcPrompt(p.prompt) : (p.prompt || '')) + '</small>' + qtext(p.q) + '</div>' + (p.ask ? '<p class="qask">묻는 것 · <b>' + esc(p.ask) + '</b></p>' : '') +
      '<div class="qchoices" role="radiogroup" aria-labelledby="' + gid + '">' + order.map(function (id, i) {
        var o = byId[id]; if (!o) return ''; var onSel = sel === id;
        return '<div class="qchoice-row' + mark(id) + '"><button type="button" class="qchoice ac-choice" role="radio" aria-checked="' + (onSel ? 'true' : 'false') + '" data-option="' + esc(id) + '"' + (graded ? ' disabled' : '') + '><span class="qletter" aria-hidden="true">' + letters.charAt(i) + '</span><span class="qopt">' + esc(o.text) + '</span><span class="qmark" aria-hidden="true">' + (graded ? (id === result.correctOptionId ? '✓ 정답' : (id === result.optionId ? '× 고른 답' : '')) : (onSel ? '고름' : '')) + '</span></button></div>';
      }).join('') + '</div></article>';
  }
  function reviewHtml(review, selected, correctId, position, displayed) {
    var R0 = R(); if (!review || !R0) return '';
    // GET results store the review item directly; answer responses wrap it in item.
    var saved = review.item ? review : (review.id && Array.isArray(review.options) ? {item:review} : null);
    if (!saved) return '';
    var reviewed = root.HanqCbtExplanations && root.HanqCbtExplanations.renderGraded(saved, selected, correctId, position, displayed);
    if (reviewed) return '<section class="mock-review">' + reviewed + '</section>';
    // 정답 관련 암기 핵심 3~5항목과 오답 선지별 한 문장만(media/quiz-review.js renderCompact)
    try { return '<section class="mock-review">' + (R0.renderCompact ? R0.renderCompact(saved.item, selected || null) : R0.render(saved.item, selected || null)) + '</section>'; } catch (e) { return ''; }
  }
  function bindChoices(onPick) {
    var btns = [].slice.call(ui.container.querySelectorAll('.ac-choice:not([disabled])'));
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { onPick(b.getAttribute('data-option'), b); });
      b.addEventListener('keydown', function (ev) { var d = ev.key === 'ArrowDown' || ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowUp' || ev.key === 'ArrowLeft' ? -1 : 0; if (!d) return; ev.preventDefault(); var t = btns[(i + d + btns.length) % btns.length]; if (t) t.focus(); });
    });
  }

  /* ---------- 메인(계정) ---------- */
  function periodKo(plan) {
    if (!plan) return '';
    return plan.periodPolicy === 'fixed-days' ? plan.fixedDays + '일' : '달력 기준 1개월(UTC — 다음 달에 같은 날이 없으면 그달 마지막 날까지)';
  }
  function disabledHtml() {
    return '<section class="ac-sec"><h2>서버 연결이 필요해요</h2><p>나만의 오답노트는 서버에서 로그인과 프리미엄 이용권을 확인한 뒤 열 수 있어요. 기존 학습 기록은 보존돼요.</p></section>';
  }
  var REMEMBER_ID_KEY='hanqacct:rememberedEmail:v1';
  function validLoginId(value){value=String(value||'').trim();return value.length<=254&&/^[^\s@]{1,64}@[^\s@.][^\s@]*\.[^\s@]{2,}$/.test(value)?value:'';}
  function rememberedLoginId(){try{return validLoginId(root.localStorage.getItem(REMEMBER_ID_KEY));}catch(e){return '';}}
  function rememberLoginId(enabled,value){try{var email=validLoginId(value);if(enabled&&email)root.localStorage.setItem(REMEMBER_ID_KEY,email);else root.localStorage.removeItem(REMEMBER_ID_KEY);return true;}catch(e){return false;}}
  // Only an explicit public-server declaration enables this opt-in. Older APIs
  // omit it, so ordinary login remains available without probing with a password.
  var rememberPlan=null,rememberRejected=null;
  function rememberSupport(){
    var capability=rememberPlan&&rememberPlan.auth&&rememberPlan.auth.rememberMe;
    if(rememberRejected==='remember_unavailable'||capability&&capability.available===false)return {enabled:false,message:'지금은 로그인 유지를 사용할 수 없어요. 일반 로그인은 가능해요.'};
    if(rememberRejected==='session_coordination_unavailable'||!root.navigator||!root.navigator.locks||typeof root.navigator.locks.request!=='function')return {enabled:false,message:'이 브라우저에서는 안전한 로그인 유지를 지원하지 않아요. 일반 로그인은 가능해요.'};
    if(!capability||capability.available!==true||capability.maxDays!==90)return {enabled:false,message:'로그인 유지 지원을 확인하지 못해 선택할 수 없어요. 일반 로그인은 가능해요.'};
    return {enabled:true,message:'공용 기기에서는 선택하지 마세요. 로그아웃하면 종료돼요. 앱과 브라우저에서는 각각 로그인해야 할 수 있어요.'};
  }
  function rememberFailure(error,form){
    if(!error||['remember_unavailable','session_coordination_unavailable'].indexOf(error.code)<0)return;
    rememberRejected=error.code;
    if(!form.isConnected||$('#acAuthForm')!==form)return;
    var check=$('#acRememberSession'),hint=$('#acRememberSessionHint'),button=$('#acAuthSubmit');
    if(check){check.checked=false;check.disabled=true;}
    if(hint)hint.textContent=rememberSupport().message;
    if(button)button.textContent='일반 로그인으로 다시 시도';
  }
  function authHtml() {
    var up = ui.authMode === 'signup',saved='',remember=rememberSupport();
    return '<section class="ac-sec" aria-labelledby="acAuthTitle"><h2 id="acAuthTitle">' + (up ? '회원가입' : '로그인') + '</h2>' +
      (A().state().authReason === 'expired' ? '<p role="status">로그인이 만료됐어요. 같은 계정으로 다시 로그인하면 풀던 화면과 임시 입력을 이어갈 수 있어요.</p>' : '') +
      '<form id="acAuthForm" class="ac-form" novalidate>' +
      '<label for="acEmail">이메일</label>'+(up?'<div class="ac-email-row">':'')+'<input id="acEmail" name="email" type="email" inputmode="email" autocomplete="' + (up ? 'email' : 'username') + '" value="'+esc(saved)+'" maxlength="254" required>'+(up?'<button type="button" class="tool-btn" id="acEmailCheck">중복 확인</button></div><p id="acEmailCheckMsg" role="status"></p>':'') +
      '<label for="acPw">비밀번호' + (up ? ' (10자 이상)' : '') + '</label><input id="acPw" name="password" type="password" autocomplete="' + (up ? 'new-password' : 'current-password') + '" maxlength="128" required>' +
      (up ? '<label for="acName">닉네임 (40자까지)</label><div class="ac-name-row"><input id="acName" name="displayName" type="text" autocomplete="nickname" maxlength="40" required><button type="button" class="tool-btn" id="acNameCheck">중복 확인</button></div><p id="acNameCheckMsg" role="status"></p>' : '') +
      (up?'':'<label class="ac-remember-id" for="acRememberSession"><input id="acRememberSession" type="checkbox" aria-describedby="acRememberSessionHint"'+(remember.enabled?'':' disabled')+'>로그인 유지'+(remember.enabled?' (최대 90일)':'')+'</label><p class="ac-note" id="acRememberSessionHint">'+esc(remember.message)+'</p>')+
      '<button type="submit" class="check-one" id="acAuthSubmit">' + (up ? '가입하고 로그인' : '로그인') + '</button>' +
      '<p class="ac-err" id="acAuthMsg" role="alert"></p></form><div class="ac-auth-footer">' + (up ? '<button type="button" class="tool-btn" id="acModeIn">로그인으로 돌아가기</button>' : '<button type="button" class="tool-btn" id="acModeUp">회원가입</button>') + '</div></section>';
  }
  /* 마이페이지(로그인): 캐릭터 히어로(실제 진화 단계 — #acCharacter는 HanqCharacters.mount가 채움, 서버 확인 전에는 비어 있음) · 닉네임 · 지금 성장점수
     (누르면 성장점수 기록 창) → 출석 → 닫힌 ‘계정 설정’(이메일 · 닉네임 · 비밀번호 · 이 기기 기록 동기화). 프리미엄·오답노트·풀이 기록은 오답노트 화면에,
     로그아웃은 헤더에 있다. 성장 정보를 확인 중이라고 말하는 건 실제로 불러오는 동안(로그인 복원 · profileStatus loading)뿐 — 끝났는데 못 받았으면
     실패라고 말하고 ‘다시 확인’ 하나를 준다(점수·캐릭터는 지어내지 않고 비운다). 출석은 서버가 준 누적 수가 있을 때만 숫자, 없으면 ‘미확인’ */
  function attendanceHtml(att,loading){
    var r=att&&att.reward,today=!!(att&&att.today),valid=!!(r&&r.policy==='streak-5-cycle-v1'&&Array.isArray(r.tiles)&&r.tiles.length===5&&Number.isSafeInteger(r.consecutive)&&r.consecutive>=0&&Number.isSafeInteger(r.cycleDay)&&r.cycleDay>=1&&r.cycleDay<=5&&r.daily===r.cycleDay*10&&r.tiles.every(function(t,i){return t.position===i+1&&t.xp===(i+1)*10&&['claimed','current','upcoming'].indexOf(t.status)>=0;})),xp=valid?r.daily:null;
    var tiles=valid?'<ol class="ac-streak-tiles" aria-label="5일 반복 출석 보상">'+r.tiles.map(function(t){var claimed=t.status==='claimed',old=claimed&&t.earnedXp!==t.xp,value=claimed?t.earnedXp:t.xp,label=claimed?(old?'이전':'완료'):t.status==='current'?'오늘':'예정';return '<li class="ac-streak-tile is-'+t.status+(t.today?' is-today':'')+'"'+(t.today?' aria-current="step"':'')+' aria-label="'+t.position+'일차 · '+(t.today?'오늘 · ':'')+esc(label)+' · '+esc(value)+' XP'+(old?' · 이전 정책 실제 보상, 소급 지급 없음':'')+'"><span>'+t.position+'일차</span><strong>'+esc(value)+'<small>XP</small></strong><span class="ac-streak-state">'+esc(label)+'</span></li>';}).join('')+'</ol>':'';
    var progress=valid?(today?r.cycleDay:r.cycleDay-1):0;
    return '<section class="ac-attendance ac-streak-card" aria-labelledby="acAttTitle"><div class="ac-streak-heading"><h3 id="acAttTitle">출석 퀘스트</h3><span>누적 '+(att?esc(att.total):'미확인')+'일</span></div>'+(valid?'<p class="ac-streak-count"><b>연속 '+r.consecutive+'일</b><span>이번 주기 '+progress+'/5</span></p>':'')+tiles+(valid?'<div class="ac-streak-progress" role="progressbar" aria-label="이번 5일 보상 주기 완료" aria-valuemin="0" aria-valuemax="5" aria-valuenow="'+progress+'"><span style="width:'+progress*20+'%"></span></div>':'')+'<button type="button" class="tool-btn" id="acAttendance" '+(!att||today?'disabled':'')+'>'+(!att?(loading?'출석 확인 중…':'출석 미확인'):today?'오늘 출석 완료':valid?'출석 +'+xp+' XP':'오늘 출석하기')+'</button><p id="acAttendanceMsg" role="status"></p></section>';
  }
  function profileHtml(st) {
    var u = st.user || {}, C = root.HanqCharacters, sure = !!(C && C.confirmed(st));
    var loading = !!st.restoring || st.profileStatus === 'loading';
    var att = st.profileStatus === 'ready' && st.access && typeof st.access.total === 'number' && Number.isFinite(st.access.total) ? st.access : null;
    return '<section class="ac-sec ac-me" aria-labelledby="acMeTitle"><div class="ac-hero">' +
      '<a class="tool-btn ac-hall-entry" href="#hall-of-fame">명예의 전당</a>' +
      (sure ? ''
        : loading ? '<p class="ac-hero-wait" role="status">성장 정보를 확인하고 있어요.</p>'
        : '<div class="ac-hero-wait ac-hero-fail" role="alert"><p>성장 정보를 불러오지 못했어요.</p><p>' + errMsg({ code: st.profileError || 'internal_error' }) + '</p><button type="button" class="tool-btn" id="acProfileRetry">다시 확인</button></div>') +
      '<div id="acCharacter" class="ac-character"></div>' + '<h2 id="acMeTitle" class="ac-hero-name"><span class="ac-sr">마이페이지 · </span><span id="acNameNow">' + esc(u.displayName) + '</span></h2>'+'</div><div class="ac-me-body">' +
      attendanceHtml(att,loading) + '<section id="acInventory" class="ac-inventory" aria-label="디지몬 보관함"></section>' + (root.HanqDisplayMode ? root.HanqDisplayMode.html() : '') +
      '<details class="ac-more ac-settings"><summary>계정 설정</summary><div class="ac-settings-body"><dl class="ac-dl"><div><dt>이메일</dt><dd>' + esc(u.email) + '</dd></div><div><dt>가입</dt><dd>' + esc(kst(u.createdAt)) + '</dd></div></dl>' +
      (st.premium && st.premium.active ? '<form id="acNameForm" class="ac-form ac-inline"><label for="acNewName">닉네임 바꾸기</label><input id="acNewName" type="text" maxlength="40" autocomplete="nickname" value="' + esc(u.displayName) + '" required><button type="submit" class="tool-btn">닉네임 저장</button><p class="ac-err" id="acNameMsg" role="status"></p></form>' : '<p class="ac-note">닉네임 변경은 프리미엄 이용 중에 할 수 있어요.</p>') +
      '<form id="acPwForm" class="ac-form"><h3>비밀번호 바꾸기</h3><label for="acPwCur">지금 비밀번호</label><input id="acPwCur" type="password" autocomplete="current-password" maxlength="128" required><label for="acPwNew">새 비밀번호</label><input id="acPwNew" type="password" autocomplete="new-password" maxlength="128" required><button type="submit" class="tool-btn">비밀번호 바꾸기</button><p class="ac-err" id="acPwMsg" role="status"></p><p class="ac-note">비밀번호를 변경하면 다른 기기의 로그인 세션이 종료됩니다.</p></form>' +
      '</div></details>' + syncHtml() + '<section class="ac-my-records" aria-labelledby="acRecordsTitle"><h2 id="acRecordsTitle">나의 기록</h2><div id="acMyRecordsHost"></div></section><section class="hq-inquiries" aria-labelledby="acInquiriesTitle"><h2 id="acInquiriesTitle">내 문의</h2><div id="acInquiriesHost"></div></section><p><a class="tool-btn" href="/inquiries/question-requests.html">사진·음원으로 문제 등록 요청</a> <a class="tool-btn" href="/inquiries/published-history.html">등록된 한국사 문제 풀기</a></p><footer id="acAdminSlot" class="ac-admin-footer"></footer></div></section>';
  }
  function fmtPoints(n) { return Number(n).toLocaleString('ko-KR'); }
  /* 이 기기 기록 자동 동기화(media/account-sync.js) 상태 한 줄 + 실패 때만 ‘다시 보내기’. 계정 표시 없는 예전·게스트 기록은 보내지 않는다는 안내 */
  function S() { return root.HanqAccountSync || null; }
  function syncHtml() {
    var sy = S(); if (!sy) return '';
    return '<aside class="ac-sync-error" id="acSync" hidden><p id="acSyncStatus" role="status"></p><button type="button" class="tool-btn" id="acSyncRetry" hidden>다시 보내기</button></aside>';
  }
  function syncText(x) {
    if (!x || !x.ownerId) return '로그인을 확인하면 이 기기 기록을 확인해요.';
    var skipped = x.skippedTotal ? ' · 보내지 않은 기록 ' + x.skippedTotal + '건(사유 확인 · 이 기기에 그대로)' : '';
    if (x.phase === 'running') return '이 기기 기록을 서버로 보내고 있어요…' + (x.pending ? ' (남은 ' + x.pending + '건)' : '');
    if (x.phase === 'done') return (x.imported || x.alreadyImported ? '보냈어요 · 새로 저장 ' + x.imported + '건 · 이미 있던 기록 ' + x.alreadyImported + '건' : '보낼 새 기록이 없어요') + skipped + '.';
    if (x.phase === 'blocked') return '이 브라우저 저장 공간을 쓸 수 없어 동기화하지 않았어요. 이 기기 기록은 그대로예요.';
    if (x.phase === 'error') return '동기화를 마치지 못했어요(' + errMsg({ code: x.error }).replace(/\.$/, '') + '). 확인되지 않은 기록은 다음에 같은 내용으로 다시 보내요' + (x.pending ? ' (남은 ' + x.pending + '건)' : '') + '.';
    return '대기 중이에요.';
  }
  function updateSync() {
    var sy = S(), el = $('#acSyncStatus'), b = $('#acSyncRetry'); if (!sy || !el) return;
    var x = sy.state(), st = A().state(), actionable = x.ownerId === st.ownerId && (x.phase === 'error' || x.phase === 'blocked'); $('#acSync').hidden = !actionable; el.textContent = actionable ? syncText(x) : '';
    if (b) { b.hidden = x.phase !== 'error'; b.disabled = x.phase === 'running'; }
  }
  function premiumHtml(st, planRes, prem) {
    var plan = planRes && planRes.plan, co = planRes && planRes.checkout, active = !!(prem && prem.active);
    if(plan&&plan.developmentOpen)return '<section class="ac-sec ac-development-premium"><h2>개발 기간 무료 프리미엄</h2><p>로그인한 모든 회원에게 프리미엄 기능을 무료로 제공합니다. 이용권 정책은 추후 안내합니다.</p></section>';
    var status = !st.signedIn ? '로그인하면 이용권 상태를 볼 수 있어요.' : active ? '<b class="ac-ok">이용 중</b> · ' + esc(kst(prem.expiresAt)) + '(한국 시간)까지' : (prem && prem.expiresAt ? '이용권 없음 · 지난 이용권은 ' + esc(kst(prem.expiresAt)) + '에 끝났어요' : '이용권 없음');
    var buy = '';
    if (st.signedIn) {
      if (!co || !co.available) buy = '<p class="hp-notice" role="status">온라인 결제는 아직 준비 중이에요. 지금은 이용권을 살 수 없고, 결제도 되지 않아요.</p><button type="button" class="check-one" disabled>구매 준비 중</button>';
      else if (co.testMode) buy = '<div class="ac-test" role="note"><p><b>개발용 테스트 결제 — 실제 결제가 아니에요.</b> 개발·시험 서버에서만 켜지는 버튼이라 돈이 오가지 않아요. 실제 서비스에는 나오지 않아요.</p><div class="ac-row"><button type="button" class="check-one" id="acBuyTest">테스트로 1개월 승인</button><button type="button" class="tool-btn" id="acBuyDecline">테스트 거절</button></div></div>';
      else buy = '<p class="hp-notice" role="status">결제 화면 연결은 아직 준비 중이에요.</p>';
    }
    return '<section class="ac-sec" aria-labelledby="acPremTitle"><h2 id="acPremTitle">프리미엄 이용권</h2><p class="ac-status" id="acPremStatus">' + status + '</p>' +
      '<ul class="ac-facts"><li><b>1개월 5,000원</b> · 자동 갱신 없음(다시 사면 끝나는 때부터 이어서 늘어나요)</li><li>기간: ' + esc(periodKo(plan))  + '</li><li>포함: 나만의 오답노트 · 최대 20문항, 30분 복습 · 서버 채점과 복습 안내</li><li>시대별 학습·퀴즈와 풀이 기록은 무료로 이용할 수 있어요.</li></ul>' +
      buy + '<p class="ac-err" id="acPayMsg" role="status"></p></section>';
  }
  function notesHtml(st, notes, prem, lists) {
    if (!st.signedIn) return '<p class="hp-notice">나만의 오답노트는 프리미엄 회원 전용이에요. 로그인해 주세요.</p>';
    if (!prem || !prem.active) return '<p class="hp-notice" role="status">나만의 오답노트는 프리미엄 회원 전용이에요. 1개월 5,000원 이용권이 필요하며 서버가 권한을 확인해요.</p>';
    var c = notes && notes.counts, items = notes && notes.items || [];
    var rp = lists && lists.replays && lists.replays.length ? '<h3>이어 풀기</h3><ul class="ac-list">' + lists.replays.slice(0,10).map(function(r){return '<li><button type="button" class="tool-btn ac-open" data-go="replay/'+esc(r.id)+'">'+esc(kst(r.createdAt))+' · '+r.answered+' / '+r.size+(r.finishedAt?' · 완료':'')+'</button></li>';}).join('')+'</ul>' : '';
    var parts=lists&&lists.parts;
    var cards=parts&&Array.isArray(parts.parts)?'<div class="wn-parts">'+parts.parts.map(function(p){return '<button type="button" class="tool-btn ac-part" data-part="'+esc(p.id)+'"'+(p.count?'':' disabled')+'><b>'+esc(p.label)+'</b><span>'+p.count+'문제</span></button>';}).join('')+'</div>':'<p role="status">파트별 문제 수를 불러오지 못했어요.</p>';
    return '<section class="ac-sec" aria-labelledby="acNotesTitle"><h2 id="acNotesTitle">나만의 오답노트</h2>'+
      (parts?'<p class="wn-total">전체 <b>'+parts.total+'문제</b> · 정답을 맞힌 문제도 계속 연습할 수 있어요.</p>':'')+
      '<p>파트별 반복연습 · 일반 정답 +1 / 오답 −1 · 기출은 원본 배점</p>'+cards+
      '<details class="wn-challenge"><summary>점수 도전</summary><p>20문제 · 30분 · 하루 5회. 반복연습과 별도로 점수를 정산해요.</p><button type="button" class="tool-btn" id="acStudyChallenge">점수 도전 시작</button></details>'+
      '<button type="button" class="tool-btn" id="acNotesRefresh">새로 불러오기</button><p class="ac-err" id="acNotesMsg" role="status"></p>'+rp+
      (items.length?'<details><summary>등록된 문제 '+items.length+'개</summary><ul class="ac-list ac-notes">'+items.map(function(n){return '<li><b>'+esc(title(n.kind,n.questionId))+'</b><span>'+(n.source==='book-manual'?'책에서 틀린 문제 · 수동 추가':'실제 오답 '+n.wrongCount+'회')+' · '+(n.status==='resolved'?'최근 정답':'복습할 문제')+'</span></li>';}).join('')+'</ul></details>':'')+'</section>';
  }
  function historyHtml(st) {
    if (!st.signedIn) return '';
    var rows = ui.hist.map(function (a) { return '<li><span class="ac-when">' + esc(kst(a.createdAt)) + '</span> <b class="' + (a.correct ? 'wn-ok' : 'wn-no') + '">' + (a.correct ? '✓' : '×') + '</b> ' + esc(title(a.kind, a.questionId)) + ' <small>' + esc({ practice: '보통 풀이', 'wrong-replay': '오답 다시 풀기', run: '오답 모의고사', 'import': '이 기기에서 가져옴' }[a.source] || a.source) + '</small></li>'; }).join('');
    return '<section class="ac-sec" aria-labelledby="acHistTitle"><h2 id="acHistTitle">서버 풀이 기록</h2><p class="wn-local">서버에 남은 기록만 보여요: 회원 기록으로 제출한 퀴즈·기출 답안과 직접 가져온 기록, 오답 복습 결과를 보여요. 무료 체험은 이 기기에 저장돼요.</p>' + (rows ? '<ol class="ac-list ac-hist">' + rows + '</ol>' : ui.histFailed ? '<p role="status">서버 풀이 기록을 불러오지 못했어요.</p>' : '<p>아직 서버에 남은 풀이 기록이 없어요.</p>') +
      (ui.histCursor ? '<button type="button" class="tool-btn" id="acHistMore">더 보기</button>' : '') + '</section>';
  }
  function studyHistoryHtml(st,data,failed){if(!st.signedIn||!(st.premium&&st.premium.active))return '';var runs=data&&data.runs?data.runs.filter(function(r){return r.status==='final';}):[];return '<section class="ac-sec ac-study-history"><h2>완료한 오답 복습</h2><p>유효 이용 기간에는 횟수 제한 없이 다시 볼 수 있어요. 열람은 도전 횟수와 성장점수를 바꾸지 않아요.</p>'+(failed&&!runs.length?'<p role="status">완료한 복습 기록을 불러오지 못했어요.</p>':runs.length?runs.map(function(r){var SS=studyScore(r.score);return '<p>'+esc(r.title)+' · '+esc(kst(r.finalAt))+(SS?' · <span class="ac-study-score">'+(SS.exam!==null?'시험점수 '+SS.exam+'/100점 · ':'')+SS.correct+'/'+SS.total+'문항 정답'+(SS.reward!==null&&SS.exam!==null?' → 성장점수 '+(SS.reward>0?'+':'')+SS.reward+'점':'')+'</span>':'')+' <button type="button" class="tool-btn ac-study-result" data-id="'+esc(r.id)+'">결과 다시 보기</button></p>';}).join(''):'<p>완료한 회차가 없어요.</p>')+'</section>';}

  /* 오답노트 화면의 ‘풀이 기록’(완료한 오답 복습 · 서버 풀이 기록) — 마이페이지에서 옮겨 옴 */
  function recordsHtml(st, r) {
    if (!st.signedIn) return '';
    var runs = r[4] && !r[4].__err ? r[4] : null;
    return '<details class="ac-records"><summary>풀이 기록</summary>' + studyHistoryHtml(st, runs, !!(r[4] && r[4].__err)) + historyHtml(st) + '</details>';
  }

  // Optional navigation only: the existing /ops API remains the authority for every admin action.
  function loadAdminEntry(api, tok, owner) {
    if (ui.view !== 'main' || !owner || typeof api.portal !== 'function') return;
    var slot = $('#acAdminSlot');
    if (!slot) return;
    Promise.resolve().then(function () { return api.portal('GET', '/api/v1/ops'); }).then(function (result) {
      var now = api.state();
      if (tok !== ui.tok || ui.view !== 'main' || !slot.isConnected || !now.signedIn || now.ownerId !== owner || !now.user || now.user.id !== owner || !result || result.admin !== true) return;
      slot.innerHTML = '<a class="ac-admin-entry" href="/ops/">관리자 페이지</a>';
    }, function () { /* Fail closed without delaying the profile or displaying a denied-role error. */ });
  }

  /* keepHist: ‘더 보기’로 이어 붙인 기록을 유지할 때만 true. 그 밖에는 언제나 지금 계정의 첫 쪽을 서버에서 새로 받는다
     (다른 계정의 기록을 화면에 남겨 두지 않게) */
  function renderMain(keepHist) {
    var api = A(), tok = ++ui.tok;
    stopTimer();
    if (!api || !api.enabled()) { paint(disabledHtml()); on('#acToNotes', 'click', function () { ui.ctx.go('notes'); }); return Promise.resolve(); }
    busy(true);
    paint((ui.notice === MSG.owner_switched ? '<p class="hp-notice ac-notice" role="status">' + esc(ui.notice) + '</p>' : '') + '<p class="ac-loading" role="status">불러오는 중이에요…</p>'); // 이전 연결 실패는 함께 그리지 않되 계정 변경은 즉시 알린다
    var st0 = api.state(), owner0 = st0.signedIn && st0.user ? st0.user.id : null;
    if (owner0 !== ui.ownerId) { resetOwnerState(owner0); keepHist = false; }
    var settle = function (fn) { var p; try { p = Promise.resolve(fn()); } catch (e) { p = Promise.reject(e); } return p.then(function (v) { return v; }, function (e) { return { __err: e || {} }; }); };
    var signedIn = st0.signedIn;
    return Promise.all([
      settle(function () { return api.plan(); }),
      signedIn ? settle(function () { return api.me(); }) : Promise.resolve(null),
      signedIn && ui.view==='notes' && st0.premium && st0.premium.active ? settle(function () { return api.wrongNotes({ status: 'all' }); }) : Promise.resolve(null),
      signedIn && ui.view==='notes' && st0.premium && st0.premium.active ? settle(function () { return api.replays(); }) : Promise.resolve(null),
      signedIn && ui.view==='notes' && st0.premium && st0.premium.active ? settle(function () { return api.runs(); }) : Promise.resolve(null),
      signedIn && ui.view==='notes' && !(keepHist && ui.hist.length) ? settle(function () { return api.attempts(null, 20); }) : Promise.resolve(null),
      signedIn && ui.view==='notes' && st0.premium && st0.premium.active ? settle(function () { return api.wrongParts(); }) : Promise.resolve(null)
    ]).then(function (r) {
      if (tok !== ui.tok || !ui.container || !ui.container.isConnected) return; // 떠난 화면(분리된 컨테이너)에는 그리지 않음
      // 불러오는 사이 계정이 바뀌었으면(다른 탭 로그인 · 갱신 결과가 다른 사람) 받은 것을 버리고 지금 계정으로 다시
      var stNow = api.state();
      if ((stNow.signedIn && stNow.user ? stNow.user.id : null) !== owner0) return renderMain();
      busy(false);
      var st = api.state(), ok = function (x) { return x && !x.__err ? x : null; };
      if (!signedIn) { ui.hist = []; ui.histCursor = null; }
      if (ok(r[5])) { ui.hist = r[5].items; ui.histCursor = r[5].next; ui.histFailed = false; } else if (r[5] && r[5].__err) ui.histFailed = true;
      var me = ok(r[1]), prem = me ? me.premium : st.premium;
      if(ui.view==='notes'&&st.signedIn&&(!me||!prem)){paint('<p role="alert">이용권 정보를 확인하지 못했어요.</p><button type="button" class="tool-btn" id="acPremiumRetry">다시 확인하기</button>');on('#acPremiumRetry','click',function(){renderMain();});return;}
      var notice = ui.notice ? '<p class="hp-notice ac-notice" role="status">' + esc(ui.notice) + '</p>' : ''; ui.notice = '';
      // 마이페이지에서 내 정보(me) 실패는 프로필 칸이 직접 알리고 ‘다시 확인’을 준다(위 안내와 두 번 말하지 않게)
      var errs = r.filter(function (x, i) { return x && x.__err && x.__err.status !== 401 && !(i === 1 && ui.view === 'main' && st.signedIn); });
      // 서버가 테스트용 무료 전환을 켰을 때만 메인 프리미엄 단추가 그 단추가 된다(누를 때만 서버에 요청 · 결제 없음). 꺼져 있으면 기존 프리미엄 안내 창
      var planRes = ok(r[0]), developmentOpen=!!(planRes&&planRes.plan&&planRes.plan.developmentOpen), freePass = !!(planRes && planRes.testFreePass && planRes.testFreePass.available === true);
      rememberPlan=planRes;
      var freePassBtn = freePass ? '<div class="ac-row ac-actions"><button type="button" class="tool-btn" id="acTestFreePass">테스트용 무료 전환·30일</button></div><p class="ac-err" id="acTestFreePassMsg" role="status"></p>' : '';
      paint((ui.view==='main'&&st.signedIn&&st.status!=='offline'?'':connLine(st)) + notice + (developmentOpen?'<p class="hp-notice ac-development-premium" role="note">개발 기간 무료 프리미엄 · 로그인한 모든 회원에게 제공하며 이용권 정책은 추후 안내합니다.</p>':'') + (errs.length && st.status !== 'offline' ? '<p class="hp-notice ac-load-err" role="status">' + errMsg(errs[0].__err) + '</p>' : '') +
        (ui.view === 'notes' ? (st.signedIn ? '' : authHtml()) + (st.signedIn && !(prem && prem.active) ? premiumHtml(st, ok(r[0]), prem) + freePassBtn : '') + notesHtml(st, ok(r[2]), prem, { replays: ok(r[3]) && r[3].replays, parts:ok(r[6]) }) + recordsHtml(st, r) : (st.signedIn ? profileHtml(st) : authHtml())));
      bindMain(st);
      loadAdminEntry(api, tok, owner0);
      // 연결이 끊겼거나 일부를 받지 못했으면 지금 화면을 다시 불러오는 단추 하나(누를 때만 요청 · 프로필 칸의 ‘다시 확인’이 있으면 그것으로 충분)
      var off = st.status === 'offline' || r.some(function (x) { return x && x.__err && (x.__err.code === 'network' || x.__err.code === 'timeout'); });
      if ((off || errs.length) && !$('#acProfileRetry') && !$('#acConnectionRetry')) { var at = $('.ac-conn.is-off') || $('.ac-load-err'), rb = root.document.createElement('button'); rb.type = 'button'; rb.className = 'tool-btn'; rb.id = 'acConnectionRetry'; rb.textContent = '다시 연결하기'; rb.addEventListener('click', function () { rb.disabled = true; renderMain(); }); if (at && at.parentNode) at.parentNode.insertBefore(rb, at.nextSibling); else ui.container.insertBefore(rb, ui.container.firstChild); }
      if(ui.view==='notes'&&st.signedIn&&prem&&!prem.active&&prem.expiresAt){var key=st.ownerId+'|'+prem.expiresAt;if(ui.expiredNotice!==key){ui.expiredNotice=key;var dialog=root.document.createElement('dialog');dialog.className='ac-premium-modal';dialog.setAttribute('aria-labelledby','acExpiredTitle');dialog.innerHTML='<h2 id="acExpiredTitle">프리미엄 이용권을 확인해 주세요</h2><p>오답노트와 시험 결과는 이용 기간에 볼 수 있어요. 기록은 보존되며 이용권을 다시 활성화하면 열람할 수 있어요.</p><button type="button" class="tool-btn">확인</button>';ui.container.appendChild(dialog);dialog.querySelector('button').onclick=function(){if(dialog.close)dialog.close();dialog.remove();};if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}}
    }).then(null, function (e) { if (tok !== ui.tok || !ui.container || !ui.container.isConnected) return; connFail(e, function () { renderMain(); }); });
  }

  /* ---------- 성장점수 기록 창(본인 캐릭터 단추) ----------
     GET /api/v1/me/growth-history(내 기록만 · 최신순 · 20개씩 ‘더 보기’). 날짜 · 사유 · 부호 있는 점수만 서버 값 그대로 보여 준다(모르는 사유는 지어내지 않고 뺀다).
     닫기: 닫기 단추 · Esc · 바깥 누름. 닫으면 연 단추로 포커스를 돌린다. 다시 그리기·계정 변경·로그아웃이면 조용히 닫고 늦은 응답은 버린다 */
  /* 사유별 서버가 줄 수 있는 점수(이 밖의 값이면 그 쪽 전체를 믿지 않음). practice-*: migration 008 · cbt-exam: 009 */
  var GROWTH_RULE = { attendance:[10,20,30,40,50], 'toeic-answer': [-1,0,1], signup: [1000], 'wrong-note-study': [-100, 50, 100, 150, 200], 'practice-quiz': [-1, 1], 'practice-mock': [-5, 5], 'cbt-exam': [-100, 50, 100, 150, 200] };
  function growthOk(x) { if(!Number.isSafeInteger(x.points))return false;var n=x.points;if(x.reason==='admin-adjustment')return n>=-1000000&&n<=1000000;if(x.reason==='battle')return n>=-200&&n<=200;if(x.reason==='practice-mock')return n>=-5&&n<=5;if(x.reason==='cbt-exam')return n>=-100&&n<=100||n===150||n===200;if(x.reason==='practice-quiz')return n>=-1&&n<=1;if(x.reason==='wrong-note-study')return n>=-150&&n<=150||n===200;return Object.prototype.hasOwnProperty.call(GROWTH_RULE,x.reason)&&GROWTH_RULE[x.reason].indexOf(n)>=0; }
  function growthLabel(x) {
    if(x.reason==='attendance')return '출석 보상';
    if(x.reason==='admin-adjustment')return '관리자 XP 조정';
    if(x.reason==='battle')return x.points>0?'얼음섬 승리':x.points<0?'얼음섬 패배':'얼음섬 패배 · 0점 하한';
    if(x.reason==='toeic-answer')return x.points>0?'토익 정답':x.points<0?'토익 오답':'토익 오답 · 0점 하한';
    if (x.reason === 'practice-quiz') return x.points > 0 ? '퀴즈 정답' : '퀴즈 오답';
    if (x.reason === 'practice-mock') return x.points > 0 ? '기출 정답' : '기출 오답';
    if (x.reason === 'cbt-exam') return '모의고사 성장점수';
    return x.reason === 'signup' ? '회원가입 보너스' : '오답노트 도전 결과';
  }
  /* 서버가 그 회차를 채점할 때 저장한 최종 시험 결과(성장점수 기록의 examResult). 오답노트 도전·CBT 줄에만 올 수 있고,
     {score, maxScore:100, correct, total} 정수 네 칸만 받는다. 없으면(예전 기록·미완료) 원래 사유만 보여 주고 점수를 짐작해 만들지 않는다 */
  function examResultOk(x) {
    var e = x.examResult;
    if (e === undefined || e === null) return true;
    if (x.reason !== 'wrong-note-study' && x.reason !== 'cbt-exam') return false;
    if (typeof e !== 'object' || Array.isArray(e) || Object.keys(e).sort().join() !== 'correct,maxScore,score,total') return false;
    var n = function (v, a, b) { return Number.isSafeInteger(v) && v >= a && v <= b; };
    if (e.maxScore !== 100 || !n(e.score, 0, 100) || !(x.reason === 'cbt-exam' ? e.total === 50 : n(e.total, 1, 50))) return false;
    return n(e.correct, 0, e.total);
  }
  function examText(e) { return e.score + '/' + e.maxScore + '점 · ' + e.correct + '/' + e.total + '문항 정답'; }
  /* 오답노트 도전 회차(run.score)에 서버가 저장한 시험점수(0~100)·정답 수·문항 수. 모양이 맞을 때만 쓴다 */
  function studyScore(S) {
    var n = function (v, a, b) { return Number.isSafeInteger(v) && v >= a && v <= b; };
    if (!S || typeof S !== 'object' || !n(S.questions, 1, 50) || !n(S.correct, 0, S.questions)) return null;
    return { perQuestion:S.growthPolicy==='per-question-original-points', exam: n(S.examScore, 0, 100) ? S.examScore : null, correct: S.correct, total: S.questions, reward: S.rewardEligible === true && Number.isSafeInteger(S.growthReward) ? S.growthReward : null };
  }
  /* 성장점수 구간 설명(정책 표시만 · 보상은 서버 값을 그대로 씀) */
  var STUDY_BANDS = '기준: 60점 미만 −100 · 60~69점 +50 · 70~79점 +100 · 80~89점 +150 · 90점 이상 +200';
  function bandText(score) { return score < 60 ? '60점 미만이라 차감' : score < 70 ? '60~69점 구간 보상' : score < 80 ? '70~79점 구간 보상' : score < 90 ? '80~89점 구간 보상' : '90점 이상 구간 보상'; }
  function signedPoints(n) { return (n > 0 ? '+' : n < 0 ? '-' : '') + fmtPoints(Math.abs(n)) + '점'; }
  function closeGrowth(restore) { var g = ui.growth; if (!g) return; ui.growth = null; g.close(restore); }
  function openGrowth(trigger) {
    var api = A(), st = api && api.state(), owner = st && st.signedIn ? st.ownerId : null, doc = root.document;
    if (!owner || !st.growth || !doc) return;
    closeGrowth(false);
    // Recompute Korea's civil-day bounds whenever the character is opened (stored dates are UTC instants).
    var dayStart = Math.floor((Date.now() + 9 * 3600000) / 86400000) * 86400000 - 9 * 3600000, dayEnd = dayStart + 86400000;
    var dlg = doc.createElement('dialog'), loading = false, cursor = null, done = false, off = null, cursors = Object.create(null);
    dlg.className = 'ac-growth-dialog'; dlg.id = 'acGrowthDialog'; dlg.setAttribute('aria-labelledby', 'acGrowthTitle'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = '<div class="ac-gd-head"><h2 id="acGrowthTitle" tabindex="-1">오늘 성장기록</h2><button type="button" class="tool-btn" id="acGrowthClose">닫기</button></div>' +
      '<p class="ac-gd-total">계정 총 XP <b>' + esc(fmtPoints(st.growth.points)) + '</b> XP · 오늘 한국시간 기준</p>' +
      '<div class="ac-gd-scroll" tabindex="0" role="region" aria-labelledby="acGrowthTitle"><ol class="ac-gd-list" id="acGrowthList"></ol></div>' +
      '<p class="ac-gd-status" id="acGrowthStatus" role="status"></p><button type="button" class="tool-btn" id="acGrowthMore" hidden>더 보기</button>';
    var list = dlg.querySelector('#acGrowthList'), status = dlg.querySelector('#acGrowthStatus'), more = dlg.querySelector('#acGrowthMore');
    var alive = function () { var now = api.state(); return ui.growth === g && dlg.isConnected && now.signedIn && now.ownerId === owner; };
    var g = { close: function (restore) {
      if (done) return; done = true; if (off) off();
      try { if (dlg.open && typeof dlg.close === 'function') dlg.close(); } catch (e) {}
      if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
      if (ui.growth === g) ui.growth = null;
      if (restore) { var t = trigger && trigger.isConnected ? trigger : $('#acCharacter .ac-pet') || $('#acMeTitle'); if (t) { try { t.focus({ preventScroll: true }); } catch (e2) { t.focus(); } } }
    } };
    var load = function () {
      if (loading || !alive()) return;
      loading = true; more.disabled = true; status.removeAttribute('data-error'); status.textContent = '불러오는 중이에요…';
      var asked = cursor;
      Promise.resolve().then(function () { return api.growthHistory(asked, 20); }).then(function (d) {
        if (!alive()) return;
        loading = false;
        // 쪽 전체를 먼저 검사한다: 한 줄이라도 이상하거나(사유·정수 점수·날짜) 다음 쪽 표시가 이상·반복이면 아무것도 붙이지 않고 실패로(앞 쪽은 그대로)
        var bad = !d || !Array.isArray(d.items) || d.items.length > 50 || !(d.next === null || (typeof d.next === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(d.next) && d.next !== asked && !cursors[d.next])) ||
          d.items.some(function (x) { return !x || typeof x !== 'object' || !Number.isSafeInteger(x.points) || !growthOk(x) || !examResultOk(x) || typeof x.createdAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(x.createdAt) || !Number.isFinite(Date.parse(x.createdAt)); });
        if (bad) throw Object.assign(new Error('invalid'), { code: 'invalid_response' });
        if (d.next) cursors[d.next] = 1;
        var reachedPast = d.items.some(function (x) { return Date.parse(x.createdAt) < dayStart; });
        d.items.filter(function (x) { var at = Date.parse(x.createdAt); return at >= dayStart && at < dayEnd; }).forEach(function (x) {
          var li = doc.createElement('li'); li.className = 'ac-gd-item ' + (x.points < 0 ? 'is-minus' : 'is-plus');
          li.innerHTML = '<time datetime="' + esc(x.createdAt) + '">' + esc(kst(x.createdAt)) + '</time><span class="ac-gd-reason">' + esc(growthLabel(x)) + '</span>' + (x.examResult ? '<span class="ac-gd-exam">' + esc(examText(x.examResult)) + ' → 성장점수</span>' : '') + '<b class="ac-gd-points">' + esc(signedPoints(x.points)) + '</b>';
          list.appendChild(li);
        });
        cursor = reachedPast ? null : d.next; more.hidden = !cursor; more.disabled = false; more.textContent = '더 보기';
        status.textContent = list.children.length ? (cursor ? '' : '오늘 기록을 모두 보여 드렸어요.') : '오늘은 XP 증가·차감 기록이 없어요.';
      }).then(null, function (e) {
        if (!alive()) return;
        loading = false; status.setAttribute('data-error', '1');
        status.textContent = '성장점수 기록을 불러오지 못했어요. ' + errMsg(e);
        more.hidden = false; more.disabled = false; more.textContent = asked ? '더 보기 다시 시도' : '다시 시도';
      });
    };
    more.addEventListener('click', load);
    dlg.querySelector('#acGrowthClose').addEventListener('click', function () { closeGrowth(true); });
    dlg.addEventListener('cancel', function (ev) { ev.preventDefault(); closeGrowth(true); }); // 브라우저의 Esc → 같은 닫기(포커스 복원)
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) closeGrowth(true); });
    dlg.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); closeGrowth(true); return; }
      if (ev.key !== 'Tab') return; // showModal이 없는 환경에서도 창 안에서만 돌게
      var f = [].slice.call(dlg.querySelectorAll('button:not([disabled]):not([hidden]),[tabindex="0"]'));
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && doc.activeElement === first) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && doc.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    ui.growth = g;
    off = api.onChange(function (now) { if (!now.signedIn || now.ownerId !== owner) closeGrowth(false); });
    doc.body.appendChild(dlg);
    try { if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', ''); } catch (e) { dlg.setAttribute('open', ''); }
    var h = dlg.querySelector('#acGrowthTitle'); try { h.focus({ preventScroll: true }); } catch (e3) { h.focus(); }
    load();
  }

  /* ---------- 마이페이지 캐릭터 열 번 누르기 → 테스트용 무료 프리미엄(기존 본인 전용·계정당 한 번 POST /premium/test-free-pass) ----------
     관리자 기능이 아니고 보안 경계도 아니다: 서버가 기능 표시(HANQ_TEST_FREE_PREMIUM_ENABLED)·본인 토큰·계정당 한 번·기록(006)·동시성을 그대로 정한다.
     · 세는 단위는 지금 로그인(계정 + epoch). 다시 그려도 이어지고, 로그아웃·계정 바뀜·새로 고침이면 처음부터.
     · 열 번째: 한 번에 하나. 공개 plan의 testFreePass.available이 true가 아니면 요청하지 않는다. 요청 뒤 내 정보(/me)를 새로 받아
       같은 계정·로그인에서 프리미엄이 실제로 켜져 있고 만료가 미래일 때만 말풍선. 실패하면 말하지 않고, 다음 누름에서 다시 시도.
     · 예전에 쓰고 끝난 체험(alreadyClaimed · active false)은 성공이 아니다. 이미 켜져 있던 체험은 새로 켰다고 말하지 않는다. */
  var PET_TAPS = 10, PET_SAY_MS = 6000;
  function petKey() { var api = A(), st = api && api.state(); return st && st.signedIn && st.ownerId ? st.ownerId + '|' + st.epoch : null; }
  function clearPet() { if (ui.petSay && ui.petSay.timer) clearTimeout(ui.petSay.timer); ui.petSay = null; ui.pet = null; var el = $('.ac-pet-say'); if (el) el.remove(); }
  function applyPetSay() {
    var s = ui.petSay, host = $('#acCharacter'), pet = $('#acCharacter .ac-pet');
    if (!s || s.key !== petKey() || !host || !pet) return;
    var el = host.querySelector('.ac-pet-say');
    if (!el) { el = root.document.createElement('p'); el.className = 'ac-pet-say'; el.setAttribute('role', 'status'); pet.insertAdjacentElement('afterend', el); }
    el.textContent = s.text;
  }
  function showPetSay(key, text) {
    if (ui.petSay && ui.petSay.timer) clearTimeout(ui.petSay.timer);
    var say = ui.petSay = { key: key, text: text, timer: null };
    say.timer = setTimeout(function () { if (ui.petSay !== say) return; ui.petSay = null; var el = $('.ac-pet-say'); if (el) el.remove(); }, PET_SAY_MS);
    applyPetSay();
  }
  // Normal character activation reads growth history only; the legacy tap reward is not bound.
  var evolutionRequest=null,evolutionPending=false;
  function evolvePet(ev){if(evolutionPending)return;var api=A(),b=ev.currentTarget,st=api.state(),family=b.dataset.family,revision=Number(b.dataset.revision),owner=st.ownerId;if(!st.signedIn||!api.evolve)return;if(!evolutionRequest||evolutionRequest.owner!==owner||evolutionRequest.family!==family||evolutionRequest.revision!==revision)evolutionRequest={owner:owner,family:family,revision:revision,id:crypto.randomUUID()};evolutionPending=true;b.disabled=true;b.textContent='진화 중…';(b.dataset.partnerId&&api.partnerAction?api.partnerAction('evolve',{id:b.dataset.partnerId,revision:revision,requestId:evolutionRequest.id}):api.evolve(family,revision,evolutionRequest.id)).then(function(){evolutionRequest=null;},function(e){if(e&&e.status===409){evolutionRequest=null;return api.refreshProfile();}if(b.isConnected){b.textContent='다시 진화 확인';b.disabled=false;}}).finally(function(){evolutionPending=false;});}
  function petGrowth(ev) { openGrowth(ev.currentTarget); }
  function petTap() {
    var key = petKey(); if (!key) return;
    if (!ui.pet || ui.pet.key !== key) ui.pet = { key: key, n: 0, busy: false };
    var rec = ui.pet;
    if (rec.busy) return;
    if (rec.n < PET_TAPS) rec.n++;
    if (rec.n < PET_TAPS) return;
    rec.busy = true;
    var api = A(), owner = key.slice(0, key.lastIndexOf('|')), stop = {};
    var alive = function () { if (ui.pet !== rec || petKey() !== key) throw stop; };
    Promise.resolve().then(function () { return api.plan(); }).then(function (plan) {
      alive();
      if (!plan || !plan.testFreePass || plan.testFreePass.available !== true) throw stop; // 꺼져 있으면 요청하지 않음
      return api.testFreePass();
    }).then(function (claim) {
      alive();
      if (!claim || claim.active !== true) throw stop; // 끝난 예전 체험: 다시 켜지 않음 · 성공 아님
      return api.me().then(function (me) { return { claim: claim, me: me }; });
    }).then(function (r) {
      alive();
      var me = r.me, st = api.state(), exp = me && me.premium ? Date.parse(me.premium.expiresAt) : NaN;
      if (!me || !me.user || me.user.id !== owner || !me.premium || me.premium.active !== true || !Number.isFinite(exp) || exp <= Date.now() ||
          !st.premium || st.premium.active !== true || st.ownerId !== owner) throw stop;
      rec.busy = false; rec.n = 0;
      showPetSay(key, r.claim.alreadyClaimed ? '이미 프리미엄이 활성화되어 있어요.' : '프리미엄이 활성화되었습니다!');
      return renderMain();
    }).then(null, function () { if (ui.pet === rec) rec.busy = false; }); // 실패: 말하지 않음 · 다음 누름에서 다시(셈은 열 번째에 머묾)
  }

  /* 헤더의 로그아웃 단추(앱이 부름): 이 탭의 로그인은 언제나 지운다. 서버가 실제로 끊었는지에 따라 안내를 다르게(지운 화면 기능을 가리키지 않음) */
  function logout() {
    var api = A();
    if (!api || !api.enabled()) return Promise.resolve(null);
    if (ui.loggingOut) return ui.loggingOut;
    closeGrowth(false);
    var p = ui.loggingOut = api.logout().then(function (res) {
      ui.loggingOut = null;
      ui.tok++; // 로그아웃 중 시작된 다시 그리기(계정 변경 감지)가 이 안내를 먼저 써 버리지 않게: 다음 화면이 이 안내를 보여 준다
      resetOwnerState(null);
      ui.notice = res && res.serverRevoked ? '로그아웃했어요. 서버의 이 로그인도 끝냈어요. 이 기기의 학습 기록은 그대로예요.'
        : '이 탭에서는 로그아웃했지만 연결 문제로 서버에 알리지 못했어요. 서버 쪽 로그인은 만료될 때까지 남아 있을 수 있어요. 연결된 뒤 다시 로그인했다가 로그아웃하면 이 브라우저에 남은 로그인 정보도 정리돼요. 이 기기의 학습 기록은 그대로예요.';
      return res;
    }, function () { ui.loggingOut = null; return null; });
    return p;
  }

  function withButton(btn, msgEl, p, okFn) {
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    if (msgEl) msgEl.textContent = '처리 중이에요…';
    return p.then(function (v) { if (msgEl) msgEl.textContent = ''; return okFn ? okFn(v) : v; }, function (e) {
      if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      if (msgEl) msgEl.textContent = errMsg(e);
      return null;
    });
  }

  function bindMain(st) {
    var api = A();
    [].slice.call(ui.container.querySelectorAll('.ac-study-result')).forEach(function(b){b.onclick=function(){ui.ctx.go('study/'+b.dataset.id);};});
    on('#acModeIn', 'click', function () { ui.authMode = 'signin'; renderMain().then(function () { focusFirst('#acEmail'); }); });
    on('#acModeUp', 'click', function () { ui.authMode = 'signup'; renderMain().then(function () { focusFirst('#acEmail'); }); });
    var checkedEmail='',emailCheckSeq=0,emailPending=false;
    function saveRememberedId(){var check=$('#acRememberId');if(check&&!rememberLoginId(check.checked,$('#acEmail').value)){check.checked=false;var msg=$('#acAuthMsg');if(msg)msg.textContent='이 브라우저에서는 아이디를 저장할 수 없어요.';}}
    on('#acRememberId','change',saveRememberedId);
    on('#acEmail','input',function(){var check=$('#acRememberId');if(check&&check.checked)saveRememberedId();});
    function emailKey(){return ($('#acEmail').value||'').normalize('NFKC').trim().toLowerCase();}
    on('#acEmail','input',function(){emailCheckSeq++;checkedEmail='';emailPending=false;var b=$('#acEmailCheck'),m=$('#acEmailCheckMsg');if(b){b.disabled=false;b.removeAttribute('aria-busy');}if(m)m.textContent='';});
    on('#acEmailCheck','click',function(){if(emailPending)return;var email=emailKey(),msg=$('#acEmailCheckMsg'),button=$('#acEmailCheck'),form=$('#acAuthForm');checkedEmail='';if(email.length>254||!/^[^\s@]{1,64}@[^\s@.][^\s@]*\.[^\s@]{2,}$/.test(email)){msg.textContent='올바른 이메일 주소를 입력해 주세요.';return;}var seq=++emailCheckSeq;emailPending=true;button.disabled=true;button.setAttribute('aria-busy','true');msg.textContent='확인 중…';function current(){return form.isConnected&&$('#acAuthForm')===form&&seq===emailCheckSeq&&emailKey()===email;}Promise.resolve().then(function(){return api.emailAvailable(email);}).then(function(d){if(!current())return;if(!d||typeof d.available!=='boolean')throw Error('invalid response');checkedEmail=d.available?email:'';msg.textContent=d.available?'사용할 수 있는 이메일이에요.':'이미 가입한 이메일이에요. 로그인해 주세요.';},function(){if(current())msg.textContent='이메일을 확인하지 못했어요. 연결을 확인한 뒤 다시 눌러 주세요.';}).catch(function(){if(current())msg.textContent='이메일을 확인하지 못했어요. 다시 눌러 주세요.';}).then(function(){if(!current())return;emailPending=false;button.disabled=false;button.removeAttribute('aria-busy');});});
    var checkedName='';
    on('#acName','input',function(){checkedName='';var m=$('#acNameCheckMsg');if(m)m.textContent='';});
    on('#acNameCheck','click',function(){var name=$('#acName').value.trim(),msg=$('#acNameCheckMsg');if(!name){msg.textContent='닉네임을 넣어 주세요.';return;}withButton($('#acNameCheck'),msg,api.nicknameAvailable(name),function(d){if($('#acName').value.trim()!==name)return;checkedName=d.available?name:'';msg.textContent=d.available?'사용할 수 있어요.':'이미 사용하는 닉네임이에요.';});});
    if(root.HanqCharacters&&$('#acCharacter')){root.HanqCharacters.mount($('#acCharacter'),st);$('#acCharacter').dataset.growthPoints=st.growth?fmtPoints(st.growth.points):'';$('#acCharacter').dataset.evolutionKey=JSON.stringify(st.partners||st.partnerEvolution||null);}
    if(root.HanqInquiries&&$('#acInquiriesHost'))root.HanqInquiries.mount($('#acInquiriesHost'),api);
    if(root.HanqMyRecords&&$('#acMyRecordsHost'))root.HanqMyRecords.mount($('#acMyRecordsHost'),api,ui.view==='toeic-records'?'toeic':'all');
    on('#acCharacter .ac-pet','click',petGrowth);on('#acCharacter .ac-evolve','click',evolvePet);applyPetSay();if(root.HanqCollection&&root.HanqCollection.mountInventory&&$('#acInventory'))root.HanqCollection.mountInventory($('#acInventory'),api);
    on('#acAttendance','click',function(){withButton($('#acAttendance'),$('#acAttendanceMsg'),api.attendance(),function(result){return renderMain().then(function(){var msg=$('#acAttendanceMsg'),now=api.state();if(msg){msg.textContent=result&&result.reward&&result.reward.awarded>0?'출석 완료 · +'+result.reward.awarded+' XP':now.access&&now.access.reward&&now.access.reward.earnedToday>0?'오늘 출석 보상은 이미 받았어요.':now.access&&now.access.today?'오늘 출석 완료':'출석 상태를 다시 확인해 주세요.';msg.tabIndex=-1;msg.focus();}});});});
    on('#acProfileRetry','click',function(ev){ev.currentTarget.disabled=true;renderMain();});
    on('#acSyncRetry','click',function(ev){var sy=S();if(!sy)return;ev.currentTarget.disabled=true;sy.sync();updateSync();});
    updateSync();
    /* 테스트용 무료 전환: 사용자가 누를 때만 한 번 요청(누르는 동안 단추 잠금). 이미 쓴 계정은 서버가 기간을 늘리지 않고 그 사실을 알려 준다.
       응답이 오는 사이 계정이 바뀌면 이전 계정 결과를 그리지 않는다(call()도 같은 계정 응답만 넘겨 줌) */
    on('#acTestFreePass','click',function(ev){
      var b=ev.currentTarget,owner=st.ownerId;if(b.disabled)return;
      withButton(b,$('#acTestFreePassMsg'),api.testFreePass(),function(d){
        var now=api.state();if(!now.signedIn||now.ownerId!==owner)return null;
        ui.notice=!d.alreadyClaimed?'테스트용 무료 전환·30일 (결제 없음) · '+kst(d.expiresAt)+'(한국 시간)까지 프리미엄이에요.'
          :d.active?'테스트용 무료 전환은 계정당 한 번이라 이미 사용했어요. 기간은 늘리지 않았고, 지금 이용권은 '+kst(d.expiresAt)+'(한국 시간)까지예요. (결제 없음)'
          :'테스트용 무료 전환은 계정당 한 번이라 이미 사용했고 그 기간은 끝났어요. 다시 켜지 않았어요. (결제 없음)';
        return renderMain().then(function(){focusFirst('.ac-notice');});
      });
    });
    on('#acAuthForm', 'submit', function (ev) {
      ev.preventDefault();
      if ($('#acAuthSubmit').disabled) return;
      var email = $('#acEmail').value, pw = $('#acPw').value, name = $('#acName') ? $('#acName').value.trim() : '', msg = $('#acAuthMsg');
      if (!email || !pw) { msg.textContent = '이메일과 비밀번호를 넣어 주세요.'; return; }
      if (ui.authMode === 'signup' && checkedEmail!==emailKey()) { msg.textContent='이메일 중복 확인을 해 주세요.'; return; }
      if (ui.authMode === 'signup' && (!name || checkedName!==name)) { msg.textContent='닉네임 중복 확인을 해 주세요.'; return; }
      if (ui.authMode === 'signup' && [...pw].length < 10) { msg.textContent = MSG.weak_password; return; }
      var form=$('#acAuthForm'),check=$('#acRememberSession'),remember=!!(check&&!check.disabled&&check.checked&&rememberSupport().enabled);
      var authRequest=ui.authMode==='signup'?api.signup(email,pw,name||undefined):api.signin(email,pw,remember);
      withButton($('#acAuthSubmit'), msg, authRequest.catch(function(error){rememberFailure(error,form);throw error;}), function () {
        ui.hist = []; ui.histCursor = null; ui.notice = ui.authMode === 'signup' ? '가입했어요. 로그인하지 않고 남긴 이 기기의 기록은 지우지 않고 그대로 둬요.' : '로그인했어요.';
        if(ui.ctx.afterLogin){ui.ctx.afterLogin();return;}
        if(root.HanqAuthSession&&root.HanqAuthSession.resume())return;
        if(ui.authMode==='signup'&&ui.ctx.firstLesson){ui.ctx.firstLesson();return;}
        return renderMain().then(function () { focusFirst('.ac-notice') || focusFirst('#acMeTitle'); });
      });
    });
    on('#acNameForm', 'submit', function (ev) { ev.preventDefault(); var msg = $('#acNameMsg'); withButton(null, msg, api.updateProfile($('#acNewName').value), function (d) { var n = $('#acNameNow'); if (n) n.textContent = d.user.displayName; msg.textContent = '저장했어요.'; }); });
    on('#acPwForm', 'submit', function (ev) { ev.preventDefault(); var msg = $('#acPwMsg'), cur = $('#acPwCur').value, nw = $('#acPwNew').value; if ([...nw].length < 10) { msg.textContent = MSG.weak_password; return; } withButton(null, msg, api.changePassword(cur, nw), function (d) { $('#acPwCur').value = ''; $('#acPwNew').value = ''; msg.textContent = '바꿨어요. 다른 기기 로그인 ' + d.revokedOtherSessions + '개를 끝냈어요.'; }); });
    var pay = function (outcome) {
      var msg = $('#acPayMsg'), b1 = $('#acBuyTest'), b2 = $('#acBuyDecline');
      [b1, b2].forEach(function (b) { if (b) b.disabled = true; });
      msg.textContent = '처리 중이에요…';
      api.createOrder().then(function (o) { return api.confirmOrder(o.order.id, { testOutcome: outcome }); }).then(function (d) {
        ui.notice = d.grant ? '테스트 결제로 이용권을 받았어요: ' + kst(d.grant.grantedFrom) + ' → ' + kst(d.grant.grantedUntil) + '(한국 시간). 실제 결제는 아니에요.' : '이미 처리된 주문이에요.';
        return renderMain().then(function () { focusFirst('.ac-notice'); });
      }, function (e) { [b1, b2].forEach(function (b) { if (b) b.disabled = false; }); msg.textContent = errMsg(e); });
    };
    on('#acBuyTest', 'click', function () { pay('approve'); });
    on('#acBuyDecline', 'click', function () { pay('decline'); });
    var replay = function (order) { return function (ev) { withButton(ev.currentTarget, $('#acNotesMsg'), api.createReplay({ list: 'unresolved', order: order }), function (d) { ui.ctx.go('replay/' + d.replay.id); }); }; };
    on('#acReplayRecent', 'click', replay('recent'));
    [].slice.call(ui.container.querySelectorAll('.ac-part')).forEach(function(b){b.addEventListener('click',function(){
      if(b.disabled||ui.partPending)return;var flight={};ui.partPending=flight;
      var owner=api.state().ownerId,tok=ui.tok,part=b.getAttribute('data-part');
      [].slice.call(ui.container.querySelectorAll('.ac-part')).forEach(function(x){x.disabled=true;});
      api.createReplay({list:'all',order:'random',era:part,size:100}).then(function(d){
        if(tok===ui.tok&&api.state().ownerId===owner&&stillOn('notes'))ui.ctx.go('replay/'+d.replay.id);
      },function(e){if(tok===ui.tok&&api.state().ownerId===owner&&stillOn('notes')){var n=$('#acNotesMsg');if(n)n.textContent=errMsg(e);renderMain();}}).then(function(){if(ui.partPending===flight)ui.partPending=false;});
    });});
    on('#acStudyChallenge','click',function(ev){withButton(ev.currentTarget,$('#acNotesMsg'),api.study(),function(d){if(d.run)ui.ctx.go('study/'+d.run.id);else{var n=$('#acNotesMsg');if(n)n.textContent='도전에 사용할 문제가 없어요.';}});});
    on('#acNotesRefresh', 'click', function () { renderMain(); });
    on('#acToNotes', 'click', function () { ui.ctx.go('notes'); });
    [].slice.call(ui.container.querySelectorAll('.ac-open')).forEach(function (b) { b.addEventListener('click', function () { ui.ctx.go(b.getAttribute('data-go')); }); });
    on('#acHistMore', 'click', function (ev) { withButton(ev.currentTarget, null, api.attempts(ui.histCursor, 20), function (d) { ui.hist = ui.hist.concat(d.items); ui.histCursor = d.next; return renderMain(true); }); });
  }

  /* ---------- 서버 오답 다시 풀기 ---------- */
  function renderReplay(id) {
    var api = A(), tok = ++ui.tok;
    stopTimer(); busy(true);
    return api.replay(id).then(function (d) {
      if (tok !== ui.tok || !stillOn('replay/' + id)) return;
      busy(false);
      var items = d.items, n = items.length;
      if (!(id in ui.replayPos) || ui.replayPos[id] > n) { var f = items.findIndex(function (x) { return !x.result; }); ui.replayPos[id] = f < 0 ? n : f; }
      var pos = ui.replayPos[id];
      savePos();
      var setPos = function (p, focusSel) { ui.replayPos[id] = p; savePos(); renderReplay(id).then(function () { focusFirst(focusSel); }); };
      var jump = '<div class="quiz-jump"><label for="acRpJump">문제 바로 가기 (' + n + '문제)</label><select id="acRpJump">' + items.map(function (x, i) { return '<option value="' + i + '"' + (i === pos ? ' selected' : '') + '>' + (i + 1) + '번' + (x.result ? (x.result.correct ? ' · ✓ 맞힘' : ' · × 틀림') : ' · 아직') + '</option>'; }).join('') + '<option value="' + n + '"' + (pos >= n ? ' selected' : '') + '>결과 보기</option></select></div>';
      var head = '<section class="ac-sec ac-replay" aria-labelledby="acRpTitle"><h2 id="acRpTitle">파트별 반복연습</h2><p>새 채점은 성장점수에 반영 · 결과 열람은 점수 변동 없음</p><p class="ac-status">' + d.replay.answered + ' / ' + n + ' 답함 · ' + (d.replay.order === 'random' ? '무작위 순서' : '최근에 틀린 순서') + '</p>';
      if (pos >= n) {
        var right = items.filter(function (x) { return x.result && x.result.correct; }).length;
        paint(head + jump + '<p class="result-score">맞힌 문제 ' + right + ' / ' + items.filter(function (x) { return x.result; }).length + '</p>' + (items.some(function (x) { return !x.result; }) ? '<p>아직 답하지 않은 문제가 있어요. 위에서 골라 이어 풀 수 있어요.</p>' : '') + '<p>정답 여부와 풀이 이력은 저장돼요. 등록 문제 수는 그대로이고 즉시 다시 연습할 수 있어요.</p><div class="ac-row"><button type="button" class="check-one" id="acBackMain">내 계정으로</button><button type="button" class="tool-btn" id="acFirst">처음 문제부터 다시 보기</button><button type="button" class="check-one" id="acPracticeAgain">새로 다시 풀기</button></div></section>');
        on('#acBackMain', 'click', function () { ui.ctx.go('main'); });
        on('#acFirst', 'click', function () { setPos(0, '#acRpTitle'); });
      on('#acPracticeAgain','click',function(ev){withButton(ev.currentTarget,null,api.createReplay({list:'all',order:'random',era:d.replay.part||undefined,size:100}),function(x){ui.ctx.go('replay/'+x.replay.id);});});
        on('#acRpJump', 'change', function (ev) { setPos(Number(ev.currentTarget.value), '#acRpJump'); });
        focusFirst('#acRpTitle'); return;
      }
      var it = items[pos], res = it.result, sel = res ? res.optionId : ui.replaySel[id + ':' + pos] || null;
      paint(head + jump + '<p class="ac-pos">' + (pos + 1) + ' / ' + n + ' · ' + esc(title(it.kind, it.questionId)) + (it.kind === 'mock' && it.item.era ? ' · ' + esc(eraName(it.item.era)) : '') + '</p>' + questionHtml(it, sel, res, 'acRp') +
        (res ? '<div class="feedback show ' + (res.correct ? 'good' : 'bad') + '" aria-live="polite"><p><b>' + (res.correct ? '✓ 맞혔어요!' : '× 틀렸어요. 오답으로 남아요.') + '</b></p>' + reviewHtml(res.review, res.optionId, res.correctOptionId, 'replay-'+pos, it) + '</div>'
          : '<button type="button" class="check-one" id="acCheck"' + (sel ? '' : ' disabled') + '>정답 확인 (서버 채점)</button><p class="ac-err" id="acRpMsg" role="status"></p>') +
        '<div class="quiz-nav"><button type="button" class="prev-btn" id="acPrev"' + (pos === 0 ? ' disabled' : '') + '>← 이전</button><button type="button" class="next-btn" id="acNext">' + (pos === n - 1 ? '결과 보기 →' : '다음 →') + '</button></div>' +
        '<button type="button" class="tool-btn" id="acBackMain">그만 풀고 내 계정으로</button></section>');
      bindChoices(function (opt) { ui.replaySel[id + ':' + pos] = opt; renderReplay(id).then(function () { var b = ui.container.querySelector('.ac-choice[data-option="' + opt + '"]'); if (b) b.focus(); }); });
      on('#acCheck', 'click', function (ev) {
        var key = id + ':' + pos; ui.replaySubs[key] = ui.replaySubs[key] || api.newSubmissionId('rp');
        withButton(ev.currentTarget, $('#acRpMsg'), api.answerReplay(id, pos, sel, ui.replaySubs[key]), function () { if (!stillOn('replay/' + id)) return null; return renderReplay(id).then(function () { focusFirst('.feedback'); }); });
      });
      on('#acPrev', 'click', function () { setPos(Math.max(0, pos - 1), '#acRpTitle'); });
      on('#acNext', 'click', function () { setPos(pos + 1, '#acRpTitle'); });
      on('#acRpJump', 'change', function (ev) { setPos(Number(ev.currentTarget.value), '#acRpJump'); });
      on('#acBackMain', 'click', function () { ui.ctx.go('main'); });
    }, function (e) { if (tok !== ui.tok || !stillOn('replay/' + id)) return; busy(false); failView(e); });
  }

  /* ---------- 시간제 오답 복습: 고른 답은 임시(draft), 이동·제출 때만 서버에 저장 ----------
     고르기·바꾸기·지우기는 화면만 바꾸고 요청하지 않는다. 다음·이전·바로 가기·제출은 먼저 임시 답을 기존 answerRun으로 저장하고, 서버 확인(ACK) 뒤에만 움직인다.
     임시 답은 계정+회차+번호+문항 ID+버전으로 묶어 sessionStorage('hanqacct:rundraft:<계정>:<회차>')에만 둔다(토큰·서버 기록·점수 없음).
     못 쓰면 이 탭 메모리에만 두고 그렇다고 알린다. 다른 키는 지우지 않는다. 서버가 확인한 답(items.answerOptionId)과 임시 답은 따로 보인다. */
  var RUN_DRAFT_PREFIX = 'hanqacct:rundraft:';
  function runOwner() { var api = A(), st = api && api.state(), o = st && st.signedIn ? st.ownerId || (st.user && st.user.id) : null; return typeof o === 'string' && o ? o : null; }
  function runSession() { var o = runOwner(), st = o && A().state(); return o ? o + '|' + st.epoch : null; }
  function runDraftKey(owner, id) { return RUN_DRAFT_PREFIX + owner + ':' + id; }
  function readRunDrafts(owner, id) {
    var key = runDraftKey(owner, id), out = {};
    if (ui.runDraftMem && ui.runDraftMem[key]) { Object.keys(ui.runDraftMem[key]).forEach(function (k) { out[k] = ui.runDraftMem[key][k]; }); return out; }
    var s = sstore(), raw = null; try { raw = s ? s.getItem(key) : null; } catch (e) { raw = null; }
    if (!raw) return out;
    try {
      var d = JSON.parse(raw);
      if (d && d.schema === 1 && d.owner === owner && d.run === id && d.items && typeof d.items === 'object' && !Array.isArray(d.items))
        Object.keys(d.items).forEach(function (k) { var x = d.items[k]; if (/^\d{1,3}$/.test(k) && x && typeof x.q === 'string' && typeof x.v === 'string' && (x.o === null || typeof x.o === 'string')) out[k] = { q: x.q, v: x.v, o: x.o }; });
    } catch (e) { /* 깨진 값: 읽지 않음(지우지도 않음 — 다음 저장 때 이 회차 키만 새로 씀) */ }
    return out;
  }
  function writeRunDrafts(owner, id, items) {
    var key = runDraftKey(owner, id), s = sstore(), ok = false;
    try { if (s) { if (Object.keys(items).length) s.setItem(key, JSON.stringify({ schema: 1, owner: owner, run: id, items: items })); else s.removeItem(key); ok = true; } } catch (e) { ok = false; }
    ui.runDraftMem = ui.runDraftMem || {};
    if (ok) delete ui.runDraftMem[key]; else { ui.runDraftMem[key] = items; ui.runDraftWarn = true; }
    return ok;
  }
  function runOptionIds(it) { return (it.optionOrder && it.optionOrder.length ? it.optionOrder : ((it.item && it.item.options) || []).map(function (o) { return o.id; })).slice(); }
  function validRunDraft(it, x) { return !!(it && x && x.q === it.questionId && x.v === String(it.version) && (x.o === null || runOptionIds(it).indexOf(x.o) >= 0)); }

  /* ---------- 서버 오답 모의고사 ---------- */
  function renderRun(id, focusSel) {
    var api = A(), tok = ++ui.tok;
    stopTimer(); busy(true);
    return api.run(id).then(function (d) { if (tok !== ui.tok || !stillOn('run/' + id)) return; busy(false); paintRun(id, d, focusSel); }, function (e) { if (tok !== ui.tok || !stillOn('run/' + id)) return; busy(false);if(e.code==='premium_required'){ui.ctx.go('notes');return;}failView(e); });
  }
  /* 시작·답 저장·제출 응답: 그 모의고사 화면이 아직 열려 있을 때만 그린다(떠난 뒤 온 응답은 버림 — 서버에는 이미 저장됨) */
  function runResult(id, focusSel) { return function (x) { if (stillOn('run/' + id)) paintRun(id, x, focusSel); return x; }; }
  function paintRun(id, d, focusSel) {
    stopTimer();
    var api = A(), run = d.run, items = d.items, n = items.length;
    ui.offset = Date.parse(run.serverTime) - Date.now();
    if(ui.expiryTimer)clearTimeout(ui.expiryTimer);
    var premium=api.state().premium,expiry=premium&&Date.parse(premium.expiresAt);
    if(Number.isFinite(expiry)){var remaining=expiry-Date.parse(run.serverTime);if(remaining<=0){ui.ctx.go('notes');return;}var expiryAnchor=root.performance.now();var watchExpiry=function(){if(!stillOn('run/'+id))return;var left=remaining-(root.performance.now()-expiryAnchor);if(left>0){ui.expiryTimer=setTimeout(watchExpiry,Math.min(left,2147483647));return;}ui.tok++;stopTimer();paint('<p role="status">이용권이 만료돼 기록 화면을 닫았어요.</p>');ui.ctx.go('notes');};ui.expiryTimer=setTimeout(watchExpiry,Math.min(remaining,2147483647));}

    if(!ui.clock||ui.clock.id!==id||ui.clock.serverTime!==run.serverTime)ui.clock={id:id,serverTime:run.serverTime,anchor:root.performance.now(),serverNow:Date.parse(run.serverTime)};var clockAnchor=ui.clock,now=function(){return clockAnchor.serverNow+root.performance.now()-clockAnchor.anchor;};
    if(run.selection && run.selection.mode==='wrong-note-study' && run.status==='active' && now()<Date.parse(run.startedAt)){
      var lastCount=-1;var tick=function(){if(!stillOn('run/'+id)){stopTimer();return;}var ms=Date.parse(run.startedAt)-now();if(ms<=0){stopTimer();renderRun(id);return;}var count=Math.ceil(ms/1000);if(count===lastCount)return;lastCount=count;paint('<section class="ac-sec ac-countdown" aria-live="polite"><h2>오답 복습을 시작해요</h2><p>'+n+'문항 · 30분</p><strong class="result-score">'+count+'</strong></section>');};tick();ui.timer=setInterval(tick,100);return;
    }
    var sel = run.selection || {}, mins = run.durationMs / 60000;
    var head = '<section class="ac-sec ac-run" aria-labelledby="acRunTitle" data-status="' + esc(run.status) + '"><h2 id="acRunTitle">' + esc(run.title) + '</h2>';
    var comp = '퀴즈·확인문제 오답 ' + (sel.selectedQuiz || 0) + ' · 기출 오답 ' + (sel.selectedMock || 0) + ' · 최신 기출 보충 ' + (sel.fill || 0) + ' (모두 ' + n + '문제)';
    if (run.status === 'ready') {
      paint(head + '<ul class="ac-facts"><li>' + esc(comp) + '</li><li>시간 ' + mins + '분' + (run.durationPolicy === 'practice' ? ' (HanQ 연습 시간)' : ' (한국사능력검정시험 심화와 같은 시간)') + '</li><li>시작하면 서버가 마감 시각을 정해요. 화면을 떠나도 시간은 흐르고, 마감이 지나면 그때까지 저장된 답으로 서버가 채점해요.</li><li>답은 다음이나 다른 문제로 이동할 때 저장돼요. 마지막 답은 제출할 때 저장돼요.</li><li>점수는 기출 원래 배점과 퀴즈 1점을 더한 연습 점수예요(공식 점수 아님).</li></ul>' + (sel.shortBy ? '<p>보충할 기출이 모자라 ' + n + '문제예요.</p>' : '') +
        '<button type="button" class="check-one" id="acRunStart">시작하기</button><p class="ac-err" id="acRunMsg" role="status"></p></section>');
      on('#acRunStart', 'click', function (ev) { withButton(ev.currentTarget, $('#acRunMsg'), api.startRun(id), runResult(id, '.ac-choice')); });
      focusFirst(focusSel || '#acRunTitle'); return;
    }
    if (run.status === 'final') {
      var fo=runOwner();if(fo)writeRunDrafts(fo,id,{}); // 채점이 끝난 회차의 임시 답은 다시 쓰지 않는다
      var S=run.score||{}, missed=items.filter(function(x){return !x.result || !x.result.correct;});
      var textOf=function(it,id){if(!id)return '미응답';var o=(it.item.options||[]).filter(function(x){return x.id===id;})[0];return o&&o.text?o.text:SYM[Number((/-option-([1-5])$/.exec(id)||[])[1])]||'보기 확인';};
      var rows=missed.map(function(it){var r=it.result||{};return '<article class="review-item"><h3>'+(it.position+1)+'번 · '+esc(title(it.kind,it.questionId))+'</h3><p>내 답: '+esc(textOf(it,it.answerOptionId))+' · 정답: '+esc(textOf(it,r.correctOptionId))+'</p>'+questionHtml(it,it.answerOptionId,{correctOptionId:r.correctOptionId,optionId:it.answerOptionId,correct:r.correct},'acRv'+it.position)+reviewHtml(r.review,it.answerOptionId,r.correctOptionId,'study-'+it.position,it)+'</article>';}).join('');
      var groups={};missed.forEach(function(it){var targets=ui.ctx.summaryTargets?ui.ctx.summaryTargets(it):[];if(!targets.length){var k='unknown';groups[k]=groups[k]||{label:'복습 위치 정보가 없는 문제',count:0};groups[k].count++;}targets.forEach(function(t){var key=t.era+'|'+(t.target||'');groups[key]=groups[key]||Object.assign({count:0},t);groups[key].count++;});});
      var sorted=Object.values(groups).sort(function(a,b){return b.count-a.count||a.label.localeCompare(b.label,'ko');});
      var links=sorted.map(function(t){return '<li><b>'+esc(t.label)+' · '+t.count+'문제</b>'+(t.era?'<button type="button" class="tool-btn ac-summary" data-era="'+esc(t.era)+'" data-target="'+esc(t.target||'')+'">요약에서 복습하기</button>':'<p>문제별 해설을 먼저 확인해 주세요.</p>')+'</li>';}).join('');
      var elapsed=Math.max(0,Math.min(run.durationMs,Date.parse(run.finalAt)-Date.parse(run.startedAt)));
      var SS=studyScore(S);paint(head+(SS&&SS.exam!==null?'<div class="result-score">시험점수 '+SS.exam+' / 100점</div>':'')+'<p class="ac-study-reward">'+(SS&&SS.reward!==null&&SS.exam!==null?'성장점수 <b>'+(SS.reward>0?'+':'')+SS.reward+'점</b> — 시험점수 '+SS.exam+'점('+SS.correct+'/'+SS.total+'문항 정답) · '+(SS.perQuestion?'문항별 정답 가점 · 오답 감점 · 미응답 0':bandText(SS.exam))+' · 회차당 한 번 정산<br><small>'+(SS.perQuestion?'일반 ±1 · 기출 원본 배점 · 보유 점수까지만 차감':STUDY_BANDS)+'</small>':S.rewardEligible?'성장점수는 서버 기록을 확인해 주세요(이 회차의 저장된 점수 정보가 완전하지 않아요).':'성장점수 변동 없음 · 20문항 미만 복습은 보상·차감·도전 횟수 제외')+'</p><div class="result-score">정답 '+(S.correct||0)+' / '+n+'</div><p>오답 '+Math.max(0,(S.wrong||0)-(S.unanswered||0))+' · 미응답 '+(S.unanswered||0)+' · 소요 시간 '+clock(elapsed)+'</p><p>'+(run.finalReason==='expired'?'30분이 끝나 저장된 답으로 자동 채점했어요.':'제출한 답으로 채점했어요.')+'</p><h3>틀린 문제와 해설</h3>'+(rows||'<p class="wn-clear">모두 맞혔어요!</p>')+'<section class="ac-review-guide"><h3>이 부분을 복습해 주세요</h3>'+(links?'<ul class="ac-list">'+links+'</ul>':'<p>이번 회차에 복습할 오답이 없어요.</p>')+'</section><button type="button" class="tool-btn" id="acBackMain">메인 메뉴로</button></section>');
      [].slice.call(ui.container.querySelectorAll('.ac-summary')).forEach(function(b){b.addEventListener('click',function(){ui.ctx.goSummary(b.dataset.era,b.dataset.target);});});
      on('#acBackMain','click',function(){ui.ctx.go('home');});focusFirst(focusSel||'#acRunTitle');return;
    }
    var renderToken=ui.tok;var owner = runOwner(), sess = runSession(), drafts = owner ? readRunDrafts(owner, id) : {}, dirty = false;
    Object.keys(drafts).forEach(function (k) { var x = drafts[k], it0 = items[Number(k)]; if (!validRunDraft(it0, x) || x.o === (it0.answerOptionId || null)) { delete drafts[k]; dirty = true; } }); // 다른 문항·버전·보기, 이미 저장된 답과 같은 값은 버림
    if (dirty && owner) writeRunDrafts(owner, id, drafts);
    var pos = Math.min(n - 1, Math.max(0, ui.runPos[id] || 0)), it = items[pos], draft = drafts[pos], sel = draft ? draft.o : it.answerOptionId;
    var done = items.filter(function (x) { return x.answerOptionId; }).length, unsaved = Object.keys(drafts).length;
    var left = function () { return Date.parse(run.endsAt) - now(); };
    var cf = ui.runConfirm ? '<div class="rc-confirm" role="alertdialog" aria-labelledby="acCfT" aria-describedby="acCfD"><p id="acCfT"><b>제출할까요?</b></p><p id="acCfD">' + (n - done ? '아직 답하지 않은 문제 ' + (n - done) + '개는 틀린 것으로 채점해요. ' : '') + '제출하면 답을 바꿀 수 없어요.</p><div class="rc-confirm-actions"><button type="button" class="check-one" id="acCfYes">제출하고 채점하기</button><button type="button" class="tool-btn" id="acCfNo">계속 풀기</button></div></div>' : '';
    var mark = draft ? (draft.o ? '고른 답 · 아직 저장 전' : '답 지움 · 아직 저장 전') : (it.answerOptionId ? '저장된 답' : '');
    paint(head + '<div class="rc-bar"><p class="rc-time">남은 시간 <b id="acTimer" role="timer">' + clock(left()) + '</b></p><p class="rc-count">답한 문제 ' + done + ' / ' + n + (unsaved ? ' · 저장 전 ' + unsaved : '') + '</p></div>' +
      '<div class="quiz-jump"><label for="acJump">문제 바로 가기 (' + n + '문제)</label><select id="acJump">' + items.map(function (x, i) { return '<option value="' + i + '"' + (i === pos ? ' selected' : '') + '>' + (i + 1) + '번' + (drafts[i] ? ' · 저장 전' : x.answerOptionId ? ' · 답함' : '') + '</option>'; }).join('') + '</select></div>' +
      '<p class="ac-pos">' + (pos + 1) + ' / ' + n + ' · ' + esc(title(it.kind, it.questionId)) + (it.reviewState?' · 출제 '+it.reviewState.exposure_count+'회':'') + '</p>' + questionHtml(it, sel, null, 'acRn') +
      (mark ? '<p class="ac-draft-mark' + (draft ? ' is-draft' : '') + '" id="acDraftMark">' + mark + '</p>' : '') +
      (sel ? '<button type="button" class="tool-btn" id="acClear">고른 답 지우기</button>' : '') + '<p class="ac-err" id="acRunMsg" role="status">' + (ui.runDraftWarn ? '이 브라우저에 임시 답을 보관할 수 없어 이 탭에서만 기억해요.' : '') + '</p>' +
      '<div class="quiz-nav"><button type="button" class="prev-btn" id="acPrev"' + (pos === 0 ? ' disabled' : '') + '>← 이전</button><button type="button" class="next-btn" id="' + (pos === n - 1 ? 'acSubmit' : 'acNext') + '">' + (pos === n - 1 ? '제출하기' : '다음 →') + '</button></div>' + cf + '</section>');
    var alive = function () { return ui.tok===renderToken && stillOn('run/' + id) && runOwner() === owner && runSession() === sess; };
    var msg = function (t) { var m = $('#acRunMsg'); if (m) m.textContent = t; };
    var freeze = function (on) { [].slice.call(ui.container.querySelectorAll('.ac-run button, .ac-run select')).forEach(function (b) { b.disabled = on; }); if (!on) { var pv = $('#acPrev'); if (pv) pv.disabled = pos === 0; } };
    var setDraft = function (opt) { if (!owner) return; var cur = readRunDrafts(owner, id); if (opt === (it.answerOptionId || null)) delete cur[pos]; else cur[pos] = { q: it.questionId, v: String(it.version), o: opt }; writeRunDrafts(owner, id, cur); };
    /* 임시 답 하나 저장: 요청 내용(번호·보기)은 보낼 때 고정. 같은 회차 저장 중이면 그 요청을 같이 기다린다(중복 요청 없음).
       ACK가 오면 그때의 임시 답이 보낸 값과 같을 때만 지운다(그 사이 더 새로 고른 답은 남음). 마감이 지났으면 보내지 않는다 */
    var flushOne = function (p) {
      if (ui.runFlight && ui.runFlight.id === id) return ui.runFlight.promise;
      var x = readRunDrafts(owner, id)[p]; if (!x) return Promise.resolve(null);
      if (left() <= 0) return Promise.reject({ code: 'run_expired' });
      var req = { pos: p, opt: x.o, q: x.q, v:x.v }, f = { id: id };
      f.promise = Promise.resolve().then(function () { if(!alive())throw {code:'session_changed'};return api.answerRun(id, req.pos, req.opt); }).then(function (res) {
        var r = res && res.items && res.items[req.pos];
        if (!res || !res.run || res.run.id !== id || !r || r.questionId !== req.q || String(r.version)!==req.v || (r.answerOptionId || null) !== req.opt) throw { code: 'invalid_response' };
        if (runOwner() === owner && runSession() === sess) { var cur = readRunDrafts(owner, id), y = cur[req.pos]; if (y && y.q === req.q && y.v===req.v && y.o === req.opt) { delete cur[req.pos]; writeRunDrafts(owner, id, cur); } }
        return res;
      });
      ui.runFlight = f;
      f.promise.then(function () { if (ui.runFlight === f) ui.runFlight = null; }, function () { if (ui.runFlight === f) ui.runFlight = null; });
      return f.promise;
    };
    var flushAll = function () { var keys = Object.keys(readRunDrafts(owner, id)).map(Number).sort(function (a, b) { return a - b; }), last = null, i = 0;
      var step = function () { if(!alive())return Promise.reject({code:'session_changed'});if (i >= keys.length) return Promise.resolve(last); return flushOne(keys[i++]).then(function (r) { if (r) last = r; return step(); }); }; return step(); };
    var fail = function (e) {
      if (!alive()) return;
      if (e && e.code === 'premium_required') { ui.ctx.go('notes'); return; }
      if (e && (e.code === 'run_expired' || e.code === 'run_final')) { renderRun(id, '#acRunTitle'); return; } // 서버의 최종 상태만 믿는다(임시 답을 저장했다고 하지 않음)
      freeze(false); var j = $('#acJump'); if (j) j.value = String(pos);
      msg('답을 저장하지 못했어요' + (e && e.code ? '(' + errMsg(e).replace(/[.]$/, '') + ')' : '') + '. 고른 답은 그대로예요. 다시 누르면 같은 답으로 저장해요.');
    };
    var hasDrafts = function () { return !!owner && Object.keys(readRunDrafts(owner, id)).length > 0; };
    bindChoices(function (opt) { if (ui.runSubmitting === id || left() <= 0) return; setDraft(opt); if (ui.runFlight && ui.runFlight.id === id) return; paintRun(id, d, '.ac-choice[data-option="' + opt + '"]'); });
    on('#acClear', 'click', function () { if (ui.runSubmitting === id || (ui.runFlight && ui.runFlight.id === id)) return; setDraft(null); paintRun(id, d, '.ac-choice'); });
    var go = function (p, focusSel) {
      if (ui.runSubmitting === id || (ui.runFlight && ui.runFlight.id === id)) return;
      ui.runConfirm = false;
      if (!hasDrafts()) { ui.runPos[id] = p; savePos(); paintRun(id, d, focusSel); return; } // 바뀐 답이 없으면 요청 없이 이동
      if (left() <= 0) { renderRun(id, '#acRunTitle'); return; }
      freeze(true); msg('답을 저장하는 중이에요…');
      flushAll().then(function (res) { if (!alive()) return; ui.runPos[id] = p; savePos(); paintRun(id, res || d, focusSel); }, fail);
    };
    on('#acJump', 'change', function (ev) { go(Number(ev.currentTarget.value), '#acJump'); });
    on('#acPrev', 'click', function () { go(pos - 1, pos - 1 > 0 ? '#acPrev' : '#acNext'); });
    on('#acNext', 'click', function () { go(pos + 1, pos + 1 < n - 1 ? '#acNext' : '#acSubmit'); });
    /* 마지막 ‘제출하기’: 먼저 남은 임시 답을 저장(실패하면 제출 확인으로 가지 않음) → 기존 확인 창 → ‘제출하고 채점하기’에서 그 사이 바뀐 답이 있으면 한 번 더 저장 → submitRun 한 번 */
    on('#acSubmit', 'click', function () {
      if (ui.runSubmitting === id || (ui.runFlight && ui.runFlight.id === id) || ui.runConfirm) return;
      if (left() <= 0) { renderRun(id, '#acRunTitle'); return; }
      if (!hasDrafts()) { ui.runConfirm = true; paintRun(id, d, '#acCfNo'); return; }
      freeze(true); msg('마지막 답을 저장하는 중이에요…');
      flushAll().then(function (res) { if (!alive()) return; ui.runConfirm = true; paintRun(id, res || d, '#acCfNo'); }, fail);
    });
    on('#acCfNo', 'click', function () { if (ui.runSubmitting === id) return; ui.runConfirm = false; paintRun(id, d, '#acSubmit'); });
    on('#acCfYes', 'click', function (ev) {
      if (ui.runSubmitting === id || (ui.runFlight && ui.runFlight.id === id)) return;
      ui.runSubmitting = id; ui.runConfirm = false;
      var yes = ev.currentTarget, cancel = $('#acCfNo'), submit = $('#acSubmit');
      [yes, cancel, submit].forEach(function (b) { if (b) b.disabled = true; }); msg('제출하는 중이에요…');
      Promise.resolve().then(function () { if(!alive())throw {code:'session_changed'};if (left() <= 0) throw { code: 'run_expired' };if(!hasDrafts())return null;return flushAll(); })
        .then(function () { if(!alive())throw {code:'session_changed'};return api.submitRun(id); })
        .then(function (res) { if (ui.runSubmitting === id) ui.runSubmitting = null; if (alive()) paintRun(id, res, '#acRunTitle'); },
          function (e) { if (ui.runSubmitting === id) ui.runSubmitting = null; if (!alive()) return; if (e && (e.code === 'run_expired' || e.code === 'run_final' || e.code === 'premium_required')) { fail(e); return; } [yes, cancel, submit].forEach(function (b) { if (b) b.disabled = false; }); msg(errMsg(e)); });
    });
    var c0 = ui.container;
    ui.timer = setInterval(function () {
      if (!c0 || !c0.isConnected || !c0.querySelector('.ac-run[data-status="active"]')) { stopTimer(); return; }
      var ms = left(), t = c0.querySelector('#acTimer'); if (t) t.textContent = clock(ms);
      if (ms <= 0) { stopTimer(); if (stillOn('run/' + id)) renderRun(id, '#acRunTitle'); }
    }, 1000);
    focusFirst(focusSel || '#acRunTitle');
  }

  /* 불러오기 자체가 끝나지 못했을 때(동기 예외·그리기 오류 등): 진행 표시를 끄고 짧은 안내와 ‘다시 연결하기’ 하나. 로그인 흔적·학습 기록은 건드리지 않는다 */
  function connFail(e, retry) {
    stopTimer(); busy(false);
    paint('<section class="ac-sec ac-conn-fail" role="alert"><p>' + errMsg(e) + '</p><button type="button" class="tool-btn" id="acConnectionRetry">다시 연결하기</button></section>');
    on('#acConnectionRetry', 'click', retry);
  }
  function failView(e) {
    stopTimer();
    paint('<section class="ac-sec"><h2 id="acFailTitle">열 수 없어요</h2><p>' + errMsg(e) + '</p><button type="button" class="check-one" id="acBackMain">내 계정으로</button></section>');
    on('#acBackMain', 'click', function () { ui.ctx.go('main'); });
    focusFirst('#acFailTitle');
  }

  if(root.document)root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden && /^run\//.test(ui.view||'') && ui.container && ui.container.isConnected)renderRun(ui.view.slice(4));});

  /* ---------- 바깥(index.html)에서 쓰는 창구 ---------- */
  var VIEW = /^(main|toeic-records|notes|study\/[0-9a-f-]{36}|replay\/[0-9a-f-]{36})$/;
  function normView(v) { return typeof v === 'string' && VIEW.test(v) ? v : 'main'; }
  function render(container, ctx) {
    ui.container = container; ui.ctx = ctx || {};
    var v = normView(ui.ctx.view), api = A();
    ui.view = v.indexOf('study/') === 0 ? 'run/' + v.slice(6) : v;
    if (ui.view !== 'main' && ui.petSay) { clearTimeout(ui.petSay.timer); ui.petSay = null; } // 마이페이지를 떠나면 말풍선 타이머·상태 정리
    if (!api || !api.enabled()) return renderMain();
    watchOwner();
    var pendingState=api.state();
    if(!pendingState.signedIn&&(pendingState.restoring||api.hasSessionHint&&api.hasSessionHint())){
      paint('<section class="ac-sec" id="acRestorePanel"><h2>로그인 복원 중</h2><p role="status" id="acRestoreStatus">서버에서 기존 로그인을 확인하고 있어요. 응답이 없으면 다시 확인할 수 있어요.</p><button class="tool-btn" type="button" disabled>연결 확인 중…</button><details><summary>직접 로그인하기</summary>'+authHtml()+'</details></section>');bindMain(pendingState);
    }else paint('<p role="status">로그인 정보를 확인하고 있어요…</p>');
    var ready; try { ready = Promise.resolve(api.ensureSession?api.ensureSession(true):api.init()); } catch (e) { ready = Promise.reject(e); }
    var rseq = ui.renderSeq = (ui.renderSeq || 0) + 1; // 이 render()가 아직 가장 최근일 때만 실패 화면을 그린다
    ready = ready.then(function () { ui.inited = true; }, function () { ui.inited = true; });
    return ready.then(function () {
      if (ui.renderSeq !== rseq || ui.container !== container || !container.isConnected) return;
      var s1 = api.state();if(!s1.signedIn&&s1.sessionError==='refresh_outcome_uncertain'){busy(false);paint('<p role="status">로그인 복원 결과를 확인하지 못했어요. 안전하게 다시 로그인해 주세요. 학습 기록은 보존돼요.</p>'+authHtml());bindMain(s1);return;}if(!s1.signedIn&&s1.sessionError==='session_coordination_unavailable'){busy(false);paint('<p role="status">다른 탭에서 로그인이 바뀌었어요. 이 브라우저는 탭 사이의 안전한 동시 복원을 지원하지 않아 직접 로그인해야 해요.</p>'+authHtml());bindMain(s1);return;}if(!s1.signedIn && api.hasSessionHint && api.hasSessionHint() && (s1.status==='offline'||s1.sessionError)){busy(false);paint('<p role="alert">네트워크 연결을 확인해 주세요. 로그인 기록은 유지돼요. 연결을 다시 확인하거나 아래에서 로그인할 수 있어요.</p><button type="button" class="tool-btn" id="acRestoreRetry">연결 다시 확인</button>'+authHtml());bindMain(s1);on('#acRestoreRetry','click',function(){render(ui.container,ui.ctx);});return;}var owner = s1.signedIn && s1.user ? s1.user.id : null;
      if (owner !== ui.ownerId) resetOwnerState(owner);
      if (v === 'main' || v === 'toeic-records' || v === 'notes') return renderMain();
      if(s1.premium&&!s1.premium.active){ui.notice='이용권이 만료됐어요. 기록은 보존돼요.';ui.ctx.go('notes');return;}
      if (!api.state().signedIn) { ui.notice = '로그인한 뒤 열 수 있어요.'; return renderMain(); }
      return v.indexOf('replay/') === 0 ? renderReplay(v.slice(7)) : renderRun(v.slice(6));
    }).then(null, function (e) { if (ui.renderSeq !== rseq || ui.container !== container || !container.isConnected) return; connFail(e, function () { render(container, ui.ctx); }); });
  }
  /* 나만의 오답노트 위에 붙는 짧은 안내(서버 연결이 켜졌을 때만) */
  function notesBannerHtml() {
    var api = A(); if (!api || !api.enabled()) return '';
    var st = api.state(), prem = st.premium && st.premium.active;
    var text = !st.signedIn ? '무료 체험은 이 기기에, 프리미엄 풀이는 회원 기록에 저장돼요.'
      : prem ? '프리미엄 이용 중이에요. 오답 다시 풀기와 오답 모의고사는 ‘내 계정’에서 서버로 풀어요. 여기 목록은 이 기기의 기록이에요(서버로 보내려면 ‘내 계정’의 가져오기).'
        : '오답 다시 풀기와 오답 모의고사는 프리미엄(1개월 5,000원)이 있어야 해요. 여기 목록은 이 기기의 기록이고 그대로 볼 수 있어요(서버로 보내려면 ‘내 계정’의 가져오기).';
    return '<div class="ac-banner" role="note"><p>' + esc(text) + '</p><button type="button" class="tool-btn" id="acNotesGo">' + (st.signedIn ? '내 계정 · 서버 오답노트' : '로그인 · 회원가입') + '</button></div>';
  }
  function gateNotice(kind) {
    ui.notice = kind === 'run' ? '서버 연결이 켜져 있어 오답 모의고사는 로그인 + 프리미엄으로 서버에서 만들어요(이 기기의 예전 모의고사는 그대로 열 수 있어요).'
      : '서버 연결이 켜져 있어 오답 다시 풀기는 로그인 + 프리미엄으로 서버에서 풀어요. 이 기기의 오답 목록은 그대로 볼 수 있어요.';
  }

  root.HanqAccountUI = { logout: logout, render: render, normView: normView, notesBannerHtml: notesBannerHtml, gateNotice: gateNotice, stop: function(){stopTimer();clearPet();if(root.HanqInquiries)root.HanqInquiries.stop();if(root.HanqMyRecords)root.HanqMyRecords.stop();if(root.HanqCharacters&&root.HanqCharacters.stop)root.HanqCharacters.stop();}, _ui: ui, _questionHtml: questionHtml, _errMsg: errMsg };
})(typeof window !== 'undefined' ? window : globalThis);
