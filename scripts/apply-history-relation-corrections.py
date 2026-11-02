#!/usr/bin/env python3
"""Apply pinned, privately reviewed relation corrections to a fresh candidate.

The immutable source candidate and legacy revision are never write targets.
Review records contain source geometry/anchors; no textbook prose is embedded here.
"""
import argparse, collections, copy, hashlib, importlib.util, json
from pathlib import Path
import fitz

SHA = 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def ids(v):
    if isinstance(v, dict):
        for k, x in v.items():
            if k == 'sourceCharIds': yield from x
            elif k not in ('transcriptionAudit', 'pageTranscriptionReview', 'sourceRelationReview'): yield from ids(x)
    elif isinstance(v, list):
        for x in v: yield from ids(x)

def write(p, data):
    p.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')

def horizontal_runs(page):
    bands = collections.defaultdict(list)
    for drawing in page.get_drawings():
        for item in drawing['items']:
            if item[0] == 'l' and abs(item[1].y-item[2].y) < .03 and abs(item[1].x-item[2].x) > .3:
                bands[round(item[1].y, 2)].append(sorted((item[1].x, item[2].x)))
    result = {}
    for y, segments in bands.items():
        runs = []
        for a, b in sorted(segments):
            if runs and a-runs[-1][1] <= 1.01: runs[-1][1] = max(b, runs[-1][1])
            else: runs.append([a, b])
        result[y] = runs
    return result

