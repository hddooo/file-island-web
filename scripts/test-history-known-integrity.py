"""Protect native ID/text identity when applying source relationship repairs."""
import importlib.util,collections,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('integrity',Path(__file__).with_name('apply-history-known-integrity.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class NativeIdentityTests(unittest.TestCase):
 def pairs(self,x):return collections.Counter(m.native_pairs(x))
 def test_reflow_permitted_without_rewriting_native_text(self):
  a={'lines':[{'spans':[{'text':'AB','sourceCharIds':['a','b']}]}]};b={'cells':[{'text':'B','sourceCharIds':['b']},{'text':'A','sourceCharIds':['a']}]}
  self.assertEqual(self.pairs(a),self.pairs(b))
 def test_same_ids_with_wrong_transcription_detected(self):
  self.assertNotEqual(self.pairs({'text':'AB','sourceCharIds':['a','b']}),self.pairs({'text':'AC','sourceCharIds':['a','b']}))
 def test_duplicate_native_character_detected(self):
  a={'text':'A','sourceCharIds':['a']};self.assertNotEqual(self.pairs(a),self.pairs([a,a]))
 def test_bad_anchor_length_rejected(self):
  with self.assertRaises(AssertionError):self.pairs({'text':'AB','sourceCharIds':['a']})
if __name__=='__main__':unittest.main()
