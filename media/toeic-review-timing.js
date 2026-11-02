(function(root){'use strict';
 function norm(s){return s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
 function map(script,timing){
  var pieces=String(script||'').match(/\s+|[^\s]+/g)||[],tokens=[];
  pieces.forEach(function(text,i){var key=norm(text);if(key)tokens.push({key:key,index:i});});
  var words=(timing&&Array.isArray(timing.words)?timing.words:[]).filter(function(w){return typeof w.text==='string'&&Number.isFinite(w.start)&&Number.isFinite(w.end)&&w.start>=0&&w.end>w.start&&norm(w.text);});
  // Exact normalized token LCS tolerates corrected text, speaker labels and omitted instructions.
  // Unmatched text has no invented interval. Bound work for malformed/untrusted catalogs.
  if(tokens.length>4000||words.length>4000)return pieces.map(function(text){return{text:text};});
  var rows=Array.from({length:tokens.length+1},function(){return new Uint16Array(words.length+1);});
  for(var i=tokens.length-1;i>=0;i--)for(var j=words.length-1;j>=0;j--)rows[i][j]=tokens[i].key===norm(words[j].text)?1+rows[i+1][j+1]:Math.max(rows[i+1][j],rows[i][j+1]);
  var result=pieces.map(function(text){return{text:text};});i=0;j=0;
  while(i<tokens.length&&j<words.length){if(tokens[i].key===norm(words[j].text)){result[tokens[i].index].start=words[j].start;result[tokens[i].index].end=words[j].end;i++;j++;}else if(rows[i+1][j]>=rows[i][j+1])i++;else j++;}
  return result;
 }
 function mount(audio,container,script,timing){
  var mapped=map(script,timing),spans=[],sentence=null,frame=null,disposed=false,engaged=false;
  container.replaceChildren();container.classList.add('tc-transcript');
  mapped.forEach(function(p){if(!sentence){sentence=document.createElement('span');sentence.className='tc-script-sentence';container.appendChild(sentence);}var n=document.createElement('span');n.textContent=p.text;sentence.appendChild(n);if(p.start!==undefined)spans.push({node:n,sentence:sentence,start:p.start,end:p.end});if(/[.!?][”"']?\s*$/.test(p.text)&&p.text.trim().length>2)sentence=null;});
  function update(event){if(disposed)return;if(event&&event.type==='seeking'&&audio.currentTime>0)engaged=true;var time=audio.currentTime;container.querySelectorAll('.tc-current').forEach(function(n){n.classList.remove('tc-current');});spans.forEach(function(s){if(engaged&&time>=s.start&&time<s.end&&!audio.ended)s.sentence.classList.add('tc-current');});}
  function tick(){update();if(!audio.paused&&!audio.ended&&!disposed)frame=requestAnimationFrame(tick);}
  function play(){engaged=true;if(frame!==null)cancelAnimationFrame(frame);tick();}
  var events=['timeupdate','seeking','seeked','ratechange','pause','ended','loadedmetadata'];events.forEach(function(e){audio.addEventListener(e,update);});audio.addEventListener('play',play);update();
  return{coverage:{mapped:spans.length,total:mapped.filter(function(p){return norm(p.text);}).length},stop:function(){disposed=true;if(frame!==null)cancelAnimationFrame(frame);events.forEach(function(e){audio.removeEventListener(e,update);});audio.removeEventListener('play',play);container.querySelectorAll('.tc-current').forEach(function(n){n.classList.remove('tc-current');});}};
 }
 root.HanqToeicReviewTiming={map:map,mount:mount};
})(typeof window!=='undefined'?window:globalThis);
