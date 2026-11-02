'use strict';
// The API's existing source_version algorithm, evaluated without API/DB access.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'');assert(root.split(path.sep).includes('private-data'));
const old='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442',current='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const digest=q=>crypto.createHash('sha256').update(JSON.stringify({schema:q.schemaVersion,source:q.source,items:q.items})).digest('hex');
const rows=fs.readdirSync(path.join(root,current,'semantic/quizzes')).filter(f=>f.endsWith('.json')).sort().map(file=>{
 const read=sha=>JSON.parse(fs.readFileSync(path.join(root,sha,'semantic/quizzes',file))),a=read(old),b=read(current);assert.equal(a.source.sha256,old);assert.equal(b.source.sha256,current);const x=digest(a),y=digest(b);assert.notEqual(x,y);return {quizId:b.id,oldSourceVersion:x,newCandidateSourceVersion:y};
});assert.equal(rows.length,8);fs.writeFileSync(path.join(root,current,'validation/source-version-comparison.json'),JSON.stringify(rows,null,2)+'\n');console.log('Eight distinct old/new source versions verified; no user history was read or changed.');
