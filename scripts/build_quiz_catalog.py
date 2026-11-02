# -*- coding: utf-8 -*-
"""확인 문제 카탈로그(객관식)를 만든다: 기존 빈칸 666문항 + 교재 ‘공부 내용 확인’ 642문항.

  python3 scripts/build_quiz_catalog.py <입력 폴더>
  (또는 HANQ_CONFIRMATION_DIR=<입력 폴더> python3 scripts/build_quiz_catalog.py)

입력 폴더(저장소 밖, 조정자가 만든 읽기 전용 산출물):
  hanq-existing-quiz-666.json                      기존 빈칸 원본 666문항 스냅숏(앱의 배열과 같음 — 검사기가 대조)
  hanq-confirmation-normalized-source.json         교재 확인 문제 642문항(원문 문제·정답 · 정정·문맥 보완 반영본)
  hanq-confirmation-answer-corrections.json        교재 PDF 정답표로 고친 18건(원문 정답은 그대로 보관)
  hanq-confirmation-question-context-clarifications.json  외교 상대를 묻는 4문항의 문맥 보완
  hanq-confirmation-semantic-coverage.json         같은 문제·같은 답으로 확인된 기존 문항 짝(answerCompatibleMatches)
  hanq-confirmation-existing-coverage.json         글자 그대로 같은 문제(참고 · 해시만 기록)
  hanq-confirmation-source-audit.json              원문 줄·번호
  hanq-full-textbook-original.txt                  교재 전체 글(144쪽 PDF의 pdftotext -layout 출력). 쪽은 쪽 나눔 문자 \f만으로 센다(PDF 쪽 = 앞선 \f 수 + 1,
                                                   교재 쪽 = PDF 쪽 − 7). 실제 PDF에서 확인한 그림 설명 8곳(PAGE_ANCHORS)이 하나라도 어긋나면 멈춘다.
선택 입력: 강의 원고(두 번째 인자 또는 HANQ_TEACHER_SCRIPT) — 받아쓰기 오타가 있어 화면에 옮기지 않고, 근거 행 번호(refs)만 남긴다.
저장소 안에서 읽는 것: media/lecture-flow-*.js(흐름 카드 문장) · media/textbook-notes.js(교재 핵심 개념 행)

문항 풀이 카드(overview, 문항마다): 정답 · 왜(교재 원문 줄 · 기존 풀이) · 결정 단서 · 흐름(흐름 카드 · 핵심 개념 · 같은 답의 다른 단서) · 외울 말 · 헷갈림(다른 보기의 실제 단서) · 근거(refs: 교재 줄·쪽 · 흐름 파일 · 강의 행 · 카탈로그 문항).
근거 줄은 정답 이름이 실제로 나오는 교재 줄(또는 정답 이름만 있는 표 칸 줄의 바로 위아래 3줄)에서 문제 말과 겹치는 줄만 고른다. 날짜·사실을 새로 지어 쓰지 않는다.

출력(저장소 안):
  media/quiz-catalog.js     window.HANQ_QUIZ_CATALOG — 문항·보기(안정 ID)·보기별 풀이·세트용 풀·원문 근거
  docs/quiz-catalog-map.json  출처 해시 · 수 · 원문 ID → 문항 ID · 낮은 확신 표시

원칙
- 기존 666문항은 하나도 고치지 않는다. 문항 ID는 legacy-<장>-<번호 3자리>(기존 배열 순서), 원래 q/a/section/clue/why/cue를 그대로 담는다.
- 교재 문항(check-GG-NN)은 의미 대조표에서 ‘같은 문제·같은 답’으로 확인된 기존 문항에 출처로 붙인다(여러 개면 모두). 짝이 없는 문항만 새 문항이 된다.
  글자는 같아도 묻는 것이 다른 문항(예: 법흥왕 vs 신라)은 대조표가 서로 다른 기존 문항으로 이어 주므로 합치지 않는다.
- 보기: 정답 하나 + 같은 종류(같은 묶음 · 같은 꼬리표 · 같은 단서 말)의 다른 답. 정답의 모든 별칭·괄호 안 말과 겹치는 보기는 넣지 않는다.
  순서 문제는 순서를 바꾼 묶음, 순서가 없는 여러 개 답은 하나 이상을 바꾼 묶음, 칸이 정해진 답은 칸을 바꾼 묶음, 짝짓기(check-12-02)는 짝을 바꾼 묶음.
  같은 종류가 하나뿐이면 보기 둘(억지로 채우지 않음).
- 보기 ID = 'o' + sha1(문항 ID + 보기 글)[:10] (자리와 무관), 문항 버전 v = 문제·묻는 것·보기 글의 해시. 시간·난수·개인 경로를 쓰지 않는다.
"""
import hashlib, itertools, json, os, re, sys
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUTS = OrderedDict([
    ('legacy', 'hanq-existing-quiz-666.json'),
    ('source', 'hanq-confirmation-normalized-source.json'),
    ('corrections', 'hanq-confirmation-answer-corrections.json'),
    ('clarifications', 'hanq-confirmation-question-context-clarifications.json'),
    ('semantic', 'hanq-confirmation-semantic-coverage.json'),
    ('coverage', 'hanq-confirmation-existing-coverage.json'),
    ('audit', 'hanq-confirmation-source-audit.json'),
    ('textbook', 'hanq-full-textbook-original.txt'),
])
TEXT_INPUTS = {'textbook'}
PDF_OFFSET = 7  # 교재 쪽 + 7 = PDF 쪽(정정 기록의 쪽 짝으로 확인)
PDF_PAGES = 144  # 교재 PDF(SHA-256 35d850c6…) 쪽 수 = pdftotext 출력의 \f 수
BOOK_FIRST_PDF = 8  # 본문 첫 쪽(교재 1쪽) = PDF 8쪽
# 실제 PDF 쪽을 눈으로 확인한 그림 설명(조정자 확인): 생성 때 \f로 센 쪽이 하나라도 다르면 멈춘다
PAGE_ANCHORS = [('[연가7년명 금동여래입상]', 18), ('[금동대향로]', 21), ('[기마인물형토기]', 24), ('[불국사 다보탑]', 33),
                ('[정혜공주 무덤의 돌사자상]', 36), ('[청자 어룡모양 주전자]', 54), ('[보은 법주사 팔상전]', 77), ('[김득신 파적도]', 79)]
# 보기 글만으로는 흐름이 안 보이는 문항: 교재 글에서 그대로 찾아 인용할 줄(공백 무시, 못 찾으면 생성 중단)
BOOK_CONTEXT = {
    'check-12-02': ['(반무신)김보당의난', '(농민)김사미', '(천민)만적의난', '(특수행정구역)망이'],
}
STOP = {'하였', '하였다', '있었', '있었다', '되었', '되었다', '하여', '하는', '에서', '으로', '이다', '이것', '이곳', '이것을', '이곳으로', '이곳에서', '사람', '사람은',
        '국가', '나라', '지역', '단체', '조직', '해당', '당시', '처음', '최초', '최초로', '전개', '결성', '발생', '위해', '위하여', '통해', '통하여', '대한', '있는', '정치',
        '사회', '문화', '경제', '제도', '기구', '설치', '실시', '시행', '사용', '제작', '운영', '설립', '편찬', '발행', '파견', '추진', '주장', '활동', '중심', '중심으로',
        '이후', '때문', '대해', '우리', '모두', '여러', '이름', '번호', '순서', '발생', '적어', '보세요', '아래', '보기', '쓰세요', '이후에', '그리고', '거쳐', '하다', '한다',
        '이었다', '였다', '것을', '것이', '등을', '등의', '등이', '왕은', '왕의', '왕이', '이사람', '조선이', '고려', '조선', '신라', '백제', '고구려', '발해'}
CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
CH_PART = {'prehistory': 'Ⅰ', 'gojoseon': 'Ⅰ', 'samguk': 'Ⅱ', 'nambuk': 'Ⅱ', 'goryeo': 'Ⅲ', 'joseon-early': 'Ⅳ', 'joseon-late': 'Ⅳ',
           'opening': 'Ⅴ', 'colonial': 'Ⅵ', 'modern': 'Ⅶ'}  # 독도와 간도는 여러 부에 걸쳐 제한하지 않음
CH_TITLE = {'prehistory': '선사시대', 'gojoseon': '고조선과 여러 나라', 'samguk': '삼국시대', 'nambuk': '남북국시대', 'goryeo': '고려 시대',
            'joseon-early': '조선 전기', 'joseon-late': '조선 후기', 'islands': '독도와 간도', 'opening': '개항기와 대한제국',
            'colonial': '일제 강점기와 독립운동', 'modern': '광복과 대한민국'}
SET_SIZE = 20
# 같은 글이지만 묻는 것이 다른 문항: 화면에 ‘묻는 것’을 분명히 적는다(의미 대조표의 서로 다른 짝)
ASK_OVERRIDE = {'check-05-06': '왕', 'check-06-21': '국가', 'check-11-04': '왕', 'check-15-01': '침입한 세력',
                'check-33-12': '시기', 'check-34-08': '정책 이름'}
DISTINCT_CONTEXT_PAIRS = [('check-05-06', 'check-06-21'), ('check-11-04', 'check-15-01'), ('check-33-12', 'check-34-08')]
TAGS = {'왕': '왕', '시작한 왕': '왕', '전쟁': '전쟁', '제도/왕': '제도/왕', '전쟁/왕': '전쟁/왕', '인물/왕': '인물/왕', '인물': '인물',
        '책': '책', '책/왕': '책/왕', '서원': '서원', '사신단': '사신단', '건물': '건물', '국가': '국가'}
