#!/usr/bin/env python3
"""Run after extraction: python -m unittest discover -s scripts -p 'test_textbook*.py'."""
import hashlib
import json
from pathlib import Path
import unittest
import fitz
from extract_textbook import sha256, SCHEMA_VERSION

ROOT = Path(__file__).resolve().parents[2] / 'hanq-private-data'

class TextbookExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((ROOT / 'manifest.json').read_text())
        cls.doc = fitz.open(ROOT / cls.manifest['source']['pdfPath'])

    def test_source_byte_and_checksum_preservation(self):
        source = self.manifest['source']
        path = ROOT / source['pdfPath']
        self.assertEqual(path.stat().st_size, source['bytes'])
        self.assertEqual(sha256(path), source['sha256'])

    def test_all_144_pages_in_original_order(self):
        self.assertEqual(len(self.doc), 144)
        self.assertEqual([p['pdfPage'] for p in self.manifest['pages']], list(range(1, 145)))
        self.assertEqual(self.manifest['schemaVersion'], SCHEMA_VERSION)

    def test_page_assets_and_checksums(self):
        for p in self.manifest['pages']:
            with self.subTest(page=p['pdfPage']):
                self.assertEqual(sha256(ROOT / p['imagePath']), p['imageSha256'])
                self.assertEqual(sha256(ROOT / p['dataPath']), p['dataSha256'])
                self.assertTrue((ROOT / p['imagePath']).read_bytes().startswith(b'\x89PNG\r\n\x1a\n'))

    def test_text_runs_match_original_without_normalization(self):
        for i, p in enumerate(self.manifest['pages']):
            data = json.loads((ROOT / p['dataPath']).read_text())
            original = self.doc[i].get_text('rawdict', sort=False)
            expected = [b for b in original['blocks'] if b['type'] == 0]
            self.assertEqual(len(data['textBlocks']), len(expected))
            self.assertEqual(data['text'], self.doc[i].get_text('text', sort=False))
            for got, want in zip(data['textBlocks'], expected):
                for got_line, want_line in zip(got['lines'], want['lines']):
                    self.assertEqual(len(got_line['spans']), len(want_line['spans']))
                    for got_span, want_span in zip(got_line['spans'], want_line['spans']):
                        for key in ['font', 'size', 'flags', 'color', 'bbox', 'chars']:
                            self.assertEqual(got_span[key], json.loads(json.dumps(want_span[key])))
                        self.assertEqual(got_span['text'], ''.join(c['c'] for c in want_span['chars']))

    def test_images_and_vectors_have_not_been_dropped(self):
        for i, p in enumerate(self.manifest['pages']):
            data = json.loads((ROOT / p['dataPath']).read_text())
            original = self.doc[i].get_text('rawdict', sort=False)
            images = [b for b in original['blocks'] if b['type'] == 1]
            self.assertEqual(len(data['imagePlacements']), len(images))
            self.assertEqual(len(data['vectorPaths']), len(self.doc[i].get_drawings()))
            for got, want in zip(data['imagePlacements'], images):
                self.assertEqual(list(want['bbox']), got['bbox'])
                self.assertEqual(hashlib.sha256(want['image']).hexdigest(), sha256(ROOT / got['assetPath']))
            for candidate in data['semanticCandidates']:
                self.assertEqual(candidate['reviewStatus'], 'unverified')
        for asset in self.manifest['assets']:
            self.assertEqual(sha256(ROOT / asset['path']), asset['sha256'])

    def test_no_unsupported_fidelity_or_publication_claim(self):
        self.assertFalse(self.manifest['extraction']['publicationAllowed'])
        self.assertEqual(self.manifest['audit']['verifiedReflowPages'], 0)
        self.assertEqual(self.manifest['audit']['humanVerifiedPages'], 0)
        self.assertTrue(all(p['reviewStatus'] == 'source-preserved-extraction-unverified' for p in self.manifest['pages']))

    def test_printed_page_references(self):
        self.assertEqual([p['printedPage'] for p in self.manifest['pages'][:7]], [None] * 7)
        self.assertEqual([p['printedPage'] for p in self.manifest['pages'][7:]], list(range(1, 138)))

if __name__ == '__main__':
    unittest.main()
