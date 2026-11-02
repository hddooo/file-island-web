"""Regression for source credit groups and one reviewed overhanging glyph."""
import importlib.util, unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('relations',Path(__file__).with_name('apply-history-relation-corrections.py'))
relations=importlib.util.module_from_spec(spec);spec.loader.exec_module(relations)

class CreditRelationTests(unittest.TestCase):
    def setUp(self):
        self.geometry=dict(columns=[0,10,20,30],top=0,headerBottom=10,bottom=30,expectedRecords=2,expectedPageGroups=1,blockId='credit',sourceColumnOverrides=[dict(characterId='overhang',sourceText='B',columnIndex=1)])
        self.runs={0:[[0,30]],10:[[0,30]],20:[[10,30]],30:[[0,30]]}
        def char(id,text,x,y):return dict(id=id,text=text,bbox=[x,y,x+1,y+1])
        self.chars=[char('h0','P',2,2),char('h1','F',12,2),char('h2','S',22,2),char('page','1',2,19),char('photo','A',18,12),char('overhang','B',20.1,12),char('source','X',24,12),char('photo2','C',12,22),char('source2','Y',22,22)]
        self.lines=lambda cs:[dict(spans=[dict(text=''.join(c['text'] for c in sorted(cs,key=lambda c:c['bbox'][0])),sourceCharIds=[c['id'] for c in sorted(cs,key=lambda c:c['bbox'][0])])])] if cs else []
    def panel(self):return relations.panel_table(dict(type='table',studySection='concept'),self.chars,self.geometry,self.runs,self.lines)
    def test_page_group_and_photo_source_ownership(self):
        table=self.panel();self.assertEqual(len(table['rows']),3)
        page,photo,source=table['rows'][1]['cells'];self.assertEqual(page['rowSpan'],2)
        self.assertEqual(photo['lines'][0]['spans'][0]['text'],'AB')
        self.assertEqual(source['lines'][0]['spans'][0]['text'],'X')
        self.assertEqual([c['columnIndex'] for c in table['rows'][2]['cells']],[1,2])
        self.assertEqual(set(relations.ids(table)),{c['id'] for c in self.chars})
    def test_unreviewed_override_text_rejected(self):
        self.geometry['sourceColumnOverrides'][0]['sourceText']='Z'
        with self.assertRaises(AssertionError):self.panel()
    def test_missing_source_border_rejected(self):
        del self.runs[20]
        with self.assertRaises(AssertionError):self.panel()

if __name__=='__main__':unittest.main()
