'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { allowed, buildStatic } = require('./build-static-site.cjs');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'file-island-static-'));
try {
  for (const file of ['.env', 'docs/a.md', 'scripts/a.cjs', 'test/fixtures/a.html', 'media/a.pdf', 'media/renders/a.png', 'media/.env', 'media/private-data/a.json']) assert.equal(allowed(file), false, file);
  assert(allowed('media/connector-summary.pdf'));
  const first = buildStatic(root, path.join(temp, 'first'));
  const second = buildStatic(root, path.join(temp, 'second'));
  assert.deepEqual(first, second, 'same commit produces byte-identical public files and manifest');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(first.buildId, sha);
  assert.equal(JSON.parse(fs.readFileSync(path.join(temp, 'first/app-version.json'))).buildId, sha);
  assert(fs.readFileSync(path.join(temp, 'first/index.html'), 'utf8').includes('content="' + sha + '"'));
  assert.deepEqual(fs.readFileSync(path.join(temp, 'first/media/api-client.js')),
    execFileSync('git', ['show', 'HEAD:media/api-client.js'], { cwd: root }), 'export canonical Git bytes across Windows and Linux');
  for (const file of ['ops/index.html', 'inquiries/index.html', 'media/connector-summary.pdf']) assert(first.files.some(item => item.path === file), file);
  assert(first.files.every(item => allowed(item.path) || item.path === 'app-version.json'));
  assert.throws(() => buildStatic(root, path.join(temp, 'first')), /already exists/);
  assert.throws(() => buildStatic(root, root), /outside public/);
  console.log(`PASS static build: repeatable manifest, full SHA, ${first.files.length} runtime files, private/source exclusions, existing output preserved`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
