'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
function build(root, supplied) {
  const buildId = supplied || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/.test(buildId)) throw new Error('Expected a full Git commit for app version');
  const release = fs.readFileSync(path.join(root, 'RELEASE_VERSION'), 'utf8').trim();
  if (!/^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-beta)?$/.test(release)) throw new Error('Expected a semantic release version');
  const index = path.join(root, 'index.html');
  const html = fs.readFileSync(index, 'utf8');
  const marker = /<meta name="hanq-app-version" content="[^"]*">/g;
  if ((html.match(marker) || []).length !== 1) throw new Error('Expected exactly one app version marker');
  const releaseMarker = /<meta name="hanq-release-version" content="[^"]*">/g;
  if ((html.match(releaseMarker) || []).length !== 1) throw new Error('Expected exactly one release version marker');
  const versioned = html.replace(marker, '<meta name="hanq-app-version" content="' + buildId + '">')
    .replace(releaseMarker, '<meta name="hanq-release-version" content="' + release + '">')
    .replace(/\b(src|href)="(\/?media\/[^"?#]+\.(?:js|css))(?:\?([^"]*))?"/g, (_, attr, file, query) => {
      const params = new URLSearchParams(query || ''); params.set('build', buildId);
      return attr + '="' + file + '?' + params.toString() + '"';
    });
  fs.writeFileSync(index, versioned);
  fs.writeFileSync(path.join(root, 'app-version.json'), JSON.stringify({ schema: 1, buildId, release }) + '\n');
  return buildId;
}
if (require.main === module) console.log('App version: ' + build(path.resolve(__dirname, '..'), process.env.VERCEL_GIT_COMMIT_SHA));
module.exports = { build };