CUES = [
    ('차수', r'몇 차'), ('연도', r'연도는'),
    ('시대', r'시대는\??$'),
    ('나라', r'(나라|국가)는\??$|상대는\??$|세력은\??$'),
    ('인물', r'이 사람|사람은|인물은'),
    ('조약', r'이 조약|이 각서|조약은'),
    ('신문', r'이 신문'),
    ('학교', r'이 학교|학교는'),
    ('종교', r'이 종교'),
    ('운동', r'이 운동|운동은'),
    ('단체', r'이 단체|단체은|단체는|이 조직|조직은|이 부대|부대는|이 회사'),
    ('장소', r'이곳|이 곳|이 지역|지역은|이 궁궐'),
    ('기구', r'이 기구|이 기관|기구는|기관은'),
    ('회의', r'이 회의'),
    ('사건', r'이 사건'),
    ('작전', r'이 작전'),
    ('사업', r'이 사업'),
    ('책', r'이 책|이 소설'),
    ('풍습', r'풍습은\??$'), ('행사', r'행사는\??$'), ('법', r'법은\??$'),
    ('유적', r'유적지는\??$'), ('수도', r'수도는\??$'),
    ('유물', r'(울타리는|토기는|석기는|농기구는|검은|도구는|무덤은|재료는|간석기는|뗀석기는)\??$'),
]
HOMOGENEOUS = r'왕\(또는 인물\)|왕을 쓰세요|국가를 쓰세요|정부를 쓰세요|민주화운동을 쓰세요|기구를 쓰세요|조약을 적으세요|중 해당되는 내용|중에 해당되는 내용|침입'


def usage_exit(msg):
    sys.stderr.write(msg + '\n사용법: python3 scripts/build_quiz_catalog.py <입력 폴더>  (또는 HANQ_CONFIRMATION_DIR)\n')
    sys.exit(2)


def h(s, n=10):
    return hashlib.sha1(s.encode('utf-8')).hexdigest()[:n]


def norm(s):
    s = ''.join(str(CIRC.index(ch) + 1) if ch in CIRC else ch for ch in str(s).lower())
    return re.sub(r'[^가-힣a-z0-9]', '', s)


def base(s):
    return re.sub(r'\s*\([^)]*\)', '', str(s)).strip()


def paren_tokens(s):
    out = []
    for inner in re.findall(r'\(([^)]*)\)', str(s)):
        for t in re.split(r'[,=·/]', inner):
            t = t.strip()
            if t:
                out.append(t)
    return out


def keys_of(strings):
    """정답·보기 비교용 열쇠: 글 전체 · 괄호를 뺀 이름 · 괄호 안 말(별칭·주석) · 끝 ‘왕’을 뗀 꼴."""
    out = set()
    for s in strings:
        for t in [s, base(s)] + paren_tokens(s):
            k = norm(t)
            if k:
                out.add(k)
                if len(k) >= 3 and k.endswith('왕'):
                    out.add(k[:-1])
    return out


SPLIT_RE = re.compile(r'\s*,\s*|(?<!\d)\s*·\s*(?!\d)')


def elements(s):
    return [x for x in SPLIT_RE.split(base(s)) if x]


def circ_seq(s):
    return [ch for ch in s if ch in CIRC]


def clean_q(q):
    return re.sub(r'\n\s*-\s*', '\n', str(q)).strip()


def strip_tag(q):
    return re.sub(r'\s*\(([가-힣/ ]+)\)\s*$', '', q).strip()


def short(s, n=36):
    s = re.sub(r'\s+', ' ', strip_tag(str(s).split('\n')[0])).strip()
    return s if len(s) <= n else s[:n - 1] + '…'


def family(ch):
    return 'joseon' if ch in ('joseon-early', 'joseon-late') else ch


def ask_of(prompt, tag, cue):
    """화면의 ‘묻는 것’: 꼬리표(왕 · 책/왕 …) > 묶음 제목의 ‘해당하는 ○○를 쓰세요’ > 단서 말. ‘내용’이면 비워 둔다."""
    if tag:
        return tag
    m = re.search(r'해당(?:하는|되는)\s*([가-힣()/ ·]+?)[을를] (?:쓰세요|적으세요)', prompt)
    word = m.group(1).strip() if m else ''
    if '년대' in prompt:
        return '시기'
    if '개혁' in prompt and '갑오' in prompt:
        return '개혁'
    if '침입' in prompt:
        return '침입한 세력'
    if word and word != '내용' and not word.endswith('내용'):
        return word
    return cue or None


def parse_map(ans):
    segs = re.findall(r'\((\d+)\)-(\d+)\s*([①-⑳,\s·]+)', ans)
    return [('(%s)-%s' % (a, b), sorted(circ_seq(items), key=CIRC.index)) for a, b, items in segs]


def map_text(m):
    return ' / '.join('%s %s' % (lab, ','.join(items)) for lab, items in m)


