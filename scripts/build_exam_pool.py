# -*- coding: utf-8 -*-
"""실전 모의(기출) 확장 풀을 만든다: 한국사능력검정시험 심화 제70–79회 실제 문항 500개.

  python3 scripts/build_exam_pool.py <입력 폴더> [강의 원고]
  (또는 HANQ_EXAM_SOURCE_DIR=<입력 폴더> HANQ_TEACHER_SCRIPT=<강의 원고> python3 scripts/build_exam_pool.py)

입력 폴더(저장소 밖, 조정자가 원본 PDF 10회분에서 뽑은 읽기 전용 산출물):
  hanq-exam-normalized-source.json            500문항: 회차·번호·원본 PDF·쪽·자른 영역·공식 정답·배점·분류(시대)·원문 SHA-256·contentVersion
  hanq-local-exam-answer-audit.json           공식 정답 PDF 10개에서 읽은 정답·배점(다시 대조)
  hanq-exam-negative-and-point-source-audit.json  회차별 배점 합 · ‘옳지 않은’ 꼴 후보 ID
  hanq-exam-analysis/question-image-manifest.json  문항 그림 500개의 SHA-256 · 원본 PDF · 쪽 · 픽셀 영역
  hanq-exam-analysis/question-images/RR-NN.webp     원본 PDF에서 문항 띠를 통째로 잘라 낸 그림(편집 없음)
  hanq-existing-mock-55.json                   예전 실전 모의 55문항 스냅숏(앱의 media/past-exam-quiz.js와 같아야 함)
  hanq-full-textbook-original.txt              교재 전체 글(근거 줄 · 쪽: \f로 센 실제 PDF 쪽)
선택 입력: 강의 원고 — 받아쓰기 오타가 있어 화면에 옮기지 않고 근거 행 번호만 남긴다.
  hanq-exam-common-material-manifest.json + question-images/RR-commonNN-NN.webp — 여러 문항이 함께 쓰는 공통 자료([47~48] 등)를
  원본 PDF 같은 쪽에서 잘라 낸 그림. 있으면 SHA-256·원본 PDF·쪽을 확인하고 media/exam-expanded/로 복사해 해당 문항에만
  commonImage · commonImageSha256 · commonLabel · source.commonMaterial로 붙인다(문항 그림·ID·정답·배점은 그대로).
저장소 안에서 읽는 것: docs/exam-reviews/round-RR.json(문항 풀이 원고: 문항마다 카드 + 보기 다섯 풀이) · media/lecture-flow-*.js · media/past-exam-quiz.js

출력(저장소 안):
  media/exam-pool.js              window.HANQ_EXAM_POOL — 500문항(안정 ID exam-RR-NN · 보기 ID exam-RR-NN-option-k) · 시대별 풀 · 풀이 카드
  media/exam-expanded/RR-NN.webp  예전 55문항이 아닌 445문항의 문항 그림(원본 그림 그대로 복사, SHA-256 확인)
  docs/exam-pool-map.json         입력 해시 · 수 · 시대별 문항 ID · 근거 범위 · 남은 확인 목록

원칙
- 예전 55문항의 데이터(media/past-exam-quiz.js)와 그림(media/exam/)은 바꾸지 않는다. 확장 풀은 같은 문항을 안정 ID로 이어 붙이고, 예전 풀이(why·remember·topic)를 그대로 함께 둔다.
- 정답·배점은 공식 정답 PDF에서 읽은 값만 쓴다. 문항·보기·정답을 지어 쓰지 않는다. 시험 문장(OCR)은 화면 본문으로 쓰지 않고 원본 그림을 보여 준다.
- 보기 풀이는 보기의 원래 번호(1–5)로 묶는다(화면 자리와 무관). 풀이 원고에 연도를 쓰면 그 연도가 원문·교재·강의 원고·흐름 카드 중 하나에 있어야 한다(없으면 지도 unsourcedYears에 남기고 검사기가 실패시킨다).
- 수는 짐작하지 않고 원문 데이터에서 센다. 빈도는 실제 10회분(70–79회)에서 센 수이고 앞으로의 출제 예측이 아니다.
- 시간·난수·개인 경로를 쓰지 않는다. 같은 입력이면 같은 출력.
"""
import hashlib, json, os, re, sys
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUNDS = list(range(70, 80))
PER_ROUND = 50
SET_SIZE = 20
CIRC = '①②③④⑤'
ERA_ORDER = ['prehistory', 'gojoseon', 'samguk', 'nambuk', 'goryeo', 'joseon-early', 'joseon-late', 'islands', 'opening', 'colonial', 'modern', 'comprehensive']
ERA_TITLE = OrderedDict([('prehistory', '선사시대'), ('gojoseon', '고조선과 여러 나라'), ('samguk', '삼국시대'), ('nambuk', '남북국시대'), ('goryeo', '고려 시대'),
                         ('joseon-early', '조선 전기와 양난'), ('joseon-late', '조선 후기'), ('islands', '독도와 간도'), ('opening', '개항기와 대한제국'),
                         ('colonial', '일제 강점기와 독립운동'), ('modern', '광복과 대한민국'), ('comprehensive', '통사·복합')])
