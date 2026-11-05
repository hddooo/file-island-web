#!/usr/bin/env node
'use strict';

// Dependency-free contract checks. Browser rendering is a separate QA step.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../media/history-evening.css'), 'utf8');
const css = source.replace(/\/\*[\s\S]*?\*\//g, '');

function blockAfter(marker) {
  const start = css.indexOf(marker);
  assert.notEqual(start, -1, `Missing ${marker}`);
  const open = css.indexOf('{', start);
  let depth = 1;
  for (let end = open + 1; end < css.length; end++) {
    if (css[end] === '{') depth++;
    if (css[end] === '}' && --depth === 0) return css.slice(open + 1, end);
  }
  assert.fail(`Unclosed ${marker}`);
}

const flame = blockAfter('html body #app .history-evening .he-flame{');
const secondary = blockAfter('html body #app .history-evening .he-flame-b{');
assert.match(flame, /bottom:0;left:0;width:100%;height:100%;transform-origin:50% 100%/);
assert.match(flame, /animation:he-flame 2\.4s -\.2s ease-in-out infinite!important/);
assert.match(secondary, /opacity:\.35;animation-duration:1\.7s!important;animation-delay:-\.6s!important/);
assert.equal((css.match(/animation:he-flame /g) || []).length, 1, 'One flame animation declaration');
assert.doesNotMatch(css, /he-flame-visible/, 'No later inflation override');

const keyframes = blockAfter('@keyframes he-flame{');
const beats = [...keyframes.matchAll(/([^{}]+)\{([^{}]+)\}/g)];
assert.equal(beats.length, 5);
assert.equal(beats[0][1].trim(), '0%,100%', 'Identical loop endpoints');
const offsets = [];
for (const [, beat, declarations] of beats) {
  offsets.push(...beat.trim().split(',').map(Number.parseFloat));
  const transform = declarations.match(/^transform:translateX\((-?[\d.]+)(?:px)?\) scaleY\(([\d.]+)\) skewX\((-?[\d.]+)deg\)$/);
  assert.ok(transform, `Transform-only flame beat: ${beat}`);
  const [, x, y, skew] = transform.map(Number);
  assert.ok(Math.abs(x) <= .25, 'Sway stays within a quarter CSS pixel');
  assert.ok(y >= .98 && y <= 1.03, 'Height changes by at most -2/+3 percent');
  assert.ok(Math.abs(skew) <= 1.8, 'Tip lean is subtle');
}
assert.deepEqual(offsets, [0, 100, 17, 39, 62, 81]);
assert.doesNotMatch(keyframes, /opacity|scaleX|scale\(|width|height|left|top|filter|background/);

const reduced = blockAfter('@media(prefers-reduced-motion:reduce){');
assert.match(reduced, /:is\([^)]*\.he-warmth,\.he-flame,[^)]*\)\{animation:none!important;transition:none!important\}/);
assert.ok(css.indexOf('@media(prefers-reduced-motion:reduce)') > css.indexOf('animation:he-flame '));
assert.match(css, /\.he-paused :is\([^)]*\.he-warmth,\.he-flame,[^)]*\)\{animation-play-state:paused!important\}/);
assert.match(css, /\.he-fire:not\(\.he-fire-ready\) \*\{animation-play-state:paused!important\}/);
for (const selector of ['.he-camp', '.he-fire', '.he-chairs']) {
  assert.doesNotMatch(blockAfter(`html body #app .history-evening ${selector}{`), /animation:/, `${selector} remains stationary`);
}
assert.match(css, /\.he-camp\{left:40%;top:74%;width:31%\}/, 'Original portrait placement');
assert.match(css, /\.he-warmth\{[^}]*animation:he-firelight 1\.9s -\.4s ease-in-out infinite alternate!important/);
assert.equal(blockAfter('@keyframes he-firelight{'), 'from{opacity:.6}to{opacity:.9}');
assert.match(css, /html\.world-low-power body #app \.history-evening \.he-aurora\{animation:none!important/);
console.log('History campfire: fixed footprint, bounded tip flicker, translucent second flame, loop continuity, paused/load/reduced-motion and portrait guards passed.');
