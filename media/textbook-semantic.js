/* Lightweight, text-first rendering of private textbook data.
 * No textbook content, fetches, storage, or authentication policy belongs here.
 * Call only with data returned by the authenticated textbook API. Figure URLs
 * must come from resolveFigure, never from an untrusted URL in the page JSON.
 *
 * render(host, page, { resolveFigure }) => { element, ready, cleanup }
 * resolveFigure(block, page) may return a Promise of a raster Blob, a trusted
 * HTTPS/blob URL, or { url }. Caller owns supplied URLs; this module revokes
 * only object URLs it creates. cleanup is idempotent and cancels late rendering.
 */
(function (root) {
  'use strict';
  var SCHEMA = 'hanq-semantic/1';
  var mounted = new WeakMap();
  var associationSequence = 0;

  function fail(message) { throw new TypeError('Invalid semantic textbook: ' + message); }
  function string(value, name) { if (typeof value !== 'string') fail(name); return value; }
  function integer(value, min, max, name) { if (!Number.isInteger(value) || value < min || value > max) fail(name); return value; }
  function verified(value) { return value === 'verified'; }
  function pageLabel(page) {
    return '교재 학습 자료';
  }
  function validateLines(lines) {
    if (!Array.isArray(lines)) fail('lines');
    lines.forEach(function (line) {
      if (!line || !Array.isArray(line.spans)) fail('line.spans');
      line.spans.forEach(function (span) {
        if (!span) fail('span');
        string(span.text, 'span.text');
        if (span.renderText != null) string(span.renderText, 'span.renderText');
        if (span.sourceStyle != null) {
          if (!span.sourceStyle || typeof span.sourceStyle !== 'object' || Array.isArray(span.sourceStyle)) fail('span.sourceStyle');
          var style=span.sourceStyle;
          if (Object.keys(style).some(function(key){return ['ink','underline','highlight','bold'].indexOf(key)===-1;}) ||
              style.ink!=null&&['default','muted','red','green'].indexOf(style.ink)===-1 ||
              style.highlight!=null&&style.highlight!=='green' ||
              style.underline!=null&&typeof style.underline!=='boolean' ||
              style.bold!=null&&typeof style.bold!=='boolean') fail('span.sourceStyle');
        }
      });
    });
  }
  function validateLineGroups(groups, lines) {
    if (groups == null) return;
    if (!Array.isArray(groups)) fail('lineGroups');
    var end = 0;
    groups.forEach(function (group) {
      if (!group || ['source-quote', 'source-inset'].indexOf(group.kind) === -1) fail('lineGroup.kind');
      integer(group.startLine, end, lines.length - 1, 'lineGroup.startLine');
      integer(group.endLineExclusive, group.startLine + 1, lines.length, 'lineGroup.endLineExclusive');
      if (group.borderStyle != null && ['dotted', 'solid', 'dashed'].indexOf(group.borderStyle) === -1) fail('lineGroup.borderStyle');
      end = group.endLineExclusive;
    });
  }
  function validateTimeline(timeline) {
    if (!timeline || !Array.isArray(timeline.bands) || !Array.isArray(timeline.events) || timeline.bands.length > 20 || timeline.events.length > 100) fail('sourceTimeline');
    function position(n) { if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1) fail('sourceTimeline.position'); }
    var end = 0;
    timeline.bands.forEach(function (band) { position(band.start); position(band.end); if (band.start < end || band.end <= band.start) fail('sourceTimeline.band'); end = band.end; validateLines(band.lines); });
    var previous = -1;
    timeline.events.forEach(function (event) { position(event.position); if (event.position < previous) fail('sourceTimeline.order'); previous = event.position; validateLines(event.lines); });
    if (timeline.boundaries != null && (!Array.isArray(timeline.boundaries) || timeline.boundaries.length > 21)) fail('sourceTimeline.boundaries');
    if (timeline.topBoundaries != null && (!Array.isArray(timeline.topBoundaries) || timeline.topBoundaries.length > 21)) fail('sourceTimeline.topBoundaries');
    (timeline.topBoundaries || []).forEach(function (boundary) { position(boundary.position); validateLines(boundary.lines); });
    (timeline.boundaries || []).forEach(function (boundary) { position(boundary.position); validateLines(boundary.lines); });
  }
  function validateTable(block) {
    if (block.sourceTimeline != null) validateTimeline(block.sourceTimeline);
    integer(block.columnCount, 1, 100, 'table.columnCount');
    if (block.sourceColumnWidths != null && (!Array.isArray(block.sourceColumnWidths) || block.sourceColumnWidths.length !== block.columnCount || block.sourceColumnWidths.some(function (n) { return typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 100; }) || Math.abs(block.sourceColumnWidths.reduce(function (sum,n) { return sum+n; },0)-100) > .01)) fail('table.sourceColumnWidths');
    if (!Array.isArray(block.rows) || !block.rows.length || block.rows.length > 10000) fail('table.rows');
    if (block.headerRowCount != null) integer(block.headerRowCount,1,block.rows.length-1,'table.headerRowCount');
    var occupied = block.rows.map(function () { return new Array(block.columnCount).fill(false); });
    block.rows.forEach(function (row, ri) {
      if (!row || !Array.isArray(row.cells)) fail('row.cells');
      var cursor = 0;
      row.cells.forEach(function (cell) {
        if (!cell) fail('cell');
        if (cell.rowIndex != null && cell.rowIndex !== ri) fail('cell.rowIndex order');
        while (occupied[ri][cursor]) cursor++;
        integer(cell.columnIndex, 0, block.columnCount - 1, 'cell.columnIndex');
        if (cell.columnIndex !== cursor) fail('cell.columnIndex order or missing cell');
        var rows = cell.rowSpan == null ? 1 : integer(cell.rowSpan, 1, block.rows.length, 'cell.rowSpan');
        var cols = cell.colSpan == null ? 1 : integer(cell.colSpan, 1, block.columnCount, 'cell.colSpan');
        if (ri + rows > block.rows.length || cursor + cols > block.columnCount) fail('cell span exceeds table');
        for (var r = ri; r < ri + rows; r++) for (var c = cursor; c < cursor + cols; c++) {
          if (occupied[r][c]) fail('overlapping cells');
          occupied[r][c] = true;
        }
        validateLines(cell.lines);
        if (block.headerRowCount && ((ri < block.headerRowCount && (cell.header !== true || ri + rows > block.headerRowCount)) || (ri >= block.headerRowCount && cell.header === true))) fail('table.header row boundaries');
        if (cell.sourceRangeBar === true && block.layoutRole === 'source-rank-chart' && block.headerRowCount) {
          integer(cell.sourceRangeStart,1,17,'range.start'); integer(cell.sourceRangeEnd,cell.sourceRangeStart,17,'range.end');
          if (ri !== block.headerRowCount + cell.sourceRangeStart - 1 || rows !== cell.sourceRangeEnd - cell.sourceRangeStart + 1) fail('range.row span');
        }
        validateLineGroups(cell.lineGroups, cell.lines);
        cursor += cols;
      });
      if (occupied[ri].some(function (value) { return !value; })) fail('incomplete table row');
    });
    if (block.figures != null && !Array.isArray(block.figures)) fail('table.figures');
    (block.figures || []).forEach(validateFigure);
  }
  function validateFigure(block) {
    if (!block || block.type !== 'figure') fail('figure');
    if (block.alt != null) string(block.alt, 'figure.alt');
    if (block.caption != null) string(block.caption, 'figure.caption');
    if (block.sourceRowIndices != null && (!Array.isArray(block.sourceRowIndices) || block.sourceRowIndices.some(function (n) { return !Number.isInteger(n) || n < 0; }))) fail('figure.sourceRowIndices');
  }
  function validatePage(page) {
    if (!page || page.schemaVersion !== SCHEMA) fail('schemaVersion');
    integer(page.pdfPage, 1, 100000, 'pdfPage');
    if (page.printedPage != null && typeof page.printedPage !== 'string' && !Number.isInteger(page.printedPage)) fail('printedPage');
    if (!Array.isArray(page.blocks)) fail('blocks');
    page.blocks.forEach(function (block) {
      if (!block) fail('block');
      if (block.type === 'table') validateTable(block);
      else if (block.type === 'text' || block.type === 'heading') {
        validateLines(block.lines);
        validateLineGroups(block.lineGroups, block.lines);
        if (block.type === 'heading') integer(block.level == null ? 2 : block.level, 1, 6, 'heading.level');
      } else if (block.type === 'figure') validateFigure(block);
      else fail('unsupported block type');
    });
    page.blocks.forEach(function (block) {
      if (!block.sourceTargetCellId) return;
      var parents = page.blocks.filter(function (parent) { return parent.id === block.sourceParentTableId && parent.type === 'table' && parent !== block && !parent.sourceTargetCellId; });
      if (parents.length !== 1 || parents[0].rows.reduce(function (n,row) { return n + row.cells.filter(function (cell) { return cell.id === block.sourceTargetCellId; }).length; },0) !== 1) fail('diagram.sourceTargetCellId');
    });
    ['sourceBlanks', 'generatedPractice'].forEach(function (key) {
      if (page[key] != null && !Array.isArray(page[key])) fail(key);
      (page[key] || []).forEach(function (exercise) {
        if (!exercise) fail(key + ' item');
        string(key === 'sourceBlanks' ? exercise.displayText : exercise.prompt, key + ' text');
        if (exercise.answer != null) string(exercise.answer, key + ' answer');
      });
    });
    return true;
  }

  function render(host, page, options) {
    if (!host || !host.ownerDocument || typeof host.replaceChildren !== 'function') throw new TypeError('A DOM host is required');
    validatePage(page); // Invalid replacements leave the current view intact.
    options = options || {};
    var prior = mounted.get(host);
    if (prior) prior.cleanup();
    var doc = host.ownerDocument, view = doc.defaultView || root;
    var urlAPI = view.URL || root.URL;
    var alive = true, objectURLs = [], pending = [], warnings = [], figureChildren = [];
    var figureGroups = options.figureGroups || root.HanqTextbookFigureGroups;
    var topLevelGroups = new Map(), consumedTopLevelFigures = new Set(), captionLinks = new Map();
    var associationPrefix = 'textbook-source-caption-' + (++associationSequence) + '-';
    var article = node('article', null, 'textbook-semantic');
    article.setAttribute('data-schema-version', SCHEMA);
    article.setAttribute('data-pdf-page', String(page.pdfPage));
    article.setAttribute('lang', 'ko');
    // Presentation is opt-in for the two fixed source hashes; this is not a readiness gate.
    var notesEdition = page.sourceSha256 === 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de' ? '81' : page.sourceSha256 === '35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442' ? '79' : null;
    var designedNotes = !!notesEdition;
    if (designedNotes) { article.classList.add('history-notes-design'); article.setAttribute('data-history-edition', notesEdition); }
    var meta = node('header', null, 'textbook-semantic-meta');
    meta.hidden = true;
    meta.appendChild(node('p', pageLabel(page), 'textbook-semantic-reference'));
    var audit = node('p', verified(page.reviewStatus) ? '원문 대조 검수 완료' : '원문 대조 검수 전 · 추출 오류가 있을 수 있어요.', 'textbook-semantic-verification');
    audit.setAttribute('data-review-status', verified(page.reviewStatus) ? 'verified' : 'unverified');
    meta.appendChild(audit);
    article.appendChild(meta);
    var content = node('div', null, 'textbook-semantic-content');
    article.appendChild(content);

    // Keep native caption blocks where they occur in the source. A verified
    // illustration can span several source figure records, but this must never
    // duplicate, drop, or move an intervening native text/table block.
    if (figureGroups) figureGroups.groupsFor(page).forEach(function (sourceGroup) {
      // Some source galleries assign a composite identity even to a single
      // intact raster. This is one illustration, not a fragmented join.
      if (sourceGroup.assetIds.length === 1 && sourceGroup.sourceCompositeGroupId && /^vertical-contiguous-fragments-of-one-source-(map|illustration)$/.test(sourceGroup.relationship || '')) {
        sourceGroup = Object.assign({}, sourceGroup, {relationship: 'one-source-illustration'});
      }
      var description = figureGroups.describe(page, sourceGroup);
      var members = description.members.filter(function (member) { return page.blocks.indexOf(member) !== -1; });
      if (!members.length) return;
      var unambiguous = description.supported && members.length === description.members.length && members.length === sourceGroup.assetIds.length && members.every(function (member) { return !topLevelGroups.has(member) && !consumedTopLevelFigures.has(member); });
      if (!unambiguous) {
        // Unsupported associations stay at their individual source positions.
        // The helper still guards each image against full-page/cover rasters.
        members.forEach(function (member) {
          if (topLevelGroups.has(member) || consumedTopLevelFigures.has(member)) return;
          var single = {assetIds: [member.assetId], relationship: 'one-source-illustration'};
          var singleDescription = figureGroups.describe(page, single);
          topLevelGroups.set(member, {source: single, description: singleDescription, members: [member], fallback: true, captionLink: null, ambiguousAsset: singleDescription.members.length !== 1 || singleDescription.members[0] !== member});
        });
        return;
      }
      var captionLink = null, caption = description.caption;
      if (caption && caption.kind === 'block') {
        var sources = page.blocks.filter(function (source) { return source.id === caption.sourceId && (source.type === 'text' || source.type === 'heading'); });
        // Partial or ambiguous text references remain untouched and unlinked.
        // Current checked block captions cover the complete source block.
        if (sources.length === 1 && caption.startLine === 0 && caption.endLineExclusive === sources[0].lines.length) {
          captionLink = captionLinks.get(sources[0]);
          if (!captionLink) {
            captionLink = {id: associationPrefix + captionLinks.size, sourceId: caption.sourceId, assetIds: []};
            captionLinks.set(sources[0], captionLink);
          }
          sourceGroup.assetIds.forEach(function (id) { if (captionLink.assetIds.indexOf(id) === -1) captionLink.assetIds.push(id); });
        }
      }
      topLevelGroups.set(members[0], {source: sourceGroup, description: description, members: members, fallback: false, captionLink: captionLink});
      members.slice(1).forEach(function (member) { consumedTopLevelFigures.add(member); });
    });

    function node(tag, text, className) {
      var element = doc.createElement(tag);
      if (text != null) element.textContent = text;
      if (className) element.className = className;
      return element;
    }
    function horizontalKeys(region) {
      region.addEventListener('keydown', function (event) {
        if (event.target !== region || event.altKey || event.ctrlKey || event.metaKey || ['ArrowLeft','ArrowRight'].indexOf(event.key) === -1) return;
        if (region.scrollWidth <= region.clientWidth) return;
        event.preventDefault(); region.scrollLeft += event.key === 'ArrowRight' ? 48 : -48;
      });
    }
    function appendLines(parent, lines, groups) {
      var activeGroup = null, groupNode = null;
      lines.forEach(function (line, index) {
        if (activeGroup && index >= activeGroup.endLineExclusive) { activeGroup = null; groupNode = null; }
        if (index) (groupNode || parent).appendChild(doc.createTextNode('\n'));
        var starts = (groups || []).find(function (group) { return group.startLine === index; });
        if (starts) {
          activeGroup = starts;
          groupNode = node('span', null, 'textbook-semantic-source-quote');
          groupNode.setAttribute('data-source-line-group', starts.kind);
          if (starts.borderStyle) groupNode.style.borderStyle = starts.borderStyle;
          if (starts.sourceShading === 'gray') groupNode.classList.add('textbook-source-inset-gray');
          parent.appendChild(groupNode);
        }
        var lineNode = node('span', null, 'textbook-semantic-line');
        line.spans.forEach(function (span) {
          // Exact native text is the default. A source-glyph display mapping may
          // be used only when the extractor provides an explicit verified audit.
          var mapped = span.renderText != null && span.mappingAudit && span.mappingAudit.verified === true;
          var text = mapped ? span.renderText : span.text;
          var audit=span.sourceStyleAudit,style=span.sourceStyle;
          var styled=!!(style&&audit&&audit.verified===true&&typeof page.sourceSha256==='string'&&/^[a-f0-9]{64}$/.test(page.sourceSha256)&&audit.sourceRevision===page.sourceSha256);
          var bold=styled&&typeof style.bold==='boolean'?style.bold:span.bold===true;
          var piece = node(bold ? 'strong' : 'span', text, bold ? 'textbook-source-bold' : null);
          if(styled){
            piece.setAttribute('data-source-style','verified');
            if(style.ink)piece.setAttribute('data-source-ink',style.ink);
            if(style.underline===true)piece.setAttribute('data-source-underline','');
            if(style.highlight==='green')piece.setAttribute('data-source-highlight','green');
          }else if(style)warnings.push('unverified_source_style');
          if (mapped) { piece.setAttribute('data-source-glyph-mapping', 'verified'); if (span.mappingAudit.sourceGlyphDescription === 'outlined-square section numeral') piece.classList.add('textbook-source-section-number'); }
          if (span.renderText != null && !mapped) warnings.push('unverified_glyph_mapping');
          lineNode.appendChild(piece);
        });
        (groupNode || parent).appendChild(lineNode);
      });
    }
    function annotateBlock(element, block) {
      if (typeof block.id === 'string') element.setAttribute('data-source-block', block.id);
      if (block.reviewStatus != null) {
        element.setAttribute('data-block-review-status', verified(block.reviewStatus) ? 'verified' : 'unverified');
        if (options.compactReviewStatus === true) return;
        var flag = node('p', verified(block.reviewStatus) ? '이 구간은 원문 대조 검수 완료' : '이 구간은 원문 대조 검수 전이에요.', 'textbook-semantic-block-warning');
        flag.setAttribute('data-review-status', verified(block.reviewStatus) ? 'verified' : 'unverified');
        flag.hidden = true;
        content.appendChild(flag);
      }
    }
    function trackFigureChild(child) {
      figureChildren.push(child);
      pending.push(child.ready.then(function (result) {
        if (alive && result && Array.isArray(result.warnings)) result.warnings.forEach(function (warning) { warnings.push(warning); });
        return result;
      }));
    }
    function groupedFigure(entry) {
      var frame = node('div', null, 'textbook-semantic-figure-container');
      frame.setAttribute('data-source-figure-blocks', entry.members.map(function (member) { return member.id; }).join(' '));
      if (entry.fallback) {
        var notice = node('p', '그림의 연결 관계를 확인하지 못해 원문 순서대로 따로 표시해요.', 'textbook-semantic-figure-context');
        notice.setAttribute('data-top-level-group-fallback', ''); frame.appendChild(notice);
      }
      if (entry.ambiguousAsset) {
        frame.appendChild(node('p', '원문 그림의 식별 정보가 겹쳐 이미지를 표시하지 못했어요.', 'textbook-semantic-figure-status'));
        warnings.push('ambiguous_figure_asset');
        entry.members.forEach(function (member) { if (typeof member.caption === 'string') frame.appendChild(node('p', member.caption)); });
        return frame;
      }
      var picture = node('div'); frame.appendChild(picture);
      // The helper owns atomic availability, failure, and late-result cleanup.
      // Referenced captions are already rendered as native text exactly once.
      var child = figureGroups.render(picture, page, entry.source, {resolveFigure: options.resolveFigure, isFigureAvailable: options.isFigureAvailable, renderCaption: !entry.description.caption});
      if (entry.captionLink) {
        child.element.setAttribute('aria-describedby', entry.captionLink.id);
        child.element.setAttribute('data-source-caption', entry.captionLink.sourceId);
        child.element.setAttribute('data-caption-placement', 'source-order');
      }
      trackFigureChild(child);
      return frame;
    }
    function sourceTimeline(block) {
      var region = node('section', null, 'textbook-source-timeline-scroll');
      region.setAttribute('role', 'region'); region.setAttribute('aria-label', '원문 연표 · 사건 순서와 시대 경계 유지 · 좌우로 이동해 읽기'); region.tabIndex = 0;
      horizontalKeys(region);
      var canvas = node('div', null, 'textbook-source-timeline');
      var layout = block.sourceTimeline, axis = node('div', null, 'textbook-source-timeline-axis'); canvas.appendChild(axis);
      layout.bands.forEach(function (band) {
        var element = node('div', null, 'textbook-source-timeline-band');
        element.style.left = (band.start * 100) + '%'; element.style.width = ((band.end - band.start) * 100) + '%';
        element.setAttribute('data-source-band', band.start + ':' + band.end);
        if (['yellow','green','blue','peach','pink'].indexOf(band.shade) !== -1) element.classList.add('textbook-source-shading-' + band.shade);
        var label = node('div', null, 'textbook-source-timeline-band-label'); appendLines(label, band.lines); element.appendChild(label); axis.appendChild(element);
      });
      (layout.topBoundaries || []).forEach(function (boundary) { var label = node('div', null, 'textbook-source-timeline-top-boundary'); label.style.left = (boundary.position * 100) + '%'; appendLines(label, boundary.lines); axis.appendChild(label); });
      if (layout.topBoundaries) canvas.classList.add('textbook-source-timeline-has-top-boundaries');
      var events = node('ol', null, 'textbook-source-timeline-events'); axis.appendChild(events);
      var height = 0;
      layout.events.forEach(function (event) {
        var item = node('li', null, 'textbook-source-timeline-event'); item.style.left = (event.position * 100) + '%';
        item.setAttribute('data-source-position', String(event.position)); appendLines(item, event.lines); events.appendChild(item); height = Math.max(height, event.lines.length * 31);
      });
      axis.style.height = (100 + height + (layout.boundaries ? 95 : 0)) + 'px';
      (layout.boundaries || []).forEach(function (boundary) { var item = node('div', null, 'textbook-source-timeline-boundary'); item.style.left = (boundary.position * 100) + '%'; item.style.top = (95 + height) + 'px'; appendLines(item, boundary.lines); axis.appendChild(item); });
      var hint = node('p', '원문 연표 · 좌우로 이동해 읽기', 'textbook-source-diagram-hint'); region.appendChild(hint); region.appendChild(canvas); return region;
    }
    // Only a source-verified, single-row association can reflow a detached
    // annotation. Explicit cell targets retain precedence. Invalid/ambiguous
    // links stay in source order rather than being guessed or discarded.
    var rowAttachments = new Map(), attachedRows = new Set();
    page.blocks.forEach(function (child) {
      if (child.sourceTargetCellId || !child.sourceParentTableId || ['text','table'].indexOf(child.type) === -1) return;
      var audit = child.transcriptionAudit, indices = child.sourceRowIndices;
      if (!audit || audit.sourceVerified !== true || audit.sourceSha256 !== page.sourceSha256 || !/^[a-f0-9]{64}$/.test(page.sourceSha256 || '') || audit.sourcePdfPage !== page.pdfPage) return;
      if (!Array.isArray(indices) || indices.length !== 1 || !Number.isInteger(indices[0])) return;
      var parents = page.blocks.filter(function (parent) { return parent.id === child.sourceParentTableId && parent.type === 'table'; });
      if (parents.length !== 1 || parents[0] === child || parents[0].sourceParentTableId) return;
      var row = parents[0].rows[indices[0]];
      if (!row || !row.cells.length || indices[0] < 0 || child.sourceParentTableId === child.id) return;
      // A content cell must be physically present in this source row; do not
      // attach to a spanning cell whose relationship would be ambiguous.
      var target = row.cells.slice().reverse().find(function (cell) { return cell.header !== true && (cell.rowSpan || 1) === 1; });
      if (!target || !target.id) return;
      if (parents[0].rows.reduce(function (n, sourceRow) { return n + sourceRow.cells.filter(function (cell) { return cell.id === target.id; }).length; }, 0) !== 1) return;
      var entry = {child: child, target: target.id, row: indices[0]};
      if (!rowAttachments.has(parents[0])) rowAttachments.set(parents[0], []);
      rowAttachments.get(parents[0]).push(entry); attachedRows.add(child);
    });
    // Render only a source-verified, bounded branch transcription. Unknown or
    // ambiguous metadata keeps the complete original text representation.
    function sourceBranches(block, cell) {
      var audit=block.transcriptionAudit, relations=audit&&audit.relations;
      if(typeof page.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(page.sourceSha256)||cell.sourceTree!==true||block.layoutRole!=='source-diagram'||!audit||audit.sourceVerified!==true||audit.sourceSha256!==page.sourceSha256||audit.sourcePdfPage!==page.pdfPage||!Array.isArray(relations)||relations.length>20)return null;
      if(!Array.isArray(audit.sourceImageSha256)||!audit.sourceImageSha256.length||audit.sourceImageSha256.some(function(h){return typeof h!=='string'||!/^[a-f0-9]{64}$/.test(h);}))return null;
      var tokens=[],spans=[];
      cell.lines.forEach(function(line){
        line.spans.forEach(function(span){spans.push(span);});
        line.spans.map(function(span){return span.text;}).join('').replace(/^[\s│├└─┬┼]+/,'').trim().split(/\s{2,}/).filter(Boolean).forEach(function(text){tokens.push(text);});
      });
      if(!tokens.length||tokens.length>20||new Set(tokens).size!==tokens.length||spans.some(function(span){return span.sourceRasterText!==true||(span.sourceCharIds&&span.sourceCharIds.length)||span.renderText!=null||span.sourceStyle!=null;}))return null;
      var branches=relations.filter(function(r){return r&&r.kind==='branch'&&typeof r.fromText==='string'&&Array.isArray(r.toTexts)&&r.toTexts.length>=2&&r.toTexts.length<=4&&tokens.indexOf(r.fromText)!==-1&&r.toTexts.every(function(t){return typeof t==='string'&&tokens.indexOf(t)!==-1;})&&(!r.label||tokens.indexOf(r.label)!==-1);});
      if(!branches.length)return null;
      var edges=new Map(),parents=new Map(),names=new Set(),labels=new Set(),bad=false;
      branches.forEach(function(r){
        if(edges.has(r.fromText))bad=true;edges.set(r.fromText,r);names.add(r.fromText);
        if(r.label){if(labels.has(r.label))bad=true;labels.add(r.label);}
        r.toTexts.forEach(function(t){if(t===r.fromText||parents.has(t))bad=true;parents.set(t,r.fromText);names.add(t);});
      });
      if(bad||Array.from(labels).some(function(t){return names.has(t);}))return null;
      var visiting=new Set(),visited=new Set();
      function cycle(t){if(visiting.has(t))return true;if(visited.has(t))return false;visiting.add(t);var e=edges.get(t);if(e&&e.toTexts.some(cycle))return true;visiting.delete(t);visited.add(t);return false;}
      if(Array.from(names).some(cycle))return null;
      var extras=tokens.filter(function(t){return !names.has(t)&&!labels.has(t);});
      var context=extras[0]===tokens[0]?[extras.shift()]:[];
      if(extras.length>1||extras.some(function(t){return !cell.lines.some(function(line){var parts=line.spans.map(function(s){return s.text;}).join('').trim().split(/\s{2,}/);return parts.indexOf(t)!==-1&&parts.some(function(part){return names.has(part)&&!parents.has(part);});});}))return null;
      var roots=tokens.filter(function(t){return !parents.has(t)&&!labels.has(t)&&context.indexOf(t)===-1;});
      if(!roots.length||roots.length>4)return null;
      var graph=node('div',null,'textbook-source-branch-graph');graph.setAttribute('role','group');graph.setAttribute('aria-label','원문 분기 관계');
      if(context.length)graph.appendChild(node('p',context[0],'textbook-source-branch-context'));
      function word(text){var bold=spans.some(function(span){return span.bold===true&&span.text.indexOf(text)!==-1;});return node(bold?'strong':'span',text,'textbook-source-branch-label textbook-semantic-line');}
      function list(items){
        var ul=node('ul',null,'textbook-source-branch-list');ul.style.setProperty('--source-branch-count',String(items.length));
        items.forEach(function(text){var li=node('li');li.setAttribute('data-source-branch-node',text);li.appendChild(word(text));var edge=edges.get(text);if(edge){if(edge.label)li.appendChild(node('p',edge.label,'textbook-source-branch-cause'));li.appendChild(list(edge.toTexts));}ul.appendChild(li);});return ul;
      }
      graph.appendChild(list(roots));return graph;
    }
    function table(block) {
      if (block.sourceTimeline) return sourceTimeline(block);
      var group = node('section', null, 'textbook-semantic-table-group');
      var scroll = node('div', null, 'textbook-semantic-table-scroll');
      scroll.setAttribute('tabindex', '0');
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', '원문 표 · 열 순서 유지 · 좌우로 이동해 읽기');
      horizontalKeys(scroll);
      var tableNode = node('table', null, 'textbook-semantic-table');
      // Reflow only an unambiguous header/body pair. Merged cells, diagrams,
      // illustrated tables and comparison matrices keep their original topology.
      var labelContent = designedNotes && !block.layoutRole && !block.headerRowCount && block.columnCount === 2 && block.rows.every(function (row) {
        return row.cells.length === 2 && row.cells.every(function (cell, index) {
          return cell.columnIndex === index && (cell.rowSpan || 1) === 1 && (cell.colSpan || 1) === 1 && !cell.sourceBypass && !cell.sourceTree && !cell.sourceRangeBar && !cell.sourceIllustrationCell && cell.header === (index === 0);
        });
      });
      if (labelContent) { tableNode.setAttribute('data-history-label-content', ''); scroll.setAttribute('aria-label', '학습노트 표 · 항목과 해당 본문'); }
      var branchTable=block.columnCount===2&&block.rows.every(function(row){return row.cells.length===2&&row.cells.every(function(cell){return (cell.rowSpan||1)===1&&(cell.colSpan||1)===1;});})&&block.rows.some(function(row){return row.cells.some(function(cell){return !!sourceBranches(block,cell);});});
      if(branchTable){
        tableNode.classList.add('textbook-source-branch-table');var branchColumns=node('colgroup');[24,76].forEach(function(width){var col=node('col');col.style.width=width+'%';branchColumns.appendChild(col);});tableNode.appendChild(branchColumns);
      }
      if (block.layoutRole === 'source-illustrated-table') tableNode.classList.add('textbook-source-illustrated-table');
      if (block.layoutRole === 'source-illustration-gallery') tableNode.classList.add('textbook-source-gallery');
      if (block.layoutRole === 'source-rank-chart') {
        tableNode.classList.add('textbook-source-rank-chart');
        if (Array.isArray(block.sourceHeaderGroups)) { var rankCaption=node('caption',block.sourceHeaderGroups.join(' · ')); tableNode.appendChild(rankCaption); }
        tableNode.addEventListener('copy',function(event){
          var selection=doc.defaultView.getSelection();
          if(!alive||!event.clipboardData||!selection||!selection.rangeCount)return;
          var selected=selection.getRangeAt(0).cloneContents();
          if(selected.querySelectorAll('td,th').length<2)return;
          var matrix=block.rows.map(function(){return new Array(block.columnCount).fill('');});
          block.rows.forEach(function(row,ri){row.cells.forEach(function(cell){
            var text=cell.sourceRangeBar?cell.sourceRangeLabel:cell.lines.map(function(line){return line.spans.map(function(span){return span.renderText==null?span.text:span.renderText;}).join('');}).join(' ');
            for(var dy=0;dy<(cell.rowSpan||1);dy++)for(var dx=0;dx<(cell.colSpan||1);dx++)matrix[ri+dy][cell.columnIndex+dx]=text;
          });});
          var copied=node('table'),head=node('thead'),body=node('tbody');
          if(Array.isArray(block.sourceHeaderGroups))copied.appendChild(node('caption',block.sourceHeaderGroups.join(' · ')));
          matrix.forEach(function(row,ri){var tr=node('tr');row.forEach(function(value){var cell=node(ri===0?'th':'td',value);if(ri===0)cell.setAttribute('scope','col');tr.appendChild(cell);});(ri===0?head:body).appendChild(tr);});copied.appendChild(head);copied.appendChild(body);
          event.clipboardData.setData('text/plain',matrix.map(function(row){return row.map(function(v){return v.replace(/[\t\r\n]+/g,' ');}).join('\t');}).join('\n'));
          event.clipboardData.setData('text/html',copied.outerHTML);event.preventDefault();
        });

        if (block.sourceColumnWidths) {
          var rankColumns = node('colgroup'); block.sourceColumnWidths.forEach(function (width) { var col=node('col');col.style.width=width+'%';rankColumns.appendChild(col); }); tableNode.appendChild(rankColumns);
        }
      }
      if (/^source-(?:diagram|timeline|rank-chart|ruler-sequence)$/.test(block.layoutRole || '')) { tableNode.classList.add('textbook-source-diagram'); tableNode.setAttribute('data-source-diagram', block.layoutRole); }
      // A label/content table reflows in place on mobile. Only genuinely
      // multi-column tables need a wider scrolling surface.
      tableNode.style.minWidth = block.layoutRole === 'source-illustrated-table' ? '760px' : block.layoutRole === 'source-illustration-gallery' ? block.columnCount * 240 + 'px' : block.layoutRole === 'source-rank-chart' ? '560px' : block.layoutRole === 'source-ruler-sequence' ? block.columnCount * 130 + 'px' : block.columnCount <= 2 ? '0' : block.columnCount * 190 + 'px';
      if (block.layoutRole === 'source-illustrated-table') {
        var illustratedColumns = node('colgroup');
        for (var ci = 0; ci < block.columnCount; ci++) {
          var illustratedColumn = node('col');
          illustratedColumn.style.width = block.sourceColumnWidths ? block.sourceColumnWidths[ci] + '%' : ci === 0 ? '16%' : ci === block.sourceIllustrationColumn ? '30%' : (54 / (block.columnCount - 2)) + '%';
          illustratedColumns.appendChild(illustratedColumn);
        }
        tableNode.appendChild(illustratedColumns);
      }
      if (block.columnCount <= 2) {
        tableNode.style.tableLayout = 'fixed';
        if (block.columnCount === 2 && block.layoutRole !== 'source-illustration-gallery' && !/^source-(?:diagram|timeline|rank-chart|ruler-sequence)$/.test(block.layoutRole || '')) {
          var columns = node('colgroup'), labelColumn = node('col'), contentColumn = node('col');
          // An example question followed only by an empty printed response is
          // not a short label / long content pair. Keep every source character,
          // but give the prompt enough room instead of enlarging empty space.
          var emptyResponse = block.rows.length > 0 && block.rows.every(function (row) {
            if (row.cells.length !== 2) return false;
            var left=row.cells[0],right=row.cells[1];
            if (left.columnIndex!==0 || right.columnIndex!==1 || (left.colSpan||1)!==1 || (right.colSpan||1)!==1 || (left.rowSpan||1)!==1 || (right.rowSpan||1)!==1) return false;
            var text=function(cell){return cell.lines.map(function(line){return line.spans.map(function(span){return span.text;}).join('');}).join('\n');};
            return !!text(left).trim() && /^\(\s+\)$/.test(text(right));
          });
          var widths=block.sourceColumnWidths || (emptyResponse ? [76,24] : [24,76]);
          if(emptyResponse)tableNode.setAttribute('data-source-empty-response','');
          labelColumn.style.width = widths[0]+'%'; contentColumn.style.width = widths[1]+'%';
          columns.appendChild(labelColumn); columns.appendChild(contentColumn); tableNode.appendChild(columns);
        }
      }
      if (typeof block.caption === 'string') tableNode.appendChild(node('caption', block.caption));
      var body = node('tbody'), head = block.headerRowCount ? node('thead') : null;
      block.rows.forEach(function (row, ri) {
        var tr = node('tr');
        tr.setAttribute('data-source-row', String(ri));
        row.cells.forEach(function (cell) {
          var td = node(cell.header === true ? 'th' : 'td');
          td.setAttribute('data-source-column', String(cell.columnIndex));
          if (cell.rowSpan > 1) td.setAttribute('rowspan', String(cell.rowSpan));
          if (cell.colSpan > 1) td.setAttribute('colspan', String(cell.colSpan));
          if (cell.header === true && ['row', 'col', 'rowgroup', 'colgroup'].indexOf(cell.scope) !== -1) td.setAttribute('scope', cell.scope);
          else if (head && ri < block.headerRowCount) td.setAttribute('scope', cell.colSpan > 1 ? 'colgroup' : 'col');
          if (typeof cell.id === 'string') td.setAttribute('data-source-cell', cell.id);
          if (cell.sourceIllustrationCell === true) td.classList.add('textbook-source-illustration-cell');
          if (['yellow','green','blue','peach','pink'].indexOf(cell.sourceShading) !== -1) td.classList.add('textbook-source-shading-' + cell.sourceShading);
          if (cell.sourceTree === true) td.classList.add('textbook-source-tree');
          if (['down','up'].indexOf(cell.sourceBypass) !== -1) td.classList.add('textbook-source-bypass-' + cell.sourceBypass);
          if (cell.sourceRangeBar === true) {
            td.classList.add('textbook-source-range-bar'); if (typeof cell.sourceRangeLabel === 'string') td.setAttribute('aria-label', cell.sourceRangeLabel);
            var rangeFill=node('span',null,'textbook-source-range-fill');rangeFill.setAttribute('aria-hidden','true');td.appendChild(rangeFill);
            if (Number.isInteger(cell.sourceRangeStart)) td.setAttribute('data-range-start',String(cell.sourceRangeStart));
            if (Number.isInteger(cell.sourceRangeEnd)) td.setAttribute('data-range-end',String(cell.sourceRangeEnd));
          }
          if (block.layoutRole === 'source-rank-chart' && block.headerRowCount && ri >= block.headerRowCount && cell.columnIndex >= 2) {
            var rankStart=ri-block.headerRowCount+1, rankSpan=cell.rowSpan||1;
            td.classList.add('textbook-rank-range-cell');
            (block.sourceRankGuides||[]).forEach(function (boundary) {
              if (boundary === rankStart+rankSpan) td.classList.add('textbook-rank-boundary-end');
              if (boundary <= rankStart || boundary >= rankStart+rankSpan) return;
              var guide=node('span',null,'textbook-rank-range-guide');guide.setAttribute('aria-hidden','true');guide.style.top=((boundary-rankStart)/rankSpan*100)+'%';td.appendChild(guide);
            });
          }
          if (typeof cell.sourceTranscriptBlockId === 'string') {
            var transcript = node('div'); transcript.setAttribute('data-source-block', cell.sourceTranscriptBlockId);
            appendLines(transcript, cell.lines, cell.lineGroups); td.appendChild(transcript);
          } else {
            var branches=sourceBranches(block,cell);
            if(branches){
              td.classList.add('textbook-source-tree-graph-cell');td.appendChild(branches);
              var plain=node('details',null,'textbook-source-branch-transcript');plain.appendChild(node('summary','텍스트로 보기'));
              var original=node('div');appendLines(original,cell.lines,cell.lineGroups);plain.appendChild(original);td.appendChild(plain);
            }else appendLines(td, cell.lines, cell.lineGroups);
          }
          tr.appendChild(td);
        });
        (head && ri < block.headerRowCount ? head : body).appendChild(tr);
      });
      if (head) tableNode.appendChild(head);
      tableNode.appendChild(body);
      scroll.appendChild(tableNode);
      group.appendChild(scroll);
      if (figureGroups) {
        figureGroups.groupsFor(page, block).forEach(function (sourceGroup) {
          if (sourceGroup.assetIds.every(function (id) { return (block.figures || []).some(function (f) { return f.assetId === id && /^(?:decorative-|fragmented-cover-raster|full-page-raster)/.test(f.classification || ''); }); })) return;
          var description = figureGroups.describe(page, sourceGroup), target = null;
          if (description.targetCell) target = Array.from(tableNode.querySelectorAll('[data-source-cell]')).find(function (cell) { return cell.getAttribute('data-source-cell') === description.targetCell.id; });
          var frame = node('div', null, 'textbook-semantic-figure-container');
          var complete = !options.isFigureAvailable || description.members.every(function (f) { return options.isFigureAvailable(f, page) !== false; });
          if (!target && description.sourceRowIndices.length) frame.appendChild(node('p', '표에 포함된 원문 그림 · 원문 ' + description.sourceRowIndices.map(function (n) { return n + 1; }).join('·') + '행', 'textbook-semantic-figure-context'));
          var picture = node('div'); frame.appendChild(picture);
          var child = figureGroups.render(picture, page, sourceGroup, {resolveFigure: options.resolveFigure, isFigureAvailable: complete ? options.isFigureAvailable : function () { return false; }, renderCaption: false});
          trackFigureChild(child);
          if (target && block.layoutRole === 'source-illustration-gallery') target.insertBefore(frame, target.firstChild);
          else (target || group).appendChild(frame);
        });
      } else {
      (block.figures || []).forEach(function (sourceFigure) {
        var frame = figure(sourceFigure);
        if (sourceFigure.sourceRowIndices && sourceFigure.sourceRowIndices.length) {
          frame.setAttribute('data-source-rows', sourceFigure.sourceRowIndices.join(','));
          frame.insertBefore(node('p', '표에 포함된 원문 그림 · 원문 ' + sourceFigure.sourceRowIndices.map(function (n) { return n + 1; }).join('·') + '행', 'textbook-semantic-figure-context'), frame.firstChild);
        }
        group.appendChild(frame);
      });
      }
      (rowAttachments.get(block) || []).forEach(function (entry) {
        var target = Array.from(tableNode.querySelectorAll('[data-source-cell]')).find(function (cell) { return cell.getAttribute('data-source-cell') === entry.target; });
        if (!target) return;
        var child = entry.child, element = child.type === 'table' ? table(child) : node('div', null, 'textbook-semantic-text');
        if (child.type !== 'table') appendLines(element, child.lines, child.lineGroups);
        element.setAttribute('data-source-block', child.id);
        element.setAttribute('data-source-parent-row', String(entry.row));
        element.classList.add('textbook-semantic-row-annotation');
        target.appendChild(element);
      });
      page.blocks.filter(function (child) { return child.sourceParentTableId === block.id && child.sourceTargetCellId; }).forEach(function (child) {
        var target = Array.from(tableNode.querySelectorAll('[data-source-cell]')).find(function (cell) { return cell.getAttribute('data-source-cell') === child.sourceTargetCellId; });
        if (!target) return;
        var element = child.type === 'table' ? table(child) : node('div', null, 'textbook-semantic-text');
        if (child.type !== 'table') appendLines(element, child.lines, child.lineGroups);
        element.setAttribute('data-source-block', child.id);
        if (child.sourcePlacement === 'after') target.appendChild(element); else target.insertBefore(element, target.firstChild);
      });
      return group;
    }
    function figure(block) {
      var frame = node('figure', null, 'textbook-semantic-figure');
      var status = node('p', '원문 그림을 불러오는 중…', 'textbook-semantic-figure-status');
      status.setAttribute('role', 'status');
      frame.appendChild(status);
      if (block.caption != null) frame.appendChild(node('figcaption', block.caption));
      if (typeof options.isFigureAvailable === 'function' && options.isFigureAvailable(block, page) === false) {
        status.textContent = '원문 그림 준비 중 · 본문 텍스트를 먼저 볼 수 있어요.';
        status.setAttribute('data-figure-unavailable', '');
        return frame;
      }
      if (typeof options.resolveFigure !== 'function') {
        status.textContent = '원문 그림은 회원용 자료가 연결된 뒤 볼 수 있어요.';
        warnings.push('figure_resolver_missing');
        return frame;
      }
      pending.push(Promise.resolve().then(function () {
        if (!alive) return null;
        return options.resolveFigure(block, page);
      }).then(function (result) {
        if (!alive) return;
        if (result == null) throw new TypeError('Figure resolver returned no image');
        var source = result, mime = result && result.type;
        var isBlob = result && typeof result === 'object' && typeof result.arrayBuffer === 'function' && typeof result.size === 'number';
        if (isBlob) {
          if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(mime || '')) throw new TypeError('Only raster figure images are supported');
          if (!urlAPI || typeof urlAPI.createObjectURL !== 'function') throw new TypeError('Object URLs unavailable');
          source = urlAPI.createObjectURL(result);
          objectURLs.push(source);
        } else if (result && typeof result === 'object') source = result.url;
        if (typeof source !== 'string' || !/^(https:\/\/|blob:)/i.test(source)) throw new TypeError('Figure resolver must return an authenticated HTTPS/blob URL or raster Blob');
        var img = node('img');
        img.alt = block.alt == null ? '원문 그림 · ' + pageLabel(page) : block.alt;
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.setAttribute('referrerpolicy', 'no-referrer');
        img.addEventListener('load', function () { if (alive) status.remove(); });
        img.addEventListener('error', function () {
          if (!alive) return;
          img.remove();
          status.textContent = '원문 그림을 불러오지 못했어요.';
          warnings.push('figure_load_failed');
        });
        img.src = source;
        frame.insertBefore(img, status);
      }).catch(function () {
        if (!alive) return;
        status.textContent = '원문 그림을 불러오지 못했어요.';
        warnings.push('figure_load_failed');
      }));
      return frame;
    }
    page.blocks.forEach(function (block) {
      if (attachedRows.has(block) || consumedTopLevelFigures.has(block) || (block.type === 'figure' && /^(?:decorative-|fragmented-cover-raster|full-page-raster)/.test(block.classification || '')) || block.sourceTargetCellId) return;
      var element;
      if (block.type === 'table') element = table(block);
      else if (block.type === 'figure') element = topLevelGroups.has(block) ? groupedFigure(topLevelGroups.get(block)) : figure(block);
      else {
        element = node(block.type === 'heading' ? 'h' + (block.level || 2) : 'p', null, block.type === 'heading' ? 'textbook-semantic-heading' : 'textbook-semantic-text');
        appendLines(element, block.lines, block.lineGroups);
        var captionLink = captionLinks.get(block);
        if (captionLink) {
          element.id = captionLink.id;
          element.setAttribute('data-source-caption', captionLink.sourceId);
          element.setAttribute('data-associated-assets', captionLink.assetIds.join(' '));
          element.style.fontSize = '16px';
          element.style.lineHeight = '1.6';
        }
      }
      annotateBlock(element, block);
      content.appendChild(element);
    });

    function exercises(items, isSource) {
      if (!items || !items.length) return;
      var section = node('section', null, 'textbook-semantic-exercises');
      section.setAttribute('data-exercise-kind', isSource ? 'source-blank' : 'generated-cloze');
      section.appendChild(node('h2', isSource ? '교재 원문 빈칸' : '학습용으로 만든 빈칸'));
      section.appendChild(node('p', isSource ? '원문 빈칸과 확인된 정답만 표시해요.' : '원문과 별도로 만든 연습이에요. 확인된 정답만 펼칠 수 있어요.', 'textbook-semantic-exercise-help'));
      items.forEach(function (item) {
        var exercise = node('div', null, 'textbook-semantic-exercise');
        exercise.appendChild(node('p', isSource ? item.displayText : item.prompt, 'textbook-semantic-prompt'));
        if (item.source && Number.isInteger(item.source.pdfPage) && item.source.pdfPage > 0) exercise.appendChild(node('p', pageLabel(item.source), 'textbook-semantic-exercise-source'));
        var hasVerifiedAnswer = typeof item.answer === 'string' && item.answer.length > 0 && (isSource ? item.answerVerified === true : item.verified === true);
        if (hasVerifiedAnswer) {
          var details = node('details', null, 'textbook-semantic-answer');
          details.appendChild(node('summary', isSource ? '확인된 원문 정답 보기' : '확인된 학습용 정답 보기'));
          details.appendChild(node('p', item.answer));
          exercise.appendChild(details);
        } else exercise.appendChild(node('p', '정답 미검수 · 정답은 아직 표시하지 않아요.', 'textbook-semantic-answer-unverified'));
        section.appendChild(exercise);
      });
      article.appendChild(section);
    }
    exercises(page.sourceBlanks, true);
    exercises(page.generatedPractice, false);
    if (warnings.indexOf('unverified_glyph_mapping') !== -1) meta.appendChild(node('p', '일부 글자 변환은 검수 전이라 추출된 원문 글자로 표시해요.', 'textbook-semantic-block-warning'));
    host.replaceChildren(article);
    function cleanup() {
      if (!alive) return;
      alive = false;
      article.querySelectorAll('img').forEach(function (img) { img.removeAttribute('src'); });
      figureChildren.forEach(function (child) { child.cleanup(); }); figureChildren = [];
      objectURLs.forEach(function (url) { urlAPI.revokeObjectURL(url); });
      objectURLs = [];
      article.remove();
      if (mounted.get(host) === controller) mounted.delete(host);
    }
    var controller = {
      element: article,
      ready: Promise.all(pending).then(function () { return { cancelled: !alive, warnings: warnings.slice() }; }),
      cleanup: cleanup
    };
    mounted.set(host, controller);
    return controller;
  }
  var api = { render: render, validatePage: validatePage, pageLabel: pageLabel, schemaVersion: SCHEMA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) root.HanqTextbookSemantic = api;
})(typeof window !== 'undefined' ? window : globalThis);
