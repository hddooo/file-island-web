'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'docs/joseon-full-summary-sources.json'),'utf8'));
for(const key of ['comic','guide']){const s=data.sources[key],actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,s.file))).digest('hex');if(actual!==s.sha256)throw Error('Summary source changed: '+s.file);}
const output='window.HANQ_JOSEON_FULL_SUMMARY='+JSON.stringify(data)+';\n',target=path.join(root,'media/joseon-full-summary-data.js');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('Regenerate Joseon summary data');console.log('Joseon summary data/source hashes match');}else fs.writeFileSync(target,output);
