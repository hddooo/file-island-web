# -*- coding: utf-8 -*-
"""웹툰 장면 보강·번호 동적화·조선시대 통합 웹툰 생성 (여러 번 실행해도 결과가 같다).

  python3 scripts/build_comics.py

1) 원래 장면에 data-orig="N"을 붙여 원본 장면을 추적한다(내용·id는 그대로).
2) 장면 번호를 <span data-scene-count>로 감싸고, media/comic-scenes.js가 실제 .scene 개수로 채운다.
3) scripts/comic_panels.py의 장면을 원래 그림을 다시 써서 끼워 넣는다(이미 있으면 건너뜀).
4) 모든 웹툰에 comic-scenes.js · glossary-data.js · glossary.js를 연결한다.
5) 조선 전기·후기 장면을 하나의 연속 문서 media/joseon-all-comic.html로 합친다.
"""
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from comic_panels import PANELS, BRIDGE_FIX

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
FILES = {
  'prehistory': 'prehistory-comic.html', 'gojoseon': 'gojoseon-comic.html',
  'samguk': 'samguk-comic.html', 'nambuk': 'nambuk-comic.html', 'goryeo': 'goryeo-comic.html',
  'joseon-early': 'joseon-comic.html', 'joseon-late': 'joseon-late-comic.html',
  'islands': 'islands-comic.html', 'opening': 'opening-comic.html',
  'colonial': 'colonial-comic.html', 'modern': 'modern-comic.html',
}
FAMILY = {
  'prehistory': 'panel', 'gojoseon': 'panel', 'samguk': 'sheet', 'nambuk': 'sheet', 'goryeo': 'artwork',
  'joseon-early': 'caption', 'joseon-late': 'bubble', 'islands': 'bubble', 'opening': 'bubble',
  'colonial': 'bubble', 'modern': 'bubble',
}
GRID = {'joseon-early': (3, 4), 'joseon-late': (3, 4), 'islands': (2, 4), 'opening': (3, 4), 'colonial': (3, 4), 'modern': (3, 4)}
PANEL_DIR = {'prehistory': 'prehistory-panels', 'gojoseon': 'gojoseon-panels', 'goryeo': 'goryeo-panels'}
SCENE_RE = re.compile(r'<section class="scene"')
e = lambda s: html.escape(s, quote=True)


def read(name):
    with open(os.path.join(MEDIA, name), encoding='utf-8') as f:
        return f.read()


def write(name, text):
    with open(os.path.join(MEDIA, name), 'w', encoding='utf-8') as f:
        f.write(text)


def mark_originals(s):
    """data-orig가 없으면 원래 장면 순서대로 붙인다(최초 1회)."""
    if 'data-orig="1"' in s:
        return s
    n = [0]
    def rep(m):
        n[0] += 1
        return '<section class="scene" data-orig="%d"' % n[0]
    return SCENE_RE.sub(rep, s)


def scene_span(s, key):
    """key(o3 또는 id)인 장면의 (시작, 끝) 위치."""
    if key.startswith('o') and key[1:].isdigit():
        m = re.search(r'<section class="scene" data-orig="%s"[^>]*>' % key[1:], s)
    else:
        m = re.search(r'<section class="scene"[^>]*\sid="%s"[^>]*>' % re.escape(key), s)
    if not m:
        raise SystemExit('scene not found: ' + key)
    end = s.index('</section>', m.end()) + len('</section>')
    return m.start(), end


def zoom_style(fam, grid, cell, focus, zoom):
    if fam in ('panel', 'artwork'):
        if not zoom:
            return ''
        return 'transform:scale(%.2f);transform-origin:%d%% %d%%' % (zoom, focus[0] * 100, focus[1] * 100)
    cols, rows = grid
    c, r = cell
    if not zoom:
        return '--x:%.3f%%;--y:%.3f%%' % (c / (cols - 1) * 100 if cols > 1 else 0, r / (rows - 1) * 100)
    def axis(n, i, f):
        vis = 1 / (n * zoom)
        left = (i + f) / n - vis / 2
        left = min(max(left, i / n), (i + 1) / n - vis)
        return left / (1 - vis) * 100
    return 'background-size:%.1f%% %.1f%%;background-position:%.3f%% %.3f%%' % (
        cols * zoom * 100, rows * zoom * 100, axis(cols, c, focus[0]), axis(rows, r, focus[1]))


