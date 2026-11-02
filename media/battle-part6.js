(function(root){'use strict';
function number(item){var n=item&&item.number;if(Number.isInteger(n)&&n>0)return String(n);var id=item&&String(item.id||'');return /^\d+$/.test(id)&&Number(id)>0?id:null;}
function shared(part,passage){return Number(part)===6&&typeof passage==='string'&&!!passage.trim();}
function title(part,passage,item,index){if(!shared(part,passage))return item.prompt;var n=number(item);return n?'원문 '+n+'번 · 빈칸 ['+n+']':'지문 연결 문항 '+(index+1);}
function passage(parent,text,part){if(Number(part)===7&&root.HanqLearningReader){root.HanqLearningReader.passage(parent,text);return;}if(!shared(part,text)){parent.textContent=text;return;}var pieces=text.split(/(\[\d+\])/g);pieces.forEach(function(piece){if(/^\[\d+\]$/.test(piece)){var mark=document.createElement('mark');mark.className='bi-p6-blank';mark.textContent=piece;mark.setAttribute('aria-label','빈칸 '+piece.slice(1,-1));parent.appendChild(mark);}else parent.appendChild(document.createTextNode(piece));});parent.classList.add('bi-p6-passage');}
root.HanqBattlePart6={title:title,passage:passage};
})(window);
