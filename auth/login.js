(function () {
  'use strict';
  var form = document.getElementById('form'), message = document.getElementById('message');
  var submit = document.getElementById('submit'), toggle = document.getElementById('toggle');
  var password = document.getElementById('password'), passwordToggle = document.getElementById('passwordToggle');
  var remember = document.getElementById('remember'), rememberHint = document.getElementById('rememberHint');
  var signup = false, busy = false, rememberEnabled = false;
  function hasLocks() { return !!(navigator.locks && typeof navigator.locks.request === 'function'); }
  function lock(fn) { return hasLocks() ? navigator.locks.request('hanq:auth:cookie', fn) : fn(); }
  async function auth(action, body) {
    if (action === 'refresh' && !hasLocks()) {
      try { if (localStorage.getItem('hanqacct:retentionMode') === 'remember-90d') throw new Error('session_coordination_unavailable'); }
      catch (e) { if (e.message === 'session_coordination_unavailable') throw e; }
    }
    return lock(async function () {
      var r = await fetch('/api/v1/auth/' + action, { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: { 'Content-Type': 'application/json', 'X-HanQ-CSRF': '1' }, body: JSON.stringify(body || {}) });
      var d = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(d.error && d.error.code || 'request_failed');
      if (d.accessToken) {
        try { localStorage.setItem('hanqacct:signedIn', '1'); if (d.retentionMode === 'remember-90d') localStorage.setItem('hanqacct:retentionMode', d.retentionMode); else localStorage.removeItem('hanqacct:retentionMode'); } catch (_) {}
      }
      return d;
    });
  }
  function entered() { location.replace('/' + location.hash); }
  function explain(e) {
    return { membership_pending: '가입 승인 대기 중입니다. 관리자 승인 후 로그인해 주세요.', membership_rejected: '가입 요청이 승인되지 않았습니다.', invalid_credentials: '이메일 또는 비밀번호를 확인해 주세요.', email_taken: '이미 등록된 이메일입니다. 로그인하거나 승인을 기다려 주세요.', nickname_taken: '이미 사용 중인 닉네임입니다.', weak_password: '비밀번호가 너무 약합니다. 더 긴 비밀번호를 사용해 주세요.', too_many_failed_signins: '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.', session_coordination_unavailable: '이 브라우저에서는 로그인 유지를 사용할 수 없어요. 일반 로그인을 이용해 주세요.' }[e.message] || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  function renderRemember() {
    var show = rememberEnabled && !signup;
    remember.disabled = !show;
    document.getElementById('rememberLabel').hidden = !show;
    rememberHint.hidden = !show;
    if (!show) remember.checked = false;
  }
  // Only offer the opt-in with explicit server and browser support.
  async function checkRemember() {
    if (!hasLocks()) return;
    try {
      var response = await fetch('/api/v1/premium/plan', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (!response.ok) return;
      var plan = await response.json(), capability = plan && plan.auth && plan.auth.rememberMe;
      if (hasLocks() && capability && capability.available === true && capability.maxDays === 90) {
        rememberEnabled = true;
        renderRemember();
      }
    } catch (_) { /* Ordinary login is independent of capability lookup. */ }
  }
  passwordToggle.onclick = function () {
    var show = password.type === 'password'; password.type = show ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', String(show)); passwordToggle.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 표시');
  };
  toggle.onclick = function () {
    if (busy) return;
    signup = !signup;
    document.getElementById('nicknameLabel').hidden = !signup;
    renderRemember();
    document.getElementById('signupHint').hidden = !signup;
    password.type = 'password'; password.autocomplete = signup ? 'new-password' : 'current-password';
    passwordToggle.setAttribute('aria-pressed', 'false'); passwordToggle.setAttribute('aria-label', '비밀번호 표시');
    document.getElementById('email').autocomplete = signup ? 'email' : 'username';
    document.getElementById('authTitle').textContent = signup ? '회원가입' : '로그인';
    document.getElementById('authKicker').textContent = signup ? 'NEW TAMER' : 'WELCOME BACK';
    document.getElementById('authDescription').textContent = signup ? '함께 공부할 이름을 알려 주세요.' : '이어서, 나만의 모험을 시작해요.';
    document.getElementById('toggleHint').textContent = signup ? '이미 계정이 있나요?' : '파일섬이 처음인가요?';
    submit.textContent = signup ? '가입 요청 보내기' : '로그인';
    toggle.textContent = signup ? '로그인으로 돌아가기' : '가입 요청'; message.textContent = '';
    document.getElementById('email').focus();
  };
  form.onsubmit = async function (e) {
    e.preventDefault(); if (busy) return;
    busy = true; submit.disabled = toggle.disabled = true; submit.setAttribute('aria-busy', 'true'); message.textContent = '확인 중…';
    try {
      var data = { email: document.getElementById('email').value, password: password.value };
      if (signup) {
        if (document.getElementById('nickname').value.trim()) data.displayName = document.getElementById('nickname').value.trim();
        var r = await auth('signup', data); if (r.status !== 'pending') throw new Error('invalid_response');
        message.textContent = '가입 요청을 보냈습니다. ADMIN 승인 후 로그인해 주세요.'; password.value = '';
      } else {
        if (rememberEnabled && !remember.disabled && remember.checked) { if (!hasLocks()) throw new Error('session_coordination_unavailable'); data.rememberMe = true; }
        await auth('signin', data); entered();
      }
    } catch (err) {
      if (!signup && err.message === 'remember_unavailable') {
        rememberEnabled = false; renderRemember();
        message.textContent = '로그인 유지 없이 다시 시도할 수 있어요. 일반 로그인을 눌러 주세요.'; submit.textContent = '일반 로그인';
      } else message.textContent = explain(err);
    } finally { busy = false; submit.disabled = toggle.disabled = false; submit.removeAttribute('aria-busy'); }
  };
  var backdrop = document.querySelector('.login-island-background'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function motion() { if (backdrop) backdrop.dataset.paused = String(document.hidden || reduced.matches || !!(navigator.connection && navigator.connection.saveData) || !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)); }
  document.addEventListener('visibilitychange', motion); if (reduced.addEventListener) reduced.addEventListener('change', motion);
  if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', motion);
  window.addEventListener('pagehide', function () { if (backdrop) backdrop.dataset.paused = 'true'; }); window.addEventListener('pageshow', motion); motion();
  checkRemember();
  (async function () {
    busy = true; submit.disabled = toggle.disabled = true; var ready = false;
    try {
      var probe = await fetch('/api/v1/auth/site-check', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if ([204, 401, 403].indexOf(probe.status) < 0) { message.textContent = '접근 정책을 전환 중입니다. 잠시 후 새로고침해 주세요.'; return; }
      ready = true; await auth('refresh'); entered();
    } catch (_) { if (!ready) message.textContent = '서버 연결을 확인하지 못했습니다. 잠시 후 새로고침해 주세요.'; }
    finally { busy = !ready; submit.disabled = toggle.disabled = !ready; }
  })();
})();
