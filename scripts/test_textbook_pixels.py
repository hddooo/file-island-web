import json,unittest
from pathlib import Path
import numpy as np
from PIL import Image
from extract_textbook import sha256
ROOT=Path(__file__).resolve().parents[2]/'hanq-private-data'
class PixelPreservationTests(unittest.TestCase):
 def test_every_page_exact_outside_mask_and_original_checksums(self):
  m=json.loads((ROOT/'manifest.json').read_text())
  for p in m['pages']:
   with self.subTest(page=p['pdfPage']):
    d=json.loads((ROOT/p['dataPath']).read_text());audit=d['enhancementAudit']
    self.assertTrue(audit['pixelPreservationVerified'])
    original=np.array(Image.open(ROOT/p['imagePath']).convert('RGB'))
    enhanced=np.array(Image.open(ROOT/p['enhancedImagePath']).convert('RGB'))
    mask=np.array(Image.open(ROOT/audit['maskPath']))>0
    self.assertTrue(np.array_equal(original[~mask],enhanced[~mask]))
    self.assertEqual(sha256(ROOT/p['imagePath']),p['imageSha256'])
    self.assertEqual(audit['protectedNormalTextAndImageChangedPixels'],0)
    self.assertEqual(audit['outsideMaskChangedPixels'],0)
 def test_viewport_discards_only_exact_white_side_pixels(self):
  m=json.loads((ROOT/'manifest.json').read_text())
  for p in m['pages']:
   d=json.loads((ROOT/p['dataPath']).read_text());v=d['readingViewport']
   a=np.asarray(Image.open(ROOT/p['imagePath']).convert('RGB'));left,_,right,_=v['pixelBounds']
   self.assertTrue(v['discardedSidePixelsExactlyWhite'])
   self.assertTrue(np.all(a[:,:left]==255));self.assertTrue(np.all(a[:,right:]==255))
   self.assertEqual(v['sourceImageSha256'],sha256(ROOT/p['imagePath']))
   self.assertAlmostEqual(v['bbox'][0],left/a.shape[1]*d['width'])
   self.assertAlmostEqual(v['bbox'][2],right/a.shape[1]*d['width'])
if __name__=='__main__':unittest.main()