def bridge_html(fam, text):
    if fam == 'panel':
        return '<div class="story-link"><span class="dots" aria-hidden="true">…</span><p>%s</p></div>' % e(text)
    if fam == 'bubble':
        return '<div class="story-seam" aria-label="이야기 흐름"><span class="story-seam-dots" aria-hidden="true">…</span><span class="story-seam-text">%s</span></div>' % e(text)
    return '<div class="bridge" aria-label="이야기 흐름"><span class="bridge-dots" aria-hidden="true">…</span><span class="bridge-text">%s</span></div>' % e(text)


def dialogue(p):
    return ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (e(w), e(t), e(w), e(t)) for w, t in (p['a'], p['b']))


def scene_html(era, p):
    fam = FAMILY[era]
    attrs = '<section class="scene" id="%s" data-added="density">' % e(p['id'])
    if fam == 'panel':
        img = '%s/%02d.webp' % (PANEL_DIR[era], p['img'])
        st = zoom_style(fam, None, None, p['focus'], p['zoom'])
        bub = ''.join('<div class="bubble %s" aria-label="%s: %s">%s</div>' % (side, e(w), e(t), e(t)) for side, (w, t) in zip(('left', 'right'), (p['a'], p['b'])))
        return (attrs + '<div class="art"><img src="%s" alt="%s" loading="lazy" style="%s">%s</div>'
                '<div class="panel-caption"><span class="seq" data-scene-count>00 / 00</span><h2>%s</h2><p class="key">%s</p></div></section>') % (
            img, e(p['alt']), st, bub, e(p['title']), e(p['key']))
    if fam == 'artwork':
        img = '%s/%02d.webp' % (PANEL_DIR[era], p['img'])
        st = zoom_style(fam, None, None, p['focus'], p['zoom'])
        return (attrs + '<div class="caption"><div class="meta"><span data-scene-count data-format="n">00</span> · %s</div><h2>%s</h2></div>'
                '<div class="artwork"><img src="%s" alt="%s" loading="lazy" style="%s"><div class="dialogue">%s</div></div><div class="key">%s</div></section>') % (
            e(p['label']), e(p['title']), img, e(p['alt']), st, dialogue(p), e(p['key']))
    st = zoom_style(fam, GRID[era], p['cell'], p['focus'], p['zoom'])
    if fam == 'caption':
        return (attrs + '<div class="caption"><div class="meta"><span data-scene-count data-format="n">00</span> · %s</div><h2>%s</h2></div>'
                '<div class="art" role="group" aria-label="%s" style="%s"><div class="dialogue">%s</div></div><div class="key">%s</div></section>') % (
            e(p['label']), e(p['title']), e(p['alt']), st, dialogue(p), e(p['key']))
    # bubble
    if not p['zoom']:
        pass
    bub = ''.join('<div class="bubble %s"><b>%s</b><span>%s</span></div>' % (side, e(w), e(t)) for side, (w, t) in zip(('one', 'two'), (p['a'], p['b'])))
    return (attrs + '<div class="scene-head"><small><span data-scene-count>00 / 00</span> · %s</small><h2>%s</h2></div>\n'
            '<div class="art" role="group" aria-label="%s" style="%s">\n%s</div>\n<p class="key">%s</p></section>') % (
        e(p['label']), e(p['title']), e(p['alt']), st, bub, e(p['key']))


BRIDGE_ANY = re.compile(r'\s*(<div class="(?:bridge|story-seam)"[^>]*>.*?</div>|<div class="story-link">.*?</div>)', re.S)


def bridge_after(s, key):
    """원래 장면 key 바로 뒤의 연결 문장 (위치, 텍스트)"""
    _, end = scene_span(s, key)
    m = BRIDGE_ANY.match(s, end)
    if not m:
        return None
    t = re.sub(r'<[^>]+>', '', m.group(1)).replace('…', '').strip()
    return (m.start(1), m.end(1), html.unescape(t))


