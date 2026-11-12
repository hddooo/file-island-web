'use strict';
// Production-compatible grading until the matching API expansion is deployed.
// Synthetic fixtures only; canonical source stays unchanged.
const assert = require('node:assert/strict');
require('../media/textbook-source-quiz.js');
const {gradePractice} = globalThis.HanqTextbookSourceQuiz;
let checks = 0;
function item(parts, {kind = 'fill-in', orderMatters = true, separate = false} = {}) {
  const answers = parts.map((text, i) => ({id: 'a' + i, text}));
  return {kind, verification: {status: 'source-verified', textVerified: true, answerPairVerified: true},
    answers, answer: {text: parts.join(', '), parts, orderMatters},
    blanks: separate ? answers.map(a => ({id: 'b' + a.id, answerIds: [a.id]})) : [{id: 'b', answerIds: answers.map(a => a.id)}]};
}
function check(source, values, expected, label) {
  const before = JSON.stringify(source);
  assert.equal(gradePractice(source, values).correct, expected, label || JSON.stringify(values));
  assert.equal(JSON.stringify(source), before, 'canonical source stays unchanged');
  checks++;
}
const compound = item(['동의보감 (광해군)']);
for (const value of ['동의보감 (광해군)', '동의보감(광해군)', '동의보감 (광해군)'.normalize('NFD')]) check(compound, [value], true);
for (const value of ['동의보감/광해군', '동의보감 / 광해군', '동의보감,광해군', ' 동의보감 , 광해군 ', '\t동의보감\n/\t광해군', '동의보감 / 광해군'.normalize('NFD')]) check(compound, [value], false);
for (const value of ['', '동의보감', '광해군', '동의보감 광해군', '광해군 / 동의보감', '동의보감 / 광해', '동의보감 / 선조', '동의보감 / 광해군 / 선조', '동의보감,,광해군', '동의보감 /, 광해군', '/동의보감/광해군', '동의보감,광해군,', '동의보감(=광해군)']) check(compound, [value], false);
const alias = item(['백운동서원 (=소수서원)']);
check(alias, ['백운동서원 (=소수서원)'], true);
for (const value of ['백운동서원', '소수서원', ' 소수 서원 ', '소수서원'.normalize('NFD')]) check(alias, [value], false);
for (const value of ['', '백운동', '소수', '백운동서원 (소수서원)', '백운동서원 / 소수서원', '백운동서원, 소수서원', '소수서원 / 기타', '=소수서원']) check(alias, [value], false);
const slots = item(['동의보감 (광해군)', '백운동서원 (=소수서원)'], {separate: true});
check(slots, ['동의보감 / 광해군', '소수서원'], false);
check(slots, ['동의보감, 광해군', '백운동서원'], false);
check(slots, ['동의보감 (광해군)', '백운동서원 (=소수서원)'], true);
check(slots, ['동의보감', '소수서원'], false);
check(slots, ['소수서원', '동의보감 / 광해군'], false);
check(slots, ['동의보감, 광해군, 소수서원', ''], false);
// No broad punctuation stripping, alias guessing, or ambiguous list flattening.
for (const [canonical, response] of [['3·1 운동', '31운동'], ['가/나', '가,나'], ['가,나', '가/나'], ['가 (나/다)', '가/나/다'], ['가 (나) (다)', '가,나,다'], ['가 (=나/다)', '나'], ['가(나)', '나'], ['가 (=나)', '다']]) check(item([canonical]), [response], false);
check(item(['가/나']), ['가/나'], true);
check(item(['가 (나/다)']), ['가 (나/다)'], true);
check(item(['가', '나'], {orderMatters: false}), ['나, 가'], true);
check(item(['가', '나'], {orderMatters: false}), ['가, 가'], false);
check(item(['가', '나']), ['나, 가'], false);
check(item(['동의보감 (광해군)', '기타']), ['동의보감, 광해군, 기타'], false);
check(item(['동의보감 (광해군)', '기타']), ['동의보감 (광해군), 기타'], true);
for (const value of ['①②③', '1,2,3', '1 → 2 → 3']) check(item(['①', '②', '③'], {kind: 'sequence'}), [value], true);
for (const value of ['2,1,3', '1/2/3', '1,2', '1,2,3,4']) check(item(['①', '②', '③'], {kind: 'sequence'}), [value], false);
check(item(['가 (나)'], {kind: 'sequence'}), ['가/나'], false);
check(item(['가 (=나)'], {kind: 'sequence'}), ['나'], false);
const feedback = gradePractice(compound, ['오답']).slots[0].feedback;
assert.equal(feedback, '✕ 정답: 동의보감 (광해군)'); checks++;
assert.equal(gradePractice(alias, ['오답']).slots[0].feedback, '✕ 정답: 백운동서원 (=소수서원)'); checks++;
console.log(JSON.stringify({checks, failures: 0, scope: 'production-compatible literal single answers; expanded separators and aliases deferred; existing lists and sequences; immutable display'}));
