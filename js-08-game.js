// ---------- controle da partida (robôs, mesmo aparelho e online) ----------
let G = null, T = 0, CUR_MAP = MAP_BY_ID[P.map] || MAPS[0];
const DPR = () => Math.min(window.devicePixelRatio || 1, P.set.quality === 'low' ? 1.25 : 2);
const textOfChat = i => (i >= 0 && i < 12 ? EMOJIS[i] : i >= 12 && i < 24 ? PHRASES[i - 12] : null);

function randomLook() {
  const ch = pick(CHARS).id, o = {};
  for (const sl of SLOTS) if (Math.random() < .55) { const l = ITEMS.filter(i => i.slot === sl.id); o[sl.id] = pick(l).id; }
  return { ch, o };
}
function makeBots(count) { const names = BOT_NAMES.slice().sort(() => Math.random() - .5); return Array.from({ length: count }, (_, i) => ({ name: names[i], look: randomLook() })); }

function newGame(cfg) {
  const n = cfg.n, st = newState(n);
  G = Object.assign({
    on: true, st, g: 0, rev: 0, disp: st.p.map(p => ({ x: p.c, y: p.r })), floats: [], bubbles: [], confetti: [], sel: 'move', fo: 'h', ghost: null, legal: [], over: false,
    botBusy: false, dust: [], myMoves: 0, myWalls: 0, log: [], unread: 0, shownResult: false, me: 0, bot: [], names: [], looks: [], q: 0
  }, cfg);
  G.q = G.mode === 'online' ? (VIEWQ[START[n][G.me].join(',')] | 0) : 0;
  return G;
}
function startLocalGame(mode, n, map, diff) {
  const bots = makeBots(n - 1), names = [], looks = [], bot = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) { names.push(P.name); looks.push(myLook()); bot.push(false); }
    else if (mode === 'bots') { names.push(bots[i - 1].name); looks.push(bots[i - 1].look); bot.push(true); }
    else { names.push('Jogador ' + (i + 1)); looks.push(randomLook()); bot.push(false); }
  }
  newGame({ mode, n, map, diff, names, looks, bot, me: 0 });
  enterGame();
}
function startOnlineGame(r) {
  const seats = r.m.seats;
  newGame({ mode: 'online', n: r.m.n, map: r.m.map, diff: r.m.diff, names: seats.map(x => x ? x.name : '—'), looks: seats.map(x => x ? x.look : randomLook()), bot: seats.map(x => !!(x && x.bot)), me: Net.me, g: r.m.g });
  G.st = decState(r.s, r.m.n); G.rev = r.rev; G.disp = G.st.p.map(p => ({ x: p.c, y: p.r }));
  enterGame();
}
function enterGame() {
  CUR_MAP = MAP_BY_ID[G.map]; applyTheme(G.map); musicPlay(CUR_MAP.music);
  $('m-result').hidden = true; $('m-chat').hidden = true;
  showScreen('game'); $('gTitle').textContent = CUR_MAP.emoji + ' ' + CUR_MAP.name;
  $('chatBadge').hidden = true; layoutBoard();
  const pz = G.mode === 'puzzle'; $('ctrlPuz').hidden = !pz; $('bChat').hidden = pz; $('bPuzFinish').hidden = !(pz && G.puz.kind === 'block'); $('bModeFence').hidden = pz && G.puz.kind === 'maze';
  if (pz) $('gTitle').textContent = '🧩 ' + G.puz.title; else if (G.mode === 'career') $('gTitle').textContent = (G.cfg.boss ? '👑 ' : '🐷 ') + 'Fase ' + G.cfg.lv + ' · ' + G.cfg.worldName; else if (G.mode === 'event') $('gTitle').textContent = G.ev.emoji + ' ' + G.ev.name;
  setMode('move'); if (pz && G.puz.kind === 'block') G.ghost = { o: 'h', r: 3, c: 3, ok: canWall(G.st, 'h', 3, 3) };
  refreshTurn(); snd(G.cfg && G.cfg.boss ? 'boss' : 'turn');
}
function layoutBoard() {
  const cv = $('board'), S = Math.round(clamp(Math.min(innerWidth - 38, innerHeight - 330), 230, 500)), d = DPR();
  G.S = S; G.dpr = d; cv.style.width = cv.style.height = S + 'px'; cv.width = cv.height = Math.round(S * d);
}
const mineSeat = i => G.mode === 'local' || (G.mode === 'online' ? i === G.me : i === 0);
const humanTurn = () => G && G.on && G.st.winner < 0 && !G.bot[G.st.turn] && mineSeat(G.st.turn);
const canRunBots = () => G.mode !== 'online' || (Net.room && Net.room.m.host === deviceId());