def fix_bridges(era, s):
    plan = BRIDGE_FIX.get(era)
    if not plan or 'data-bridge-fixed' in s:
        return s
    fam = FAMILY[era]
    orig = {k: bridge_after(s, 'o%d' % k) for k in range(1, 40) if re.search(r'data-orig="%d"' % k, s)}
    texts = {k: v[2] for k, v in orig.items() if v}
    # 뒤에서부터 바꿔 위치가 밀리지 않게 한다
    for k in sorted(plan, reverse=True):
        v = plan[k]
        text = v if isinstance(v, str) else texts[v]
        new = bridge_html(fam, text).replace('<div class="', '<div data-bridge-fixed class="', 1)
        cur = orig.get(k)
        if cur:
            s = s[:cur[0]] + new + s[cur[1]:]
        else:
            _, end = scene_span(s, 'o%d' % k)
            s = s[:end] + new + s[end:]
    return s


def insert_panels(era, s):
    fam = FAMILY[era]
    for p in PANELS.get(era, []):
        if re.search(r'\sid="%s"' % re.escape(p['id']), s):
            continue
        block = scene_html(era, p)
        if 'before' in p:
            start, _ = scene_span(s, p['before'])
            s = s[:start] + block + bridge_html(fam, p['bridge_out']) + s[start:]
        else:
            _, end = scene_span(s, p['after'])
            s = s[:end] + bridge_html(fam, p['bridge_in']) + block + s[end:]
    return s


def wrap_counters(era, s):
    fam = FAMILY[era]
    if fam == 'bubble':
        s = re.sub(r'<small>(\d\d / \d\d) · ', r'<small><span data-scene-count>\1</span> · ', s)
    elif fam in ('caption', 'artwork'):
        s = re.sub(r'<div class="meta">(\d\d) · ', r'<div class="meta"><span data-scene-count data-format="n">\1</span> · ', s)
    elif fam == 'panel':
        s = s.replace('<span class="seq">', '<span class="seq" data-scene-count>')
    elif fam == 'sheet':
        s = re.sub(r'<div class="meta">(\d\d / \d\d) · ', r'<div class="meta"><span data-scene-count>\1</span> · ', s)
        s = s.replace('<p style="font-size:12px">32컷 · ', '<p style="font-size:12px"><span data-scene-total>32</span>컷 · ')
        s = s.replace('발해의 건국은 9컷에서 이어진다.', '발해의 건국은 <a href="#s9" data-scene-ref="s9">9컷</a>에서 이어진다.')
    return s


def renumber_static(s):
    """스크립트 없이도 맞도록 정적 번호를 실제 순서로 다시 쓴다."""
    parts = re.split(r'(<section class="scene".*?</section>)', s, flags=re.S)
    scenes = [p for p in parts if p.startswith('<section class="scene"')]
    total = len(scenes)
    ids = [ (re.match(r'<section class="scene"[^>]*?\sid="([^"]+)"', p) or [None, None])[1] for p in scenes ]
    i = 0
    for k, p in enumerate(parts):
        if not p.startswith('<section class="scene"'):
            continue
        i += 1
        def num(m, i=i):
            return m.group(1) + ('%02d' % i if m.group(2) else '%02d / %02d' % (i, total)) + '</span>'
        parts[k] = re.sub(r'(<span[^>]*?data-scene-count( data-format="n")?>)[^<]*</span>', num, p)
    s = ''.join(parts)
    s = re.sub(r'(<span data-scene-total>)\d+(</span>)', lambda m: m.group(1) + str(total) + m.group(2), s)
    def ref(m):
        tid = m.group(2)
        return m.group(1) + ('%d컷' % (ids.index(tid) + 1) if tid in ids else m.group(3)) + m.group(4)
    return re.sub(r'(<a href="#[^"]+" data-scene-ref="([^"]+)">)([^<]*)(</a>)', ref, s)


SCRIPTS = '<script src="comic-scenes.js"></script><script src="glossary-data.js"></script><script src="glossary.js" data-auto="comic"></script>'


def add_scripts(s):
    if 'comic-scenes.js' in s:
        return s
    i = s.rfind('</body>')
    if i < 0:
        i = s.rfind('</html>')
    return s[:i] + SCRIPTS + s[i:]


