# -*- coding: utf-8 -*-
"""조선 웹툰 그림판에서 장면 그림 24장을 실제 칸 경계대로 잘라 낸다(원본 그림판은 그대로 둔다).

  python3 scripts/extract_joseon_panels.py

왜: 그림판의 칸 크기가 고르지 않다(후기 세로 338·365·363·454px, 전기 306·308·297·319px).
CSS 'background-size:300% 400%'는 칸이 균등하다고 가정하므로 옆 칸·아래 칸이 띠처럼 섞이거나 그림이 잘렸다.
방법: 칸 사이 여백(밝고 채도가 낮은 줄)을 그림판 전체·칸 안에서 각각 재서 칸 사각형을 구하고,
여백만 빼고 칸 그림(작가가 그린 테두리 포함)을 무손실 PNG로 저장한다. 결과는 media/joseon-panels/manifest.json.
"""
import hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pngtool import read_png, write_png, crop

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'media')
OUT = os.path.join(MEDIA, 'joseon-panels')
SHEETS = [('early', 'joseon-story-grid.png', 3, 4), ('late', 'joseon-late-panels.png', 3, 4)]


def is_gutter(p):
    return min(p) > 200 and max(p) - min(p) < 45


def runs(flags):
    out, s = [], None
    for i, f in enumerate(flags + [False]):
        if f and s is None:
            s = i
        if not f and s is not None:
            out.append((s, i - 1)); s = None
    return out


def measure(w, h, rows, cols, nrows):
    px = lambda x, y: rows[y][x * 3:x * 3 + 3]
    colp = [sum(is_gutter(px(x, y)) for y in range(0, h, 2)) / (h / 2) for x in range(w)]
    rowp = [sum(is_gutter(px(x, y)) for x in range(0, w, 2)) / (w / 2) for y in range(h)]
    def spans(g, n):
        cuts = [(-1, -1)] + g + [(n, n)]
        return [(a[1] + 1, b[0] - 1) for a, b in zip(cuts, cuts[1:]) if b[0] - 1 - a[1] > 50]
    cs, rs = spans(runs([v > .5 for v in colp]), w), spans(runs([v > .5 for v in rowp]), h)
    if len(cs) != cols or len(rs) != nrows:
        raise SystemExit('칸 수가 예상과 다름: %d×%d' % (len(cs), len(rs)))
    rects = []
    for r, (y0, y1) in enumerate(rs):
        for c, (x0, x1) in enumerate(cs):
            lr = lambda y: sum(is_gutter(px(x, y)) for x in range(x0, x1 + 1, 2)) / ((x1 - x0) / 2 + 1)
            lc = lambda x: sum(is_gutter(px(x, y)) for y in range(y0, y1 + 1, 2)) / ((y1 - y0) / 2 + 1)
            a, b, l, rr = y0, y1, x0, x1
            while lr(a) > .5: a += 1
            while lr(b) > .5: b -= 1
            while lc(l) > .5: l += 1
            while lc(rr) > .5: rr -= 1
            rects.append(dict(row=r, col=c, x=l, y=a, w=rr - l + 1, h=b - a + 1))
    return rects


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for prefix, name, cols, nrows in SHEETS:
        src = os.path.join(MEDIA, name)
        w, h, rows = read_png(src)
        rects = measure(w, h, rows, cols, nrows)
        items = []
        for i, rc in enumerate(rects):
            fn = '%s-%02d.png' % (prefix, i + 1)
            path = os.path.join(OUT, fn)
            pix = crop(rows, rc['x'], rc['y'], rc['w'], rc['h'])
            digest = hashlib.sha256(b''.join(bytes(r) for r in pix)).hexdigest()
            # 같은 픽셀이면 다시 쓰지 않는다(재실행해도 파일이 바뀌지 않음)
            old = next((x for x in manifest_prev().get(name, {}).get('panels', []) if x['file'] == fn), None)
            if not (old and old.get('pixels_sha256') == digest and os.path.exists(path)):
                write_png(path, rc['w'], rc['h'], pix)
            items.append(dict(file=fn, scene=i + 1, **rc, pixels_sha256=digest))
        manifest[name] = dict(source_size=[w, h], source_sha256=hashlib.sha256(open(src, 'rb').read()).hexdigest(), panels=items)
        print(name, ' '.join('%s:%d,%d,%dx%d' % (it['file'], it['x'], it['y'], it['w'], it['h']) for it in items))
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)


_prev = None
def manifest_prev():
    global _prev
    if _prev is None:
        p = os.path.join(OUT, 'manifest.json')
        _prev = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
    return _prev


if __name__ == '__main__':
    main()