function setMode(m) {
  if (G.mode === 'puzzle') m = G.puz.kind === 'block' ? 'fence' : 'move';
  G.sel = m; G.ghost = null; const s = G.st;
  $('bModeMove').classList.toggle('on', m === 'move'); $('bModeFence').classList.toggle('on', m === 'fence');
  $('ctrlMove').hidden = m !== 'move'; $('ctrlFence').hidden = m !== 'fence';
  $('fLeft').textContent = s.f[humanTurn() ? s.turn : (G.mode === 'online' ? G.me : 0)];
}
function refreshChips() {
  const box = $('pChips'), s = G.st; box.textContent = '';
  if (G.mode === 'puzzle') {
    const pz = G.puz, mk = t => { const c = el('div', 'pchip'); c.style.borderColor = '#3f7be0'; c.append(el('div', 'pn', t)); return c; };
    if (pz.kind === 'maze') box.append(mk('👣 Jogadas: ' + pz.moves), mk('🎯 Meta (3⭐): ' + pz.K));
    else box.append(mk('🚧 Cercas: ' + s.f[0]), mk('🐽 Rival: ' + dist(s, 1) + ' (antes ' + pz.base + ')'));
    return;
  }
  for (let i = 0; i < s.n; i++) {
    const c = el('div', 'pchip' + (s.turn === i && s.winner < 0 ? ' act' : '')); c.style.borderColor = SEATS[i].color;
    const nm = el('div', 'pn'); const dot = el('span', 'dot'); dot.style.background = SEATS[i].color; nm.append(dot, (G.bot[i] && G.mode !== 'local' ? '🤖' : '') + G.names[i]);
    c.append(nm, el('div', '', '🚧' + s.f[i] + '  ⭐' + s.sc[i])); box.append(c);
  }
}
function refreshTurn() {
  if (!G || !G.on) return; const s = G.st;
  refreshChips();
  G.legal = humanTurn() ? legalMoves(s, s.turn) : [];
  const t = s.turn; let msg;
  if (s.winner >= 0) msg = '🏆 ' + G.names[s.winner] + ' venceu!';
  else if (G.mode === 'puzzle') msg = G.puz.tip;
  else if (humanTurn()) msg = G.mode === 'local' ? 'Vez de ' + G.names[t] + '!' : 'Sua vez! 🐷';
  else msg = G.bot[t] ? G.names[t] + ' está pensando…' : 'Vez de ' + G.names[t];
  $('gStatus').textContent = msg;
  if (G.sel === 'fence' && !humanTurn()) setMode('move'); else $('fLeft').textContent = s.f[humanTurn() ? t : (G.mode === 'online' ? G.me : 0)];
  const hb = $('bModeFence'); hb.disabled = !humanTurn() || s.f[t] <= 0; $('bModeMove').disabled = !humanTurn();
  if (humanTurn() && G.mode !== 'local' && G.lastTurnSeat !== t + ':' + s.moves) snd('turn');
  G.lastTurnSeat = t + ':' + s.moves;
  if (s.winner < 0 && G.bot[t] && canRunBots() && !G.botBusy) {
    G.botBusy = true; const g0 = G.g, mv = s.moves;
    setTimeout(() => {
      if (!G || !G.on || G.g !== g0 || G.st.moves !== mv || G.st.winner >= 0) { if (G) G.botBusy = false; return; }
      G.botBusy = false; let a = null; try { a = aiChoose(cloneState(G.st), G.diff); } catch (e) { a = null; }
      if (a) commit(a, true); else passTurn();
    }, 650 + Math.random() * 600);
  }
}
function passTurn() { advanceTurn(G.st); syncOut(); afterState(); }
function stuck(s, i) { return s.f[i] <= 0 && legalMoves(s, i).length === 0; }
function advanceTurn(s) { let k = 0; do { s.turn = (s.turn + 1) % s.n; k++; } while (k < s.n && stuck(s, s.turn)); }