ISLANDS_FIX = '<style id="hanq-islands-grid">/* islands-panels.png는 2열×4행 그림판: 칸을 온전히 보이게 */.art{aspect-ratio:4/3;background-size:200% 400%}</style>'


# ---------- 조선 웹툰: 그림판 배경 대신 실제 칸 그림(scripts/extract_joseon_panels.py) ----------
PANEL_PREFIX = {'joseon-early': ('early', 'joseon-story-grid.png'), 'joseon-late': ('late', 'joseon-late-panels.png')}
PANEL_STYLE = ('<style id="hanq-panel-images">/* 장면 그림은 칸별 PNG를 원래 비율 그대로 보여 준다(그림판 배경 자르기 대신) */'
               '.art.panel-img{aspect-ratio:auto!important;height:auto!important;background:#d9c9a5!important}'
               '.art.panel-img>img{display:block;width:100%;height:auto;margin:0}'
               '/* 늦게 불러와도 장면이 비어 보이지 않게: 페이드·content-visibility 끄기 */'
               '.scene{opacity:1!important;transform:none!important;content-visibility:visible!important}</style>')
_manifest = None


def panel_manifest():
    global _manifest
    if _manifest is None:
        p = os.path.join(MEDIA, 'joseon-panels', 'manifest.json')
        if not os.path.exists(p):
            raise SystemExit('media/joseon-panels/manifest.json 없음: 먼저 python3 scripts/extract_joseon_panels.py')
        _manifest = json.load(open(p, encoding='utf-8'))
    return _manifest


ART_RE = re.compile(r'<div class="art(?: panel-img)?" role="group" aria-label="([^"]*)" (?:style="([^"]*)"|data-panel="([a-z]+)-(\d+)")>(?:<img[^>]*>)?')


def apply_panel_images(era, s):
    if era not in PANEL_PREFIX:
        return s
    prefix, sheet = PANEL_PREFIX[era]
    panels = {p['scene']: p for p in panel_manifest()[sheet]['panels']}
    specs = {p['id']: p for p in PANELS.get(era, [])}
    parts = re.split(r'(<section class="scene".*?</section>)', s, flags=re.S)
    n = 0
    for k, sec in enumerate(parts):
        if not sec.startswith('<section class="scene"'):
            continue
        n += 1
        m = ART_RE.search(sec)
        if not m:
            raise SystemExit('%s: 그림 칸을 찾지 못함 (장면 %d)' % (era, n))
        label = m.group(1)
        idm = re.match(r'<section class="scene"[^>]*\sid="([^"]+)"', sec)
        if 'data-added="density"' in sec:
            spec = specs[idm.group(1)]
            col, row = spec['cell']
            label = e(spec['alt'])
        elif m.group(4):
            sc = int(m.group(4)); col, row = (sc - 1) % 3, (sc - 1) // 3
        else:
            st = m.group(2)
            x = float(re.search(r'--x:([\d.]+)%', st).group(1)); y = float(re.search(r'--y:([\d.]+)%', st).group(1))
            col, row = int(round(x / 50)), int(round(y / (100 / 3)))
        p = panels[row * 3 + col + 1]
        tag = ('<div class="art panel-img" role="group" aria-label="%s" data-panel="%s-%02d">'
               '<img src="joseon-panels/%s" width="%d" height="%d" alt="" decoding="async" loading="%s">') % (
            label, prefix, p['scene'], p['file'], p['w'], p['h'], 'eager' if n <= 2 else 'lazy')
        if m.group(0) != tag:
            parts[k] = sec[:m.start()] + tag + sec[m.end():]
    s = ''.join(parts)
    if 'hanq-panel-images' not in s:
        s = s.replace('</head>', PANEL_STYLE + '</head>', 1)
    return s


def build_era(era):
    name = FILES[era]
    s = read(name)
    s = mark_originals(s)
    s = wrap_counters(era, s)
    s = fix_bridges(era, s)
    s = insert_panels(era, s)
    s = apply_panel_images(era, s)
    if era == 'islands' and 'hanq-islands-grid' not in s:
        s = s.replace('</head>', ISLANDS_FIX + '</head>', 1)
    s = renumber_static(s)
    s = add_scripts(s)
    write(name, s)
    return len(SCENE_RE.findall(s))


