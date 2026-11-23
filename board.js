/* Disegni SVG della base (in mm, coordinate della base). Servono a:
   - modello.html  -> pezzi da stampare 1:1
   - schema.html   -> cosa legge la camera
   - index.html    -> base finta per la demo senza camera
   Richiede layout.js, vendor/cv.js e vendor/aruco.js. */
var BOARD = (function () {
  var L = LAYOUT;
  var dict = null;
  function f(n) { return Math.round(n * 100) / 100; }
  function rad(a) { return a * Math.PI / 180; }
  /* angolo 0 = ore 12, positivo in senso orario */
  function polar(cx, cy, r, a) { return [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))]; }

  function marker(id, cx, cy, size, quiet) {
    if (!dict) dict = new AR.Dictionary('ARUCO_MIP_36h12');
    var code = dict.codeList[id], cell = size / 8, x0 = cx - size / 2, y0 = cy - size / 2, s = '';
    var q = quiet == null ? cell : quiet;
    s += '<rect x="' + f(x0 - q) + '" y="' + f(y0 - q) + '" width="' + f(size + 2 * q) + '" height="' + f(size + 2 * q) + '" fill="#fff"/>';
    s += '<rect x="' + f(x0) + '" y="' + f(y0) + '" width="' + f(size) + '" height="' + f(size) + '" fill="#000"/>';
    for (var y = 0; y < 6; y++) for (var x = 0; x < 6; x++)
      if (code[y * 6 + x] == '1')
        s += '<rect x="' + f(x0 + (x + 1) * cell) + '" y="' + f(y0 + (y + 1) * cell) + '" width="' + f(cell + .05) + '" height="' + f(cell + .05) + '" fill="#fff"/>';
    return s;
  }

  function text(x, y, t, size, opts) {
    opts = opts || {};
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-size="' + size + '" font-family="Helvetica,Arial,sans-serif" font-weight="' + (opts.w || 600) +
      '" text-anchor="' + (opts.a || 'middle') + '" fill="' + (opts.c || '#111') + '"' + (opts.ls ? ' letter-spacing="' + opts.ls + '"' : '') +
      (opts.rot ? ' transform="rotate(' + opts.rot + ' ' + f(x) + ' ' + f(y) + ')"' : '') + '>' + t + '</text>';
  }

  function pad(p, ring, ringW) {
    return '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + f(p.r - ringW / 2) + '" fill="#fff" stroke="' + ring + '" stroke-width="' + ringW + '"/>';
  }

  function knobBase(k) {
    var s = '<circle cx="' + k.x + '" cy="' + k.y + '" r="' + (k.r + .8) + '" fill="none" stroke="#999" stroke-width=".3" stroke-dasharray="1.2 1"/>';
    s += '<path d="M' + (k.x - 2) + ' ' + k.y + 'h4M' + k.x + ' ' + (k.y - 2) + 'v4" stroke="#999" stroke-width=".3"/>';
    for (var j = 0; j <= 18; j++) {
      var b = -135 + j * 15, len = 2 + j * .3;
      var q1 = polar(k.x, k.y, k.r + 2, b), q2 = polar(k.x, k.y, k.r + 2 + len, b);
      s += '<line x1="' + f(q1[0]) + '" y1="' + f(q1[1]) + '" x2="' + f(q2[0]) + '" y2="' + f(q2[1]) + '" stroke="#111" stroke-width=".7" stroke-linecap="round"/>';
    }
    return s;
  }

  /* Colonna comandi 70 x 325, coordinate della base */
  function panel(opts) {
    opts = opts || {};
    var P = L.panel, s = '', pl = L.pads.play, rs = L.pads.restart, sp = L.knobs.speed;
    s += '<rect x="' + P.x + '" y="' + P.y + '" width="' + P.w + '" height="' + P.h + '" fill="#fff" stroke="' + (opts.cut ? '#aaa' : '#111') + '" stroke-width="' + (opts.cut ? .3 : .6) + '"' + (opts.cut ? ' stroke-dasharray="2 1.5"' : '') + '/>';
        /* START / STOP: triangolo + quadrato sopra il cerchio */
    s += pad(pl, '#111', 3.2);
    s += '<path d="M' + (pl.x - 9) + ' ' + (pl.y - pl.r - 9) + 'l5 3l-5 3z" fill="#111"/><rect x="' + (pl.x + 3) + '" y="' + (pl.y - pl.r - 9) + '" width="6" height="6" fill="#111"/>';
    s += text(pl.x, pl.y + pl.r + 7, 'START · STOP', 3.3);
    /* RESTART: freccia circolare */
    s += pad(rs, '#111', 3.2);
    s += '<path d="M' + (rs.x - 4) + ' ' + (rs.y - rs.r - 9) + 'a4 4 0 1 0 4 -4" fill="none" stroke="#111" stroke-width="1"/><path d="M' + (rs.x - 1) + ' ' + (rs.y - rs.r - 15.5) + 'l3 2.5l-3 2.5z" fill="#111"/>';
    s += text(rs.x, rs.y + rs.r + 7, 'RESTART', 3.3);
    /* SPEED */
    s += knobBase(sp);
    s += text(sp.x - 20, sp.y + sp.r + 13, 'lento', 2.8, { w: 500 }) + text(sp.x + 20, sp.y + sp.r + 13, 'veloce', 2.8, { w: 500 });
    s += text(sp.x, sp.y - sp.r - 12, 'SPEED', 3.3);
    return s;
  }

  /* Cartoncino matrice 297 x 95 con griglia 4 x 16 */
  function matrix(opts) {
    opts = opts || {};
    var C = L.matrixCard, M = L.matrix, cw = M.w / M.cols, rh = M.h / M.rows, s = '';
    s += '<rect x="' + C.x + '" y="' + C.y + '" width="' + C.w + '" height="' + C.h + '" fill="#fff" stroke="' + (opts.cut ? '#aaa' : '#111') + '" stroke-width="' + (opts.cut ? .3 : .6) + '"' + (opts.cut ? ' stroke-dasharray="2 1.5"' : '') + '/>';
    s += '<rect x="' + M.x + '" y="' + M.y + '" width="' + M.w + '" height="' + M.h + '" fill="#fff" stroke="#111" stroke-width=".5"/>';
    for (var j = 1; j < M.cols; j++)
      s += '<line x1="' + f(M.x + j * cw) + '" x2="' + f(M.x + j * cw) + '" y1="' + M.y + '" y2="' + (M.y + M.h) + '" stroke="' + (j % 4 ? '#c4c4c4' : '#111') + '" stroke-width="' + (j % 4 ? .3 : .5) + '"/>';
    for (var i = 1; i < M.rows; i++)
      s += '<line x1="' + M.x + '" x2="' + (M.x + M.w) + '" y1="' + f(M.y + i * rh) + '" y2="' + f(M.y + i * rh) + '" stroke="#c4c4c4" stroke-width=".3"/>';
    L.drums.forEach(function (d, i) { s += text(C.x + 3, M.rowY(i) + 1, d.short, 2.2, { c: '#888', w: 500, a: 'middle', rot: -90 }); });
    return s;
  }

  function disc(cx, cy, r, dotR, dotDist, angle, label) {
    var p = polar(cx, cy, dotDist, angle || 0), s = '';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="#111" stroke-width=".4"/>';
    s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + dotR + '" fill="#000"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="1.2" fill="none" stroke="#999" stroke-width=".3"/>';
    if (label) s += text(cx, cy + r * .55, label, 2.6, { w: 500, c: '#999' });
    return s;
  }

  function sheetSlot() {
    var S = L.sheet, s = '', g = 12;
    s += '<rect x="' + S.x + '" y="' + S.y + '" width="' + S.w + '" height="' + S.h + '" fill="none" stroke="#bbb" stroke-width=".4" stroke-dasharray="3 2"/>';
    [[S.x, S.y, 1, 1], [S.x + S.w, S.y, -1, 1], [S.x, S.y + S.h, 1, -1], [S.x + S.w, S.y + S.h, -1, -1]].forEach(function (c) {
      s += '<path d="M' + (c[0] - 2.5 * c[2]) + ' ' + (c[1] + g * c[3]) + 'V' + (c[1] - 2.5 * c[3]) + 'H' + (c[0] + g * c[2]) + '" fill="none" stroke="#8a6d3b" stroke-width="2.5"/>';
    });
    return s;
  }

  /* Disegni della demo: foglio libero, 3 ottave (Do3 in basso, Do6 in alto) */
  function demoY(midi) { return L.read.y + L.read.h - ((midi - 48) + .5) / 36 * L.read.h; }
  function demoX(step) { return L.read.x + step * L.read.w / 16; }
  function stroke(pts, color, w) {
    return '<path d="M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + '" stroke="' + color + '" stroke-width="' + (w || 4) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
  }
  function dot(x, y, c, r) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + (r || 3.2) + '" fill="' + c + '"/>'; }
  function demoDrawing() {
    var C = {}; L.instruments.forEach(function (i) { C[i.key] = i.color; });
    var sw = L.read.w / 16, s = '<rect x="' + L.sheet.x + '" y="' + L.sheet.y + '" width="' + L.sheet.w + '" height="' + L.sheet.h + '" fill="#fbfbf7"/>';
    /* basso: Do La Fa Sol */
    [[0, 48], [4, 45 + 12], [8, 53], [12, 55]].forEach(function (b) { s += stroke([[demoX(b[0]) + 3, demoY(b[1])], [demoX(b[0] + 4) - 3, demoY(b[1])]], C.bass, 4); });
    /* piano: Fra Martino a puntini */
    [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 67, 64, 65, 67, 67].forEach(function (m, k) { s += dot(demoX(k) + sw / 2, demoY(m), C.piano, 3); });
    /* violino: linea lunga che sale */
    s += stroke([[demoX(0) + 4, demoY(72)], [demoX(4), demoY(72)], [demoX(6), demoY(76)], [demoX(8) - 4, demoY(76)]], C.violin, 3.5);
    /* chitarra: accenti a zig-zag */
    [2, 6, 10, 14].forEach(function (k) { s += stroke([[demoX(k) + 3, demoY(67) + 2], [demoX(k) + 8, demoY(69)], [demoX(k) + 13, demoY(67) + 2]], C.guitar, 2.8); });
    /* flauto: brillantini in alto */
    [[9, 81], [11, 79], [13, 81], [15, 83]].forEach(function (p) { s += dot(demoX(p[0]) + sw / 2, demoY(p[1]), C.flute, 3); });
    return s;
  }
  var DEMO_BEAT = [
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0]
  ];
  var TOKEN = ['#E8B90C', '#16975A', '#1D4ED8', '#E0322A'];
  function demoTokens() {
    var s = '', r = Math.min(L.matrix.w / L.matrix.cols, L.matrix.h / L.matrix.rows) * .38;
    DEMO_BEAT.forEach(function (row, i) { row.forEach(function (on, j) { if (on) s += dot(L.matrix.colX(j), L.matrix.rowY(i), TOKEN[i], f(r)); }); });
    return s;
  }

  /* Base completa: usata dalla demo, dallo schema e dalla pianta */
  function full(opts) {
    opts = opts || {};
    var s = '<rect x="0" y="0" width="' + L.board.w + '" height="' + L.board.h + '" fill="' + (opts.bg || '#fff') + '"/>';
    if (opts.sheetOnly) return s + demoDrawing();
    L.markers.forEach(function (m) { s += marker(m.id, m.x, m.y, m.size, 4); });
    s += panel({});
    s += matrix({});
    s += sheetSlot();
    if (opts.demo) {
      s += demoDrawing() + demoTokens();
      var k = L.knobs.speed;
      s += disc(k.x, k.y, k.r, 5, k.dot, opts.speedAngle == null ? -20 : opts.speedAngle);
    }
    return s;
  }

  function svg(content, x, y, w, h, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + x + ' ' + y + ' ' + w + ' ' + h + '" ' + (extra || '') + '>' + content + '</svg>';
  }

  return { marker: marker, panel: panel, matrix: matrix, disc: disc, sheetSlot: sheetSlot, full: full, svg: svg, text: text, polar: polar, demoBeat: DEMO_BEAT };
})();
