// ---------- mapas: tema, tabuleiro, cercas, taça e clima ----------
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
// gira um ponto (em células; centro do tabuleiro = 4.5) q quartos de volta no sentido horário
function rotPt(x, y, q) {
  const dx = x - 4.5, dy = y - 4.5;
  switch (q & 3) { case 1: return [4.5 - dy, 4.5 + dx]; case 2: return [4.5 - dx, 4.5 - dy]; case 3: return [4.5 + dy, 4.5 - dx]; default: return [x, y]; }
}
const frand = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

const THEME_VARS = { skyTop: '--sky-top', skyLow: '--sky-low', grass: '--grass', grassDark: '--grass-dark', wood: '--wood', woodDark: '--wood-dark', woodLight: '--wood-light', paper: '--paper', ink: '--ink', onBg: '--on-bg' };
function applyTheme(id) {
  const m = MAP_BY_ID[id] || MAPS[0], st = document.documentElement.style;
  for (const k in THEME_VARS) st.setProperty(THEME_VARS[k], m.css[k]);
  document.body.dataset.map = m.id;
  const tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.setAttribute('content', m.css.skyTop);
}

// ---------- fundo do tabuleiro (desenhado uma vez e guardado) ----------
const _bgCache = new Map();
function boardBg(map, S, dpr, n) {
  const key = [map.id, S, dpr, n].join('|'); if (_bgCache.has(key)) return _bgCache.get(key);
  if (_bgCache.size > 10) _bgCache.clear();
  const cv = document.createElement('canvas'); cv.width = cv.height = Math.max(1, Math.round(S * dpr));
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const cell = S / 9, race = n === 2, rnd = mulberry(hashStr(map.id + n + 'bg'));
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const k = (r + c) % 2;
    g.fillStyle = race && r === 0 ? map.goalTop[k] : race && r === 8 ? map.goalBot[k] : map.tile[k];
    g.fillRect(c * cell, r * cell, cell + .6, cell + .6);
  }
  const special = new Set(); if (!race) { special.add('4,4'); START[n].forEach(([r, c]) => special.add(r + ',' + c)); }
  const dark = shade(map.tile[0], -.2), light = shade(map.tile[0], .35);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if ((race && (r === 0 || r === 8)) || special.has(r + ',' + c)) continue;
    const x = c * cell, y = r * cell, p = rnd(), ox = x + cell * (.2 + rnd() * .6), oy = y + cell * (.25 + rnd() * .55);
    g.lineCap = 'round';
    if (map.deco === 'grass' || map.deco === 'flowers') {
      if (p < .32) { g.strokeStyle = dark; g.lineWidth = Math.max(1, cell * .035); g.beginPath(); for (const d of [-1, 0, 1]) { g.moveTo(ox + d * cell * .05, oy); g.lineTo(ox + d * cell * .09, oy - cell * .1); } g.stroke(); }
      if (map.deco === 'flowers' && p > .7) { const col = ['#fff', '#ffe14d', '#ff9ec7', '#c9a4ff'][(rnd() * 4) | 0]; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; g.fillStyle = col; g.beginPath(); g.arc(ox + Math.cos(a) * cell * .045, oy + Math.sin(a) * cell * .045, cell * .035, 0, TAU); g.fill(); } g.fillStyle = '#f0a020'; g.beginPath(); g.arc(ox, oy, cell * .025, 0, TAU); g.fill(); }
    } else if (map.deco === 'puddles') {
      if (p < .26) { g.fillStyle = 'rgba(150,190,235,.55)'; g.beginPath(); g.ellipse(ox, oy, cell * .24, cell * .12, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(ox - cell * .03, oy - cell * .02, cell * .12, cell * .045, 0, Math.PI, TAU * .9); g.stroke(); }
      else if (p < .4) { g.strokeStyle = dark; g.lineWidth = Math.max(1, cell * .035); g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox, oy - cell * .09); g.moveTo(ox + cell * .05, oy); g.lineTo(ox + cell * .08, oy - cell * .08); g.stroke(); }
    } else if (map.deco === 'snow') {
      if (p < .3) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(ox, oy, cell * .2, cell * .09, 0, 0, TAU); g.fill(); }
      else if (p < .5) { g.strokeStyle = 'rgba(150,200,240,.8)'; g.lineWidth = 1; const s = cell * .06; g.beginPath(); g.moveTo(ox - s, oy); g.lineTo(ox + s, oy); g.moveTo(ox, oy - s); g.lineTo(ox, oy + s); g.stroke(); }
    } else if (map.deco === 'spooky') {
      if (p < .22) { g.strokeStyle = dark; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ox - cell * .15, oy - cell * .1); g.lineTo(ox, oy); g.lineTo(ox + cell * .1, oy + cell * .12); g.moveTo(ox, oy); g.lineTo(ox + cell * .15, oy - cell * .08); g.stroke(); }
      else if (p > .93) { g.fillStyle = '#f08a1c'; g.strokeStyle = '#7a3a08'; g.lineWidth = 1; g.beginPath(); g.ellipse(ox, oy, cell * .14, cell * .1, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#3fae4a'; g.fillRect(ox - cell * .02, oy - cell * .15, cell * .04, cell * .06); }
    }
  }
  if (map.deco === 'spooky') { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [S, 0, -1, 1], [0, S, 1, -1], [S, S, -1, -1]]) { for (let i = 1; i <= 3; i++) { g.beginPath(); g.moveTo(cx + sx * cell * .9 * i / 3, cy); g.quadraticCurveTo(cx + sx * cell * .35 * i / 3, cy + sy * cell * .35 * i / 3, cx, cy + sy * cell * .9 * i / 3); g.stroke(); } g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * cell * .9, cy + sy * cell * .9); g.moveTo(cx + sx * cell * .9, cy); g.lineTo(cx, cy + sy * cell * .9); g.stroke(); } }
  if (!race) {
    START[n].forEach(([r, c], i) => {
      g.fillStyle = rgba(SEATS[i].color, .38); g.fillRect(c * cell, r * cell, cell + .6, cell + .6);
      g.strokeStyle = rgba(SEATS[i].color, .9); g.lineWidth = 2; g.strokeRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
    });
    const gr = g.createRadialGradient(4.5 * cell, 4.5 * cell, 0, 4.5 * cell, 4.5 * cell, cell * 1.1);
    gr.addColorStop(0, 'rgba(255,225,90,.75)'); gr.addColorStop(1, 'rgba(255,225,90,0)'); g.fillStyle = gr; g.fillRect(3.4 * cell, 3.4 * cell, cell * 2.2, cell * 2.2);
  }
  // luz e textura
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const x = c * cell, y = r * cell;
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x, y, cell, Math.max(1, cell * .035)); g.fillRect(x, y, Math.max(1, cell * .035), cell);
    g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(x, y + cell - Math.max(1, cell * .035), cell, Math.max(1, cell * .035)); g.fillRect(x + cell - Math.max(1, cell * .035), y, Math.max(1, cell * .035), cell);
    for (let k = 0; k < 7; k++) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'; g.fillRect(x + rnd() * cell, y + rnd() * cell, 1 + rnd() * 2.5, 1 + rnd() * 2.5); }
  }
  const vg = g.createRadialGradient(S / 2, S / 2, S * .32, S / 2, S / 2, S * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = vg; g.fillRect(0, 0, S, S);
  const lg = g.createLinearGradient(0, 0, S, S); lg.addColorStop(0, 'rgba(255,255,230,.12)'); lg.addColorStop(.5, 'rgba(255,255,230,0)'); lg.addColorStop(1, 'rgba(0,0,0,.08)'); g.fillStyle = lg; g.fillRect(0, 0, S, S);
  _bgCache.set(key, cv); return cv;
}

