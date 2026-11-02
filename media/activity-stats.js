/* HanQ 나의 학습 기록(잔디·오늘·정답률·연속 학습·오답 해결)과 개인 랭크 — 저장된 기록에서 계산만 하는 모듈(저장·채점하지 않음)
 *
 *  window.HanqStats / require('./media/activity-stats.js')
 *
 *  활동 = 채점 기록(attempt) 한 건. 빈칸·실전 모의·오답 다시 풀기·모의고사 회차의 최종 채점이 모두 활동이다.
 *    같은 문제를 다른 때 다시 풀면 각각 센다(풀이 수). 서로 다른 문제 수는 따로 센다. 같은 제출의 중복은 저장소가 이미 하나로 줄인다(ID로 한 번 더 걸러 냄).
 *    날짜는 기록의 실제 시각(ts)을 한국 시간(UTC+9, 서머타임 없음)으로 바꾼 날. 기기 시간대와 관계없다. 시각이 없거나 잘못된 기록은 ‘날짜 모름’으로 따로 센다(오늘이나 다른 날로 지어 넣지 않음).
 *    웹툰 읽음 표시(read-progress)는 활동·점수에 넣지 않는다.
 *  랭크 = 순위 대상으로 명시된(rankEligible:true) 날짜가 붙은 고정 미니 20·실전 50 회차의 ‘처음 정해진 최종 결과’만.
 *    회차마다 +10×맞힘 −3×틀림(답하지 않음은 틀림), 회차를 더한 뒤 0 밑으로 내려가지 않음. 레벨 = 1 + floor(랭크 점수 / 100).
 *    보통 빈칸·실전 모의·오답 다시 풀기·개인 오답 모의고사(늘 rankEligible:false)는 랭크에 0. 같은 회차를 다시 제출·새로 고침해도 회차당 한 번.
 *    이 점수는 한국사능력검정시험 문항 배점(1–3점)·HanQ 연습 점수와 다르다. 이 브라우저 안의 개인 기록일 뿐, 다른 사람과 견주는 공개 순위가 아니다. */