function addFloat(x, y, text, color) { G.floats.push({ x: x + .5, y: y + .2, text, color, age: 0 }); }
function commitPuzzle(a) {
  const s = G.st, pz = G.puz; G.undo.push(cloneState(s));
  const o0 = { r: s.p[0].r, c: s.p[0].c }; applyAction(s, a); s.turn = 0; G.ghost = null;
  if (a.t === 'move') { pz.moves++; snd('step'); G.dust.push({ x: o0.c + .5, y: o0.r + .8, age: 0 }); track('step'); if (atGoal(s, 0)) s.winner = 0; }
  else { snd('fence'); vibrate(20); if (pz.kind === 'block' && s.f[0] === 0) setTimeout(finishPuzzle, 500); }
  afterState();
}
function undoPuzzle() { if (!G || G.mode !== 'puzzle' || G.over || !G.undo.length) { snd('bad'); return; } const prev = G.undo.pop(); if (G.st.p[0].r !== prev.p[0].r || G.st.p[0].c !== prev.p[0].c) G.puz.moves = Math.max(0, G.puz.moves - 1); G.st = prev; snd('tap'); afterState(); }
function resetPuzzle() { if (!G || G.mode !== 'puzzle' || G.over) return; G.st = cloneState(G.init); G.undo = []; G.puz.moves = 0; G.disp = G.st.p.map(p => ({ x: p.c, y: p.r })); if (G.puz.kind === 'block') G.ghost = { o: 'h', r: 3, c: 3, ok: canWall(G.st, 'h', 3, 3) }; snd('tap'); afterState(); }
function finishPuzzle() {
  if (!G || G.mode !== 'puzzle' || G.over || G.st.winner >= 0) return; const st = puzzleStars(G.puz, G.st);
  if (st > 0) { G.st.winner = 0; afterState(); } else { toast('O rival ainda anda pouco (' + dist(G.st, 1) + ' passos). Desfaça e tente outro lugar!'); snd('bad'); }
}
function commit(a, bot) {
  if (G.mode === 'puzzle') return commitPuzzle(a);
  const s = G.st, pl = s.turn, info = scoreAction(s, a), o0 = { r: s.p[pl].r, c: s.p[pl].c }, mine = mineSeat(pl) && !G.bot[pl];
  applyAction(s, a); s.sc[pl] += info.pts;
  if (a.t === 'move') { G.dust.push({ x: o0.c + .5, y: o0.r + .8, age: 0 }); if (mine) { G.myMoves++; track('step'); if (a.j) track('jump'); } }
  else if (mine) { G.myWalls++; track('fence'); }
  if (a.t === 'move') {
    if (a.j) { s.jp[pl]++; snd('jump'); vibrate(30); } else snd('step', CHAR_BY_ID[G.looks[pl].ch].pitch);
    if (info.pts) addFloat(a.c, a.r, '+' + info.pts, a.j ? '#ffe14d' : '#fff');
    if (Math.random() < .12) setTimeout(() => snd('oink', CHAR_BY_ID[G.looks[pl].ch].pitch), 120);
  } else {
    snd('fence'); vibrate(20); addFloat(a.c + 1, a.r + 1, info.pts ? '+' + info.pts : '🚧', '#ffb36b');
    if (mineSeat(pl) && !G.bot[pl]) P.stats.walls++;
  }
  if (a.t === 'move' && atGoal(s, pl)) s.winner = pl; else advanceTurn(s);
  if (G.mode === 'event' && s.winner < 0 && s.moves % 6 === 0 && addObstacles(s, 1, Math.random)) { addFloat(4, 4, '🌀 LOUCURA!', '#ff7eb6'); snd('boing'); vibrate(60); }
  G.ghost = null; syncOut(); afterState();
}
function syncOut() {
  if (G.mode !== 'online') return;
  Net.sendState(G.st).catch(() => toast('Sem conexão… tente de novo'));
  G.rev = Math.max(G.rev, Net.revOut || 0);
}
function afterState() {
  if (G.sel === 'fence') setMode('move');
  refreshTurn();
  if (G.st.winner >= 0 && !G.shownResult) { G.shownResult = true; G.over = true; setTimeout(showResult, 900); }
}
// estado vindo do outro jogador (online)
function applyRemote(r) {
  const ns = decState(r.s, G.n), os = G.st;
  let moved = false, fenced = false;
  for (let i = 0; i < G.n; i++) { if (os.p[i].r !== ns.p[i].r || os.p[i].c !== ns.p[i].c) moved = true; if (os.f[i] !== ns.f[i]) fenced = true; }
  G.st = ns; G.rev = r.rev; G.ghost = null;
  if (fenced) snd('fence'); else if (moved) snd('step');
  afterState();
}

