"""Synthetic failures for omission, wrong source and incomplete emphasis audits."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('emphasis', Path(__file__).with_name('audit-history-source-emphasis.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class Page:
    def get_text(self, *args, **kwargs):
        return {'blocks': [
            {'type': 1, 'bbox': [0, 0, 5, 5], 'image': b'synthetic-image'},
            {'type': 0, 'lines': [{'spans': [dict(chars=[{'c': 'A'}, {'c': 'B'}],
                bbox=[1, 2, 3, 4], color=0xff0000, flags=16)]}]},
        ]}

    def get_drawings(self):
        return [dict(rect=[1, 2, 3, 4], fill=(1, 1, 0), color=None, width=0, items=[('re', 'synthetic')])]

    def annots(self):
        return iter([])


class EmphasisTests(unittest.TestCase):
    def semantic(self):
        ids = [f'p001-b0001-l0000-s0000-c{i:04d}' for i in range(2)]
        span = dict(text='AB', sourceCharIds=ids, bold=True)
        return dict(pdfPage=1, sourceSha256=m.SOURCE, blocks=[dict(lines=[dict(spans=[span])])])

    def audit(self, semantic=None):
        return m.page_inventory(Page(), 1, m.SOURCE, semantic)

    def test_all_candidate_types_and_original_extractor_anchor_order(self):
        p = self.audit()
        self.assertEqual(p['nativeEmphasisCandidates'][0]['sourceCharIds'][0], 'p001-b0001-l0000-s0000-c0000')
        self.assertEqual(p['vectorInventory']['pathCount'], 1)
        self.assertEqual(p['vectorInventory']['styleGroups'][0]['fill'], (1, 1, 0))
        self.assertTrue(p['vectorInventory']['requiresOriginalPixelReview'])
        self.assertEqual(len(p['rasterCandidates']), 1)
        self.assertEqual(p['semanticCoverage']['status'], 'semantic-bundle-unavailable')
        self.assertFalse(p['humanVisualReviewComplete'])
        self.assertNotIn('"text":', json.dumps(p))
        self.assertNotIn('synthetic-image', json.dumps(p))

    def test_native_bold_and_colored_ink_omissions_are_reported(self):
        s = self.semantic()
        s['blocks'][0]['lines'][0]['spans'][0]['bold'] = False
        c = self.audit(s)['semanticCoverage']
        self.assertEqual(len(c['nativeBoldOmissions']), 2)
        self.assertEqual(len(c['coloredNativeGlyphsWithoutReviewedInk']), 2)

    def test_only_source_bound_reviewed_ink_counts_as_marked(self):
        s = self.semantic()
        span = s['blocks'][0]['lines'][0]['spans'][0]
        span['sourceStyle'] = dict(ink='red')
        for audit in [{}, dict(verified=True, sourceRevision='wrong'), dict(verified=False, sourceRevision=m.SOURCE)]:
            span['sourceStyleAudit'] = audit
            self.assertEqual(len(self.audit(s)['semanticCoverage']['coloredNativeGlyphsWithoutReviewedInk']), 2)
        span['sourceStyleAudit'] = dict(verified=True, sourceRevision=m.SOURCE)
        c = self.audit(s)['semanticCoverage']
        self.assertEqual(c['coloredNativeGlyphsWithoutReviewedInk'], [])
        self.assertFalse(c['originalPixelEqualityVerified'])

    def test_wrong_source_missing_duplicate_and_rewritten_native_text_fail(self):
        base = self.semantic()
        for kind in ['source', 'missing', 'duplicate', 'text', 'page']:
            s = copy.deepcopy(base)
            spans = s['blocks'][0]['lines'][0]['spans']
            if kind == 'source': s['sourceSha256'] = 'wrong'
            if kind == 'missing': spans.clear()
            if kind == 'duplicate': spans.append(copy.deepcopy(spans[0]))
            if kind == 'text': spans[0]['text'] = 'AC'
            if kind == 'page': s['pdfPage'] = 2
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                self.audit(s)


if __name__ == '__main__':
    unittest.main()