# ---------- 조선시대 통합 웹툰 ----------
def late_to_caption(sec):
    """후기 웹툰(말풍선형) 장면을 전기 웹툰 형식으로 옮긴다. 글은 한 글자도 바꾸지 않는다."""
    m_open = re.match(r'<section class="scene"([^>]*)>', sec)
    attrs = m_open.group(1)
    label = re.search(r'<small><span data-scene-count>[^<]*</span> · (.*?)</small>', sec).group(1)
    h2 = re.search(r'<h2>(.*?)</h2>', sec, re.S).group(1)
    art = re.search(r'<div class="art panel-img" role="group" aria-label="([^"]*)" data-panel="([^"]*)">(<img[^>]*>)', sec)
    bubbles = re.findall(r'<div class="bubble (?:one|two)"><b>(.*?)</b><span>(.*?)</span></div>', sec, re.S)
    key = re.search(r'<p class="key">(.*?)</p>', sec, re.S).group(1)
    dl = ''.join('<p aria-label="%s: %s"><b>%s</b><span>%s</span></p>' % (re.sub('<[^>]+>', '', w), re.sub('<[^>]+>', '', t), w, t) for w, t in bubbles)
    return ('<section class="scene"%s data-part="late"><div class="caption"><div class="meta"><span data-scene-count data-format="n">00</span> · 조선 후기 · %s</div><h2>%s</h2></div>'
            '<div class="art late panel-img" role="group" aria-label="%s" data-panel="%s">%s<div class="dialogue">%s</div></div><div class="key">%s</div></section>') % (
        attrs, label, h2, art.group(1), art.group(2), art.group(3).replace('loading="eager"', 'loading="lazy"'), dl, key)


def extract_body(s, start_tag='<main>'):
    a = s.index('<section class="scene"')
    b = s.index('<div class="end">')
    return s[a:b]