// ---------- fim de partida ----------
function fillResult(o) {
  $('rTitle').textContent = o.title; const rl = $('rList'); rl.textContent = '';
  (o.list || []).forEach(r => { const d = el('div'); d.append(el('span', '', r[0]), el('b', '', r[1])); rl.append(d); });
  const ln = $('rLines'); ln.textContent = ''; (o.lines || []).forEach(r => { const d = el('div'); d.append(el('span', '', r[0]), el('b', '', r[1])); ln.append(d); });
  $('rRew').textContent = o.rew || ''; $('rRew').style.whiteSpace = 'pre-line'; $('rAgain').textContent = o.again; $('rAgain').disabled = false;
  G.again = o.fn; G.resLook = o.look || G.looks[0]; G.resWin = o.win ? 0 : 1; if (!o.win) G.resLook = G.looks[1] || G.looks[0];
  $('m-result').hidden = false;
  if (o.win) { snd('win'); vibrate([60, 40, 60]); for (let i = 0; i < 90; i++) G.confetti.push({ x: Math.random(), y: -Math.random() * .6, vx: rnd(-.1, .1), vy: rnd(.2, .5), r: rnd(0, 6), vr: rnd(-6, 6), c: pick(['#ff7eb6', '#ffe14d', '#3f7be0', '#3fae4a', '#fff', '#f19a1c']) }); } else snd('lose');
}
function addTrophies(n) { const r0 = rankOf(P.trophies).idx; P.trophies += n; const r1 = rankOf(P.trophies); return r1.idx > r0 ? r1.name : null; }
const starTxt = n => '⭐'.repeat(n) + '☆'.repeat(3 - n);
function showResult() {
  if (!G || !G.on) return;
  if (G.mode === 'career' || G.mode === 'event' || G.mode === 'puzzle') return soloResult();
  const s = G.st, me = G.mode === 'online' ? G.me : 0, won = s.winner === me; track('games'); if (won && G.mode !== 'local') track('win');
  const rewards = G.mode !== 'local';
  const order = [...Array(s.n).keys()].sort((a, b) => (b === s.winner) - (a === s.winner) || finalTotal(s, b) - finalTotal(s, a));
  const mult = G.mode === 'bots' ? { easy: .7, medium: 1, hard: 1.5 }[G.diff] : 1;
  const lines = finalLines(s, me), total = finalTotal(s, me);
  let coins = 0, tro = 0, rankUp = null;
  if (rewards) {
    coins = Math.max(10, Math.round(total * .6 * mult)); tro = won ? Math.round((s.mode === 'race' ? 25 : 30) * mult) : 0;
    const r0 = rankOf(P.trophies).idx; P.trophies += tro; const r1 = rankOf(P.trophies);
    if (r1.idx > r0) rankUp = r1.name;
    P.stats.games++; if (won) P.stats.wins++; P.stats.best = Math.max(P.stats.best, total); addCoins(coins); save();
  }
  $('rTitle').textContent = won ? '🏆 Você ganhou!' : (G.mode === 'local' ? '🏆 ' + G.names[s.winner] + ' ganhou!' : '😵 ' + G.names[s.winner] + ' ganhou');
  const rl = $('rList'); rl.textContent = '';
  order.forEach((i, k) => { const d = el('div'); const a = el('span'); const dot = el('span', 'dot'); dot.style.background = SEATS[i].color; a.append(dot, (k + 1) + 'º ' + G.names[i]); d.append(a, el('b', '', finalTotal(s, i) + ' pts')); rl.append(d); });
  const ln = $('rLines'); ln.textContent = '';
  const add = (a, b) => { const d = el('div'); d.append(el('span', '', a), el('b', '', b)); ln.append(d); };
  add('Pontos da partida', s.sc[me]); lines.forEach(l => add(l[0], '+' + l[1]));
  $('rRew').textContent = rewards ? '+' + coins + ' 🪙' + (tro ? '   +' + tro + ' 🏆' : '') + (rankUp ? '\n⬆ Novo posto: ' + rankUp + '!' : '') : 'Sem moedas no modo mesmo aparelho';
  $('rRew').style.whiteSpace = 'pre-line';
  $('rAgain').textContent = G.mode === 'online' && Net.room && Net.room.m.host !== deviceId() ? '⏳ Esperando o anfitrião…' : '🔄 Jogar de novo';
  $('rAgain').disabled = G.mode === 'online' && Net.room && Net.room.m.host !== deviceId();
  $('m-result').hidden = false; G.resLook = G.looks[s.winner]; G.resWin = s.winner;
  if (won) { snd('win'); vibrate([60, 40, 60]); for (let i = 0; i < 90; i++) G.confetti.push({ x: Math.random(), y: -Math.random() * .6, vx: rnd(-.1, .1), vy: rnd(.2, .5), r: rnd(0, 6), vr: rnd(-6, 6), c: pick(['#ff7eb6', '#ffe14d', '#3f7be0', '#3fae4a', '#fff', '#f19a1c']) }); }
  else snd('lose');
}

