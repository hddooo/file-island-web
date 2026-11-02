# -*- coding: utf-8 -*-
"""독도와 간도 웹툰(media/islands-comic.html)을 두 주제(독도 · 간도)의 한 페이지 학습으로 다시 엮는다.

  python3 scripts/build_islands_comic.py

- 기존 파일의 <head>(스타일)와 </main> 뒤 스크립트는 그대로 두고, 본문만 아래 SCENES 정의로 다시 쓴다(여러 번 실행해도 결과가 같다).
- 장면 7개의 id·제목·꼭 기억 단서는 기존 웹툰 그대로다. 주제를 나누려고 순서만 바꿨다: 독도(scene-1 → scene-3 → treaties-1904) → 간도(scene-2 → stele-mountain → scene-4 → independence-battles).
- 그림은 islands-panels.png(2열×4행 그림판, 바이트 그대로)의 칸 하나를 통째로 원래 비율(4:3)로 보여 준다. 확대·자르기 없음.
  예전에 확대해 쓰던 마지막 장면은 앞 장면과 같은 칸 전체를 다시 쓰고, 그렇다고 화면에 밝힌다.
- 말풍선은 그림 밖(아래)에 둔다. 기록에 이름이 없는 화자는 ‘설명용 인물’, 뒷날을 미리 짚는 말은 ‘해설’로 밝힌다.
- 주제 머리와 ‘이 부분에서 외울 것’ 카드는 media/lecture-flow-islands.js의 /*FLOW-JSON*/ … /*END-FLOW-JSON*/를 읽는다.
- 모든 글은 독도와 간도 노트 카드 5장(index.html)과 기존 장면 단서에 있는 사실만 쓴다. 새 정치적 주장·연도를 더하지 않는다.
- 출력: media/islands-comic.html, docs/islands-comic-map.json. 시간·난수·개인 경로를 쓰지 않는다.
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILE = 'islands-comic.html'
SPRITE, COLS, ROWS = 'islands-panels.png', 2, 4
e = lambda s: html.escape(s, quote=True)

# 장면 정의(화면 순서). cell: 그림판 칸 (열, 행). orig: 원래 장면 번호(data-orig) · added: 뒤에 덧붙인 장면(data-added="density")
#  a, b: (화자, 대사) — 학습용 요약 대화. steps: [(이름, cause|dev|res|item, 문장)] · key: 기존 꼭 기억 단서(그대로) · next: 다음 장면으로 잇는 말
SCENES = [
    dict(id='scene-1', orig=1, cell=(0, 0), label='독도 · 우산국', title='섬으로 향하다', when='신라 지증왕 때 · 우산국 복속',
         alt='섬으로 향하다 장면', a=('이사부', '저 섬의 우산국을 복속시키러 갑니다.'), b=('신라 군사', '지증왕께 이 소식을 전해야겠군요.'),
         steps=[('전개', 'dev', '신라 지증왕 때 이사부가 바다 건너 우산국을 복속했다.'),
                ('구분', 'item', '우산국 복속은 신라의 일이다. 뒤의 러일전쟁 때 일본의 독도 불법 편입과 같은 사건으로 합치지 않는다.')],
         key='지증왕 때 이사부 = 우산국 복속',
         next=('여기서 시대가 크게 건너뛰어요. 아주 오랜 뒤인 러일전쟁 때, 독도를 둘러싼 위기가 찾아왔다.', False)),
    dict(id='scene-3', orig=3, cell=(1, 2), label='독도 · 러일전쟁', title='바다의 위기', when='러일전쟁 중 · 일본의 독도 불법 편입',
         alt='바다의 위기 장면', a=('대한제국 사람', '일본이 전쟁을 틈타 독도를 노립니다.'), b=('동료', '러일전쟁 때 불법 편입했다는 단서를 기억해요.'),
         steps=[('배경', 'cause', '러일전쟁이 벌어지자 일본은 전쟁을 틈타 독도를 노렸다.'),
                ('결과', 'res', '러일전쟁 중 일본이 독도를 불법 편입했다.')],
         key='러일전쟁 중 일본의 독도 불법 편입',
         next=('섬을 노린 같은 시기, 나라의 권리도 하나씩 빼앗겼다.', False)),
    dict(id='treaties-1904', added=True, cell=(0, 2), label='독도 · 러일전쟁 무렵 국권 침탈', title='전쟁을 틈탄 조약들', when='러일전쟁 무렵 · 한일의정서 → 제1차 한일협약 → 을사늑약',
         alt='배 위에서 바다 건너 섬을 바라보는 대한제국 관리들', a=('대한제국 관리', '일본이 한일의정서를 강요하고 있습니다.'), b=('동료', '제1차 한일협약, 을사늑약으로 이어지겠군요.'),
         steps=[('같은 때', 'item', '러일전쟁 무렵 일본은 한일의정서를 강요했다.'),
                ('이어서', 'item', '뒤이어 제1차 한일협약·을사늑약으로 국권 침탈을 넓혔다.'),
                ('구분', 'item', '독도 불법 편입과 이 조약들은 같은 전쟁 시기의 침탈이다. 독도 편입이 조약을 일으켰다고 잇지 않는다.')],
         key='러일전쟁 무렵 = 독도 불법 편입·한일의정서 → 제1차 한일협약 → 을사늑약',
         next=('여기까지가 독도 이야기예요. 이제 주제를 바꿔, 시대를 거슬러 조선 숙종 때의 북쪽 국경(간도) 이야기를 봐요.', True)),
    dict(id='scene-2', orig=2, cell=(1, 1), label='간도 · 북쪽 국경', title='경계를 돌에 새기다', when='조선 숙종 때 · 청과의 국경',
         alt='경계를 돌에 새기다 장면', a=('관리', '청과의 국경을 어디로 정합니까?'), b=('동료 관리', '숙종의 명으로 백두산정계비를 세웁시다.'),
         steps=[('배경', 'cause', '조선 숙종 때 청과의 국경을 정할 필요가 있었다.'),
                ('전개', 'dev', '숙종의 명으로 백두산정계비를 세우기로 했다.')],
         key='숙종 = 백두산정계비',
         next=('조정에서 정한 경계는 산꼭대기의 비석으로 남았다.', False)),
    dict(id='stele-mountain', added=True, cell=(0, 3), label='간도 · 정계비 · 시점 구분', title='산꼭대기의 비석', when='조선 숙종 · 1712 백두산정계비',
         alt='눈 덮인 백두산에서 경계비를 세우는 사람들', a=('관리', '백두산에 정계비를 세워 청과의 경계를 정했소.'), b=('해설 · 뒷날을 미리 짚음', '서간도·북간도 기지는 훨씬 뒤의 일이지요.'),
         steps=[('결과', 'res', '백두산에 정계비를 세워 청과의 경계를 정했다.'),
                ('구분', 'item', '백두산정계비는 조선 후기의 국경 문제다. 서간도·북간도가 독립운동 기지가 된 것은 훨씬 뒤의 일이라 시점을 나눠 기억한다.')],
         key='백두산정계비 = 숙종(조선 후기 국경 문제) / 서간도·북간도 = 뒤에 독립운동 기지 → 시점을 나눠 기억',
         next=('여기서 시대가 크게 건너뛰어요. 훨씬 뒤, 간도는 독립운동 기지가 되었다.', False)),
    dict(id='scene-4', orig=4, cell=(1, 3), label='간도 · 독립운동 기지', title='국경 너머 독립운동 기지', when='정계비보다 훨씬 뒤 · 서간도·북간도 독립운동 기지',
         alt='국경 너머 독립운동 기지 장면', a=('독립운동가', '서간도엔 신흥강습소를 세웁시다.'), b=('동료', '북간도에는 명동학교와 서전서숙이 있지요.'),
         steps=[('서간도', 'item', '신민회 계열이 경학사와 신흥강습소를 세웠다. 신흥강습소는 뒤에 신흥무관학교로 이어졌다.'),
                ('북간도', 'item', '이상설이 세운 서전서숙이 있었고, 명동학교도 있었다. 대종교 기반의 중광단은 북로군정서로 발전했다.')],
         key='서간도=경학사·신흥강습소 / 북간도=명동학교·서전서숙',
         next=('간도에 세운 기지는 독립군 전투의 무대가 되었다.', False)),
    dict(id='independence-battles', added=True, cell=(1, 3), reuse=True, label='간도 · 간도 이후 · 전투 순서', title='승리 뒤의 시련', when='봉오동 → 청산리 → 간도 참변 → 자유시 참변 → 미쓰야 협정',
         alt='지도를 보며 의논하는 사람들(앞 장면 그림 다시 사용)', a=('독립군', '봉오동·청산리에서 이겼지만 간도 참변이 이어졌소.'), b=('동료', '자유시 참변, 미쓰야 협정까지 순서를 기억해요.'),
         art_note='그림: 앞 장면과 같은 칸을 확대하지 않고 칸 전체로 다시 썼어요.',
         steps=[('전개', 'dev', '봉오동 전투(대한독립군)에 이어 청산리 전투(북로군정서군 등)에서 독립군이 이겼다.'),
                ('결과', 'res', '청산리 승리 뒤 일본군이 간도에서 보복 학살을 벌였다(간도 참변). 이어 자유시 참변과 미쓰야 협정으로 독립군이 시련을 겪었다.')],
         key='봉오동(대한독립군) → 청산리(북로군정서군 등) → 간도 참변 → 자유시 참변 → 미쓰야 협정 / 북간도 중광단 → 북로군정서',
         next=None),
]
# 기록에 이름이 없는 설명용 인물(이사부만 실제 인물). ‘해설’은 장면 시점보다 뒤의 일을 미리 짚는 말.
GENERIC = {'신라 군사', '대한제국 사람', '동료', '대한제국 관리', '관리', '동료 관리', '독립운동가', '독립군'}

ISLANDS_CSS = ('<style id="hanq-islands-story">/* 독도와 간도: 주제 머리 → 컷(제목·때 → 그림 칸 전체 → 그림 밖 말풍선 → 설명 → 꼭 기억) → (덩어리 끝) 이 부분에서 외울 것 → 다음 컷 */'
               '.i-story .scene{padding:0 0 22px;opacity:1!important;transform:none!important;content-visibility:visible!important;scroll-margin-top:68px}'
               '.i-story .i-head{padding:18px 18px 12px}.i-story .i-head .meta{font-size:13px;color:#667085;font-weight:800}'
               '.i-story .i-head h2{font-size:clamp(22px,6vw,28px);line-height:1.25;letter-spacing:-.04em;margin:6px 0 6px;word-break:keep-all}'
               '.i-story .i-when{margin:0;color:#a72d27;font-size:14.5px;line-height:1.5;font-weight:850;word-break:keep-all;overflow-wrap:anywhere}'
               '.i-art-cap{margin:6px 18px 0;font-size:13px;font-weight:750;line-height:1.5;color:#4b5565}.i-art-note{margin:2px 18px 0;font-size:13px;line-height:1.5;color:#5b6576}'
               '.i-talk-cap{margin:12px 18px 0;font-size:13px;font-weight:800;line-height:1.4;color:#5b6576}'
               '.i-talk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:8px 18px 0}'
               '.i-talk p{margin:0;padding:10px 12px 11px;background:#fff;border:2px solid #26384c;border-radius:16px 16px 16px 5px;color:#243248;line-height:1.5}'
               '.i-talk p+p{background:#eef6ff;border-color:#315d80;border-radius:16px 16px 5px 16px}'
               '.i-talk b{display:block;margin-bottom:4px;font-size:14px;font-weight:900;color:#b52d34}.i-talk p+p b{color:#315d80}'
               '.i-talk span{display:block;font-size:16px;font-weight:700;word-break:keep-all;overflow-wrap:anywhere}'
               '.i-steps{list-style:none;margin:12px 18px 0;padding:0;display:grid;gap:7px}'
               '.i-steps li{display:grid;grid-template-columns:3.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:16px;line-height:1.65;color:#2b3443;word-break:keep-all;overflow-wrap:anywhere}'
               '.i-steps .st{display:block;padding:1px 2px;border-radius:6px;text-align:center;font-size:12.5px;font-weight:900;line-height:1.5;background:#eef1f4;color:#4b5565}'
               '.i-steps .st.dev{background:#fff0e9;color:#a72d27}.i-steps .st.res{background:#e9f4ec;color:#2f6b3c}.i-steps .st.item{background:#f6f1e7;color:#7a5a24}'
               '.i-story .scene>.key{margin:12px 18px 0;padding:10px 12px;border-left:4px solid #d83b32;background:#fff0e9;color:#a72d27;font-size:15px;font-weight:850;line-height:1.55}'
               '.i-story .i-topic{padding:18px 18px 16px;background:#17243a;color:#fff;scroll-margin-top:68px}.i-story .i-topic:focus{outline:3px solid #f0b593;outline-offset:-3px}'
               '.i-story .i-topic small{display:block;color:#f0b593;font-size:13px;font-weight:800}.i-story .i-topic h2{margin:4px 0 0;color:#fff;font-size:clamp(20px,5.5vw,24px);line-height:1.3}'
               '.i-story .i-topic p{margin:6px 0 0;font-size:15px;line-height:1.6;color:#dce5f0;word-break:keep-all}'
               '.i-mem{margin:0;padding:16px 18px 18px;background:#fff8e8;border-top:4px solid #e5a337;border-bottom:1px solid #f0dfb8;scroll-margin-top:68px}'
               '.i-mem-label{margin:0 0 8px;font-size:17px;font-weight:900;color:#7a4b0d}.i-mem-k+.i-mem-k{margin-top:14px;padding-top:12px;border-top:1px dashed #e3cf9f}'
               '.i-mem-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px;margin:0 0 6px}.i-mem-t{font-size:17px;font-weight:900}.i-mem-w{font-size:14px;font-weight:800;color:#294d87}'
               '.i-mem-story p{margin:0 0 6px;font-size:16px;line-height:1.7;color:#243248;word-break:keep-all;overflow-wrap:anywhere}.i-mem strong{color:#b52d34;font-weight:900}'
               '.i-memo{margin:8px 0;padding:10px 12px;border-left:4px solid #e5a337;border-radius:8px;background:#fff}.i-memo b{display:block;font-size:14px;font-weight:900}.i-memo p{margin:4px 0 0;font-size:16px;line-height:1.7}.i-memo p+p{font-size:15px;color:#5b4a26}'
               '.i-mem-x{margin:8px 0 0;font-size:16px;line-height:1.7;color:#3b3220;word-break:keep-all}.i-mem-x b{margin-right:6px;padding:1px 7px;border-radius:6px;background:#fce9e5;color:#8f2a26;font-size:13px;font-weight:900}'
               '.i-keys{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:8px 0 0}.i-keys-label{font-size:13px;font-weight:900;color:#5b6576}.i-key{padding:3px 9px;border-radius:999px;background:#fce9e5;color:#8f2a26;font-size:14px;font-weight:850}'
               '.i-guide{margin:12px 0 0;padding:0;list-style:none;font-size:14px;line-height:1.6;color:#d9e0e8}.i-guide b{color:#f0b593}'
               '.i-story .story-seam.i-switch{background:#e6e9ed;color:#17243a;font-weight:850}'
               '.i-story .end p{font-size:16px}'
               # 두 주제 바로 가기 줄(개화기·조선 웹툰과 같은 방식): 높이 60px 고정, 좁은 화면에서 오른쪽 92px는 홈 버튼 자리, 가로 스크롤은 안쪽 트랙에서만
               '.i-story nav.i-nav{position:sticky;top:0;z-index:5;height:60px;box-sizing:border-box;display:flex;align-items:center;margin:0;padding:0 92px 0 10px;background:#edf0f4;border-bottom:1px solid #d9dee5}'
               '.i-story .i-nav-track{display:flex;align-items:center;gap:6px;min-width:0;width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}.i-story .i-nav-track::-webkit-scrollbar{display:none}'
               '.i-story nav.i-nav a{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;color:#263a55;font-weight:800;font-size:14px;text-decoration:none;background:#fff;border:1px solid #d4dae1;border-radius:99px;white-space:nowrap}'
               '.i-story .comic-home{top:calc(9px + env(safe-area-inset-top));min-height:42px}'
               '@media(min-width:760px){.i-story nav.i-nav{padding-right:10px}}'
               '@media(max-width:400px){.i-talk{grid-template-columns:1fr;gap:12px;margin:8px 14px 0}.i-steps{margin:12px 14px 0}.i-art-cap,.i-art-note,.i-talk-cap{margin-left:14px;margin-right:14px}.i-story .scene>.key{margin-left:14px;margin-right:14px}.i-story .i-head{padding:16px 14px 12px}.i-mem{padding-left:14px;padding-right:14px}}'
               '.embedded .i-story nav{display:none}'
               '</style>')


def load_flow():
    s = open(os.path.join(MEDIA, 'lecture-flow-islands.js'), encoding='utf-8').read()
    m = re.search(r'/\*FLOW-JSON\*/(.*?)/\*END-FLOW-JSON\*/', s, re.S)
    if not m:
        raise SystemExit('media/lecture-flow-islands.js 에 주제 데이터(FLOW-JSON)가 없어요.')
    return json.loads(m.group(1))


def em(s):
    return re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', e(s))


def cell_style(cell):
    c, r = cell
    return '--x:%.3f%%;--y:%.3f%%' % (c / (COLS - 1) * 100, r / (ROWS - 1) * 100)


def who(w):
    return w + ' · 설명용 인물' if w in GENERIC else w


def scene_html(sc, n):
    attrs = (' data-orig="%d"' % sc['orig']) if sc.get('orig') else ''
    attrs += ' id="%s"' % e(sc['id'])
    attrs += ' data-added="density"' if sc.get('added') else ''
    head = '<div class="i-head"><div class="meta"><span data-scene-count data-format="n">%02d</span> · %s</div><h2>%s</h2><p class="i-when">%s</p></div>' % (
        n, e(sc['label']), e(sc['title']), e(sc['when']))
    # 그림판 칸 하나를 통째로(2열×4행, 칸 비율 4:3) — 확대·잘라 내기 없음
    art = '<div class="art i-art" role="img" aria-label="%s" style="%s"></div>' % (e(sc['alt']), cell_style(sc['cell']))
    cap = '<p class="i-art-cap">개념 그림 · 실제 인물의 초상이나 현장 그림이 아니에요.</p>'
    note = '<p class="i-art-note">%s</p>' % e(sc['art_note']) if sc.get('art_note') else ''
    talk = ('<p class="i-talk-cap">학습용 요약 대화 · 실제 발언을 그대로 옮긴 것이 아니에요.</p><div class="i-talk">%s</div>'
            % ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(who(w)), e(t), e(who(w)), e(t)) for w, t in (sc['a'], sc['b'])))
    steps = '<ol class="i-steps" aria-label="장면 설명">%s</ol>' % ''.join('<li><b class="st %s">%s</b><span>%s</span></li>' % (k, e(l), e(t)) for l, k, t in sc['steps'])
    return '<section class="scene"%s>%s%s%s%s%s%s<p class="key">%s</p></section>' % (attrs, head, art, cap, note, talk, steps, e(sc['key']))


def memory_html(after, chunks):
    def one(k):
        memo = ('<div class="i-memo"><b>%s</b><p>%s</p><p>%s</p></div>' % (e(k['memo']['label']), e(k['memo']['text']), e(k['memo']['note']))) if k.get('memo') else ''
        wrong = '<p class="i-mem-x"><b>헷갈리지 않기</b>%s</p>' % em(k['x']) if k.get('x') else ''
        return ('<div class="i-mem-k"><p class="i-mem-head"><b class="i-mem-t">%s</b><span class="i-mem-w">%s</span></p><div class="i-mem-story">%s</div>%s%s'
                '<p class="i-keys"><span class="i-keys-label">암기 키워드</span>%s</p></div>') % (
            e(k['t']), e(k['w']), ''.join('<p>%s</p>' % em(x) for x in k['story']), memo, wrong, ''.join('<span class="i-key">%s</span>' % e(x) for x in k['k']))
    return '<aside class="i-mem" id="mem-%s" aria-label="이 부분에서 외울 것: %s"><p class="i-mem-label">이 부분에서 외울 것</p>%s</aside>' % (
        e(after), e(' · '.join(k['t'] for k in chunks)), '<ul>'+''.join('<li><b>%s</b> · %s</li>'%(e(k['t']),e(' → '.join(k['k']))) for k in chunks)+'</ul><details><summary>세부 내용 펼쳐보기</summary>'+''.join(one(k) for k in chunks)+'</details>')


def bridge_html(sc):
    if not sc.get('next'):
        return ''
    text, part = sc['next']
    return '<div class="story-seam%s" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % (
        ' i-switch' if part else '', e(text))


def build():
    keys = [sc['id'] for sc in SCENES]
    if len(keys) != 7 or len(set(keys)) != 7:
        raise SystemExit('독도와 간도 장면은 7개, id는 서로 달라야 해요.')
    flow = load_flow()
    starts = {t['start']: t for t in flow['list']}
    chunks = [k for t in flow['list'] for k in t['chunks']]
    idx = [keys.index(k['go']) for k in chunks]
    if idx != sorted(idx) or any(t['start'] != t['chunks'][0]['go'] for t in flow['list']) or keys[0] != flow['list'][0]['start']:
        raise SystemExit('주제·덩어리 시작 장면이 화면 순서와 맞지 않아요.')
    old_ends=[keys[x-1] for x in idx[1:]]+[keys[-1]]
    ends = {}
    for i, group in enumerate(flow['list']):
        last=keys[keys.index(flow['list'][i+1]['start'])-1] if i+1<len(flow['list']) else keys[-1]
        ends[last]=group['chunks']
    src = open(os.path.join(MEDIA, FILE), encoding='utf-8').read()
    head = re.sub(r'<style id="hanq-islands-story">.*?</style>', '', src[:src.index('</head>')], flags=re.S) + ISLANDS_CSS
    tail = src[src.index('</main>'):]
    body, scenes, memory = '', [], []
    for n, sc in enumerate(SCENES, 1):
        if sc['id'] in starts:
            t = starts[sc['id']]
            body += '<div class="i-topic" id="%s"><small>%s 주제 · %s</small><h2 id="%s-h">%s %s</h2><p>%s</p></div>\n' % (
                e(t['id']), e(t['no']), e(t['range']), e(t['id']), e(t['no']), e(t['name']), e(t['lead']))
        card = '<span class="legacy-anchor" id="mem-%s" aria-hidden="true"></span>' % e(sc['id']) if sc['id'] in old_ends and sc['id'] not in ends else ''
        if sc['id'] in ends:
            card = memory_html(sc['id'], ends[sc['id']])
            memory.append(dict(after=sc['id'], scene=n, chunks=[k['t'] for k in ends[sc['id']]]))
        body += scene_html(sc, n) + card + bridge_html(sc) + '\n'
        topic = [t['id'] for t in flow['list'] if keys.index(t['start']) <= n - 1][-1]
        scenes.append(dict(id=sc['id'], scene=n, topic=topic, orig=sc.get('orig'), added=bool(sc.get('added')), cell=list(sc['cell']), reused=bool(sc.get('reuse')),
                           depicts=sc['alt'], key=sc['key'], speakers=[w for w, _ in (sc['a'], sc['b'])]))
    guide = ('<ul class="i-guide"><li><b>두 주제</b> ① 독도 · ② 간도. 한 땅에서 이어지는 시간 순서가 아니라 서로 다른 이야기예요.</li>'
             '<li><b>컷마다</b> 때 → 그림 → 대화 → 설명을 읽어요. 시대가 크게 건너뛰는 곳은 장면 사이 줄에서 알려요.</li>'
             '<li><b>큰 흐름 끝</b>마다 ‘이 부분에서 외울 것’으로 사람·사건을 이어서 정리해요.</li></ul>')
    header = ('<header><small>한국사 한눈에 · 시대 웹툰</small><h1>독도와 간도</h1><p>영토·국경·독립운동을 잇는 핵심 단서</p>' + guide + '</header>'
              '<nav class="i-nav" aria-label="두 주제 바로 가기"><div class="i-nav-track">%s</div></nav>'
              '<div class="chapter-line">%s</div>\n') % (''.join('<a href="#%s">%s %s</a>' % (e(t['id']), e(t['no']), e(t['name'])) for t in flow['list']), e(flow['note']))
    end = ('<div class="end"><strong>두 주제, 한 줄씩</strong>'
           '<p>독도: 지증왕 때 이사부 우산국 복속 … (시대가 크게 떨어짐) … 러일전쟁 중 일본의 독도 불법 편입 · 한일의정서 → 제1차 한일협약 → 을사늑약</p>'
           '<p>간도: 숙종 백두산정계비 … (훨씬 뒤) … 서간도·북간도 독립운동 기지 → 봉오동 → 청산리 → 간도 참변 → 자유시 참변 → 미쓰야 협정</p>'
           '<a href="../index.html#chapter/islands/quiz" target="_top">다 읽었다면 퀴즈로 확인하기 →</a></div>')
    doc = head + '</head><body class="i-story"><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><main>' + header + body + end + tail
    with open(os.path.join(MEDIA, FILE), 'w', encoding='utf-8') as f:
        f.write(doc)
    cmap = dict(generated_by='scripts/build_islands_comic.py',
                note='독도와 간도 웹툰 장면(화면 순서)·주제·그림판 칸·기존 꼭 기억 단서, 이 부분에서 외울 것 카드 위치. 그림판은 바이트 그대로이고 칸 하나를 통째로 보여 준다.',
                sprite=dict(file='media/' + SPRITE, cols=COLS, rows=ROWS, cell_aspect='4:3'),
                scenes=scenes, memory=memory)
    with open(os.path.join(ROOT, 'docs', 'islands-comic-map.json'), 'w', encoding='utf-8') as f:
        json.dump(cmap, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print('독도와 간도 장면', len(scenes), '· 카드', len(memory))


if __name__ == '__main__':
    build()

# Source-backed supplementary learning cuts; original scene keys stay unchanged.
from study_supplements import apply as apply_study_supplements
apply_study_supplements()