(function (root) {
  'use strict';
  var KST_MS = 9 * 3600 * 1000, DAY_MS = 86400000;
  var RANK_RULES = Object.freeze({ version: 'hanq-rank-1', perCorrect: 10, perWrong: -3, floor: 0, levelSize: 100 });

  function kstDay(ts) { if (!Number.isFinite(ts)) return null; var d = new Date(ts + KST_MS); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* 한국 날짜 'YYYY-MM-DD'에서 n일 더한 날짜(달·해·윤년을 Date가 처리) */
  function addDays(day, n) { var p = day.split('-').map(Number), t = Date.UTC(p[0], p[1] - 1, p[2]) + n * DAY_MS, d = new Date(t); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }

  /* attempts: 채점 기록 목록, o.now: 지금 시각(검사용으로 넣을 수 있음), o.days: 잔디 날 수(기본 70 = 10주) */
  function activity(attempts, o) {
    o = o || {};
    var now = Number.isFinite(o.now) ? o.now : Date.now(), today = kstDay(now), days = o.days || 70, subject = typeof o.subject === 'string' && o.subject ? o.subject : 'history';
    var seen = Object.create(null), byDay = Object.create(null), list = [], unknown = 0;
    (attempts || []).forEach(function (a) {
      if (!a || typeof a !== 'object') return;
      if ((a.subject || 'history') !== subject) return; // 다른 과목 기록은 이 과목 잔디·통계에 넣지 않음(과목이 없던 예전 기록은 한국사)
      var id = typeof a.id === 'string' && a.id ? a.id : null; if (id) { if (seen[id]) return; seen[id] = 1; } // 같은 기록 ID는 한 번
      var d = kstDay(a.ts); if (!d || a.ts < 1.5e12 || a.ts > 4.1e12) { unknown++; return; }
      list.push(a); var b = byDay[d] || (byDay[d] = { count: 0, correct: 0, q: Object.create(null) }); b.count++; if (a.correct === true) b.correct++; b.q[(a.subject || 'history') + '|' + a.mode + '|' + a.questionId] = 1;
    });
    var correct = list.filter(function (a) { return a.correct === true; }).length, uq = Object.create(null);
    list.forEach(function (a) { uq[(a.subject || 'history') + '|' + a.mode + '|' + a.questionId] = 1; });
    // 연속 학습: 오늘 했으면 오늘부터, 안 했으면 어제부터 거꾸로 이어진 날 수
    var streak = 0, start = byDay[today] ? today : addDays(today, -1);
    for (var d = start; byDay[d]; d = addDays(d, -1)) streak++;
    var cells = [];
    for (var i = days - 1; i >= 0; i--) { var day = addDays(today, -i), x = byDay[day]; cells.push({ day: day, count: x ? x.count : 0, correct: x ? x.correct : 0, unique: x ? Object.keys(x.q).length : 0, level: level(x ? x.count : 0), today: day === today }); }
    var t = byDay[today];
    return { today: today, total: list.length, correct: correct, accuracy: list.length ? Math.round(correct / list.length * 1000) / 10 : null, uniqueQuestions: Object.keys(uq).length,
      todayCount: t ? t.count : 0, todayUnique: t ? Object.keys(t.q).length : 0, todayCorrect: t ? t.correct : 0, activeDays: Object.keys(byDay).length, streak: streak, dateUnknown: unknown, cells: cells };
  }
  function level(n) { return n <= 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4; }

  /* 오답 해결: 지금 내용으로 다시 풀 수 있는 서로 다른 오답(아직 못 풂 + 해결) 중 해결한 비율. 옛 기록(내용이 바뀜·빠짐·맞지 않음)은 빼고 수만 따로 */
  function wrongResolution(notes) {
    var u = 0, r = 0, old = 0;
    (notes || []).forEach(function (n) { if (!n) return; if (n.status === 'unresolved') u++; else if (n.status === 'resolved') r++; else old++; });
    return { unresolved: u, resolved: r, excludedOld: old, total: u + r, rate: u + r ? Math.round(r / (u + r) * 1000) / 10 : null };
  }

  /* 상품 설정은 회차 컨트롤러의 HanqRun.PRODUCTS 한곳(브라우저는 전역, Node는 require, 검사에서는 넣어 줄 수 있음) */
  function defaultProducts() {
    if (root.HanqRun && root.HanqRun.PRODUCTS) return root.HanqRun.PRODUCTS;
    try { if (typeof require === 'function') return require('./run-controller.js').PRODUCTS; } catch (e) {}
    return null;
  }
  function nonNegInt(x) { return typeof x === 'number' && Number.isInteger(x) && x >= 0; }
  /* 순위에 넣을 수 있는 결과인지: 설정에서 순위 대상인 고정 상품(fixed-mini·fixed-formal 등)이고, 결과의 종류·표시가 그 상품과 맞고,
     맞힘·틀림이 0 이상의 정수이며 합이 그 상품 문항 수를 넘지 않음(내용이 바뀌어 채점하지 않은 문항이 있으면 더 적을 수 있음) */
  function eligibleFinal(f, products) {
    if (!f || typeof f !== 'object' || !products) return false;
    var p = Object.prototype.hasOwnProperty.call(products, f.product) ? products[f.product] : null;
    if (!p || p.mode !== 'fixed' || p.rankEligible !== true || f.mode !== 'fixed' || f.rankEligible !== true) return false;
    if (typeof f.runId !== 'string' || !f.runId || typeof f.submissionId !== 'string' || !f.submissionId || !/^\d{4}-\d\d-\d\d$/.test(String(f.kstDate || '')) || !Number.isFinite(f.finalAt)) return false;
    var s = f.score; if (!s || !nonNegInt(s.correct) || !nonNegInt(s.wrong)) return false;
    return s.correct + s.wrong <= p.size;
  }
  /* 개인 랭크: finals = 회차 컨트롤러 reader().finalResults() 결과(회차마다 처음 정해진 결과). 순위 대상 고정 회차만 시각 순으로.
     o.products로 상품 설정을 넣을 수 있음(기본은 HanqRun.PRODUCTS). 맞지 않는 결과는 지어 고치지 않고 건너뜀 */
  function rank(finals, o) {
    var seen = Object.create(null), events = [], pts = 0, products = (o && o.products) || defaultProducts();
    (finals || []).filter(function (f) { return eligibleFinal(f, products); })
      .sort(function (a, b) { return a.finalAt - b.finalAt || (a.runId < b.runId ? -1 : 1); })
      .forEach(function (f) {
        if (seen[f.runId]) return; seen[f.runId] = 1; // 같은 회차는 한 번(처음 결과)
        var c = f.score.correct, w = f.score.wrong, delta = c * RANK_RULES.perCorrect + w * RANK_RULES.perWrong, before = pts;
        pts = Math.max(RANK_RULES.floor, pts + delta);
        events.push({ id: 'rank-' + f.submissionId, runId: f.runId, title: f.title, kstDate: f.kstDate, finalAt: f.finalAt, correct: c, wrong: w, delta: delta, before: before, after: pts, rulesVersion: RANK_RULES.version });
      });
    return { points: pts, level: 1 + Math.floor(pts / RANK_RULES.levelSize), nextAt: (Math.floor(pts / RANK_RULES.levelSize) + 1) * RANK_RULES.levelSize, events: events, rules: RANK_RULES };
  }

  var api = { RANK_RULES: RANK_RULES, kstDay: kstDay, addDays: addDays, activity: activity, wrongResolution: wrongResolution, rank: rank, eligibleFinal: eligibleFinal, level: level };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && root === window) root.HanqStats = api;
})(typeof window !== 'undefined' ? window : globalThis);