// ---------- entrada (toque no tabuleiro) ----------
function boardPoint(e) {
  const cv = $('board'), r = cv.getBoundingClientRect(), S = cv.clientWidth, cell = S / 9;
  let vx = (e.clientX - r.left - cv.clientLeft) / cell, vy = (e.clientY - r.top - cv.clientTop) / cell;
  if (G.sel === 'fence' && e.pointerType === 'touch') vy -= .75;
  return rotPt(vx, vy, (4 - G.q) % 4);
}
function updateGhost(bx, by) {
  const ix = clamp(Math.round(bx), 1, 8), iy = clamp(Math.round(by), 1, 8), s = G.st, r = iy - 1, c = ix - 1;
  G.ghost = { o: G.fo, r, c, ok: s.f[s.turn] > 0 && canWall(s, G.fo, r, c) };
}
function onBoardDown(e) {
  if (!G || !humanTurn()) return; audInit(); e.preventDefault();
  const [bx, by] = boardPoint(e);
  if (G.sel === 'move') {
    const r = Math.floor(by), c = Math.floor(bx), m = G.legal.find(x => x.r === r && x.c === c);
    if (m) commit({ t: 'move', r, c, j: m.j }); else if (inb(r, c)) snd('bad');
  } else { updateGhost(bx, by); G.drag = true; try { $('board').setPointerCapture(e.pointerId); } catch (x) { } }
}
function onBoardMove(e) { if (G && G.drag && G.sel === 'fence') { const [bx, by] = boardPoint(e); updateGhost(bx, by); } }
function onBoardUp() {
  if (!G || !G.drag) return; G.drag = false;
  if (G.ghost && G.ghost.ok && !P.set.confirmWall) placeFence();
  else if (G.ghost && !G.ghost.ok) snd('bad');
}
function placeFence() { const g = G.ghost; if (g && g.ok && humanTurn()) commit({ t: 'wall', o: g.o, r: g.r, c: g.c }); }

// ---------- chat ----------
function pushBubble(seat, text) { G.bubbles = G.bubbles.filter(b => b.i !== seat); G.bubbles.push({ i: seat, text, left: 3.2 }); }
function logChat(seat, text) { G.log.push({ seat, text }); if (G.log.length > 6) G.log.shift(); renderChatLog(); }
function renderChatLog() {
  const box = $('chLog'); box.textContent = '';
  if (!G) return; G.log.forEach(m => { const d = el('div'); const dot = el('span', 'dot'); dot.style.background = SEATS[m.seat].color; d.append(dot, G.names[m.seat] + ': ' + m.text); box.append(d); });
  box.scrollTop = 9999;
}
function sendChat(i) {
  if (!G || !G.on) return; const text = textOfChat(i); if (!text) return;
  const seat = G.mode === 'online' ? G.me : 0; pushBubble(seat, text); logChat(seat, text); snd('chat');
  if (G.mode === 'online') Net.chat(i).catch(() => { });
  else if (G.mode !== 'local' && G.mode !== 'puzzle' && Math.random() < .6) {
    const g0 = G.g; setTimeout(() => { if (!G || !G.on || G.g !== g0) return; const b = 1 + ((Math.random() * (G.n - 1)) | 0), idx = 12 + pick(BOT_REPLY), tx = Math.random() < .3 ? pick(EMOJIS) : PHRASES[idx - 12]; pushBubble(b, tx); logChat(b, tx); snd('chat'); if (!$('m-chat').hidden === false) { G.unread++; $('chatBadge').hidden = false; } }, 1100 + Math.random() * 1400);
  }
}
function onRemoteChat(c) {
  if (!G || !G.on || G.mode !== 'online') return; const text = textOfChat(c.i); if (!text || c.seat < 0 || c.seat >= G.n) return;
  pushBubble(c.seat, text); logChat(c.seat, text); snd('chat'); if ($('m-chat').hidden) { G.unread++; $('chatBadge').hidden = false; }
}

