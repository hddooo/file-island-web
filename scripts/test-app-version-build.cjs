'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { build } = require('./build-app-version.cjs');
const root = path.resolve(__dirname,'..'), dir = fs.mkdtempSync(path.join(os.tmpdir(),'hanq-version-'));
try {
  fs.copyFileSync(path.join(root,'index.html'),path.join(dir,'index.html'));
  fs.writeFileSync(path.join(dir,'RELEASE_VERSION'),'0.2.1-beta\n');
  const id = 'a'.repeat(40), next = 'b'.repeat(40);
  assert.equal(build(dir,id),id); assert.equal(build(dir,next),next);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'app-version.json'))),{schema:1,buildId:next,release:'0.2.1-beta'});
  assert(fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('content="'+next+'"'));
  const built = fs.readFileSync(path.join(dir,'index.html'),'utf8');
  const urls = [...built.matchAll(/(?:src|href)="(media\/[^"?#]+\.(?:js|css)\?[^"]*)"/g)];
  assert(urls.length > 10); urls.forEach(m => assert.equal(new URL(m[1],'https://fixture.test').searchParams.get('build'),next));
  assert(!built.includes('build='+id));
  const hardware=built.match(/href="(\/media\/device-shell\.css\?[^"]*)"/);assert(hardware);assert.equal(new URL(hardware[1],'https://fixture.test').searchParams.get('build'),next);
  assert.throws(()=>build(dir,'untrusted<version>'));
  for(const invalid of ['0.2.01-beta','0.2.1 garbage','0.2.1<script>']){fs.writeFileSync(path.join(dir,'RELEASE_VERSION'),invalid);assert.throws(()=>build(dir,next));}
  fs.writeFileSync(path.join(dir,'RELEASE_VERSION'),'v0.1.5');build(dir,next);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'app-version.json'))).release,'v0.1.5');
  const config = JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
  assert.equal(config.buildCommand,'node scripts/build-app-version.cjs');
  for (const url of ['/app-version.json','/','/index.html']) assert(config.headers.find(x=>x.source===url).headers.some(x=>x.key==='Cache-Control'&&x.value==='no-store'));
  console.log('PASS version build, repeat build, input validation, deployment headers');
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
