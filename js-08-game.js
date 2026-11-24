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
    botBusy: false, log: [], unread: 0, shownResult: false, me: 0, bot: [], names: [], looks: [], q: 0
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
  $('chatBadge').hidden = true; layoutBoard(); setMode('move'); refreshTurn(); snd('turn');
}
function layoutBoard() {
  const cv = $('board'), S = Math.round(clamp(Math.min(innerWidth - 38, innerHeight - 330), 230, 500)), d = DPR();
  G.S = S; G.dpr = d; cv.style.width = cv.style.height = S + 'px'; cv.width = cv.height = Math.round(S * d);
}
const mineSeat = i => G.mode === 'local' || (G.mode === 'bots' ? i === 0 : i === G.me);
const humanTurn = () => G && G.on && G.st.winner < 0 && !G.bot[G.st.turn] && mineSeat(G.st.turn);
const canRunBots = () => G.mode === 'bots' || (G.mode === 'online' && Net.room && Net.room.m.host === deviceId());

function setMode(m) {
  G.sel = m; G.ghost = null; const s = G.st;
  $('bModeMove').classList.toggle('on', m === 'move'); $('bModeFence').classList.toggle('on', m === 'fence');
  $('ctrlMove').hidden = m !== 'move'; $('ctrlFence').hidden = m !== 'fence';
  $('fLeft').textContent = s.f[humanTurn() ? s.turn : (G.mode === 'online' ? G.me : 0)];
}
function refreshChips() {
  const box = $('pChips'), s = G.st; box.textContent = '';
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
function commit(a, bot) {
  const s = G.st, pl = s.turn, info = scoreAction(s, a);
  applyAction(s, a); s.sc[pl] += info.pts;
  if (a.t === 'move') {
    if (a.j) { s.jp[pl]++; snd('jump'); vibrate(30); } else snd('step', CHAR_BY_ID[G.looks[pl].ch].pitch);
    if (info.pts) addFloat(a.c, a.r, '+' + info.pts, a.j ? '#ffe14d' : '#fff');
    if (Math.random() < .12) setTimeout(() => snd('oink', CHAR_BY_ID[G.looks[pl].ch].pitch), 120);
  } else {
    snd('fence'); vibrate(20); addFloat(a.c + 1, a.r + 1, info.pts ? '+' + info.pts : '🚧', '#ffb36b');
    if (mineSeat(pl) && !G.bot[pl]) P.stats.walls++;
  }
  if (a.t === 'move' && atGoal(s, pl)) s.winner = pl; else advanceTurn(s);
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
function showResult() {
  if (!G || !G.on) return; const s = G.st, me = G.mode === 'online' ? G.me : 0, won = s.winner === me;
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
  else if (G.mode === 'bots' && Math.random() < .6) {
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
  G.st.p.forEach((p, i) => { const d = G.disp[i]; d.x += (p.c - d.x) * k; d.y += (p.r - d.y) * k; });
  G.floats.forEach(f => f.age += dt * 1.1); G.floats = G.floats.filter(f => f.age < 1);
  G.bubbles.forEach(b => b.left -= dt); G.bubbles = G.bubbles.filter(b => b.left > 0);
  G.confetti.forEach(f => { f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vr * dt; }); G.confetti = G.confetti.filter(f => f.y < 1.1);
}
function renderGame() {
  const cv = $('board'), g = cv.getContext('2d'), s = G.st;
  const hints = humanTurn() && G.sel === 'move' && P.set.hints ? G.legal : null;
  drawBoard(g, G.S, { map: CUR_MAP, st: s, q: G.q, t: T, dpr: G.dpr, hints, ghost: G.sel === 'fence' ? G.ghost : null, disp: G.disp, looks: G.looks, bubbles: G.bubbles, floats: G.floats, confetti: G.confetti, low: P.set.quality === 'low', fxOn: P.set.fx });
}