// ---------- animação do tabuleiro ----------
function stepGame(dt) {
  const k = Math.min(1, dt * 12);
  G.st.p.forEach((p, i) => { const d = G.disp[i]; d.x += (p.c - d.x) * k; d.y += (p.r - d.y) * k; d.z = Math.min(.3, Math.hypot(p.c - d.x, p.r - d.y) * .45); });
  G.dust.forEach(d => d.age += dt * 2.2); G.dust = G.dust.filter(d => d.age < 1);
  G.floats.forEach(f => f.age += dt * 1.1); G.floats = G.floats.filter(f => f.age < 1);
  G.bubbles.forEach(b => b.left -= dt); G.bubbles = G.bubbles.filter(b => b.left > 0);
  G.confetti.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vr * dt; }); G.confetti = G.confetti.filter(f => f.y < 1.1);
}
function renderGame() {
  const cv = $('board'), g = cv.getContext('2d'), s = G.st;
  const hints = humanTurn() && G.sel === 'move' && P.set.hints ? G.legal : null;
  drawBoard(g, G.S, { map: CUR_MAP, st: s, q: G.q, t: T, dpr: G.dpr, hints, ghost: G.sel === 'fence' ? G.ghost : null, disp: G.disp, dust: G.dust, looks: G.looks, bubbles: G.bubbles, floats: G.floats, confetti: G.confetti, low: P.set.quality === 'low', fxOn: P.set.fx });
}

