#!/usr/bin/env python3
"""Rebuild an inactive private source revision into a new, empty directory.

Requires PyMuPDF 1.26.6 and the independently reviewed private input records.
Neither the reference dataset nor a server's active data root is modified.
"""
import argparse,hashlib,json,shutil,subprocess,sys
from pathlib import Path
import fitz
SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de'
OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'
INPUTS=['question-label-records.json','question-label-page-review.json','answer-panel-candidates.json','quiz-review-map.json','reviewed-diagram-overrides.json','reviewed-page-overrides.json','reviewed-image-classifications.json']
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for name in ['raw-root','reviews','baseline','legacy-source','output']:p.add_argument('--'+name,type=Path,required=True)
 p.add_argument('--relation-reviews',type=Path,help='Optional private, pinned correction records; output must be a fresh correction-candidates path')
 a=p.parse_args();out=a.output.resolve();scripts=Path(__file__).resolve().parent
 assert fitz.VersionBind=='1.26.6','Use the source extraction version'
 assert out.name==SHA and 'private-data' in out.parts and not out.exists(),'A new private revision directory is required'
 assert sha(a.raw_root/'source/original.pdf')==SHA and sha(a.legacy_source)==OLD
 assert json.loads((a.baseline/'manifest.json').read_text())['source']['sha256']==OLD
 for name in INPUTS:assert (a.reviews/name).is_file(),name
 out.mkdir(parents=True);(out/'raw').symlink_to(a.raw_root.resolve(),target_is_directory=True);v=out/'validation';v.mkdir()
 for name in INPUTS:shutil.copy2(a.reviews/name,v/name)
 def run(script,*args):subprocess.run([sys.executable,str(scripts/script),*map(str,args)],check=True)
 run('build-history-semantic-revision.py','--raw-root',out/'raw','--baseline',a.baseline,'--output',out/'semantic')
 run('build-history-full-quizzes.py','--raw-root',out/'raw','--question-labels',v/INPUTS[0],'--page-review',v/INPUTS[1],'--answer-panels',v/INPUTS[2],'--review-map',v/INPUTS[3],'--output',out/'semantic/quizzes')
 run('sync-history-quiz-manifest.py',out)
 run('apply-history-source-reviews.py',out,v/'reviewed-diagram-overrides.json')
 run('apply-history-reviewed-pages.py',out,v/'reviewed-page-overrides.json')
 run('review-history-vector-headings.py','--revision',out,'--baseline',a.baseline,'--legacy-source',a.legacy_source)
 run('map-history-source-glyphs.py','--revision',out,'--baseline',a.baseline,'--legacy-source',a.legacy_source)
 run('partition-history-revision.py','--revision',out,'--baseline',a.baseline,'--question-labels',v/INPUTS[0],'--image-reviews',v/'reviewed-image-classifications.json')
 run('repair-history-figure-revisions.py','--revision',out,'--baseline',a.baseline)
 run('compose-history-source-figures.py',out)
 run('prepare-history-source-alpha.py',out)
 if a.relation_reviews:
  shutil.copy2(a.relation_reviews,v/'source-relation-reviews.json')
  run('apply-history-relation-corrections.py',out,v/'source-relation-reviews.json')
 run('verify-history-semantic-coverage.py',out)
 print('Rebuilt private candidate; activation, archive API, renderer compatibility and deployment remain separate.')
if __name__=='__main__':main()