def main():
    src_dir = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get('HANQ_CONFIRMATION_DIR', '')).strip()
    if not src_dir:
        usage_exit('입력 폴더를 밝혀 주세요.')
    if not os.path.isdir(src_dir):
        usage_exit('입력 폴더가 없어요: ' + src_dir)
    data, shas = {}, OrderedDict()
    for k, f in INPUTS.items():
        p = os.path.join(src_dir, f)
        if not os.path.isfile(p):
            usage_exit('입력 파일이 없어요: ' + f)
        b = open(p, 'rb').read()
        shas[f] = hashlib.sha256(b).hexdigest()
        data[k] = b.decode('utf-8') if k in TEXT_INPUTS else json.loads(b.decode('utf-8'))
    teacher_path = (sys.argv[2] if len(sys.argv) > 2 else os.environ.get('HANQ_TEACHER_SCRIPT', '')).strip()
    teacher_lines = []
    if teacher_path and os.path.isfile(teacher_path):
        tb_ = open(teacher_path, 'rb').read()
        shas['teacher-script'] = hashlib.sha256(tb_).hexdigest()
        teacher_lines = tb_.decode('utf-8').split('\n')

    legacy = data['legacy']
    if sum(len(v) for v in legacy.values()) != 666:
        raise SystemExit('기존 빈칸 스냅숏이 666문항이 아니에요.')
    srcrecs = data['source']['records']
    if len(srcrecs) != 642 or len({r['id'] for r in srcrecs}) != 642 or not all(re.match(r'^check-\d\d-\d\d$', r['id']) for r in srcrecs):
        raise SystemExit('교재 확인 문제가 서로 다른 check-GG-NN 642개가 아니에요.')
    corr = {c['id']: c for c in data['corrections']['corrections']}
    clar = {c['id']: c for c in data['clarifications']}
    number = {}
    for g in data['audit']['groups']:
        for q in g['questions']:
            number[q['source_id']] = (q['number'], q['line'])
    sem = {r['sourceId']: r for r in data['semantic']['records']}
    if set(sem) != {r['id'] for r in srcrecs}:
        raise SystemExit('의미 대조표가 642문항을 모두 다루지 않아요.')

    # ---- 문항 모으기 ----
    items = OrderedDict()
    for ch, arr in legacy.items():
        for i, r in enumerate(arr):
            lid = 'legacy-%s-%03d' % (ch, i)
            items[lid] = dict(id=lid, chapter=ch, origin='legacy', sources=[],
                              legacy=OrderedDict([('chapter', ch), ('index', i), ('q', r['q']), ('a', list(r['a'])), ('section', r.get('section')),
                                                  ('clue', r.get('clue')), ('why', r.get('why')), ('cue', r.get('cue'))]))
    source_to_items = OrderedDict()
    for r in srcrecs:
        sid = r['id']
        n, line = number.get(sid, (None, r.get('sourceLine')))
        c = corr.get(sid) or r.get('correction')
        cl = clar.get(sid) or r.get('questionClarification')
        ref = OrderedDict([('id', sid), ('era', r['era']), ('relatedEras', r.get('relatedEras') or []), ('chapterTitle', r['sourceChapter']),
                           ('group', r['sourceGroup']), ('prompt', r['groupPrompt']), ('number', n), ('line', r.get('sourceLine', line)),
                           ('question', r['question']), ('answer', r['answer']), ('rawQuestion', r['rawQuestion']), ('rawAnswer', r['rawAnswer']),
                           ('correction', c), ('clarification', cl), ('contentVersion', r.get('contentVersion'))])
        lids = [m['legacyId'] for m in sem[sid].get('answerCompatibleMatches') or []]
        for lid in lids:
            if lid not in items:
                raise SystemExit('의미 대조표의 기존 문항이 없어요: %s → %s' % (sid, lid))
        if lids:
            for lid in lids:
                items[lid]['sources'].append(ref)
            source_to_items[sid] = lids
        else:
            items[sid] = dict(id=sid, chapter=r['era'], origin='source', sources=[ref], legacy=None)
            source_to_items[sid] = [sid]
    for a, b in DISTINCT_CONTEXT_PAIRS:
        if set(source_to_items[a]) & set(source_to_items[b]):
            raise SystemExit('묻는 것이 다른 두 문항이 한 문항으로 합쳐졌어요: %s %s' % (a, b))

    # ---- 화면 글 · 정답 · 모양 · 종류 ----
    for it in items.values():
        src = it['sources']
        if it['origin'] == 'legacy':
            q, accepted, prompt = it['legacy']['q'], list(it['legacy']['a']), (src[0]['prompt'] if src else (it['legacy']['section'] or ''))
        else:
            q, accepted, prompt = src[0]['question'], [src[0]['answer']], src[0]['prompt']
        for s in src:
            if s['clarification'] or (s['correction'] or {}).get('question'):
                q = s['question']
            if s['answer'] not in accepted:
                accepted.append(s['answer'])
        it['q'] = clean_q(q)
        it['prompt'] = re.sub(r'^\d+\)\s*', '', prompt or '').strip()
        it['a'] = accepted
        it['relatedEras'] = sorted({e for s in src for e in ([s['era']] + list(s['relatedEras'])) if e != it['chapter']})
        primary = accepted[0]
        # 모양: 짝짓기 · 순서 · 칸이 정해진 여러 답 · 순서 없는 여러 답 · 하나
        if re.search(r'\(\d+\)-\d', primary):
            it['shape'] = 'map'
        elif '순서' in it['q'] and len(circ_seq(primary)) >= 3:
            it['shape'] = 'order'
        else:
            multi = next((x for x in accepted if len(elements(x)) >= 2), None)
            if multi:
                slots = {('O' if s.startswith('O') else s[0]) for s in re.findall(r'O{2,}|○|☆+|△', it['q'])}
                it['shape'] = 'roles' if ('( , )' in it['q'] or len(slots) >= 2) else 'set'
                it['elements'] = elements(multi)
                it['joiner'] = ', ' if ',' in base(multi) else '·'
            else:
                it['shape'] = 'single'
        tm = re.search(r'\(([가-힣/ ]+)\)\s*$', it['q'])
        tag = TAGS.get(tm.group(1).strip()) if tm else None
        cue = next((name for name, rx in CUES if re.search(rx, strip_tag(it['q']))), None)
        mixed = bool(re.search(r'단체 / 지역|왕 / 전쟁 / 제도', it['prompt'])) or not re.search(HOMOGENEOUS, it['prompt'])
        fam = family(it['chapter'])
        it['group'] = '%s:%s' % (fam, norm(it['prompt']))
        if tag:
            it['kind'] = 'tag:%s:%s' % (fam, tag)
        elif mixed and cue:
            it['kind'] = 'cue:%s:%s' % (fam, cue)
        else:
            it['kind'] = 'grp:' + it['group']
        it['lowConfidence'] = it['kind'].startswith('grp:') and mixed
        sids = [s['id'] for s in src]
        it['ask'] = next((ASK_OVERRIDE[x] for x in sids if x in ASK_OVERRIDE), None) or ask_of(it['prompt'], tag, cue if mixed else None)
        it['tag'] = tag
        compound = bool(tag and '/' in tag)
        if it['shape'] == 'single':
            paren = next((x for x in accepted if '(' in x), None)
            it['answer'] = (paren or accepted[0]) if compound else (base(accepted[0]) or accepted[0])
            m = re.match(r'^(.*?)\s*\(([^)]*)\)$', it['answer']) if compound else None
            # ‘책/왕’ · ‘제도/왕’ 같은 짝 답(예: 동의보감(광해군))은 쪼개지 않고 한 보기로. 짝을 못 읽으면 보통 답으로
            it['compound'] = OrderedDict([('first', m.group(1).strip()), ('king', m.group(2).strip())]) if m else None
        else:
            it['compound'] = None

    # 같은 글의 문항은 서로의 정답을 보기로 쓰지 않는다
    same_text = {}
    for it in items.values():
        same_text.setdefault(norm(it['q']), set()).update(keys_of(it['a']))
    # 종류별 답(하나짜리)과 단서 사전
    kind_index, entity_kinds, facts = {}, {}, {}
    for it in items.values():
        if it['shape'] != 'single':
            continue
        ent = dict(text=it['answer'], keys=keys_of(it['a'] + [it['answer']]), group=it['group'], chapter=it['chapter'], id=it['id'])
        kind_index.setdefault(it['kind'], []).append(ent)
        ek = norm(base(it['answer']))
        entity_kinds.setdefault(ek, set()).add(it['kind'])
        facts.setdefault((family(it['chapter']), ek), []).append((it['id'], short(it['q'])))
        facts.setdefault(('*', ek), []).append((it['id'], short(it['q'])))

    def fact_clues(name, it, n=2):
        ek = norm(base(name))
        rows = facts.get((family(it['chapter']), ek)) or facts.get(('*', ek)) or []
        out, seen = [], {short(it['q'])}
        for qid, c in rows:
            if c in seen or qid == it['id']:
                continue
            seen.add(c)
            out.append(c)
            if len(out) >= n:
                break
        return out

    def pick_entities(it, kinds, excl, limit, same_group_any=False):
        tiers = ([lambda e: e['group'] == it['group'] and e['chapter'] == it['chapter'], lambda e: e['chapter'] == it['chapter'],
                  lambda e: family(e['chapter']) == family(it['chapter'])])
        got, seen = [], set()
        pool = []
        for k in kinds:
            pool.extend(kind_index.get(k, []))
        if same_group_any:
            pool = [e for ents in kind_index.values() for e in ents if e['group'] == it['group']]
        for tier in tiers:
            for e in sorted((e for e in pool if tier(e)), key=lambda e: h(it['id'] + '\x1f' + e['text'])):
                nk = norm(base(e['text']))
                if nk in seen or (e['keys'] & excl):
                    continue
                seen.add(nk)
                got.append(e['text'])
                if len(got) >= limit:
                    return got
        return got

    flags = OrderedDict()
    for it in items.values():
        excl = keys_of(it['a']) | same_text.get(norm(it['q']), set())
        opts = []  # (text, correct, review)
        shape = it['shape']
        wrong = []
        if shape == 'single' and it['compound']:
            # 짝 답: 같은 첫째 말 + 다른 왕 두 개, 다른 첫째 말 + 같은 왕 하나(모두 같은 꼴 ‘○○(왕)’이라 괄호로 정답이 드러나지 않음)
            ct, X, Y = it['answer'], it['compound']['first'], it['compound']['king']
            fam = family(it['chapter'])
            kings = pick_entities(it, ['tag:%s:왕' % fam], keys_of([Y]), 3)
            sib = sorted({items[e['id']]['compound']['first'] for e in kind_index.get(it['kind'], [])
                          if e['id'] != it['id'] and items[e['id']].get('compound')}, key=lambda x: h(it['id'] + x))
            firsts = [x for x in sib if norm(x) != norm(X)] or pick_entities(it, ['tag:%s:%s' % (fam, it['tag'].split('/')[0])], keys_of([X]), 2)
            cand = ['%s(%s)' % (X, k) for k in kings[:2]] + ['%s(%s)' % (f, Y) for f in firsts[:1]] + ['%s(%s)' % (X, k) for k in kings[2:3]]
            seen_c = {norm(ct)}
            for c in cand:
                if norm(c) not in seen_c and len(wrong) < 3:
                    seen_c.add(norm(c)); wrong.append(c)
            if wrong:
                opts = [(ct, True)] + [(w, False) for w in wrong]
        if shape == 'single' and not wrong:
            ct = it['answer']
            excl |= keys_of([ct])
            wrong = pick_entities(it, [it['kind']], excl, 3)
            if not wrong:
                wrong = pick_entities(it, [], excl, 3, same_group_any=True)
                flags.setdefault(it['id'], []).append('fallback-group')
            if not wrong:
                wrong = pick_entities(it, list(kind_index), excl, 3)
                flags.setdefault(it['id'], []).append('fallback-chapter')
            if not wrong:
                raise SystemExit('보기를 만들 수 없어요: ' + it['id'])
            opts = [(ct, True)] + [(w, False) for w in wrong]
        elif shape == 'order':
            seq = circ_seq(it['a'][0])
            cands = []
            for i in range(len(seq) - 1):
                s = seq[:]; s[i], s[i + 1] = s[i + 1], s[i]; cands.append(s)
            for i in range(len(seq) - 2):
                s = seq[:]; s[i], s[i + 2] = s[i + 2], s[i]; cands.append(s)
            cands += [seq[1:] + seq[:1], list(reversed(seq))]
            accepted_seqs = {''.join(circ_seq(x)) for x in it['a'] if len(circ_seq(x)) >= 3}
            wrong, seen = [], set(accepted_seqs)
            for s in sorted(cands, key=lambda s: h(it['id'] + ''.join(s))):
                k = ''.join(s)
                if k in seen:
                    continue
                seen.add(k); wrong.append(s)
                if len(wrong) >= 3:
                    break
            it['answer'] = '→'.join(seq)
            it['sequence'] = seq
            opts = [(it['answer'], True)] + [('→'.join(s), False) for s in wrong]
        elif shape == 'map':
            m = parse_map(it['a'][0])
            if len(m) < 2:
                raise SystemExit('짝짓기 정답을 읽지 못했어요: ' + it['id'])
            it['answer'] = map_text(m)
            it['mapping'] = m
            cands = []
            for i in range(len(m)):
                for j in range(i + 1, len(m)):
                    for x in m[i][1]:
                        for y in m[j][1]:
                            mm = [list(p) for p in m]
                            mm[i][1] = sorted([y if v == x else v for v in m[i][1]], key=CIRC.index)
                            mm[j][1] = sorted([x if v == y else v for v in m[j][1]], key=CIRC.index)
                            cands.append([(a, b) for a, b in mm])
            wrong, seen = [], {it['answer']}
            for c in sorted(cands, key=lambda c: h(it['id'] + map_text(c))):
                t = map_text(c)
                if t in seen:
                    continue
                seen.add(t); wrong.append(c)
                if len(wrong) >= 3:
                    break
            opts = [(it['answer'], True)] + [(map_text(c), False) for c in wrong]
        elif shape in ('set', 'roles'):
            els = it['elements']
            j = it['joiner']
            it['answer'] = j.join(els)
            el_keys = keys_of(els) | keys_of(it['a'])
            wrong_bundles, seen = [], set()
            correct_key = tuple(norm(x) for x in els) if shape == 'roles' else frozenset(norm(x) for x in els)
            seen.add(correct_key)
            if shape == 'roles':
                perms = [list(p) for p in itertools.permutations(els)]
                for p in sorted(perms, key=lambda p: h(it['id'] + '|'.join(p))):
                    k = tuple(norm(x) for x in p)
                    if k in seen:
                        continue
                    seen.add(k); wrong_bundles.append(p)
                    if len(wrong_bundles) >= 3:
                        break
            else:
                kinds = set()
                for e in els:
                    kinds |= {k for k in entity_kinds.get(norm(e), set()) if not k.startswith('grp:') or k == 'grp:' + it['group']}
                cands = pick_entities(it, sorted(kinds), el_keys | excl, 6) if kinds else []
                if not cands:
                    cands = pick_entities(it, [], el_keys | excl, 6, same_group_any=True)
                    flags.setdefault(it['id'], []).append('set-fallback-group')
                variants = []
                for i in range(len(els)):
                    for c in cands:
                        b = els[:]; b[i] = c
                        variants.append(b)
                for b in sorted(variants, key=lambda b: h(it['id'] + '|'.join(b))):
                    k = frozenset(norm(x) for x in b)
                    if k in seen or len(k) != len(b):
                        continue
                    seen.add(k); wrong_bundles.append(b)
                    if len(wrong_bundles) >= 3:
                        break
            if not wrong_bundles:
                raise SystemExit('여러 개 답의 보기를 만들 수 없어요: ' + it['id'])
            it['wrongBundles'] = wrong_bundles
            opts = [(it['answer'], True)] + [(j.join(b), False) for b in wrong_bundles]
        texts = [norm(t) for t, _ in opts]
        if len(set(texts)) != len(texts) or sum(1 for _, c in opts if c) != 1:
            raise SystemExit('보기가 겹치거나 정답이 하나가 아니에요: ' + it['id'])
        if len(opts) < 4:
            flags.setdefault(it['id'], []).append('options-%d' % len(opts))
        it['_opts'] = opts

    # ---- 근거 자료: 교재 전체 글(쪽) · 흐름 카드 · 교재 핵심 개념 행 · 강의 원고(행 번호만) ----
    # 쪽: pdftotext -layout 출력의 쪽 나눔 문자(\f)만으로 센다(머리글·바닥글·차례 숫자에 기대지 않음).
    # 줄 번호는 원래 글을 '\n'으로 나눈 그대로이고, 줄 안의 \f도 정확히 센다: 줄의 PDF 쪽 = 그 줄의 첫 글자 앞 \f 수 + 1.
    # 한 줄의 글자가 두 쪽에 걸치면 그 줄은 쪽을 쓰지 않는다. 교재 쪽 = PDF 쪽 − 7(본문 PDF 8–144쪽에서만).
    raw_tb = data['textbook']
    if raw_tb.count('\f') != PDF_PAGES:
        raise SystemExit('교재 글의 쪽 나눔(\\f)이 %d개가 아니에요(%d개) — pdftotext -layout 원본인지 확인해 주세요.' % (PDF_PAGES, raw_tb.count('\f')))
    tb = raw_tb.split('\n')
    tbc = [re.sub(r'\s+', '', l) for l in tb]
    page, span_ok, ff = [None] * len(tb), [True] * len(tb), 0
    for i, l in enumerate(tb):
        pages_seen, k = set(), ff
        for ch in l:
            if ch == '\f':
                k += 1
            elif not ch.isspace():
                pages_seen.add(k + 1)
        page[i] = min(pages_seen) if pages_seen else k + 1
        span_ok[i] = len(pages_seen) <= 1
        ff = k
    toc = OrderedDict()
    for i, l in enumerate(tb):
        if page[i] >= BOOK_FIRST_PDF:
            break
        m = re.match(r'^\s*([ⅠⅡⅢⅣⅤⅥⅦ])\s+.*?(\d+)\s*$', l)
        if m and m.group(1) not in toc:
            toc[m.group(1)] = int(m.group(2))
    numerals = list(toc)
    part_range = OrderedDict()
    for k, num in enumerate(numerals):
        part_range[num] = (toc[num] + PDF_OFFSET, (toc[numerals[k + 1]] + PDF_OFFSET - 1) if k + 1 < len(numerals) else PDF_PAGES)

    def pdf_page(i):
        return page[i] if (i is not None and span_ok[i] and BOOK_FIRST_PDF <= page[i] <= PDF_PAGES) else None

    def book_page(i):
        p = pdf_page(i)
        return p - PDF_OFFSET if p else None
    anchors_ok = []
    for text_, want in PAGE_ANCHORS:
        tc_ = re.sub(r'\s+', '', text_)
        hit = next((i for i in range(len(tb)) if tc_ in tbc[i]), None)
        if hit is None or pdf_page(hit) != want:
            raise SystemExit('교재 쪽 확인 실패: %s 는 PDF %d쪽이어야 하는데 %s' % (text_, want, '찾지 못했어요' if hit is None else '%s쪽이에요(%d행)' % (pdf_page(hit), hit + 1)))
        anchors_ok.append(OrderedDict([('text', text_), ('pdfPage', want), ('bookPage', want - PDF_OFFSET), ('line', hit + 1)]))
    for c in data['corrections']['corrections']:
        if c.get('source_pdf_page') and c.get('source_book_page') and c['source_pdf_page'] - c['source_book_page'] != PDF_OFFSET:
            raise SystemExit('정정 기록의 PDF 쪽과 교재 쪽 차이가 %d가 아니에요: %s' % (PDF_OFFSET, c['id']))
    # 확인 문제 쪽(같은 문제를 다시 근거로 쓰지 않음): ‘(n) …’ 줄이 셋 이상인 실제 PDF 쪽
    qpage = {}
    for i, l in enumerate(tb):
        if re.match(r'^\s*\(\d+\)\s*\S', l):
            qpage[page[i]] = qpage.get(page[i], 0) + 1
    confirm_pages = {p for p, n in qpage.items() if n >= 3}
    section, cur_sec = [None] * len(tb), ''
    for i, l in enumerate(tb):
        s = l.strip()
        m = re.match(r'^<표\s*\d+>\s*(.+)$', s) or re.match(r'^\d+\.\s*([가-힣][^·]{1,30})$', s)
        if m:
            cur_sec = m.group(1).strip()
        section[i] = cur_sec

    def tb_ok(i):
        s = tb[i].strip()
        if not s or page[i] in confirm_pages or re.match(r'^[ⅠⅡⅢⅣⅤⅥⅦ]', s) or '·····' in s or re.match(r'^\(\d+\)', s) or re.search(r'\(\s{3,}\)', tb[i]):
            return False
        return len(re.findall(r'\(\d+\)', s)) < 2 and not re.match(r'^\[.*\]$', s) and pdf_page(i) is not None

    def tb_clean(s):
        s = re.sub(r'[★⦁󰊱󰊲󰊳󰊴󰊵]', '', s)
        s = re.sub(r'^\s*[①-⑳]\s*', '', s.strip())
        return re.sub(r'\s{2,}', ' ', s).strip()

    def q_tokens(q):
        out = set()
        for w in re.findall(r'[가-힣A-Za-z0-9]+', strip_tag(str(q).split('\n')[0])):
            for L in range(len(w), 1, -1):
                p_ = w[:L]
                if p_ not in STOP and not re.match(r'^\d+$', p_):
                    out.add(p_)
        return out

    def tok_hits(text_c, toks, names_c):
        hit = [t for t in toks if t in text_c and not any(t in n for n in names_c)]
        hit = [t for t in hit if not any(t != u and t in u for u in hit)]
        return sum(len(t) for t in hit), sorted(hit, key=lambda t: (-len(t), t))

    def names_of(it, text=None):
        txt = text if text is not None else it.get('answer') or ''
        out = [base(txt)] + [base(x) for x in it['a'] if len(elements(x)) < 2] if text is None else [base(text)]
        if text is None and it.get('compound'):
            out += [it['compound']['first']]
        out = [n for n in dict.fromkeys(x.strip() for x in out) if len(re.sub(r'\s+', '', n)) >= 2]
        return out

    def ev_dict(j, text, hits=None):
        if len(text) > 110:
            text = text[:109] + '…'
        return dict(text=text, hits=hits or [], line=j + 1, page=book_page(j), pdf=pdf_page(j), section=section[j])

    def in_rng(i, rng):
        return bool(rng) and rng[0] <= page[i] <= rng[1]

    def find_evidence(names, q, rng=None):
        """정답 이름이 나오는 교재 줄(또는 이름만 있는 표 칸 줄의 같은 쪽 위아래 3줄) 중 문제 말과 가장 많이 겹치는 줄. 그 시대 부의 쪽이면 가산."""
        toks = q_tokens(q)
        names_c = [re.sub(r'\s+', '', n) for n in names]
        best = None
        for n, nc in zip(names, names_c):
            for i in range(len(tb)):
                if nc not in tbc[i] or not tb_ok(i):
                    continue
                label = len(tbc[i]) <= len(nc) + 6
                for j in range(max(0, i - 3), min(len(tb), i + 4)):
                    if j != i and (not label or page[j] != page[i] or not tb_ok(j)):
                        continue
                    sc, hit = tok_hits(tbc[j], toks, names_c)
                    if sc < 2:
                        continue
                    score = sc - abs(j - i) * 0.5 + (1 if j == i else 0) + (2 if in_rng(j, rng) else 0)
                    if best is None or score > best[0]:
                        text = tb_clean(tb[j])
                        text = text if j == i else '%s · %s' % (n, text)
                        best = (score, j, text, hit)
        if not best:
            return None
        sc, j, text, hit = best
        return ev_dict(j, text, hit)

    name_cache = {}

    def name_line(n, rng=None):
        """보기 이름이 실제로 나오는 교재 줄 하나(그 이름의 사실 줄). 이름만 있는 칸 줄은 고르지 않는다. rng가 있으면 그 시대 부의 쪽에서만."""
        nc = re.sub(r'\s+', '', n)
        if len(nc) < 2:
            return None
        key = (nc, rng)
        if key not in name_cache:
            name_cache[key] = None
            for i in range(len(tb)):
                if nc in tbc[i] and tb_ok(i) and len(tbc[i]) >= len(nc) + 6 and (not rng or in_rng(i, rng)):
                    t = tb_clean(tb[i])
                    name_cache[key] = ev_dict(i, t if len(t) <= 90 else t[:89] + '…')
                    break
        return name_cache[key]

    def joint_line(names, rng=None):
        """여러 답이 한 줄에 함께 나오는 교재 줄(묶음 답의 공통 맥락)."""
        ncs = [re.sub(r'\s+', '', n) for n in names if len(re.sub(r'\s+', '', n)) >= 2]
        if len(ncs) < 2:
            return None
        for strict in (True, False):
            for i in range(len(tb)):
                if all(nc in tbc[i] for nc in ncs) and tb_ok(i) and (not strict or not rng or in_rng(i, rng)):
                    return ev_dict(i, tb_clean(tb[i]))
            if not rng:
                break
        return None

    def part_rng(ch):
        num = CH_PART.get(ch)
        return part_range.get(num) if num else None

    flows = []
    for fn in sorted(os.listdir(os.path.join(ROOT, 'media'))):
        if not (fn.startswith('lecture-flow-') and fn.endswith('.js')):
            continue
        m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', open(os.path.join(ROOT, 'media', fn), encoding='utf-8').read(), re.S)
        if not m:
            continue
        fam_ = fn[len('lecture-flow-'):-3]
        for f_ in json.loads(m.group(1)).get('list', []):
            for k_ in f_.get('chunks', []):
                for s_ in k_.get('story', []):
                    flows.append(dict(fam=fam_, file='media/' + fn, flow=f_.get('name', ''), chunk=k_.get('t', ''), w=(k_.get('w') or '').replace('**', ''),
                                      text=s_.replace('**', ''), x=(k_.get('x') or '').replace('**', ''), keys=[re.sub(r'\*\*', '', str(x)) for x in (k_.get('k') or [])]))
    flow_fams = {f_['fam'] for f_ in flows}

    def flow_for(names, toks, fam):
        best = None
        for f_ in flows:
            if fam in flow_fams and f_['fam'] != fam:
                continue
            tc = re.sub(r'\s+', '', f_['text'])
            if not any(re.sub(r'\s+', '', n) in tc for n in names):
                continue
            sc, hit = tok_hits(tc, toks, [re.sub(r'\s+', '', n) for n in names])
            if best is None or sc > best[0]:
                best = (sc, f_)
        return best[1] if best else None

    notes_rows = {}
    nsrc = open(os.path.join(ROOT, 'media', 'textbook-notes.js'), encoding='utf-8').read()
    era_pos = [(m.start(), m.group(1)) for m in re.finditer(r"^\s{2}'?([a-z][a-z-]*)'?:\{", nsrc, re.M)]
    for k, (pos, era_) in enumerate(era_pos):
        end = era_pos[k + 1][0] if k + 1 < len(era_pos) else len(nsrc)
        notes_rows[era_] = [(a_.replace("\\'", "'"), b_.replace("\\'", "'")) for a_, b_ in re.findall(r"\['((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)'\]", nsrc[pos:end])]

    def note_row(names, ch):
        for a_, b_ in notes_rows.get(ch, []) + (notes_rows.get('joseon-early', []) + notes_rows.get('joseon-late', []) if family(ch) == 'joseon' else []):
            ac = re.sub(r'\s+', '', a_)
            if any(re.sub(r'\s+', '', n) in ac for n in names):
                return '%s — %s' % (a_, b_)
        return None

    def teacher_refs(names, toks):
        out = []
        for i, l in enumerate(teacher_lines):
            lc = re.sub(r'\s+', '', l)
            if any(re.sub(r'\s+', '', n) in lc for n in names) and tok_hits(lc, toks, [])[0] >= 2:
                out.append(OrderedDict([('kind', 'teacher'), ('line', i + 1)]))
                if len(out) >= 2:
                    break
        return out

    # 확인 문제의 실제 PDF 쪽: 교재 글의 ‘[ 묶음 제목 ]’ 아래 ‘(번호) 문제 글 (   )’ 줄을 번호 · 문제 글 전체(정규화) · 묶음 제목으로 맞춘다.
    # 후보 쪽이 둘 이상이면 원문 단원(Ⅰ–Ⅶ)의 쪽 범위로 좁히고, 그래도 하나로 증명되지 않으면 쪽을 비운다(지어 쓰지 않음).
    qlines, cur_title = [], ''
    for i, l in enumerate(tb):
        s_ = l.strip()
        m = re.match(r'^\[\s*(.+?)\s*\]$', s_)
        if m and '[' not in m.group(1) and re.search(r'세요|:|적어', m.group(1)):
            cur_title = norm(m.group(1))
            continue
        m = re.match(r'^\((\d{1,2})\)\s*(\S.*)$', s_)
        if m and len(re.findall(r'\(\d{1,2}\)\s*\S', s_)) == 1:
            qlines.append((i, int(m.group(1)), norm(re.sub(r'\(\s*\)\s*$', '', m.group(2))), cur_title))

    def q_same(a, b):
        return bool(a and b) and (a == b or (min(len(a), len(b)) >= 8 and (a.startswith(b) or b.startswith(a))))

    page_lookup = OrderedDict([('found', 0), ('ambiguous', []), ('notFound', [])])
    for it in items.values():
        for s in it['sources']:
            if 'pdfPage' in s:
                continue
            n_ = s.get('number')
            texts = [norm(strip_tag(x.split('\n')[0])) for x in (s['rawQuestion'], s['question'])]
            cands = [q for q in qlines if (n_ is None or q[1] == n_) and any(q_same(q[2], t) for t in texts)]
            if not cands and n_ is not None:
                cands = [q for q in qlines if any(q_same(q[2], t) for t in texts)]
            pn = norm(re.sub(r'^\d+\)\s*', '', s['prompt'] or ''))
            titled = [q for q in cands if pn and q[3] and (pn in q[3] or q[3] in pn)]
            cands = titled or cands
            pages_ = sorted({pdf_page(q[0]) for q in cands if pdf_page(q[0])})
            if len(pages_) > 1:
                pr = part_range.get((s.get('chapterTitle') or ' ')[0])
                pages_ = [p for p in pages_ if pr and pr[0] <= p <= pr[1]]
            if len(pages_) == 1:
                line_ = next(q[0] for q in cands if pdf_page(q[0]) == pages_[0])
                s['pdfPage'], s['bookPage'], s['textbookLine'] = pages_[0], pages_[0] - PDF_OFFSET, line_ + 1
                page_lookup['found'] += 1
            else:
                s['pdfPage'], s['bookPage'], s['textbookLine'] = None, None, None
                page_lookup['ambiguous' if cands else 'notFound'].append(s['id'])

    for it in items.values():
        nm_ = names_of(it) if it['shape'] == 'single' else []
        it['_rng'] = part_rng(it['chapter'])
        it['_ev'] = find_evidence(nm_, it['q'], it['_rng']) if nm_ else None
        it['_toks'] = q_tokens(it['q'])

    # ---- 보기별 풀이(짧은 줄 · **굵게**) ----
    def curated_why(it):
        w = (it['legacy'] or {}).get('why') or ''
        if not w or w.startswith('문제의 핵심 단서는'):
            return None
        if w.startswith('이 단서는'):
            m = re.search(r'함께 외울 흐름:\s*(.+)$', w)
            return ('함께 외울 흐름: ' + m.group(1)) if m else None
        return w

    def labels_of(q):
        return {c: t.strip(' /,') for c, t in re.findall(r'([①-⑳])\s*([^①-⑳\n]+)', q)}

    JOSA = r'(에서|으로|에게|까지|부터|이라는|라는|이다|을|를|이|가|은|는|의|에|로|와|과|도|만)$'

    def dec_terms(it, n=2):
        """결정 단서: 교재 근거 줄과 겹친 문제 말 > 문제의 긴 낱말(조사를 뗀 꼴). 정답 이름은 뺀다."""
        if it.get('_ev') and it['_ev']['hits']:
            return it['_ev']['hits'][:n]
        names_c = [re.sub(r'\s+', '', x) for x in names_of(it)] if it['shape'] == 'single' else []
        words = []
        for w in re.findall(r'[가-힣A-Za-z0-9·]+', strip_tag(it['q'].split('\n')[0])):
            w2 = re.sub(JOSA, '', w)
            if len(w2) >= 2 and w2 not in STOP and not re.match(r'^\d+$', w2) and not any(w2 in nc or nc in w2 for nc in names_c):
                words.append(w2)
        return sorted(dict.fromkeys(words), key=lambda w: (-len(w), w))[:n]

    def jong(w):
        c = re.sub(r'[^가-힣0-9A-Za-z]', '', str(w))[-1:]
        if not c:
            return False
        if '가' <= c <= '힣':
            return (ord(c) - 0xAC00) % 28 != 0
        return c in '013678LMNRlmnr'

    def jo(w, pair):
        a_, b_ = pair.split('/')
        return a_ if jong(w) else b_

    def fact_or_line(name, it):
        cl = fact_clues(name, it, 2)
        if cl:
            return '**%s**의 단서: %s' % (base(name), ' · '.join('‘%s’' % c for c in cl))
        nl = name_line(base(name), it.get('_rng')) or name_line(base(name))
        if nl:
            return '**%s**: 교재 ‘%s’' % (base(name), nl['text'])
        return None

    def flow_line(f_):
        return '흐름 ‘%s’ › %s%s: %s' % (f_['flow'], f_['chunk'], (' (%s)' % f_['w']) if f_['w'] else '', f_['text'])

    def flow_ref(f_):
        return OrderedDict([('kind', 'flow'), ('file', f_['file']), ('flow', f_['flow']), ('chunk', f_['chunk'])])

    def tb_ref(e):
        return OrderedDict([('kind', 'textbook'), ('line', e['line']), ('pdfPage', e['pdf']), ('page', e['page']), ('section', e['section'] or None)])

    def best_line(toks, min_score=4, rng=None):
        """이름 없이 문제 말만으로 찾는 교재 줄(순서·짝짓기 문항). 문제 말과 가장 많이 겹치는 줄(그 시대 부의 쪽이면 가산)."""
        best = None
        for i in range(len(tb)):
            if not tb_ok(i) or len(tbc[i]) < 8:
                continue
            sc, hit = tok_hits(tbc[i], toks, [])
            if sc >= min_score and len(hit) >= 2:
                sc2 = sc + (2 if in_rng(i, rng) else 0)
                if best is None or sc2 > best[0]:
                    best = (sc2, i, hit)
        if not best:
            return None
        sc, i, hit = best
        return ev_dict(i, tb_clean(tb[i]), hit)

    def flow_by_toks(toks, fam, min_score=4, min_hits=2):
        best = None
        for f_ in flows:
            if fam in flow_fams and f_['fam'] != fam:
                continue
            sc, hit = tok_hits(re.sub(r'\s+', '', f_['text']), toks, [])
            if sc >= min_score and len(hit) >= min_hits and (best is None or sc > best[0]):
                best = (sc, f_)
        return best[1] if best else None

    ev_cache = {}

    def ev_of(name, q, rng=None):
        k = (name, q, rng)
        if k not in ev_cache:
            ev_cache[k] = find_evidence([base(name)], q, rng) if len(norm(base(name))) >= 2 else None
        return ev_cache[k]

    book_ctx = {}
    for sid, anchors_ in BOOK_CONTEXT.items():
        got_ = []
        for a_ in anchors_:
            ac = re.sub(r'\s+', '', a_)
            i_ = next((i for i in range(len(tb)) if ac in tbc[i] and pdf_page(i)), None)
            if i_ is None:
                raise SystemExit('교재에서 맥락 줄을 찾지 못했어요: %s %s' % (sid, a_))
            got_.append(ev_dict(i_, tb_clean(tb[i_])))
        book_ctx[sid] = got_

    def book_ctx_of(it):
        return next((book_ctx[s['id']] for s in it['sources'] if s['id'] in book_ctx), None)

    def source_years(it):
        yrs = next((s['answer'] for s in it['sources'] if re.search(r'[①-⑳]\s*\(\d', s['answer'])), None)
        return OrderedDict(re.findall(r'([①-⑳])\s*\(([^)]*)\)', yrs)) if yrs else OrderedDict()

    def uniq(xs, n):
        out_, seen_ = [], set()
        for x in xs:
            k = norm(x)
            if x and k and k not in seen_:
                seen_.add(k); out_.append(x)
            if len(out_) >= n:
                break
        return out_

    def build_overview(it, out):
        """문항 풀이 카드: 정답 · 왜 · 결정 단서 · 흐름 · 외울 말 · 헷갈림 · 근거. 근거 없는 사실·날짜는 쓰지 않는다."""
        shape, fam, q = it['shape'], family(it['chapter']), it['q']
        toks, dec, ev = it['_toks'], it['_dec'], it.get('_ev')
        reason, clue, context, memory, contrast, refs = [], [], [], [], [], []
        wrongs = [o for o in out if not o['correct']]
        answer = it['answer']
        if shape == 'single':
            X = it['compound']['first'] if it['compound'] else base(answer)
            names = names_of(it)
            if ev:
                reason.append('교재: ‘%s’' % ev['text'])
                refs.append(tb_ref(ev))
            cw = curated_why(it)
            if cw:
                reason.append(cw)
                refs.append(OrderedDict([('kind', 'legacy-why')]))
            nr = note_row(names, it['chapter'])
            if nr:
                (context if reason else reason).append('교재 핵심 개념: %s' % nr)
                refs.append(OrderedDict([('kind', 'notes'), ('era', it['chapter'])]))
            if not reason:
                nl = name_line(X, it['_rng']) or name_line(X)
                if nl:
                    reason.append('**%s**: 교재 ‘%s’' % (X, nl['text']))
                    refs.append(tb_ref(nl))
            same = fact_clues(answer, it)
            if same:
                (context if reason else reason).append('같은 답의 다른 단서: ' + ' · '.join('‘%s’' % c for c in same))
                refs.append(OrderedDict([('kind', 'catalog')]))
            if not reason:
                reason.append('문제의 %s%s **%s**%s 가리켜요.' % ('·'.join('**%s**' % t for t in dec) or '단서', jo(dec[-1] if dec else '단서', '이/가'), answer, jo(answer, '을/를')))
            clue = dec or uniq([w for w in re.findall(r'[가-힣A-Za-z0-9]{2,}', strip_tag(q.split('\n')[0])) if w not in STOP], 2)
            fw = flow_for(names, toks, fam)
            if fw:
                context.insert(0, flow_line(fw))
                refs.append(flow_ref(fw))
            if it['compound']:
                fk = flow_for([it['compound']['king']], toks, fam)
                if fk and fk is not fw:
                    context.append(flow_line(fk))
                    refs.append(flow_ref(fk))
            memory = uniq([X] + ([it['compound']['king']] if it['compound'] else []) + dec + [k for k in (fw['keys'] if fw else []) if any(re.sub(r'\s+', '', n) in re.sub(r'\s+', '', k) for n in names)], 5)
            for o in wrongs:
                if it['compound'] and re.match(r'^(.*?)\(([^)]*)\)$', o['text']):
                    a_, b_ = re.match(r'^(.*?)\(([^)]*)\)$', o['text']).groups()
                    if norm(a_) == norm(it['compound']['first']):
                        contrast.append('이 문제의 **%s**%s **%s** 때 — **%s**%s 짝지으면 틀려요.' % (a_, jo(a_, '은/는'), it['compound']['king'], b_, jo(b_, '과/와')))
                        continue
                    nm = a_
                else:
                    nm = base(o['text'])
                fl = fact_or_line(nm, it)
                if fl:
                    contrast.append(fl)
                if len(contrast) >= 3:
                    break
        elif shape == 'order':
            lab = labels_of(q)
            yrs = source_years(it)
            seq = it['sequence']
            answer = ' → '.join('%s %s' % (c, short(lab.get(c, ''), 16)) for c in seq)
            reason.append('올바른 차례: ' + answer)
            if yrs:
                reason.append('교재 정답의 연도: ' + ' · '.join('%s %s' % (c, y) for c, y in yrs.items()))
                refs.append(OrderedDict([('kind', 'confirm-answer')]))
            for c in seq:
                e_ = best_line(q_tokens(lab.get(c, '')), rng=it['_rng'])
                if e_ and len(context) < 3:
                    context.append('%s: 교재 ‘%s’' % (c, e_['text']))
                    refs.append(tb_ref(e_))
            fw = flow_by_toks(toks, fam)
            if fw:
                context.insert(0, flow_line(fw))
                refs.append(flow_ref(fw))
            clue = uniq([short(lab.get(c, ''), 14) for c in seq], 5)
            memory = uniq(['%s%s' % (short(lab.get(c, ''), 12), (' %s' % yrs[c]) if c in yrs else '') for c in seq], 6)
            for o in wrongs[:2]:
                w = circ_seq(o['text'])
                k = next(i for i in range(len(w)) if w[i] != seq[i])
                c = seq[k]
                contrast.append('**%s** %s%s **%s** %s보다 먼저예요%s.' % (c, short(lab.get(c, ''), 14), jo(short(lab.get(c, ''), 14) or str(CIRC.index(c) + 1), '이/가'), w[k], short(lab.get(w[k], ''), 14),
                                (' (%s · %s)' % (yrs[c], yrs[w[k]])) if c in yrs and w[k] in yrs else ''))
        elif shape == 'map':
            lab = labels_of(q)
            for lb, its in it['mapping']:
                reason.append('%s → %s' % (lb, ' · '.join('%s %s' % (c, short(lab.get(c, ''), 14)) for c in its)))
            e_ = None if book_ctx_of(it) else best_line(toks, rng=it['_rng'])
            if e_:
                context.append('교재: ‘%s’' % e_['text'])
                refs.append(tb_ref(e_))
            fw = flow_by_toks(toks, fam)
            if fw:
                context.insert(0, flow_line(fw))
                refs.append(flow_ref(fw))
            clue = dec or [lb for lb, _ in it['mapping']]
            memory = uniq(['%s %s' % (lb, ','.join(its)) for lb, its in it['mapping']], 6)
            for o in wrongs[:2]:
                contrast.extend(o['review'][:1])
        else:
            els = it['elements']
            jl = joint_line([base(x) for x in els], it['_rng'])
            if jl:
                reason.append('교재: ‘%s’' % jl['text'])
                refs.append(tb_ref(jl))
            for x in els:
                e_ = ev_of(x, q, it['_rng']) or name_line(base(x), it['_rng'])
                if e_ and len(reason) < 4 and not (jl and e_['line'] == jl['line']):
                    reason.append('**%s**: 교재 ‘%s’' % (base(x), e_['text']))
                    refs.append(tb_ref(e_))
            reason.append('**%s** — %s' % (answer, '칸의 순서까지 맞아야 해요.' if shape == 'roles' else '모두 들어 있어야 정답이에요(순서는 상관없어요).'))
            for x in els:
                fw = flow_for([base(x)], toks, fam)
                if fw and len(context) < 2 and not any(r_.get('chunk') == fw['chunk'] for r_ in refs):
                    context.append(flow_line(fw))
                    refs.append(flow_ref(fw))
            nr = note_row([base(x) for x in els], it['chapter'])
            if nr:
                context.append('교재 핵심 개념: %s' % nr)
                refs.append(OrderedDict([('kind', 'notes'), ('era', it['chapter'])]))
            clue = dec or [base(x) for x in els]
            memory = uniq([base(x) for x in els], 6)
            cn = {norm(x) for x in els}
            for o in wrongs:
                for w in [x for x in SPLIT_RE.split(o['text']) if x]:
                    if norm(w) in cn or any(norm(w) in c_ for c_ in contrast):
                        continue
                    fl = fact_or_line(w, it)
                    contrast.append(fl or ('**%s**%s 이 묶음의 답이 아니에요.' % (w, jo(w, '은/는'))))
                if shape == 'roles' and not contrast:
                    contrast.extend(o['review'][:1])
                if len(contrast) >= 3:
                    break
        if not clue:
            clue = [short(q, 20)]
        bc = book_ctx_of(it)
        if bc:
            context[:0] = ['교재: ‘%s’' % e_['text'] for e_ in bc]
            refs[:0] = [tb_ref(e_) for e_ in bc]
        if not context:
            # 흐름 카드·핵심 개념이 없을 때: 같은 시대 부에서 정답(묶음이면 그 답들)이 나오는 교재 줄, 그다음 문제 말과 겹치는 흐름 카드·교재 줄
            nms = names_of(it) if shape == 'single' else [base(x) for x in it.get('elements', [])]
            got, reused = None, None
            for n in nms:
                got = name_line(n, it['_rng'])
                if got and not any(r_.get('kind') == 'textbook' and r_.get('line') == got['line'] for r_ in refs):
                    context.append('**%s** · 교재(%s): ‘%s’' % (n, CH_TITLE.get(it['chapter'], '같은 시대'), got['text']))
                    refs.append(tb_ref(got))
                    break
                if got and reused is None:
                    reused = (n, got)
                got = None
            if not got:
                fw = flow_by_toks(toks, fam, min_score=2, min_hits=1)
                if fw:
                    context.append(flow_line(fw))
                    refs.append(flow_ref(fw))
                else:
                    e_ = best_line(toks, min_score=3, rng=it['_rng'])
                    if e_ and in_rng(e_['line'] - 1, it['_rng']):
                        context.append('교재(%s): ‘%s’' % (CH_TITLE.get(it['chapter'], '같은 시대'), e_['text']))
                        if not any(r_.get('kind') == 'textbook' and r_.get('line') == e_['line'] for r_ in refs):
                            refs.append(tb_ref(e_))
            if not context and reused:
                # 정답이 나오는 같은 시대 교재 줄이 이미 ‘왜’의 근거로 쓰였어도 흐름 칸에 쓴다 — 겹치지 않게 하는 것은 근거(refs) 목록뿐
                n, got = reused
                context.append('**%s** · 교재(%s): ‘%s’' % (n, CH_TITLE.get(it['chapter'], '같은 시대'), got['text']))
        if not context:
            ctx = '%s · %s' % (it['sources'][0]['chapterTitle'] if it['sources'] else CH_TITLE.get(it['chapter'], ''), short(it['prompt'], 30))
            context.append('범위: ' + ctx.strip(' ·'))
            it['_rangeOnly'] = True
        if not contrast:
            fw = next((f_ for f_ in flows if any(r_.get('chunk') == f_['chunk'] and r_.get('kind') == 'flow' for r_ in refs) and f_['x']), None)
            if fw:
                contrast.append('헷갈리지 않기: ' + fw['x'])
            else:
                ws = [base(o['text']) for o in wrongs[:2]]
                contrast.append('보기 %s%s 같은 묶음의 다른 답 — 이 문제의 단서 %s%s 이어지지 않아요.' % (
                    '·'.join('**%s**' % w for w in ws), jo(ws[-1], '은/는'), '·'.join('**%s**' % t for t in clue[:2]), jo(clue[:2][-1] if clue else '', '과/와')))
        refs += teacher_refs(names_of(it) if shape == 'single' else [base(x) for x in it.get('elements', [])], toks)
        for s in it['sources']:
            refs.append(OrderedDict([('kind', 'confirm'), ('id', s['id']), ('pdfPage', s.get('pdfPage'))]))
        it['_weak'] = not any(r_['kind'] in ('textbook', 'flow', 'notes', 'legacy-why') for r_ in refs)
        return OrderedDict([('answer', answer), ('ask', it['ask']), ('reason', reason), ('clue', clue), ('context', context),
                            ('memory', memory or [base(answer)]), ('contrast', contrast), ('refs', refs)])

    for it in items.values():
        shape, opts, out = it['shape'], it['_opts'], []
        ask = it['ask']
        dec = dec_terms(it)
        dec_md = '·'.join('**%s**' % t for t in dec)
        ev = it.get('_ev')
        it['_dec'] = dec
        for text, correct in opts:
            lines = []
            if shape == 'single':
                if correct:
                    lines.append('**%s** — %s%s정답이에요.' % (text, ('결정 단서 %s → ' % dec_md) if dec else '', ('묻는 %s의 ' % ask) if ask else '이 문제의 '))
                    if ev:
                        lines.append('교재: ‘%s’' % ev['text'])
                    same = fact_clues(text, it)
                    if same:
                        lines.append('같은 답의 다른 단서: ' + ' · '.join('‘%s’' % c for c in same))
                    cw = curated_why(it)
                    if cw:
                        lines.append(cw)
                    notes = sorted({s['answer'] for s in it['sources'] if '(' in s['answer'] and norm(s['answer']) != norm(text)})
                    for n_ in notes:
                        lines.append('교재 정답 표기: %s' % n_)
                    if len(lines) < 2:
                        nr = note_row(names_of(it), it['chapter'])
                        nl = None if nr else name_line(base(text))
                        lines.append(('교재 핵심 개념: %s' % nr) if nr else (('교재: ‘%s’' % nl['text']) if nl else '문제 글의 단서: ‘%s’' % short(it['q'], 40)))
                elif it['compound'] and re.match(r'^(.*?)\(([^)]*)\)$', text):
                    a_, b_ = re.match(r'^(.*?)\(([^)]*)\)$', text).groups()
                    X, Y = it['compound']['first'], it['compound']['king']
                    if norm(a_) == norm(X):
                        lines.append('**%s**까지는 맞지만 짝인 왕이 틀렸어요.' % a_)
                        lines.append('교재 정답은 **%s** — 이 문제의 일%s **%s** 때예요.' % (it['answer'], ('(%s)' % dec_md + jo(dec[-1], '은/는')) if dec else '은', Y))
                        fl = fact_or_line(b_, it)
                        if fl:
                            lines.append(fl)
                    elif norm(b_) == norm(Y):
                        lines.append('**%s** 때 일인 것은 맞지만, 답은 **%s**%s.' % (b_, X, jo(X, '이에요/예요')))
                        lines.append('**%s**%s 이 문제%s의 답이 아니에요.' % (a_, jo(a_, '은/는'), ('(%s)' % dec_md) if dec else ''))
                        fl = fact_or_line(a_, it)
                        if fl:
                            lines.append(fl)
                    else:
                        lines.append('**%s** — 이 문제의 답이 아니에요. 교재 정답은 **%s**%s.' % (text, it['answer'], jo(it['answer'], '이에요/예요')))
                        fl = fact_or_line(a_, it)
                        if fl:
                            lines.append(fl)
                    if ev:
                        lines.append('정답 근거 · 교재: ‘%s’' % ev['text'])
                    if len(lines) < 2:
                        lines.append(('결정 단서 %s → **%s**' % (dec_md, it['answer'])) if dec else '같은 묶음(%s)의 다른 답이에요.' % short(it['prompt'], 28))
                else:
                    yb = base(text)
                    if dec:
                        lines.append('**%s** — 이 문제의 답이 아니에요. 결정 단서 %s%s **%s** 쪽이에요.' % (text, dec_md, jo(dec[-1], '은/는'), it['answer']))
                    else:
                        lines.append('**%s** — 이 문제의 답이 아니에요. 정답은 **%s**%s.' % (text, it['answer'], jo(it['answer'], '이에요/예요')))
                    fl = fact_or_line(text, it)
                    lines.append(fl or '같은 묶음(%s)의 다른 답이에요.' % short(it['prompt'], 28))
                    fw = flow_for([yb], set(), family(it['chapter'])) if len(norm(yb)) >= 2 else None
                    if fw and fw['w']:
                        lines.append('**%s**%s ‘%s’ 흐름(%s)이에요.' % (yb, jo(yb, '은/는'), fw['chunk'], fw['w']))
            elif shape == 'order':
                lab = labels_of(it['q'])
                if correct:
                    lines.append('**정답 순서** %s' % text)
                    lines.append('차례: ' + ' → '.join('%s %s' % (c, short(lab.get(c, ''), 14)) for c in it['sequence']))
                    yrs = source_years(it)
                    if yrs:
                        lines.append('교재 정답의 연도: ' + ' · '.join('%s %s' % (c, y) for c, y in yrs.items()))
                else:
                    w = circ_seq(text)
                    k = next(i for i in range(len(w)) if w[i] != it['sequence'][i])
                    c = it['sequence'][k]
                    lines.append('%d번째부터 달라요. 정답은 **%s** %s, 이 보기는 **%s** %s.' % (k + 1, c, short(lab.get(c, ''), 18), w[k], short(lab.get(w[k], ''), 18)))
                    yrs = source_years(it)
                    lines.append('**%s**%s **%s**보다 먼저예요%s.' % (c, jo(str(CIRC.index(c) + 1), '이/가'), w[k],
                                 (' (교재 정답 연도 %s %s · %s %s)' % (c, yrs[c], w[k], yrs[w[k]])) if c in yrs and w[k] in yrs else ''))
            elif shape == 'map':
                if correct:
                    lines.append('**짝** %s' % text)
                    for e_ in (book_ctx_of(it) or []):
                        lines.append('교재: ‘%s’' % e_['text'])
                    lines.append('같은 칸 안의 번호 순서는 상관없어요.')
                else:
                    cur = dict((a, b) for a, b in [(seg.split(' ')[0], seg.split(' ')[1].split(',')) for seg in text.split(' / ')])
                    for lab, items_ in it['mapping']:
                        if sorted(cur.get(lab, []), key=CIRC.index) != items_:
                            lines.append('%s: 정답 **%s**, 이 보기 %s' % (lab, ','.join(items_), ','.join(cur.get(lab, []))))
            else:
                els = it['elements']
                if correct:
                    lines.append('**%s** — %s%s' % (text, ('결정 단서 %s → ' % dec_md) if dec else '', '칸의 순서까지 맞아야 해요.' if shape == 'roles' else '모두 들어 있어야 정답이에요(순서는 상관없어요).'))
                    jl = joint_line([base(x) for x in els], it['_rng'])
                    if jl:
                        lines.append('교재: ‘%s’' % jl['text'])
                    for x in els[:3]:
                        e_ = ev_of(x, it['q'], it['_rng']) or name_line(base(x), it['_rng'])
                        if e_ and not (jl and e_['line'] == jl['line']):
                            lines.append('**%s**: 교재 ‘%s’' % (base(x), e_['text']))
                    if len(lines) < 2:
                        fw = next((f for f in (flow_for([base(x)], it['_toks'], family(it['chapter'])) for x in els) if f), None)
                        lines.append(flow_line(fw) if fw else '같은 묶음(%s)의 답을 모두 골라야 해요.' % short(it['prompt'], 28))
                else:
                    b = [x for x in SPLIT_RE.split(text) if x]
                    if shape == 'roles':
                        for i, (c, w) in enumerate(zip(els, b)):
                            if norm(c) != norm(w):
                                lines.append('%d번째 칸: 정답 **%s**, 이 보기 %s' % (i + 1, c, w))
                                e_ = ev_of(c, it['q'], it['_rng'])
                                if e_:
                                    lines.append('**%s**: 교재 ‘%s’' % (base(c), e_['text']))
                    else:
                        cn = {norm(x) for x in els}
                        for w in b:
                            if norm(w) not in cn:
                                lines.append('**%s**%s 이 묶음에 들어가지 않아요.' % (w, jo(w, '은/는')))
                                fl = fact_or_line(w, it)
                                if fl:
                                    lines.append(fl)
                        bn = {norm(x) for x in b}
                        miss = [x for x in els if norm(x) not in bn]
                        if miss:
                            lines.append('빠진 답: ' + '·'.join('**%s**' % x for x in miss))
                            for x in miss[:2]:
                                e_ = ev_of(x, it['q'], it['_rng'])
                                if e_:
                                    lines.append('**%s**: 교재 ‘%s’' % (base(x), e_['text']))
            if not lines:
                raise SystemExit('보기 풀이가 비었어요: %s %s' % (it['id'], text))
            out.append(OrderedDict([('id', 'o' + h(it['id'] + '\x1f' + text)), ('text', text), ('correct', correct), ('review', lines)]))
        it['options'] = out
        del it['_opts']
        it['overview'] = build_overview(it, out)
        for k_ in ('reason', 'clue', 'context', 'memory', 'contrast'):
            if not it['overview'][k_]:
                raise SystemExit('풀이 카드의 %s가 비었어요: %s' % (k_, it['id']))
        it['rv'] = h(json.dumps([[o['review'] for o in out], {k_: v_ for k_, v_ in it['overview'].items() if k_ != 'refs'}], ensure_ascii=False), 12)
        it['v'] = h(json.dumps([it['q'], it['prompt'], it.get('ask'), [o['text'] for o in out if o['correct']], sorted(o['text'] for o in out)], ensure_ascii=False), 16)
        it['dedup'] = h(norm(it['q']) + '|' + norm(next(o['text'] for o in out if o['correct'])), 12)
        if it['origin'] == 'legacy':
            it['why'], it['cue'] = it['legacy']['why'], it['legacy']['cue']
        else:
            it['why'], it['cue'] = None, '%s → %s' % (short(it['q'], 40), it['answer'])
        if len({o['id'] for o in out}) != len(out):
            raise SystemExit('보기 ID가 겹쳐요: ' + it['id'])

    # ---- 장별 풀 · 기본 20 · 세트 ----
    chapters = OrderedDict()
    for ch, arr in legacy.items():
        n = len(arr)
        cnt = min(SET_SIZE, n)
        core = ['legacy-%s-%03d' % (ch, (i * n) // cnt) for i in range(cnt)]
        chapters[ch] = OrderedDict([('legacyCount', n), ('core', core), ('pool', ['legacy-%s-%03d' % (ch, i) for i in range(n)])])
    legacy_dedup = {}
    for it in items.values():
        if it['origin'] == 'legacy':
            legacy_dedup.setdefault((it['chapter'], it['dedup']), it['id'])
    for it in items.values():
        if it['origin'] != 'source':
            continue
        if it['chapter'] not in chapters:
            chapters[it['chapter']] = OrderedDict([('legacyCount', 0), ('core', []), ('pool', [])])
        twin = legacy_dedup.get((it['chapter'], it['dedup']))
        if twin:
            it['duplicateOf'] = twin
            flags.setdefault(it['id'], []).append('duplicate-of-' + twin)
            continue
        chapters[it['chapter']]['pool'].append(it['id'])
    for ch, c in chapters.items():
        c['sourceOnly'] = sum(1 for x in c['pool'] if not x.startswith('legacy-'))
        c['poolCount'] = len(c['pool'])
        c['sets'] = (len(c['pool']) + SET_SIZE - 1) // SET_SIZE
        if not c['core']:
            c['core'] = c['pool'][:SET_SIZE]

    # ---- 덮개 검사: 기존 666 · 교재 642 · 역할 ----
    legacy_ids = [x for x in items if x.startswith('legacy-')]
    if len(legacy_ids) != 666:
        raise SystemExit('기존 문항 ID가 666개가 아니에요.')
    src_seen = {s['id'] for it in items.values() for s in it['sources']}
    if len(src_seen) != 642:
        raise SystemExit('교재 문항 642개가 모두 문항에 이어지지 않았어요.')
    for sid in ('check-21-08', 'check-21-11'):
        for iid in source_to_items[sid]:
            it = items[iid]
            if norm(it['answer']) != norm('여진') or any(norm(o['text']) == norm('조선') for o in it['options']):
                raise SystemExit('6진·무역소 문항의 정답·보기가 맞지 않아요: ' + iid)

    out_items = OrderedDict()
    keep = ['id', 'chapter', 'relatedEras', 'origin', 'shape', 'prompt', 'ask', 'q', 'a', 'answer', 'compound', 'options', 'why', 'cue', 'overview', 'v', 'rv', 'dedup', 'kind', 'legacy', 'sources']
    for iid, it in items.items():
        rec = OrderedDict((k, it.get(k)) for k in keep)
        if it.get('duplicateOf'):
            rec['duplicateOf'] = it['duplicateOf']
        if it['lowConfidence'] or it['id'] in flags:
            rec['flags'] = sorted(set(flags.get(it['id'], []) + (['kind-from-group'] if it['lowConfidence'] else [])))
        out_items[iid] = rec
    counts = OrderedDict([('items', len(out_items)), ('legacy', 666), ('source', 642),
                          ('sourceAttachedToLegacy', sum(1 for s, l in source_to_items.items() if l and l[0].startswith('legacy-'))),
                          ('sourceOnly', sum(1 for i in out_items.values() if i['origin'] == 'source')),
                          ('sourceDuplicateOfLegacy', sum(1 for i in out_items.values() if i.get('duplicateOf'))),
                          ('pool', sum(c['poolCount'] for c in chapters.values())),
                          ('shapes', OrderedDict(sorted(((s, sum(1 for i in out_items.values() if i['shape'] == s)) for s in {i['shape'] for i in out_items.values()}))))])
    catalog = OrderedDict([('schema', 1), ('generatedBy', 'scripts/build_quiz_catalog.py'), ('setSize', SET_SIZE),
                           ('source', OrderedDict([('libraryId', data['source'].get('sourceLibraryId')), ('readExportSha256', data['source'].get('sourceReadExportSHA256')),
                                                   ('textbookPdfSha256', data['corrections'].get('source_pdf_sha256')), ('inputs', shas)])),
                           ('counts', counts), ('chapters', chapters), ('questions', out_items),
                           ('sourceIndex', OrderedDict((sid, lids) for sid, lids in source_to_items.items()))])
    js = '/* 확인 문제 카탈로그(객관식) — scripts/build_quiz_catalog.py가 만든 파일입니다. 손으로 고치지 마세요. 근거: docs/quiz-catalog-sources.md */\n' \
         'window.HANQ_QUIZ_CATALOG=' + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + ';\n'
    with open(os.path.join(ROOT, 'media', 'quiz-catalog.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    cmap = OrderedDict([('generatedBy', 'scripts/build_quiz_catalog.py'), ('inputs', shas), ('counts', counts),
                        ('chapters', OrderedDict((ch, OrderedDict([('legacyCount', c['legacyCount']), ('sourceOnly', c['sourceOnly']), ('poolCount', c['poolCount']), ('sets', c['sets'])])) for ch, c in chapters.items())),
                        ('sourceToItems', catalog['sourceIndex']),
                        ('distinctContextPairs', [[a, source_to_items[a], b, source_to_items[b]] for a, b in DISTINCT_CONTEXT_PAIRS]),
                        ('corrections', sorted(corr)), ('clarifications', sorted(clar)),
                        ('flags', OrderedDict(sorted((k, sorted(set(v))) for k, v in flags.items()))),
                        ('kindFromGroup', sorted(i for i, it in items.items() if it['lowConfidence'])),
                        ('pagination', OrderedDict([
                            ('method', 'pdftotext -layout 출력의 \\f 수로 PDF 쪽을 셈(줄의 첫 글자 앞 \\f 수 + 1), 교재 쪽 = PDF 쪽 - 7(PDF 8–144쪽)'),
                            ('pdfPages', PDF_PAGES), ('formFeeds', raw_tb.count('\f')), ('anchorsVerified', anchors_ok),
                            ('partRangesPdf', OrderedDict((k, list(v)) for k, v in part_range.items())),
                            ('confirmQuestionPages', OrderedDict([('found', page_lookup['found']), ('ambiguousNull', sorted(page_lookup['ambiguous'])), ('notFoundNull', sorted(page_lookup['notFound']))])),
                            ('correctionAnswerPages', OrderedDict(sorted((c['id'], c.get('source_pdf_page')) for c in data['corrections']['corrections']))),
                            ('clarificationPages', OrderedDict(sorted((c['id'], c.get('source_pdf_page')) for c in data['clarifications'])))])),
                        ('overviewEvidence', OrderedDict([
                            ('withTextbookLine', sum(1 for it in items.values() if any(r_['kind'] == 'textbook' for r_ in it['overview']['refs']))),
                            ('withFlowCard', sum(1 for it in items.values() if any(r_['kind'] == 'flow' for r_ in it['overview']['refs']))),
                            ('withTeacherLine', sum(1 for it in items.values() if any(r_['kind'] == 'teacher' for r_ in it['overview']['refs']))),
                            ('teacherScript', bool(teacher_lines)),
                            ('confirmWithPdfPage', len({s['id'] for it in items.values() for s in it['sources'] if s.get('pdfPage')}))])),
                        ('overviewWeak', sorted(i for i, it in items.items() if it.get('_weak'))),
                        ('overviewContextRangeOnly', sorted(i for i, it in items.items() if it.get('_rangeOnly')))])
    with open(os.path.join(ROOT, 'docs', 'quiz-catalog-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('확인 문제', counts['items'], '· 기존', 666, '· 교재', 642, '· 교재만', counts['sourceOnly'], '· 풀', counts['pool'])


if __name__ == '__main__':
    main()