// ---------- cercas e taça ----------
function drawFence(g, cell, o, r, c, owner, alpha, bad, map) {
  g.save(); g.globalAlpha = alpha;
  const gap = cell * .08, th = cell * .13; let x1, y1, x2, y2;
  if (o === 'h') { y1 = y2 = (r + 1) * cell; x1 = c * cell + gap; x2 = (c + 2) * cell - gap; } else { x1 = x2 = (c + 1) * cell; y1 = r * cell + gap; y2 = (r + 2) * cell - gap; }
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = th + 3; g.beginPath(); g.moveTo(x1 + 2, y1 + 4); g.lineTo(x2 + 2, y2 + 4); g.stroke();
  g.strokeStyle = map.css.woodDark; g.lineWidth = th + 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.strokeStyle = bad ? '#e0443f' : map.css.woodLight; g.lineWidth = th; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  if (!bad) { g.strokeStyle = 'rgba(60,30,10,.28)'; g.lineWidth = Math.max(1, th * .12); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const nx = o === 'h' ? 0 : -th * .28, ny = o === 'h' ? -th * .28 : 0; g.strokeStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x2 + nx, y2 + ny); g.stroke(); }
  if (map.id === 'xmas' && !bad) { g.setLineDash([th * .8, th * .8]); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = th * .55; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]); }
  const cap = owner && SEATS[owner - 1] ? SEATS[owner - 1].color : owner ? '#bfb39a' : '#fff';
  for (let i = 0; i < 3; i++) {
    const px = x1 + (x2 - x1) * i / 2, py = y1 + (y2 - y1) * i / 2;
    g.fillStyle = bad ? '#e0443f' : cap; g.strokeStyle = map.css.woodDark; g.lineWidth = 2;
    g.beginPath(); g.roundRect(px - th * .75, py - th * .75, th * 1.5, th * 1.5, th * .4); g.fill(); g.stroke();
  }
  g.restore();
}
function drawTrophy(g, x, y, s, t) {
  g.save(); g.translate(x, y + Math.sin(t * 2.2) * s * .03); g.scale(s, s);
  const pul = .5 + .5 * Math.sin(t * 3), gr = g.createRadialGradient(0, 0, 0, 0, 0, .7 + pul * .06);
  gr.addColorStop(0, 'rgba(255,230,100,.7)'); gr.addColorStop(1, 'rgba(255,230,100,0)'); g.fillStyle = gr; g.fillRect(-.8, -.8, 1.6, 1.6);
  g.lineJoin = 'round'; g.lineWidth = .035; g.strokeStyle = '#8a5a00';
  g.beginPath(); g.roundRect(-.2, .27, .4, .1, .03); g.fillStyle = '#c98a10'; g.fill(); g.stroke();
  g.beginPath(); g.rect(-.05, .12, .1, .16); g.fillStyle = '#e9a920'; g.fill(); g.stroke();
  for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * .24, -.14, .11, sd > 0 ? -1.4 : Math.PI - 1.74 + .34, sd > 0 ? 1.5 : Math.PI + 1.4, sd < 0); g.lineWidth = .05; g.strokeStyle = '#e9a920'; g.stroke(); }
  g.lineWidth = .035; g.strokeStyle = '#8a5a00';
  g.beginPath(); g.moveTo(-.23, -.3); g.lineTo(.23, -.3); g.quadraticCurveTo(.23, .1, 0, .16); g.quadraticCurveTo(-.23, .1, -.23, -.3); g.closePath(); g.fillStyle = '#ffc83a'; g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.ellipse(-.12, -.12, .035, .1, .15, 0, TAU); g.fill();
  star(g, 0, -.1, .08, 0); g.fillStyle = '#fff6b0'; g.fill();
  g.restore();
}

