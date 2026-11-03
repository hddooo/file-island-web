#!/usr/bin/env python3
"""Inventory original emphasis candidates privately; never certify visual fidelity.

Native glyph IDs match extract_textbook.py. Raster/vector marks are retained as
review candidates, because font flags alone cannot establish complete emphasis.
No textbook prose, answer, original pixel or annotation content is emitted.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

import fitz

SOURCE = 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
INKS = {'default', 'muted', 'red', 'green', 'blue', 'orange'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def semantic_glyphs(page, source):
    if page['sourceSha256'] != source:
        raise ValueError('Semantic page source mismatch')
    result = {}
    for span in walk(page['blocks']):
        ids = span.get('sourceCharIds')
        if not ids:
            continue
        text = span.get('text')
        if not isinstance(text, str) or len(ids) != len(text):
            raise ValueError('Native glyph anchor/text length mismatch')
        style, audit = span.get('sourceStyle', {}), span.get('sourceStyleAudit', {})
        reviewed = audit.get('verified') is True and audit.get('sourceRevision') == source
        for anchor, char in zip(ids, text):
            if anchor in result:
                raise ValueError('Duplicate semantic native glyph anchor')
            result[anchor] = dict(
                char=char,
                bold=style.get('bold', span.get('bold', False)) if reviewed else span.get('bold', False),
                reviewedInkPresent=reviewed and style.get('ink') in INKS,
            )
    return result


def page_inventory(page, number, source, semantic=None):
    raw = page.get_text('rawdict', sort=False)
    native, spans, colors = {}, [], collections.Counter()
    for bi, block in enumerate(raw['blocks']):
        if block['type'] != 0:
            continue
        for li, line in enumerate(block['lines']):
            for si, span in enumerate(line['spans']):
                text = ''.join(c['c'] for c in span['chars'])
                ids = [f'p{number:03d}-b{bi:04d}-l{li:04d}-s{si:04d}-c{ci:04d}' for ci in range(len(text))]
                color, bold = span['color'], bool(span['flags'] & 16)
                colors[f'#{color:06x}'] += len(text)
                for anchor, char in zip(ids, text):
                    native[anchor] = dict(char=char, bold=bold, color=color)
                if color != 0 or bold or span['flags'] & 2:
                    spans.append(dict(sourceCharIds=ids, bbox=list(span['bbox']),
                                      textSha256=digest(text.encode('utf-8')), characters=len(text),
                                      nativeRgb=color, nativeFontFlags=span['flags']))
    vector_hash, vector_groups, vector_count = hashlib.sha256(), {}, 0
    for index, shape in enumerate(page.get_drawings()):
        # Keep ALL vector paths, including grey/yellow cells and short strokes.
        # Assigning "highlight" or "underline" requires original-pixel review.
        record = dict(index=index, bbox=list(shape['rect']),
                      fill=shape.get('fill'), stroke=shape.get('color'),
                      width=shape.get('width'),
                      pathSha256=digest(repr(shape['items']).encode('utf-8')))
        vector_hash.update((json.dumps(record, sort_keys=True) + '\n').encode('utf-8'))
        key = json.dumps([record['fill'], record['stroke'], record['width']])
        if key not in vector_groups:
            vector_groups[key] = dict(fill=record['fill'], stroke=record['stroke'],
                                      width=record['width'], count=0, firstIndex=index,
                                      bounds=record['bbox'][:])
        group = vector_groups[key]
        group['count'] += 1
        group['lastIndex'] = index
        group['bounds'] = [min(group['bounds'][0], record['bbox'][0]),
                           min(group['bounds'][1], record['bbox'][1]),
                           max(group['bounds'][2], record['bbox'][2]),
                           max(group['bounds'][3], record['bbox'][3])]
        vector_count += 1
    rasters = [dict(sourceOrder=i, bbox=list(b['bbox']),
                    imageSha256=digest(b['image']))
               for i, b in enumerate(raw['blocks']) if b['type'] == 1]
    annotations = [dict(type=list(a.type), bbox=list(a.rect)) for a in (page.annots() or [])]
    coverage = dict(status='semantic-bundle-unavailable')
    if semantic is not None:
        if semantic['pdfPage'] != number:
            raise ValueError('Semantic page number mismatch')
        actual = semantic_glyphs(semantic, source)
        if set(actual) != set(native) or any(actual[k]['char'] != v['char'] for k, v in native.items()):
            raise ValueError('Semantic native glyph identity/coverage mismatch')
        missing_bold = [k for k, v in native.items() if v['bold'] and not actual[k]['bold']]
        unmarked_ink = [k for k, v in native.items() if v['color'] != 0 and not actual[k]['reviewedInkPresent']]
        coverage = dict(status='native-properties-compared', nativeBoldOmissions=missing_bold,
                        coloredNativeGlyphsWithoutReviewedInk=unmarked_ink,
                        inkRolePresenceOnly=True, originalPixelEqualityVerified=False)
    return dict(pdfPage=number, nativeCharacters=len(native), nativeColors=dict(colors),
                nativeEmphasisCandidates=spans,
                vectorInventory=dict(pathCount=vector_count, sequenceSha256=vector_hash.hexdigest(),
                                     styleGroups=list(vector_groups.values()),
                                     requiresOriginalPixelReview=True),
                rasterCandidates=rasters, annotationCandidates=annotations,
                semanticCoverage=coverage, humanVisualReviewComplete=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--semantic', type=Path, help='Optional complete 81st-edition semantic directory')
    args = parser.parse_args()
    # Reports contain source geometry/anchors: never write them into a public tree.
    output = args.output.resolve()
    if 'private-data' not in output.parts or output.exists():
        raise ValueError('Use a new report path inside private-data')
    source_bytes = args.source.read_bytes()
    if digest(source_bytes) != SOURCE:
        raise ValueError('Unexpected PDF SHA256')
    if fitz.VersionBind != '1.26.6':
        raise ValueError('Use PyMuPDF 1.26.6 for stable source glyph IDs')
    with fitz.open(args.source) as doc:
        if len(doc) != 147:
            raise ValueError('Expected all 147 original pages')
        pages = []
        for index, page in enumerate(doc):
            semantic = None
            if args.semantic:
                semantic = json.loads((args.semantic / f'pages/page-{index + 1:03d}.json').read_text(encoding='utf-8'))
            pages.append(page_inventory(page, index + 1, SOURCE, semantic))
    summary = dict(pdfPages=len(pages), nativeCharacters=sum(p['nativeCharacters'] for p in pages),
                   nativeEmphasisSpans=sum(len(p['nativeEmphasisCandidates']) for p in pages),
                   vectorPathsScanned=sum(p['vectorInventory']['pathCount'] for p in pages),
                   rasterCandidates=sum(len(p['rasterCandidates']) for p in pages),
                   annotationCandidates=sum(len(p['annotationCandidates']) for p in pages),
                   semanticBundleCompared=args.semantic is not None,
                   humanVisualReviewComplete=False, releaseReady=False)
    report = dict(schemaVersion='hanq-source-emphasis-inventory/1', sourceSha256=SOURCE,
                  sourceBytes=len(source_bytes), engineVersion=fitz.VersionBind, summary=summary,
                  scope='Automatic native emphasis coverage and complete vector/raster/annotation candidate inventory. '
                        'Candidates do not establish emphasis semantics or visual completeness. '
                        'Source-bound original-pixel review and accessible rendered-page verification remain required. '
                        'No glossary activation, source mutation, upload, account write or deployment.', pages=pages)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
