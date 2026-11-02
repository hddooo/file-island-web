'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../test/fixtures/regression-baselines');
module.exports=function readRegressionBaseline(ref,file){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const matches=manifest.files.filter(entry=>entry.sourceCommit.startsWith(ref)&&entry.sourcePath===file);
 assert.equal(matches.length,1,'One exact checked-in regression baseline is required: '+ref+':'+file);
 const entry=matches[0],bytes=fs.readFileSync(path.join(root,entry.fixture));
 const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(blob,entry.gitBlob,'Regression baseline Git blob mismatch');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,'Regression baseline SHA256 mismatch');
 return bytes;
};
