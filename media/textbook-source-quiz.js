/* Original textbook blanks only. Authorized progress is loaded/saved through the parent adapter.
 * Parent fetches authorized data and calls render(host, data), then cleanup() on
 * navigation or logout. Returns {element, ready, cleanup}. Text is never HTML.
 */
(function (root) {
  'use strict';
  var mounted = new WeakMap(), serial = 0;
  function fail(name) { throw new TypeError('Invalid source quiz: ' + name); }
  function text(value, name) { if (typeof value !== 'string') fail(name); return value; }
  function positive(value, name) { if (!Number.isInteger(value) || value < 1) fail(name); return value; }
  function list(value, name) { if (!Array.isArray(value)) fail(name); return value; }
  function normalize(value) { return value.normalize('NFC').replace(/\s+/g, ''); }
  function unique(values, name) { if (new Set(values).size !== values.length) fail(name); }
  function verified(item) {
    return !!(item.verification && item.verification.status === 'source-verified' &&
      item.verification.textVerified === true && item.verification.answerPairVerified === true);
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function requiredFeatures(value) {
    if (value != null) list(value, 'requiredRendererFeatures').forEach(function (feature) {
      if (['classification-response-groups', 'unnumbered-source-item', 'partitioned-source-blank', 'annotated-source-sequence', 'answer-table-notes'].indexOf(feature) < 0) fail('unsupported required renderer feature');
    });
  }
  function hasFeature(value, feature) { return !!(value.requiredRendererFeatures && value.requiredRendererFeatures.indexOf(feature) >= 0); }
  function validateAnnotatedSequence(item, parts, separator) {
    if (item.kind !== 'sequence' || !verified(item) || !hasFeature(item, 'annotated-source-sequence')) fail('annotated sequence verification or feature');
    var tokens = list(item.answer.sequenceTokens, 'sequenceTokens');
    if (tokens.length !== parts.length || !tokens.length) fail('annotated sequence token count');
    tokens.forEach(function (token, i) {
      if (!token || token.order !== i + 1 || token.label !== parts[i]) fail('annotated sequence token order');
      text(token.annotation, 'sequence annotation'); text(token.text, 'sequence token text');
      if ((token.annotation !== '' && !/^\([^()]+\)$/.test(token.annotation)) || token.text !== token.label + token.annotation) fail('annotated sequence token source');
    });
    if (normalize(item.answer.text) !== normalize(tokens.map(function (t) { return t.text; }).join(separator))) fail('annotated sequence source answer');
    if (item.answer.responseText !== parts.join(separator)) fail('annotated sequence response parts');
    text(item.answer.sourceText, 'annotated sequence answer.sourceText');
    if (normalize(item.answer.sourceText) !== normalize((item.originalNumberLabel || '') + item.answer.text)) fail('annotated sequence original answer text');
  }
  function validatePartitionedBlank(item, blank) {
    if (!verified(item) || item.kind !== 'fill-in' || !hasFeature(item, 'partitioned-source-blank') || !item.answer.orderMatters) fail('partitioned blank verification or order');
    var parts = list(blank.parts, 'blank.parts'), ids = [], refs = [];
    if (parts.length < 2 || blank.partSeparator !== ',') fail('partitioned blank separator');
    parts.forEach(function (part, i) {
      if (!part || part.order !== i + 1) fail('partitioned blank part order');
      text(part.id, 'blank.part.id'); text(part.placeholder, 'blank.part.placeholder'); ids.push(part.id);
      if (!part.id || !/^ +$/.test(part.placeholder)) fail('partitioned blank source whitespace');
      var answerRefs = list(part.answerIds, 'blank.part.answerIds'); if (!answerRefs.length) fail('partitioned blank answer references');
      answerRefs.forEach(function (id) { refs.push(id); });
    });
    unique(ids, 'duplicate partitioned blank part ID'); unique(refs, 'duplicate partitioned blank answer ID');
    if (!same(refs, blank.answerIds) || blank.placeholder !== '(' + parts.map(function (p) { return p.placeholder; }).join(blank.partSeparator) + ')') fail('partitioned blank source structure or answer order');
  }
  function validateClassification(item, answerIds) {
    if (!verified(item)) fail('classification requires source verification');
    if (item.blanks.length || item.events != null) fail('classification has no printed blanks or sequence events');
    if (item.segments.some(function (s) { return s.type !== 'text'; }) ||
      item.segments.map(function (s) { return s.text; }).join('') !== item.text) fail('classification source statement');
    var subs = list(item.subitems, 'subitems'), slots = list(item.responseSlots, 'responseSlots');
    var groups = list(item.answer.groups, 'answer.groups'), choices = list(item.choices, 'choices');
    if (!subs.length || slots.length !== subs.length || groups.length !== subs.length || !choices.length) fail('classification group counts');
    if (!item.answer.orderMatters || item.answer.groupSeparator !== '/') fail('classification group order or separator');
    text(item.choicesLabel, 'choicesLabel'); text(item.choicesLabelSourceText, 'choicesLabelSourceText');
    if (normalize(item.choicesLabel) !== normalize(item.choicesLabelSourceText)) fail('choices label source');
    var choiceLabels = choices.map(function (choice) {
      if (!choice) fail('choice');
      text(choice.label, 'choice.label'); text(choice.text, 'choice.text'); text(choice.sourceText, 'choice.sourceText');
      if (!normalize(choice.label) || choice.sourceText !== choice.label + ' ' + choice.text) fail('choice source text');
      return choice.label;
    });
    unique(choiceLabels, 'duplicate choice label');
    var subIds = [], slotIds = [], usedAnswerIds = [], groupedParts = [];
    subs.forEach(function (sub, i) {
      var slot = slots[i], group = groups[i];
      if (!sub || !slot || !group) fail('classification group');
      text(sub.id, 'subitem.id'); text(sub.originalNumberLabel, 'subitem.originalNumberLabel');
      text(sub.text, 'subitem.text'); text(sub.sourceText, 'subitem.sourceText'); text(sub.responseSlotId, 'subitem.responseSlotId');
      text(slot.id, 'responseSlot.id'); subIds.push(sub.id); slotIds.push(slot.id);
      if (!sub.id || !slot.id || sub.order !== i + 1 || slot.order !== i + 1 || group.order !== i + 1) fail('classification source order');
      if (sub.responseSlotId !== slot.id || group.subitemId !== sub.id || group.responseSlotId !== slot.id) fail('classification group links');
      if (normalize(sub.sourceText) !== normalize(sub.originalNumberLabel + ' ' + sub.text) || !sub.text.trim().endsWith(':')) fail('subitem source text');
      if (slot.kind !== 'colon-response' || slot.sourcePrintedBlank !== false || slot.sourceAnchor !== ':') fail('classification source response anchor');
      if (!slot.answer || typeof slot.answer.orderMatters !== 'boolean') fail('responseSlot.answer');
      var refs = list(slot.answerIds, 'responseSlot.answerIds'), parts = list(group.parts, 'answer.group.parts');
      if (!parts.length || refs.length !== parts.length || !same(group.answerIds, refs)) fail('classification answer references');
      parts.forEach(function (part, j) {
        text(part, 'answer.group.part');
        var answerIndex = answerIds.indexOf(refs[j]);
        if (answerIndex < 0 || item.answers[answerIndex].text !== part || choiceLabels.indexOf(part) < 0) fail('classification source answer part');
        usedAnswerIds.push(refs[j]); groupedParts.push(part);
      });
      unique(parts, 'duplicate classification answer part');
      if (group.text !== parts.join(', ') || slot.answer.text !== group.text || !same(slot.answer.parts, parts)) fail('classification group text');
    });
    unique(subIds, 'duplicate subitem ID'); unique(slotIds, 'duplicate response slot ID');
    unique(usedAnswerIds, 'duplicate classification answer ID');
    if (!same(usedAnswerIds, answerIds) || !same(groupedParts, item.answer.parts)) fail('classification answer order or coverage');
    if (normalize(item.answer.text) !== normalize(groups.map(function (g) { return g.text; }).join('/'))) fail('classification answer grouping');
    if (item.originalNumberLabel !== '(' + item.originalNumber + ')') fail('classification original number label');
    var reconstructed = item.originalNumberLabel + item.text + subs.map(function (s) { return s.sourceText; }).join('') +
      item.choicesLabelSourceText + choices.map(function (c) { return c.sourceText; }).join('');
    if (normalize(reconstructed) !== normalize(item.sourceText)) fail('classification full source text or order');
    text(item.answer.sourceText, 'classification answer.sourceText');
    if (normalize(item.answer.sourceText) !== normalize(item.originalNumberLabel + item.answer.text)) fail('classification original answer text');
  }
  function validate(data) {
    if (!data || data.schemaVersion !== 'hanq-source-quiz/1') fail('schemaVersion');
    requiredFeatures(data.requiredRendererFeatures);
    text(data.title, 'title');
    if (!data.source) fail('source');
    list(data.source.pdfPages, 'source.pdfPages').forEach(function (n) { positive(n, 'source.pdfPage'); });
    list(data.source.printedPages, 'source.printedPages').forEach(function (n) { positive(n, 'source.printedPage'); });
    var topics = list(data.subtopics, 'subtopics'), ids = [];
    topics.forEach(function (topic) { text(topic.id, 'subtopic.id'); text(topic.title, 'subtopic.title'); ids.push(topic.id); });
    unique(ids, 'duplicate subtopic ID');
    var itemIds = [];
    list(data.items, 'items').forEach(function (item, index) {
      if (!item) fail('item');
      requiredFeatures(item.requiredRendererFeatures);
      text(item.id, 'item.id'); itemIds.push(item.id);
      if (item.order !== index + 1) fail('source item order');
      if (item.originalNumber === null) {
        if (!verified(item) || !hasFeature(item, 'unnumbered-source-item') || item.originalNumberPresent !== false || item.originalNumberLabel !== '') fail('unnumbered original item');
        positive(item.sourceOrdinal, 'unnumbered sourceOrdinal');
      } else {
        positive(item.originalNumber, 'originalNumber');
        if (item.originalNumberPresent === false || hasFeature(item, 'unnumbered-source-item')) fail('contradictory original number');
      }
      positive(item.pdfPage, 'pdfPage'); positive(item.printedPage, 'printedPage');
      if (data.source.pdfPages.indexOf(item.pdfPage) < 0) fail('item source page');
      if (data.source.printedPages.indexOf(item.printedPage) < 0) fail('item printed source page');
      if (ids.indexOf(item.subtopicId) < 0) fail('item subtopic');
      text(item.text, 'item.text'); text(item.sourceText, 'sourceText');
      if (['sequence', 'fill-in', 'classification'].indexOf(item.kind) < 0) fail('item.kind');
      var answers = list(item.answers, 'answers'), answerIds = [];
      answers.forEach(function (answer) { text(answer.id, 'answer.id'); text(answer.text, 'answer.text'); answerIds.push(answer.id); });
      unique(answerIds, 'duplicate answer ID');
      if (!item.answer) fail('answer');
      text(item.answer.text, 'answer.text');
      var parts = list(item.answer.parts, 'answer.parts');
      if (!parts.length || parts.length !== answers.length) fail('answer part count');
      parts.forEach(function (part, i) { text(part, 'answer.part'); if (!normalize(part) || part !== answers[i].text) fail('answer part source order'); });
      if (typeof item.answer.orderMatters !== 'boolean') fail('answer.orderMatters');
      if (parts.length === 1 && item.answer.text !== parts[0]) fail('single answer text');
      var separator = item.answer.sequenceSeparator == null ? '' : item.answer.sequenceSeparator;
      if (['', '→'].indexOf(separator) < 0) fail('source sequence separator');
      var sourceAnswerSeparator = item.answer.sourceSeparator;
      if (sourceAnswerSeparator != null && (sourceAnswerSeparator !== '/' || item.kind !== 'fill-in' || !verified(item) || !hasFeature(item, 'partitioned-source-blank'))) fail('unsupported source answer separator');
      if (item.answer.sequenceTokens != null || hasFeature(item, 'annotated-source-sequence')) validateAnnotatedSequence(item, parts, separator);
      else if (item.kind !== 'classification' && parts.length > 1 && normalize(item.answer.text) !== normalize(parts.join(item.kind === 'sequence' ? separator : sourceAnswerSeparator || ', '))) fail('answer text parts');
      var blanks = list(item.blanks, 'blanks'), blankIds = [], referencedAnswerIds = [];
      if (!blanks.length && item.kind !== 'classification') fail('missing explicit blank');
      blanks.forEach(function (blank) {
        text(blank.id, 'blank.id'); text(blank.placeholder, 'blank.placeholder'); blankIds.push(blank.id);
        var refs = list(blank.answerIds, 'blank.answerIds'); if (!refs.length) fail('empty blank answerIds');
        refs.forEach(function (id) { if (answerIds.indexOf(id) < 0) fail('unknown blank answer ID'); referencedAnswerIds.push(id); });
        if (blank.parts != null) validatePartitionedBlank(item, blank);
        else if (!/^\( +\)$/.test(blank.placeholder)) fail('unsupported source blank structure');
      });
      if (hasFeature(item, 'partitioned-source-blank') && !blanks.some(function (b) { return b.parts != null; })) fail('missing partitioned source blank');
      if (item.answer.sequenceTokens && (blanks.length !== 1 || blanks[0].parts != null || !same(blanks[0].answerIds, answerIds))) fail('annotated sequence requires one complete original blank');
      unique(blankIds, 'duplicate blank ID'); unique(referencedAnswerIds, 'duplicate referenced answer ID');
      if (item.kind !== 'classification' && referencedAnswerIds.join('\u0000') !== answerIds.join('\u0000')) fail('blank answer order or coverage');
      var segmentBlankIds = [];
      list(item.segments, 'segments').forEach(function (segment) {
        if (segment.type === 'text') text(segment.text, 'segment.text');
        else if (segment.type === 'blank') {
          var i = blankIds.indexOf(segment.id); if (i < 0) fail('unknown segment blank');
          if (segment.placeholder !== blanks[i].placeholder) fail('blank placeholder');
          if (JSON.stringify(segment.answerIds) !== JSON.stringify(blanks[i].answerIds)) fail('blank answer references');
          segmentBlankIds.push(segment.id);
        } else fail('segment.type');
      });
      if (segmentBlankIds.join('\u0000') !== blankIds.join('\u0000')) fail('segment blank order or coverage');
      if (item.kind === 'classification') validateClassification(item, answerIds);
      if (item.events != null) list(item.events, 'events').forEach(function (event) {
        text(event.label, 'event.label'); text(event.text, 'event.text'); text(event.sourceText, 'event.sourceText');
        if (event.sourceText !== event.label + ' ' + event.text) fail('event source text');
      });
      if (item.kind === 'sequence') {
        if (!item.answer.orderMatters || !item.events || item.events.length !== parts.length) fail('sequence structure');
        unique(item.events.map(function (e) { return e.label; }), 'sequence event labels');
        if (parts.slice().sort().join('\u0000') !== item.events.map(function (e) { return e.label; }).sort().join('\u0000')) fail('sequence source parts');
      }
      if (item.originalNumber === null || hasFeature(item, 'partitioned-source-blank') || item.answer.sequenceTokens) {
        if (item.originalNumber !== null && item.originalNumberLabel !== '(' + item.originalNumber + ')') fail('extended original number label');
        text(item.answer.sourceText, 'extended answer.sourceText');
        if (normalize(item.answer.sourceText) !== normalize((item.originalNumberLabel || '') + item.answer.text)) fail('extended original answer text');
        var fullSource = (item.originalNumberLabel || '') + item.segments.map(function (s) { return s.type === 'text' ? s.text : s.placeholder; }).join('') +
          (item.events || []).map(function (event) { return event.sourceText; }).join('');
        if (normalize(fullSource) !== normalize(item.sourceText)) fail('extended item full source text');
      }
    });
    unique(itemIds, 'duplicate item ID');
    if (data.answerTableNotes != null) {
      if (!hasFeature(data, 'answer-table-notes')) fail('answer table note feature');
      var noteIds = [];
      list(data.answerTableNotes, 'answerTableNotes').forEach(function (note) {
        if (!note || !note.verification || note.verification.status !== 'source-verified' || note.verification.textVerified !== true) fail('answer table note verification');
        text(note.id, 'answer table note ID'); text(note.text, 'answer table note text'); text(note.sourceText, 'answer table note sourceText'); noteIds.push(note.id);
        if (!note.id || note.text !== note.sourceText || ids.indexOf(note.subtopicId) < 0 || !data.items.some(function (item) { return item.subtopicId === note.subtopicId; }) || !note.source || data.source.pdfPages.indexOf(note.source.pdfPage) < 0 || data.source.printedPages.indexOf(note.source.printedPage) < 0) fail('answer table note source');
      });
      unique(noteIds, 'duplicate answer table note ID');
    } else if (hasFeature(data, 'answer-table-notes')) fail('missing answer table notes');
    return data;
  }
  function sequenceNumbersMatch(value, expectedParts) {
  var expected = expectedParts.map(function(part) { var s=part.normalize('NFKC'); return /^[1-9][0-9]*$/.test(s)?Number(s):null; });
  if (!expected.length || expected.some(function(n){return n===null||n>20;})) return false;
  var allowed=new Set(expected),single=expected.every(function(n){return n<10;}),tokens=[],chunks=value.normalize('NFC').trim().split(/(?:\s+|[,，→⇒➜➔]|->)+/);
  if (!chunks.length || chunks.some(function(s){return !s;})) return false;
  for (var i=0;i<chunks.length;i++) {
    var chunk=chunks[i],pieces=chunk.match(/[①-⑳]|[0-9]+/g);
    if (!pieces || pieces.join('')!==chunk) return false;
    for (var j=0;j<pieces.length;j++) {
      var piece=pieces[j],normalized=piece.normalize('NFKC');
      if (/^[①-⑳]$/.test(piece)) tokens.push(Number(normalized));
      else if (single) { if(!/^[1-9]+$/.test(piece))return false;tokens.push.apply(tokens,piece.split('').map(Number)); }
      else { if(!/^[1-9][0-9]*$/.test(piece)||!allowed.has(Number(piece)))return false;tokens.push(Number(piece)); }
    }
  }
  return tokens.length===expected.length&&tokens.every(function(n,k){return allowed.has(n)&&n===expected[k];});
}
  function multipleAnswerDetails(value, expectedParts) {
  var norm=function(s){return s.normalize('NFC').replace(/\s+/g,'');},expected=expectedParts.map(norm),raw=value.trim(),given;
  if (/[,，]/.test(raw)) given=raw.split(/[,，]/).map(norm);
  else {
    // Whitespace can separate complete canonical items; never guess aliases or remove punctuation.
    var words=raw.split(/\s+/),paths=[];
    function walk(at,parts){if(paths.length>1||parts.length>expected.length)return;if(at===words.length){paths.push(parts);return;}for(var end=at+1;end<=words.length;end++){var part=norm(words.slice(at,end).join(' '));if(expected.indexOf(part)>=0)walk(end,parts.concat([part]));}}
    walk(0,[]);given=paths.length===1?paths[0]:[norm(raw)];
  }
  var unique=Array.from(new Set(given)),matched=expected.filter(function(p){return unique.indexOf(p)>=0;}),missing=expectedParts.filter(function(p){return unique.indexOf(norm(p))<0;}),extra=unique.filter(function(p){return expected.indexOf(p)<0;}),duplicate=unique.length!==given.length;
  return {correct:!duplicate&&!extra.length&&!missing.length&&given.length===expected.length,matched:matched.length,total:expected.length,missing:missing,partial:!duplicate&&!extra.length&&matched.length>0&&missing.length>0};
}
  function compare(value, expectedParts, orderMatters, kind, separator) {
    var cleaned = normalize(value);
    if (!cleaned) return 'empty';
    if (kind === 'sequence') return sequenceNumbersMatch(value,expectedParts) ? 'match' : 'different';
    if (!orderMatters && expectedParts.length>1) return multipleAnswerDetails(value,expectedParts).correct?'match':'different';
    if (expectedParts.length === 1) return cleaned === normalize(expectedParts[0]) ? 'match' : 'different';
    var given = value.split(',').map(normalize), expected = expectedParts.map(normalize);
    if (given.length !== expected.length || given.some(function (part) { return !part; })) return 'different';
    if (!orderMatters) { given.sort(); expected.sort(); }
    return given.every(function (part, i) { return part === expected[i]; }) ? 'match' : 'different';
  }
  function answerFeedback(item,entry,value,parts){
    if(entry.match)return '✓ 정답';
    if(item.kind!=='sequence'&&!entry.orderMatters&&parts.length>1){var detail=multipleAnswerDetails(value,parts);if(detail.partial)return '△ 부분 정답 '+detail.matched+'/'+detail.total+' · 미완성 답 · 빠진 답: '+detail.missing.join(', ');}
    return '✕ 정답: '+(item.answer.sequenceTokens?item.answer.text:parts.join(item.kind==='sequence'?(item.answer.sequenceSeparator||''):', '));
  }
  // Presentation only. These exact source/version pins have different numbering;
  // canonical arrays, answer data, progress IDs and cursor indices stay intact.
  function joseonPresentation(data, version) {
    var revisions = {
      '35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442': {
        version:'6892d35b75b9dc6580050bb950242e77ebdb0f2f40d01d13072f0ac5ea1ba3c4',
        sizes:[24,50,14,11,14,18,33], counts:[59,14,91], centralLate:[], diplomacyLate:[3,9],
        cultureEarly:[1,3,5,8,9,15,16,20,24,27,28,30]
      },
      'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de': {
        version:'042ee684d7e9ae89cc2afd4b3964b1568806432f361dc99b39ad9f88f4d6ca5a',
        sizes:[26,50,15,13,14,18,36], counts:[64,14,94], centralLate:[11], diplomacyLate:[3,4,10],
        cultureEarly:[1,3,5,6,9,10,16,17,21,25,26,29,30,32]
      }
    };
    var policy = data.source && revisions[data.source.sha256];
    if (data.id !== 'joseon' || !policy || version !== policy.version) return null;
    var topics=['early-joseon','late-joseon','central-offices','society-diplomacy','society-comparison','economy-comparison','culture'];
    var common={ 'society-comparison':[3,5,8,9,11,14], 'economy-comparison':[3,5,6,8,10,13,15,18] };
    if (new Set(data.items.map(function (item) { return item.id; })).size !== data.items.length) return null;
    if (topics.some(function (topic, i) {
      var numbers=data.items.filter(function (item) { return item.subtopicId===topic; }).map(function (item) { return item.originalNumber; }).sort(function(a,b){return a-b;});
      return numbers.length!==policy.sizes[i] || numbers.some(function (n,j) { return n!==j+1; });
    }) || data.items.length!==policy.sizes.reduce(function(a,b){return a+b;},0)) return null;
    var groups=data.items.map(function (item) {
      var topic=item.subtopicId, n=item.originalNumber;
      if (topic==='early-joseon') return 'early';
      if (topic==='late-joseon') return 'late';
      if (topic==='central-offices') return policy.centralLate.indexOf(n)===-1?'early':'late';
      if (topic==='society-diplomacy') return policy.diplomacyLate.indexOf(n)===-1?'early':'late';
      if (common[topic]) return common[topic].indexOf(n)===-1?'late':'common';
      return policy.cultureEarly.indexOf(n)===-1?'late':'early';
    });
    if (['early','common','late'].some(function (group,i) { return groups.filter(function(g){return g===group;}).length!==policy.counts[i]; })) return null;
    return groups;
  }
  function render(host, inputData, options) {
    if(!host||host.nodeType!==1||!host.ownerDocument)throw new TypeError('Source quiz requires a DOM host');
    validate(inputData);options=options||{};if(options.sourceRevision!=null&&options.sourceRevision!==inputData.source.sha256)fail('source revision binding');var data=JSON.parse(JSON.stringify(inputData)),doc=host.ownerDocument,prefix='hanq-source-quiz-'+(++serial);
    var active=true,listeners=[],saved=null,rows=[],fields=[],displayFields=[],presentation=null,dirty=new Map(),version=0,cursor=0,cursorVersion=0,ackCursor=0,lastFocused=0,recoveryOff=null,timer=null,inFlight=null,pending=null,pausing=false;
    function el(tag,cls,value){var n=doc.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
    function on(n,t,f){n.addEventListener(t,f);listeners.push([n,t,f]);}
    var wrapper=el('section','textbook-source-quiz textbook-source-continuous');wrapper.appendChild(el('h2','textbook-source-quiz-title',data.title));
    if (data.source.sha256 === 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de') { wrapper.classList.add('history-notes-design'); wrapper.setAttribute('data-history-edition','81'); }
    wrapper.appendChild(el('p','textbook-source-quiz-help','Tab·Shift+Tab으로 답칸을 이동하세요. 답칸을 떠나거나 Enter를 누르면 바로 채점합니다. 여러 답은 쉼표로, 순서형은 원문 기호로 적으세요.'));
    var controls=el('div','textbook-source-list-controls'),stop=el('button','textbook-source-quiz-stop','그만하기'),retry=el('button','textbook-source-save-retry','저장 다시 시도');stop.type=retry.type='button';retry.hidden=true;controls.appendChild(stop);controls.appendChild(retry);wrapper.appendChild(controls);
    var progress=el('p','textbook-source-progress'),status=el('p','textbook-source-quiz-status','계정에 저장된 응답을 불러오는 중…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');wrapper.appendChild(progress);wrapper.appendChild(status);
    var list=el('div','textbook-source-list'),reviewHost=el('div','textbook-source-review');wrapper.appendChild(list);wrapper.appendChild(reviewHost);reviewHost.hidden=true;
    function message(text,error){if(!active)return;var result=error?'different':/저장했습니다|불러왔습니다/.test(text)?'match':'pending';if(status.textContent===text&&status.dataset.result===result)return;status.textContent=text;status.dataset.result=result;}
    function partialFeedback(row){if(row.item.kind==='sequence')return '';for(var i=0;i<row.inputs.length;i++){var e=row.inputs[i],parts=e.answerIds.map(function(id){return row.item.answers.find(function(a){return a.id===id;}).text;});if(e.graded&&!e.orderMatters&&parts.length>1){var detail=multipleAnswerDetails(e.node.value,parts);if(detail.partial)return answerFeedback(row.item,e,e.node.value,parts);}}return '';}
    function updateProgress(){progress.textContent='풀이 '+rows.filter(function(r){return r.submitted;}).length+' / '+data.items.length+' · 정답 '+rows.filter(function(r){return r.correct===true;}).length+(rows.some(function(r){return !!partialFeedback(r);})?' · 미완성 답 '+rows.filter(function(r){return !!partialFeedback(r);}).length:'');}
    function answerValues(row){return row.inputs.map(function(e){return e.node.value;});}
    function mark(row){row.touched=true;var values=answerValues(row);row.submitted=row.inputs.every(function(e){return e.graded&&!e.composing&&!!normalize(e.node.value);});row.correct=row.submitted?row.inputs.every(function(e){return e.match;}):null;dirty.set(row.item.id,{generation:++version,itemId:row.item.id,values:values,submitted:row.submitted,checkedSlots:row.inputs.map(function(e){return e.graded&&!e.composing;})});updateProgress();message('입력은 유지됩니다 · 계정 저장 대기 중…');schedule();}
    function schedule(){clearTimeout(timer);if(!pausing)timer=setTimeout(function(){flush('active').catch(function(){});},800);}
    function failure(e){retry.hidden=false;message(e&&(e.status===409||e.code==='source_progress_conflict')?'다른 화면의 저장과 충돌했습니다. 현재 입력은 유지했습니다. 저장된 기록을 확인하려면 새로고침하세요.':'계정에 저장하지 못했습니다. 입력은 이 화면에 유지됩니다. 저장 다시 시도를 눌러주세요.',true);}
    function flush(target){
      clearTimeout(timer);if(!active||!saved)return Promise.reject(Error('session_changed'));
      if(inFlight)return inFlight.then(function(){return flush(target);});
      if(!pending&&!dirty.size&&ackCursor===cursorVersion&&target==='active')return Promise.resolve(saved);
      if(!pending){var captured=[...dirty.values()].map(function(u){return Object.assign({},u,{values:u.values.slice()});});pending={body:{version:saved.version,revision:saved.revision,mutationId:doc.defaultView.crypto.randomUUID(),cursor:cursor,status:target,updates:captured.map(function(u){return {itemId:u.itemId,values:u.values,submitted:u.submitted,checkedSlots:u.checkedSlots};})},captured:captured,cursorVersion:cursorVersion};}
      var request=pending;retry.disabled=true;message('계정에 응답을 묶어서 저장하는 중…');
      var task=Promise.resolve().then(function(){return options.saveProgress(request.body);}).then(function(result){
        if(!active)return result;saved=result;pending=null;request.captured.forEach(function(u){if(dirty.has(u.itemId)&&dirty.get(u.itemId).generation===u.generation)dirty.delete(u.itemId);});ackCursor=Math.max(ackCursor,request.cursorVersion);retry.hidden=true;
        if(dirty.size||ackCursor!==cursorVersion){message('새 입력을 추가 저장하는 중…');schedule();}else message('응답과 현재 위치를 계정에 저장했습니다.');return result;
      },function(e){failure(e);throw e;});
      inFlight=task.then(function(result){inFlight=null;retry.disabled=false;return result;},function(e){inFlight=null;retry.disabled=false;throw e;});
      return inFlight.then(function(result){if(active&&target==='paused'&&(dirty.size||ackCursor!==cursorVersion||saved.workspace.status!=='paused'))return flush('paused');return result;});
    }
    function grade(row,entry){
      var parts=entry.answerIds.map(function(id){return row.item.answers.find(function(a){return a.id===id;}).text;}),value=entry.node.value;
      if(!normalize(value)&&!row.touched&&!row.hasResponse)return;
      entry.graded=!!normalize(value);var result=row.item.answer.sequenceTokens&&normalize(value)===normalize(row.item.answer.text)?'match':compare(value,parts,entry.orderMatters,row.item.kind,row.item.answer.sequenceSeparator);entry.match=result==='match';
      entry.feedback.textContent=result==='empty'?'':answerFeedback(row.item,entry,value,parts);entry.feedback.dataset.result=result;entry.node.setAttribute('aria-invalid',String(result==='different'));mark(row);
    }
    function focusAt(index){var entry=fields[index];if(entry){entry.node.focus({preventScroll:true});var rect=entry.node.getBoundingClientRect();if(rect.top<80||rect.bottom>doc.defaultView.innerHeight-20)entry.node.scrollIntoView({block:'nearest',behavior:'auto'});}}
    function groupedContainers(host, className) {
      var targets={};
      ['early','common','late'].forEach(function (group) {
        var section=el(group==='common'?'aside':'section',className+' '+className+'-'+group);
        section.dataset.joseonGroup=group;
        section.appendChild(el(group==='common'?'h4':'h3','textbook-joseon-heading',group==='early'?'조선 전기':group==='late'?'조선 후기':'공통·비교'));
        host.appendChild(section); targets[group]=section;
      });
      return targets;
    }
    function sourceNumber(item, fallback) { return item.originalNumberLabel || (item.originalNumber===null?'번호 없는 문항':String(item.originalNumber)); }
    function topicTarget(groups, index) {
      var target=groups[presentation[index]],topic=data.items[index].subtopicId;
      if(topic==='early-joseon'||topic==='late-joseon')return target;
      var existing=Array.from(target.children).find(function(n){return n.dataset.sourceSubtopic===topic;});
      if(existing)return existing;
      var section=el('section','textbook-joseon-topic'),title=data.subtopics.find(function(t){return t.id===topic;});
      section.dataset.sourceSubtopic=topic;section.appendChild(el('h4','textbook-joseon-subtopic',title?title.title:topic));target.appendChild(section);return section;
    }
    function showReview(){
      list.hidden=true;controls.hidden=true;reviewHost.hidden=false;reviewHost.replaceChildren();reviewHost.appendChild(el('h3','',rows.every(function(r){return r.submitted;})?'전체 풀이 결과':'여기까지 저장했어요'));
      var resume=el('button','textbook-source-quiz-resume','저장한 위치에서 이어 풀기');resume.type='button';on(resume,'click',function(){reviewHost.hidden=true;list.hidden=false;controls.hidden=false;focusAt(fields.findIndex(function(e){return e.itemIndex===cursor;}));});reviewHost.appendChild(resume);
      var filterLabel=el('label','textbook-source-review-filter'),filter=el('input','');filter.type='checkbox';filterLabel.appendChild(filter);filterLabel.appendChild(doc.createTextNode(' 틀린 문항만 보기'));reviewHost.appendChild(filterLabel);var results=el('div','');reviewHost.appendChild(results);
      function paint(){results.replaceChildren();var groups=presentation?groupedContainers(results,'textbook-joseon-review'):null;rows.forEach(function(row,i){if(!row.submitted||(filter.checked&&row.correct))return;var card=el('article','textbook-source-review-item');card.dataset.sourceReviewItemId=row.item.id;card.appendChild(el('h4','',sourceNumber(row.item,i)+'번 · '+(row.correct?'✓ 정답':partialFeedback(row)||'✕ 오답')));card.appendChild(el('p','',row.item.sourceText||row.item.text));card.appendChild(el('p','','내 답: '+answerValues(row).join(' / ')));card.appendChild(el('p','','교재 정답: '+row.item.answer.text));(groups?groups[presentation[i]]:results).appendChild(card);});if(groups)Object.keys(groups).forEach(function(g){groups[g].hidden=!groups[g].querySelector('[data-source-review-item-id]');});if(!results.querySelector('[data-source-review-item-id]'))results.appendChild(el('p','','표시할 풀이가 없습니다.'));}
      on(filter,'change',paint);paint();(data.answerTableNotes||[]).forEach(function(note){reviewHost.appendChild(el('p','textbook-source-quiz-source-note',note.sourceText));});
    }
    function build(){
      var groups=presentation?groupedContainers(list,'textbook-joseon-section'):null;
      data.items.forEach(function(item,itemIndex){
      var card = el('div', 'textbook-source-quiz-item'); card.dataset.sourceItemId = item.id;
      var localId = prefix + '-item-' + itemIndex, label = el('small', 'textbook-source-quiz-item-source',
        '문제 ' + sourceNumber(item,itemIndex));
      label.id = localId + '-source'; card.setAttribute('aria-labelledby', label.id); card.appendChild(label);
      var statement = el('span', 'textbook-source-quiz-statement'), inputs = [], isVerified = verified(item);
      statement.id = localId + '-statement';
      function responseInput(id, description) {
        var input = el('input', 'textbook-source-quiz-input'); input.type = 'text';
        input.id = id; input.autocomplete = 'off'; input.spellcheck = false;
        input.maxLength = 2000; input.setAttribute('autocapitalize', 'off');
        input.setAttribute('aria-label', description);
        input.setAttribute('aria-describedby', statement.id + ' ' + label.id);
        input.disabled = !isVerified; return input;
      }
      item.segments.forEach(function (segment) {
        if (segment.type === 'text') statement.appendChild(doc.createTextNode(segment.text));
        else {
          var blank = item.blanks.find(function (b) { return b.id === segment.id; });
          var group = el('span', 'textbook-source-quiz-blank'), number = item.blanks.indexOf(blank) + 1;
          group.appendChild(el('span', 'textbook-source-quiz-paren', '('));
          if (blank.parts) group.style.flexWrap = 'wrap';
          (blank.parts || [blank]).forEach(function (part, partIndex) {
            if (partIndex) group.appendChild(el('span', 'textbook-source-quiz-part-separator', blank.partSeparator));
            var input = responseInput(localId + '-blank-' + number + '-part-' + partIndex,
              (item.originalNumber === null ? '번호 없는 원문 문항' : '원문 ' + item.originalNumber + '번') + ' 빈칸 ' + number + (blank.parts ? ' 응답 ' + (partIndex + 1) : ''));
            input.dataset.sourceResponseSlotId = part.id; group.appendChild(input);
            inputs.push({node:input,answerIds:part.answerIds,orderMatters:item.answer.orderMatters});
          });
          group.appendChild(el('span', 'textbook-source-quiz-paren', ')')); statement.appendChild(group);
        }
      });
      card.appendChild(statement);
      if (item.kind === 'classification') {
        card.appendChild(el('p', 'textbook-source-quiz-help', '원문 각 항목의 콜론 뒤에 해당하는 보기 번호를 적으세요. 한 항목에 답이 여러 개면 쉼표로 구분하세요.'));
        item.subitems.forEach(function (sub, i) {
          var slot = item.responseSlots[i], row = el('p', 'textbook-source-quiz-statement');
          row.dataset.sourceSubitemId = sub.id;
          var input = responseInput(localId + '-response-' + (i + 1), '원문 ' + sub.sourceText + ' 응답');
          input.dataset.sourceResponseSlotId = slot.id;
          var prompt = el('label', '', sub.sourceText); prompt.htmlFor = input.id;
          row.appendChild(prompt); row.appendChild(doc.createTextNode(' ')); row.appendChild(input); card.appendChild(row);
          inputs.push({node:input,answerIds:slot.answerIds,orderMatters:slot.answer.orderMatters});
        });
        var choicesHeading = el('p', 'textbook-source-quiz-statement', item.choicesLabelSourceText);
        choicesHeading.id = localId + '-choices'; card.appendChild(choicesHeading);
        var choices = el('ul', 'textbook-source-quiz-events'); choices.setAttribute('aria-labelledby', choicesHeading.id);
        item.choices.forEach(function (choice) { choices.appendChild(el('li', '', choice.sourceText)); }); card.appendChild(choices);
      }
      if (item.kind === 'sequence' && item.answer.sequenceSeparator) card.appendChild(el('p', 'textbook-source-quiz-help', '교재 정답표처럼 기호 사이에 ' + item.answer.sequenceSeparator + '를 넣어 적으세요.'));
      if (item.answer.sequenceTokens) card.appendChild(el('p', 'textbook-source-quiz-help', '문제에서 요구한 사건 번호를 순서대로 적으세요. 교재 정답표의 연도도 정답을 볼 때 함께 표시됩니다.'));
      if (item.events && item.events.length) {
        var events = el('ul', 'textbook-source-quiz-events'); events.setAttribute('aria-label', '교재의 원문 보기');
        item.events.forEach(function (event) { events.appendChild(el('li', '', event.sourceText)); }); card.appendChild(events);
      }
        var response=saved.workspace.responses[item.id],row={item:item,inputs:inputs,submitted:false,correct:null,touched:false,hasResponse:!!response};rows.push(row);
        inputs.forEach(function(entry,slot){entry.itemIndex=itemIndex;entry.graded=false;entry.match=false;entry.composing=false;entry.composedAt=0;
          entry.feedback=el('span','textbook-source-inline-feedback');entry.feedback.id=prefix+'-feedback-'+itemIndex+'-'+slot;entry.feedback.setAttribute('role','status');entry.feedback.setAttribute('aria-live','polite');entry.node.insertAdjacentElement('afterend',entry.feedback);entry.node.setAttribute('aria-describedby',entry.node.getAttribute('aria-describedby')+' '+entry.feedback.id);entry.node.enterKeyHint='next';
          entry.node.value=response&&response.values[slot]||'';fields.push(entry);
          on(entry.node,'focus',function(){lastFocused=fields.indexOf(entry);if(cursor!==itemIndex){cursor=itemIndex;cursorVersion++;schedule();}var rect=entry.node.getBoundingClientRect();if(rect.top<80||rect.bottom>doc.defaultView.innerHeight-20)entry.node.scrollIntoView({block:'nearest',behavior:'auto'});});
          on(entry.node,'compositionstart',function(){entry.composing=true;});on(entry.node,'compositionend',function(){entry.composing=false;entry.composedAt=Date.now();if(doc.activeElement!==entry.node||entry.graded)grade(row,entry);else mark(row);});
          on(entry.node,'input',function(){if(entry.composing){mark(row);return;}if(entry.graded)grade(row,entry);else mark(row);});
          on(entry.node,'blur',function(){if(!entry.composing)grade(row,entry);});
          on(entry.node,'keydown',function(e){if(e.key==='Enter'){e.preventDefault();if(e.repeat||e.isComposing||e.keyCode===229||entry.composing||Date.now()-entry.composedAt<100)return;grade(row,entry);var next=displayFields.indexOf(entry)+1;if(next<displayFields.length)focusAt(fields.indexOf(displayFields[next]));}});
        });
        (groups?topicTarget(groups,itemIndex):list).appendChild(card);
        if(response){inputs.forEach(function(entry,slot){if(!(response.submitted||response.checkedSlots&&response.checkedSlots[slot]))return;var parts=entry.answerIds.map(function(id){return item.answers.find(function(a){return a.id===id;}).text;}),value=entry.node.value;entry.graded=!!normalize(value);entry.match=(item.answer.sequenceTokens&&normalize(value)===normalize(item.answer.text))||compare(value,parts,entry.orderMatters,item.kind,item.answer.sequenceSeparator)==='match';entry.feedback.textContent=answerFeedback(item,entry,value,parts);entry.feedback.dataset.result=entry.match?'match':'different';});row.submitted=inputs.every(function(e){return e.graded;});row.correct=row.submitted?inputs.every(function(e){return e.match;}):null;}
      });
      var byNode=new Map(fields.map(function(entry){return [entry.node,entry];}));
      displayFields=Array.from(list.querySelectorAll('.textbook-source-quiz-input')).map(function(node){return byNode.get(node);});
      updateProgress();
    }
    on(retry,'click',function(){flush('active').catch(function(){});});
    on(stop,'click',function(){if(pausing||!saved)return;pausing=true;clearTimeout(timer);stop.disabled=true;flush('paused').then(function(){if(active){pausing=false;stop.disabled=false;showReview();message('현재 입력과 위치를 계정에 저장했습니다.');}},function(){pausing=false;stop.disabled=false;});});
    var reviewButton=el('button','textbook-source-quiz-review-button','풀이 목록·오답 보기');reviewButton.type='button';controls.appendChild(reviewButton);on(reviewButton,'click',function(){stop.click();});
    function beforeUnload(e){if(dirty.size||pending||inFlight||ackCursor!==cursorVersion){e.preventDefault();e.returnValue='';}}doc.defaultView.addEventListener('beforeunload',beforeUnload);
    function cleanup(){if(!active)return;active=false;if(recoveryOff)recoveryOff();recoveryOff=null;clearTimeout(timer);listeners.forEach(function(x){x[0].removeEventListener(x[1],x[2]);});listeners=[];doc.defaultView.removeEventListener('beforeunload',beforeUnload);fields.forEach(function(e){e.node.value='';e.feedback.textContent='';});fields=[];displayFields=[];rows=[];dirty.clear();pending=null;saved=null;data=null;wrapper.replaceChildren();wrapper.remove();if(mounted.get(host)===controller)mounted.delete(host);}
    var old=mounted.get(host);if(old)old.cleanup();host.replaceChildren(wrapper);var controller={element:wrapper,ready:null,cleanup:cleanup,hasUnsaved:function(){return !!(dirty.size||pending||inFlight||ackCursor!==cursorVersion);},prepareLeave:function(){if(!active||!saved)return Promise.resolve();if(!controller.hasUnsaved())return Promise.resolve();pausing=true;clearTimeout(timer);return flush('paused').then(function(){pausing=false;},function(e){pausing=false;throw e;});}};mounted.set(host,controller);
    var recovery=options.recovery||root.HanqAuthSession,sourceRevision=options.sourceRevision||data.source.sha256||null,recoveryKey='source:'+(sourceRevision?sourceRevision+':':'')+data.id,legacyRecoveryKey='source:'+data.id;
    if(recovery&&options.ownerId&&recovery.register)recoveryOff=recovery.register(recoveryKey,{ownerId:options.ownerId,capture:function(){if(!active||!saved||!controller.hasUnsaved())return null;var ids=new Set([...dirty.keys()]);if(pending)pending.captured.forEach(function(u){ids.add(u.itemId);});var entry=fields[lastFocused];return {sourceRevision:sourceRevision,quizId:data.id,version:saved.version,baseRevision:saved.revision,cursor:cursor,focusIndex:lastFocused,selection:entry?[entry.node.selectionStart,entry.node.selectionEnd]:null,updates:rows.filter(function(row){return ids.has(row.item.id);}).map(function(row){return {itemId:row.item.id,values:answerValues(row),submitted:row.submitted,checkedSlots:row.inputs.map(function(e){return e.graded&&!e.composing;})};})};}});
    function restoreDraft(){
      if(!recovery||!recovery.peekDraft||!options.ownerId)return null;var draft=recovery.peekDraft(recoveryKey,options.ownerId),draftKey=recoveryKey;if(!draft&&sourceRevision==='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'){draft=recovery.peekDraft(legacyRecoveryKey,options.ownerId);draftKey=legacyRecoveryKey;}if(!draft||draft.sourceRevision!=null&&draft.sourceRevision!==sourceRevision||draft.quizId!==data.id||draft.version!==saved.version||!Array.isArray(draft.updates))return null;
      var accepted=[];draft.updates.forEach(function(u){var item=data.items.find(function(i){return i.id===u.itemId;});if(!item)return;var count=item.kind==='classification'?item.responseSlots.length:item.blanks.reduce(function(n,b){return n+(b.parts?b.parts.length:1);},0);if(!Array.isArray(u.values)||u.values.length!==count||u.values.some(function(v){return typeof v!=='string'||v.length>2000;})||!Array.isArray(u.checkedSlots)||u.checkedSlots.length!==count||u.checkedSlots.some(function(v){return typeof v!=='boolean';}))return;var copy={values:u.values.slice(),submitted:u.submitted===true,correct:null,checkedSlots:u.checkedSlots.slice()};saved.workspace.responses[u.itemId]=copy;accepted.push({itemId:u.itemId,values:copy.values,submitted:copy.submitted,checkedSlots:copy.checkedSlots,generation:++version});});
      if(!accepted.length&&!(Number.isInteger(draft.cursor)&&draft.cursor>=0&&draft.cursor<data.items.length))return null;accepted.forEach(function(u){dirty.set(u.itemId,u);});if(Number.isInteger(draft.cursor)&&draft.cursor>=0&&draft.cursor<data.items.length){cursor=draft.cursor;if(cursor!==saved.workspace.cursor)cursorVersion++;}recovery.takeDraft(draftKey,options.ownerId);return draft;
    }

    controller.ready=Promise.resolve().then(function(){if(typeof options.loadProgress!=='function'||typeof options.saveProgress!=='function')throw Error('progress_unavailable');return options.loadProgress();}).then(function(result){if(!active)return;saved=result;if(!saved.workspace||!saved.workspace.responses)throw Error('workspace_unavailable');cursor=saved.workspace.cursor;presentation=joseonPresentation(data,saved.version);var restored=restoreDraft();build();message('저장한 응답을 불러왔습니다. 채점은 즉시 반영되고 계정 저장은 묶어서 진행됩니다.');if(restored){lastFocused=Number.isInteger(restored.focusIndex)?Math.max(0,Math.min(restored.focusIndex,fields.length-1)):fields.findIndex(function(e){return e.itemIndex===cursor;});focusAt(lastFocused);if(restored.selection&&fields[lastFocused]){var n=fields[lastFocused].node;try{n.setSelectionRange(Math.min(restored.selection[0]||0,n.value.length),Math.min(restored.selection[1]||0,n.value.length));}catch(e){}}clearTimeout(timer);retry.hidden=false;message('같은 계정의 미저장 답안과 위치를 복원했습니다. 계속 풀거나 저장 다시 시도를 눌러주세요.');}else if(saved.workspace.status==='paused')showReview();else focusAt(fields.findIndex(function(e){return e.itemIndex===cursor;}));},function(){message('계정별 풀이를 불러오지 못했습니다. 새로고침해 다시 시도해 주세요.',true);});return controller;
  }
  root.HanqTextbookSourceQuiz=Object.freeze({render:render});
})(typeof window !== 'undefined' ? window : globalThis);
