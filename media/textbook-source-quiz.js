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
  function sourcePromptStyles(data) {
    var result = new Map(), profile = data.sourcePromptStyles;
    if (profile == null) return result;
    if (!profile || profile.schemaVersion !== 'hanq-source-prompt-styles/1' || !/^[a-f0-9]{64}$/.test(profile.sourceRevision || '') || profile.sourceRevision !== data.source.sha256 || Object.keys(profile).some(function(k){return ['schemaVersion','sourceRevision','entries'].indexOf(k)<0;})) fail('prompt style source');
    var entries = list(profile.entries, 'prompt styles'); if (entries.length > 4096) fail('prompt style count');
    entries.forEach(function(entry) {
      if (!entry || Object.keys(entry).some(function(k){return ['itemId','segmentIndex','start','end','text','bold','underline','sourceCharIds','audit'].indexOf(k)<0;})) fail('prompt style keys');
      var item = data.items.find(function(i){return i.id===entry.itemId;}), audit=entry.audit;
      if (!item || !verified(item) || !item.source || item.source.sha256 !== profile.sourceRevision || !audit || audit.verified !== true || audit.sourceRevision !== profile.sourceRevision || audit.sourcePdfPage !== item.pdfPage) fail('prompt style verification');
      var segment = Number.isInteger(entry.segmentIndex) && entry.segmentIndex >= 0 && item.segments[entry.segmentIndex];
      if (!segment || segment.type !== 'text' || !Number.isInteger(entry.start) || !Number.isInteger(entry.end) || entry.start < 0 || entry.end <= entry.start || entry.end > segment.text.length || segment.text.slice(entry.start,entry.end) !== entry.text) fail('prompt style range');
      if ((entry.bold != null && typeof entry.bold !== 'boolean') || (entry.underline != null && typeof entry.underline !== 'boolean') || !(entry.bold || entry.underline)) fail('prompt style flags');
      var ids=list(entry.sourceCharIds,'prompt style glyphs'), original=list(item.source.questionCharacterIds,'prompt original glyphs'), previous=-1;
      if(ids.length!==Array.from(entry.text).length) fail('prompt style glyph count');
      ids.forEach(function(id){var index=original.indexOf(id);if(index<=previous || typeof id!=='string' || id.indexOf('p'+String(item.pdfPage).padStart(3,'0')+'-')!==0)fail('prompt style glyph binding');previous=index;});
      var key=item.id+'\u0000'+entry.segmentIndex, ranges=result.get(key)||[];ranges.push(entry);result.set(key,ranges);
    });
    result.forEach(function(ranges){ranges.sort(function(a,b){return a.start-b.start;});ranges.forEach(function(r,i){if(i && ranges[i-1].end>r.start)fail('overlapping prompt styles');});});
    return result;
  }
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
    sourcePromptStyles(data);
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
  // Pure one-session practice helpers; never write progress or award XP.
  function practiceSlots(item) {
    if (!verified(item)) throw Error('unverified_practice_item');
    var slots=item.kind==='classification'?(item.responseSlots||[]):(item.blanks||[]).reduce(function(out,b){return out.concat(b.parts||[b]);},[]);
    if(!slots.length) throw Error('missing_practice_slots');
    return slots.map(function(slot){
      var ids=slot.answerIds;
      if(!Array.isArray(ids)||!ids.length||ids.some(function(id){return !(item.answers||[]).some(function(a){return a.id===id;});}))throw Error('invalid_practice_answers');
      return {id:slot.id,answerIds:ids.slice(),orderMatters:slot.answer?slot.answer.orderMatters:item.answer.orderMatters};
    });
  }
  function gradePractice(item,values,grading) {
    if(grading&&grading.gradingVersion===2&&(!grading.matcher||typeof grading.matcher.gradeSlot!=='function'))throw Error('source_grading_unavailable');
    var slots=practiceSlots(item);
    if(!Array.isArray(values)||values.length!==slots.length||values.some(function(v){return typeof v!=='string'||v.length>2000;}))throw Error('invalid_practice_values');
    var results=slots.map(function(entry,i){
      var value=values[i],parts=entry.answerIds.map(function(id){return item.answers.find(function(a){return a.id===id;}).text;});
      if(!normalize(value))return {complete:false,correct:false,feedback:'답을 입력해 주세요.'};
      var match=!!(item.answer.sequenceTokens&&normalize(value)===normalize(item.answer.text))||(grading&&grading.gradingVersion===2?grading.matcher.gradeSlot(item,entry,value,compare):compare(value,parts,entry.orderMatters,item.kind,item.answer.sequenceSeparator))==='match';
      return {complete:true,correct:match,feedback:answerFeedback(item,{match:match,orderMatters:entry.orderMatters},value,parts)};
    });
    return {complete:results.every(function(r){return r.complete;}),correct:results.every(function(r){return r.complete&&r.correct;}),slots:results};
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
    validate(inputData);options=options||{};if(options.gradingVersion!=null&&options.gradingVersion!==1&&options.gradingVersion!==2)throw Error('source_grading_unavailable');if(options.sourceRevision!=null&&options.sourceRevision!==inputData.source.sha256)fail('source revision binding');var data=JSON.parse(JSON.stringify(inputData)),doc=host.ownerDocument,prefix='hanq-source-quiz-'+(++serial);
    var promptStyles=sourcePromptStyles(options.sourcePromptStyles==null?data:Object.assign({},data,{sourcePromptStyles:JSON.parse(JSON.stringify(options.sourcePromptStyles))}));
    var gradingVersion=options.gradingVersion===2?2:1,gradingMatcher=null,legacyProgress=null,legacySavedResult=null,legacyLoadFailed=false;
    var manualSave=options.manualSave===true,sequential=manualSave&&options.sequential===true,saveButton=null,restartButton=null;if(gradingVersion===2&&!sequential)throw Error('source_grading_unavailable');
    // Era quizzes no longer expose manual review selection. Stored selections remain untouched.
    var showVerdict=!!options.checkedReview||manualSave,checkedReview=!!options.checkedReview&&!manualSave,onlyMarked=false,marked=new Set(),markVersion=0,ackMarkVersion=0,markIntents=new Map(),selectionConflict=false;
    var active=true,listeners=[],saved=null,rows=[],fields=[],displayFields=[],presentation=null,dirty=new Map(),version=0,cursor=0,cursorVersion=0,ackCursor=0,lastFocused=0,recoveryOff=null,timer=null,inFlight=null,pending=null,pausing=false;
    function el(tag,cls,value){var n=doc.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
    function on(n,t,f){n.addEventListener(t,f);listeners.push([n,t,f]);}
    function appendPromptText(target,value){
      // Source scripts may carry small emphasis tags. Build only safe formatting nodes;
      // never insert source HTML, attributes, links, images or executable elements.
      var tags=/<\/?([a-z][a-z0-9:-]*)\b[^>]*>/gi,stack=[{node:target,tag:''}],offset=0,match,blocked='';
      while((match=tags.exec(value))){
        if(!blocked)stack[stack.length-1].node.appendChild(doc.createTextNode(value.slice(offset,match.index)));
        var name=match[1].toLowerCase(),closing=/^<\//.test(match[0]);offset=tags.lastIndex;
        if(blocked){if(closing&&name===blocked)blocked='';continue;}
        if(/^(script|style|iframe|object|template)$/.test(name)){if(!closing)blocked=name;continue;}
        if(/^(strong|b|em|i|u|sup|sub)$/.test(name)){
          if(closing){for(var index=stack.length-1;index>0;index--)if(stack[index].tag===name){stack.length=index;break;}}
          else{var node=el(name==='b'?'strong':name,'');stack[stack.length-1].node.appendChild(node);stack.push({node:node,tag:name});}
        }else if(/^(br|p|div|li)$/.test(name))stack[stack.length-1].node.appendChild(doc.createTextNode(' '));
      }
      if(!blocked)stack[stack.length-1].node.appendChild(doc.createTextNode(value.slice(offset)));
    }
    var wrapper=el('section','textbook-source-quiz textbook-source-continuous'+(manualSave?' textbook-source-inline-questions':''));wrapper.appendChild(el('h2','textbook-source-quiz-title',data.title));
    var notesEdition = data.source.sha256 === 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de' ? '81' : data.source.sha256 === '35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442' ? '79' : null;
    if (notesEdition) { wrapper.classList.add('history-notes-design'); wrapper.setAttribute('data-history-edition',notesEdition); }
    if(sequential)wrapper.appendChild(el('p','textbook-source-quiz-help textbook-source-grading-notice','문제의 정답을 입력하고, Enter 키를 눌러 진행하세요.'));
    if(checkedReview)wrapper.appendChild(el('p','textbook-source-quiz-help','모르는 문제 / 확실히 틀린 문제만 체크하세요. 다시보기를 통해 모르는 문제만 다시봐요 !'));
    var controls=el('div','textbook-source-list-controls'),stop=el('button','textbook-source-quiz-stop','그만하기'),retry=el('button','textbook-source-save-retry','저장 다시 시도');stop.type=retry.type='button';retry.hidden=true;if(!checkedReview&&!manualSave)controls.appendChild(stop);controls.appendChild(retry);wrapper.appendChild(controls);
    var progress=el('p','textbook-source-progress'),status=el('p','textbook-source-quiz-status','계정에 저장된 응답을 불러오는 중…');status.setAttribute('role','status');status.setAttribute('aria-live','polite');if(manualSave){wrapper.classList.add('textbook-source-manual-save');var summaryBar=el('div','textbook-source-save-bar');saveButton=el('button','textbook-source-save-complete','저장 / 완료');saveButton.type='button';saveButton.disabled=true;var summaryActions=el('div','textbook-source-save-actions');restartButton=el('button','textbook-source-restart','다시 풀기');restartButton.type='button';restartButton.disabled=true;summaryActions.appendChild(saveButton);summaryActions.appendChild(restartButton);summaryBar.appendChild(progress);summaryBar.appendChild(summaryActions);wrapper.insertBefore(summaryBar,controls);}else wrapper.appendChild(progress);wrapper.appendChild(status);
    var list=el('div','textbook-source-list'),reviewHost=el('div','textbook-source-review');wrapper.appendChild(list);wrapper.appendChild(reviewHost);reviewHost.hidden=true;
    var flow=null,flowIndex=0,flowPhase='answer',flowTimer=null,flowEnterTimer=null,flowGeneration=0,flowSubmitPending=false,counterState=null,counterTimer=null,latestSavedResult=null,celebration=null,celebrationTimer=null,celebratedRevision=null;
    var markedFilter=null,markedEmpty=null,pointerActive=false,deferredStatus=null,statusTimer=null;
    if(showVerdict)wrapper.classList.add('textbook-source-checked-review');
    if(checkedReview){
      // Do not move a pointer target between pointerdown (blur grades) and click.
      on(doc,'pointerdown',function(){pointerActive=true;});
      function releasePointer(){pointerActive=false;clearTimeout(statusTimer);statusTimer=setTimeout(function(){if(active&&!pointerActive&&deferredStatus){var next=deferredStatus;deferredStatus=null;message(next.text,next.error);}},0);}
      on(doc,'pointerup',releasePointer);on(doc,'pointercancel',releasePointer);on(doc.defaultView,'blur',releasePointer);
      markedFilter=el('button','textbook-source-marked-filter','체크문제보기');markedFilter.type='button';controls.insertBefore(markedFilter,retry);
      on(markedFilter,'click',function(){onlyMarked=!onlyMarked;applyMarkedFilter();});
      markedEmpty=el('p','textbook-source-marked-empty','체크한 문제가 없습니다. 전체보기에서 문제 옆 체크를 선택하세요.');markedEmpty.setAttribute('role','status');markedEmpty.hidden=true;wrapper.insertBefore(markedEmpty,list);

    }
    function selectedIds(){return data.items.filter(function(item){return marked.has(item.id);}).map(function(item){return item.id;});}
    function validateSelection(result){var ids=result&&result.workspace&&result.workspace.selectedReviewQuestionIds;if(result.reviewSelectionAvailable!==true||!Array.isArray(ids)||ids.length>data.items.length||new Set(ids).size!==ids.length||ids.some(function(id){return !data.items.some(function(item){return item.id===id;});}))throw Error('review_selection_unavailable');return ids;}
    function setReviewMark(id,value){if(value)marked.add(id);else marked.delete(id);markIntents.set(id,{selected:value,generation:++markVersion});message(manualSave?'저장하지 않은 변경이 있습니다.':'체크 변경을 계정에 저장 대기 중…');updateSaveButton();schedule();}
    async function retrySave(){
      if((checkedReview||manualSave)&&selectionConflict){
        var latest=await options.loadProgress();if(!active)return;if(gradingVersion===2)root.HanqSourceGradingV2Session.requireV2(latest);if(latest.version!==saved.version)throw Error('workspace_version');if(checkedReview){var ids=validateSelection(latest);marked=new Set(ids);markIntents.forEach(function(v,id){if(v.selected)marked.add(id);else marked.delete(id);});}saved=latest;pending=null;selectionConflict=false;if(manualSave)restoreUnchangedRows();
        if(markIntents.size)markVersion++;if(checkedReview)rows.forEach(function(row){row.reviewCheckbox.checked=marked.has(row.item.id);});applyMarkedFilter();
      }
      return flush(manualSave?'completed':'active');
    }
    function applyMarkedFilter(){
      if(!checkedReview)return;
      rows.forEach(function(row){row.card.hidden=onlyMarked&&!marked.has(row.item.id);});
      list.querySelectorAll('.textbook-source-quiz-instruction').forEach(function(heading){var node=heading.nextElementSibling,visible=false;while(node&&!node.classList.contains('textbook-source-quiz-instruction')){if(node.matches('[data-source-item-id]')&&!node.hidden)visible=true;node=node.nextElementSibling;}heading.hidden=onlyMarked&&!visible;});
      displayFields=fields.filter(function(entry){return !rows[entry.itemIndex].card.hidden;});
      markedEmpty.hidden=!onlyMarked||rows.some(function(row){return !row.card.hidden;});
      markedFilter.setAttribute('aria-pressed',String(onlyMarked));
      markedFilter.textContent=(onlyMarked?'전체보기':'체크문제보기')+' ('+marked.size+')';
      markedFilter.setAttribute('aria-label',(onlyMarked?'체크 문제 표시 중. 전체보기':'전체 문제 표시 중. 체크문제보기')+'. 체크 '+marked.size+'개');
    }
    function restoreUnchangedRows(){
      // A fresh run is a local snapshot. Never pull answers from another completed run into it.
      if(sequential){updateProgress();return;}
      rows.forEach(function(row){
        if(dirty.has(row.item.id))return;
        var response=saved.workspace.responses[row.item.id];row.hasResponse=!!response;row.touched=false;
        row.inputs.forEach(function(entry,slot){
          entry.node.value=response&&response.values[slot]||'';entry.graded=false;entry.match=false;entry.feedback.textContent='';feedbackResult(entry,null);entry.node.removeAttribute('aria-invalid');
          if(!response||!(response.submitted||response.checkedSlots&&response.checkedSlots[slot])||!normalize(entry.node.value))return;
          var parts=entry.answerIds.map(function(id){return row.item.answers.find(function(a){return a.id===id;}).text;}),value=entry.node.value;
          entry.graded=true;entry.match=(row.item.answer.sequenceTokens&&normalize(value)===normalize(row.item.answer.text))||compare(value,parts,entry.orderMatters,row.item.kind,row.item.answer.sequenceSeparator)==='match';entry.feedback.textContent=answerFeedback(row.item,entry,value,parts);feedbackResult(entry,entry.match?'match':'different');entry.node.setAttribute('aria-invalid',String(!entry.match));
        });row.submitted=row.inputs.every(function(e){return e.graded;});row.correct=row.submitted?row.inputs.every(function(e){return e.match;}):null;paintVerdict(row,false);
      });updateProgress();
    }
    function feedbackResult(entry,result){if(manualSave&&entry.feedback.textContent&&entry.resultPrefix&&entry.feedback.textContent.indexOf(entry.resultPrefix)!==0)entry.feedback.textContent=entry.resultPrefix+entry.feedback.textContent;if(result==null){delete entry.feedback.dataset.result;delete entry.node.dataset.sourceResult;}else{entry.feedback.dataset.result=result;entry.node.dataset.sourceResult=result;}}
    function verdictMark(){
      var svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','textbook-source-verdict-mark');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
      [['mark-correct','M 25 8 C 19 2 9 3 5 12 C 1 22 10 29 21 25 C 29 22 30 11 23 6 C 17 2 8 5 5 12 C 2 21 13 29 28 27'],['mark-correct mark-texture','M 23 6 C 16 3 8 7 6 14 M 7 23 C 13 28 23 26 27 20'],['mark-wrong mark-first','M 6 6 C 12 10 18 20 26 26'],['mark-wrong mark-second','M 26 6 C 21 12 12 20 6 26']].forEach(function(spec){var p=doc.createElementNS(svg.namespaceURI,'path');p.setAttribute('class',spec[0]);p.setAttribute('d',spec[1]);p.setAttribute('pathLength','100');svg.appendChild(p);});return svg;
    }
    function paintVerdict(row,animate){
      if(!showVerdict)return;
      var wrong=row.inputs.some(function(e){return e.graded&&!e.composing&&!e.match;}),complete=row.inputs.every(function(e){return e.graded&&!e.composing;}),value=wrong?'wrong':complete?'correct':'pending',before=row.verdict.dataset.result;
      if(row.mark){row.mark.dataset.result=value;if(before!==value||!animate){row.mark.classList.remove('is-drawing');if(animate&&value!=='pending'){void row.mark.getBoundingClientRect();row.mark.classList.add('is-drawing');}}}
      row.verdict.dataset.result=value;if(sequential&&row.inputs.length===1)row.verdict.hidden=true;row.verdict.textContent=value==='wrong'?'X · 오답':value==='correct'?'O · 정답':row.inputs.some(function(e){return e.graded;})?'미완료':'';
      if(before!==value||!animate){row.verdict.classList.remove('is-animating');if(animate&&value!=='pending'){void row.verdict.offsetWidth;row.verdict.classList.add('is-animating');}}
    }
    function message(text,error){if(!active)return;if(pointerActive){deferredStatus={text:text,error:error};return;}deferredStatus=null;var result=error?'different':/저장했습니다|불러왔습니다/.test(text)?'match':'pending';status.hidden=!text||checkedReview&&text==='응답과 현재 위치를 계정에 저장했습니다.';if(status.textContent===text&&status.dataset.result===result)return;status.textContent=text;status.dataset.result=result;}
    function partialFeedback(row){if(row.item.kind==='sequence')return '';for(var i=0;i<row.inputs.length;i++){var e=row.inputs[i],parts=e.answerIds.map(function(id){return row.item.answers.find(function(a){return a.id===id;}).text;});if(e.graded&&!e.orderMatters&&parts.length>1){var detail=multipleAnswerDetails(e.node.value,parts);if(detail.partial)return answerFeedback(row.item,e,e.node.value,parts);}}return '';}
    function updateSaveButton(){if(sequential){updateFlowActions();return;}if(saveButton){saveButton.disabled=!saved||!!inFlight||pausing||saved.workspace.status==='completed'&&!dirty.size&&!pending&&ackMarkVersion===markVersion;saveButton.textContent=inFlight?'저장 중…':saved&&saved.workspace.status==='completed'&&!dirty.size&&!pending&&ackMarkVersion===markVersion?'저장 완료':'저장 / 완료';}if(restartButton)restartButton.disabled=!saved||!!inFlight||!!pending||pausing||fields.some(function(e){return e.composing;})||!fields.some(function(e){return !!normalize(e.node.value)||e.graded;});}
    function restart(){
      if(!active||!saved||inFlight||pending||pausing||fields.some(function(e){return e.composing;}))return;
      // Reset only the current draft. No reset/delete API or account-wide changes.
      // Saved rows are blank edits so an explicit later save cannot revive old answers.
      if(sequential)dirty.clear();
      rows.forEach(function(row){
        var changed=!sequential&&(dirty.has(row.item.id)||!!saved.workspace.responses[row.item.id]);
        row.inputs.forEach(function(entry){entry.node.value='';entry.graded=false;entry.match=false;entry.composedAt=0;entry.feedback.textContent='';feedbackResult(entry,null);entry.node.removeAttribute('aria-invalid');});
        row.submitted=false;row.correct=null;row.touched=false;if(sequential)row.hasResponse=false;
        if(changed)dirty.set(row.item.id,{itemId:row.item.id,values:answerValues(row),submitted:false,checkedSlots:row.inputs.map(function(){return false;}),generation:++version});
        paintVerdict(row,false);
      });
      cursor=0;lastFocused=0;if(sequential){cancelFlowTimer();flowPhase='answer';flowIndex=0;reviewHost.hidden=true;flow.layout.hidden=false;flow.dialog.hidden=true;showFlowQuestion(0,false);}updateProgress();message('');focusAt(fields.findIndex(function(e){return !e.node.disabled;}));
    }
    function paintExamCounters(done,total,rate){
      var label='현재 정답률: '+rate+'%';
      progress.setAttribute('aria-label',label);progress.dataset.accuracyBand=done===0?'neutral':rate>=80?'high':rate>=70?'middle':'low';
      if(!counterState){
        progress.replaceChildren();var accuracy=el('span','textbook-source-accuracy'),caption=el('span','','현재 정답률: '),percent=el('strong','textbook-source-counter-value','0'),count=el('span','textbook-source-count'),number=el('strong','textbook-source-counter-value','0'),spoken=el('span','textbook-source-counter-spoken');
        accuracy.setAttribute('aria-hidden','true');count.setAttribute('aria-hidden','true');accuracy.append(caption,percent,doc.createTextNode('%'));count.append(number,doc.createTextNode(' / '+total));spoken.setAttribute('role','status');spoken.setAttribute('aria-live','polite');spoken.setAttribute('aria-atomic','true');progress.append(accuracy,spoken);counterState={done:0,rate:0,targetDone:null,targetRate:null,number:number,percent:percent,spoken:spoken};
      }
      var state=counterState;if(state.targetDone===done&&state.targetRate===rate)return;clearTimeout(counterTimer);state.targetDone=done;state.targetRate=rate;state.spoken.textContent=label;
      var fromDone=state.done,fromRate=state.rate,start=Date.now(),reduce=doc.defaultView.matchMedia&&doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function tick(){if(!active)return;var t=reduce?1:Math.min(1,(Date.now()-start)/320),ease=1-Math.pow(1-t,3);state.done=Math.round(fromDone+(done-fromDone)*ease);state.rate=Math.round(fromRate+(rate-fromRate)*ease);state.number.textContent=String(state.done);state.percent.textContent=String(state.rate);if(t<1)counterTimer=setTimeout(tick,16);else counterTimer=null;}
      tick();
    }
    function updateProgress(){if(sequential){var done=rows.filter(function(r){return r.submitted;}).length,correct=rows.filter(function(r){return r.correct===true;}).length;paintExamCounters(done,data.items.length,done?Math.floor(correct/done*100):0);paintFlowNavigation();updateSaveButton();return;}if(manualSave){progress.textContent='정답 '+rows.filter(function(r){return r.correct===true;}).length+' / '+data.items.length;updateSaveButton();return;}progress.textContent='풀이 '+rows.filter(function(r){return r.submitted;}).length+' / '+data.items.length+' · 정답 '+rows.filter(function(r){return r.correct===true;}).length+(rows.some(function(r){return !!partialFeedback(r);})?' · 미완성 답 '+rows.filter(function(r){return !!partialFeedback(r);}).length:'');}
    function answerValues(row){return row.inputs.map(function(e){return e.node.value;});}
    function mark(row){row.touched=true;var values=answerValues(row);row.submitted=row.inputs.every(function(e){return e.graded&&!e.composing&&!!normalize(e.node.value);});row.correct=row.submitted?row.inputs.every(function(e){return e.match;}):null;var update={itemId:row.item.id,values:values,submitted:row.submitted,checkedSlots:row.inputs.map(function(e){return e.graded&&!e.composing;})},previous=dirty.get(row.item.id)||saved&&saved.workspace.responses[row.item.id];if(manualSave&&previous&&same(previous.values,update.values)&&previous.submitted===update.submitted&&same(previous.checkedSlots||previous.values.map(function(){return previous.submitted;}),update.checkedSlots)){paintVerdict(row,true);updateProgress();return;}dirty.set(row.item.id,Object.assign({generation:++version},update));paintVerdict(row,true);updateProgress();message(manualSave?(sequential?'':'저장하지 않은 변경이 있습니다.'):'입력은 유지됩니다 · 계정 저장 대기 중…');schedule();}
    function schedule(){clearTimeout(timer);if(manualSave)return;if(!pausing)timer=setTimeout(function(){flush('active').catch(function(){});},800);}
    function failure(e){if(!active)return;if(sequential&&e&&(e.status===413||e.code==='source_payload_too_large')){pending=null;retry.hidden=true;message('답안 전체가 너무 깁니다. 긴 답안을 줄인 뒤 다시 제출해 주세요. 입력과 이전 최종 기록은 유지됩니다.',true);return;}if((checkedReview||manualSave)&&(e&&(e.status===409||e.code==='source_progress_conflict')))selectionConflict=true;retry.hidden=false;message(e&&(e.status===409||e.code==='source_progress_conflict')?(checkedReview||manualSave?(checkedReview?'다른 화면의 저장과 충돌했습니다. 입력과 체크는 유지됩니다. 저장 다시 시도로 최신 기록과 합쳐 저장하세요.':'다른 화면의 저장과 충돌했습니다. 입력은 유지됩니다. 저장 다시 시도로 최신 기록과 합쳐 저장하세요.'):'다른 화면의 저장과 충돌했습니다. 현재 입력은 유지했습니다. 저장된 기록을 확인하려면 새로고침하세요.'):'계정에 저장하지 못했습니다. 입력은 이 화면에 유지됩니다. 저장 다시 시도를 눌러주세요.',true);}
    function flush(target){
      clearTimeout(timer);if(!active||!saved)return Promise.reject(Error('session_changed'));
      if((checkedReview||manualSave)&&selectionConflict)return Promise.reject(Object.assign(Error('source_progress_conflict'),{status:409}));
      if(inFlight)return manualSave?inFlight:inFlight.then(function(){return flush(target);});
      if(!pending&&!dirty.size&&ackCursor===cursorVersion&&ackMarkVersion===markVersion&&target==='active')return Promise.resolve(saved);
      if(!pending){var captured=[...dirty.values()].map(function(u){return Object.assign({},u,{values:u.values.slice()});});pending={body:{version:saved.version,revision:saved.revision,mutationId:doc.defaultView.crypto.randomUUID(),cursor:manualSave?0:cursor,status:target,updates:captured.map(function(u){return {itemId:u.itemId,values:u.values,submitted:u.submitted,checkedSlots:u.checkedSlots};})},captured:captured,cursorVersion:cursorVersion,markVersion:markVersion};if(gradingVersion===2)pending.body.gradingVersion=2;if(checkedReview&&markVersion!==ackMarkVersion)pending.body.selectedReviewQuestionIds=selectedIds();}
      var request=pending;if(sequential&&new doc.defaultView.Blob([JSON.stringify(request.body)]).size>262144){pending=null;var oversized=Object.assign(Error('source_payload_too_large'),{code:'source_payload_too_large'});failure(oversized);return Promise.reject(oversized);}retry.disabled=true;message('계정에 응답을 묶어서 저장하는 중…');
      var task=Promise.resolve().then(function(){return options.saveProgress(request.body);}).then(function(result){
        if(!active)return result;if(gradingVersion===2){root.HanqSourceGradingV2Session.requireV2(result);if(!completedResult(result))throw Error('workspace_save_ack');}if(manualSave&&(!result||result.version!==request.body.version||!Number.isInteger(result.revision)||result.revision<=request.body.revision||!result.workspace||result.workspace.status!=='completed'||!result.workspace.responses||request.captured.some(function(u){var r=result.workspace.responses[u.itemId];return !r||!same(r.values,u.values)||r.submitted!==u.submitted;})))throw Error('workspace_save_ack');if(checkedReview){validateSelection(result);if(request.body.selectedReviewQuestionIds&&!same(result.workspace.selectedReviewQuestionIds,request.body.selectedReviewQuestionIds))throw Error('review_selection_ack');}saved=result;if(sequential){latestSavedResult=completedResult(result);paintSavedHistory();}pending=null;request.captured.forEach(function(u){if(dirty.has(u.itemId)&&dirty.get(u.itemId).generation===u.generation)dirty.delete(u.itemId);});ackCursor=Math.max(ackCursor,request.cursorVersion);ackMarkVersion=Math.max(ackMarkVersion,request.markVersion);markIntents.forEach(function(v,id){if(v.generation<=request.markVersion)markIntents.delete(id);});retry.hidden=true;
        if(dirty.size||ackCursor!==cursorVersion||ackMarkVersion!==markVersion){message(manualSave?(sequential?'제출 중 바뀐 답안은 아직 저장되지 않았습니다. 제출을 다시 눌러주세요.':'저장 중 바뀐 답안은 아직 저장되지 않았습니다. 저장 / 완료를 다시 눌러주세요.'):'새 입력을 추가 저장하는 중…');schedule();}else message(manualSave?'':'응답과 현재 위치를 계정에 저장했습니다.');return result;
      },function(e){failure(e);throw e;});
      inFlight=task.catch(function(e){failure(e);throw e;}).then(function(result){inFlight=null;retry.disabled=false;updateSaveButton();return result;},function(e){inFlight=null;retry.disabled=false;updateSaveButton();throw e;});
      updateSaveButton();return inFlight.then(function(result){if(active&&target==='paused'&&(dirty.size||ackCursor!==cursorVersion||ackMarkVersion!==markVersion||saved.workspace.status!=='paused'))return flush('paused');return result;});
    }
    function grade(row,entry){
      var parts=entry.answerIds.map(function(id){return row.item.answers.find(function(a){return a.id===id;}).text;}),value=entry.node.value;
      if(!normalize(value)&&!row.touched&&!row.hasResponse)return;
      entry.graded=!!normalize(value);var result=row.item.answer.sequenceTokens&&normalize(value)===normalize(row.item.answer.text)?'match':gradingVersion===2?gradingMatcher.gradeSlot(row.item,{id:entry.node.dataset.sourceResponseSlotId,answerIds:entry.answerIds,orderMatters:entry.orderMatters},value,compare):compare(value,parts,entry.orderMatters,row.item.kind,row.item.answer.sequenceSeparator);entry.match=result==='match';
      entry.feedback.textContent=result==='empty'?'':answerFeedback(row.item,entry,value,parts);feedbackResult(entry,result);entry.node.setAttribute('aria-invalid',String(result==='different'));mark(row);
    }
    function focusAt(index){var entry=fields[index];if(sequential&&entry&&entry.itemIndex!==flowIndex&&flow)showFlowQuestion(entry.itemIndex,false);if(entry){entry.node.focus({preventScroll:true});var rect=entry.node.getBoundingClientRect(),viewport=sequential&&doc.defaultView.visualViewport,top=viewport?viewport.offsetTop:0,bottom=viewport?viewport.offsetTop+viewport.height:doc.defaultView.innerHeight;if(rect.top<top+80||rect.bottom>bottom-20)entry.node.scrollIntoView({block:'nearest',behavior:'auto'});}}
    function cancelFlowTimer(){clearGoalCelebration();clearTimeout(flowTimer);clearTimeout(flowEnterTimer);flowTimer=flowEnterTimer=null;flowGeneration++;fields.forEach(function(entry){entry.pendingEnter=false;});}
    function commitFlowEnter(row,entry){
      clearTimeout(flowEnterTimer);var generation=flowGeneration;
      flowEnterTimer=setTimeout(function(){flowEnterTimer=null;if(!active||generation!==flowGeneration||flowPhase!=='answer'||rows[flowIndex]!==row||!entry.pendingEnter)return;if(entry.composing)return;entry.pendingEnter=false;checkFlowQuestion();},0);
    }
    function updateFlowActions(){
      if(!flow)return;
      var busy=!saved||!!inFlight||pausing,composing=fields.some(function(e){return e.composing;}),last=flowIndex===rows.length-1;
      saveButton.hidden=!last||flowPhase==='statistics';saveButton.disabled=busy||composing||(flowPhase!=='answer'&&flowPhase!=='graded');saveButton.textContent=inFlight?'제출 중…':'제출';
      restartButton.hidden=flowPhase!=='statistics'||flow.viewingSaved;restartButton.disabled=busy||!!pending||composing;
      flow.previous.disabled=busy||flowIndex===0||(flowPhase!=='answer'&&flowPhase!=='graded');flow.next.disabled=busy||last||(flowPhase!=='answer'&&flowPhase!=='graded');
      flow.historyList.querySelectorAll('.textbook-source-history-entry').forEach(function(button){button.disabled=busy;});paintFlowPosition();if(flowPhase==='statistics')saveButton.hidden=true;
    }
    function paintFlowPosition(){
      if(!flow)return;var target=flowIndex+1;if(flow.positionTarget===target)return;
      clearTimeout(flow.positionTimer);flow.positionTarget=target;flow.position.setAttribute('aria-label',target+' / '+rows.length);flow.positionSpoken.textContent=target+' / '+rows.length;
      var from=flow.positionValue==null?target:flow.positionValue,start=Date.now(),reduce=doc.defaultView.matchMedia&&doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function tick(){if(!active||!flow)return;var t=reduce?1:Math.min(1,(Date.now()-start)/320);flow.positionValue=Math.round(from+(target-from)*(1-Math.pow(1-t,3)));flow.positionNumber.textContent=String(flow.positionValue);if(t<1)flow.positionTimer=setTimeout(tick,16);else flow.positionTimer=null;}tick();
    }
    function paintFlowNavigation(){
      if(!flow)return;
      rows.forEach(function(row,i){var state=row.submitted?(row.correct?'correct':'wrong'):'pending',button=flow.buttons[i];button.dataset.result=state;button.setAttribute('aria-current',i===flowIndex?'step':'false');button.setAttribute('aria-label',(i+1)+'번, '+(state==='correct'?'정답':state==='wrong'?'오답':'미풀이')+(i===flowIndex?', 현재 문제':''));button.querySelector('.textbook-source-map-state').textContent=state==='correct'?'O':state==='wrong'?'X':'·';});
    }
    function editFlowAnswer(row){
      if(flowPhase!=='answer')return;
      row.inputs.forEach(function(entry){entry.graded=false;entry.match=false;entry.feedback.textContent='';feedbackResult(entry,null);entry.node.removeAttribute('aria-invalid');});
      mark(row);
    }
    function showFlowQuestion(index,focus){
      if(!flow||!active||inFlight)return;
      cancelFlowTimer();flowPhase='answer';flow.viewingSaved=false;progress.hidden=false;flowIndex=Math.max(0,Math.min(index,rows.length-1));cursor=flowIndex;flow.dialog.hidden=true;flow.layout.inert=false;flow.layout.hidden=false;reviewHost.hidden=true;
      rows.forEach(function(row,i){row.card.hidden=i!==flowIndex;row.inputs.forEach(function(entry){entry.node.readOnly=false;});});
      list.querySelectorAll('.textbook-source-quiz-instruction').forEach(function(n){n.hidden=n!==rows[flowIndex].instruction;});
      var activeRow=rows[flowIndex];if(activeRow.instruction){activeRow.instruction.classList.add('textbook-source-question-guidance');activeRow.card.insertBefore(activeRow.instruction,activeRow.card.querySelector('.textbook-source-quiz-statement'));}
      displayFields=rows[flowIndex].inputs.slice();paintFlowNavigation();updateFlowActions();var current=flow.buttons[flowIndex],mapRect=flow.map.getBoundingClientRect(),buttonRect=current.getBoundingClientRect();if(buttonRect.top<mapRect.top)flow.map.scrollTop-=mapRect.top-buttonRect.top;else if(buttonRect.bottom>mapRect.bottom)flow.map.scrollTop+=buttonRect.bottom-mapRect.bottom;
      if(focus!==false){var entry=rows[flowIndex].inputs.find(function(e){return !e.node.disabled;});if(entry)focusAt(fields.indexOf(entry));}
    }
    function advanceFlow(){
      if(!flow||!active)return;
      var next=flowIndex+1;showFlowQuestion(next<rows.length?next:flowIndex,next<rows.length);
      if(next>=rows.length){message('마지막 문제입니다. 제출을 누르면 통계와 오답을 확인할 수 있습니다.');saveButton.focus();}
    }
    function appendFlowReview(target,row,index){
      target.appendChild(el('h4','',String(index+1)+'. '+questionSection(data.subtopics.find(function(t){return t.id===row.item.subtopicId;}))));
      // Reuse the safely rendered source structure, including emphasis and ordered choices.
      // Replace each response slot by its own canonical answer, never a flattened answer table.
      var prompt=el('div','textbook-source-review-prompt'),entries=new Map(row.inputs.map(function(entry){return [entry.node.id,entry];}));
      Array.from(row.card.children).filter(function(node){return node.matches('.textbook-source-quiz-statement,.textbook-source-quiz-events,.textbook-source-classification-responses,.textbook-source-quiz-help,.textbook-source-quiz-note');}).forEach(function(node){
        var copy=node.cloneNode(true);
        copy.querySelectorAll('input').forEach(function(input){
          var entry=entries.get(input.id),parts=entry.answerIds.map(function(id){return row.item.answers.find(function(answer){return answer.id===id;}).text;}),answer=el('strong','textbook-source-review-answer',row.item.answer.sequenceTokens?row.item.answer.text:parts.join(row.item.kind==='sequence'?(row.item.answer.sequenceSeparator||''):', '));
          if(input.closest('.textbook-source-quiz-blank'))input.replaceWith(answer);
          else{var blank=el('span','textbook-source-review-filled-blank');blank.append(doc.createTextNode('('),answer,doc.createTextNode(')'));input.replaceWith(blank);}
        });
        [copy].concat(Array.from(copy.querySelectorAll('*'))).forEach(function(n){n.removeAttribute('id');n.removeAttribute('for');n.removeAttribute('aria-describedby');n.removeAttribute('aria-labelledby');});
        prompt.appendChild(copy);
      });target.appendChild(prompt);
      target.appendChild(el('p','textbook-source-review-user-answer','내 답: '+(row.reviewValues||answerValues(row)).map(function(value){return value||'(미응답)';}).join(' / ')));
    }
    function checkFlowQuestion(){
      if(!flow||flowPhase!=='answer'||inFlight||!active)return;
      var row=rows[flowIndex],missing=row.inputs.find(function(e){return !normalize(e.node.value);});
      if(row.inputs.some(function(e){return e.composing;}))return;
      if(missing){message('모든 빈칸에 답을 입력한 뒤 채점해 주세요.');focusAt(fields.indexOf(missing));return;}
      row.inputs.forEach(function(entry){grade(row,entry);entry.node.readOnly=true;});flowPhase='drawing';updateFlowActions();
      cancelFlowTimer();var generation=flowGeneration;flowTimer=setTimeout(function(){if(!active||generation!==flowGeneration)return;flowTimer=null;if(row.correct===true){advanceFlow();return;}flowPhase='graded';updateFlowActions();},1000);
    }
    function submitFlow(){
      if(!flow||(flowPhase!=='answer'&&flowPhase!=='graded')||flowIndex!==rows.length-1||!saved||inFlight||pausing||fields.some(function(e){return e.composing;}))return;
      rows.forEach(function(row){row.inputs.forEach(function(entry){if(normalize(entry.node.value)||row.touched)grade(row,entry);});});
      var remaining=rows.filter(function(row){return !row.submitted;}).length;
      if(remaining&&!doc.defaultView.confirm('아직 '+remaining+'문제를 풀지 않았습니다. 미풀이를 포함해 제출할까요?'))return;
      // Explicitly submit the whole new run, including empty slots, so old answers cannot leak into its result.
      rows.forEach(function(row){dirty.set(row.item.id,{itemId:row.item.id,values:answerValues(row),submitted:row.submitted,checkedSlots:row.inputs.map(function(e){return e.graded&&!e.composing;}),generation:++version});});
      flowSubmitPending=true;retrySave().then(function(){if(active&&!controller.hasUnsaved()){flowSubmitPending=false;showFlowStatistics();}}).catch(failure);
    }
    function completedResult(result){
      if(!result||!result.workspace||result.workspace.status!=='completed'||!result.workspace.responses)return null;
      var valid=true,snapshot=rows.map(function(row){
        var response=result.workspace.responses[row.item.id],values=response&&response.values,complete=!!(response&&response.submitted);
        if(response&&(typeof response.submitted!=='boolean'||!Array.isArray(values)||values.length!==row.inputs.length||values.some(function(v){return typeof v!=='string';})||complete&&(typeof response.correct!=='boolean'||values.some(function(v){return !normalize(v);})||response.checkedSlots&&(!Array.isArray(response.checkedSlots)||response.checkedSlots.length!==values.length||response.checkedSlots.some(function(v){return v!==true;})))))valid=false;
        return {item:row.item,card:row.card,inputs:row.inputs,reviewValues:Array.isArray(values)?values.slice():[],submitted:complete,correct:complete?response.correct:null};
      });return valid?{rows:snapshot,updatedAt:result.updatedAt||null,revision:result.revision}:null;
    }
    function savedTime(value){
      if(!value)return '';var date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
      var parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date),fields={};parts.forEach(function(p){fields[p.type]=p.value;});return fields.year+'/'+fields.month+'/'+fields.day+' '+fields.hour+':'+fields.minute;
    }
    function paintSavedHistory(){
      if(!flow)return;flow.historyList.replaceChildren();flow.historyButton=null;
      if(!latestSavedResult)flow.historyList.appendChild(el('p','textbook-source-history-empty',saved&&saved.workspace&&saved.workspace.status==='completed'?'저장 결과를 표시하지 못했습니다. 새로고침해 다시 확인해 주세요.':'아직 제출한 풀이가 없습니다.'));
      [latestSavedResult,legacySavedResult].forEach(function(record,index){
        if(!record)return;var rate=record.rows.length?Math.floor(record.rows.filter(function(row){return row.correct===true;}).length/record.rows.length*100):0,time=savedTime(record.updatedAt),button=el('button','textbook-source-history-entry'),label=index===1?'이전 방식 저장 결과':'최근 저장 결과';button.type='button';button.dataset.recordScope=index===1?'legacy':'current';button.append(el('span','',time||'마지막 결과'),el('strong','',rate+'%'),el('small','',label));button.setAttribute('aria-label',(time?'저장 시각 '+time+', ':'')+label+', 정답률 '+rate+'퍼센트. 통계와 오답 보기');button.disabled=!!inFlight;flow.historyList.appendChild(button);if(index===0)flow.historyButton=button;
      });
      if(legacyLoadFailed)flow.historyList.appendChild(el('p','textbook-source-history-empty','이전 방식의 저장 결과를 확인하지 못했습니다. 새로고침해 다시 확인해 주세요.'));
    }
    function clearGoalCelebration(){
      clearTimeout(celebrationTimer);celebrationTimer=null;if(celebration)celebration.remove();celebration=null;
    }
    function celebrateGoal(){
      // Only the first statistics entry for this successful submission. No account writes or saved-history replay.
      if(!active||!saved||saved.workspace.status!=='completed'||celebratedRevision===saved.revision)return;
      celebratedRevision=saved.revision;
      if(doc.hidden||doc.documentElement.dataset.companyMode==='on'||doc.defaultView.matchMedia&&doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      var burst=el('div','textbook-source-goal-celebration'),colors=['#d39a20','#2575bf','#d6586b','#27866f','#8b67b3'];burst.setAttribute('aria-hidden','true');
      for(var i=0;i<32;i++){
        var piece=el('i',''),side=i%2===0?1:-1,spread=24+(i*37%98);piece.style.left=side===1?'12%':'88%';
        piece.style.setProperty('--confetti-x',side*spread+'px');piece.style.setProperty('--confetti-end-x',side*spread*1.4+'px');piece.style.setProperty('--confetti-y',(-68-i*13%86)+'px');piece.style.setProperty('--confetti-spin',(side*(210+i*31))+'deg');piece.style.setProperty('--confetti-color',colors[i%colors.length]);piece.style.setProperty('--confetti-delay',(i%8*18)+'ms');piece.style.setProperty('--confetti-duration',(1400+i%5*90)+'ms');burst.appendChild(piece);
      }
      celebration=burst;reviewHost.appendChild(burst);celebrationTimer=setTimeout(clearGoalCelebration,2100);
    }
    function showFlowStatistics(record){
      cancelFlowTimer();flow.viewingSaved=!!record;progress.hidden=!!record;flowPhase='statistics';flow.dialog.hidden=true;flow.layout.inert=false;flow.layout.hidden=true;reviewHost.hidden=false;reviewHost.replaceChildren();
      var resultRows=record?record.rows:gradingVersion===2&&latestSavedResult?latestSavedResult.rows:rows,correct=resultRows.filter(function(row){return row.correct===true;}).length,wrong=resultRows.filter(function(row){return row.submitted&&row.correct===false;}),unanswered=resultRows.filter(function(row){return !row.submitted;}).length;
      var heading=el('h3','textbook-source-statistics-title',record?'저장된 풀이 통계':'시험 통계');heading.tabIndex=-1;reviewHost.appendChild(heading);if(record){var date=savedTime(record.updatedAt);reviewHost.appendChild(el('p','textbook-source-history-caption',(record===legacySavedResult?'이전 방식 저장 결과 · ':'')+(date?'최근 저장: '+date+' (한국 시간)':'마지막 저장 결과')));}
      reviewHost.appendChild(el('p','textbook-source-statistics-score','전체 '+rows.length+'문제 중 '+correct+'문제 정답 · 정답률 '+(rows.length?Math.floor(correct/rows.length*100):0)+'%'));
      reviewHost.appendChild(el('p','','오답 '+wrong.length+'문제 · 미풀이 '+unanswered+'문제'));
      var reached=rows.length>0&&correct/rows.length>=.8;reviewHost.appendChild(el('p','textbook-source-goal',reached?'목표 80% 달성! 다음 시대 학습으로 넘어가세요.':'목표는 정답률 80%입니다. 오답을 복습하고 다시 도전해 보세요.'));
      var nextEras={prehistory:'samguk',ancient:'nambuk',nambuk:'goryeo',goryeo:'joseon',joseon:'opening',opening:'colonial',colonial:'modern'},nextEra=nextEras[data.id],nextLink=el('a','textbook-source-next-era',nextEra?'다음 시대 학습':'시대별 학습 목록');nextLink.href=nextEra?'#chapter/'+nextEra+'/webtoon':'#past-exams';reviewHost.appendChild(nextLink);
      var back=el('button','textbook-source-quiz-resume',record?'풀이로 돌아가기':'답안으로 돌아가기');back.type='button';on(back,'click',function(){showFlowQuestion(flowIndex);});reviewHost.appendChild(back);
      var reviewHeader=el('div','textbook-source-review-header');reviewHeader.appendChild(el('h3','','틀린 문제 다시 보기'));reviewHost.appendChild(reviewHeader);
      if(wrong.length){
        var pdfButton=el('button','textbook-source-review-pdf-button','오답 PDF 저장'),pdfStatus=el('p','textbook-source-review-pdf-status'),pdfBusy=false,statisticsGeneration=flowGeneration;
        pdfButton.type='button';pdfStatus.setAttribute('role','status');pdfStatus.setAttribute('aria-live','polite');reviewHeader.appendChild(pdfButton);reviewHost.appendChild(pdfStatus);
        function currentStatistics(){return active&&flowPhase==='statistics'&&flowGeneration===statisticsGeneration;}
        on(pdfButton,'click',async function(){
          if(pdfBusy||!currentStatistics())return;pdfBusy=true;pdfButton.disabled=true;pdfButton.textContent='PDF 만드는 중…';pdfStatus.textContent='';
          try{
            var exporter=doc.defaultView.HanqEraQuizReviewPdf;if(!exporter||typeof exporter.download!=='function')throw Error('pdf_unavailable');
            var result=await exporter.download({review:reviewHost,title:data.title+' 오답',isCurrent:currentStatistics,onProgress:function(p){if(currentStatistics())pdfStatus.textContent=p.done+' / '+p.total+'문항 준비 중';}});
            if(currentStatistics())pdfStatus.textContent=result.count+'문항 · '+result.pages+'쪽 PDF 내려받기를 시작했습니다.';
          }catch(error){if(currentStatistics())pdfStatus.textContent='PDF를 만들지 못했습니다. 다시 시도해 주세요.';}
          finally{if(currentStatistics()){pdfBusy=false;pdfButton.disabled=false;pdfButton.textContent='오답 PDF 저장';}}
        });
      }
      wrong.forEach(function(row){var card=el('article','textbook-source-review-item');card.dataset.sourceReviewItemId=row.item.id;appendFlowReview(card,row,rows.findIndex(function(original){return original.item.id===row.item.id;}));reviewHost.appendChild(card);});
      if(!wrong.length)reviewHost.appendChild(el('p','','틀린 문제가 없습니다.'));updateFlowActions();heading.focus();if(!record&&reached)celebrateGoal();
    }
    function buildFlow(){
      wrapper.classList.add('textbook-source-sequential');
      var layout=el('div','textbook-source-exam-layout'),stage=el('div','textbook-source-exam-stage'),nav=el('nav','textbook-source-question-map');nav.setAttribute('aria-label','문제 번호와 정답 여부');
      var sidebar=el('aside','textbook-source-exam-sidebar'),history=el('section','textbook-source-history'),historyList=el('div','textbook-source-history-list');history.setAttribute('aria-label','저장된 풀이 이력');history.append(el('h3','','풀이 이력'),historyList);wrapper.insertBefore(layout,list);layout.appendChild(stage);stage.appendChild(list);layout.appendChild(sidebar);sidebar.append(nav,history);
      var actions=el('div','textbook-source-exam-actions'),previous=el('button','','이전'),next=el('button','','다음'),position=el('span','textbook-source-exam-position'),positionNumber=el('strong','','1'),positionSpoken=el('span','textbook-source-counter-spoken');
      previous.type=next.type='button';positionNumber.setAttribute('aria-hidden','true');var fraction=el('span','',' / '+rows.length);fraction.setAttribute('aria-hidden','true');positionSpoken.setAttribute('role','status');positionSpoken.setAttribute('aria-live','polite');positionSpoken.setAttribute('aria-atomic','true');position.append(positionNumber,fraction,positionSpoken);actions.appendChild(previous);actions.appendChild(position);actions.appendChild(next);stage.appendChild(actions);stage.appendChild(saveButton);
      var summary=el('h3','','문제'),map=el('div','textbook-source-question-map-grid');nav.appendChild(summary);nav.appendChild(map);map.style.setProperty('--source-question-rows',String(Math.ceil(rows.length/2)));map.style.setProperty('--source-question-mobile-rows',String(Math.ceil(rows.length/4)));
      var dialog=el('div','textbook-source-inline-mistake');dialog.hidden=true;stage.insertBefore(dialog,actions);
      flow={layout:layout,stage:stage,nav:nav,map:map,historyList:historyList,historyButton:null,viewingSaved:false,buttons:[],previous:previous,next:next,position:position,positionNumber:positionNumber,positionSpoken:positionSpoken,positionTimer:null,positionValue:null,positionTarget:null,dialog:dialog};
      rows.forEach(function(row,index){var button=el('button','textbook-source-question-number');button.type='button';button.appendChild(el('span','',String(index+1)));button.appendChild(el('span','textbook-source-map-state'));button.title=(data.subtopics.find(function(t){return t.id===row.item.subtopicId;})||{title:''}).title+' · 원문 '+sourceNumber(row.item,index);button.setAttribute('aria-controls',row.card.id=prefix+'-question-'+index);on(button,'click',function(){if(!inFlight)showFlowQuestion(index);});map.appendChild(button);flow.buttons.push(button);});
      on(previous,'click',function(){showFlowQuestion(flowIndex-1);});on(next,'click',advanceFlow);on(historyList,'click',function(event){var button=event.target.closest('.textbook-source-history-entry'),record=button&&(button.dataset.recordScope==='legacy'?legacySavedResult:latestSavedResult);if(record&&!inFlight&&!pausing)showFlowStatistics(record);});
      latestSavedResult=completedResult(saved);legacySavedResult=completedResult(legacyProgress);paintSavedHistory();showFlowQuestion(0,false);
    }
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
    function topicLabel(topic) {
      if(manualSave&&data.id==='joseon'&&topic.id==='society-comparison')return (sequential?'':'사회 비교 · ')+'고려 / 조선 후기 중 맞는 것을 쓰세요';
      return topic.title;
    }
    function questionSection(topic){
      if(!topic)return data.title;
      if(data.id==='joseon'&&topic.id==='society-comparison')return '사회 비교';
      var names={'early-joseon':'조선 전기','late-joseon':'조선 후기','early-goryeo':'고려 초기','aristocratic-period':'문벌귀족시기','military-rule':'무신정권기 · 대몽항쟁','yuan-interference':'원 간섭기','late-goryeo':'고려 말','unified-silla-culture':'통일신라 문화','event-sequence':'사건 순서','foreign-invasions':'거란 · 여진 · 몽골 침입','find-state':'국가 구분'};
      if(names[topic.id])return names[topic.id];var title=topicLabel(topic).split(/[:：]/)[0];return /^(설명|해당|공부)/.test(title)?data.title:title;
    }
    function topicTarget(groups, index) {
      var target=groups[presentation[index]],topic=data.items[index].subtopicId;
      if(topic==='early-joseon'||topic==='late-joseon')return target;
      var existing=Array.from(target.children).find(function(n){return n.dataset.sourceSubtopic===topic;});
      if(existing)return existing;
      var section=el('section','textbook-joseon-topic'),title=data.subtopics.find(function(t){return t.id===topic;});
      section.dataset.sourceSubtopic=topic;section.appendChild(el('h4','textbook-joseon-subtopic',title?topicLabel(title):topic));target.appendChild(section);return section;
    }
    function showReview(){
      list.hidden=true;controls.hidden=true;reviewHost.hidden=false;reviewHost.replaceChildren();reviewHost.appendChild(el('h3','',rows.every(function(r){return r.submitted;})?'전체 풀이 결과':'여기까지 저장했어요'));
      var resume=el('button','textbook-source-quiz-resume','저장한 위치에서 이어 풀기');resume.type='button';on(resume,'click',function(){reviewHost.hidden=true;list.hidden=false;controls.hidden=false;focusAt(fields.findIndex(function(e){return e.itemIndex===cursor;}));});reviewHost.appendChild(resume);
      var filterLabel=el('label','textbook-source-review-filter'),filter=el('input','');filter.type='checkbox';filterLabel.appendChild(filter);filterLabel.appendChild(doc.createTextNode(' 틀린 문항만 보기'));reviewHost.appendChild(filterLabel);var results=el('div','');reviewHost.appendChild(results);
      function paint(){results.replaceChildren();var groups=presentation?groupedContainers(results,'textbook-joseon-review'):null;rows.forEach(function(row,i){if(!row.submitted||(filter.checked&&row.correct))return;var card=el('article','textbook-source-review-item');card.dataset.sourceReviewItemId=row.item.id;card.appendChild(el('h4','',sourceNumber(row.item,i)+'번 · '+(row.correct?'✓ 정답':partialFeedback(row)||'✕ 오답')));card.appendChild(el('p','',row.item.sourceText||row.item.text));card.appendChild(el('p','','내 답: '+answerValues(row).join(' / ')));card.appendChild(el('p','','교재 정답: '+row.item.answer.text));(groups?groups[presentation[i]]:results).appendChild(card);});if(groups)Object.keys(groups).forEach(function(g){groups[g].hidden=!groups[g].querySelector('[data-source-review-item-id]');});if(!results.querySelector('[data-source-review-item-id]'))results.appendChild(el('p','','표시할 풀이가 없습니다.'));}
      on(filter,'change',paint);paint();(data.answerTableNotes||[]).forEach(function(note){reviewHost.appendChild(el('p','textbook-source-quiz-source-note',note.sourceText));});
    }
    function build(){
      var groups=presentation&&!sequential?groupedContainers(list,'textbook-joseon-section'):null, instructions=new WeakMap();
      data.items.forEach(function(item,itemIndex){
      var target=groups?topicTarget(groups,itemIndex):list, topic=data.subtopics.find(function(t){return t.id===item.subtopicId;}), previous=instructions.get(target), instruction=previous&&previous.topic===item.subtopicId?previous.node:null;
      if((sequential&&data.id==='joseon'&&item.subtopicId==='society-comparison')||!previous||previous.topic!==item.subtopicId){
        instruction=null;
        if(topic&&topic.title.trim()){
          instruction=target.dataset.sourceSubtopic===topic.id?Array.from(target.children).find(function(n){return /^H[1-6]$/.test(n.tagName)&&n.textContent===topicLabel(topic);}):null;
          if(!instruction){instruction=el('h3','textbook-source-quiz-instruction',topicLabel(topic));target.appendChild(instruction);}
          instruction.id=prefix+'-instruction-'+itemIndex;
        }
        instructions.set(target,{topic:item.subtopicId,node:instruction});
      }
      var card = el('div', 'textbook-source-quiz-item'); card.dataset.sourceItemId = item.id;
      var localId = prefix + '-item-' + itemIndex, label = el(sequential?'h3':'small', 'textbook-source-quiz-item-source'+(sequential?' textbook-source-question-title':''),
        sequential ? questionSection(topic)+' ('+(itemIndex+1)+'번 문제)' : manualSave ? (item.originalNumber===null?sourceNumber(item,itemIndex):String(item.originalNumber)+'.') : '문제 ' + sourceNumber(item,itemIndex));
      label.id = localId + '-source';if(sequential)label.setAttribute('aria-label',label.textContent+' · 원문 '+sourceNumber(item,itemIndex)); card.setAttribute('aria-labelledby', label.id); card.appendChild(label);
      var statement = el('span', 'textbook-source-quiz-statement'), inputs = [], isVerified = verified(item);
      statement.id = localId + '-statement';
      function responseInput(id, description) {
        var input = el('input', 'textbook-source-quiz-input'); input.type = 'text';
        input.id = id; input.autocomplete = 'off'; input.spellcheck = false;
        input.maxLength = 2000;if(sequential){input.setAttribute('enterkeyhint','done');input.setAttribute('aria-keyshortcuts','Enter');} input.setAttribute('autocapitalize', 'off');
        input.setAttribute('aria-label', description);
        input.setAttribute('aria-describedby', statement.id + ' ' + label.id + (instruction?' '+instruction.id:''));
        input.disabled = !isVerified; return input;
      }
      item.segments.forEach(function (segment, segmentIndex) {
        if (segment.type === 'text') {
          var offset=0;
          (promptStyles.get(item.id+'\u0000'+segmentIndex)||[]).forEach(function(range){
            appendPromptText(statement,segment.text.slice(offset,range.start));
            var marked=el(range.bold?'strong':'span','textbook-source-prompt-emphasis');
            if(range.underline){var underline=el('u','');appendPromptText(underline,range.text);marked.appendChild(underline);}else appendPromptText(marked,range.text);
            statement.appendChild(marked);offset=range.end;
          });
          appendPromptText(statement,segment.text.slice(offset));
        }
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
            inputs.push({node:input,answerIds:part.answerIds,orderMatters:gradingVersion===2&&part.answer?part.answer.orderMatters:item.answer.orderMatters,resultLabel:'빈칸 '+number+(blank.parts?' 응답 '+(partIndex+1):'')});
          });
          group.appendChild(el('span', 'textbook-source-quiz-paren', ')')); statement.appendChild(group);
        }
      });
      card.appendChild(statement);
      if (item.kind === 'classification') {
        var choicesHeading = el('p', 'textbook-source-quiz-statement');appendPromptText(choicesHeading,item.choicesLabelSourceText);
        choicesHeading.id = localId + '-choices'; card.appendChild(choicesHeading);
        var choices = el('ul', 'textbook-source-quiz-events'); choices.setAttribute('aria-labelledby', choicesHeading.id);
        item.choices.forEach(function (choice) { var line=el('li','');appendPromptText(line,choice.sourceText);choices.appendChild(line); }); card.appendChild(choices);
        var responseGroup = el('div', 'textbook-source-classification-responses');
        responseGroup.setAttribute('role', 'group'); responseGroup.setAttribute('aria-label', '보기 항목별 답안');

        card.appendChild(el('p', 'textbook-source-quiz-help', '원문 각 항목의 콜론 뒤에 해당하는 보기 번호를 적으세요. 한 항목에 답이 여러 개면 쉼표로 구분하세요.'));
        card.appendChild(responseGroup);
        item.subitems.forEach(function (sub, i) {
          var slot = item.responseSlots[i], row = el('p', 'textbook-source-quiz-statement');
          row.dataset.sourceSubitemId = sub.id;
          var input = responseInput(localId + '-response-' + (i + 1), '원문 ' + sub.sourceText + ' 응답');
          input.dataset.sourceResponseSlotId = slot.id;
          var prompt = el('label', '');appendPromptText(prompt,sub.sourceText); prompt.htmlFor = input.id;
          row.appendChild(prompt); row.appendChild(doc.createTextNode(' ')); row.appendChild(input); responseGroup.appendChild(row);
          inputs.push({node:input,answerIds:slot.answerIds,orderMatters:slot.answer.orderMatters,resultLabel:prompt.textContent});
        });

      }
      if (item.kind === 'sequence') card.appendChild(el('p', 'textbook-source-quiz-help', '번호를 순서대로 쉼표(,)로 구분해 적으세요. 원문자 대신 숫자로 입력해도 됩니다.'));
      if (item.answer.sequenceTokens) card.appendChild(el('p', 'textbook-source-quiz-help', '문제에서 요구한 사건 번호를 순서대로 적으세요. 교재 정답표의 연도도 정답을 볼 때 함께 표시됩니다.'));
      if (item.events && item.events.length) {
        var events = el('ul', 'textbook-source-quiz-events'); events.setAttribute('aria-label', '교재의 원문 보기');
        item.events.forEach(function (event) { var line=el('li','');appendPromptText(line,event.sourceText);events.appendChild(line); }); card.appendChild(events);
      }
        var response=sequential&&!dirty.has(item.id)?null:saved.workspace.responses[item.id],row={item:item,card:card,instruction:instruction,inputs:inputs,submitted:false,correct:null,touched:false,hasResponse:!!response};rows.push(row);
        if(manualSave){row.results=el('div','textbook-source-result-line');card.appendChild(row.results);}
        if(showVerdict){
          var questionHeader=el('div','textbook-source-question-header');card.insertBefore(questionHeader,label);if(manualSave){row.mark=verdictMark();questionHeader.appendChild(row.mark);}questionHeader.appendChild(label);
          row.verdict=el('span','textbook-source-verdict');row.verdict.setAttribute('role','status');row.verdict.setAttribute('aria-live','polite');(manualSave?row.results:questionHeader).appendChild(row.verdict);
          if(checkedReview){
            var markLabel=el('label','textbook-source-mark'),checkbox=el('input','');checkbox.type='checkbox';checkbox.setAttribute('aria-label',(topic?topic.title+' ':'')+'문제 '+sourceNumber(item,itemIndex)+' 복습 체크');
            checkbox.checked=marked.has(item.id);row.reviewCheckbox=checkbox;markLabel.appendChild(checkbox);markLabel.title='복습 체크 (답칸에서 F2)';questionHeader.appendChild(markLabel);
            on(checkbox,'keydown',function(e){if(e.key==='Escape'){e.preventDefault();focusAt(row.reviewReturnEntry?fields.indexOf(row.reviewReturnEntry):fields.findIndex(function(f){return f.itemIndex===itemIndex;}));}});
            on(checkbox,'change',function(){setReviewMark(item.id,checkbox.checked);applyMarkedFilter();if(onlyMarked&&!checkbox.checked)markedFilter.focus();});
          }
        }
        inputs.forEach(function(entry,slot){entry.resultPrefix=inputs.length>1?entry.resultLabel+': ':'';entry.itemIndex=itemIndex;entry.graded=false;entry.match=false;entry.composing=false;entry.composedAt=0;entry.pendingEnter=false;
          entry.feedback=el('span','textbook-source-inline-feedback');entry.feedback.id=prefix+'-feedback-'+itemIndex+'-'+slot;entry.feedback.setAttribute('role','status');entry.feedback.setAttribute('aria-live','polite');if(manualSave)row.results.appendChild(entry.feedback);else entry.node.insertAdjacentElement('afterend',entry.feedback);entry.node.setAttribute('aria-describedby',entry.node.getAttribute('aria-describedby')+' '+entry.feedback.id);entry.node.enterKeyHint=sequential?'done':'next';
          entry.node.value=response&&response.values[slot]||'';fields.push(entry);
          on(entry.node,'focus',function(){lastFocused=fields.indexOf(entry);if(!manualSave&&cursor!==itemIndex){cursor=itemIndex;cursorVersion++;schedule();}var rect=entry.node.getBoundingClientRect();if(rect.top<80||rect.bottom>doc.defaultView.innerHeight-20)entry.node.scrollIntoView({block:'nearest',behavior:'auto'});});
          on(entry.node,'compositionstart',function(){entry.composing=true;entry.pendingEnter=false;updateSaveButton();});on(entry.node,'compositionend',function(){entry.composing=false;entry.composedAt=Date.now();if(sequential)editFlowAnswer(row);else if(doc.activeElement!==entry.node||entry.graded)grade(row,entry);else mark(row);updateSaveButton();if(sequential&&entry.pendingEnter)commitFlowEnter(row,entry);});
          on(entry.node,'input',function(){if(sequential){editFlowAnswer(row);if(entry.pendingEnter&&!entry.composing)commitFlowEnter(row,entry);return;}if(entry.composing){mark(row);return;}if(entry.graded)grade(row,entry);else mark(row);});
          on(entry.node,'blur',function(){if(!sequential&&!entry.composing)grade(row,entry);});
          if(checkedReview){entry.node.setAttribute('aria-keyshortcuts','F2');entry.node.setAttribute('aria-description','F2로 복습 체크에 이동합니다. 체크에서 Escape를 누르면 답칸으로 돌아옵니다.');}
          if(sequential)on(entry.node,'keyup',function(e){if((e.key==='Enter'||e.code==='Enter'||e.code==='NumpadEnter')&&!e.repeat&&!e.isComposing&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!entry.composing&&(entry.pendingEnter||flowPhase==='answer'&&Date.now()-entry.composedAt<100)){entry.pendingEnter=true;commitFlowEnter(row,entry);}});
          on(entry.node,'keydown',function(e){
            if(sequential){if((e.key==='Enter'||e.code==='Enter'||e.code==='NumpadEnter')&&!e.altKey&&!e.ctrlKey&&!e.metaKey){if(e.repeat){e.preventDefault();return;}if((flowPhase==='graded'||flowPhase==='drawing')&&!e.isComposing&&e.keyCode!==229&&!entry.composing){e.preventDefault();if(flowPhase==='drawing'&&row.correct===true)return;advanceFlow();return;}if(e.isComposing||e.keyCode===229||entry.composing||Date.now()-entry.composedAt<100){entry.pendingEnter=true;commitFlowEnter(row,entry);if(!e.isComposing&&e.keyCode!==229&&!entry.composing)e.preventDefault();}else{e.preventDefault();checkFlowQuestion();}}return;}
            if((checkedReview||manualSave)&&!e.isComposing&&e.keyCode!==229&&!entry.composing&&!e.altKey&&!e.ctrlKey&&!e.metaKey){
              if(checkedReview&&e.key==='F2'){e.preventDefault();row.reviewReturnEntry=entry;row.reviewCheckbox.focus();return;}
              if(e.key==='Tab'){var targetIndex=displayFields.indexOf(entry)+(e.shiftKey?-1:1);if(targetIndex>=0&&targetIndex<displayFields.length){e.preventDefault();focusAt(fields.indexOf(displayFields[targetIndex]));return;}}
            }
            if(e.key==='Enter'){e.preventDefault();if(e.repeat||e.isComposing||e.keyCode===229||entry.composing||Date.now()-entry.composedAt<100)return;grade(row,entry);var next=displayFields.indexOf(entry)+1;if(next<displayFields.length)focusAt(fields.indexOf(displayFields[next]));}});
        });
        target.appendChild(card);
        if(response){inputs.forEach(function(entry,slot){if(!(response.submitted||response.checkedSlots&&response.checkedSlots[slot]))return;var parts=entry.answerIds.map(function(id){return item.answers.find(function(a){return a.id===id;}).text;}),value=entry.node.value;entry.graded=!!normalize(value);entry.match=(item.answer.sequenceTokens&&normalize(value)===normalize(item.answer.text))||compare(value,parts,entry.orderMatters,item.kind,item.answer.sequenceSeparator)==='match';entry.feedback.textContent=answerFeedback(item,entry,value,parts);feedbackResult(entry,entry.match?'match':'different');});row.submitted=inputs.every(function(e){return e.graded;});row.correct=row.submitted?inputs.every(function(e){return e.match;}):null;}paintVerdict(row,false);
      });
      var byNode=new Map(fields.map(function(entry){return [entry.node,entry];}));
      displayFields=Array.from(list.querySelectorAll('.textbook-source-quiz-input')).map(function(node){return byNode.get(node);});
      applyMarkedFilter();if(sequential)buildFlow();updateProgress();
    }
    if(sequential)on(doc,'visibilitychange',function(){if(doc.hidden)clearGoalCelebration();});
    if(sequential)on(saveButton,'keydown',function(e){if(e.key==='Enter'&&e.repeat)e.preventDefault();});
    on(retry,'click',function(){retry.disabled=true;retrySave().then(function(){if(sequential&&flowSubmitPending&&!controller.hasUnsaved()){flowSubmitPending=false;showFlowStatistics();}}).catch(failure).finally(function(){if(active)retry.disabled=false;});});
    on(stop,'click',function(){if(pausing||!saved)return;pausing=true;clearTimeout(timer);stop.disabled=true;flush('paused').then(function(){if(active){pausing=false;stop.disabled=false;showReview();message('현재 입력과 위치를 계정에 저장했습니다.');}},function(){pausing=false;stop.disabled=false;});});
    var reviewButton=el('button','textbook-source-quiz-review-button','풀이 목록·오답 보기');reviewButton.type='button';if(!checkedReview&&!manualSave)controls.appendChild(reviewButton);on(reviewButton,'click',function(){stop.click();});
    if(restartButton)on(restartButton,'click',restart);
    if(manualSave)on(saveButton,'click',function(){if(sequential){submitFlow();return;}if(!saved||inFlight||pausing)return;if(fields.some(function(e){return e.composing;})){message('한글 입력을 마친 뒤 저장 / 완료를 눌러주세요.');return;}rows.forEach(function(row){row.inputs.forEach(function(e){if(normalize(e.node.value)||row.touched)grade(row,e);});});retrySave().catch(failure);});
    function beforeUnload(e){if(dirty.size||pending||inFlight||ackCursor!==cursorVersion||ackMarkVersion!==markVersion){e.preventDefault();e.returnValue='';}}doc.defaultView.addEventListener('beforeunload',beforeUnload);
    function cleanup(){if(!active)return;active=false;cancelFlowTimer();clearTimeout(counterTimer);if(flow)clearTimeout(flow.positionTimer);clearTimeout(statusTimer);deferredStatus=null;if(recoveryOff)recoveryOff();recoveryOff=null;clearTimeout(timer);listeners.forEach(function(x){x[0].removeEventListener(x[1],x[2]);});listeners=[];doc.defaultView.removeEventListener('beforeunload',beforeUnload);fields.forEach(function(e){e.node.value='';e.feedback.textContent='';});fields=[];displayFields=[];rows=[];dirty.clear();marked.clear();markIntents.clear();pending=null;saved=null;latestSavedResult=null;legacySavedResult=null;legacyProgress=null;gradingMatcher=null;data=null;wrapper.replaceChildren();wrapper.remove();if(mounted.get(host)===controller)mounted.delete(host);}
    var old=mounted.get(host);if(old)old.cleanup();host.replaceChildren(wrapper);var controller={element:wrapper,ready:null,cleanup:cleanup,hasUnsaved:function(){return !!(dirty.size||pending||inFlight||ackCursor!==cursorVersion||ackMarkVersion!==markVersion);},prepareLeave:function(){if(!active||!saved)return Promise.resolve();if(!controller.hasUnsaved())return Promise.resolve();if(manualSave){if(inFlight)return inFlight.then(function(){return controller.prepareLeave();});if(doc.defaultView.confirm('아직 저장하지 않은 답안이 있습니다. 저장하지 않고 나가면 변경한 답안이 사라집니다. 나가시겠어요?'))return Promise.resolve();return Promise.reject(Object.assign(Error('leave_cancelled'),{code:'leave_cancelled'}));}pausing=true;clearTimeout(timer);return flush('paused').then(function(){pausing=false;},function(e){pausing=false;throw e;});}};mounted.set(host,controller);
    var recovery=options.recovery||root.HanqAuthSession,sourceRevision=options.sourceRevision||data.source.sha256||null,recoveryKey='source:'+(sourceRevision?sourceRevision+':':'')+data.id,legacyRecoveryKey='source:'+data.id;
    if(recovery&&options.ownerId&&recovery.register)recoveryOff=recovery.register(recoveryKey,{ownerId:options.ownerId,capture:function(){if(sequential||!active||!saved||!controller.hasUnsaved())return null;var ids=new Set([...dirty.keys()]);if(pending)pending.captured.forEach(function(u){ids.add(u.itemId);});var entry=fields[lastFocused];return {sourceRevision:sourceRevision,quizId:data.id,version:saved.version,baseRevision:saved.revision,cursor:cursor,focusIndex:lastFocused,...(checkedReview&&markVersion!==ackMarkVersion?{reviewSelectionChanges:[...markIntents].map(function(x){return {itemId:x[0],selected:x[1].selected};})}:{}),selection:entry?[entry.node.selectionStart,entry.node.selectionEnd]:null,updates:rows.filter(function(row){return ids.has(row.item.id);}).map(function(row){return {itemId:row.item.id,values:answerValues(row),submitted:row.submitted,checkedSlots:row.inputs.map(function(e){return e.graded&&!e.composing;})};})};}});
    function restoreDraft(){
      if(!recovery||!recovery.peekDraft||!options.ownerId)return null;var draft=recovery.peekDraft(recoveryKey,options.ownerId),draftKey=recoveryKey;if(!draft&&sourceRevision==='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'){draft=recovery.peekDraft(legacyRecoveryKey,options.ownerId);draftKey=legacyRecoveryKey;}if(!draft||draft.sourceRevision!=null&&draft.sourceRevision!==sourceRevision||draft.quizId!==data.id||draft.version!==saved.version||!Array.isArray(draft.updates))return null;if(sequential){if(recovery.takeDraft)recovery.takeDraft(draftKey,options.ownerId);return null;}
      if(!checkedReview&&!manualSave&&Array.isArray(draft.reviewSelectionChanges)&&draft.reviewSelectionChanges.length)return null;
      var accepted=[];draft.updates.forEach(function(u){var item=data.items.find(function(i){return i.id===u.itemId;});if(!item)return;var count=item.kind==='classification'?item.responseSlots.length:item.blanks.reduce(function(n,b){return n+(b.parts?b.parts.length:1);},0);if(!Array.isArray(u.values)||u.values.length!==count||u.values.some(function(v){return typeof v!=='string'||v.length>2000;})||!Array.isArray(u.checkedSlots)||u.checkedSlots.length!==count||u.checkedSlots.some(function(v){return typeof v!=='boolean';}))return;var copy={values:u.values.slice(),submitted:u.submitted===true,correct:null,checkedSlots:u.checkedSlots.slice()};saved.workspace.responses[u.itemId]=copy;accepted.push({itemId:u.itemId,values:copy.values,submitted:copy.submitted,checkedSlots:copy.checkedSlots,generation:++version});});
      var recoveredMarks=false;if(checkedReview&&Array.isArray(draft.reviewSelectionChanges)&&draft.reviewSelectionChanges.length<=data.items.length&&draft.reviewSelectionChanges.every(function(x){return x&&typeof x.selected==='boolean'&&data.items.some(function(item){return item.id===x.itemId;});})){draft.reviewSelectionChanges.forEach(function(x){if(x.selected)marked.add(x.itemId);else marked.delete(x.itemId);markIntents.set(x.itemId,{selected:x.selected,generation:++markVersion});});recoveredMarks=markIntents.size>0;}
      if(!accepted.length&&!recoveredMarks&&!(Number.isInteger(draft.cursor)&&draft.cursor>=0&&draft.cursor<data.items.length))return null;accepted.forEach(function(u){dirty.set(u.itemId,u);});if(!manualSave&&Number.isInteger(draft.cursor)&&draft.cursor>=0&&draft.cursor<data.items.length){cursor=draft.cursor;if(cursor!==saved.workspace.cursor)cursorVersion++;}recovery.takeDraft(draftKey,options.ownerId);return draft;
    }

    controller.ready=Promise.resolve().then(function(){if(typeof options.loadProgress!=='function'||typeof options.saveProgress!=='function')throw Error('progress_unavailable');return options.loadProgress();}).then(async function(result){if(!active)return;if(gradingVersion===2){if(!root.HanqSourceGradingV2Session||!root.HanqSourceGradingV2)throw Error('source_grading_unavailable');root.HanqSourceGradingV2Session.requireV2(result);gradingMatcher=await root.HanqSourceGradingV2.prepare(data,result.version);if(!active)return;if(typeof options.loadLegacyProgress==='function'){try{var legacy=await options.loadLegacyProgress();if(!active)return;if(!legacy||legacy.version!==result.version)throw Error('workspace_version');legacyProgress=legacy;}catch(e){if(!active)return;legacyLoadFailed=true;}}}saved=result;if(!saved.workspace||!saved.workspace.responses)throw Error('workspace_unavailable');if(checkedReview)marked=new Set(validateSelection(saved));cursor=manualSave?0:saved.workspace.cursor;presentation=joseonPresentation(data,saved.version);var restored=restoreDraft();build();message(manualSave?'':'저장한 응답을 불러왔습니다. 채점은 즉시 반영되고 계정 저장은 묶어서 진행됩니다.');if(restored&&manualSave){message(sequential?'같은 계정의 진행 중 답안을 복원했습니다. 제출 전에는 최종 기록이 바뀌지 않습니다.':'같은 계정의 미저장 답안을 복원했습니다. 계정에 반영하려면 저장 / 완료를 눌러주세요.');focusAt(0);}else if(restored){lastFocused=Number.isInteger(restored.focusIndex)?Math.max(0,Math.min(restored.focusIndex,fields.length-1)):fields.findIndex(function(e){return e.itemIndex===cursor;});focusAt(lastFocused);if(restored.selection&&fields[lastFocused]){var n=fields[lastFocused].node;try{n.setSelectionRange(Math.min(restored.selection[0]||0,n.value.length),Math.min(restored.selection[1]||0,n.value.length));}catch(e){}}clearTimeout(timer);retry.hidden=false;message('같은 계정의 미저장 답안과 위치를 복원했습니다. 계속 풀거나 저장 다시 시도를 눌러주세요.');}else if(saved.workspace.status==='paused'&&!checkedReview&&!manualSave)showReview();else focusAt(fields.findIndex(function(e){return e.itemIndex===cursor;}));}).catch(function(error){if(active)message(error&&error.code==='source_grading_unavailable'||String(error&&error.message).includes('grading')?'새 채점 기능을 확인하지 못했습니다. 다시 시도해 주세요. 답안은 저장되지 않았습니다.':'계정별 풀이를 불러오지 못했습니다. 새로고침해 다시 시도해 주세요.',true);if(gradingVersion===2)throw error;});return controller;
  }
  root.HanqTextbookSourceQuiz=Object.freeze({render:render,practiceSlots:practiceSlots,gradePractice:gradePractice});
})(typeof window !== 'undefined' ? window : globalThis);
