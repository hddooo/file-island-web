/* Procedural battle materials only. No network, input handling, combat clocks or state writes. */
(function (root) {
    'use strict';
    var live = new Set(), raf = 0, last = 0, mq = root.matchMedia('(prefers-reduced-motion: reduce)'), maps = {}, epoch = performance.now();
    function hash(x, y) { var v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); }
    function mix(a, b, t) { return a + (b - a) * t; }
    function smooth(t) { return t * t * (3 - 2 * t); }
    function noise(x, y) { var a = Math.floor(x), b = Math.floor(y), u = smooth(x - a), v = smooth(y - b); return mix(mix(hash(a, b), hash(a + 1, b), u), mix(hash(a, b + 1), hash(a + 1, b + 1), u), v); }
    function fbm(x, y) { return noise(x, y) * .55 + noise(x * 2.07 + 11, y * 2.07 + 7) * .29 + noise(x * 4.13 + 5, y * 4.13 + 13) * .16; }
    function atlas(sun) { var key = sun ? 'sun' : 'fire'; if (maps[key])
        return maps[key]; var w = 256, h = 128, p = new Uint8ClampedArray(w * h * 4); for (var y = 0; y < h; y++)
        for (var x = 0; x < w; x++) {
            var u = x / w * 9, v = y / h * 6, n = fbm(u, v), fine = noise(u * 7, v * 7);
            var r, g, b, heat;
            if (sun) {
                var cu = u + (fbm(u * .85 + 15, v * .85) - .5) * .8, cv = v + (fbm(u * .85, v * .85 + 23) - .5) * .8, cx = Math.floor(cu), cy = Math.floor(cv), one = 99, two = 99;
                for (var j = -1; j <= 1; j++)
                    for (var i = -1; i <= 1; i++) {
                        var xx = cx + i, yy = cy + j, dx = cu - xx - .12 - hash(xx, yy) * .76, dy = cv - yy - .12 - hash(xx + 19, yy + 31) * .76, d = dx * dx + dy * dy;
                        if (d < one) {
                            two = one;
                            one = d;
                        }
                        else if (d < two)
                            two = d;
                    }
                var ridge = Math.sqrt(two) - Math.sqrt(one), crack = 1 - smooth(Math.min(1, Math.max(0, (ridge - (.015 + n * .025)) / .07)));
                var granule = fbm(u * 5 + 17, v * 5 + 29);
                heat = Math.min(1, .05 + n * .85 + granule * .36);
                r = 255;
                g = 62 + heat * 163;
                b = 5 + heat * 83;
                var dark = .68 + fine * .22;
                r = mix(r, 96 + fine * 35, crack * dark);
                g = mix(g, 34 + fine * 25, crack * dark);
                b = mix(b, 12 + fine * 12, crack * dark);
            }
            else {
                heat = Math.pow(n, 1.7);
                r = 255;
                g = 58 + heat * 195;
                b = 8 + heat * 123;
                var streak = Math.max(0, noise(u * 1.2, v * 8) - .67) * 2;
                r -= streak * 23;
                g -= streak * 62;
            }
            var k = (y * w + x) * 4;
            p[k] = r;
            p[k + 1] = g;
            p[k + 2] = b;
            p[k + 3] = 255;
        } return maps[key] = { data: p, w: w, h: h }; }
    function sphere(size) { var c = document.createElement('canvas'); c.width = c.height = size; var ctx = c.getContext('2d'), image = ctx.createImageData(size, size), points = []; for (var y = 0; y < size; y++)
        for (var x = 0; x < size; x++) {
            var nx = (x + .5 - size / 2) / (size / 2), ny = (y + .5 - size / 2) / (size / 2), d = nx * nx + ny * ny;
            if (d > 1)
                continue;
            var z = Math.sqrt(1 - d), u = Math.atan2(nx, z) / (Math.PI * 2) + .5, v = Math.asin(ny) / Math.PI + .5, lighting = .65 + .35 * Math.max(0, (-nx * .35 - ny * .4 + z * .85));
            points.push([(y * size + x) * 4, u, v, lighting, z]);
        } return { canvas: c, ctx: ctx, image: image, points: points }; }
    function paintSphere(s, t, sun) { var a = atlas(sun), data = s.image.data, turn = t * (sun ? .026 : .095); for (var i = 0; i < s.points.length; i++) {
        var p = s.points[i], u = p[1] + turn + Math.sin(p[2] * 19 + t * .9) * (sun ? .035 : .022) + Math.sin(p[1] * 25 + t * .55) * .012, v = p[2] + Math.sin(p[1] * 16 + t * .7) * (sun ? .026 : .016), x = ((Math.floor(u * a.w) % a.w) + a.w) % a.w, y = Math.max(0, Math.min(a.h - 1, Math.floor(v * a.h))), k = (y * a.w + x) * 4, edge = Math.pow(1 - p[4], 2) * .3, l = p[3];
        data[p[0]] = Math.min(255, a.data[k] * l + edge * 90);
        data[p[0] + 1] = Math.min(255, a.data[k + 1] * l + edge * 16);
        data[p[0] + 2] = a.data[k + 2] * l;
        data[p[0] + 3] = 255;
    } s.ctx.putImageData(s.image, 0, 0); }
    function radial(ctx, x, y, r, colors) { var g = ctx.createRadialGradient(x, y, r * .35, x, y, r); colors.forEach(function (c) { g.addColorStop(c[0], c[1]); }); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    function ball(o, t, sun) {
        var c = o.ctx, w = o.canvas.width, h = o.canvas.height, x = w / 2, y = h / 2, r = w / 3;
        c.clearRect(0, 0, w, h);
        var phase = o.charge ? 1 : 0, dir = o.direction;
        radial(c, x, y, r * (sun ? 1.48 : 1.31), [[0, '#ffcc5340'], [.6, '#fc7a203d'], [1, '#e75b1000']]);
        // Rounded billows, never triangular spikes. Each cell has continuous motion rather than flashing brightness.
        for (var i = 0; i < (sun ? 20 : 12); i++) {
            var a = i * Math.PI * 2 / (sun ? 20 : 12) + t * (sun ? .09 : .17), jitter = Math.sin(i * 2.3 + t * 1.1) * .035, rr = r * (.96 + jitter), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr, pr = r * (sun ? .12 : .105) * (1 + Math.sin(t * 1.3 + i) * .15);
            radial(c, px, py, pr * 1.6, [[0, '#ffc24e9c'], [.5, '#ed631e6e'], [1, '#bf361000']]);
        }
        paintSphere(o.sphere, t, sun);
        c.save();
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.clip();
        c.drawImage(o.sphere.canvas, x - r, y - r, r * 2, r * 2);
        var glow = c.createRadialGradient(x - r * .28, y - r * .35, 0, x, y, r);
        glow.addColorStop(0, sun ? '#fff4b92a' : '#fff2ba99');
        glow.addColorStop(.5, '#ffe0a000');
        glow.addColorStop(1, '#bd351926');
        c.fillStyle = glow;
        c.fillRect(x - r, y - r, r * 2, r * 2);
        c.restore();
        if (o.impact) {
            var eruption = Math.min(1, o.age / .7);
            radial(c, x, y, r * .92, [[0, 'rgba(255,240,176,' + (.18 + eruption * .38) + ')'], [.35, 'rgba(255,188,73,' + (.1 + eruption * .2) + ')'], [1, '#e9550f00']]);
        }
        if (sun) {
            c.shadowColor = '#ef761a99';
            c.shadowBlur = r * .045;
            for (var k = 0; k < 6; k++) {
                var a0 = k * 1.13 + t * .09, span = .13 + hash(k, 7) * .17, outer = r * (1.14 + .12 * Math.sin(t * .65 + k));
                c.beginPath();
                c.moveTo(x + Math.cos(a0) * r * .94, y + Math.sin(a0) * r * .94);
                c.bezierCurveTo(x + Math.cos(a0 + .04) * outer, y + Math.sin(a0 + .04) * outer, x + Math.cos(a0 + span - .03) * outer, y + Math.sin(a0 + span - .03) * outer, x + Math.cos(a0 + span) * r * .96, y + Math.sin(a0 + span) * r * .96);
                c.strokeStyle = k % 2 ? '#ffb63b88' : '#ffdc7899';
                c.lineWidth = Math.max(1.5, r * .028);
                c.stroke();
            }
            c.shadowBlur = 0;
        }
        else if (!phase) {
            c.save();
            c.translate(x, y);
            c.scale(dir, 1);
            for (var trail = 0; trail < 5; trail++) {
                var age = (t * .8 + trail * .21) % 1, tx = -r * (.75 + age * .65), ty = Math.sin(trail * 2.3 + t * 3) * r * .23;
                radial(c, tx, ty, r * (.2 - age * .1), [[0, '#ffd77a8c'], [.6, '#ed752447'], [1, '#d24a1000']]);
            }
            c.restore();
        }
        for (var e = 0; e < (sun ? 16 : 9); e++) {
            var angle = e * 2.4 + t * .24, dist = r * (1.05 + ((t * .22 + hash(e, 8)) % 1) * .33), p = Math.max(1, r * .015);
            c.fillStyle = e % 3 ? '#ffb74a99' : '#ffe79a99';
            c.beginPath();
            c.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, p, 0, Math.PI * 2);
            c.fill();
        }
    }
    function missile(o, t) {
        var c = o.ctx, w = o.canvas.width, h = o.canvas.height;
        c.clearRect(0, 0, w, h);
        c.save();
        c.translate(w * .5, h * .5);
        var bw = w / 1.9, bh = h / 3.6;
        c.lineJoin = 'round';
        if (o.charge) {
            radial(c, 0, 0, bw * .42, [[0, '#fff3c6bb'], [.3, '#f4a53799'], [.6, '#577d9955'], [1, '#18384a00']]);
            c.strokeStyle = '#7c9aa5';
            c.lineWidth = 2;
            c.strokeRect(-bw * .2, -bh * .4, bw * .4, bh * .8);
            c.restore();
            return;
        }
        // Plume and curling smoke originate at the tail; the opaque airframe remains unmistakable.
        for (var i = 7; i >= 0; i--) {
            var age = (t * 1.4 + i * .12) % 1, px = -bw * (.28 + age * .9), py = Math.sin(i * 1.4 + t * 4) * bh * .28;
            c.fillStyle = 'rgba(152,150,139,' + (.18 * (1 - age)) + ')';
            c.beginPath();
            c.ellipse(px, py, bh * (.3 + age * .5), bh * (.28 + age * .7), 0, 0, 7);
            c.fill();
        }
        var flame = c.createLinearGradient(-bw * .85, 0, -bw * .25, 0);
        flame.addColorStop(0, '#f06a1800');
        flame.addColorStop(.5, '#ff812788');
        flame.addColorStop(.8, '#ffca4c');
        flame.addColorStop(1, '#fff4c3');
        c.fillStyle = flame;
        c.beginPath();
        c.moveTo(-bw * .29, -bh * .22);
        c.quadraticCurveTo(-bw * .55, -bh * .42, -bw * (.82 + Math.sin(t * 24) * .045), 0);
        c.quadraticCurveTo(-bw * .55, bh * .42, -bw * .29, bh * .22);
        c.fill();
        c.strokeStyle = '#263b46';
        c.lineWidth = Math.max(1, bw * .025);
        c.fillStyle = '#607e87';
        c.beginPath();
        c.moveTo(-bw * .25, -bh * .22);
        c.lineTo(-bw * .35, -bh * .95);
        c.lineTo(bw * .05, -bh * .24);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(-bw * .25, bh * .22);
        c.lineTo(-bw * .35, bh * .95);
        c.lineTo(bw * .05, bh * .24);
        c.closePath();
        c.fill();
        c.stroke();
        var metal = c.createLinearGradient(0, -bh * .32, 0, bh * .32);
        metal.addColorStop(0, '#d4e4e3');
        metal.addColorStop(.28, '#92adb5');
        metal.addColorStop(.6, '#eef3e8');
        metal.addColorStop(1, '#435f6d');
        c.fillStyle = metal;
        c.beginPath();
        c.moveTo(-bw * .34, -bh * .29);
        c.lineTo(bw * .24, -bh * .29);
        c.lineTo(bw * .48, 0);
        c.lineTo(bw * .24, bh * .29);
        c.lineTo(-bw * .34, bh * .29);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = '#d26132';
        c.fillRect(bw * .15, -bh * .26, bw * .045, bh * .52);
        c.strokeStyle = '#4b6874';
        c.lineWidth = 1;
        for (var k = 0; k < 3; k++) {
            var xx = -bw * .22 + k * bw * .13;
            c.beginPath();
            c.moveTo(xx, -bh * .23);
            c.lineTo(xx, bh * .23);
            c.stroke();
        }
        c.fillStyle = '#283f4b';
        c.fillRect(-bw * .35, -bh * .21, bw * .075, bh * .42);
        c.restore();
    }
    function draw(o, now) { var began = performance.now(), t = mq.matches ? 0 : (now - o.started) / 1000; o.age = (now - o.born) / 1000; if (o.type === 'missile')
        missile(o, t);
    else
        ball(o, t, o.type === 'orb'); o.canvas.dataset.frame = String(++o.frames); o.canvas.dataset.drawMs = (performance.now() - began).toFixed(2); }
    function loop(now) { raf = 0; if (now - last < 32) {
        raf = requestAnimationFrame(loop);
        return;
    } last = now; live.forEach(function (o) { if (!o.node.isConnected) {
        live.delete(o);
        return;
    } draw(o, now); }); if (live.size && !mq.matches)
        raf = requestAnimationFrame(loop); }
    function start() { if (!raf && live.size)
        raf = requestAnimationFrame(loop); }
    function attach(node, type) { if (!['orb', 'flame', 'spark', 'missile'].includes(type))
        return false; node.dataset.materialV2 = type; var c = document.createElement('canvas'), charge = node.classList.contains('bi-charge'); c.className = 'bi-procedural-material'; c.setAttribute('aria-hidden', 'true'); node.appendChild(c); var base = type === 'orb' ? (innerWidth < 500 ? 256 : 384) : type === 'flame' ? 144 : type === 'missile' ? 192 : 80; c.width = base; c.height = type === 'missile' ? 96 : base; var o = { node: node, canvas: c, ctx: c.getContext('2d'), type: type, charge: charge, impact: node.classList.contains('bi-impact'), born: performance.now(), direction: node.dataset.direction === 'right' ? -1 : 1, started: epoch, frames: 0, sphere: type === 'missile' ? null : sphere(type === 'orb' ? (innerWidth < 500 ? 144 : 224) : type === 'flame' ? 112 : 64) }; if (!o.ctx) {
        c.remove();
        delete node.dataset.materialV2;
        return false;
    } live.add(o); draw(o, performance.now()); start(); return true; }
    function dispose(parent) { live.forEach(function (o) { if (!parent || parent.contains(o.node))
        live.delete(o); }); if (!live.size && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
    } }
    mq.addEventListener('change', function () { live.forEach(function (o) { draw(o, performance.now()); }); start(); });
    root.HanqBattleMaterials = { attach: attach, dispose: dispose, activeCount: function () { return live.size; } };
    if (root.requestIdleCallback)
        root.requestIdleCallback(function () { atlas(true); atlas(false); }, { timeout: 1500 });
})(window);