CH_PART = {'prehistory': 'Ⅰ', 'gojoseon': 'Ⅰ', 'samguk': 'Ⅱ', 'nambuk': 'Ⅱ', 'goryeo': 'Ⅲ', 'joseon-early': 'Ⅳ', 'joseon-late': 'Ⅳ',
           'opening': 'Ⅴ', 'colonial': 'Ⅵ', 'modern': 'Ⅶ'}
FLOW_FAM = {'joseon-early': 'joseon', 'joseon-late': 'joseon'}
PDF_PAGES, PDF_OFFSET, BOOK_FIRST_PDF = 144, 7, 8
REVIEW_KEYS = ('a', 'why', 'clue', 'ctx', 'mem', 'cmp', 'o')


def usage_exit(msg):
    sys.stderr.write(msg + '\n사용법: python3 scripts/build_exam_pool.py <입력 폴더> [강의 원고]  (또는 HANQ_EXAM_SOURCE_DIR · HANQ_TEACHER_SCRIPT)\n')
    sys.exit(2)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def h(s, n=12):
    return hashlib.sha1(s.encode('utf-8')).hexdigest()[:n]


def compact(s):
    return re.sub(r'\s+', '', str(s))


def lines_of(x):
    if isinstance(x, list):
        return [str(v).strip() for v in x if str(v).strip()]
    x = str(x or '').strip()
    return [x] if x else []


def read_bytes(p):
    with open(p, 'rb') as f:
        return f.read()


