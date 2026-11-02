const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../media/battle-island.js'), 'utf8');
const text = source.slice(source.indexOf('function missileFrames('), source.indexOf('function launchVisual('));
const framesFor = new Function(text + '; return missileFrames;')();
for (const width of [296, 366, 1424]) for (const dir of [-1, 1]) {
  const dx = width * .65 * dir, dy = 30, frames = framesFor(dx, dy, dir, width);
  let prior = null, ys = [];
  for (const frame of frames) {
    const values = frame.transform.match(/translate\(calc\(-50% \+ ([-.\d]+)px\),calc\(-50% \+ ([-.\d]+)px\)\) rotate\(([-.\d]+)deg\)/).slice(1).map(Number);
    assert(values.every(Number.isFinite));
    if (prior) assert(Math.abs(values[2] - prior[2]) <= 180, 'heading must unwrap along the path');
    ys.push(values[1]); prior = values;
  }
  assert.equal(frames[0].offset, 0); assert.equal(frames.at(-1).offset, 1);
  assert(Math.abs(prior[0] - dx) < 1e-7); assert(Math.abs(prior[1] - dy) < 1e-7);
  let turns = 0;
  for (let i = 2; i < ys.length; i++) if ((ys[i]-ys[i-1])*(ys[i-1]-ys[i-2]) < 0) turns++;
  assert(turns >= 5, 'spiral and homing course must change direction');
}
console.log('PASS: 6 missile trajectories, exact endpoint, finite samples, continuous headings, spiral/homing corrections');
