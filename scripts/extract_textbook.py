#!/usr/bin/env python3
"""Offline, loss-auditable PDF extraction. Does not reorder or rewrite source content.

Usage: python scripts/extract_textbook.py --source ../hanq144/book.pdf --output ../hanq-private-data
The page raster and preserved PDF are authoritative. Extraction is not verified reflow.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import fitz

SCHEMA_VERSION = 'hanq-private-textbook/1'

def sha256(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def serializable(value):
    if isinstance(value, dict):
        return {k: serializable(v) for k, v in value.items()}
    if isinstance(value, (tuple, list)):
        return [serializable(v) for v in value]
    if isinstance(value, (fitz.Point, fitz.Rect, fitz.Quad)):
        return [serializable(v) for v in value]
    if isinstance(value, bytes):
        return {'sha256': hashlib.sha256(value).hexdigest(), 'bytes': len(value)}
    return value

def write_json(path, value):
    path.write_text(json.dumps(serializable(value), ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

def extract(source, output, expected_pages=144, scale=2):
    source, output = Path(source).resolve(), Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    for d in ['source', 'pages', 'renders', 'images']:
        (output / d).mkdir(exist_ok=True)
    original_hash = sha256(source)
    copied = output / 'source/original.pdf'
    if source != copied:
        shutil.copyfile(source, copied)
    if sha256(copied) != original_hash:
        raise RuntimeError('Source copy checksum mismatch')
    doc = fitz.open(copied)
    if len(doc) != expected_pages:
        raise ValueError(f'Expected {expected_pages} pages; found {len(doc)}')
    manifest = {
        'schemaVersion': SCHEMA_VERSION,
        'source': {'sha256': original_hash, 'bytes': source.stat().st_size,
                   'originalFilename': source.name, 'pageCount': len(doc), 'pdfPath': 'source/original.pdf'},
        'extraction': {'engine': 'PyMuPDF', 'version': fitz.VersionBind, 'renderScale': scale,
                       'coordinateSystem': 'PDF points, top-left origin; preserve page rotation',
                       'textOrder': 'original PDF extraction order, never semantic sort',
                       'fidelityStatus': 'source-preserved; extraction-and-semantic-order-not-human-verified',
                       'publicationAllowed': False,
                       'limitations': ['No OCR or paraphrase applied.', 'PDF text extraction order can differ from visual reading order.',
                                       'Semantic candidates are not verified rows, columns, captions or headings.',
                                       'Shading, vector symbols and emphasis remain authoritative in source renders.',
                                       'No automatic table-card reflow is safe until manual source comparison.']},
        'pages': [], 'assets': [],
    }
    image_xrefs = set()
    for index, page in enumerate(doc):
        n = index + 1
        prefix = f'page-{n:03d}'
        image_path = f'renders/{prefix}.png'
        data_path = f'pages/{prefix}.json'
        page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False, annots=True).save(output / image_path)
        raw = page.get_text('rawdict', sort=False)
        text_blocks, placements, candidates = [], [], []
        for block_index, block in enumerate(raw['blocks']):
            block_id = f'p{n:03d}-b{block_index:04d}'
            if block['type'] == 0:
                for line in block.get('lines', []):
                    for span in line['spans']:
                        span['text'] = ''.join(c['c'] for c in span['chars'])
                        span['emphasis'] = {'bold': bool(span['flags'] & 16), 'italic': bool(span['flags'] & 2)}
                text_blocks.append({'id': block_id, 'sourceOrder': block_index, **block})
                candidates.append({'id': block_id, 'type': 'text-region', 'bbox': block['bbox'],
                                   'sourceOrder': block_index, 'reviewStatus': 'unverified',
                                   'semanticRole': None, 'readingOrder': None})
            elif block['type'] == 1:
                # Retain inline image bytes as well as xref assets (some PDFs lack xrefs).
                image_bytes = block.pop('image', None)
                mask_bytes = block.pop('mask', None)
                if image_bytes:
                    digest = hashlib.sha256(image_bytes).hexdigest()
                    asset = f"images/inline-{digest}.{block.get('ext','bin')}"
                    if not (output / asset).exists():
                        (output / asset).write_bytes(image_bytes)
                    block['assetPath'] = asset
                if mask_bytes:
                    digest = hashlib.sha256(mask_bytes).hexdigest()
                    mask_path = f'images/mask-{digest}.png'
                    (output / mask_path).write_bytes(mask_bytes)
                    block['maskPath'] = mask_path
                placements.append({'id': block_id, 'sourceOrder': block_index, **block})
                candidates.append({'id': block_id, 'type': 'image-region', 'bbox': block['bbox'],
                                   'sourceOrder': block_index, 'reviewStatus': 'unverified',
                                   'captionBlockIds': None})
        refs = page.get_images(full=True)
        for ref in refs:
            image_xrefs.add(ref[0])
            if ref[1]:
                image_xrefs.add(ref[1])
        text = page.get_text('text', sort=False)
        content = {'schemaVersion': SCHEMA_VERSION, 'pdfPage': n, 'printedPage': n - 7 if n >= 8 else None,
                   'printedPageMappingBasis': 'provided structure analysis; unverified against each page label',
                   'width': page.rect.width, 'height': page.rect.height, 'rotation': page.rotation,
                   'mediaBox': list(page.mediabox), 'cropBox': list(page.cropbox),
                   'imagePath': image_path, 'text': text, 'textBlocks': text_blocks,
                   'imagePlacements': placements, 'imageReferences': refs,
                   'vectorPaths': page.get_drawings(), 'semanticCandidates': candidates,
                   'reviewStatus': 'source-preserved-extraction-unverified'}
        write_json(output / data_path, content)
        manifest['pages'].append({'pdfPage': n, 'printedPage': content['printedPage'],
                                  'width': content['width'], 'height': content['height'],
                                  'imagePath': image_path, 'dataPath': data_path,
                                  'imageSha256': sha256(output / image_path), 'dataSha256': sha256(output / data_path),
                                  'textSha256': hashlib.sha256(text.encode()).hexdigest(),
                                  'textBlockCount': len(text_blocks), 'imagePlacementCount': len(placements),
                                  'reviewStatus': content['reviewStatus']})
        if n % 12 == 0:
            print(f'Extracted {n}/{len(doc)} pages', flush=True)
    for xref in sorted(image_xrefs):
        image = doc.extract_image(xref)
        if image:
            path = f"images/xref-{xref}.{image['ext']}"
            (output / path).write_bytes(image['image'])
            manifest['assets'].append({'xref': xref, 'path': path, 'sha256': sha256(output / path),
                                       'bytes': len(image['image']), 'width': image['width'], 'height': image['height']})
    manifest['audit'] = {'allPagesRetained': len(manifest['pages']) == expected_pages,
                         'sourceCopyChecksumMatches': sha256(copied) == original_hash,
                         'pageCount': len(manifest['pages']),
                         'imageReferenceCount': sum(len(p.get_images(full=True)) for p in doc),
                         'uniqueImageXrefsIncludingMasks': len(image_xrefs),
                         'humanVerifiedPages': 0, 'verifiedReflowPages': 0}
    write_json(output / 'manifest.json', manifest)
    print(json.dumps(manifest['audit'], ensure_ascii=False), flush=True)
    return manifest

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--expected-pages', type=int, default=144)
    p.add_argument('--scale', type=float, default=2)
    args = p.parse_args()
    extract(args.source, args.output, args.expected_pages, args.scale)