def build_joseon_all():
    early = read(FILES['joseon-early'])
    late = read(FILES['joseon-late'])
    early_body = extract_body(early)
    late_body = extract_body(late)
    # 후기 장면 변환
    late_parts = re.split(r'(<section class="scene".*?</section>)', late_body, flags=re.S)
    conv = []
    for part in late_parts:
        if part.startswith('<section class="scene"'):
            conv.append(late_to_caption(part))
        else:
            for t in re.findall(r'<span class="story-seam-text">(.*?)</span>', part, re.S):
                conv.append(bridge_html('caption', html.unescape(t)))
    late_conv = ''.join(conv)
    early_body = early_body.replace('<section class="scene"', '<section class="scene" data-part="early"')
    head_end = early.index('</head>')
    head = early[:head_end]
    head = head.replace('<title>조선 전기와 양난 웹툰 · 왕권을 세우고, 전란을 지나</title>', '<title>조선시대 웹툰 · 건국부터 세도정치까지</title>')
    head += ('<style id="hanq-joseon-all">.art.late:not(.panel-img){background-image:url("joseon-late-panels.png");aspect-ratio:.889!important}'
             '.part-divider{padding:30px 20px 24px;background:#192639;color:#fff}.part-divider small{color:#f4b09e;font-weight:800;letter-spacing:1px}'
             '.part-divider h2{margin:8px 0 6px;font-size:26px;letter-spacing:-.04em}.part-divider p{margin:0;color:#d9e0e8;font-size:14px;line-height:1.7}</style>')
    divider = ('<div class="bridge" aria-label="이야기 흐름"><span class="bridge-dots" aria-hidden="true">…</span><span class="bridge-text">'
               '전쟁 이야기를 마쳤으니, 같은 시기 조정 안의 이야기로 시간을 잠깐 되돌려 보자. 붕당은 임진왜란 전 선조 때 이미 시작됐다.</span></div>'
               '<div class="part-divider" id="late-part"><small>2부 · 조선 후기</small><h2>붕당과 탕평, 그리고 세도정치</h2>'
               '<p>선조 때 갈라진 붕당에서 출발해 광해군·인조를 다시 짚고, 영조·정조의 개혁과 세도정치, 달라진 경제·사회·학문까지 이어 갑니다.</p></div>')
    nav = ('<nav aria-label="장면 바로 가기"><a href="#founding">왕조의 시작</a><a href="#sejong">태종·세종</a><a href="#sejo">단종·세조·성종</a>'
           '<a href="#purges">사화와 개혁</a><a href="#wars">양난</a><a href="#late-part">붕당·광해군·인조</a><a href="#scene-3">영조·정조</a>'
           '<a href="#scene-7">세도정치</a><a href="#scene-9">경제·사회</a><a href="#scene-11">실학·동학</a></nav>')
    header = ('<header><small>시대 웹툰 · 조선시대</small><h1>왕권을 세우고,<br>전란과 붕당을 지나</h1>'
              '<p>건국과 제도 정비, 사화와 양난(1부)에서<br>붕당·탕평·세도정치와 달라진 사회(2부)까지 한 번에 이어 읽어요.</p>'
              '<span class="intro-tag">장면 수 <span data-scene-total>0</span>컷 · 1부 조선 전기와 양난 · 2부 조선 후기</span></header>')
    end = ('<div class="end"><strong>조선시대, 한 줄로</strong><p>태조 건국 → 태종 왕권 강화 → 세종 제도·문화 → 세조 집권 → 성종 경국대전 → 사화와 개혁 → 임진왜란·정묘호란·병자호란</p>'
           '<p>광해군 대동법 → 인조 호란 → 현종 예송 → 숙종 환국 → 영조 탕평·균역 → 정조 규장각·신해통공 → 세도정치·삼정 문란</p>'
           '<a href="../index.html">요약 노트와 빈칸 연습으로 이어가기 →</a></div>')
    early_tail = early[early.index('</main>'):]
    early_tail = early_tail.replace(SCRIPTS, '')
    doc = (head + '</head>\n<body><a class="comic-home" href="../index.html" aria-label="시대별 목차로 이동">⌂ 홈</a><main>\n' + header + nav +
           '<div class="part-divider" id="early-part"><small>1부 · 조선 전기와 양난</small><h2>건국에서 병자호란까지</h2><p>새 왕조를 세우고 제도를 다진 뒤, 사화와 두 번의 큰 전쟁을 지나는 이야기.</p></div>\n'
           + early_body + divider + late_conv + end + early_tail)
    doc = add_scripts(doc)
    doc = renumber_static(doc)
    write('joseon-all-comic.html', doc)
    return len(SCENE_RE.findall(doc))


if __name__ == '__main__':
    # 고려·조선 전기·조선 후기(와 통합 조선 웹툰)는 강의 강조 구성으로 scripts/build_lecture_comics.py가 만든다.
    # 여기서 다시 만들면 옛 장면이 덧붙으므로 건너뛴다.
    # 독도와 간도는 두 주제 한 페이지 학습으로 scripts/build_islands_comic.py가 만든다.
    # 일제 강점기는 네 흐름 한 페이지 학습으로 scripts/build_colonial_comic.py가 만든다.
    # 광복과 대한민국(현대사)은 다섯 흐름 한 페이지 학습으로 scripts/build_modern_comic.py가 만든다.
    # 선사시대는 네 흐름 한 페이지 학습으로 scripts/build_prehistory_comic.py가 만든다.
    # 고조선과 여러 나라는 두 흐름 한 페이지 학습으로 scripts/build_gojoseon_comic.py가 만든다.
    # 남북국 시대는 네 흐름 한 페이지 학습으로 scripts/build_nambuk_comic.py가 만든다(그림판은 media/nambuk-sheets/).
    # 삼국시대는 네 흐름 한 페이지 학습으로 scripts/build_samguk_comic.py가 만든다(그림판은 media/samguk-sheets/).
    LECTURE_MANAGED = {'goryeo', 'joseon-early', 'joseon-late', 'islands', 'colonial', 'modern', 'prehistory', 'gojoseon', 'nambuk', 'samguk'}
    counts = {era: build_era(era) for era in FILES if era not in LECTURE_MANAGED}
    for k, v in counts.items():
        print('%-14s %d' % (k, v))
