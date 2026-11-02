'use strict';
// Read-only deployment preflight. Never uploads an original or changes environment settings.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const dir=process.argv[2],manifest=process.argv[3];
if(!dir||!manifest||!path.isAbsolute(dir)||!path.isAbsolute(manifest)){console.error('Usage: node scripts/check-cbt79-assets.cjs <absolute private directory> <absolute manifest>');process.exit(2);}
let files;try{files=JSON.parse(fs.readFileSync(manifest)).files;}catch{console.error('Manifest unavailable');process.exit(1);}
let checked=0,errors=[];
for(let n=1;n<=50;n++){const name='79-'+String(n).padStart(2,'0')+'.webp';try{const file=path.join(dir,name);if(!fs.lstatSync(file).isFile())throw Error('not_regular');const b=fs.readFileSync(file),entry=files[name],hash=typeof entry==='string'?entry:entry&&entry.sha256;if(!hash||crypto.createHash('sha256').update(b).digest('hex')!==hash)throw Error('hash_mismatch');if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw Error('invalid_webp');checked++;}catch(e){errors.push({number:n,reason:e.code==='ENOENT'?'missing':e.message==='hash_mismatch'?'hash_mismatch':e.message==='invalid_webp'?'invalid_webp':'unavailable'});}}
console.log(JSON.stringify({round:79,checked,errors,writes:0}));process.exit(errors.length?1:0);
