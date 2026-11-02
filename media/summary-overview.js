/* Reorder existing summary DOM under era-specific chronology; source rows, IDs, sources and glossary remain intact. */
(function (root) {
  'use strict';
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function flowNode(f) {
    var li=el('li');li.appendChild(el('strong','flow-title',f.t));
    [['cause','배경'],['change',f.cause||f.result?'변화':'핵심'],['result','결과']].forEach(function(k){if(!f[k[0]])return;var row=el('span','flow-row');row.appendChild(el('b','flow-tag '+k[0],k[1]));row.appendChild(el('span','',f[k[0]]));li.appendChild(row);});return li;
  }
  function organize(app) {
    app.querySelectorAll('.summary-part[data-chapter]').forEach(function(part){
      var id=part.dataset.chapter,M=root.HANQ_SUMMARY_ERAS&&root.HANQ_SUMMARY_ERAS[id];if(!M||part.dataset.eraOrganized)return;
      var L=root.HANQ_LECTURE&&root.HANQ_LECTURE[id],S=root.HANQ_STUDY&&root.HANQ_STUDY[id];
      var flows=(L?L.flow:S&&S.flow)||[],groups=Array.from(part.querySelectorAll(L?'.lecture-group':'.study-core .core-group')).filter(function(g){return !g.closest('.tb-supplement');});
      if(M.periods.some(function(p){return p.groups.some(function(i){return !groups[i];})||p.flows.some(function(i){return !flows[i];});}))return;
      part.dataset.eraOrganized='1';
      var back=el('article','study-block era-backbone'),details=el('div','era-details'),usedG={},usedF={};
      back.appendChild(el('h3','','큰 흐름 먼저 잡기'));back.appendChild(el('p','era-lead',M.lead));var cards=el('ol','era-cards');
      function period(name,range,brief,index,flowIds,groupIds,cross){
        var target='era-'+id+'-'+index,fold=el('details','study-block era-period'+(cross?' era-cross':''));fold.id=target;
        var summary=el('summary','era-period-h');summary.appendChild(el('b','',name));summary.appendChild(el('span','era-range',range));fold.appendChild(summary);
        if(brief)fold.appendChild(el('p','era-detail-lead',brief));
        if(flowIds.length){var article=el('article','study-flow'+(L?' lecture-flow':'')),ol=el('ol','flow-list');flowIds.forEach(function(i){usedF[i]=true;ol.appendChild(flowNode(flows[i]));});article.appendChild(ol);fold.appendChild(article);}
        groupIds.forEach(function(i){usedG[i]=true;fold.appendChild(groups[i]);});details.appendChild(fold);return target;
      }
      M.periods.forEach(function(p,i){var target=period(p.name,p.range,p.brief,i,p.flows,p.groups,false),li=el('li','era-card');li.appendChild(el('span','era-card-range',p.range));li.appendChild(el('h4','',p.name));li.appendChild(el('p','',p.brief));var button=el('button','o-parts-jump era-more',(i+1)+'구간 자세히 보기');button.type='button';button.dataset.jump=target;li.appendChild(button);cards.appendChild(li);});back.appendChild(cards);
      var extraF=flows.map(function(_,i){return i;}).filter(function(i){return !usedF[i];}),extraG=groups.map(function(_,i){return i;}).filter(function(i){return !usedG[i];});
      if(extraF.length||extraG.length)period(M.cross||'여러 시기에 걸친 내용','시기와 주제를 함께 비교하기','', 'cross',extraF,extraG,true);
      // Remove emptied old layout containers only. Comparison, recall, original notes and source supplements stay.
      Array.from(part.children).forEach(function(n){if(n.matches('.study-flow,.study-core,.o-detail-h'))n.remove();});
      var oldParts=part.querySelector(':scope > .o-parts');if(oldParts){var story=el('details','summary-story');story.appendChild(el('summary','','이야기로 자세히 읽기'));oldParts.replaceWith(story);story.appendChild(oldParts);}
      var ref=part.querySelector(':scope > .part-title');if(ref){ref.after(back);back.after(details);}else{part.prepend(details);part.prepend(back);}
      var synthesis=part.querySelector(':scope > .renewal-summary');if(synthesis)back.after(synthesis);
      part.querySelectorAll('.core-legend').forEach(function(n){if(/교재|강의/.test(n.textContent))n.remove();});
      part.querySelectorAll('.tb-supplement > summary').forEach(function(n){if(!n.closest('.cs-archive'))n.textContent='원래 개념 묶음 더 보기';});
    });
  }
  root.HanqSummary={organize:organize};
})(window);
