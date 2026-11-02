'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { build } = require('./build-app-version.cjs');

// Deliberately narrower than a repository upload: tracked public runtime files only.
const entries = ['index.html', 'RELEASE_VERSION', 'manifest.webmanifest', 'favicon.ico', 'apple-touch-icon.png', 'media', 'inquiries', 'ops'];
function allowed(file) {
  return entries.some(entry => file === entry || file.startsWith(entry + '/')) &&
    !file.split('/').some(part => part.startsWith('.') || ['enhanced', 'renders', 'private-data', 'hanq-private-data', 'node_modules'].includes(part)) &&
    (!/\.pdf$/i.test(file) || file === 'media/connector-summary.pdf');
}
function buildStatic(root, out) {
  root = path.resolve(root); out = path.resolve(out);
  if (out === root || entries.some(entry => out === path.join(root, entry) || out.startsWith(path.join(root, entry) + path.sep))) throw Error('Output must be outside public source paths');
  if (fs.existsSync(out)) throw Error('Output already exists; use a new output directory');
  execFileSync('git', ['diff', '--quiet', 'HEAD', '--', ...entries], { cwd: root });
  const buildId = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const files = execFileSync('git', ['ls-files', '-z', '--', ...entries], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).filter(allowed).sort();
  for (const file of files) {
    let cursor = root;
    for (const part of file.split('/')) {
      cursor = path.join(cursor, part);
      if (fs.lstatSync(cursor).isSymbolicLink()) throw Error('Public symlink is not supported: ' + file);
    }
    if (!fs.statSync(cursor).isFile()) throw Error('Expected a regular public file: ' + file);
  }
  fs.mkdirSync(out, { recursive: true });
  // Export index bytes with LF regardless of a Windows checkout's autocrlf setting.
  // The clean-source check above also rejects staged changes relative to HEAD.
  execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'checkout-index',
    '--prefix=' + out.replace(/\\/g, '/') + '/', '-z', '--stdin'],
    { cwd: root, input: files.join('\0') + '\0' });
  build(out, buildId);
  const release = fs.readFileSync(path.join(out, 'RELEASE_VERSION'), 'utf8').trim();
  const hashes = [...files, 'app-version.json'].sort().map(file => {
    const bytes = fs.readFileSync(path.join(out, file));
    return { path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
  const manifest = { schema: 1, buildId, release, files: hashes };
  fs.writeFileSync(path.join(out, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const manifest = buildStatic(root, process.argv[2] || path.join(root, '.artifacts/site'));
  console.log(`Static site: ${manifest.buildId}, release ${manifest.release}, ${manifest.files.length} files`);
}
module.exports = { allowed, buildStatic };