// ---------- resultados da carreira, evento e puzzles ----------
function soloResult() {
  const s = G.st; P.stats.games++;
  if (G.mode === 'puzzle') {
    const pz = G.puz, st = puzzleStars(pz, s), first = !(P.puz.stars[pz.idx] | 0), gain = Math.max(0, st - (P.puz.stars[pz.idx] | 0));
    P.puz.stars[pz.idx] = Math.max(P.puz.stars[pz.idx] | 0, st); const coins = (first ? 20 : 0) + gain * 15 + 5; addCoins(coins); track('puzzle'); save();
    const last = pz.idx >= PUZZLES;
    return fillResult({ title: '🧩 Puzzle resolvido!', win: true, list: [['Estrelas', starTxt(st)]], lines: pz.kind === 'maze' ? [['Suas jogadas', pz.moves], ['Meta', pz.K]] : [['Rival agora', dist(s, 1) + ' passos'], ['Melhor possível', pz.best + ' passos']],
      rew: '+' + coins + ' 🪙', again: last ? '🏠 Menu' : 'Próximo puzzle ▶', fn: () => last ? leaveGame() : startPuzzle(pz.idx + 1) });
  }
  const won = s.winner === 0; if (won) P.stats.wins++; P.stats.best = Math.max(P.stats.best, finalTotal(s, 0)); track('games');
  const list = [[G.names[0], finalTotal(s, 0) + ' pts'], [G.names[1], finalTotal(s, 1) + ' pts']];
  if (G.mode === 'career') {
    const c = G.cfg, lv = c.lv;
    if (!won) { save(); return fillResult({ title: c.boss ? '😈 ' + c.name + ' venceu!' : '😵 Você perdeu', win: false, list, lines: [['Cercas usadas', G.myWalls], ['Jogadas', G.myMoves]], rew: 'Tente de novo — você consegue!', again: '🔄 Tentar de novo', fn: () => startCareer(lv) }); }
    const stars = 1 + (G.myWalls <= 6 ? 1 : 0) + (G.myWalls <= 6 && G.myMoves <= (c.boss ? 20 : 16) ? 1 : 0), first = lv > P.career.best, gain = Math.max(0, stars - careerStars(lv));
    P.career.stars[lv] = Math.max(careerStars(lv), stars); P.career.best = Math.max(P.career.best, lv);
    const coins = (first ? c.coins : 10) + gain * 10; addCoins(coins); track('career'); track('win');
    const up = first ? addTrophies(c.boss ? 30 : 5) : null; let extra = '';
    if (first && c.boss) { const it = grantReward(60 * c.world + 60); if (it) extra = '\n🎁 Prêmio do chefe: ' + it.name + ' (' + it.cname + ')!'; }
    if (first && lv === 100) { addCoins(2000); extra += '\n👑 VOCÊ ZEROU A CARREIRA! +2000 🪙'; }
    save();
    return fillResult({ title: c.boss ? '👑 Chefe derrotado!' : '🏆 Fase ' + lv + ' concluída!', win: true, list, lines: [['Estrelas', starTxt(stars)], ['Cercas usadas', G.myWalls], ['Jogadas', G.myMoves]],
      rew: '+' + coins + ' 🪙' + (first ? '  +' + (c.boss ? 30 : 5) + ' 🏆' : '') + extra + (up ? '\n⬆ Novo posto: ' + up + '!' : ''), again: lv < 100 ? 'Próxima fase ▶' : '🏠 Menu', fn: () => lv < 100 ? startCareer(lv + 1) : leaveGame() });
  }
  // evento
  const e = G.ev, pr = eventProg(e);
  if (!won) { save(); return fillResult({ title: '😵 O ' + e.bossName + ' venceu!', win: false, list, lines: [['Vitórias no evento', pr.wins + '/' + e.goal]], rew: 'Tente de novo!', again: '🔄 Tentar de novo', fn: startEvent }); }
  pr.wins++; let coins = 60, extra = ''; track('win');
  if (pr.wins >= e.goal && !pr.done) { pr.done = 1; coins += e.reward.coins; P.ownedCh[e.reward.ch] = 1; P.ch = e.reward.ch; extra = '\n🎁 PRÊMIO EXCLUSIVO: ' + CHAR_BY_ID[e.reward.ch].name + '!'; }
  addCoins(coins); const up = addTrophies(15); save();
  fillResult({ title: e.emoji + ' Você venceu o ' + e.bossName + '!', win: true, list, lines: [['Vitórias no evento', Math.min(pr.wins, e.goal) + '/' + e.goal]], rew: '+' + coins + ' 🪙  +15 🏆' + extra + (up ? '\n⬆ Novo posto: ' + up + '!' : ''), again: '🔄 Jogar de novo', fn: startEvent });
}
function resetDisp() { G.disp = G.st.p.map(p => ({ x: p.c, y: p.r })); }
function startCareer(lv) {
  const c = careerCfg(lv); newGame({ mode: 'career', n: 2, map: c.map, diff: c.diff, names: [P.name, c.name], looks: [myLook(), c.look], bot: [false, true], me: 0, cfg: c, hub: 'career' });
  G.st = careerState(c); resetDisp(); enterGame(); if (c.say) setTimeout(() => G && G.on && pushBubble(1, c.say), 800);
}
function startEvent() {
  const e = activeEvent(); if (!e) { toast('Nenhum evento no momento.'); return; }
  newGame({ mode: 'event', n: 2, map: e.map, diff: 'hard', names: [P.name, e.bossName], looks: [myLook(), seededLook(mulberry(99), e.bossCh, true)], bot: [false, true], me: 0, ev: e, hub: 'event' });
  G.st = eventState(e); resetDisp(); enterGame(); setTimeout(() => G && G.on && pushBubble(1, e.say), 800);
}
function startPuzzle(idx) {
  const pz = puzzleBuild(idx); pz.moves = 0;
  newGame({ mode: 'puzzle', n: 2, map: MAPS[idx % MAPS.length].id, diff: 'easy', names: [P.name, 'Rival'], looks: [myLook(), { ch: 'bacon', o: {} }], bot: [false, false], me: 0, puz: pz, hub: 'puz' });
  G.st = cloneState(pz.s); G.init = cloneState(pz.s); G.undo = []; resetDisp(); enterGame();
}
