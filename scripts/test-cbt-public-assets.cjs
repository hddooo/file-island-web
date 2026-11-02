'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'../media/cbt-originals'),data=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
assert.deepEqual(Object.keys(data),['files']);
const names=Array.from({length:10},(_,j)=>Array.from({length:50},(_,i)=>`${j+70}-${String(i+1).padStart(2,'0')}.webp`)).flat().concat('72-common47-48.webp').sort();
assert.deepEqual(Object.keys(data.files).sort(),names);
assert.deepEqual(fs.readdirSync(root).sort(),[...names,'manifest.json'].sort());
for(const name of names){const b=fs.readFileSync(path.join(root,name));assert.equal(b.toString('latin1',0,4),'RIFF');assert.equal(b.toString('latin1',8,12),'WEBP');assert.match(data.files[name],/^[0-9a-f]{64}$/);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),data.files[name]);}
console.log('500 public original questions +72 common image + hash-only manifest verified; no grading keys or account records');
