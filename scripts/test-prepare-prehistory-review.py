"""Synthetic guards; private source fidelity is checked by the opt-in CLI."""
import copy
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('prehistory', Path(__file__).with_name('prepare-prehistory-review.py'))
tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tool)


class PrehistoryPreparationTests(unittest.TestCase):
    def fixture(self):
        return dict(schemaVersion='synthetic', id='prehistory', source=dict(sha256=tool.SOURCE),
                    subtopics=[dict(id='a', title='Synthetic group', itemCount=2)],
                    items=[dict(id='synthetic-1', subtopicId='a', text='Synthetic clue', answer=dict(text='Synthetic answer')),
                           dict(id='synthetic-2', subtopicId='a', text='Synthetic order', answer=dict(text='②①'),
                                events=[dict(sourceText='① Synthetic event A'), dict(sourceText='② Synthetic event B')])])

    def test_summary_preserves_rows_order_answers_and_sequence_context(self):
        quiz = self.fixture()
        before = copy.deepcopy(quiz)
        profile = tool.summary_profile(quiz, {'a': 'Synthetic overview'})
        self.assertEqual(profile['sourceQuizVersion'], tool.quiz_version(quiz))
        self.assertEqual(profile['groups'][0]['rows'][1]['events'], ['① Synthetic event A', '② Synthetic event B'])
        self.assertEqual(profile['groups'][0]['rows'][1]['term'], '②①')
        self.assertEqual(quiz, before)

    def test_summary_requires_all_groups_and_exact_item_counts(self):
        quiz = self.fixture()
        with self.assertRaises(ValueError):
            tool.summary_profile(quiz, {})
        quiz['subtopics'][0]['itemCount'] = 1
        with self.assertRaises(ValueError):
            tool.summary_profile(quiz, {'a': 'Synthetic overview'})

    def test_empty_or_overlong_overview_is_rejected(self):
        for text in ['', ' ', 'x' * 151]:
            with self.assertRaises(ValueError):
                tool.summary_profile(self.fixture(), {'a': text})

    def test_answer_or_source_change_changes_canonical_digest(self):
        quiz = self.fixture()
        version = tool.quiz_version(quiz)
        quiz['items'][0]['answer']['text'] = 'Different answer'
        self.assertNotEqual(tool.quiz_version(quiz), version)
        with self.assertRaises(ValueError):
            tool.validate_quiz(quiz, {}, {})

    def test_native_anchors_keep_literal_spaces_and_symbols(self):
        page = dict(textBlocks=[dict(id='p014-b0000', lines=[dict(spans=[dict(chars=[{'c': c} for c in ' ① '])])])])
        chars = tool.native_chars(page)
        self.assertEqual(''.join(chars.values()), ' ① ')
        self.assertEqual(len(chars), 3)

    def test_only_the_reviewed_answer_table_separator_is_allowed(self):
        self.assertTrue(tool.anchored_text_matches(' Answer, A', 'Answer, A', answer=True))
        self.assertFalse(tool.anchored_text_matches('  Answer, A', 'Answer, A', answer=True))
        self.assertFalse(tool.anchored_text_matches(' Answer,A', 'Answer, A', answer=True))
        self.assertFalse(tool.anchored_text_matches(' Question', 'Question'))

    def test_native_ink_split_preserves_source_properties(self):
        page = {'spans': [{'text': 'ABC', 'sourceCharIds': ['a', 'b', 'c'], 'bold': True}]}
        tool.apply_native_ink(page, {'a': 0, 'b': 16711680, 'c': 16711680})
        self.assertEqual([s['text'] for s in page['spans']], ['A', 'BC'])
        self.assertTrue(all(s['bold'] for s in page['spans']))
        self.assertEqual(page['spans'][1]['sourceStyle'], {'ink': 'red'})
        self.assertEqual([a for s in page['spans'] for a in s['sourceCharIds']], ['a', 'b', 'c'])

    def test_unreviewed_ink_or_nonliteral_mapping_cannot_be_split(self):
        for colors, span in [({'a': 12345}, {'text': 'A', 'sourceCharIds': ['a']}),
                             ({'a': 0}, {'text': 'A', 'renderText': 'AA', 'sourceCharIds': ['a']})]:
            with self.assertRaises(ValueError):
                tool.apply_native_ink({'spans': [span]}, colors)


if __name__ == '__main__':
    unittest.main()
