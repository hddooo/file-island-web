#!/usr/bin/env python3
"""Build a private, scoped 81st-edition prehistory candidate after source review.

Never activates a revision, uploads data or changes source/workspace files.
The review ledger and all output contain private material and stay outside Git.
"""
import argparse
import collections
import copy
import hashlib
import json
import shutil
from pathlib import Path

SOURCE = 'd54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
VERSION = 'f0c14516b3743764d4608ae58f4be57d14b47562d57b919b384b612fa0dd9339'
PAGES = list(range(8, 16))
INKS = {12566463: 'muted', 28835: 'blue', 16711680: 'red', 8421504: 'muted', 2661230: 'green'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(data):
    return json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def native_chars(page):
    return {f"{block['id']}-l{li:04}-s{si:04}-c{ci:04}": char['c']
            for block in page['textBlocks']
            for li, line in enumerate(block['lines'])
            for si, span in enumerate(line['spans'])
            for ci, char in enumerate(span['chars'])}


def quiz_version(quiz):
    return digest(encoded(dict(schema=quiz['schemaVersion'], source=quiz['source'], items=quiz['items'])))


def anchored_text_matches(actual, stored, answer=False):
    # The fixed answer-table anchors include its one leading ASCII separator;
    # the unchanged canonical answerNativeText omits that separator. Preserve
    # every internal glyph and space; never strip or normalize arbitrary text.
    return actual == (' ' + stored if answer else stored)


def validate_quiz(quiz, lookup, review):
    if quiz['id'] != 'prehistory' or quiz['source']['sha256'] != SOURCE:
        raise ValueError('Wrong quiz source')
    if quiz_version(quiz) != VERSION or len(quiz['items']) != 37:
        raise ValueError('Canonical quiz changed')
    if len({item['id'] for item in quiz['items']}) != 37:
        raise ValueError('Duplicate item')
    if review['quizVersion'] != VERSION or len(review['items']) != 37:
        raise ValueError('Incomplete visual question/answer review')
    for item, approved in zip(quiz['items'], review['items']):
        if approved != dict(id=item['id'], coreSha256=digest(encoded(item))):
            raise ValueError('Reviewed item mismatch')
        source = item['source']
        for page_key, ids_key, text_key in [
            ('pdfPage', 'questionCharacterIds', 'questionNativeText'),
            ('answerPdfPage', 'answerCharacterIds', 'answerNativeText')]:
            actual = ''.join(lookup[source[page_key]][anchor] for anchor in source[ids_key])
            if not anchored_text_matches(actual, source[text_key], answer=text_key == 'answerNativeText'):
                raise ValueError('Question/answer native anchor changed')
        if source['sha256'] != SOURCE or source['pdfPage'] not in (14, 15):
            raise ValueError('Wrong question page')
        if not all(item['verification'].get(k) is True for k in ('textVerified', 'answerPairVerified')):
            raise ValueError('Unverified question/answer')


def summary_profile(quiz, overviews):
    """Literal canonical rows, including sequence choices; no inferred answers."""
    groups = []
    if set(overviews) != {sub['id'] for sub in quiz['subtopics']}:
        raise ValueError('Summary group coverage')
    for sub in quiz['subtopics']:
        overview = overviews[sub['id']]
        if not isinstance(overview, str) or not overview.strip() or len(overview) > 150:
            raise ValueError('Invalid reviewed overview')
        items = [item for item in quiz['items'] if item['subtopicId'] == sub['id']]
        if len(items) != sub['itemCount']:
            raise ValueError('Canonical group count changed')
        groups.append(dict(subtopicId=sub['id'], title=sub['title'], overview=overview,
                           rows=[dict(itemId=item['id'], term=item['answer']['text'],
                                      stem=item['text'], events=[e['sourceText'] for e in item.get('events', [])])
                                 for item in items]))
    return dict(schemaVersion='hanq-source-summary/1', sourceRevision=SOURCE,
                quizId='prehistory', sourceQuizVersion=quiz_version(quiz), groups=groups)


def apply_native_ink(value, colors):
    """Split only span boundaries; preserve text, anchors, mapping and bold."""
    if isinstance(value, list):
        for child in value:
            apply_native_ink(child, colors)
    elif isinstance(value, dict):
        if 'spans' in value:
            result = []
            for span in value['spans']:
                ids = span.get('sourceCharIds')
                if not ids:
                    result.append(span)
                    continue
                if len(ids) != len(span['text']) or 'renderText' in span and len(span['renderText']) != len(ids):
                    raise ValueError('Cannot safely split source mapping')
                start = 0
                while start < len(ids):
                    color = colors[ids[start]]
                    if color != 0 and color not in INKS:
                        raise ValueError('Unreviewed native ink')
                    end = start + 1
                    while end < len(ids) and colors[ids[end]] == color:
                        end += 1
                    part = copy.deepcopy(span)
                    part['text'], part['sourceCharIds'] = span['text'][start:end], ids[start:end]
                    if 'renderText' in span:
                        part['renderText'] = span['renderText'][start:end]
                    if color:
                        part.setdefault('sourceStyle', {})['ink'] = INKS[color]
                        part['sourceStyleAudit'] = dict(verified=True, sourceRevision=SOURCE)
                    result.append(part)
                    start = end
            value['spans'] = result
        for key, child in value.items():
            if key != 'spans':
                apply_native_ink(child, colors)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('pdf', 'baseline-revision', 'review', 'output'):
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--expected-review-sha', required=True)
    args = parser.parse_args()
    import fitz
    if fitz.VersionBind != '1.26.6':
        raise ValueError('Use reviewed PyMuPDF 1.26.6')
    baseline, output = args.baseline_revision.resolve(), args.output.resolve()
    if output.exists() or 'private-data' not in output.parts or output.name != SOURCE:
        raise ValueError('New private revision directory required')
    if baseline == output or baseline in output.parents or output in baseline.parents:
        raise ValueError('Separate baseline and output')
    if digest(args.pdf.read_bytes()) != SOURCE or digest(args.review.read_bytes()) != args.expected_review_sha:
        raise ValueError('Source/review hash mismatch')
    review = json.loads(args.review.read_text())
    if review['sourceSha256'] != SOURCE or review['visuallyComparedPages'] != PAGES:
        raise ValueError('Incomplete direct source-page review')
    if review['reviewedNativeInkMap'] != {str(k): v for k, v in INKS.items()}:
        raise ValueError('Native ink review missing')
    pdf = fitz.open(args.pdf)
    if len(pdf) != 147:
        raise ValueError('Wrong PDF length')
    raw_manifest = json.loads((baseline / 'raw/manifest.json').read_text())
    manifest = json.loads((baseline / 'semantic/manifest.json').read_text())
    lookup, source_files, semantic_pages, characters, bold_characters, ink_characters = {}, {}, {}, 0, 0, 0
    for number in PAGES:
        relative = f'pages/page-{number:03}.json'
        raw_file, semantic_file = baseline / 'raw' / relative, baseline / 'semantic' / relative
        page = json.loads(raw_file.read_text())
        semantic = json.loads(semantic_file.read_text())
        if digest(semantic_file.read_bytes()) != review['semanticPageSha256'][str(number)]:
            raise ValueError('Reviewed learning page changed')
        raw_lookup = native_chars(page)
        pdf_lookup = {f'p{number:03}-b{bi:04}-l{li:04}-s{si:04}-c{ci:04}': char['c']
                      for bi, block in enumerate(pdf[number - 1].get_text('rawdict', sort=False)['blocks'])
                      if block['type'] == 0 for li, line in enumerate(block['lines'])
                      for si, span in enumerate(line['spans']) for ci, char in enumerate(span['chars'])}
        if raw_lookup != pdf_lookup or semantic['sourceSha256'] != SOURCE:
            raise ValueError('PDF/native source differs')
        lookup[number] = raw_lookup
        semantic_ids = []
        raw_bold = {f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}": bool(s['flags'] & 16)
                    for b in page['textBlocks'] for li, l in enumerate(b['lines'])
                    for si, s in enumerate(l['spans']) for ci, c in enumerate(s['chars'])}
        raw_colors = {f"{b['id']}-l{li:04}-s{si:04}-c{ci:04}": s['color']
                      for b in page['textBlocks'] for li, l in enumerate(b['lines'])
                      for si, s in enumerate(l['spans']) for ci, c in enumerate(s['chars'])}
        direct_styles = {f'p{number:03}-b{bi:04}-l{li:04}-s{si:04}-c{ci:04}': (bool(s['flags'] & 16), s['color'])
                         for bi, b in enumerate(pdf[number - 1].get_text('rawdict', sort=False)['blocks'])
                         if b['type'] == 0 for li, l in enumerate(b['lines'])
                         for si, s in enumerate(l['spans']) for ci, c in enumerate(s['chars'])}
        if direct_styles != {anchor: (raw_bold[anchor], raw_colors[anchor]) for anchor in raw_lookup}:
            raise ValueError('PDF/native emphasis differs')
        for span in walk(semantic['blocks']):
            ids = span.get('sourceCharIds')
            if not ids:
                continue
            if ''.join(raw_lookup[anchor] for anchor in ids) != span['text']:
                raise ValueError('Semantic literal text changed')
            displayed_bold = bool(span.get('sourceStyle', {}).get('bold', span.get('bold', False)))
            if any(raw_bold[anchor] != displayed_bold for anchor in ids):
                raise ValueError('Native emphasis mismatch')
            semantic_ids.extend(ids)
        if collections.Counter(semantic_ids) != collections.Counter(raw_lookup.keys()):
            raise ValueError('Missing/duplicated native glyphs')
        characters += len(raw_lookup)
        bold_characters += sum(raw_bold.values())
        ink_characters += sum(bool(color) for color in raw_colors.values())
        apply_native_ink(semantic['blocks'], raw_colors)
        semantic_pages[relative] = semantic
        source_files['raw/' + relative] = raw_file
        entry = next(p for p in raw_manifest['pages'] if p['pdfPage'] == number)
        render = baseline / 'raw' / entry['imagePath']
        if digest(render.read_bytes()) != entry['imageSha256']:
            raise ValueError('Original page raster changed')
        source_files['raw/' + entry['imagePath']] = render
    quiz_file = baseline / 'semantic/quizzes/prehistory.json'
    quiz = json.loads(quiz_file.read_text())
    validate_quiz(quiz, lookup, review)
    profile = summary_profile(quiz, review['summaryOverviews'])
    scoped = copy.deepcopy(manifest)
    scoped['pages'] = [p for p in scoped['pages'] if p['pdfPage'] in PAGES]
    scoped['quizzes'] = [q for q in scoped['quizzes'] if q['id'] == 'prehistory']
    scoped['quizCount'] = 1
    scoped['eraRanges'] = [e for e in scoped['eraRanges'] if e['id'] == 'prehistory']
    scoped['figures'] = [f for f in scoped['figures'] if int(f['id'][1:4]) in PAGES]
    scoped.pop('fourChoices', None)
    scoped['sourceSummariesByQuiz'] = dict(prehistory=profile)
    scoped['coverageSummary'] = dict(scope='prehistory-only', pdfPages=PAGES, full147PageReview=False)
    for figure in scoped['figures']:
        rel = 'assets/' + figure['id'] + '.' + figure['extension']
        asset = baseline / 'semantic' / rel
        if digest(asset.read_bytes()) != figure['sha256']:
            raise ValueError('Original figure changed')
        source_files['semantic/' + rel] = asset
    # All checks precede output creation. No previous candidate is overwritten.
    for relative, source_file in source_files.items():
        if Path(relative).is_absolute() or '..' in Path(relative).parts or baseline not in source_file.resolve().parents:
            raise ValueError('Source path escapes revision')
    output.mkdir(parents=True)
    for relative, source_file in source_files.items():
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_file, destination)
    (output / 'semantic/pages').mkdir(parents=True, exist_ok=True)
    for relative, semantic in semantic_pages.items():
        (output / 'semantic' / relative).write_bytes(encoded(semantic) + b'\n')
    (output / 'semantic/quizzes').mkdir(parents=True, exist_ok=True)
    shutil.copyfile(quiz_file, output / 'semantic/quizzes/prehistory.json')
    (output / 'semantic/manifest.json').write_bytes(encoded(scoped) + b'\n')
    (output / 'raw/manifest.json').write_bytes(encoded(raw_manifest) + b'\n')
    (output / 'raw/source').mkdir()
    shutil.copyfile(args.pdf, output / 'raw/source/original.pdf')
    report = dict(sourceSha256=SOURCE, era='prehistory', pages=PAGES, nativeCharacters=characters,
                  nativeBoldCharacters=bold_characters, nativeInkCharacters=ink_characters, quizItems=37, quizVersion=VERSION,
                  summaryGroups=len(profile['groups']), summaryRows=37, inputFilesUnchanged=True,
                  rawPagesAndQuizBytesPreserved=True, learningChange='Native ink metadata/span boundaries only; literal text, anchors, bold and topology preserved.', sourceReviewSha256=args.expected_review_sha,
                  unavailableFigures=['p009-figure-4', 'p009-figure-5', 'p009-figure-6'],
                  limitations=['Three existing held reflow figures remain source-page-only.',
                               'Source fidelity review is not independent historical fact checking.',
                               'Other eras, production API and physical iPhone not reviewed.'],
                  sourceActivated=False, productionUsable=False)
    (output / 'validation').mkdir()
    shutil.copyfile(args.review, output / 'validation/source-review.json')
    (output / 'validation/prehistory-review.json').write_bytes(encoded(report) + b'\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
