/* Prepared MyPage controls. Writes remain disabled until every learning path supports reset epochs.
 * Never deletes browser data, imports records, or changes XP/source/account state.
 */
(function (root) {
  'use strict';
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  function identity(api) {
    var s = api && api.state();
    return s && s.signedIn && !s.restoring && s.user && UUID.test(s.user.id || '') && s.ownerId === s.user.id ? s.user.id + ':' + String(s.epoch || 0) : null;
  }
  function describe(d) {
    if (d && d.available === false && d.reason === 'reset_consistency_pending') return '초기화 기능 준비 중입니다. 서버·기기 기록이 다시 나타나지 않도록 검증하고 있어요. 아직 어떤 기록도 변경하지 않습니다.';
    // An unexpected future capability cannot silently activate this incomplete client.
    return '초기화 기능을 사용할 수 없습니다. 기존 기록은 그대로 보존됩니다.';
  }
  function mount(host, api) {
    var doc = host.ownerDocument, life = identity(api), alive = true, off;
    host.replaceChildren();
    function el(tag, text) { var n = doc.createElement(tag); n.textContent = text; host.appendChild(n); return n; }
    var title = el('h3', '섬별 오답 풀이 기록 초기화'); title.id = 'acLearningResetTitle';
    host.setAttribute('aria-labelledby', title.id);
    el('p', '선택한 섬의 오답 풀이 기록과 나의 기록에 표시되는 해당 오답 기록을 초기화하는 기능입니다. XP·문제 원본·단어장·일반 진행·정답 기록·다른 섬은 보존합니다.');
    ['역사섬 오답 기록 초기화', '영어섬 오답 기록 초기화'].forEach(function (label) {
      var b = el('button', label); b.type = 'button'; b.className = 'tool-btn'; b.disabled = true; b.setAttribute('aria-describedby', 'acLearningResetStatus');
    });
    var status = el('p', life ? '초기화 기능 지원 여부를 확인하고 있어요.' : '로그인한 계정에서만 확인할 수 있어요.');
    status.id = 'acLearningResetStatus'; status.setAttribute('role', 'status');
    function current() { return alive && host.isConnected && life && identity(api) === life; }
    if (api && api.onChange) off = api.onChange(function () {
      if (identity(api) !== life && alive) { alive = false; status.textContent = '계정이 바뀌었어요. 마이페이지를 다시 열어 주세요.'; }
    });
    if (life) {
      Promise.resolve().then(function () {
        if (!current()) return null;
        if (!api.learningResets) throw new Error('unsupported');
        return api.learningResets();
      }).then(function (d) { if (current()) status.textContent = describe(d); }, function () {
        if (current()) status.textContent = '초기화 기능 지원 여부를 확인하지 못했어요. 기록은 변경되지 않았습니다.';
      });
    }
    return function () { alive = false; if (typeof off === 'function') off(); };
  }
  var api = { mount: mount, identity: identity, describe: describe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') root.HanqLearningReset = api;
})(typeof window !== 'undefined' ? window : globalThis);