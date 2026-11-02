'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};vm.runInNewContext(fs.readFileSync('media/toeic-notes.js','utf8'),{window});const manifest=JSON.parse(fs.readFileSync('media/vocabulary-chapters-v1.json','utf8'));window.HanqToeicNotes.validateChapters(manifest);
const ids=manifest.chapters.flatMap(c=>c.wordIds),retired=new Set(manifest.retiredWordIds),words=ids.map(id=>({id,expression:'fixture '+id})),extra=Array.from({length:31},(_,i)=>({id:'extra-'+String(i).padStart(3,'0'),expression:'extra '+i,createdAt:'2026-10-30T00:00:00Z'}));
function grouped(input){return JSON.parse(JSON.stringify(window.HanqToeicNotes.chapterGroups(manifest,input)));}
const x=grouped([...words,...extra]),actual=x.chapters.flatMap(c=>c.words.map(n=>n.id)),expected=ids.filter(id=>!retired.has(id)).concat(extra.map(n=>n.id));
assert.deepEqual(x.chapters.map(c=>c.words.length),[50,50,50,7]);assert.deepEqual(actual,expected);assert.equal(new Set(actual).size,actual.length);assert.equal(x.unassigned.length,0);assert.deepEqual(x.retired.map(x=>x.id).sort(),[...retired].sort());assert.deepEqual(grouped([...extra,...words].reverse()).chapters.flatMap(c=>c.words.map(n=>n.id)),expected);
assert(!fs.existsSync('media/vocabulary-mini'));assert(!fs.existsSync('media/vocabulary-mini.js'));assert(!fs.existsSync('media/vocabulary-mini-loader.js'));console.log(JSON.stringify({sizes:x.chapters.map(c=>c.words.length),unchangedIds:true,retiredPreserved:x.retired.length,duplicateOrLost:0,generatedMiniBanksRemoved:true}));
