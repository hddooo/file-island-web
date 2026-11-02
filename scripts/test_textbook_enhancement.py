import json
from pathlib import Path
import unittest
import fitz
from enhance_textbook import enhance_svg, USE, BLUE
from extract_textbook import sha256
ROOT=Path(__file__).resolve().parents[2]/'hanq-private-data'

class EnhancementTests(unittest.TestCase):
    def test_page9_only_glyph_fill_changes(self):
        with fitz.open(ROOT/'source/original.pdf') as doc:
            original=doc[8].get_svg_image(text_as_path=True)
            enhanced,audit=enhance_svg(doc[8],original)
            self.assertEqual(USE.sub('',original),USE.sub('',enhanced))
            self.assertGreater(audit['boldGlyphUsesRecolored'],0)
            before,after=USE.findall(original),USE.findall(enhanced)
            self.assertEqual(len(before),len(after))
            import re
            for old,new in zip(before,after):
                if old!=new:
                    self.assertIn(f'fill="{BLUE}"',new)
                    self.assertEqual(re.sub(r'\sfill="[^"]*"','',old),re.sub(r'\sfill="[^"]*"','',new))

    def test_complete_nonoverlapping_region_coverage_and_png(self):
        m=json.loads((ROOT/'manifest.json').read_text())
        for p in m['pages']:
            data=json.loads((ROOT/p['dataPath']).read_text())
            regions=data['regions']
            self.assertEqual(regions[0]['bbox'][1],0)
            self.assertEqual(regions[-1]['bbox'][3],data['height'])
            for region in regions:
                self.assertEqual(region['bbox'][0],0)
                self.assertEqual(region['bbox'][2],data['width'])
                self.assertGreater(region['bbox'][3],region['bbox'][1])
            for a,b in zip(regions,regions[1:]):
                self.assertEqual(a['bbox'][3],b['bbox'][1])
                cut=a['bbox'][3]
                for block in data['textBlocks']:
                    for line in block['lines']:
                        self.assertFalse(line['bbox'][1]<cut<line['bbox'][3])
                for image in data['imagePlacements']:
                    self.assertFalse(image['bbox'][1]<cut<image['bbox'][3])
            self.assertTrue(p['enhancedImagePath'].endswith('.png'))
            self.assertEqual(sha256(ROOT/p['enhancedImagePath']),p['enhancedImageSha256'])

class ConservativeTableRegionTests(unittest.TestCase):
    def test_no_detected_table_row_or_cell_interior_cuts_all_pages(self):
        m=json.loads((ROOT/'manifest.json').read_text())
        for p in m['pages']:
            data=json.loads((ROOT/p['dataPath']).read_text())
            cuts=[r['bbox'][3] for r in data['regions'][:-1]]
            for table in data['tableCandidates']:
                boxes=[table['bbox']] if table.get('bbox') else []
                for row in table.get('rows',[]):
                    boxes.append(row['bbox'])
                    boxes.extend(cell for cell in row.get('cells',[]) if cell)
                for box in boxes:
                    for cut in cuts:
                        with self.subTest(page=p['pdfPage'],cut=cut,bbox=box):
                            self.assertFalse(box[1] < cut < box[3])
            if not data['tableCandidates'] or any(t.get('reviewStatus')=='detection-failed' for t in data['tableCandidates']):
                self.assertEqual(len(data['regions']),1)
                self.assertEqual(data['regions'][0]['tableRowAndCellBoundaryCheck'],'not-verified')

    def test_page12_and_merged_label_regressions(self):
        for n in [12,64,65,71,72,73,84,102,139,140]:
            data=json.loads((ROOT/f'pages/page-{n:03d}.json').read_text())
            cuts=[r['bbox'][3] for r in data['regions'][:-1]]
            for table in data['tableCandidates']:
                boxes=[table['bbox']] if table.get('bbox') else []
                boxes += [row['bbox'] for row in table.get('rows',[])]
                boxes += [cell for row in table.get('rows',[]) for cell in row.get('cells',[]) if cell]
                if boxes:
                    top=min(b[1] for b in boxes);bottom=max(b[3] for b in boxes)
                    self.assertFalse(any(top<cut<bottom for cut in cuts),f'Page{n} splits a table/merged context')
            if n==12:
                self.assertFalse(any(157.5599 < cut < 751.4401 for cut in cuts))
                for old_cut in [200.0765,413.4083,582.5752]:
                    self.assertNotIn(old_cut,cuts)

if __name__=='__main__':
    unittest.main()
