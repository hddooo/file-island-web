#!/usr/bin/env python3
"""Build display-only, original-version-bound CBT reviews. Never writes the exam pool or API data."""
import argparse, hashlib, json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--allow-incomplete', action='store_true', help='Local editorial previews only; release requires all 500 audit records.')
args = parser.parse_args()
source = (ROOT/'media/exam-pool.js').read_text()
pool = json.loads(source.split('window.HANQ_EXAM_POOL=', 1)[1].strip().removesuffix(';'))
items, coverage = {}, []
for round_ in range(70, 80):
    manuscript = ROOT/f'docs/cbt-explanations/round-{round_}.json'
    if not manuscript.exists() and args.allow_incomplete: manuscript = ROOT/f'docs/exam-reviews/round-{round_}.json'
    doc = json.loads(manuscript.read_text())
    ap = ROOT/f'docs/cbt-explanation-audits/round-{round_}.json'
    audit = json.loads(ap.read_text()) if ap.exists() else {'items': {}}
    if set(doc['items']) != {f'{n:02}' for n in range(1, 51)}:
        raise SystemExit(f'{round_}: expected exactly 50 manuscripts')
    row = {'round': round_, 'verified': [], 'blocked': [], 'pending': []}
    for n in range(1, 51):
        key, id_ = f'{n:02}', f'exam-{round_}-{n:02}'
        old, draft = pool['questions'][id_], doc['items'][key]
        proof = audit.get('items', {}).get(key)
        status = proof.get('status') if proof else 'pending'
        if status not in ('verified','blocked'): status = 'pending'
        row[status].append(n)
        if len(draft.get('o', [])) != 5: raise SystemExit(f'{id_}: needs all five option explanations')
        if bool(draft.get('neg')) != old['negative']: raise SystemExit(f'{id_}: negative question semantics changed')
        if status != 'verified': continue
        # Audit records refer to the source crop actually inspected. Some legacy
        # runtime images use a different crop; their bytes remain frozen in the pool.
        source_image_hash = (old.get('source') or {}).get('imageSha256') or old['imageSha256']
        if proof.get('originalImageViewed') is not True or proof.get('originalImageSha256') != source_image_hash:
            raise SystemExit(f'{id_}: original-image proof missing/mismatched')
        if proof.get('blockers') or not proof.get('sourceChecks'): raise SystemExit(f'{id_}: verified without complete evidence')
        def lines(value):
            out = value if isinstance(value, list) else [value]
            if not out or not all(isinstance(x,str) and x.strip() for x in out): raise SystemExit(f'{id_}: empty explanation')
            return out
        overview = dict(old['overview'])
        for a,b in [('why','reason'),('clue','clue'),('ctx','context'),('mem','memory'),('cmp','contrast')]: overview[b] = lines(draft[a])
        overview['answer'] = '①②③④⑤'[old['answer']-1] + ' ' + draft['a']
        overview['ask'] = draft.get('ask') or old['overview'].get('ask')
        options = [dict(o, review=lines(draft['o'][i])) for i,o in enumerate(old['options'])]
        refs = [{'label':f'한국사능력검정시험 제{round_}회 {n}번 원문·공식 정답'}]
        for check in proof['sourceChecks']:
            reference = check.get('reference','')
            if check.get('type') == 'web' and re.match(r'^https://[^\s]+$', reference):
                refs.append({'label':check.get('supports') or '역사 자료 대조','url':reference})
            elif check.get('type') == 'textbook':
                # Show useful page references, never local filesystem paths.
                pages = re.findall(r'(?:PDF|교재|인쇄)\s*[\d·,~–\- ]+쪽', reference)
                refs.append({'label':'교재 근거 · '+(' / '.join(pages) if pages else '해당 시대 본문 대조')})
        items[id_] = {k:old[k] for k in ('id','exam','number','v','points','answer')}
        items[id_].update(overview=overview,options=options,references=refs)
    coverage.append(row)
pending = sum(len(r['pending']) for r in coverage)
blocked = sum(len(r['blocked']) for r in coverage)
if (pending or blocked) and not args.allow_incomplete:
    raise SystemExit(f'{pending} audit records pending, {blocked} blocked; release build requires all 500 verified')
out = {'schema':1,'generatedBy':'scripts/build_cbt_explanations.py','items':items}
(ROOT/'media/cbt-explanation-data.js').write_text('/* Reviewed CBT explanations: final-result display only; source exam IDs, versions and grading stay unchanged. */\nwindow.HANQ_CBT_EXPLANATIONS='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
report = {'total':500,'verified':len(items),'blocked':sum(len(r['blocked']) for r in coverage),'pending':pending,'rounds':coverage,'examPoolSha256':hashlib.sha256(source.encode()).hexdigest(),'policy':'Only fully verified manuscripts are overlaid on exact final-result identities. Blocked/pending items retain the stored explanation; the report lists their numbers. No API records or original content changed.'}
(ROOT/'docs/cbt-explanation-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('total','verified','blocked','pending')}))