def main():
    src = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get('HANQ_EXAM_SOURCE_DIR', '')).strip()
    if not src:
        usage_exit('입력 폴더를 밝혀 주세요.')
    if not os.path.isdir(src):
        usage_exit('입력 폴더가 없어요: ' + src)
    files = OrderedDict([('normalized', 'hanq-exam-normalized-source.json'), ('answers', 'hanq-local-exam-answer-audit.json'),
                         ('negative', 'hanq-exam-negative-and-point-source-audit.json'), ('manifest', 'hanq-exam-analysis/question-image-manifest.json'),
                         ('legacy', 'hanq-existing-mock-55.json'), ('textbook', 'hanq-full-textbook-original.txt')])
    data, shas = {}, OrderedDict()
    for k, f in files.items():
        p = os.path.join(src, f)
        if not os.path.isfile(p):
            usage_exit('입력 파일이 없어요: ' + f)
        b = read_bytes(p)
        shas[f] = sha(b)
        data[k] = b.decode('utf-8') if k == 'textbook' else json.loads(b.decode('utf-8'))
    img_dir = os.path.join(src, 'hanq-exam-analysis', 'question-images')
    if not os.path.isdir(img_dir):
        usage_exit('문항 그림 폴더가 없어요: hanq-exam-analysis/question-images')
    teacher_path = (sys.argv[2] if len(sys.argv) > 2 else os.environ.get('HANQ_TEACHER_SCRIPT', '')).strip()
    teacher = []
    if teacher_path and os.path.isfile(teacher_path):
        tb_ = read_bytes(teacher_path)
        shas['teacher-script'] = sha(tb_)
        teacher = tb_.decode('utf-8').split('\n')

    # ---- 1. 원문 500문항: ID · 회차별 50 · 정답 1–5 · 배점 1–3 · 원본 PDF SHA · 공식 정답 PDF와 다시 대조 ----
    N = data['normalized']
    recs = N['records']
    ids = [r['id'] for r in recs]
    if len(recs) != len(ROUNDS) * PER_ROUND or len(set(ids)) != len(ids):
        raise SystemExit('원문 문항이 서로 다른 500개가 아니에요.')
    src_sha = {s['exam']: s for s in N['sources']}
    ans = data['answers']['answers']
    ans_files = {f['exam']: f for f in data['answers']['files']}
    point_sum = {}
    for r in recs:
        m = re.match(r'^exam-(\d\d)-(\d\d)$', r['id'])
        if not m or int(m.group(1)) != r['exam'] or int(m.group(2)) != r['number'] or r['exam'] not in ROUNDS or not 1 <= r['number'] <= PER_ROUND:
            raise SystemExit('문항 ID가 회차·번호와 맞지 않아요: ' + r['id'])
        if r['answer'] not in (1, 2, 3, 4, 5) or r['points'] not in (1, 2, 3):
            raise SystemExit('정답(1–5)·배점(1–3)이 아니에요: ' + r['id'])
        o = ans.get(str(r['exam']), {}).get(str(r['number']))
        if not o or o['answer'] != r['answer'] or o['points'] != r['points']:
            raise SystemExit('공식 정답 PDF와 정답·배점이 달라요: ' + r['id'])
        s = src_sha.get(r['exam'])
        if not s or s['sha256'] != r['sourceSHA256'] or s['file'] != r['source_file']:
            raise SystemExit('원본 문제 PDF SHA-256·파일이 맞지 않아요: ' + r['id'])
        af = ans_files.get(r['exam'])
        if not af or af['sha256'] != r['officialAnswerSource']['sha256'] or not af.get('complete') or af.get('count') != PER_ROUND:
            raise SystemExit('공식 정답 PDF 기록이 맞지 않아요: ' + r['id'])
        point_sum[r['exam']] = point_sum.get(r['exam'], 0) + r['points']
    for rd in ROUNDS:
        if sorted(r['number'] for r in recs if r['exam'] == rd) != list(range(1, PER_ROUND + 1)):
            raise SystemExit('%d회 문항 번호가 1–50이 아니에요.' % rd)
        want = data['negative']['officialRounds'][str(rd)]['officialPointSum']
        if point_sum[rd] != want:
            raise SystemExit('%d회 배점 합이 %d가 아니에요(%d).' % (rd, want, point_sum[rd]))
    by_id = OrderedDict((r['id'], r) for r in sorted(recs, key=lambda r: (r['exam'], r['number'])))
    negative = set(data['negative']['negativeQuestionIDs'])
    if not negative <= set(by_id):
        raise SystemExit('‘옳지 않은’ 후보 ID가 원문에 없어요.')

    # ---- 2. 문항 그림: 목록 SHA-256 · 원본 PDF · 쪽 ----
    man = {m['id']: m for m in data['manifest']}
    if set(man) != set(by_id):
        raise SystemExit('그림 목록이 500문항과 맞지 않아요.')
    for iid, r in by_id.items():
        m = man[iid]
        p = os.path.join(img_dir, m['file'])
        if m['file'] != iid[5:] + '.webp' or not os.path.isfile(p) or sha(read_bytes(p)) != m['sha256'] or m['source_file'] != r['source_file'] or m['page'] != r['page']:
            raise SystemExit('문항 그림이 목록·원본과 맞지 않아요: ' + iid)

    # ---- 2b. 공통 자료(선택 입력): 여러 문항이 함께 쓰는 지문([47~48] 등)을 원본 PDF 같은 쪽에서 잘라 낸 그림 ----
    #  문항 그림(띠)에는 공통 지문이 빠질 수 있다. 목록의 원본 PDF·SHA·쪽이 그 문항들의 원문과 같아야 하고, 그림 SHA-256이 목록과 같아야 한다.
    common_of, commons = {}, []
    cm_path = os.path.join(src, 'hanq-exam-common-material-manifest.json')
    if os.path.isfile(cm_path):
        cb = read_bytes(cm_path)
        shas['hanq-exam-common-material-manifest.json'] = sha(cb)
        for c in json.loads(cb.decode('utf-8'))['records']:
            qids = c.get('questionIDs') or []
            if not re.match(r'^[0-9][0-9]-common[0-9-]+\.webp$', c.get('file', '')) or len(qids) < 2:
                raise SystemExit('공통 자료 목록 형식이 맞지 않아요: ' + str(c.get('id')))
            p = os.path.join(img_dir, c['file'])
            if not os.path.isfile(p) or sha(read_bytes(p)) != c['sha256']:
                raise SystemExit('공통 자료 그림 SHA-256이 목록과 달라요: ' + c['file'])
            for qid in qids:
                r = by_id.get(qid)
                if not r or r['source_file'] != c['source_file'] or r['sourceSHA256'] != c['source_sha256'] or r['page'] != c['page']:
                    raise SystemExit('공통 자료가 문항의 원본 PDF·쪽과 맞지 않아요: %s %s' % (c['id'], qid))
                if qid in common_of:
                    raise SystemExit('한 문항에 공통 자료가 둘이에요: ' + qid)
                common_of[qid] = c
            if len(c.get('crop_points') or []) != 4 or len(c.get('pixel_crop') or []) != 4:
                raise SystemExit('공통 자료 자른 영역 기록이 없어요: ' + c['id'])
            commons.append(c)

    # ---- 3. 예전 55문항: 앱 데이터와 스냅숏이 같고, 모두 원문 문항 · 공식 정답과 같은지 ----
    js = open(os.path.join(ROOT, 'media', 'past-exam-quiz.js'), encoding='utf-8').read()
    mm = re.match(r'^window\.PAST_EXAM_QUIZZES=(.*);\s*$', js, re.S)
    if not mm or json.loads(mm.group(1)) != data['legacy']:
        raise SystemExit('media/past-exam-quiz.js가 예전 55문항 스냅숏과 달라요.')
    legacy_of, legacy_era = {}, OrderedDict()
    for era, arr in data['legacy'].items():
        legacy_era[era] = []
        for i, q in enumerate(arr):
            iid = 'exam-%d-%02d' % (q['exam'], q['number'])
            r = by_id.get(iid)
            if not r or r['answer'] != q['answer'] or r['points'] != q['points']:
                raise SystemExit('예전 문항이 원문·공식 정답과 달라요: ' + iid)
            if era != r['era'] and era not in r.get('relatedEras', []):
                raise SystemExit('예전 문항의 시대가 원문 분류(주 시대·관련 시대)에 없어요: %s %s' % (era, iid))
            if not os.path.isfile(os.path.join(ROOT, q['image'])):
                raise SystemExit('예전 문항 그림이 없어요: ' + q['image'])
            if iid in legacy_of:
                raise SystemExit('예전 문항이 두 번 나와요: ' + iid)
            legacy_of[iid] = OrderedDict([('era', era), ('index', i), ('topic', q['topic']), ('why', q['why']), ('remember', q['remember']), ('image', q['image'])])
            legacy_era[era].append(iid)
    if len(legacy_of) != 55:
        raise SystemExit('예전 문항이 55개가 아니에요.')

    # ---- 4. 시대별 풀: 주 시대(한 번만 셈) + 관련 시대(같은 ID를 다른 시대에서도 고를 수 있음, 전체 풀에서는 한 번) ----
    primary = OrderedDict((e, []) for e in ERA_ORDER)
    related = OrderedDict((e, []) for e in ERA_ORDER)
    for iid, r in by_id.items():
        if r['era'] not in primary:
            raise SystemExit('알 수 없는 시대 분류: %s %s' % (iid, r['era']))
        primary[r['era']].append(iid)
        for e in r.get('relatedEras', []):
            if e not in related:
                raise SystemExit('알 수 없는 관련 시대: %s %s' % (iid, e))
            if e != r['era']:
                related[e].append(iid)
    want_counts = N['primaryEraCounts']
    for e, l in primary.items():
        if len(l) != want_counts.get(e, 0):
            raise SystemExit('주 시대 수가 원문 집계와 달라요: %s %d / %s' % (e, len(l), want_counts.get(e)))
    if len(related['islands']) != N.get('relatedIslandsCount'):
        raise SystemExit('독도와 간도 관련 문항 수가 원문 집계와 달라요.')
    eras = OrderedDict()
    for e in ERA_ORDER:
        leg = legacy_era.get(e, [])
        rest = [x for x in primary[e] + related[e] if x not in leg]
        pool = leg + [x for i, x in enumerate(rest) if x not in rest[:i]]
        eras[e] = OrderedDict([('title', ERA_TITLE[e]), ('legacy', leg), ('primary', primary[e]), ('related', related[e]), ('pool', pool),
                               ('poolCount', len(pool)), ('sets', (len(pool) + SET_SIZE - 1) // SET_SIZE)])

    # ---- 5. 교재(\f 쪽) · 흐름 카드 · 강의 원고: 근거 찾기 ----
    raw_tb = data['textbook']
    if raw_tb.count('\f') != PDF_PAGES:
        raise SystemExit('교재 글의 쪽 나눔(\\f)이 %d개가 아니에요.' % PDF_PAGES)
    tb = raw_tb.split('\n')
    tbc = [compact(l) for l in tb]
    page, ff = [0] * len(tb), 0
    span_ok = [True] * len(tb)
    for i, l in enumerate(tb):
        seen, k = set(), ff
        for ch in l:
            if ch == '\f':
                k += 1
            elif not ch.isspace():
                seen.add(k + 1)
        page[i] = min(seen) if seen else k + 1
        span_ok[i] = len(seen) <= 1
        ff = k
    toc = OrderedDict()
    for i, l in enumerate(tb):
        if page[i] >= BOOK_FIRST_PDF:
            break
        m = re.match(r'^\s*([ⅠⅡⅢⅣⅤⅥⅦ])\s+.*?(\d+)\s*$', l)
        if m and m.group(1) not in toc:
            toc[m.group(1)] = int(m.group(2))
    nums = list(toc)
    part_range = {n: (toc[n] + PDF_OFFSET, (toc[nums[k + 1]] + PDF_OFFSET - 1) if k + 1 < len(nums) else PDF_PAGES) for k, n in enumerate(nums)}
    qpage = {}
    for i, l in enumerate(tb):
        if re.match(r'^\s*\(\d+\)\s*\S', l):
            qpage[page[i]] = qpage.get(page[i], 0) + 1
    confirm_pages = {p for p, n in qpage.items() if n >= 3}

    def tb_ok(i):
        s = tb[i].strip()
        return bool(s) and span_ok[i] and BOOK_FIRST_PDF <= page[i] <= PDF_PAGES and page[i] not in confirm_pages and not re.match(r'^[ⅠⅡⅢⅣⅤⅥⅦ]', s) and '·····' not in s

    tb_cache = {}

    def tb_line(term, era):
        """외울 말이 실제로 나오는 교재 줄(그 시대 부의 쪽을 먼저)."""
        tc = compact(term)
        if len(tc) < 2:
            return None
        key = (tc, era)
        if key not in tb_cache:
            rng = part_range.get(CH_PART.get(era, ''))
            got = None
            for strict in ((True, False) if rng else (False,)):
                got = next((i for i in range(len(tb)) if tc in tbc[i] and tb_ok(i) and (not strict or rng[0] <= page[i] <= rng[1])), None)
                if got is not None:
                    break
            tb_cache[key] = None if got is None else OrderedDict([('kind', 'textbook'), ('line', got + 1), ('pdfPage', page[got]), ('page', page[got] - PDF_OFFSET)])
        return tb_cache[key]

    flows = []
    for fn in sorted(os.listdir(os.path.join(ROOT, 'media'))):
        if fn.startswith('lecture-flow-') and fn.endswith('.js'):
            t = open(os.path.join(ROOT, 'media', fn), encoding='utf-8').read()
            m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', t, re.S)
            if not m:
                continue
            for f_ in json.loads(m.group(1)).get('list', []):
                for k_ in f_.get('chunks', []):
                    flows.append(dict(fam=fn[len('lecture-flow-'):-3], file='media/' + fn, flow=f_.get('name', ''), chunk=k_.get('t', ''),
                                      text=compact(' '.join(k_.get('story', [])).replace('**', ''))))
    flow_text = ' '.join(f['text'] for f in flows)

    def flow_ref(term, era):
        tc = compact(term)
        fam = FLOW_FAM.get(era, era)
        f_ = next((f for f in flows if f['fam'] == fam and tc in f['text']), None) if len(tc) >= 2 else None
        return OrderedDict([('kind', 'flow'), ('file', f_['file']), ('flow', f_['flow']), ('chunk', f_['chunk'])]) if f_ else None

    teacher_c = [compact(l) for l in teacher]

    def teacher_ref(term):
        tc = compact(term)
        i = next((i for i, l in enumerate(teacher_c) if len(tc) >= 2 and tc in l), None)
        return OrderedDict([('kind', 'teacher'), ('line', i + 1)]) if i is not None else None

    # ---- 6. 풀이 원고: 회차마다 50문항, 문항마다 카드 칸 + 보기 다섯 ----
    reviews = {}
    for rd in ROUNDS:
        p = os.path.join(ROOT, 'docs', 'exam-reviews', 'round-%d.json' % rd)
        if not os.path.isfile(p):
            raise SystemExit('풀이 원고가 없어요: docs/exam-reviews/round-%d.json' % rd)
        doc = json.loads(open(p, encoding='utf-8').read())
        items = doc.get('items', {})
        if sorted(items) != ['%02d' % n for n in range(1, PER_ROUND + 1)]:
            raise SystemExit('%d회 풀이 원고가 1–50번을 모두 다루지 않아요.' % rd)
        for n, it in items.items():
            iid = 'exam-%d-%s' % (rd, n)
            for k in REVIEW_KEYS:
                if k not in it:
                    raise SystemExit('풀이 원고에 %s가 없어요: %s' % (k, iid))
            if len(it['o']) != 5 or not all(lines_of(x) for x in it['o']):
                raise SystemExit('보기 풀이가 다섯이 아니에요: ' + iid)
            for k in ('why', 'clue', 'ctx', 'mem', 'cmp'):
                if not lines_of(it[k]):
                    raise SystemExit('풀이 카드 칸이 비었어요: %s %s' % (iid, k))
            reviews[iid] = it

    # 연도 근거: 원문 · 교재 · 강의 원고 · 흐름 카드 · 예전 풀이에 그 연도가 있어야 한다
    corpus = compact(raw_tb) + compact('\n'.join(teacher)) + flow_text + compact(json.dumps(data['legacy'], ensure_ascii=False))
    year_re = re.compile(r'(?<![\d.])(\d{3,4})(?=\s*년|\s*\)|\s*[~–·,]|\s*$|\s)')

    def years_in(s):
        return [y for y in year_re.findall(s) if 300 <= int(y) <= 2025]

    # ---- 7. 문항 만들기 ----
    out_q = OrderedDict()
    unsourced, neg_unmarked, copied = [], [], []
    exp_dir = os.path.join(ROOT, 'media', 'exam-expanded')
    os.makedirs(exp_dir, exist_ok=True)
    keep_files = set()
    for iid, r in by_id.items():
        rv = reviews[iid]
        ans_n = r['answer']
        leg = legacy_of.get(iid)
        if leg:
            image = leg['image']
        else:
            fn = iid[5:] + '.webp'
            b = read_bytes(os.path.join(img_dir, fn))
            dst = os.path.join(exp_dir, fn)
            if not os.path.isfile(dst) or read_bytes(dst) != b:
                with open(dst, 'wb') as f:
                    f.write(b)
            keep_files.add(fn)
            copied.append(fn)
            image = 'media/exam-expanded/' + fn
        cm = common_of.get(iid)
        cm_image = None
        if cm:
            cb_ = read_bytes(os.path.join(img_dir, cm['file']))
            cdst = os.path.join(exp_dir, cm['file'])
            if not os.path.isfile(cdst) or read_bytes(cdst) != cb_:
                with open(cdst, 'wb') as f:
                    f.write(cb_)
            keep_files.add(cm['file'])
            cm_image = 'media/exam-expanded/' + cm['file']
            if rv.get('gap'):
                raise SystemExit('공통 자료가 있는데 풀이 원고에 ‘자료 빠짐(gap)’ 안내가 남아 있어요: ' + iid)
        is_neg = bool(rv.get('neg'))
        if iid in negative and not is_neg:
            neg_unmarked.append(iid)
        options = []
        for k in range(1, 6):
            lines = lines_of(rv['o'][k - 1])
            options.append(OrderedDict([('id', '%s-option-%d' % (iid, k)), ('number', k), ('text', CIRC[k - 1]), ('correct', k == ans_n), ('review', lines)]))
        era = r['era']
        refs, seen_ref = [], set()
        for term in lines_of(rv['mem']):
            for ref in (tb_line(term, era), flow_ref(term, era), teacher_ref(term) if teacher else None):
                if ref:
                    key = json.dumps(ref, ensure_ascii=False)
                    if key not in seen_ref:
                        seen_ref.add(key)
                        refs.append(ref)
        refs.append(OrderedDict([('kind', 'exam'), ('exam', r['exam']), ('number', r['number']), ('file', r['source_file']), ('page', r['page'])]))
        if leg:
            refs.append(OrderedDict([('kind', 'legacy-mock')]))
        overview = OrderedDict([('answer', '%s %s' % (CIRC[ans_n - 1], str(rv['a']).strip())), ('ask', rv.get('ask') or None),
                                ('reason', lines_of(rv['why'])), ('clue', lines_of(rv['clue'])), ('context', lines_of(rv['ctx'])),
                                ('memory', lines_of(rv['mem'])), ('contrast', lines_of(rv['cmp'])), ('refs', refs)])
        text_all = ' '.join([overview['answer']] + overview['reason'] + overview['clue'] + overview['context'] + overview['memory'] + overview['contrast'] + [l for o in options for l in o['review']])
        qsrc = compact(r.get('text', ''))
        for y in years_in(text_all):
            if y not in corpus and y not in qsrc:
                unsourced.append('%s:%s' % (iid, y))
        rvv = h(json.dumps([overview, [o['review'] for o in options]], ensure_ascii=False), 12)
        q = OrderedDict([('id', iid), ('subject', 'history'), ('exam', r['exam']), ('number', r['number']), ('era', era), ('relatedEras', list(r.get('relatedEras', []))),
                         ('sourceCategory', r.get('source_category')), ('classificationNote', r.get('classificationNote')), ('points', r['points']),
                         ('answer', ans_n), ('negative', is_neg), ('image', image), ('imageSha256', sha(read_bytes(os.path.join(ROOT, image)))),
                         ('commonImage', cm_image), ('commonImageSha256', cm['sha256'] if cm else None), ('commonLabel', cm.get('label') if cm else None),
                         ('commonQuestionIDs', list(cm['questionIDs']) if cm else None),
                         ('v', r['contentVersion']), ('rv', rvv), ('sourceGap', rv.get('gap') or None), ('options', options), ('overview', overview),
                         ('legacy', leg),
                         ('source', OrderedDict([('file', r['source_file']), ('sha256', r['sourceSHA256']), ('page', r['page']), ('cropPoints', r.get('crop_points')),
                                                 ('imageFile', man[iid]['file']), ('imageSha256', man[iid]['sha256']), ('pixelCrop', man[iid]['pixel_crop']),
                                                 ('answerFile', r['officialAnswerSource']['file']), ('answerSha256', r['officialAnswerSource']['sha256']),
                                                 ('commonMaterial', OrderedDict([('id', cm['id']), ('file', cm['file']), ('sha256', cm['sha256']), ('sourceFile', cm['source_file']),
                                                                                 ('sourceSha256', cm['source_sha256']), ('page', cm['page']), ('cropPoints', cm['crop_points']),
                                                                                 ('pixelCrop', cm['pixel_crop']), ('label', cm.get('label')), ('questionIDs', list(cm['questionIDs']))]) if cm else None)]))])
        out_q[iid] = q
    for fn in sorted(os.listdir(exp_dir)):
        if fn.endswith('.webp') and fn not in keep_files:
            os.remove(os.path.join(exp_dir, fn))
    if len(copied) != 500 - 55:
        raise SystemExit('새 그림이 445개가 아니에요(%d).' % len(copied))
    # ‘옳지 않은/적절하지 않은’ 꼴: 감사 파일의 질문 머리 확인 목록(negativeStemConfirmedIDs, 띄어 쓴 ‘적절 하지 않은’ 포함)과 원고의 neg 표시가 정확히 같아야 한다.
    # 지문 안의 부정 표현까지 잡은 넓은 후보(broadTextNegativeCandidateIDs, 예: 76-24·76-29)는 부정형 문항이 아니다.
    marked = set(i for i, q in out_q.items() if q['negative'])
    stem = set(data['negative'].get('negativeStemConfirmedIDs') or data['negative']['negativeQuestionIDs'])
    if 'negativeStemConfirmedCount' in data['negative'] and len(stem) != data['negative']['negativeStemConfirmedCount']:
        raise SystemExit('부정형 문항 확인 목록의 수가 기록과 달라요.')
    if marked != stem:
        raise SystemExit('원고의 neg 표시가 부정형 질문 확인 목록과 달라요: 빠짐 %s · 넘침 %s' % (sorted(stem - marked), sorted(marked - stem)))

    counts = OrderedDict([('questions', len(out_q)), ('rounds', len(ROUNDS)), ('legacy', len(legacy_of)), ('newImages', len(copied)),
                          ('primary', OrderedDict((e, len(primary[e])) for e in ERA_ORDER)),
                          ('related', OrderedDict((e, len(related[e])) for e in ERA_ORDER if related[e])),
                          ('pool', OrderedDict((e, eras[e]['poolCount']) for e in ERA_ORDER)),
                          ('options', sum(len(q['options']) for q in out_q.values())), ('negative', sum(1 for q in out_q.values() if q['negative'])),
                          ('commonImages', len(commons)), ('withCommonImage', sum(1 for q in out_q.values() if q['commonImage']))])
    pool = OrderedDict([('schema', 1), ('subject', 'history'), ('generatedBy', 'scripts/build_exam_pool.py'), ('setSize', SET_SIZE),
                        ('frequencyBasis', '한국사능력검정시험 심화 제70–79회(10회분) 실제 문항 500개에서 센 수 · 앞으로의 출제 예측이 아님'),
                        ('counts', counts), ('eras', eras), ('order', list(out_q)), ('questions', out_q),
                        ('sources', [OrderedDict([('exam', s['exam']), ('file', s['file']), ('sha256', s['sha256']), ('pages', s['pages'])]) for s in N['sources']]),
                        ('answerSources', [OrderedDict([('exam', f['exam']), ('file', f['file']), ('sha256', f['sha256'])]) for f in data['answers']['files']])])
    with open(os.path.join(ROOT, 'media', 'exam-pool.js'), 'w', encoding='utf-8') as f:
        f.write('/* 실전 모의(기출) 확장 풀 — scripts/build_exam_pool.py가 만든 파일입니다. 손으로 고치지 마세요. 근거: docs/exam-pool-sources.md */\n')
        f.write('window.HANQ_EXAM_POOL=' + json.dumps(pool, ensure_ascii=False, separators=(',', ':')) + ';\n')
    cmap = OrderedDict([('generatedBy', 'scripts/build_exam_pool.py'), ('inputs', shas), ('counts', counts),
                        ('eras', OrderedDict((e, OrderedDict([('legacy', eras[e]['legacy']), ('primary', eras[e]['primary']), ('related', eras[e]['related'])])) for e in ERA_ORDER)),
                        ('sourceCategoryCounts', N.get('category_counts')), ('frequencyBasis', N.get('frequencyBasis')), ('islandsScope', N.get('islandsScope')),
                        ('classificationNotes', OrderedDict((i, r['classificationNote']) for i, r in by_id.items() if r.get('classificationNote'))),
                        ('negativeCandidates', sorted(negative)), ('negativeMarked', sorted(i for i, q in out_q.items() if q['negative'])),
                        ('negativeCandidatesNotMarked', sorted(neg_unmarked)), ('unsourcedYears', sorted(unsourced)),
                        ('imageSourceGaps', OrderedDict((i, q['sourceGap']) for i, q in out_q.items() if q['sourceGap'])),
                        ('commonMaterials', [OrderedDict([('id', c['id']), ('path', 'media/exam-expanded/' + c['file']), ('sha256', c['sha256']), ('sourceFile', c['source_file']),
                                                          ('sourceSha256', c['source_sha256']), ('page', c['page']), ('cropPoints', c['crop_points']), ('pixelCrop', c['pixel_crop']),
                                                          ('questionIDs', list(c['questionIDs'])), ('label', c.get('label'))]) for c in commons]),
                        ('refsCoverage', OrderedDict([('withTextbookLine', sum(1 for q in out_q.values() if any(x['kind'] == 'textbook' for x in q['overview']['refs']))),
                                                      ('withFlowCard', sum(1 for q in out_q.values() if any(x['kind'] == 'flow' for x in q['overview']['refs']))),
                                                      ('withTeacherLine', sum(1 for q in out_q.values() if any(x['kind'] == 'teacher' for x in q['overview']['refs']))),
                                                      ('teacherScript', bool(teacher))])),
                        ('images', OrderedDict((i, OrderedDict([('path', q['image']), ('sha256', q['imageSha256'])])) for i, q in out_q.items()))])
    with open(os.path.join(ROOT, 'docs', 'exam-pool-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('기출 확장 풀', len(out_q), '· 예전', len(legacy_of), '· 새 그림', len(copied), '· 연도 근거 없음', len(unsourced), '· 옳지 않은 꼴 미표시', len(neg_unmarked))


if __name__ == '__main__':
    main()
