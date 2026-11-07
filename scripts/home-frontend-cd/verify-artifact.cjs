'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function safePath(p){
  if(typeof p!=='string'||!p||/[\\:\x00-\x1f\x7f]/.test(p)||p.startsWith('/')||p.split('/').some(x=>!x||x==='.'||x==='..'||x.startsWith('.')||/[. ]$/.test(x)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(x)))throw Error('Unsafe artifact path');
  return p;
}
function publicPath(p){return ['index.html','RELEASE_VERSION','manifest.webmanifest','favicon.ico','apple-touch-icon.png','app-version.json','auth/login.html','auth/login.js'].includes(p)||/^(media|ops|inquiries)\//.test(p)&&!p.split('/').some(x=>['enhanced','renders','private-data','hanq-private-data','node_modules'].includes(x.toLowerCase()))&&!/\.(?:pem|key|p12|pfx|dump|sql(?:\.gz)?)$/i.test(p)&&(!/\.pdf$/i.test(p)||p==='media/connector-summary.pdf');}
function verify(root,sha){
  if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Expected exact commit SHA');
  root=path.resolve(root);if(!fs.lstatSync(root).isDirectory()||fs.lstatSync(root).isSymbolicLink())throw Error('Expected real artifact directory');
  const actual=[];
  function walk(dir,prefix=''){for(const name of fs.readdirSync(dir)){const rel=prefix+name;safePath(rel);const file=path.join(dir,name),st=fs.lstatSync(file);if(st.isSymbolicLink())throw Error('Artifact symlink rejected');if(st.isDirectory())walk(file,rel+'/');else if(st.isFile())actual.push(rel);else throw Error('Expected regular artifact file');}}
  walk(root);
  const manifestBytes=fs.readFileSync(path.join(root,'build-manifest.json'));if(manifestBytes.length>4*1024*1024)throw Error('Oversized manifest');
  const m=JSON.parse(manifestBytes);if(m.schema!==1||m.buildId!==sha||!/^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-beta)?$/.test(m.release)||!Array.isArray(m.files)||m.files.length<2||m.files.length>10000)throw Error('Invalid artifact identity');
  const seen=new Set(),entries=[];let bytes=0;
  for(const f of m.files){safePath(f.path);const key=f.path.toLowerCase();if(seen.has(key)||!publicPath(f.path)||!Number.isSafeInteger(f.bytes)||f.bytes<0||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error('Invalid manifest entry');seen.add(key);bytes+=f.bytes;if(bytes>2*1024**3)throw Error('Artifact exceeds 2GiB');const b=fs.readFileSync(path.join(root,f.path));if(b.length!==f.bytes||digest(b)!==f.sha256)throw Error('Artifact checksum mismatch: '+f.path);entries.push({path:f.path,sha256:f.sha256});}
  const expected=entries.map(x=>x.path).concat('build-manifest.json').sort();if(JSON.stringify(actual.sort())!==JSON.stringify(expected))throw Error('Unlisted or missing artifact file');
  const version=JSON.parse(fs.readFileSync(path.join(root,'app-version.json'),'utf8')),release=fs.readFileSync(path.join(root,'RELEASE_VERSION'),'utf8').trim(),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  if(version.schema!==1||version.buildId!==sha||version.release!==m.release||release!==m.release||!html.includes('<meta name="hanq-app-version" content="'+sha+'">')||!html.includes('<meta name="hanq-release-version" content="'+release+'">'))throw Error('Version metadata mismatch');
  entries.push({path:'build-manifest.json',sha256:digest(manifestBytes)});
  return {sha,release,bytes,entries,manifestSha256:digest(manifestBytes)};
}
function writeControls(root,sha,out){const r=verify(root,sha);fs.mkdirSync(out,{recursive:true});for(const file of ['FILES','SHA256SUMS','INDEX_SHA256','HEALTH_PATH','HEALTH_SHA256'])if(fs.existsSync(path.join(out,file)))throw Error('Control output exists');fs.writeFileSync(path.join(out,'FILES'),r.entries.map(x=>x.path).join('\n')+'\n');fs.writeFileSync(path.join(out,'SHA256SUMS'),r.entries.map(x=>x.sha256+'  '+x.path).join('\n')+'\n');fs.writeFileSync(path.join(out,'INDEX_SHA256'),r.entries.find(x=>x.path==='index.html').sha256+'\n');const entry=r.entries.find(x=>x.path==='auth/login.html')||r.entries.find(x=>x.path==='index.html');fs.writeFileSync(path.join(out,'HEALTH_PATH'),(entry.path==='auth/login.html'?'/auth/login.html':'/')+'\n');fs.writeFileSync(path.join(out,'HEALTH_SHA256'),entry.sha256+'\n');return r;}
module.exports={verify,writeControls,safePath,publicPath};
