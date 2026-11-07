/* HanQ 서버 연결(선택) — 계정·서버 기록·프리미엄을 쓰는 화면의 공용 클라이언트. window.HanqApi
 *
 *  - 서버 주소는 index.html의 <meta name="hanq-api-base">. 배포본은 same-origin 프록시(경로 없음 —
 *    이 파일이 '/api/v1/…'을 붙인다). content를 비우면 의도적으로 서버를 전혀 부르지 않는 오프라인(이 기기 전용) 앱이 된다.
 *  - 개발용 바꿔 끼우기: 페이지를 이 기기(localhost · 127.0.0.1 · [::1])에서 열었을 때만 localStorage 'hanqdev.apiBase'가
 *    meta보다 앞선다(meta가 채워져 있어도). 배포된 사이트(예: *.vercel.app)에서는 저장돼 있어도 읽지 않는다.
 *  - 주소는 https(또는 개발용 http://localhost 계열)만 받고, 아이디·비밀번호·쿼리·# 붙은 주소는 버린다.
 *    끝에 '/api/v1'을 붙여 넣었으면 떼어 낸다(요청 경로가 /api/v1/api/v1/…로 겹치지 않게).
 *  - 접근 토큰은 이 탭의 메모리에만 둔다(localStorage·sessionStorage에 쓰지 않음). 새로 고침하면 HttpOnly 쿠키의
 *    갱신 토큰으로 다시 받는다. 갱신은 탭 안에서 한 번에 하나, Web Locks가 있으면 탭 사이에서도 하나씩
 *    (같은 갱신 토큰을 두 탭이 동시에 쓰면 서버가 도난으로 보고 모든 세션을 끊기 때문).
 *  - 프리미엄 여부는 화면 표시용으로만 받는다. 실제 허용·거절은 언제나 서버가 정한다.
 *  - 'hanq:'로 시작하는 학습 기록 키는 읽기만 한다(가져오기 때). 여기서 쓰는 키는 'hanqacct:' 이름공간
 *    (로그인했던 흔적 · 이 기기 기록 가져오기)와 유지 모드 표시 — 비밀이 아니고, 지워도 기록은 그대로다.
 */
