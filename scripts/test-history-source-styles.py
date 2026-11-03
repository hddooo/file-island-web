"""Guard the strict reviewed-style contract and unchanged character stream."""
import copy,importlib.util,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('styles',Path(__file__).with_name('apply-history-source-styles.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ReviewedStyleTests(unittest.TestCase):
 def base(self):return {'spans':[dict(text='AB',bold=False,sourceCharIds=['a','b'])]}
 def test_split_spans_and_style_preserve_all_original_character_properties(self):
  b=self.base();a={'spans':[dict(text='A',bold=False,sourceCharIds=['a'],sourceStyle=dict(ink='red'),sourceStyleAudit=dict(verified=True,sourceRevision=m.N)),dict(text='B',bold=False,sourceCharIds=['b'])]};self.assertEqual(m.normalized(a),m.normalized(b));m.validate_styles(a)
 def test_character_and_order_changes_detected(self):
  a=self.base();b=self.base();b['spans'][0]['text']='BA';self.assertNotEqual(m.normalized(a),m.normalized(b))
 def test_source_bound_blue_ink_accepted_without_text_mutation(self):
  a=self.base();b=self.base();b['spans'][0].update(sourceStyle=dict(ink='blue'),sourceStyleAudit=dict(verified=True,sourceRevision=m.N));m.validate_styles(b);self.assertEqual(m.normalized(a),m.normalized(b))
 def test_source_bound_orange_ink_preserves_raster_annotation_text(self):
  a=self.base();b=self.base();b['spans'][0].update(sourceStyle=dict(ink='orange'),sourceStyleAudit=dict(verified=True,sourceRevision=m.N));m.validate_styles(b);self.assertEqual(m.normalized(a),m.normalized(b))
 def test_unrelated_existing_style_mutation_detected(self):
  a=self.base();b=self.base();b['spans'][0]['bold']=True;self.assertNotEqual(m.normalized(a),m.normalized(b))
 def test_reviewed_yellow_preserves_character_stream(self):
  a=self.base();b=self.base();b['spans'][0].update(sourceStyle=dict(highlight='yellow'),sourceStyleAudit=dict(verified=True,sourceRevision=m.N));m.validate_styles(b);self.assertEqual(m.normalized(a),m.normalized(b))
 def test_unknown_highlight_and_missing_source_audit_rejected(self):
  for style,audit in [(dict(highlight='blue'),dict(verified=True,sourceRevision=m.N)),(dict(ink='red'),None),(dict(ink='muted'),dict(verified=True,sourceRevision='wrong')),(dict(underline=False),dict(verified=True,sourceRevision=m.N))]:
   with self.assertRaises(AssertionError):m.validate_styles(dict(sourceStyle=style,sourceStyleAudit=audit))
if __name__=='__main__':unittest.main()
