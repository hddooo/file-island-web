# -*- coding: utf-8 -*-
"""의존성 없는 PNG 읽기·쓰기 (8비트 RGB/RGBA, 비인터레이스). 장면 그림 자르기·측정용."""
import struct, zlib


def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', path
    pos, idat, w = 8, [], None
    while pos < len(data):
        ln, typ = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, bd, ct, _, _, il = struct.unpack('>IIBBBBB', body)
            assert bd == 8 and ct in (2, 6) and il == 0, (path, bd, ct, il)
            bpp = 3 if ct == 2 else 4
        elif typ == b'IDAT':
            idat.append(body)
        elif typ == b'IEND':
            break
        pos += 12 + ln
    raw = zlib.decompress(b''.join(idat))
    stride = w * bpp
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        f = raw[i]; line = bytearray(raw[i + 1:i + 1 + stride]); i += 1 + stride
        if f == 1:
            for x in range(bpp, stride): line[x] = (line[x] + line[x - bpp]) & 255
        elif f == 2:
            for x in range(stride): line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride): line[x] = (line[x] + ((line[x - bpp] if x >= bpp else 0) + prev[x]) // 2) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0; b = prev[x]; c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else (b if pb <= pc else c))) & 255
        rows.append(line); prev = line
    # RGB로 통일
    if bpp == 4:
        rows = [bytearray(b for k in range(w) for b in r[k * 4:k * 4 + 3]) for r in rows]
    return w, h, rows


def _filter_rows(rows, bpp=3):
    """행마다 None/Sub/Up/Paeth 중 절댓값 합이 가장 작은 필터를 고른다(무손실)."""
    out, prev = [], bytes(len(rows[0]))
    for r in rows:
        r = bytes(r); n = len(r)
        sub = bytes((r[i] - (r[i - bpp] if i >= bpp else 0)) & 255 for i in range(n))
        up = bytes((r[i] - prev[i]) & 255 for i in range(n))
        pa = bytearray(n)
        for i in range(n):
            a = r[i - bpp] if i >= bpp else 0; b = prev[i]; c = prev[i - bpp] if i >= bpp else 0
            p = a + b - c; da, db, dc = abs(p - a), abs(p - b), abs(p - c)
            pa[i] = (r[i] - (a if da <= db and da <= dc else (b if db <= dc else c))) & 255
        cands = [(0, r), (1, sub), (2, up), (4, bytes(pa))]
        score = lambda d: sum(x if x < 128 else 256 - x for x in d)
        f, d = min(cands, key=lambda t: score(t[1]))
        out.append(bytes([f]) + d); prev = r
    return b''.join(out)


def write_png(path, w, h, rows):
    raw = _filter_rows(rows)
    def chunk(t, b):
        return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def crop(rows, x, y, w, h):
    return [r[x * 3:(x + w) * 3] for r in rows[y:y + h]]