(function (root) {
  'use strict';
  var LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/;
  var HINT_KEY = 'hanqacct:signedIn';
  var IMPORT_KEY = 'hanqacct:importKey';
  var MODE_KEY = 'hanqacct:retentionMode';

  function normalizeBase(v) {
    v = String(v == null ? '' : v).trim();
    if (!v) return '';
    try {
      var u = new URL(v);
      if (u.username || u.password || u.search || u.hash) return '';
      if (u.protocol !== 'https:' && !(u.protocol === 'http:' && LOOPBACK.test(u.hostname))) return '';
      return u.origin + u.pathname.replace(/\/+$/, '').replace(/\/api\/v1$/i, '').replace(/\/+$/, '');
    } catch (e) { return ''; }
  }

  /* 쓸 서버 주소: (이 기기에서 연 페이지일 때만) 안전한 개발용 저장 주소 → 아니면 meta. meta가 비면 ''(서버 꺼짐) */
  function readBase(win) {
    var meta = '';
    try { var m = win.document && win.document.querySelector('meta[name="hanq-api-base"]'); meta = m ? m.getAttribute('content') || '' : ''; } catch (e) { meta = ''; }
    var dev = '';
    try { if (win.location && LOOPBACK.test(win.location.hostname)) dev = normalizeBase(win.localStorage.getItem('hanqdev.apiBase')); } catch (e2) { dev = ''; }
    return dev || (meta === 'same-origin' && win.location && /^https?:$/.test(win.location.protocol) ? normalizeBase(win.location.origin) : normalizeBase(meta));
  }

  function ApiError(status, code, data) {
    var e = new Error(code);
    e.name = 'ApiError'; e.status = status; e.code = code;
    e.details = data && data.error && data.error.details ? data.error.details : null;
    return e;
  }

  function b64url(bytes) {
    var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return (typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /* create({base, fetch, storage, locks, crypto, now}) — 시험에서 가짜 fetch·저장소를 넣을 수 있게 */
  function create(o) {
    o = o || {};
    var base = normalizeBase(o.base);
    var fetchFn = o.fetch || (root.fetch ? root.fetch.bind(root) : null);
    var storage = o.storage === undefined ? (function () { try { return root.localStorage; } catch (e) { return null; } })() : o.storage;
    var locks = o.locks === undefined ? (root.navigator && root.navigator.locks) || null : o.locks;
    var cryptoObj = o.crypto || root.crypto || null;
    var now = o.now || function () { return Date.now(); };
    // profileStatus: 내 정보(/me — 성장점수·출석·이용권)를 idle(아직 안 부름) · loading · ready · error 중 어디까지 받았는지. profileError는 화면에 보일 수 있는 짧은 코드만
    var state = { status: base ? 'unknown' : 'disabled', token: null, tokenExp: 0, user: null, premium: null, growth:null, partnerEvolution:null, partners:null, access:null, profileStatus: 'idle', profileError: null };
    var listeners = [], activityListeners = [], activitySeq = 0, mutations = new Map(), connectionError = null, profileRequest = null, profileRequestEpoch = -1, profileController = null, profileSuspended = false;
    function activity(event) { activityListeners.slice().forEach(function (f) { try { f(event); } catch (_) {} }); }
    function foreground(method, path) { if(/^\/api\/v1\/battle(?:\/|$)/.test(path))return false; if(method==='POST'&&/^\/api\/v1\/toeic-cbt\/collections\/[0-9a-f-]{36}\/(?:answer|group-answer)$/.test(path))return false; return method !== 'GET' && !/\/(?:refresh|logout|logout-all|progress|view)$|\/toeic-recall(?:\/|$)|\/workspaces\/|\/imports\//.test(path); }
    function track(request, label) {
      var id = ++activitySeq; activity({id:id, pending:true, foreground:true, label:label});
      return request.then(function (data) { activity({id:id, pending:false}); return data; }, function (error) { activity({id:id, pending:false}); throw error; });
    }
    var accessExpiryTimer = null, retentionMode = 'legacy', sessionExpiresAt = 0, renewalBlocked = false;
    try { if(storage && storage.getItem(MODE_KEY)==='remember-90d')retentionMode='remember-90d'; } catch(_){}
    var refreshing = null, refreshingEpoch = -1, remoteRequiresSignIn = false, authNotices = [], initP = null, restoring = false, authEpoch = 0, refreshError = null, profileSeq = 0, sessionCheck = null, lastRecheck = -Infinity, authReason = null;
    // Non-secret invalidation only. Never broadcast tokens, account IDs or content.
    var authEventKey = 'hanq:auth-invalidation:v1', authEvents = o.eventTarget || root, authChannel = null;
    var cookieQueue = Promise.resolve();
    // Set-Cookie ordering matters even when an old response is ignored in JS.
    // All cookie-mutating auth flows share this lock across tabs when supported.
    function cookieOperation(run) {
      // Join the shared FIFO immediately. A per-tab queue before this request
      // would let another tab's later signin overtake this tab's queued logout.
      if (locks && typeof locks.request === 'function') {
        try {
          if (o.locks === undefined && root.AbortController) {
            var controller = new root.AbortController();
            var deadline = setTimeout(function () { controller.abort(); }, 12000);
            return Promise.resolve(locks.request('hanq:auth:cookie', {signal: controller.signal}, function () { clearTimeout(deadline); return run(); })).then(function (result) { clearTimeout(deadline); return result; }, function (error) { clearTimeout(deadline); if (error && error.name === 'AbortError') { connectionError = 'timeout'; emit(); throw ApiError(0, 'timeout'); } throw error; });
          }
          return Promise.resolve(locks.request('hanq:auth:cookie', run));
        }
        catch (e) { return Promise.reject(e); }
      }
      // Without Web Locks only this tab can be serialized; do not fall back to
      // an unlocked request after a supported shared-lock acquisition fails.
      var next = cookieQueue.then(run);
      cookieQueue = next.then(function () {}, function () {});
      return next;
    }
    function broadcastInvalidation(reason) {
      var event = { type: 'invalidate', reason: reason, nonce: String(now()) + ':' + Math.random().toString(36).slice(2) };
      try { if (storage) storage.setItem(authEventKey, JSON.stringify(event)); } catch (_) {}
      try { if (authChannel) authChannel.postMessage(event); } catch (_) {}
    }
    function remoteInvalidation(event) {
      event=event||{};if(event.nonce){if(authNotices.indexOf(event.nonce)>=0)return;authNotices.push(event.nonce);if(authNotices.length>16)authNotices.shift();}
      var reconnect=event.reason==='signin'&&hadSession();
      // Rotation must not overlap across tabs. Older browsers without shared locks
      // clear personal content but ask for an explicit signin instead of racing.
      remoteRequiresSignIn=!!(reconnect&&!(locks&&typeof locks.request==='function'));
      if(remoteRequiresSignIn)refreshError=ApiError(0,'session_coordination_unavailable');
      if(state.token||restoring||reconnect)clearSession(true,'remote');
      if(reconnect&&!remoteRequiresSignIn&&hadSession())api.init();
    }

    // epoch: 로그인·가입·로그아웃·세션 끊김마다 바뀌는 번호(같은 세션의 토큰 갱신으로는 바뀌지 않음). 같은 계정이 로그아웃 뒤 다시 들어와도 다른 번호
    function snapshot() { return { enabled: !!base, base: base, epoch: authEpoch, status: state.status, signedIn: !!state.token, retentionMode: retentionMode, sessionExpiresAt: sessionExpiresAt, restoring: restoring, sessionPending: !state.token && hadSession(), connectionError: connectionError, sessionError: refreshError ? refreshError.code : null, authReason: authReason, profileStatus: state.profileStatus, profileError: state.profileError, ownerId: state.user ? state.user.id : null, user: state.user ? JSON.parse(JSON.stringify(state.user)) : null, access: state.access ? JSON.parse(JSON.stringify(state.access)) : null, growth: state.growth ? JSON.parse(JSON.stringify(state.growth)) : null, partnerEvolution:state.partnerEvolution?JSON.parse(JSON.stringify(state.partnerEvolution)):null, partners:state.partners?JSON.parse(JSON.stringify(state.partners)):null, premium: state.premium ? JSON.parse(JSON.stringify(state.premium)) : null }; }
    function emit() { var s = snapshot(); listeners.slice().forEach(function (f) { try { f(s); } catch (e) {} }); }
    function setStatus(s) { if (state.status !== s) { state.status = s; emit(); } }
    function hint(on) { try { if (!storage) return; if (on) {storage.setItem(HINT_KEY, '1');if(retentionMode==='remember-90d')storage.setItem(MODE_KEY,retentionMode);else storage.removeItem(MODE_KEY);} else {storage.removeItem(HINT_KEY);storage.removeItem(MODE_KEY);} } catch (e) {} }
    function hadSession() { try { return !!storage && storage.getItem(HINT_KEY) === '1'; } catch (e) { return false; } }
    /* 상태 문자열만 바꾼다(알림은 부르는 쪽이 한 번만). 진행 중이던 me() 결과는 profileSeq가 바뀌어 더는 상태를 건드리지 못한다 */
    function resetProfile() { profileRequest = null; profileSeq++; state.profileStatus = 'idle'; state.profileError = null; }
    function safeCode(e) { var c = e && e.code; return typeof c === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(c) ? c : 'internal_error'; }
    /* 화면이 성장 정보로 믿고 그릴 수 있는 /me 응답인지: 예전 서버의 일부만 온 응답은 profile_incomplete */
    function profileComplete(d) { return !!(d && d.growth && typeof d.growth.points === 'number' && Number.isFinite(d.growth.points) && d.access && typeof d.access.total === 'number' && Number.isFinite(d.access.total) && d.premium && typeof d.premium.active === 'boolean'); }

    function setSession(d, reason) {
      if (!d || typeof d.accessToken !== 'string' || !d.accessToken || !d.user || typeof d.user.id !== 'string' || !d.user.id) throw ApiError(502, 'invalid_session_response');
      refreshError = null; connectionError = null; remoteRequiresSignIn=false;
      authReason=reason||'refresh';
      state.token = d && typeof d.accessToken === 'string' ? d.accessToken : null;
      retentionMode = d.retentionMode === 'remember-90d' ? 'remember-90d' : 'legacy';
      sessionExpiresAt = d.sessionExpiresAt ? Date.parse(d.sessionExpiresAt) || 0 : 0;
      state.tokenExp = d && d.accessTokenExpiresAt ? Date.parse(d.accessTokenExpiresAt) || 0 : 0;
      var prevId = state.user ? state.user.id : null;
      if (d && d.user) state.user = d.user;
      // 같은 브라우저(쿠키 공유)의 다른 탭이 다른 계정으로 로그인하면 갱신 결과가 다른 사람일 수 있다: 이전 계정의 표시용 상태는 버린다
      // 내 정보도 아직 받지 않은 상태(idle)로: 진행 중이던 이전 계정의 me()는 더는 상태를 바꾸지 못한다.
      // (계정이 없던 상태에서의 첫 세션은 이미 idle이거나, 바로 그 세션을 기다리는 me()가 loading 중이므로 건드리지 않는다)
      if (prevId && state.user && state.user.id !== prevId) { state.premium = null; state.growth=null;state.partnerEvolution=null;state.partners=null; state.access=null; resetProfile(); }
      if(accessExpiryTimer!==null){root.clearTimeout(accessExpiryTimer);accessExpiryTimer=null;}
      if(root.document&&state.tokenExp){var expiryEpoch=authEpoch;accessExpiryTimer=root.setTimeout(function(){accessExpiryTimer=null;if(expiryEpoch===authEpoch&&state.tokenExp&&now()>=state.tokenExp){if(retentionMode==='remember-90d')renewRemember();else clearSession(false,'expired');}},Math.max(0,Math.min(state.tokenExp-now(),2147483647)));}
      hint(!!state.token); emit();
    }
    function clearSession(preserveSharedHint, reason) { if(accessExpiryTimer!==null){root.clearTimeout(accessExpiryTimer);accessExpiryTimer=null;} authReason=reason||'required'; initP=null; sessionCheck=null; restoring=false; authEpoch++; state.token = null; state.tokenExp = 0; retentionMode = 'legacy'; sessionExpiresAt = 0; state.user = null; state.premium = null;state.growth=null;state.partnerEvolution=null;state.partners=null; state.access=null; resetProfile(); if (!preserveSharedHint) hint(false); emit(); }

    function raw(method, path, opts) {
      opts = opts || {};
      if (!base) return Promise.reject(ApiError(0, 'disabled'));
      if (!fetchFn) return Promise.reject(ApiError(0, 'no-fetch'));
      var activityId = ++activitySeq;
      activity({ id: activityId, pending: true, foreground: opts.feedback !== false && foreground(method, path), label: /\/auth\/(signin|signup)$/.test(path) ? '로그인 확인 중…' : '요청을 처리하고 있어요…' });
      var acceptedMediaTypes = opts.mediaTypes || [opts.mediaType || 'image/webp'];
      var headers = { 'Accept': opts.binary ? acceptedMediaTypes.join(', ') : 'application/json' };
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (opts.csrf) headers['X-HanQ-CSRF'] = '1';
      if (opts.auth !== false && (opts.authToken || state.token)) headers.Authorization = 'Bearer ' + (opts.authToken || state.token);
      /* 마감 시간은 헤더가 아니라 본문(text/blob)을 다 받을 때까지. 헤더만 오고 본문이 멈춰도 끝나게 하고,
         AbortController를 무시하는 fetch에서도 끝나도록 마감 Promise와 경주시킨다. 연결 상태는 경주가 끝날 때 한 번만 바꾼다 —
         마감이 지난 뒤 늦게 온 응답은 결과·'online' 어느 것도 되살리지 못한다 */
      var ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var TIMEOUT = {}, timer = null;
      var init = { method: method, headers: headers, credentials: 'include', mode: 'cors', cache: 'no-store', redirect: 'error' };
      if(opts.keepalive)init.keepalive=true;
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
      if (ctl) init.signal = ctl.signal;
      var abortRequest=function(){if(ctl)ctl.abort();};if(opts.signal){if(opts.signal.aborted)abortRequest();else opts.signal.addEventListener('abort',abortRequest,{once:true});}
      var deadline = new Promise(function (resolve, reject) {
        timer = setTimeout(function () { timer = null; reject(TIMEOUT); if (ctl) { try { ctl.abort(); } catch (e) {} } }, Math.max(10000,opts.timeout || 10000));
      });
      // 전송·본문 읽기 실패는 거절(→ network/timeout), 서버가 보낸 응답은 { res, … }로 이행(→ 원래 HTTP 오류 코드)
      var work = Promise.resolve().then(function () { if(opts.signal&&opts.signal.aborted)throw ApiError(0,'aborted');return fetchFn(base + path, init); }).then(function (res) {
        if(res.ok&&opts.privateResponse){var cache=res.headers&&res.headers.get('cache-control')||'',mime=res.headers&&res.headers.get('content-type')||'';if(!/(?:^|,)\s*private\s*(?:,|$)/i.test(cache)||!/(?:^|,)\s*no-store\s*(?:,|$)/i.test(cache)||opts.responseType&&mime.split(';')[0].toLowerCase()!==opts.responseType)return {res:res,error:ApiError(502,'invalid_private_response')};}
        if (res.ok && opts.binary) { var type = res.headers && res.headers.get('content-type'); if (!type || acceptedMediaTypes.indexOf(type.split(';')[0]) === -1) return { res: res, error: ApiError(502, 'invalid_image_response') }; return res.blob().then(function (b) { return { res: res, blob: b }; }); }
        return res.text().then(function (t) { return { res: res, text: t }; });
      });
      var done = function () { if(opts.signal)opts.signal.removeEventListener('abort',abortRequest); if (timer !== null) { clearTimeout(timer); timer = null; } };
      var result = Promise.race([work, deadline]).then(function (out) {
        done();
        setStatus('online');
        if (out.error) throw out.error;
        if (opts.binary && out.res.ok) return out.blob;
        if (opts.textResponse && out.res.ok) return out.text;
        var data = null; try { data = out.text ? JSON.parse(out.text) : null; } catch (e) { data = null; }
        if (out.res.ok) return data;
        throw ApiError(out.res.status, data && data.error && data.error.code ? data.error.code : 'http_' + out.res.status, data);
      }, function (e) {
        done();
        if(opts.signal&&opts.signal.aborted)throw ApiError(0,'aborted');
        setStatus('offline');
        throw ApiError(0, e === TIMEOUT || (e && e.name === 'AbortError') ? 'timeout' : 'network');
      });
      return result.then(function (data) {
        activity({ id: activityId, pending: false }); return data;
      }, function (error) {
        if (!opts.quietConnectionError&&error.code!=='aborted'&&(!error.status || error.status >= 500)) { connectionError = error.code; emit(); }
        activity({ id: activityId, pending: false }); throw error;
      });
    }

    /* 갱신은 기존10초 마감. 회전식 쿠키이므로 불확실한 실패를 자동 재전송하지 않는다.
       이전 epoch의 갱신이 끝나기 전 다른 탭 로그인이 오면 기존 요청 종료 뒤 새 쿠키를 검증한다. */
    function refresh() {
      if (!base || renewalBlocked) return Promise.resolve(false);
      if(retentionMode==='remember-90d'&&(!locks||typeof locks.request!=='function')){refreshError=ApiError(0,'session_coordination_unavailable');emit();return Promise.resolve(false);}
      if(remoteRequiresSignIn)return Promise.resolve(false);
      if (refreshing) {if(refreshingEpoch===authEpoch)return refreshing;var waitingEpoch=authEpoch;return refreshing.then(function(){return waitingEpoch===authEpoch?refresh():false;});}
      var epoch = authEpoch; refreshingEpoch=epoch;refreshError = null;
      var run = function () {
        if(epoch !== authEpoch) return false;
        return raw('POST', '/api/v1/auth/refresh', { csrf: true, auth: false }).then(function (d) { if(epoch !== authEpoch)return false;setSession(d,'refresh'); return true; }).catch(function (e) {
          if(epoch !== authEpoch)return false;refreshError = e;
          if (e.status === 401) clearSession(false,'expired'); else { if (retentionMode==='remember-90d'&&(!e.status || e.status >= 500)) {renewalBlocked = true;refreshError=ApiError(0,'refresh_outcome_uncertain');} emit(); }
          return false;
        });
      };
      var p = cookieOperation(run);
      refreshing = Promise.resolve(p).then(function (ok) { refreshing = null; return !!ok; }, function (error) { refreshing = null; if (epoch === authEpoch) { refreshError = error && error.code ? error : ApiError(0, 'session_unavailable'); emit(); } return false; });
      return refreshing;
    }

    function renewRemember() {
      if (retentionMode !== 'remember-90d') return Promise.resolve(false);
      if (!locks || typeof locks.request !== 'function') { refreshError=ApiError(0,'session_coordination_unavailable');clearSession(true,'required');return Promise.resolve(false); }
      return refresh().then(function(ok){if(!ok&&state.tokenExp&&now()>=state.tokenExp)clearSession(true,'expired');return ok;});
    }

    /* 로그인한 요청: 401이면 로그인으로 복귀한다. 자동 재전송하지 않는다. 단, 갱신으로 받은 계정이 이 요청을 시작한 계정과 다르면
       (다른 탭에서 다른 계정으로 로그인해 쿠키가 바뀐 경우) 다시 보내지 않는다 — A가 시작한 제출·프로필 변경을 B로 보내지 않게.
       그때는 'session_changed'로 거절하고 화면이 이전 계정의 기록·풀던 상태를 지우게 한다. */
    /* 응답이 도착했을 때도 같은 계정인지 본다: 요청을 보낸 뒤 이 탭에서 다른 계정으로 로그인했거나(또는 로그아웃) 갱신 결과가
       다른 사람이면, 늦게 온 성공 응답(예: A의 /me · 이름 바꾸기 결과)을 호출한 쪽에 넘기지 않는다 — 그래야 me()·updateProfile()·
       premium()이 B의 상태 위에 A의 사용자·이용권을 덮어쓰지 않는다. */
    function currentOwner() { return state.token && state.user ? state.user.id : null; }
    function sameOwner(d) { if (!d || !d.user || d.user.id !== currentOwner()) throw ApiError(401, 'session_changed'); }
    // Share an identical in-flight write within this login. Failed writes are never
    // automatically resent after a transport error; callers keep their submission ID.
    function call(method, path, opts) {
      if (method === 'GET') return performCall(method, path, opts);
      var key = authEpoch + '|' + currentOwner() + '|' + method + '|' + path + '|' + JSON.stringify(opts && opts.body);
      if (mutations.has(key)) return mutations.get(key);
      var request = performCall(method, path, Object.assign({}, opts, {feedback:false}));
      if ((!opts||opts.feedback!==false)&&foreground(method, path)) request = track(request, '요청을 처리하고 있어요…');
      var shared = request.then(function (data) { mutations.delete(key); return data; }, function (error) { mutations.delete(key); throw error; });
      mutations.set(key, shared); return shared;
    }
    function performCall(method, path, opts) {
      opts = opts || {};
      if (!base) return Promise.reject(ApiError(0, 'disabled')); // 서버 연결이 꺼져 있으면 언제나 'disabled'(로그인 여부와 무관)
      if (opts.auth === false) return raw(method, path, opts);
      var owner = state.user ? state.user.id : null; // 이 요청을 시작한 계정(알 수 있으면)
      var epoch0 = authEpoch; // 이 요청을 시작한 로그인(같은 계정이라도 로그아웃 뒤 다시 로그인했으면 다른 로그인)
      var deliver = function (data) {
        if (!owner || currentOwner() !== owner || authEpoch !== epoch0) throw ApiError(401, 'session_changed');
        return data;
      };
      var go = function () {
        if (authEpoch !== epoch0 || (owner && currentOwner() !== owner)) return Promise.reject(ApiError(401, 'session_changed'));
        return raw(method, path, opts).then(deliver, function (e) {
          if (authEpoch !== epoch0 || (owner && currentOwner() !== owner)) throw ApiError(401, 'session_changed');
          if(e.status===401){clearSession(false,'expired');throw e;}
          throw e;
        });
      };
      if (!state.token && hadSession()) {
        // 토큰이 없는데 전에 로그인했던 브라우저(새로 고침 직후 등): 먼저 갱신. 이미 알던 계정과 다르면 보내지 않는다
        return refresh().then(function (ok) {
          if (!ok) throw refreshError || ApiError(401, 'unauthorized');
          if (owner && currentOwner() !== owner) throw ApiError(401, 'session_changed');
          owner = currentOwner();
          return go();
        });
      }
      if (!owner) return Promise.reject(ApiError(401, 'unauthorized')); // 로그인 전에는 로그인이 필요한 요청을 보내지 않음
      if(retentionMode==='remember-90d'&&state.tokenExp&&now()>=state.tokenExp-15000){return renewRemember().then(function(ok){if(!ok)throw refreshError||ApiError(401,'invalid_token');if(authEpoch!==epoch0||currentOwner()!==owner)throw ApiError(401,'session_changed');return go();});}
      if(state.tokenExp&&now()>=state.tokenExp){clearSession(false,'expired');return Promise.reject(ApiError(401,'invalid_token'));}
      return go();
    }

    // One common readiness path for protected views and suspended-tab recovery.
    function ensureSession(force) {
      if(!base||(!state.token&&!hadSession()))return Promise.resolve(snapshot());
      if(sessionCheck)return sessionCheck;
      var checkEpoch=authEpoch;
      var check=Promise.resolve().then(function(){if(authEpoch!==checkEpoch||(!state.token&&!hadSession()))return snapshot();return retentionMode==='remember-90d'&&state.tokenExp&&now()>=state.tokenExp-15000?renewRemember().then(function(){return snapshot();}):state.token?(force||state.tokenExp&&now()>=state.tokenExp-15000?api.me():Promise.resolve()):api.init();}).then(function(){if(sessionCheck===check)sessionCheck=null;return snapshot();},function(e){if(sessionCheck===check)sessionCheck=null;throw e;});sessionCheck=check;return check;
    }

    /* 이 브라우저의 가져오기 키. 저장소에 실제로 남는 키만 쓴다: 저장할 수 없으면(막힌 저장소·용량 초과·읽어 보니 다름)
       호출마다 새 키가 생겨 ‘처음 가져간 계정에만’ 규칙을 지킬 수 없으므로 null(가져오기 거절) */
    var activeBattleStream=null;
    function battleStream(onEvent,onError,sessionId,place){if(activeBattleStream)activeBattleStream();var reader=null;var ctl=new AbortController(),closed=false,watch=null,watchDue=0;function streamWake(){if(!closed&&root.document&&!root.document.hidden)watchdog();}if(root.document)root.document.addEventListener('visibilitychange',streamWake);function stop(){closed=true;clearTimeout(watch);if(root.document)root.document.removeEventListener('visibilitychange',streamWake);ctl.abort();if(reader)reader.cancel().catch(function(){});if(activeBattleStream===stop)activeBattleStream=null;}activeBattleStream=stop;function bad(e){if(!closed){stop();onError(e);}}function watchdog(){clearTimeout(watch);watchDue=Date.now()+45000;watch=setTimeout(function(){if(Date.now()-watchDue>5000){watchdog();return;}/* Background scheduling can delay JS reads while the server socket remains live. */if(root.document&&root.document.hidden){watchdog();return;}bad(ApiError(0,'stream_timeout'));},45000);}var epoch=authEpoch,owner=currentOwner();Promise.resolve(ensureSession(false)).then(function(){if(closed)return;if(!state.token||currentOwner()!==owner||authEpoch!==epoch)throw ApiError(401,'session_changed');watchdog();return fetchFn(base+'/api/v1/battle/events'+(sessionId?'?sessionId='+encodeURIComponent(sessionId)+(place==='site'?'&place=site':''):''),{headers:{Authorization:'Bearer '+state.token,Accept:'text/event-stream'},credentials:'include',signal:ctl.signal});}).then(async function(res){if(closed||!res)return;if(!res.ok)throw ApiError(res.status,'http_'+res.status);if(!(res.headers.get('content-type')||'').startsWith('text/event-stream')||!res.body)throw ApiError(502,'invalid_stream');reader=res.body.getReader();var decoder=new TextDecoder(),buffer='';while(!closed){var part=await reader.read();if(part.done)throw ApiError(0,'stream_closed');if(currentOwner()!==owner||authEpoch!==epoch){stop();return;}watchdog();buffer+=decoder.decode(part.value,{stream:true}).replace(/\r\n/g,'\n');if(buffer.length>512000)throw ApiError(502,'invalid_stream');var end;while((end=buffer.indexOf('\n\n'))>=0){var block=buffer.slice(0,end);buffer=buffer.slice(end+2);var event='message',data=[];block.split('\n').forEach(function(line){if(line.startsWith('event:'))event=line.slice(6).trim();if(line.startsWith('data:'))data.push(line.slice(5).trimStart());});if(!data.length)continue;if(event==='auth')throw ApiError(401,'stream_auth');if(event==='server-error')throw ApiError(503,'stream_server');var value;try{value=JSON.parse(data.join('\n'));}catch(_){throw ApiError(502,'invalid_stream');}try{onEvent(event,value);}catch(_){throw ApiError(0,'render_error');}}}}).catch(function(e){if(!closed)bad(e&&e.name==='ApiError'?e:ApiError(0,'network'));});return stop;}

    function importKey() {
      if (!storage) return null;
      try {
        var k = storage.getItem(IMPORT_KEY);
        if (k && /^[A-Za-z0-9_-]{43}$/.test(k)) return k;
        if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') return null;
        var b = new Uint8Array(32); cryptoObj.getRandomValues(b); k = b64url(b);
        storage.setItem(IMPORT_KEY, k);
        return storage.getItem(IMPORT_KEY) === k ? k : null;
      } catch (e) { return null; }
    }
    function newId(prefix) {
      var b = new Uint8Array(12);
      if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') cryptoObj.getRandomValues(b); else for (var i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
      return (prefix || 's') + '-' + now().toString(36) + '-' + b64url(b);
    }
    function q(params) {
      var parts = [];
      Object.keys(params || {}).forEach(function (k) { var v = params[k]; if (v != null && v !== '') parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); });
      return parts.length ? '?' + parts.join('&') : '';
    }
    var enc = encodeURIComponent;

    function refreshGrowthAfterGrade(){var owner=currentOwner(),waiting=profileRequest||Promise.resolve();waiting.catch(function(){}).then(function(){if(owner&&currentOwner()===owner&&state.signedIn)api.me().catch(function(){});});}
    // PDF revision chooses a fixed server root; workspace version and numeric CAS remain untouched.
    function textbookCall(method, suffix, opts, sourceRevision) {
      if (sourceRevision != null && sourceRevision !== '35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442' && sourceRevision !== 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de') return Promise.reject(ApiError(400, 'invalid_source_revision'));
      var prefix = '/api/v1/textbook' + (sourceRevision == null ? '' : '/revisions/' + sourceRevision);
      return call(method, prefix + suffix, opts);
    }
    function textbookPageAllowed(page, sourceRevision) { return Number.isInteger(page) && page >= 1 && page <= (sourceRevision === 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de' ? 147 : 144); }
    var api = {
      openingScriptBundle: function(source,signal){if(!/^[a-f0-9]{64}$/.test(source||''))return Promise.reject(ApiError(400,'invalid_script_source'));return call('GET','/api/v1/textbook/scripts/opening/'+source+'/bundle',{signal:signal,privateResponse:true,responseType:'application/json',binary:true,mediaType:'application/json'});},
      openingScriptCurrentStructure: function(signal){return call('GET','/api/v1/textbook/scripts/opening/current/structure',{signal:signal,privateResponse:true,responseType:'application/json',binary:true,mediaType:'application/json'});},
      openingScriptFigure: function(source,name,signal){if(!/^[a-f0-9]{64}$/.test(source||'')||!/^p\d{3}-\d{2}\.png$/.test(name||''))return Promise.reject(ApiError(400,'invalid_script_figure'));return call('GET','/api/v1/textbook/scripts/opening/'+source+'/figures/'+name,{signal:signal,privateResponse:true,responseType:'image/png',binary:true,mediaType:'image/png'});},
      goryeoScriptBundle: function(source,signal){if(source!=='245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9')return Promise.reject(ApiError(400,'invalid_script_source'));return call('GET','/api/v1/textbook/scripts/goryeo/'+source+'/bundle',{signal:signal,privateResponse:true,responseType:'application/json',textResponse:true});},
      goryeoScriptFigure: function(source,name,signal){if(source!=='245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9'||!/^p(?:042-0[12]|047-01|048-01|053-0[123]|056-(?:0[1-9]|1[0-7]))\.png$/.test(name||''))return Promise.reject(ApiError(400,'invalid_script_figure'));return call('GET','/api/v1/textbook/scripts/goryeo/'+source+'/figures/'+name,{signal:signal,privateResponse:true,responseType:'image/png',binary:true,mediaType:'image/png'});},
      joseonScriptBundle: function(source,signal){if(!/^[a-f0-9]{64}$/.test(source||''))return Promise.reject(ApiError(400,'invalid_script_source'));return call('GET','/api/v1/textbook/scripts/joseon/'+source+'/bundle',{signal:signal,privateResponse:true,responseType:'application/json',textResponse:true});},
      joseonScriptFigure: function(source,name,signal){if(!/^[a-f0-9]{64}$/.test(source||'')||!/^p\d{3}-\d{2}\.png$/.test(name||''))return Promise.reject(ApiError(400,'invalid_script_figure'));return call('GET','/api/v1/textbook/scripts/joseon/'+source+'/figures/'+name,{signal:signal,privateResponse:true,responseType:'image/png',binary:true,mediaType:'image/png'});},
      weaknessProgress:function(bank){return call('GET','/api/v1/weakness-practice/'+encodeURIComponent(bank)+'/progress');},
      weaknessFinish:function(bank,questionIds){return call('POST','/api/v1/weakness-practice/'+encodeURIComponent(bank)+'/results',{body:{questionIds:questionIds}});},
      weaknessAnswer:function(bank,body){return call('POST','/api/v1/weakness-practice/'+encodeURIComponent(bank)+'/answers',{body:body}).then(function(d){if(d.attempt&&typeof d.attempt.correct==='boolean')refreshGrowthAfterGrade();return d;});},
      weaknessHistory:function(bank,cursor){return call('GET','/api/v1/weakness-practice/'+encodeURIComponent(bank)+'/attempts'+q({cursor:cursor}));},
      textbookSemanticManifest: function (revision) { return textbookCall('GET', '/semantic/manifest', undefined, revision); },
      textbookSemanticPage: function (page, revision) { if (!textbookPageAllowed(page, revision)) return Promise.reject(ApiError(400, 'invalid_page')); return textbookCall('GET', '/semantic/pages/' + page, undefined, revision); },
      textbookSemanticQuiz: function (id, revision) { if (!/^[a-z0-9-]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_quiz')); return textbookCall('GET', '/semantic/quizzes/' + id, undefined, revision); },
      textbookSourceWorkspace: function (id, revision) { if (!/^[a-z0-9-]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_quiz')); return textbookCall('GET', '/semantic/workspaces/' + id, undefined, revision); },
      saveTextbookSourceWorkspace: function (id, body, revision) { if (!/^[a-z0-9-]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_quiz')); return textbookCall('PUT', '/semantic/workspaces/' + id, {body:body}, revision); },
      textbookSourceProgress: function (id, revision) { if (!/^[a-z0-9-]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_quiz')); return textbookCall('GET', '/semantic/progress/' + id, undefined, revision); },
      saveTextbookSourceProgress: function (id, body, revision) { if (!/^[a-z0-9-]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_quiz')); return textbookCall('PUT', '/semantic/progress/' + id, {body:body}, revision); },
      textbookSemanticChoices: function (id, revision) { if (!/^[a-z0-9-]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_quiz')); return textbookCall('GET', '/semantic/choices/' + id, undefined, revision); },
      textbookSemanticFigure: function (id, revision) { if (!/^p[0-9]{3}-figure-[0-9]+$/.test(id || '')) return Promise.reject(ApiError(400, 'invalid_figure')); return textbookCall('GET', '/semantic/figures/' + id, {binary:true,mediaTypes:['image/jpeg','image/png']}, revision); },
      textbookManifest: function (revision) { return textbookCall('GET', '/manifest', undefined, revision); },
      textbookPage: function (page, revision) { if (!textbookPageAllowed(page, revision)) return Promise.reject(ApiError(400, 'invalid_page')); return textbookCall('GET', '/pages/' + page, undefined, revision); },
      textbookImage: function (page, enhanced, revision) { if (!textbookPageAllowed(page, revision)) return Promise.reject(ApiError(400, 'invalid_page')); return textbookCall('GET', '/pages/' + page + (enhanced ? '/enhanced' : '/image'), {binary:true,mediaType:'image/png'}, revision); },
      enabled: function () { return !!base; },
      base: function () { return base; },
      state: snapshot,
      hasSessionHint: hadSession,
      onChange: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; },
      onActivity: function (f) { activityListeners.push(f); return function () { activityListeners = activityListeners.filter(function (x) { return x !== f; }); }; },
      retryConnection: function () { return api.ensureSession(true).then(function (s) { if (!s.signedIn && hadSession()) throw refreshError || ApiError(0, 'network'); if (!s.signedIn) return api.plan(); }).then(function () { connectionError = null; emit(); return snapshot(); }); },
      /* 앱을 열 때: 전에 로그인했던 브라우저면 쿠키로 조용히 세션을 되살린다(실패해도 로컬 앱은 그대로) */
      init: function () {
        if (!base||remoteRequiresSignIn&&hadSession()) return Promise.resolve(snapshot());
        if(initP&&restoring)return initP;
        if(initP&&state.token)return state.tokenExp&&now()>=state.tokenExp-15000?ensureSession(true):Promise.resolve(snapshot());
        initP=null;
        var initEpoch=authEpoch,wantsRestore=hadSession();
        var fin=function(){if(authEpoch!==initEpoch)return snapshot();restoring=false;if(!state.token&&hadSession()&&initP===initial)initP=null;emit();return snapshot();};
        var initial=Promise.resolve().then(function(){if(authEpoch!==initEpoch)return false;return wantsRestore?refresh():raw('GET','/api/v1/premium/plan',{auth:false}).then(function(){return false;},function(){return false;});}).then(function(ok){return ok?api.me().catch(function(){return null;}):null;}).then(fin,fin);
        initP=initial;restoring=wantsRestore;emit();return initial;
      },
      refresh: refresh,
      ensureSession: ensureSession,
      signup: function (email, password, displayName) {
        renewalBlocked=false;var epoch=++authEpoch;var body = { email: email, password: password }; if (displayName) body.displayName = displayName;
        return track(cookieOperation(function () { if(epoch!==authEpoch)throw ApiError(401,'session_changed');return raw('POST', '/api/v1/auth/signup', { body: body, csrf: true, auth: false, feedback:false }); }).then(function (d) { if(epoch!==authEpoch)throw ApiError(401,'session_changed');setSession(d,'signin'); broadcastInvalidation('signin'); return api.me().catch(function () { return d; }); }), '로그인 확인 중…');
      },
      signin: function (email, password, rememberMe) {
        if(rememberMe===true&&(!locks||typeof locks.request!=='function'))return Promise.reject(ApiError(0,'session_coordination_unavailable'));
        renewalBlocked=false;
        var epoch=++authEpoch;return track(cookieOperation(function () { if(epoch!==authEpoch)throw ApiError(401,'session_changed');return raw('POST', '/api/v1/auth/signin', { body: { email: email, password: password, rememberMe: rememberMe === true }, csrf: true, auth: false, feedback:false }); }).then(function (d) { if(epoch!==authEpoch)throw ApiError(401,'session_changed');setSession(d,'signin'); broadcastInvalidation('signin'); return api.me().catch(function () { return d; }); }), '로그인 확인 중…');
      },
      /* 이 탭의 로그인 정보는 언제나 지운다. 서버가 세션을 실제로 끊었는지는 따로 알린다(serverRevoked) —
         네트워크 오류면 서버의 갱신 쿠키·세션이 남아 있을 수 있으므로 ‘로그아웃 완료’라고 말하지 않게 */
      logout: function () {
        // Capture only in memory, then clear local auth before waiting for the
        // cookie-operation queue or the server's response.
        var token = state.token;
        var revocation = cookieOperation(function () { return raw('POST', '/api/v1/auth/logout', { csrf: true, authToken: token }); });
        clearSession(false,'logout');
        broadcastInvalidation('logout');
        return revocation.then(function () { return { serverRevoked: true }; }, function () { return { serverRevoked: false }; });
      },
      logoutAll: function () { var token = state.token; var revocation = cookieOperation(function () { return raw('POST', '/api/v1/auth/logout-all', { csrf: true, authToken: token }); }); clearSession(false,'logout'); broadcastInvalidation('logout'); return revocation; },
      /* call()이 ‘지금도 같은 계정’일 때만 응답을 넘겨 주고, 여기서 한 번 더 응답의 사용자가 지금 계정인지 본 뒤에만 상태를 바꾼다 */
      /* profileStatus: 부르기 전에 loading → 성장점수·출석·이용권이 다 오면 ready, 실패하거나 일부만 오면 error.
         실패해도 로그인(토큰·사용자)은 그대로 두고, 믿을 수 없는 성장·출석 값만 지운다(0으로 꾸미지 않음).
         늦게 온 결과는 이 호출이 가장 최근 me()이고 같은 로그인(authEpoch)·같은 계정일 때만 상태를 바꾼다 */
      hallOwnLearning:function(){return call('GET','/api/v1/hall-of-fame/my-learning');},
      hallPublicProfile:function(ref){if(!/^[a-f0-9]{32}$/.test(ref))return Promise.reject(new Error('invalid profile'));return call('GET','/api/v1/hall-of-fame/profiles/'+ref);},
      hallOfFame: function(page,limit){return call('GET','/api/v1/hall-of-fame'+q({page:page||1,limit:limit||20}));},
      me: function () {
        if(profileSuspended)return Promise.reject(ApiError(0,'aborted'));
        if (profileRequest && profileRequestEpoch === authEpoch) return profileRequest;
        var seq = ++profileSeq, epoch = authEpoch, owner = currentOwner();
        state.profileStatus = 'loading'; state.profileError = null; emit();
        var mine = function () { return seq === profileSeq && epoch === authEpoch && (!owner || owner === currentOwner()); };
        var controller = typeof AbortController === 'function' ? new AbortController() : null;profileController=controller;
        var request = call('GET', '/api/v1/me',{signal:controller&&controller.signal}).then(function (d) {
          sameOwner(d);
          if (!mine()) return d;
          state.user = d.user; state.premium = d.premium || null; state.growth=d.growth||null;state.partnerEvolution=d.partnerEvolution||null;state.partners=d.partners||null; state.access=d.access||null;
          if (mine()) { var full = profileComplete(d); state.profileStatus = full ? 'ready' : 'error'; state.profileError = full ? null : 'profile_incomplete'; if (!full) { state.growth = null;state.partnerEvolution=null;state.partners=null; state.access = null; } }
          emit(); return d;
        }).then(null, function (e) {
          if (mine()) {
            if (currentOwner() && e.code !== 'session_changed') { state.growth = null;state.partnerEvolution=null;state.partners=null; state.access = null; state.profileStatus = 'error'; state.profileError = safeCode(e); }
            else if (state.profileStatus === 'loading') { state.profileStatus = 'idle'; state.profileError = null; }
            emit();
          }
          throw e;
        });
        var shared = request.then(function (data) { if (profileRequest === shared) {profileRequest = null;profileController=null;} return data; }, function (error) { if (profileRequest === shared) {profileRequest = null;profileController=null;} throw error; });
        profileRequest = shared; profileRequestEpoch = epoch; return shared;
      },
      /* CBT는 로그인 토큰·현재 계정 확인을 공용 call()과 함께 사용. 이미지도 공개 주소로 이동하지 않고 인증된 요청으로 받는다. */
      cbt: function(method,path,body) { if (!/^\/api\/v1\/cbt(?:\/|$)/.test(path) || /[?#]|\.\.|%/.test(path)) return Promise.reject(ApiError(400,'invalid_path')); var opts = body === undefined ? {} : {body:body}; if (method === 'POST' && /^\/api\/v1\/cbt\/(?:runs|reviews)\/[0-9a-f-]{36}\/start$/.test(path)) opts.timeout = 20000; return call(method,path,opts); },
      cbtImage: function(path) { if (!/^\/api\/v1\/cbt\/(?:runs|reviews)\/[0-9a-f-]{36}\/questions\/(?:[0-9]|[1-4][0-9])\/(?:image|common)$/.test(path)) return Promise.reject(ApiError(400,'invalid_path')); return call('GET',path,{binary:true}); },
      portal: function(method,path,body,options){if(!/^\/api\/v1\/(ops|inquiries)(\/|$|\?)/.test(path))return Promise.reject(ApiError(400,'invalid_path'));var opts=body===undefined?{}:{body:body};if(options&&options.feedback===false)opts.feedback=false;return call(method,path,opts);},
      emailAvailable: function (email) { return raw('POST', '/api/v1/auth/email-availability', {auth:false,body:{email:email},feedback:false}); },
      nicknameAvailable: function (nickname) { return raw('GET', '/api/v1/auth/nickname'+q({nickname:nickname}), {auth:false}); },
      attendance: function () { var owner=currentOwner(),epoch=authEpoch;return call('POST', '/api/v1/attendance', {body:{}}).then(function(d){if(currentOwner()!==owner||authEpoch!==epoch)throw ApiError(401,'session_changed');if(state.partners)return api.me().then(function(){return d;});state.access=d;if(d.growth&&Number.isSafeInteger(d.growth.points)&&d.growth.points>=0)state.growth={points:d.growth.points};emit();return d;}); },
      updateProfile: function (displayName) { return call('PATCH', '/api/v1/me', { body: { displayName: displayName } }).then(function (d) { sameOwner(d); state.user = d.user; emit(); return d; }); },
      changePassword: function (currentPassword, newPassword) { return call('POST', '/api/v1/me/password', { body: { currentPassword: currentPassword, newPassword: newPassword } }); },
      plan: function () { return raw('GET', '/api/v1/premium/plan', { auth: false }); },
      premium: function () { return call('GET', '/api/v1/premium').then(function (d) { state.premium = { active: d.active, expiresAt: d.expiresAt, serverTime: d.serverTime }; emit(); return d; }); },
      /* 테스트용 무료 전환(계정당 한 번, 결제 없음). 누구에게 줄지는 서버가 로그인 토큰으로만 정한다(본문에 계정을 싣지 않음).
         화면의 이용권은 서버가 돌려준 실제 상태로만 바꾼다 */
      testFreePass: function () { return call('POST', '/api/v1/premium/test-free-pass', { body: {} }).then(function (d) { state.premium = { active: d.active, expiresAt: d.expiresAt, serverTime: d.serverTime }; emit(); return d; }); },
      createOrder: function () { return call('POST', '/api/v1/payments/orders', { body: { planId: 'premium-1m' } }); },
      confirmOrder: function (orderId, body) { return call('POST', '/api/v1/payments/orders/' + enc(orderId) + '/confirm', { body: body || {} }); },
      orders: function () { return call('GET', '/api/v1/payments/orders'); },
      attempts: function (cursor, limit) { return call('GET', '/api/v1/attempts' + q({ cursor: cursor, limit: limit })); },
      /* 성장점수 기록(읽기 전용 · 내 기록만 · 최신순). cursor는 서버가 준 불투명 값만 그대로 돌려준다 */
      studyActivity:function(month){return call('GET','/api/v1/me/study-activity'+(month?'?month='+encodeURIComponent(month):''));},
      evolve: function(family,revision,requestId){var owner=currentOwner(),epoch=authEpoch;return call('POST','/api/v1/me/evolve',{body:{family:family,revision:revision,requestId:requestId}}).then(function(d){if(currentOwner()!==owner||authEpoch!==epoch)throw ApiError(401,'session_changed');return api.me().then(function(){return d;});});},
      partnerAction: function(action,body){
        var owner=currentOwner(),epoch=authEpoch;
        if(!root.HanqCollection||!root.HanqCollection.ready(snapshot())||['claim','equip','evolve'].indexOf(action)<0||action==='claim'&&snapshot().partners.purchaseEnabled!==true)return Promise.reject(ApiError(503,'collection_unavailable'));
        return call('POST','/api/v1/me/partners/'+action,{body:body}).then(function(d){if(currentOwner()!==owner||authEpoch!==epoch)throw ApiError(401,'session_changed');if(!d||d.confirmed!==true)throw ApiError(502,'collection_unconfirmed');return api.me().then(function(){return d;});});
      },
      growthHistory: function (cursor, limit) { if (cursor != null && cursor !== '' && !/^[A-Za-z0-9_-]{1,200}$/.test(cursor)) return Promise.reject(ApiError(400, 'invalid_cursor')); return call('GET', '/api/v1/me/growth-history' + q({ cursor: cursor, limit: limit })); },
      mockProgress: function(questions){return call('POST','/api/v1/mock/progress',{body:{questions:questions}});},
      currentQuestions: function (era, after) { return call('GET', '/api/v1/questions' + q({ kind: 'quiz', era: era, after: after, limit: 100 })); },
      quizProgress: function (questions) { return call('POST', '/api/v1/quiz/progress', { body: { questions: questions } }); },
      myRecords:function(f){return call('GET','/api/v1/me/records'+q({subject:f.subject,source:f.source,page:f.page,snapshot:f.snapshot}));},
      attempt: function (id) { return call('GET', '/api/v1/attempts/' + enc(id)); },
      /* 보통 퀴즈·기출 채점(서버가 저장된 정답으로 채점 · 성장점수 ±1/±5는 서버가 같은 거래에서 기록). 응답의 지금 총점(growth.points)만,
         이 요청을 보낸 계정·로그인(epoch) 그대로이고 내 정보가 이미 확인된(ready) 상태일 때 화면 상태에 반영한다(클라이언트는 점수를 계산하지 않음) */
      submitAttempt: function (questionId, version, optionId, submissionId) {
        var owner = currentOwner(), epoch = authEpoch;
        return call('POST', '/api/v1/attempts', { body: { submissionId: submissionId || newId('p'), questionId: questionId, version: version, optionId: optionId } }).then(function (d) {
          var at = d && d.attempt, g = at && at.questionId === questionId && at.version === version && at.optionId === optionId && typeof at.correct === 'boolean' ? d.growth : null; // 확인된 채점일 때만 총점 반영
          if (g && Number.isSafeInteger(g.points) && (g.delta === null || Number.isSafeInteger(g.delta)) && owner && currentOwner() === owner && authEpoch === epoch && state.profileStatus === 'ready' && state.growth) {
            if(state.partners){return api.me().then(function(){return d;});}state.growth = { points: g.points }; emit();
          }
          return d;
        });
      },
      /* CBT 결과(최종 점수 구간 보상) 뒤 등: 같은 계정·로그인일 때만 내 정보를 다시 받는다(me()가 계정·epoch를 지킴) */
      refreshProfile: function () { if (!currentOwner()) return Promise.resolve(null); return api.me().catch(function () { return null; }); },
      toeicCbtAudio: function(id,group,signal){if(!/^[0-9a-f-]{36}$/.test(id)||!group||group.length>200)return Promise.reject(ApiError(400,'invalid_path'));return call('GET','/api/v1/toeic-cbt/collections/'+id+'/audio/'+encodeURIComponent(group),{binary:true,mediaTypes:['audio/mpeg'],timeout:70000,feedback:false,signal:signal});},
      toeicCbtImage: function(path){if(!/^\/collections\/[0-9a-f-]{36}\/images\/[a-f0-9]{64}$/.test(path))return Promise.reject(ApiError(400,'invalid_path'));return call('GET','/api/v1/toeic-cbt'+path,{binary:true,mediaTypes:['image/png','image/jpeg','image/webp']});},
      toeicCbt: function (method, path, data) { if (!(method === 'GET' && (path === '/practice'||path === '/player'||/^\/practice-history(?:\?|$)/.test(path))) && !/^\/(?:collections|runs)(?:\/|$)/.test(path)) return Promise.reject(ApiError(400, 'invalid_path')); return call(method, '/api/v1/toeic-cbt' + path, data === undefined ? {} : {body:data}).then(function(d){if(method==='POST'&&/\/(?:answer|group-answer)$/.test(path)&&(typeof d.correct==='boolean'||d.results&&d.results.some(function(x){return typeof x.correct==='boolean';})))refreshGrowthAfterGrade();return d;}); },
      battleStream:battleStream,
      battle: function(method,path,data,options){if(!((method==='GET'&&path==='/wrongnotes')||(method==='POST'&&path==='/wrongnotes/answer')||(method==='GET'&&/^\/history(?:\/[0-9a-f-]{36})?(?:\?cursor=[0-9a-f-]{36})?$/.test(path))||(method==='GET'&&(path==='/lobby'||/^\/lobby\?sessionId=[0-9a-f-]{36}$/.test(path)))||(method==='POST'&&/^\/(?:enter|leave|suspend|challenges|practice|presence)$/.test(path))||(method==='GET'&&path==='/invitations')||/^\/matches\/[0-9a-f-]{36}(?:\/(?:accept|decline|ready|answers|forfeit|exit))?$/.test(path)))return Promise.reject(ApiError(400,'invalid_path'));return call(method,'/api/v1/battle'+path,data===undefined?{signal:options&&options.signal,feedback:false,quietConnectionError:true,timeout:Math.max(10000,options&&options.timeout||10000)}:{body:data,signal:options&&options.signal,keepalive:!!(options&&options.keepalive),feedback:false,quietConnectionError:true,timeout:Math.max(10000,options&&options.timeout||10000)});},
      battleReviewAudio:function(id,round){if(!/^[0-9a-f-]{36}$/.test(id)||!Number.isInteger(round)||round<1)return Promise.reject(ApiError(400,'invalid_path'));return call('GET','/api/v1/battle/history/'+id+'/audio/'+round,{binary:true,mediaTypes:['audio/mpeg'],timeout:70000,feedback:false});},
      battleAudio:function(id,round,signal){if(!/^[0-9a-f-]{36}$/.test(id)||!Number.isInteger(round)||round<1||round>2147483647)return Promise.reject(ApiError(400,'invalid_path'));return call('GET','/api/v1/battle/matches/'+id+'/audio/'+round,{binary:true,mediaTypes:['audio/mpeg'],timeout:70000,feedback:false,signal:signal});},
      toeicRecall: function () { return call('GET', '/api/v1/toeic-recall'); },
      saveToeicRecall: function (id, data) { return call('PUT', '/api/v1/toeic-recall/' + enc(id), {body:data}); },
      saveToeicRecallView: function (view) { return call('PUT', '/api/v1/toeic-recall/view', {body:view}); },
      wordChecks: function () { return call('GET', '/api/v1/toeic-word-checks'); },
      saveWordChecks: function (d) { return call('PUT', '/api/v1/toeic-word-checks', {body:d}); },
      toeicNotes: function () { return call('GET', '/api/v1/toeic-notes'); },
      archiveToeicNote: function (id, archived) { return call('PUT', '/api/v1/toeic-notes/' + enc(id) + '/archive', {body:{archived:archived}}); },
      saveToeicNote: function (id, note) { return call('PUT', '/api/v1/toeic-notes/' + enc(id), {body:note}); },
      mergeToeicNotes: function (id, data) { return call('POST', '/api/v1/toeic-notes/' + enc(id) + '/merge', {body:data}); },
      wrongNotes: function (params) { return call('GET', '/api/v1/wrong-notes' + q(params)); },
      study: function () { return call('POST', '/api/v1/wrong-notes/study', { body: {} }); },
      wrongParts: function () { return call('GET', '/api/v1/wrong-notes/parts'); },
      coreReview: function (era) { return call('GET', '/api/v1/reviews/core' + q({era:era})); },
      focusedReview: function (era) { return call('GET', '/api/v1/wrong-notes/focused-review' + (era==='goryeo'?'?era=goryeo':'')); },
      createReplay: function (o) { return call('POST', '/api/v1/wrong-notes/replays', { body: o }); },
      replays: function () { return call('GET', '/api/v1/wrong-notes/replays'); },
      replay: function (id) { return call('GET', '/api/v1/wrong-notes/replays/' + enc(id)); },
      answerReplay: function (id, position, optionId, submissionId) { return call('POST', '/api/v1/wrong-notes/replays/' + enc(id) + '/answers', { body: { submissionId: submissionId, position: position, optionId: optionId } }).then(function(d){refreshGrowthAfterGrade();return d;}); },
      runs: function () { return call('GET', '/api/v1/runs'); },
      createRun: function (o) { return call('POST', '/api/v1/runs', { body: o }); },
      run: function (id) { return call('GET', '/api/v1/runs/' + enc(id)); },
      startRun: function (id) { return call('POST', '/api/v1/runs/' + enc(id) + '/start'); },
      answerRun: function (id, position, optionId) { return call('PUT', '/api/v1/runs/' + enc(id) + '/answers/' + enc(position), { body: { optionId: optionId } }); },
      submitRun: function (id) { return call('POST', '/api/v1/runs/' + enc(id) + '/submit'); },
      /* 이 기기 기록 가져오기(사용자가 직접 누를 때만). entries ≤ 500개씩. 로컬 기록은 읽기만 한다 */
      /* 계정별 자동 동기화(media/account-sync.js)가 쓰는 가져오기: 키는 부르는 쪽이 계정마다 저장해 둔 값(이 브라우저 공용 키와 별개) */
      importAttempts: function (key, entries) {
        if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(key)) return Promise.reject(ApiError(0, 'no-import-key'));
        if (!Array.isArray(entries) || entries.length > 500) return Promise.reject(ApiError(0, 'too_many_entries'));
        return call('POST', '/api/v1/imports/local-attempts', { body: { importKey: key, entries: entries, scope: 'account' } }); // 서버 ID = 계정 + localId(키와 무관)
      },
      /* (예전 수동 가져오기 · 화면에서는 더 쓰지 않음) 이 브라우저 공용 키 'hanqacct:importKey' */
      importLocal: function (entries) {
        var k = importKey();
        if (!k) return Promise.reject(ApiError(0, 'no-import-key'));
        return call('POST', '/api/v1/imports/local-attempts', { body: { importKey: k, entries: entries } });
      },
      newSubmissionId: newId
    };
    if (base && authEvents && typeof authEvents.addEventListener === 'function') {
      authEvents.addEventListener('storage', function (e) {
        if (e.key === authEventKey && e.newValue) { try { var notice=JSON.parse(e.newValue);if (notice.type === 'invalidate') remoteInvalidation(notice); } catch (_) {} }
        else if (e.key === null || (e.key === HINT_KEY && e.newValue === null)) remoteInvalidation({reason:'logout'});
      });
      // Recheck the live server session when returning to a suspended tab.
      var recheck = function () { if(profileSuspended||!(state.token||hadSession())||(root.document&&root.document.hidden)||now()-lastRecheck<1000)return;lastRecheck=now();ensureSession(true).then(function(s){if(!s.signedIn&&hadSession())lastRecheck=-Infinity;},function(){lastRecheck=-Infinity;}); };
      authEvents.addEventListener('focus', recheck);
      // Cancel only the departing document's profile read; writes/session cookies keep their own lifecycle.
      authEvents.addEventListener('pagehide', function(){profileSuspended=true;lastRecheck=-Infinity;var controller=profileController;profileController=null;profileRequest=null;profileSeq++;if(controller)controller.abort();});
      authEvents.addEventListener('pageshow', function(){profileSuspended=false;var waiting=sessionCheck;if(waiting)waiting.catch(function(){}).then(function(){lastRecheck=-Infinity;recheck();});else recheck();});
      authEvents.addEventListener('online', recheck);
      if(root.document&&root.document.addEventListener)root.document.addEventListener('visibilitychange',recheck);
      try { var Channel = o.BroadcastChannel || (root.document ? root.BroadcastChannel : null); if (Channel) { authChannel = new Channel('hanq-auth-invalidation-v1'); authChannel.onmessage = function (e) { if (e.data && e.data.type === 'invalidate') remoteInvalidation(e.data); }; } } catch (_) {}
    }
    return api;
  }

  /* 로컬 채점 기록(HanqProgress의 attempt) → 서버 가져오기 항목. 서버가 다시 채점하므로 correct는 보내지 않는다 */
  function importEntries(attempts) {
    var out = [], seen = Object.create(null);
    (attempts || []).forEach(function (a) {
      if (!a || typeof a.id !== 'string' || !/^a[0-9a-z]{6,40}$/.test(a.id) || seen[a.id]) return;
      if ((a.subject || 'history') !== 'history' || (a.mode !== 'quiz' && a.mode !== 'mock')) return;
      if (a.source === 'run' || a.rankEligible === true) return; // 시간제 회차·순위 기록은 보내지 않음
      seen[a.id] = 1;
      out.push({ localId: a.id, mode: a.mode, questionId: a.questionId, contentVersion: a.contentVersion, optionId: typeof a.optionId === 'string' ? a.optionId : null, ts: Number.isFinite(a.ts) ? Math.floor(a.ts) : undefined });
    });
    return out;
  }

  var api = create({ base: typeof window !== 'undefined' ? readBase(window) : '' });
  api.create = create;
  api.normalizeBase = normalizeBase;
  api.importEntries = importEntries;
  api.readBase = readBase;
  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create, normalizeBase: normalizeBase, importEntries: importEntries, readBase: readBase };
  if (typeof window !== 'undefined' && root === window) root.HanqApi = api;
})(typeof window !== 'undefined' ? window : globalThis);

