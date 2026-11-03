/* Private textbook figure-only composition. No fetching, storage, page rasters,
 * or authentication decisions. Load before textbook-semantic.js integration.
 *
 * groupsFor(page, tableBlock?) returns groups in the existing figure source
 * order. Without tableBlock it covers top-level figures only. Every figure is
 * accounted for, including unsupported groups and unassociated singletons.
 * describe(page, group) returns {supported, errors, members, bbox, caption}.
 * caption contains sourceId/startLine/endLineExclusive/lines; this helper NEVER
 * removes source text. A caller moving captions must retain all other lines.
 * render(host, page, group, {resolveFigure,isFigureAvailable}) returns
 * {element,description,ready,cleanup}. ready covers resolver completion, not
 * decoded-image or browser visual verification. A loading/error notice remains
 * until actual image load. Call cleanup on navigation/logout/replacement.
 *
 * resolveFigure(figure,page) supplies a raster Blob, trusted HTTPS/blob URL, or
 * {url}. Supplied URLs belong to the caller. Only locally created blob URLs are
 * revoked here. Never pass raw JSON URLs through the resolver without auth.
 */
(function (root) {
  'use strict';
  var mounted = new WeakMap();
  var EPSILON = 0.01; // PDF extraction rounding, in original PDF points.
  var VERTICAL = /^vertical-contiguous-fragments-of-one-source-(map|illustration)$/;

  function finite(n) { return typeof n === 'number' && Number.isFinite(n); }
  function box(b) { return Array.isArray(b) && b.length === 4 && b.every(finite) && b[2] > b[0] && b[3] > b[1]; }
  function sameIds(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && new Set(a).size === a.length && a.every(function (id) { return b.indexOf(id) !== -1; });
  }
  function validLines(lines) {
    return Array.isArray(lines) && lines.every(function (line) {
      return line && Array.isArray(line.spans) && line.spans.every(function (s) { return s && typeof s.text === 'string'; });
    });
  }
  function collect(page) {
    var figures = [], cells = [], blocks = page && Array.isArray(page.blocks) ? page.blocks : [];
    blocks.forEach(function (block) {
      if (!block) return;
      if (block.type === 'figure') figures.push(block);
      if (block.type === 'table') {
        (Array.isArray(block.figures) ? block.figures : []).forEach(function (figure) { if (figure && figure.type === 'figure') figures.push(figure); });
        (Array.isArray(block.rows) ? block.rows : []).forEach(function (row) {
          (row && Array.isArray(row.cells) ? row.cells : []).forEach(function (cell) { if (cell) cells.push(cell); });
        });
      }
    });
    return { figures: figures, cells: cells, blocks: blocks };
  }
  function sourceOnlyFigure(figure, page) {
    if (!figure || figure.type !== 'figure' || typeof figure.assetId !== 'string') return false;
    if (/(?:full.?page|page.?raster|fragmented-cover|cover-raster|text-bearing-page)/i.test(figure.classification || '')) return false;
    var inventory = (Array.isArray(page.imageInventory) ? page.imageInventory : []).filter(function (item) { return item && item.assetId === figure.assetId; });
    if (inventory.some(function (item) {
      return /(?:full.?page|page.?raster|fragmented-cover|cover-raster|text-bearing-page)/i.test(item.classification || '') || (finite(item.pageAreaRatio) && item.pageAreaRatio >= 0.85);
    })) return false;
    if (box(figure.bbox) && finite(page.width) && finite(page.height) && page.width > 0 && page.height > 0) {
      if ((figure.bbox[2] - figure.bbox[0]) * (figure.bbox[3] - figure.bbox[1]) / (page.width * page.height) >= 0.85) return false;
    }
    return true;
  }
  function union(members) {
    return [Math.min.apply(null, members.map(function (f) { return f.bbox[0]; })),
      Math.min.apply(null, members.map(function (f) { return f.bbox[1]; })),
      Math.max.apply(null, members.map(function (f) { return f.bbox[2]; })),
      Math.max.apply(null, members.map(function (f) { return f.bbox[3]; }))];
  }
  function targetCellFor(data, members, bbox, rowIndices) {
    if (!bbox || !rowIndices.length || !members.length || members.some(function (f) {
      return !Array.isArray(f.sourceRowIndices) || !f.sourceRowIndices.length;
    })) return null;
    var tables = data.blocks.filter(function (b) {
      return b && b.type === 'table' && Array.isArray(b.figures) && members.every(function (f) { return b.figures.indexOf(f) !== -1; });
    });
    if (tables.length !== 1) return null;
    var cells = [];
    (tables[0].rows || []).forEach(function (row) { (row.cells || []).forEach(function (cell) { cells.push(cell); }); });
    var contentId = members[0].sourceContentCellId;
    if (contentId && members.every(function (f) { return f.sourceContentCellId === contentId && f.associationReviewStatus === 'source-render-checked'; })) {
      var panels = cells.filter(function (cell) { return cell.id === contentId && cell.sourceIllustrationCell === true && sameIds(cell.sourceFigureAssetIds, members.map(function (f) { return f.assetId; })); });
      if (panels.length === 1 && rowIndices.every(function (r) { return r >= panels[0].rowIndex && r < panels[0].rowIndex + (panels[0].rowSpan || 1); })) {
        return {id:contentId, tableId:tables[0].id, rowIndex:panels[0].rowIndex, columnIndex:panels[0].columnIndex, method:'reviewed-source-illustration-panel'};
      }
    }
    var captionId = members[0].sourceCaptionCellId;
    if (captionId && members.every(function (f) { return f.sourceCaptionCellId === captionId; })) {
      var associated = cells.filter(function (cell) { return cell.id === captionId; });
      // describe() calls this only after captionFor validates the exact verified
      // source association. Gallery envelopes are approximate, not table borders.
      if (associated.length === 1 && rowIndices.every(function (r) { return r >= associated[0].rowIndex && r < associated[0].rowIndex + (associated[0].rowSpan || 1); })) {
        return { id: captionId, tableId: tables[0].id, rowIndex: associated[0].rowIndex, columnIndex: associated[0].columnIndex, method: 'verified-source-caption-association' };
      }
    }
    var found = [];
    (tables[0].rows || []).forEach(function (row) { (row.cells || []).forEach(function (cell) {
      if (box(cell.bbox) && rowIndices.every(function (r) { return r >= cell.rowIndex && r < cell.rowIndex + (cell.rowSpan || 1); }) && cell.bbox[0] <= bbox[0] + EPSILON && cell.bbox[1] <= bbox[1] + EPSILON && cell.bbox[2] >= bbox[2] - EPSILON && cell.bbox[3] >= bbox[3] - EPSILON) found.push(cell);
    }); });
    if (found.length !== 1 || typeof found[0].id !== 'string') return null;
    return { id: found[0].id, tableId: tables[0].id, rowIndex: found[0].rowIndex, columnIndex: found[0].columnIndex, method: 'exact-source-bbox-containment' };
  }
  function captionFor(data, group, members, errors) {
    var cellId = group.captionCellId, blockId = group.captionBlockId;
    if (!cellId && members.length && members.every(function (f) { return f.sourceCaptionCellId && f.sourceCaptionCellId === members[0].sourceCaptionCellId; })) cellId = members[0].sourceCaptionCellId;
    if (!blockId && members.length && members.every(function (f) { return f.captionBlockId && f.captionBlockId === members[0].captionBlockId; })) blockId = members[0].captionBlockId;
    if (!cellId && !blockId) return null;
    if (cellId && blockId) { errors.push('ambiguous_caption_reference'); return null; }
    var id = cellId || blockId;
    var found = (cellId ? data.cells : data.blocks).filter(function (source) { return source.id === id; });
    if (found.length !== 1 || !validLines(found[0].lines)) { errors.push('invalid_caption_source'); return null; }
    var source = found[0], start = 0, end = source.lines.length;
    if (cellId) {
      var associations = (Array.isArray(source.sourceAssociations) ? source.sourceAssociations : []).filter(function (a) {
        return a && a.kind === 'source-figure-caption' && sameIds(a.assetIds, group.assetIds);
      });
      if (associations.length !== 1 || associations[0].reviewStatus !== 'verified') { errors.push('unverified_caption_association'); return null; }
      start = associations[0].startLine; end = associations[0].endLineExclusive;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > source.lines.length) { errors.push('invalid_caption_range'); return null; }
    } else if (source.role !== 'figure-caption' || source.reviewStatus !== 'verified' || !sameIds(source.associatedAssetIds, group.assetIds)) {
      errors.push('unverified_caption_association'); return null;
    }
    return { sourceId: id, kind: cellId ? 'cell' : 'block', startLine: start, endLineExclusive: end, lines: source.lines.slice(start, end) };
  }
  function describe(page, group) {
    page = page || {}; group = group || {};
    var data = collect(page), errors = [], ids = Array.isArray(group.assetIds) ? group.assetIds : [];
    if (!ids.length || ids.length > 1000 || ids.some(function (id) { return typeof id !== 'string' || !id; })) errors.push('invalid_asset_ids');
    if (new Set(ids).size !== ids.length) errors.push('duplicate_asset_ids');
    var members = data.figures.filter(function (figure) { return ids.indexOf(figure.assetId) !== -1; });
    ids.forEach(function (id) {
      var count = members.filter(function (figure) { return figure.assetId === id; }).length;
      if (count !== 1) errors.push(count ? 'ambiguous_figure_asset' : 'missing_figure_asset');
    });
    if (members.some(function (f) { return !sourceOnlyFigure(f, page); })) errors.push('not_figure_only');
    if (members.some(function (f) { return !box(f.bbox); })) errors.push('invalid_figure_bbox');
    if (!finite(page.width) || !finite(page.height) || page.width <= 0 || page.height <= 0) errors.push('invalid_page_dimensions');
    else if (members.some(function (f) { return box(f.bbox) && (f.bbox[0] < -EPSILON || f.bbox[1] < -EPSILON || f.bbox[2] > page.width + EPSILON || f.bbox[3] > page.height + EPSILON); })) errors.push('figure_outside_page');
    var bbox = members.length && members.every(function (f) { return box(f.bbox); }) ? union(members) : null;
    if (bbox && (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) >= page.width * page.height * 0.85) errors.push('not_figure_only');
    if (group.sourceBBox != null && (!box(group.sourceBBox) || !bbox || group.sourceBBox.some(function (n, i) { return Math.abs(n - bbox[i]) > EPSILON; }))) errors.push('source_bbox_mismatch');
    var caption = captionFor(data, group, members, errors);
    if (members.length > 1) {
      if (!VERTICAL.test(group.relationship || '')) errors.push('unsupported_group_relationship');
      var checked = group.reviewStatus === 'verified' || (group.reviewStatus === 'source-render-checked' && caption && members.every(function (f) {
        return f.associationReviewStatus === 'source-render-checked' && f.sourceCompositeGroupId && f.sourceCompositeGroupId === members[0].sourceCompositeGroupId;
      }));
      if (!checked) errors.push('unverified_fragment_association');
      if (bbox) {
        var ordered = members.slice().sort(function (a, b) { return a.bbox[1] - b.bbox[1]; });
        ordered.forEach(function (figure, index) {
          if (Math.abs(figure.bbox[0] - bbox[0]) > EPSILON || Math.abs(figure.bbox[2] - bbox[2]) > EPSILON) errors.push('fragment_width_mismatch');
          if (index && Math.abs(figure.bbox[1] - ordered[index - 1].bbox[3]) > EPSILON) errors.push('fragment_gap_or_overlap');
        });
      }
    } else if (group.relationship && group.relationship !== 'one-source-illustration') errors.push('unsupported_group_relationship');
    var rowIndices = Array.from(new Set(members.reduce(function (rows, f) { return rows.concat(Array.isArray(f.sourceRowIndices) ? f.sourceRowIndices.filter(function (r) { return Number.isInteger(r) && r >= 0; }) : []); }, []))).sort(function (a, b) { return a - b; });
    return { supported: errors.length === 0, errors: Array.from(new Set(errors)), members: members, bbox: bbox, caption: caption, sourceRowIndices: rowIndices, targetCell: errors.length ? null : targetCellFor(data, members, bbox, rowIndices) };
  }

  function groupsFor(page, tableBlock) {
    var source = tableBlock ? (Array.isArray(tableBlock.figures) ? tableBlock.figures : []) : collect(page).blocks.filter(function (b) { return b && b.type === 'figure'; });
    source = source.filter(function (f) { return f && f.type === 'figure'; });
    var proposals = tableBlock && Array.isArray(tableBlock.figureGroups) ? tableBlock.figureGroups.slice() : [];
    // Caption associations may exist without a separate figureGroups entry.
    if (tableBlock) (tableBlock.rows || []).forEach(function (row) { (row.cells || []).forEach(function (cell) {
      (cell.sourceAssociations || []).forEach(function (a) {
        if (a && a.kind === 'source-figure-caption' && Array.isArray(a.assetIds) && !proposals.some(function (g) { return sameIds(g.assetIds, a.assetIds); })) {
          proposals.push({ assetIds: a.assetIds.slice(), relationship: a.assetIds.length === 1 ? 'one-source-illustration' : 'unspecified-fragment-relationship', captionCellId: cell.id, sourceRowIndex: cell.rowIndex, sourceColumnIndex: cell.columnIndex, reviewStatus: a.reviewStatus });
        }
      });
    }); });
    else source.forEach(function (figure) {
      if (!figure.sourceCompositeGroupId || proposals.some(function (g) { return g.sourceCompositeGroupId === figure.sourceCompositeGroupId; })) return;
      var related = source.filter(function (f) { return f.sourceCompositeGroupId === figure.sourceCompositeGroupId; });
      proposals.push({ assetIds: related.map(function (f) { return f.assetId; }), relationship: related.length === 1 ? 'one-source-illustration' : 'vertical-contiguous-fragments-of-one-source-illustration', captionBlockId: figure.captionBlockId, sourceCompositeGroupId: figure.sourceCompositeGroupId, reviewStatus: 'source-render-checked' });
    });
    var consumed = new Set(), results = [];
    source.forEach(function (figure) {
      if (consumed.has(figure.assetId)) return;
      var candidates = proposals.filter(function (g) { return g && Array.isArray(g.assetIds) && g.assetIds.indexOf(figure.assetId) !== -1; });
      var group = candidates.length === 1 ? Object.assign({}, candidates[0]) : null;
      // Conflicting groups never swallow a source figure. Keep individual
      // placeholders/images and report the unsupported relationship instead.
      if (group && group.assetIds.some(function (id) {
        return consumed.has(id) || !source.some(function (f) { return f.assetId === id; }) || proposals.filter(function (g) { return g && Array.isArray(g.assetIds) && g.assetIds.indexOf(id) !== -1; }).length > 1;
      })) group = null;
      if (!group) group = { assetIds: [figure.assetId], relationship: candidates.length ? 'ambiguous-source-association' : 'one-source-illustration', captionBlockId: figure.captionBlockId, captionCellId: figure.sourceCaptionCellId };
      group.assetIds = group.assetIds.slice();
      if (!group.sourceRowIndices) group.sourceRowIndices = Array.from(new Set(source.filter(function (f) { return group.assetIds.indexOf(f.assetId) !== -1; }).reduce(function (rows, f) { return rows.concat(Array.isArray(f.sourceRowIndices) ? f.sourceRowIndices : []); }, []))).sort(function (a, b) { return a - b; });
      group.assetIds.forEach(function (id) { consumed.add(id); });
      results.push(group);
    });
    return results;
  }

  function render(host, page, group, options) {
    if (!host || !host.ownerDocument || typeof host.replaceChildren !== 'function') throw new TypeError('A DOM host is required');
    var description = describe(page, group), prior = mounted.get(host);
    if (prior) prior.cleanup();
    options = options || {};
    var doc = host.ownerDocument, view = doc.defaultView || root, urlAPI = view.URL || root.URL;
    var alive = true, ownedURLs = new Set(), pending = [], warnings = description.errors.slice(), imageStates = [], controller;
    function node(tag, text, className) {
      var el = doc.createElement(tag); if (text != null) el.textContent = text; if (className) el.className = className; return el;
    }
    function readable(el) { el.style.fontSize = '16px'; el.style.lineHeight = '1.6'; el.style.whiteSpace = 'pre-wrap'; el.style.overflowWrap = 'anywhere'; return el; }
    var element = node('figure', null, 'textbook-figure-group');
    element.setAttribute('data-figure-group-status', description.supported ? 'source-geometry' : 'fallback');
    element.style.margin = '0'; element.style.minWidth = '0'; element.style.maxWidth = '100%';
    element.setAttribute('data-source-assets', description.members.map(function (f) { return f.assetId; }).join(' '));
    if (group && typeof group.id === 'string') element.setAttribute('data-source-group', group.id);
    if (!description.supported) {
      var notice = readable(node('p', '그림 조각의 연결을 확인하지 못해 따로 표시해요. 원문 설명과 함께 확인해 주세요.', 'textbook-figure-group-fallback'));
      notice.setAttribute('data-group-fallback-reasons', description.errors.join(' ')); element.appendChild(notice);
    }
    var stage = node('div', null, description.supported ? 'textbook-figure-group-canvas' : 'textbook-figure-group-parts');
    if (description.supported && description.bbox) {
      var width = description.bbox[2] - description.bbox[0], height = description.bbox[3] - description.bbox[1];
      stage.style.position = 'relative'; stage.style.width = '100%'; stage.style.maxWidth = Math.max(240, width * 2) + 'px';
      stage.style.aspectRatio = width + ' / ' + height; stage.style.margin = '0 auto'; stage.style.padding = '0';
      stage.style.setProperty('--source-aspect-ratio', String(width / height));
      stage.setAttribute('data-source-bbox', description.bbox.join(','));
    }
    var atomicGroup = description.members.length > 1, groupFailed = false;
    if (atomicGroup) stage.style.visibility = 'hidden';
    element.appendChild(stage);
    var notices = node('div', null, 'textbook-figure-group-status'); notices.setAttribute('aria-live', 'polite'); element.appendChild(notices);
    function release(url) { if (ownedURLs.has(url)) { ownedURLs.delete(url); urlAPI.revokeObjectURL(url); } }
    function failure(state, code, text) {
      if (!alive) return;
      state.status.textContent = text + ' (' + state.figure.assetId + ')'; state.status.setAttribute('data-figure-state', code);
      state.part.setAttribute('data-figure-state', code); warnings.push(code);
      if (atomicGroup) {
        groupFailed = true; stage.style.visibility = 'hidden';
        imageStates.forEach(function (other) {
          if (other.img) { other.img.removeAttribute('src'); other.img.remove(); other.img = null; }
          if (other.url) { release(other.url); other.url = null; }
          if (other !== state) other.status.remove();
        });
      }
      if (state.img) { state.img.removeAttribute('src'); state.img.remove(); state.img = null; }
      if (state.url) { release(state.url); state.url = null; }
    }
    description.members.forEach(function (figure) {
      var part = node('div', null, 'textbook-figure-group-part'); part.setAttribute('data-source-asset', figure.assetId);
      part.style.margin = '0'; part.style.padding = '0'; part.style.border = '0';
      if (description.supported) {
        part.style.position = 'absolute';
        part.style.left = ((figure.bbox[0] - description.bbox[0]) / width * 100) + '%';
        part.style.top = ((figure.bbox[1] - description.bbox[1]) / height * 100) + '%';
        part.style.width = ((figure.bbox[2] - figure.bbox[0]) / width * 100) + '%';
        part.style.height = ((figure.bbox[3] - figure.bbox[1]) / height * 100) + '%';
      }
      stage.appendChild(part);
      var status = readable(node('p', '원문 그림을 불러오는 중… (' + figure.assetId + ')', 'textbook-figure-part-status'));
      status.setAttribute('data-source-asset', figure.assetId); notices.appendChild(status);
      var state = { figure: figure, part: part, status: status, img: null, url: null, loaded: false }; imageStates.push(state);
      if (groupFailed) { status.remove(); return; }
      if (!sourceOnlyFigure(figure, page)) { failure(state, 'not_figure_only', '전체 쪽이나 표지 이미지는 이 그림 보기에서 표시하지 않아요.'); return; }
      try {
        if (typeof options.isFigureAvailable === 'function' && options.isFigureAvailable(figure, page) === false) { failure(state, 'figure_unavailable', '원문 그림 준비 중 · 설명은 먼저 읽을 수 있어요.'); return; }
      } catch (_) { failure(state, 'figure_availability_failed', '원문 그림 이용 가능 여부를 확인하지 못했어요.'); return; }
      if (typeof options.resolveFigure !== 'function') { failure(state, 'figure_resolver_missing', '회원용 원문 그림이 아직 연결되지 않았어요.'); return; }
      pending.push(Promise.resolve().then(function () {
        if (alive && !groupFailed) return options.resolveFigure(figure, page);
      }).then(function (result) {
        if (!alive || groupFailed) return;
        var source = result, isBlob = result && typeof result === 'object' && typeof result.arrayBuffer === 'function' && typeof result.size === 'number';
        if (isBlob) {
          if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(result.type || '') || !urlAPI || typeof urlAPI.createObjectURL !== 'function') throw new TypeError('Raster Blob required');
          source = urlAPI.createObjectURL(result); ownedURLs.add(source); state.url = source;
        } else if (result && typeof result === 'object') source = result.url;
        if (typeof source !== 'string' || !/^(https:\/\/[^\s]+|blob:[^\s]+)$/i.test(source)) throw new TypeError('Trusted HTTPS/blob URL required');
        var img = node('img'); state.img = img;
        img.alt = typeof figure.alt === 'string' ? figure.alt : '원문 그림';
        img.setAttribute('loading', atomicGroup ? 'eager' : 'lazy'); img.setAttribute('decoding', 'async'); img.setAttribute('referrerpolicy', 'no-referrer');
        img.style.display = 'block'; img.style.width = '100%'; img.style.height = description.supported ? '100%' : 'auto';
        // WebKit needs the replaced image positioned against its resolved source
        // rectangle; otherwise percentage height can fall back to intrinsic pixels.
        if (description.supported) { img.style.position = 'absolute'; img.style.inset = '0'; }
        img.style.maxWidth = '100%'; img.style.maxHeight = 'none'; img.style.margin = '0'; img.style.padding = '0'; img.style.border = '0'; img.style.borderRadius = '0'; img.style.objectFit = 'fill';
        img.addEventListener('load', function () {
          if (!alive || groupFailed || state.img !== img) return;
          state.loaded = true;
          if (atomicGroup && imageStates.length === description.members.length && imageStates.every(function (part) { return part.loaded; })) stage.style.visibility = 'visible';
          state.status.remove(); state.part.setAttribute('data-figure-state', 'loaded');
        });
        img.addEventListener('error', function () { if (state.img === img) failure(state, 'figure_load_failed', '원문 그림 일부를 불러오지 못했어요.'); });
        part.appendChild(img); img.src = source;
      }).catch(function () { failure(state, 'figure_load_failed', '원문 그림 일부를 불러오지 못했어요.'); }));
    });
    // Keep requested missing IDs visible instead of silently omitting an asset.
    (group && Array.isArray(group.assetIds) ? group.assetIds : []).forEach(function (id) {
      if (typeof id === 'string' && !description.members.some(function (f) { return f.assetId === id; })) notices.appendChild(readable(node('p', '원문 그림 정보를 찾지 못했어요. (' + id + ')')));
    });
    if (options.renderCaption !== false && description.caption) {
      var caption = readable(node('figcaption', null, 'textbook-figure-group-caption'));
      caption.setAttribute('data-source-caption', description.caption.sourceId);
      description.caption.lines.forEach(function (line, index) {
        if (index) caption.appendChild(doc.createTextNode('\n'));
        line.spans.forEach(function (span) {
          var mapped = typeof span.renderText === 'string' && span.mappingAudit && span.mappingAudit.verified === true;
          caption.appendChild(node(span.bold === true ? 'strong' : 'span', mapped ? span.renderText : span.text));
        });
      });
      element.appendChild(caption);
    } else if (options.renderCaption !== false) description.members.forEach(function (figure) {
      if (typeof figure.caption === 'string') element.appendChild(readable(node('figcaption', figure.caption, 'textbook-figure-group-caption')));
    });
    host.replaceChildren(element);
    function cleanup() {
      if (!alive) return; alive = false;
      imageStates.forEach(function (state) { if (state.img) state.img.removeAttribute('src'); });
      Array.from(ownedURLs).forEach(release); element.remove();
      if (mounted.get(host) === controller) mounted.delete(host);
    }
    controller = { element: element, description: description, ready: Promise.all(pending).then(function () { return { cancelled: !alive, warnings: Array.from(new Set(warnings)), supported: description.supported }; }), cleanup: cleanup };
    mounted.set(host, controller); return controller;
  }
  var api = { render: render, describe: describe, groupsFor: groupsFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) root.HanqTextbookFigureGroups = api;
})(typeof window !== 'undefined' ? window : globalThis);