// ---------- clima (sem guardar partículas: tudo calculado pelo tempo) ----------
function weatherParticles(g, W, H, t, w, low, dens) {
  const k = (low ? .5 : 1) * dens * (W * H) / 100000;
  if (w === 'rain') {
    g.strokeStyle = 'rgba(220,235,255,.5)'; g.lineWidth = 1.2; g.beginPath();
    for (let i = 0, n = Math.round(16 * k); i < n; i++) { const x = frand(i, 1) * (W + 40), y = ((frand(i, 2) * H + t * H * (.9 + frand(i, 3) * .5)) % (H + 30)) - 15; g.moveTo(x, y); g.lineTo(x - 5, y + 14); }
    g.stroke();
  } else if (w === 'snow') {
    g.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0, n = Math.round(14 * k); i < n; i++) { const x = (frand(i, 1) * W + Math.sin(t * .8 + i) * 14) % W, y = (frand(i, 2) * H + t * (22 + frand(i, 3) * 26)) % H; g.beginPath(); g.arc(x, y, 1.4 + frand(i, 4) * 2.2, 0, TAU); g.fill(); }
  } else if (w === 'fireflies' || w === 'pollen') {
    const ff = w === 'fireflies';
    for (let i = 0, n = Math.round((ff ? 6 : 9) * k); i < n; i++) {
      const x = (frand(i, 1) * W + Math.sin(t * .5 + i * 3) * W * .06 + W) % W, y = (frand(i, 2) * H + Math.cos(t * .4 + i * 2) * H * .04 + (ff ? 0 : t * 6) + H) % H;
      const a = ff ? .35 + .65 * Math.max(0, Math.sin(t * 1.6 + i * 4)) : .55;
      g.fillStyle = ff ? `rgba(255,245,130,${a * .35})` : 'rgba(255,255,230,.18)'; g.beginPath(); g.arc(x, y, ff ? 6 : 4, 0, TAU); g.fill();
      g.fillStyle = ff ? `rgba(255,250,170,${a})` : 'rgba(255,250,200,.75)'; g.beginPath(); g.arc(x, y, ff ? 2 : 1.6, 0, TAU); g.fill();
    }
  } else if (w === 'bats') {
    g.fillStyle = 'rgba(20,10,30,.85)';
    for (let i = 0, n = Math.max(2, Math.round(3 * k)); i < n; i++) {
      const sp = .045 + frand(i, 5) * .03, x = ((t * sp + frand(i, 1)) % 1.3 - .15) * W, y = H * (.12 + .6 * frand(i, 2)) + Math.sin(t * 2 + i * 2) * H * .02, s = 7 + frand(i, 6) * 6, f = Math.sin(t * 14 + i) * .6;
      g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-s * .6, -s * (.7 + f), -s * 1.3, -s * .1); g.quadraticCurveTo(-s * .8, s * .1, -s * .5, s * .35); g.quadraticCurveTo(-s * .2, s * .1, 0, s * .45); g.quadraticCurveTo(s * .2, s * .1, s * .5, s * .35); g.quadraticCurveTo(s * .8, s * .1, s * 1.3, -s * .1); g.quadraticCurveTo(s * .6, -s * (.7 + f), 0, 0); g.fill(); g.restore();
    }
  }
}

