'use strict';
// Source-level geometry regression only. This does not render CSS, labels,
// focus rings, or prove real-device touch and viewport behavior.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'media/island-harbors.js'), 'utf8');
const landmarks = source.match(/var landmarks=(\{[\s\S]*?\n  \});/);
const stops = source.match(/var stops=(\{[\s\S]*?\n  \});/);
const start = source.indexOf('    function fitScene(){');
const end = source.indexOf("    art.addEventListener('load',fitScene)", start);
assert(landmarks && stops && start >= 0 && end > start, 'Expected live history fitScene source');
function style() {
  return {setProperty(name, value) { this[name] = value; }};
}
const context = vm.createContext({
  kind: 'history',
  map: {isConnected: true, clientWidth: 368, clientHeight: 400, dataset: {}},
  chart: {style: style()},
  controls: [],
  portrait: true,
  matchMedia() { return {matches: context.portrait}; }
});
vm.runInContext('var landmarks=' + landmarks[1] + ';var stops=' + stops[1] + ';' + source.slice(start, end), context);
const ids = ['homePastExams', 'homeFormalExams', 'homeWrongNotes'];
function fit(width, height, portrait) {
  context.map.clientWidth = width;
  context.map.clientHeight = height;
  context.portrait = portrait;
  context.controls = ids.map(id => ({id, dataset: {}, style: style(), classList: {contains(name) { return name === 'history-landmark'; }}}));
  context.fitScene();
  return {
    mode: context.map.dataset.sceneFit,
    picture: {...context.chart.style},
    rects: context.controls.map(control => ({
      id: control.id,
      ...Object.fromEntries(['left', 'top', 'width', 'height'].map(name => [name, parseFloat(control.style[name])]))
    }))
  };
}
function verify(width, height, result) {
  assert.deepEqual(result.rects.map(r => r.id), ids, 'Native DOM order remains unchanged');
  for (const r of result.rects) {
    assert(r.width >= 44 && r.height >= 44, 'Minimum touch dimensions');
    assert(Math.min(r.left, r.top, width - r.left - r.width, height - r.top - r.height) >= 3.999, JSON.stringify({width, height, r}));
  }
  for (let i = 0; i < result.rects.length; i++) {
    for (let j = i + 1; j < result.rects.length; j++) {
      const a = result.rects[i], b = result.rects[j];
      const overlapX = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
      assert(!(overlapX > 1e-8 && overlapY > 1e-8), 'Portrait controls must not overlap');
    }
  }
}
const regression = fit(368, 400, true);
assert.equal(regression.mode, 'contain');
assert.equal(regression.rects.find(r => r.id === 'homeWrongNotes').left, 41.5);
// Current portrait map minimum is 260px border-box with 1px borders.
let count = 0;
for (let width = 150; width <= 700; width++) {
  for (let height = 258; height <= 1200; height++) {
    const coverScale = Math.max(width / 900, height / 1200);
    if (!(height - 8 < .833 * 1200 * coverScale)) continue;
    const result = fit(width, height, true);
    assert.equal(result.mode, 'contain');
    verify(width, height, result);
    count++;
  }
}
assert.equal(count, 125751);
for (const [width, height] of [[368, 258], [822, 190], [673, 400], [678, 600]]) {
  fit(width, height, width <= 700 && height >= 258);
  assert.deepEqual(fit(368, 400, true), regression, 'Repeated size/orientation restoration');
}
console.log('PASS: ' + count + ' live-function portrait-contain boxes; minimum44px targets; no out-of-bounds controls or rectangle overlaps. Mobile rendering remains a separate check.');
