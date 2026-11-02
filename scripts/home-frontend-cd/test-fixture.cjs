'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const SHA='a'.repeat(40),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(root,sha=SHA){
 fs.mkdirSync(root,{recursive:true});const release='0.2.9-beta',files={'index.html':`<meta name="hanq-app-version" content="${sha}"><meta name="hanq-release-version" content="${release}"><script src="media/app.js?build=${sha}"></script>`,'RELEASE_VERSION':release+'\n','app-version.json':JSON.stringify({schema:1,buildId:sha,release})+'\n','media/app.js':'window.syntheticBuild="'+sha+'";','manifest.webmanifest':'{"scope":"/"}'};
 for(const[p,b]of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),b);}
 const m={schema:1,buildId:sha,release,files:Object.keys(files).sort().map(p=>({path:p,bytes:Buffer.byteLength(files[p]),sha256:hash(files[p])}))};fs.writeFileSync(path.join(root,'build-manifest.json'),JSON.stringify(m));return m;
}
module.exports={fixture};
