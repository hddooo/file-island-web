(function(root){'use strict';
 function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
 function key(s){return String(s).normalize('NFKC').replace(/’/g,"'").trim().toLowerCase();}
 function pattern(expression){var k=key(expression),special={
  'high / highly':'\\b(?:highly|high)\\b',
  'hard / hardly':'\\b(?:hardly|hard)\\b',
  'late / lately':'\\b(?:lately|late)\\b',
  'near / nearly':'\\b(?:nearly|near)\\b',
  'be hesitant to + v':'\\b(?:am|is|are|was|were|be|been|being)\\s+hesitant\\s+to\\b',
  'admit (admitting)':'\\badmit(?:s|ted|ting)?\\b',
  'hold (holding)':'\\b(?:hold|holds|held|holding)\\b',
  'happen (happening)':'\\bhappen(?:s|ed|ing)?\\b',
  'approach (approaching)':'\\bapproach(?:es|ed|ing)?\\b',
  'disembark':'\\bdisembark(?:s|ed|ing)?\\b',
  'revamp':'\\brevamp(?:s|ed|ing)?\\b',
  'benefit':'\\bbenefits?\\b',
  'sort':'\\bsort(?:s|ed|ing)?\\b',
  'wipe down':'\\bwip(?:e|es|ed|ing)\\s+down\\b',
  'potted plant':'\\bpotted\\s+plants?\\b',
  'food critic':'\\bfood\\s+critics?\\b',
  'range from a to b':'\\b(rang(?:e|es|ed|ing)\\s+from)\\b[\\s\\S]*?\\b(to)\\b',
  'provide a with b':'\\b(provid(?:e|es|ed|ing))\\s+[\\w’\'-]+(?:\\s+[\\w’\'-]+){0,5}\\s+(with)\\b',
  'give recognition to ~':'\\bgiv(?:e|es|en|ing)\\s+(?:\\w+\\s+){0,2}recognition\\s+to\\b',
  'be capable of ~':'\\b(?:am|is|are|was|were|be|been)\\s+capable\\s+of\\b',
  'be encouraged to ~':'\\b(?:am|is|are|was|were|be|been)\\s+encouraged\\s+to\\b',
  'be suspended from ~':'\\b(?:am|is|are|was|were|be|been)\\s+suspended\\s+from\\b',
  'be pleased to ~':"(?:\\bI['’]m|\\b(?:am|is|are|was|were|be|been))\\s+(?:very\\s+)?pleased\\s+to\\b",
  'be on top of everything':"(?:\\bwe['’]re|\\b(?:am|is|are|was|were|be|been))\\s+on\\s+top\\s+of\\s+everything\\b",
  'had + 주어 + (not) + p.p. = if + 주어 + had + (not) + p.p.':'\\b(?:Had\\s+\\w+\\s+(?:not\\s+)?\\w+|If\\s+\\w+\\s+had\\s+(?:not\\s+)?\\w+)\\b',
  'if it had not been for + 명사 / had it not been for + 명사':'\\b(?:If\\s+it\\s+had\\s+not\\s+been\\s+for|Had\\s+it\\s+not\\s+been\\s+for)\\b',
  'i wish + 주어 + had p.p.':'\\bI\\s+wish\\s+\\w+\\s+had\\s+\\w+\\b',
  "would have been able to + 동사 / wouldn't have been able to + 동사":"\\b(?:would|wouldn['’]t)\\s+have\\s+been\\s+able\\s+to\\b"
 };
 if(k==='admit')k='admit (admitting)';
 if(special[k])return new RegExp(special[k],'gidu');
 var modal=k.match(/^(could|might|should|would) have p\.p\.$/);if(modal)return new RegExp('\\b'+modal[1]+'\\s+have\\s+\\w+\\b','gidu');
 var literal=k.replace(/\s*~$/,'').replace(/[.!?]$/,'');if(/[+=]|주어|동사|명사/.test(literal))return null;
 return new RegExp('\\b'+esc(literal).replace(/'/g,"['’]").replace(/-/g,'[-–‑]').replace(/\s+/g,'\\s+')+'\\b','gidu');
 }
 function ranges(expression,text){var re=pattern(expression);if(!re)return[];var out=[],match;while((match=re.exec(text))){var groups=match.length>1?match.indices.slice(1).filter(Boolean):[match.indices[0]];groups.forEach(function(r){out.push({start:r[0],end:r[1]});});if(!match[0].length)re.lastIndex++;}return out.sort(function(a,b){return a.start-b.start;}).filter(function(r,i,a){return !i||r.start>=a[i-1].end;});}
 function render(host,expression,text){var at=0,found=ranges(expression,text),doc=host.ownerDocument;found.forEach(function(r){host.appendChild(doc.createTextNode(text.slice(at,r.start)));var b=doc.createElement('strong');b.className='tn-expression-highlight';b.textContent=text.slice(r.start,r.end);host.appendChild(b);at=r.end;});host.appendChild(doc.createTextNode(text.slice(at)));return found.length;}
 var api={ranges:ranges,render:render};root.HanqToeicExampleText=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