// ---------- cenário do céu (faixa de cima da página) ----------
const HORIZON = 230;
function cloud(g, x, y, s, a, col) { g.fillStyle = col || `rgba(255,255,255,${a})`; g.beginPath(); for (const [dx, dy, r] of [[0, 0, 1], [.9, .15, .8], [-.9, .2, .75], [.35, -.45, .8], [-.4, -.3, .7]]) g.arc(x + dx * s, y + dy * s, r * s * .55, 0, TAU); g.fill(); }
function drawSky(g, W, t, map, low) {
  g.clearRect(0, 0, W, HORIZON + 50); g.save(); g.beginPath(); g.rect(0, 0, W, HORIZON); g.clip();
  const id = map.id, drift = (sp, off, wd) => ((t * sp + off) % (wd + 160)) - 80;
  if (id === 'farm') {
    const sg = g.createRadialGradient(W * .2, HORIZON - 8, 0, W * .2, HORIZON - 8, 120); sg.addColorStop(0, 'rgba(255,240,170,.95)'); sg.addColorStop(.3, 'rgba(255,190,110,.6)'); sg.addColorStop(1, 'rgba(255,170,100,0)'); g.fillStyle = sg; g.fillRect(0, 60, W * .7, 200);
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(W * .2, HORIZON - 6, 34, 0, TAU); g.fill();
    cloud(g, drift(5, 40, W), 70, 38, .75); cloud(g, drift(3, 200, W), 120, 30, .6);
    const bx = W - 96; g.fillStyle = '#b3342d'; g.fillRect(bx, HORIZON - 44, 64, 44); g.beginPath(); g.moveTo(bx - 6, HORIZON - 44); g.lineTo(bx + 32, HORIZON - 76); g.lineTo(bx + 70, HORIZON - 44); g.closePath(); g.fillStyle = '#8a2420'; g.fill();
    g.fillStyle = '#fff3dc'; g.fillRect(bx + 22, HORIZON - 30, 20, 30); g.strokeStyle = '#8a2420'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx + 22, HORIZON - 30); g.lineTo(bx + 42, HORIZON); g.moveTo(bx + 42, HORIZON - 30); g.lineTo(bx + 22, HORIZON); g.stroke();
    const wx = W * .56, wy = HORIZON - 52; g.fillStyle = '#6b4a35'; g.beginPath(); g.moveTo(wx - 7, HORIZON); g.lineTo(wx + 7, HORIZON); g.lineTo(wx + 3, wy); g.lineTo(wx - 3, wy); g.closePath(); g.fill();
    g.save(); g.translate(wx, wy); g.rotate(t * .5); g.fillStyle = '#f5ead6'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-3, -30, 6, 30); } g.restore();
  } else if (id === 'sunny') {
    const sx = W * .8, sy = 64; g.save(); g.translate(sx, sy); g.rotate(t * .12); g.fillStyle = 'rgba(255,240,150,.55)'; for (let i = 0; i < 12; i++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(-5, -46); g.lineTo(5, -46); g.lineTo(0, -84); g.closePath(); g.fill(); } g.restore();
    g.fillStyle = '#ffe14d'; g.beginPath(); g.arc(sx, sy, 38, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(sx - 10, sy - 12, 12, 0, TAU); g.fill();
    cloud(g, drift(7, 30, W), 80, 40, .95); cloud(g, drift(4, 190, W), 140, 32, .85); cloud(g, drift(5, 300, W), 40, 26, .8);
    g.strokeStyle = '#4a5a68'; g.lineWidth = 2; g.lineCap = 'round'; for (let i = 0; i < 2; i++) { const bx = drift(18 + i * 5, i * 120, W), by = 110 + i * 24 + Math.sin(t * 2 + i) * 4, f = Math.sin(t * 9 + i) * 3; g.beginPath(); g.moveTo(bx - 7, by + f); g.quadraticCurveTo(bx - 3, by - 4, bx, by); g.quadraticCurveTo(bx + 3, by - 4, bx + 7, by + f); g.stroke(); }
  } else if (id === 'rain') {
    for (const [x, y, s] of [[.1, 50, 56], [.35, 80, 64], [.62, 46, 60], [.88, 84, 58], [.5, 130, 50]]) cloud(g, ((x * W + t * 3) % (W + 160)) - 40, y, s, 1, 'rgba(70,82,98,.92)');
    const ph = (t % 9) / 9; if (ph > .86) { const a = (1 - (ph - .86) / .14); g.fillStyle = `rgba(255,255,240,${a * .45})`; g.fillRect(0, 0, W, HORIZON); g.strokeStyle = `rgba(255,255,220,${a})`; g.lineWidth = 3; const lx = W * (.2 + frand(Math.floor(t / 9), 8) * .6); g.beginPath(); g.moveTo(lx, 90); g.lineTo(lx - 10, 140); g.lineTo(lx + 6, 142); g.lineTo(lx - 8, 205); g.stroke(); }
  } else if (id === 'xmas') {
    g.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { const a = .3 + .7 * Math.abs(Math.sin(t * 1.5 + i * 2)); g.globalAlpha = a; g.beginPath(); g.arc(frand(i, 1) * W, frand(i, 2) * 150, 1.1 + frand(i, 3), 0, TAU); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(W * .8, 62, 24, 0, TAU); g.fill(); g.fillStyle = '#35597f'; g.beginPath(); g.arc(W * .8 + 10, 56, 21, 0, TAU); g.fill();
    for (const [x, h] of [[.08, 90], [.2, 66], [.74, 74], [.9, 100]]) {
      const px = W * x; g.fillStyle = '#17402f'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(px - h * (.32 - k * .06), HORIZON - h * (.12 + k * .26)); g.lineTo(px, HORIZON - h * (.5 + k * .26)); g.lineTo(px + h * (.32 - k * .06), HORIZON - h * (.12 + k * .26)); g.closePath(); g.fill(); }
      g.fillRect(px - 4, HORIZON - 12, 8, 12);
      for (let k = 0; k < 6; k++) { const on = Math.sin(t * 3 + k * 1.7 + x * 9) > 0; g.fillStyle = on ? ['#ff5a5a', '#ffd23f', '#6cf0ff', '#7dff7a'][k % 4] : 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(px + (frand(k, 3 + x * 7) - .5) * h * .4, HORIZON - h * (.2 + frand(k, 4 + x) * .55), 2.4, 0, TAU); g.fill(); }
    }
    const sx = W * .5, sy = HORIZON; g.fillStyle = '#fff'; g.strokeStyle = '#9bb8d4'; g.lineWidth = 1.5; for (const [y, r] of [[-14, 15], [-36, 11], [-52, 8]]) { g.beginPath(); g.arc(sx, sy + y, r, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#f08a1c'; g.beginPath(); g.moveTo(sx, sy - 52); g.lineTo(sx + 11, sy - 50); g.lineTo(sx, sy - 48); g.fill(); g.fillStyle = '#222'; g.fillRect(sx - 4, sy - 55, 2, 2); g.fillRect(sx + 2, sy - 55, 2, 2);
  } else if (id === 'halloween') {
    g.fillStyle = '#fff'; for (let i = 0; i < 20; i++) { g.globalAlpha = .25 + .6 * Math.abs(Math.sin(t * 1.2 + i * 3)); g.beginPath(); g.arc(frand(i, 1) * W, frand(i, 2) * 140, 1 + frand(i, 3), 0, TAU); g.fill(); } g.globalAlpha = 1;
    const mx = W * .74, my = 72, mg = g.createRadialGradient(mx, my, 20, mx, my, 90); mg.addColorStop(0, 'rgba(255,170,70,.55)'); mg.addColorStop(1, 'rgba(255,170,70,0)'); g.fillStyle = mg; g.fillRect(mx - 100, my - 100, 200, 200);
    g.fillStyle = '#ffb347'; g.beginPath(); g.arc(mx, my, 40, 0, TAU); g.fill(); g.fillStyle = 'rgba(190,100,30,.4)'; for (const [dx, dy, r] of [[-12, -8, 9], [10, 12, 7], [14, -14, 5]]) { g.beginPath(); g.arc(mx + dx, my + dy, r, 0, TAU); g.fill(); }
    const hx = W * .12; g.fillStyle = '#150b24'; g.fillRect(hx, HORIZON - 70, 80, 70); g.beginPath(); g.moveTo(hx - 8, HORIZON - 70); g.lineTo(hx + 40, HORIZON - 112); g.lineTo(hx + 88, HORIZON - 70); g.closePath(); g.fill(); g.fillRect(hx + 60, HORIZON - 110, 12, 30);
    for (const [wx2, wy2, k] of [[14, 52, 0], [52, 52, 1], [34, 26, 2]]) { g.fillStyle = Math.sin(t * 5 + k * 2.3) > -.6 ? '#ffd45a' : '#a07a20'; g.fillRect(hx + wx2, HORIZON - wy2, 12, 14); }
    g.strokeStyle = '#150b24'; g.lineWidth = 5; g.lineCap = 'round'; const tx = W * .9; g.beginPath(); g.moveTo(tx, HORIZON); g.lineTo(tx, HORIZON - 60); g.moveTo(tx, HORIZON - 40); g.lineTo(tx - 24, HORIZON - 70); g.moveTo(tx, HORIZON - 50); g.lineTo(tx + 20, HORIZON - 84); g.stroke();
    const fg = g.createLinearGradient(0, HORIZON - 40, 0, HORIZON); fg.addColorStop(0, 'rgba(200,170,255,0)'); fg.addColorStop(1, 'rgba(200,170,255,.35)'); g.fillStyle = fg; g.fillRect(0, HORIZON - 40, W, 40);
  }
  g.restore();
}

// ---------- tabuleiro completo ----------
// o: {map, st, q, t, dpr, hints, ghost, disp, looks, bubbles, floats, confetti, low, fxOn}
function drawBoard(g, S, o) {
  const cell = S / 9, st = o.st, map = o.map, q = o.q || 0, t = o.t || 0;
  g.setTransform(o.dpr, 0, 0, o.dpr, 0, 0); g.clearRect(0, 0, S, S);
  g.save(); g.translate(S / 2, S / 2); g.rotate(q * Math.PI / 2); g.translate(-S / 2, -S / 2);
  g.drawImage(boardBg(map, S, o.dpr, st.n), 0, 0, S, S);
  if (o.hints && o.hints.length) {
    const pul = .5 + .5 * Math.sin(t * 6);
    for (const m of o.hints) { g.fillStyle = `rgba(255,255,255,${.35 + pul * .3})`; g.strokeStyle = m.j ? '#ffe14d' : '#fff'; g.lineWidth = 3; g.beginPath(); g.arc((m.c + .5) * cell, (m.r + .5) * cell, cell * (.2 + pul * .05 + (m.j ? .06 : 0)), 0, TAU); g.fill(); g.stroke(); }
  }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { if (st.h[r][c]) drawFence(g, cell, 'h', r, c, st.h[r][c], 1, false, map); if (st.v[r][c]) drawFence(g, cell, 'v', r, c, st.v[r][c], 1, false, map); }
  if (o.ghost) drawFence(g, cell, o.ghost.o, o.ghost.r, o.ghost.c, st.turn + 1, .75 + Math.sin(t * 8) * .15, !o.ghost.ok, map);
  if (st.mode === 'cup') drawTrophy(g, 4.5 * cell, 4.5 * cell, cell * 1.05, t);
  g.restore();
  // porcos: sempre em pé, na ordem de profundidade da tela
  const vp = [], N2 = st.n; for (let i = 0; i < N2; i++) { const d = o.disp[i]; const [vx, vy] = rotPt(d.x + .5, d.y + .5, q); vp.push({ i, vx, vy }); }
  vp.sort((a, b) => a.vy - b.vy);
  for (const v of vp) { const z = (o.disp[v.i].z || 0); g.save(); g.fillStyle = `rgba(0,0,0,${.28 - z * .4})`; g.beginPath(); g.ellipse(v.vx * cell, v.vy * cell + cell * .33, cell * (.27 - z * .2), cell * .085, 0, 0, TAU); g.fill(); g.restore(); }
  if (o.dust) for (const d of o.dust) { const [dx, dy] = rotPt(d.x, d.y, q), a = Math.max(0, 1 - d.age); g.fillStyle = `rgba(${map.id === 'xmas' ? '255,255,255' : '225,205,170'},${a * .55})`; for (const k of [-1, 0, 1]) { g.beginPath(); g.arc((dx + k * (.12 + d.age * .18)) * cell, (dy - d.age * .12) * cell, cell * (.05 + d.age * .09), 0, TAU); g.fill(); } }
  for (const v of vp) drawPig(g, v.vx * cell, v.vy * cell + cell * .06 - (o.disp[v.i].z || 0) * cell, cell * .68, o.looks[v.i], t, { ring: SEATS[v.i].color, active: st.winner < 0 && st.turn === v.i, phase: v.i * 1.9, rot: 0 });
  if (o.fxOn !== false && map.weather) weatherParticles(g, S, S, t, map.weather, o.low, .7);
  // pontos voando e balões de chat
  for (const f of (o.floats || [])) { const [fx, fy] = rotPt(f.x, f.y, q), k = f.age; g.save(); g.globalAlpha = Math.max(0, 1 - k * k); g.font = `800 ${Math.round(cell * .38)}px Nunito, sans-serif`; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = 'rgba(60,30,10,.85)'; g.fillStyle = f.color || '#ffe14d'; g.strokeText(f.text, fx * cell, (fy - k * .9) * cell); g.fillText(f.text, fx * cell, (fy - k * .9) * cell); g.restore(); }
  for (const b of (o.bubbles || [])) {
    const v = vp.find(p => p.i === b.i); if (!v) continue;
    const emoji = b.text.length <= 3, fs = Math.round(cell * (emoji ? .5 : .27)); g.font = `800 ${fs}px Nunito, sans-serif`;
    const w = Math.min(S - 8, g.measureText(b.text).width + cell * .4), h = cell * (emoji ? .62 : .44);
    let bx = clamp(v.vx * cell - w / 2, 4, S - w - 4), by = v.vy * cell - cell * .82 - h; const below = by < 2; if (below) by = v.vy * cell + cell * .5;
    g.save(); g.globalAlpha = Math.min(1, b.left * 3); g.fillStyle = '#fff'; g.strokeStyle = SEATS[b.i].color; g.lineWidth = 2.5; g.beginPath(); g.roundRect(bx, by, w, h, h * .4); g.fill(); g.stroke();
    const tx = clamp(v.vx * cell, bx + 8, bx + w - 8); g.beginPath(); if (below) { g.moveTo(tx - 5, by + .5); g.lineTo(tx, by - 6); g.lineTo(tx + 5, by + .5); } else { g.moveTo(tx - 5, by + h - .5); g.lineTo(tx, by + h + 6); g.lineTo(tx + 5, by + h - .5); } g.fillStyle = '#fff'; g.fill(); g.stroke();
    g.fillStyle = '#4a2a14'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.text, bx + w / 2, by + h / 2 + 1); g.restore();
  }
  if (o.confetti) for (const f of o.confetti) { g.save(); g.translate(f.x * S, f.y * S); g.rotate(f.r); g.fillStyle = f.c; g.fillRect(-4, -2, 8, 4); g.restore(); }
}

// ---------- miniaturas (guardadas) ----------
const _thumbs = new Map();
const THUMB_FOCUS = { ch: [0, .78], head: [-.45, 1.3], face: [-.17, 1.45], neck: [.3, 1.2], body: [.35, 1.15], back: [.2, .95] };
function thumb(kind, id, size, dpr) {
  const key = kind + id + size + dpr; if (_thumbs.has(key)) return _thumbs.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(size * dpr); const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const look = { ch: 'torresmo', o: {} }; let f = THUMB_FOCUS.ch;
  if (kind === 'ch') look.ch = id; else { const it = ITEM_BY_ID[id]; look.o[it.slot] = id; f = THUMB_FOCUS[it.slot]; }
  const s = size * f[1]; drawPig(g, size / 2, size / 2 - f[0] * s, s, look, 0, { ring: null });
  _thumbs.set(key, cv); return cv;
}