def panel_table(original, chars, geometry, runs, make_lines):
    x0, x1, x2, x3 = geometry['columns']
    top, header, bottom = geometry['top'], geometry['headerBottom'], geometry['bottom']
    def covered(y, a, b):
        return any(left <= a+.2 and right >= b-.2 for left, right in runs.get(y, []))
    records = sorted({header, bottom} | {y for y in runs if header < y < bottom and covered(y, x1+.12, x3-1.2)})
    # The source center border is a double rule (1.08pt), not a missing
    # page-column separator. Test inside it rather than bridging another panel.
    groups = sorted({header, bottom} | {y for y in records if covered(y, x0+1.2, x1-.12)})
    assert len(records)-1 == geometry['expectedRecords'], ('source record borders', len(records)-1)
    assert len(groups)-1 == geometry['expectedPageGroups'], ('source page groups', groups)
    bid = geometry['blockId']
    overrides = {}
    for item in geometry.get('sourceColumnOverrides', []):
        found = [c for c in chars if c['id'] == item['characterId']]
        assert len(found) == 1 and found[0]['text'] == item['sourceText']
        assert item['columnIndex'] in (0, 1, 2) and item['characterId'] not in overrides
        overrides[item['characterId']] = item['columnIndex']
    def cell(ri, ci, box, rowspan=1, head=False):
        selected = [c for c in chars if
                    (overrides[c['id']] == ci if c['id'] in overrides else box[0] <= (c['bbox'][0]+c['bbox'][2])/2 < box[2])
                    and box[1] <= (c['bbox'][1]+c['bbox'][3])/2 < box[3]]
        value = dict(id=f'{bid}-r{ri}-c{ci}', rowIndex=ri, columnIndex=ci, rowSpan=rowspan, colSpan=1, bbox=box, header=head, lines=make_lines(selected))
        if head: value.update(scope='col', sourceShading='blue')
        return value
    xs = [x0, x1, x2, x3]
    rows = [dict(cells=[cell(0, c, [xs[c],top,xs[c+1],header], head=True) for c in range(3)])]
    for j, (a, b) in enumerate(zip(records, records[1:]), 1):
        cells = []
        if a in groups:
            end = groups[groups.index(a)+1]
            span = records.index(end)-records.index(a)
            cells.append(cell(j, 0, [x0,a,x1,end], span))
        cells += [cell(j, c, [xs[c],a,xs[c+1],b]) for c in (1,2)]
        rows.append(dict(cells=cells))
    result = {k:copy.deepcopy(v) for k,v in original.items() if k not in ('rows','figures','figureGroups','id','bbox','columnCount')}
    result.update(id=bid, bbox=[x0,top,x3,bottom], columnCount=3, headerRowCount=1, rows=rows,
                  sourceRelationReview=dict(status='source-render-checked', kind='independent-source-credit-panel', sourceColumns=xs, sourceRecordBorders=records, sourcePageGroupBorders=groups))
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('candidate', type=Path)
    parser.add_argument('review', type=Path)
    args = parser.parse_args()
    root = args.candidate.resolve()
    assert root.name == SHA and 'private-data' in root.parts and 'correction-candidates' in root.parts
    review = json.loads(args.review.read_text())
    assert review['sourceSha256'] == SHA and sha(root/'raw/source/original.pdf') == SHA
    spec = importlib.util.spec_from_file_location('native_source', Path(__file__).with_name('build-history-semantic-revision.py'))
    native = importlib.util.module_from_spec(spec); spec.loader.exec_module(native)
    semantic = root/'semantic'; manifest = json.loads((semantic/'manifest.json').read_text())
    quiz_before = {p.name:sha(p) for p in (semantic/'quizzes').glob('*.json')}
    pdf = fitz.open(root/'raw/source/original.pdf'); planned = {}; report = []
    for rec in review['records']:
        n = rec['pdfPage']; path = semantic/f'pages/page-{n:03}.json'
        assert sha(path) == rec['beforePageSha256'], ('candidate page pin mismatch', n)
        raw = json.loads((root/f'raw/pages/page-{n:03}.json').read_text())
        assert sha(root/'raw'/raw['imagePath']) == rec['sourceRenderSha256']
        data = json.loads(path.read_text()); before = collections.Counter(ids(data['blocks']))
        if rec['kind'] == 'figure-cell-association':
            table = next(b for b in data['blocks'] if b['id'] == rec['tableId'])
            for pair in rec['pairs']:
                figure = next(b for b in data['blocks'] if b.get('assetId') == pair['assetId'])
                asset = next(f for f in manifest['figures'] if f['id'] == pair['assetId'])
                assert asset['sha256'] == pair['sourceImageSha256']
                target = next(c for row in table['rows'] for c in row['cells'] if c['id'] == pair['targetCellId'])
                assert list(ids(target)) == pair['captionCharacterIds']
                target.setdefault('sourceAssociations', []).append(dict(kind='source-figure-caption', startLine=0, endLineExclusive=len(target['lines']), assetIds=[pair['assetId']], reviewStatus='verified'))
                figure.update(sourceCaptionCellId=target['id'], sourceRowIndices=[target['rowIndex']], associationReviewStatus='source-render-checked')
                table.setdefault('figures', []).append(figure)
                table.setdefault('figureGroups', []).append(dict(assetIds=[pair['assetId']], relationship='one-source-illustration', captionCellId=target['id'], reviewStatus='verified'))
                data['blocks'].remove(figure)
        elif rec['kind'] == 'split-credit-panels':
            table = next(b for b in data['blocks'] if b['id'] == rec['tableId'])
            wanted = set(ids(table)); chars = [c for c in native.native_chars(raw) if c['id'] in wanted]
            runs = horizontal_runs(pdf[n-1]); replacements = [panel_table(table, chars, panel, runs, native.lines) for panel in rec['panels']]
            index = data['blocks'].index(table); data['blocks'][index:index+1] = replacements
            assert collections.Counter(ids(replacements)) == collections.Counter(wanted)
        elif rec['kind'] == 'timeline-boundary':
            block = next(b for b in data['blocks'] if b['id'] == rec['blockId'])
            boundary = block['sourceTimeline']['boundaries'][rec['boundaryIndex']]
            assert boundary['lines'] == rec['beforeLines']
            boundary['lines'] = rec['sourceCheckedLines']
        else: raise AssertionError('Unknown private correction kind')
        assert collections.Counter(ids(data['blocks'])) == before, ('native character deficit/duplicate', n)
        for key, section in [('conceptBlockIds','concept'),('examBlockIds','exam'),('sourceQuizBlockIds','source-quiz')]:
            data['studySectionPartition'][key] = [b['id'] for b in data['blocks'] if b['studySection'] == section]
        data['sourceRelationReview'] = dict(status='source-render-checked', reviewId=review['reviewId'], originalPdfSha256=SHA, sourceRenderSha256=rec['sourceRenderSha256'], sourceNativeCharacterIdsUnchanged=True)
        planned[path] = data; report.append(dict(pdfPage=n, kind=rec['kind'], beforeSha256=rec['beforePageSha256'], nativeCharacterIdsUnchanged=True))
    # Validate all source pins and plans before writing any candidate page.
    for path, data in planned.items(): write(path, data)
    for entry in manifest['pages']:
        path = semantic/f"pages/page-{entry['pdfPage']:03}.json"
        if path in planned: entry['studySectionCounts'] = {s:sum(b['studySection']==s for b in planned[path]['blocks']) for s in ('concept','exam')}
    write(semantic/'manifest.json', manifest)
    assert quiz_before == {p.name:sha(p) for p in (semantic/'quizzes').glob('*.json')}
    write(root/'validation/relation-correction-application.json', dict(sourceSha256=SHA, reviewId=review['reviewId'], pages=report, quizBytesUnchanged=True, originalPdfUnchanged=True, activated=False))
    print(json.dumps(dict(correctedPages=len(report), quizBytesUnchanged=True, originalPdfUnchanged=True, activated=False)))

if __name__ == '__main__': main()
