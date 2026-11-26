// ---------- telas, menus e inicialização ----------
const view = { screen: 'home' };
const SCREENS = ['home', 'setup', 'lobby', 'game', 'shop', 'maps', 'how', 'set', 'career', 'puz', 'miss'];
function showScreen(id) { SCREENS.forEach(s => { $('s-' + s).hidden = s !== id; }); view.screen = id; const e = $('s-' + id); if (e) e.scrollTop = 0; fxVisible(); }
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }
function ctxOf(cv, w, h) { const d = DPR(), k = w + 'x' + h + 'x' + d; if (cv._k !== k) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv._k = k; } const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h); return g; }
function ask(text, yes) { $('askTxt').textContent = text; $('m-ask').hidden = false; $('askYes').onclick = () => { $('m-ask').hidden = true; yes(); }; }
function setSeg(box, val) { box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === String(val))); }
function refreshCoins() { document.querySelectorAll('.coins b').forEach(b => { b.textContent = P.coins; }); }
function refreshHome() {
  $('meName').textContent = P.name; const r = rankOf(P.trophies); $('meRank').textContent = '🏆 ' + r.name;
  $('rankFill').style.width = Math.round(r.pct * 100) + '%'; $('rankTxt').textContent = r.next ? P.trophies + ' / ' + r.to + ' → ' + r.next : P.trophies + ' troféus · nível máximo!';
  const d = dailyInfo(); $('bDaily').hidden = !d.avail; $('bDaily').textContent = '🎁 Presente do dia: +' + d.amount + ' 🪙';
  $('bResume').hidden = !(P.lastRoom && Net.ok());
  const ev = activeEvent(); $('bEvent').hidden = !ev; if (ev) { const pr = eventProg(ev); $('evT').textContent = ev.emoji + ' ' + ev.name; $('evS').textContent = pr.done ? '✔ Prêmio conquistado! Jogue por moedas' : 'Vitórias ' + pr.wins + '/' + ev.goal + ' · faltam ' + eventDaysLeft(ev) + ' dias · prêmio exclusivo!'; }
  const mc = missionClaimable(); $('missBadge').hidden = !mc; refreshCoins();
}
function goHome() {
  if (G) { G.on = false; G = null; }
  CUR_MAP = MAP_BY_ID[P.map]; applyTheme(P.map); musicPlay(CUR_MAP.music); refreshHome(); showScreen('home');
}
function leaveGame() { const online = G && G.mode === 'online', hub = G && G.hub; if (online) Net.leave(); goHome(); if (hub === 'career') openCareer(); else if (hub === 'puz') openPuz(); }

// ---------- fundo (céu + clima) ----------
const sky = $('sky'), fx = document.createElement('canvas'); fx.id = 'fx'; fx.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2'; document.body.append(fx);
function fxVisible() { fx.style.display = view.screen === 'game' || !P.set.fx ? 'none' : 'block'; }
function resize() {
  const d = DPR(); sky.width = Math.round(innerWidth * d); sky.height = Math.round(280 * d); sky._d = d;
  fx.width = Math.round(innerWidth * d * .6); fx.height = Math.round(innerHeight * d * .6); fx._d = d * .6;
  if (G && G.on) layoutBoard();
}
addEventListener('resize', resize);

// ---------- configurar partida ----------
function buildMapChips(box, current, onPick) {
  box.textContent = ''; MAPS.forEach(m => { const b = el('button', current === m.id ? 'on' : '', m.emoji + ' ' + m.name); b.onclick = () => { onPick(m.id); setSeg2(box, m.id); }; b.dataset.v = m.id; box.append(b); });
}
function setSeg2(box, v) { box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
function refreshSetup() {
  setSeg($('segMode'), P.mode); setSeg($('segN'), P.n); setSeg($('segDiff'), P.diff); setSeg2($('mapChips'), P.map);
  $('diffBox').hidden = P.mode === 'local'; $('onlineBox').hidden = P.mode !== 'online'; $('bStart').hidden = P.mode === 'online';
  $('nHint').textContent = P.n === 2 ? '🏁 Corrida: chegue primeiro ao outro lado. Cada um tem ' + FENCES[2] + ' cercas.' : '🏆 Taça no meio do tabuleiro! O primeiro a pegar ganha. Cada um tem ' + FENCES[P.n] + ' cercas.';
  $('onlineMsg').textContent = Net.ok() ? 'Crie uma sala e mande o código para seus amigos.' : 'O modo online não está configurado neste jogo.';
  $('bCreate').disabled = !Net.ok(); $('bJoin').disabled = !Net.ok();
}
function initSetup() {
  buildMapChips($('mapChips'), P.map, id => { P.map = id; save(); applyTheme(id); CUR_MAP = MAP_BY_ID[id]; musicPlay(CUR_MAP.music); });
  $('segMode').onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { P.mode = v; save(); snd('tap'); refreshSetup(); } };
  $('segN').onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { P.n = +v; save(); snd('tap'); refreshSetup(); } };
  $('segDiff').onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) { P.diff = v; save(); snd('tap'); refreshSetup(); } };
  $('bStart').onclick = () => { audInit(); startLocalGame(P.mode, P.n, P.map, P.diff); };
  $('bCreate').onclick = async () => { audInit(); $('bCreate').disabled = true; try { const code = await Net.create(P.n, P.map, P.diff); enterLobby(code); } catch (e) { toast('Não consegui criar a sala. Verifique a internet.'); } $('bCreate').disabled = !Net.ok(); };
  $('bJoin').onclick = () => joinCode($('codeIn').value);
  $('codeIn').addEventListener('input', e => { e.target.value = Net.cleanCode(e.target.value); });
}
async function joinCode(code) {
  audInit(); code = Net.cleanCode(code); if (code.length !== 5) { toast('O código tem 5 letras/números.'); return; }
  try { await Net.join(code); enterLobby(code); } catch (e) {
    const m = String(e.message); toast(m === 'cheia' ? 'Essa sala está cheia.' : m === 'nao existe' ? 'Essa sala não existe mais.' : 'Não consegui entrar. Verifique a internet.');
  }
}

// ---------- sala online ----------
let lobSig = '', lobPigs = [];
function enterLobby(code) {
  Net.h = {
    room: onRoom, chat: onRemoteChat,
    gone: () => { toast('A sala foi fechada.'); Net.stop(); Net.code = null; P.lastRoom = null; save(); goHome(); },
    kicked: () => { toast('Você saiu da sala.'); Net.stop(); Net.code = null; P.lastRoom = null; save(); goHome(); },
    offline: () => toast('Conexão instável… tentando reconectar')
  };
  lobSig = ''; $('lobCode').textContent = code; showScreen('lobby'); $('bLobStart').hidden = true; Net.start();
}
function onRoom(r) {
  if (view.screen === 'lobby') { if (r.m.st === 'play') { startOnlineGame(r); return; } updateLobby(r); return; }
  if (view.screen === 'game' && G && G.mode === 'online') {
    if (r.m.g !== G.g && r.m.st === 'play') { startOnlineGame(r); return; }
    let changed = false;
    r.m.seats.forEach((x, i) => { if (!x) return; const b = !!x.bot; if (G.bot[i] !== b) { G.bot[i] = b; changed = true; } G.names[i] = x.name; G.looks[i] = x.look; });
    if (r.rev > G.rev) applyRemote(r); else if (changed) refreshTurn();
  }
}
function updateLobby(r) {
  const sig = JSON.stringify(r.m); if (sig === lobSig) return; lobSig = sig;
  const host = r.m.host === deviceId(), box = $('lobSeats'); box.textContent = ''; lobPigs = [];
  r.m.seats.forEach((x, i) => {
    const d = el('div', 'seat' + (x ? '' : ' empty')); d.style.borderColor = SEATS[i].color;
    if (x) { const c = el('canvas'); lobPigs.push({ cv: c, look: x.look, i }); const nm = el('div'); const dot = el('span', 'dot'); dot.style.background = SEATS[i].color; nm.append(dot, (x.bot ? '🤖 ' : '') + x.name); d.append(c, nm); if (x.id === r.m.host) d.append(el('span', 'tag', '👑 anfitrião')); }
    else d.append('Vaga livre…'); box.append(d);
  });
  $('lobHost').hidden = !host; $('bLobStart').hidden = !host;
  buildMapChips($('lobMaps'), r.m.map, id => Net.patchM({ map: id }).catch(() => toast('Falha ao trocar mapa')));
  setSeg($('lobDiff'), r.m.diff);
  const humans = r.m.seats.filter(x => x && !x.bot).length, empty = r.m.seats.filter(x => !x).length;
  $('lobMsg').textContent = host ? (empty ? 'Vagas vazias viram robôs ao começar. 🤖' : 'Todos entraram! Pode começar.') : 'Esperando o anfitrião começar… (' + humans + '/' + r.m.n + ' jogadores)';
  if (!host) { applyTheme(r.m.map); CUR_MAP = MAP_BY_ID[r.m.map]; } else { applyTheme(r.m.map); CUR_MAP = MAP_BY_ID[r.m.map]; }
  $('lobDiffBox').hidden = !host;
}
async function lobbyStart() {
  const r = Net.room; if (!r || r.m.host !== deviceId()) return; $('bLobStart').disabled = true;
  try {
    const bots = makeBots(r.m.n);
    for (let i = 0; i < r.m.n; i++) if (!r.m.seats[i]) await Net.req('PUT', 'rooms/' + Net.code + '/m/seats/' + i, { id: 'bot' + i, name: bots[i].name, look: bots[i].look, bot: 1 });
    await Net.startGame();
  } catch (e) { toast('Não consegui começar. Tente de novo.'); }
  $('bLobStart').disabled = false;
}
function shareRoom() {
  const code = Net.code, url = location.origin + location.pathname + '#sala-' + code, text = 'Vem jogar Porcos Loucos comigo! 🐷 Código da sala: ' + code;
  if (navigator.share) navigator.share({ title: 'Porcos Loucos', text, url }).catch(() => { });
  else { try { navigator.clipboard.writeText(text + ' ' + url); toast('Link copiado!'); } catch (e) { window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank'); } }
}

// ---------- loja ----------
const SH = { tab: 'ch', sel: null };
function shopLook() { const l = myLook(); if (!SH.sel) return l; if (CHAR_BY_ID[SH.sel]) l.ch = SH.sel; else { const it = ITEM_BY_ID[SH.sel]; l.o[it.slot] = SH.sel; } return l; }
function buildShop() {
  const tabs = $('shTabs'); tabs.textContent = '';
  [{ id: 'ch', label: '🐷 Porcos' }].concat(SLOTS.map(s => ({ id: s.id, label: s.icon + ' ' + s.label }))).forEach(t => { const b = el('button', SH.tab === t.id ? 'on' : '', t.label); b.onclick = () => { SH.tab = t.id; SH.sel = null; snd('tap'); buildShop(); }; tabs.append(b); });
  const grid = $('shGrid'); grid.textContent = ''; const d = DPR();
  const list = SH.tab === 'ch' ? CHARS.filter(c => !c.event || P.ownedCh[c.id]) : ITEMS.filter(i => i.slot === SH.tab);
  const none = SH.tab !== 'ch' ? el('div', 'cell', '') : null;
  if (none) { none.append(el('div', '', '🚫'), el('div', '', 'Tirar')); none.style.justifyContent = 'center'; none.onclick = () => { equipItem(SH.tab, null); SH.sel = null; snd('tap'); buildShop(); }; grid.append(none); }
  list.forEach(x => {
    const own = SH.tab === 'ch' ? P.ownedCh[x.id] : P.owned[x.id], eq = SH.tab === 'ch' ? P.ch === x.id : P.outfit[x.slot] === x.id;
    const c = el('div', 'cell' + (SH.sel === x.id ? ' sel' : '') + (eq ? ' eq' : '')); const cv = el('canvas'); cv.width = cv.height = Math.round(90 * d); cv.getContext('2d').drawImage(thumb(SH.tab === 'ch' ? 'ch' : 'it', x.id, 90, d), 0, 0);
    const rar = el('i', 'rar'); rar.style.background = rarityOf(x.price)[1]; rar.style.position = 'absolute';
    c.append(rar, cv, el('div', '', x.name), el('div', 'pr', eq ? '✔ Vestindo' : own ? 'Seu' : '🪙 ' + x.price));
    c.onclick = () => { SH.sel = x.id; snd('tap'); buildShop(); }; grid.append(c);
  });
  updateShopInfo();
}
function updateShopInfo() {
  const id = SH.sel, btn = $('shAct'); btn.disabled = false; btn.className = 'btn big';
  if (!id) { $('shName').textContent = 'Toque num item'; $('shDesc').textContent = 'Veja como fica no seu porco antes de comprar.'; btn.textContent = '—'; btn.disabled = true; return; }
  const isCh = !!CHAR_BY_ID[id], x = isCh ? CHAR_BY_ID[id] : ITEM_BY_ID[id], own = isCh ? P.ownedCh[id] : P.owned[id], eq = isCh ? P.ch === id : P.outfit[x.slot] === id;
  $('shName').textContent = x.name; const rr = rarityOf(x.price); $('shDesc').textContent = (isCh ? x.desc + ' · ' : '') + rr[0];
  if (eq) { btn.textContent = isCh ? 'Em uso' : 'Tirar'; btn.disabled = isCh; }
  else if (own) btn.textContent = isCh ? 'Usar' : 'Vestir';
  else { btn.textContent = '🪙 ' + x.price + ' · Comprar'; if (P.coins < x.price) { btn.disabled = true; btn.textContent = 'Faltam ' + (x.price - P.coins) + ' 🪙'; } }
}
function shopAct() {
  const id = SH.sel; if (!id) return; const isCh = !!CHAR_BY_ID[id], x = isCh ? CHAR_BY_ID[id] : ITEM_BY_ID[id], own = isCh ? P.ownedCh[id] : P.owned[id];
  if (!own) { const ok = isCh ? buyChar(id) : buyItem(id); if (ok) { snd('buy'); toast('Comprado! 🎉'); } else snd('bad'); }
  else if (isCh) { P.ch = id; save(); snd('tap'); }
  else { equipItem(x.slot, P.outfit[x.slot] === id ? null : id); snd('tap'); }
  buildShop();
}

// ---------- mapas (só para ver) ----------
const MV = { i: 0, st: newState(2) };
function showMapView(i) {
  MV.i = (i + MAPS.length) % MAPS.length; const m = MAPS[MV.i]; applyTheme(m.id); CUR_MAP = m; musicPlay(m.music);
  $('mName').textContent = m.emoji + ' ' + m.name; $('mDesc').textContent = m.desc;
  const dots = $('mDots'); dots.textContent = ''; MAPS.forEach((_, k) => dots.append(el('i', k === MV.i ? 'on' : '')));
  $('bUseMap').textContent = P.map === m.id ? '✔ Mapa atual' : '✔ Usar este mapa'; $('bUseMap').disabled = P.map === m.id; snd('tap');
}

// ---------- tutorial ----------
const HOW = [
  ['Bem-vindo ao Porcos Loucos! 🐷', 'Você é o porco azul, lá embaixo. Chegue até o lado oposto do tabuleiro antes do adversário!', () => { const s = newState(2); return { s, hints: [] }; }],
  ['Mover', 'Na sua vez, toque num círculo brilhante para andar uma casa. Só dá para andar para frente, trás ou lados.', () => { const s = newState(2); return { s, hints: legalMoves(s, 0) }; }],
  ['Pular! 🦘', 'Se o adversário estiver colado em você, pule por cima dele! Pular dá pontos extras.', () => { const s = newState(2); s.p[0] = { r: 5, c: 4 }; s.p[1] = { r: 4, c: 4 }; return { s, hints: legalMoves(s, 0) }; }],
  ['Cercas 🚧', 'Em vez de andar, você pode colocar uma cerca para atrapalhar. Toque em "Cerca", arraste até o lugar e toque em "Colocar". Mas atenção: não vale fechar o caminho todo!', () => { const s = newState(2); s.p[1] = { r: 2, c: 4 }; s.h[1][3] = 1; s.h[1][5] = 1; s.v[1][3] = 0; return { s, hints: [], ghost: { o: 'h', r: 1, c: 4, ok: true } }; }],
  ['3 e 4 jogadores 🏆', 'Com 3 ou 4 porcos, uma taça fica no meio do tabuleiro. Quem pegar a taça primeiro ganha! Tem até cerca para todo lado.', () => { const s = newState(4); return { s, hints: [] }; }],
  ['Pontos e moedas 🪙', 'Cada jogada boa dá pontos. No fim da partida os pontos viram moedas e troféus. Gaste na loja com roupas e porcos novos!', () => { const s = newState(2); return { s, hints: [], floats: [{ x: 4.5, y: 7.3, text: '+8', color: '#ffe14d', age: .2 }, { x: 4.5, y: 1.3, text: '+2', color: '#fff', age: .5 }] }; }],
  ['Chat e amigos 💬', 'Mande emojis e frases durante a partida. Jogue online com amigos usando um código de sala, ou passe o celular no modo "mesmo aparelho".', () => { const s = newState(2); return { s, hints: [], bubbles: [{ i: 1, text: 'GG!', left: 9 }, { i: 0, text: '😎', left: 9 }] }; }]
];
const HW = { i: 0, cur: null };
const HOW_LOOKS = () => [myLook(), { ch: 'bacon', o: {} }, { ch: 'fofura', o: {} }, { ch: 'zumbi', o: {} }];
function showHow(i) {
  HW.i = clamp(i, 0, HOW.length - 1); const h = HOW[HW.i]; $('hwT').textContent = h[0]; $('hwP').textContent = h[1]; HW.cur = h[2]();
  HW.disp = HW.cur.s.p.map(p => ({ x: p.c, y: p.r }));
  const d = $('hwDots'); d.textContent = ''; HOW.forEach((_, k) => d.append(el('i', k === HW.i ? 'on' : '')));
  $('hwNext').textContent = HW.i === HOW.length - 1 ? 'Vamos jogar! 🐷' : 'Próximo ▶'; $('hwPrev').style.visibility = HW.i ? 'visible' : 'hidden';
}
function openHow() { showHow(0); showScreen('how'); }
function closeHow() { P.tut = true; save(); goHome(); }

// ---------- ajustes ----------
function buildSettings() {
  const box = $('setBox'); box.textContent = '';
  const row = (label, ctrl) => { const r = el('div', 'srow'); r.append(el('span', '', label), ctrl); box.append(r); };
  const tog = (key, after) => { const b = el('button', 'tog' + (P.set[key] ? ' on' : '')); b.onclick = () => { P.set[key] = !P.set[key]; b.classList.toggle('on', P.set[key]); save(); audVol(); fxVisible(); snd('tap'); after && after(); }; return b; };
  const rng = (key) => { const i = el('input'); i.type = 'range'; i.min = 0; i.max = 100; i.value = Math.round(P.set[key] * 100); i.oninput = () => { P.set[key] = i.value / 100; save(); audVol(); }; i.onchange = () => snd('oink'); return i; };
  const nb = el('button', 'btn sm', P.name + ' ✏️'); nb.onclick = openName; row('Nome', nb);
  row('🎵 Música', tog('music')); row('Volume da música', rng('musicVol'));
  row('🔊 Efeitos sonoros', tog('sfx')); row('Volume dos efeitos', rng('sfxVol'));
  row('📳 Vibração', tog('vib', () => vibrate(40)));
  const q = el('button', 'btn sm', P.set.quality === 'low' ? 'Econômica' : 'Alta'); q.onclick = () => { P.set.quality = P.set.quality === 'low' ? 'high' : 'low'; save(); q.textContent = P.set.quality === 'low' ? 'Econômica' : 'Alta'; resize(); }; row('Qualidade gráfica', q);
  row('🌧️ Efeitos de clima', tog('fx')); row('💡 Dicas de movimento', tog('hints')); row('🚧 Confirmar cerca', tog('confirmWall'));
  const hb = el('button', 'btn sm', 'Ver'); hb.onclick = openHow; row('Tutorial', hb);
  const rb = el('button', 'btn sm', 'Zerar'); rb.style.background = '#c0392b'; rb.onclick = () => ask('Apagar moedas, roupas e troféus deste aparelho?', () => { Object.assign(P, defaultProfile()); saveNow(); location.reload(); }); row('Reiniciar progresso', rb);
  const st = el('div', 'small', 'Partidas: ' + P.stats.games + ' · Vitórias: ' + P.stats.wins + ' · Melhor: ' + P.stats.best + ' pts · Cercas: ' + P.stats.walls); st.style.marginTop = '8px'; box.append(st);
  box.append(el('div', 'small', 'Porcos Loucos v2'));
}
function openName() { $('nameIn').value = P.name; $('m-name').hidden = false; setTimeout(() => $('nameIn').focus(), 50); }

// ---------- chat (janela) ----------
function buildChat() {
  const e = $('chEmo'), p = $('chPhr'); e.textContent = ''; p.textContent = '';
  EMOJIS.forEach((x, i) => { const b = el('button', '', x); b.onclick = () => { sendChat(i); }; e.append(b); });
  PHRASES.forEach((x, i) => { const b = el('button', '', x); b.onclick = () => { sendChat(12 + i); $('m-chat').hidden = true; }; p.append(b); });
}

// ---------- carreira, puzzles, missões, evento ----------
const LV = { look: null, kind: '' };
function openInfo(o) {
  $('lvT').textContent = o.title; LV.look = o.look; LV.win = o.win; const b = $('lvInfo'); b.textContent = '';
  o.lines.forEach(l => { const d = el('div'); d.append(el('span', '', l[0]), el('b', '', l[1])); b.append(d); });
  $('lvGo').onclick = () => { $('m-level').hidden = true; o.go(); }; $('m-level').hidden = false; snd('tap');
}
function openCareer() {
  const box = $('carList'); box.textContent = ''; let total = 0; for (let i = 1; i <= 100; i++) total += careerStars(i);
  $('carSum').textContent = '🏰 Fase atual: ' + Math.min(100, P.career.best + 1) + ' de 100 · ⭐ ' + total + '/300';
  let curNode = null;
  for (let w = 1; w <= 10; w++) {
    box.append(el('div', 'world', 'Mundo ' + w + ' · ' + WORLDS[w - 1])); const gr = el('div', 'grid5');
    for (let k = 1; k <= 10; k++) {
      const lv = (w - 1) * 10 + k, c = careerCfg(lv), un = careerUnlocked(lv), st = careerStars(lv);
      const n = el('button', 'node' + (c.boss ? ' boss' : '') + (un ? '' : ' lock') + (lv === P.career.best + 1 ? ' cur' : ''));
      n.append(el('span', '', c.boss ? '👑' : String(lv)), el('small', '', un ? (st ? '⭐'.repeat(st) : '') : '🔒')); if (lv === P.career.best + 1) curNode = n;
      n.onclick = () => { if (!un) { toast('Vença a fase anterior para liberar!'); snd('bad'); return; } openInfo({ title: (c.boss ? '👑 CHEFE · ' : 'Fase ' + lv + ' · ') + c.worldName, look: c.look, win: false, go: () => startCareer(lv),
        lines: [['Adversário', c.name], ['Dificuldade', { easy: 'Fácil 😴', medium: 'Médio 🙂', hard: 'Difícil 😈' }[c.diff]], ['Cercas dele', c.oppF], ['Obstáculos', c.obst], ['Prêmio', c.coins + ' 🪙' + (c.boss ? ' + item' : '')], ['Suas estrelas', st ? '⭐'.repeat(st) : '—']] }); };
      gr.append(n);
    }
    box.append(gr);
  }
  showScreen('career'); if (curNode) setTimeout(() => curNode.scrollIntoView({ block: 'center' }), 50);
}
function openPuz() {
  const g = $('puzGrid'); g.textContent = ''; let total = 0;
  for (let i = 1; i <= PUZZLES; i++) {
    const st = P.puz.stars[i] | 0, un = puzzleUnlocked(i); total += st;
    const n = el('button', 'node' + (un ? '' : ' lock') + (un && !st ? ' cur' : '')); n.append(el('span', '', puzzleKind(i) === 'maze' ? '🌀' + i : '🚧' + i), el('small', '', un ? (st ? '⭐'.repeat(st) : '') : '🔒'));
    n.onclick = () => { if (!un) { toast('Resolva o anterior para liberar!'); snd('bad'); return; } snd('tap'); startPuzzle(i); }; g.append(n);
  }
  $('puzSum').innerHTML = ''; $('puzSum').append('🧩 Labirintos 🌀: chegue no menor nº de jogadas. Bloqueios 🚧: faça o rival andar o máximo! ⭐ ' + total + '/' + PUZZLES * 3);
  showScreen('puz');
}
function openMissions() {
  const box = $('missList'); box.textContent = '';
  todayMissions().forEach(m => {
    const pr = Math.min(P.miss.prog[m.kind] || 0, m.n), r = el('div', 'mrow'), t = el('div', 'mt'); t.append(el('div', '', m.t + '  (' + pr + '/' + m.n + ')')); const bar = el('div', 'bar'), i = el('i'); i.style.width = Math.round(pr / m.n * 100) + '%'; bar.append(i); t.append(bar);
    const done = pr >= m.n, got = P.miss.got[m.id], b = el('button', 'btn sm' + (done && !got ? ' ok' : ''), got ? '✔' : '+' + m.coins + ' 🪙'); b.disabled = !done || got;
    b.onclick = () => { const c = claimMission(m.id); if (c) { snd('daily'); toast('+' + c + ' 🪙 resgatadas!'); openMissions(); } }; r.append(t, b); box.append(r);
  });
  showScreen('miss');
}
function openEventInfo() {
  const e = activeEvent(); if (!e) return; const pr = eventProg(e), ch = CHAR_BY_ID[e.reward.ch];
  openInfo({ title: e.emoji + ' ' + e.name, look: seededLook(mulberry(99), e.bossCh, true), win: false, go: startEvent,
    lines: [['Missão', 'Vença o ' + e.bossName + ' ' + e.goal + 'x'], ['Seu progresso', pr.wins + '/' + e.goal], ['Regra maluca', 'a cada 6 jogadas surge uma cerca surpresa 🌀'], ['Prêmio exclusivo', ch.name + ' + ' + e.reward.coins + ' 🪙'], ['Termina em', eventDaysLeft(e) + ' dias']] });
}

// ---------- tela de carregamento ----------
function runLoading() {
  const ld = $('loading'), cv = $('ldCv'), fill = $('ldFill'), tip = $('ldTip'), rnd = mulberry(4242);
  const tips = ['Alimentando os porcos…', 'Lavando a lama…', 'Montando as cercas…', 'Ensinando o pulo maluco…', 'Polindo a taça…', 'Acordando o Rei Porco…', 'Escondendo o bacon…', 'Afinando os oinks…'];
  const pigs = CHARS.filter(c => !c.event).map((c, i) => ({ look: seededLook(rnd, c.id, false), x: -i * .16, sp: .09 + rnd() * .05, ph: rnd() * 6, sz: .17 + rnd() * .05 }));
  let fontsOk = false; try { document.fonts.ready.then(() => { fontsOk = true; }); } catch (e) { fontsOk = true; }
  const tasks = [() => { }, ...MAPS.map(m => () => boardBg(m, 360, DPR(), 2)), ...CHARS.map(c => () => thumb('ch', c.id, 90, DPR())), () => { }];
  let idx = 0; const t0 = performance.now(); let shown = 0, last = t0, ti = 0;
  const step = () => { if (idx < tasks.length) { try { tasks[idx](); } catch (e) { } idx++; setTimeout(step, 40); } }; setTimeout(step, 60);
  const W0 = () => innerWidth, H0 = () => innerHeight;
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; const el_ = now - t0, W = W0(), H = H0(), d = Math.min(devicePixelRatio || 1, 2);
    if (cv._k !== W + 'x' + H) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv._k = W + 'x' + H; }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H); const t = el_ / 1000;
    g.save(); g.translate(W / 2, H * .5); g.rotate(t * .15); for (let i = 0; i < 16; i++) { g.rotate(TAU / 16); g.fillStyle = 'rgba(255,255,255,.17)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-W * .1, -H); g.lineTo(W * .1, -H); g.fill(); } g.restore();
    const sx = W * .78, sy = H * .3, sg = g.createRadialGradient(sx, sy, 0, sx, sy, W * .35); sg.addColorStop(0, 'rgba(255,245,190,.95)'); sg.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff6c9'; g.beginPath(); g.arc(sx, sy, W * .09, 0, TAU); g.fill();
    for (const [x, y, sc, sp] of [[.2, .26, 1, 14], [.6, .34, .8, 9], [.9, .2, .7, 11]]) cloud(g, ((x * W + t * sp) % (W + 200)) - 80, y * H, 50 * sc, .9);
    const gy = H * .66; g.fillStyle = '#7fc043'; g.beginPath(); g.moveTo(0, gy); g.quadraticCurveTo(W * .3, gy - 40, W * .6, gy - 10); g.quadraticCurveTo(W * .85, gy + 10, W, gy - 24); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#93d150'; g.beginPath(); g.moveTo(0, gy + 30); g.quadraticCurveTo(W * .4, gy + 4, W, gy + 34); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    // cerca ao fundo
    g.strokeStyle = '#7e4a20'; g.lineWidth = 5; g.lineCap = 'round'; const fy = gy + 18; g.beginPath(); g.moveTo(0, fy); g.lineTo(W, fy); g.moveTo(0, fy + 14); g.lineTo(W, fy + 14); g.stroke(); for (let x = 10; x < W; x += 44) { g.beginPath(); g.moveTo(x, fy - 12); g.lineTo(x, fy + 28); g.stroke(); }
    // porcos correndo
    pigs.forEach((p, i) => { p.x += p.sp * dt; if (p.x > 1.2) p.x = -.2; const px = p.x * W, bob = Math.abs(Math.sin(t * 8 + p.ph)), py = gy + 78 + (i % 3) * 22 - bob * 14; g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(px, gy + 78 + (i % 3) * 22 + 20, W * p.sz * .33, 6, 0, 0, TAU); g.fill(); g.save(); g.translate(px, py); g.rotate(Math.sin(t * 8 + p.ph) * .08); drawPig(g, 0, 0, W * p.sz, p.look, t, { phase: p.ph }); g.restore(); });
    const target = Math.min(idx / tasks.length, el_ / 2600); shown += (target - shown) * Math.min(1, dt * 6); fill.style.width = Math.round(shown * 100) + '%';
    if (el_ > (ti + 1) * 850) { ti++; tip.textContent = tips[ti % tips.length]; } else if (!ti) tip.textContent = tips[0];
    if ((shown > .985 && fontsOk) || el_ > 5000) { ld.classList.add('out'); setTimeout(() => { ld.remove(); }, 800); return; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ---------- cena da capa ----------
function homeScene(g, w, h, t) {
  const m = CUR_MAP, cx = w / 2;
  g.save(); g.translate(cx, h * .52); g.rotate(t * .12);
  for (let i = 0; i < 14; i++) { g.rotate(TAU / 14); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-w * .07, -w * .8); g.lineTo(w * .07, -w * .8); g.closePath(); g.fill(); }
  g.restore();
  const grd = g.createRadialGradient(cx, h * .5, 0, cx, h * .5, w * .5); grd.addColorStop(0, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  // palco: tabuleiro em perspectiva
  const py = h * .87; g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(cx, py + 10, w * .44, h * .1, 0, 0, TAU); g.fill();
  g.fillStyle = m.css.woodDark; g.beginPath(); g.ellipse(cx, py + 6, w * .43, h * .1, 0, 0, TAU); g.fill();
  g.fillStyle = m.css.wood; g.beginPath(); g.ellipse(cx, py, w * .43, h * .1, 0, 0, TAU); g.fill();
  g.fillStyle = m.tile[0]; g.beginPath(); g.ellipse(cx, py - 2, w * .39, h * .085, 0, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.ellipse(cx, py - 2, w * .39, h * .085, 0, 0, TAU); g.clip(); g.fillStyle = m.tile[1];
  for (let i = -6; i < 7; i++) { if (i % 2) continue; g.beginPath(); g.moveTo(cx + i * w * .07, py - h * .1); g.lineTo(cx + (i + 1) * w * .07, py - h * .1); g.lineTo(cx + (i + 1) * w * .095, py + h * .1); g.lineTo(cx + i * w * .095, py + h * .1); g.fill(); }
  g.restore();
  // companheiros
  const side = (ch, x, ph, flip) => { const l = { ch, o: {} }; drawPig(g, x, h * .7 + Math.sin(t * 2 + ph) * 3, w * .24, l, t, { phase: ph }); };
  side('bacon', w * .17, 1, 0); side('fofura', w * .83, 2, 1);
  drawPig(g, cx, h * .58 + Math.abs(Math.sin(t * 2.2)) * -6, w * .44, myLook(), t, { active: Math.sin(t * .8) > .5 });
  // brilhos
  for (let i = 0; i < 9; i++) { const a = Math.max(0, Math.sin(t * 2 + i * 2.3)), x = frand(i, 11) * w, y = frand(i, 12) * h * .8, r = 3 + frand(i, 13) * 4 * a; if (a < .1) continue; g.fillStyle = `rgba(255,250,200,${a})`; g.beginPath(); g.moveTo(x, y - r * 2); g.quadraticCurveTo(x, y, x + r * 2, y); g.quadraticCurveTo(x, y, x, y + r * 2); g.quadraticCurveTo(x, y, x - r * 2, y); g.quadraticCurveTo(x, y, x, y - r * 2); g.fill(); }
}
// ---------- laço de animação ----------
let lastTs = 0, lastDraw = 0;
function frame(ts) {
  requestAnimationFrame(frame); if (document.hidden) return;
  const low = P.set.quality === 'low'; if (low && ts - lastDraw < 32) return;
  const dt = Math.min(.05, (ts - lastTs) / 1000); lastTs = ts; lastDraw = ts; T += dt;
  const sg = sky.getContext('2d'); sg.setTransform(sky._d, 0, 0, sky._d, 0, 0); drawSky(sg, innerWidth, T, CUR_MAP, low);
  if (P.set.fx && view.screen !== 'game' && CUR_MAP.weather) { const fg = fx.getContext('2d'); fg.setTransform(fx._d, 0, 0, fx._d, 0, 0); fg.clearRect(0, 0, innerWidth, innerHeight); weatherParticles(fg, innerWidth, innerHeight, T, CUR_MAP.weather, low, .9); }
  const v = view.screen;
  if (v === 'home') { const cv = $('homePig'), w = cv.clientWidth || 300, h = cv.clientHeight || 250, g = ctxOf(cv, w, h); homeScene(g, w, h, T); }
  else if (v === 'game' && G && G.on) { stepGame(dt); renderGame(); }
  else if (v === 'shop') { const cv = $('shopPig'), w = cv.clientWidth || 130, g = ctxOf(cv, w, w); drawPig(g, w / 2, w * .62, w * .6, shopLook(), T, { active: true }); }
  else if (v === 'maps') { const S = Math.round(clamp(innerWidth - 110, 200, 360)), cv = $('mapCv'); cv.style.width = cv.style.height = S + 'px'; const d = DPR(); if (cv._k !== S + ':' + d) { cv.width = cv.height = Math.round(S * d); cv._k = S + ':' + d; } MV.st.turn = 0; const looks = [myLook(), { ch: 'bacon', o: {} }]; drawBoard(cv.getContext('2d'), S, { map: MAPS[MV.i], st: MV.st, q: 0, t: T, dpr: d, hints: null, ghost: null, disp: MV.st.p.map(p => ({ x: p.c, y: p.r })), looks, fxOn: P.set.fx, low }); }
  else if (v === 'how' && HW.cur) { const S = Math.round(clamp(innerWidth - 70, 200, 330)), cv = $('howCv'); cv.style.width = cv.style.height = S + 'px'; const d = DPR(); if (cv._k !== S + ':' + d) { cv.width = cv.height = Math.round(S * d); cv._k = S + ':' + d; } const c = HW.cur; c.floats && c.floats.forEach(f => { f.age = .3 + .2 * Math.sin(T * 2); }); drawBoard(cv.getContext('2d'), S, { map: CUR_MAP, st: c.s, q: 0, t: T, dpr: d, hints: c.hints, ghost: c.ghost, disp: HW.disp, looks: HOW_LOOKS(), floats: c.floats, bubbles: c.bubbles, fxOn: false, low }); }
  else if (v === 'lobby') lobPigs.forEach(p => { const w = 72, g = ctxOf(p.cv, w, w); drawPig(g, w / 2, w * .55, w * .72, p.look, T, { ring: SEATS[p.i].color }); });
  if (!$('m-level').hidden && LV.look) { const cv = $('lvCv'), g = ctxOf(cv, 130, 130); drawPig(g, 65, 72, 90, LV.look, T, { active: true }); }
  if (!$('m-result').hidden && G) { const cv = $('rCv'), g = ctxOf(cv, 130, 130); if (G.resLook) drawPig(g, 65, 72, 90, G.resLook, T, { active: true, ring: SEATS[G.resWin].color }); }
  if (G && G.on && view.screen === 'game' && !$('m-result').hidden && G.confetti.length) { /* confete desenhado no tabuleiro */ }
}

// ---------- ligações ----------
function wire() {
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { snd('tap'); if (b.dataset.go === 'home') goHome(); });
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { $(b.dataset.close).hidden = true; });
  $('bPlay').onclick = () => { snd('tap'); refreshSetup(); showScreen('setup'); };
  $('bShop').onclick = () => { snd('tap'); SH.tab = 'ch'; SH.sel = null; buildShop(); showScreen('shop'); };
  $('bMaps').onclick = () => { snd('tap'); showMapView(MAPS.findIndex(m => m.id === P.map)); showScreen('maps'); };
  $('bHow').onclick = () => { snd('tap'); openHow(); };
  $('bSet').onclick = () => { snd('tap'); buildSettings(); showScreen('set'); };
  $('btnName').onclick = openName;
  $('nameOk').onclick = () => { const n = cleanName($('nameIn').value); if (!n) { toast('Escreva um nome.'); return; } P.name = n; save(); $('m-name').hidden = true; refreshHome(); if (view.screen === 'set') buildSettings(); snd('pop'); };
  $('nameIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('nameOk').click(); });
  $('bDaily').onclick = () => { const a = claimDaily(); if (a) { snd('daily'); toast('+' + a + ' 🪙 de presente! Volte amanhã.'); } refreshHome(); };
  $('bResume').onclick = () => joinCode(P.lastRoom);
  $('bCareer').onclick = () => { snd('tap'); openCareer(); }; $('bPuz').onclick = () => { snd('tap'); openPuz(); };
  $('bMiss').onclick = () => { snd('tap'); openMissions(); }; $('bEvent').onclick = () => { snd('tap'); openEventInfo(); };
  $('bPuzUndo').onclick = undoPuzzle; $('bPuzReset').onclick = resetPuzzle; $('bPuzFinish').onclick = finishPuzzle;
  $('bMapsBack').onclick = () => { applyTheme(P.map); CUR_MAP = MAP_BY_ID[P.map]; musicPlay(CUR_MAP.music); goHome(); };
  $('mPrev').onclick = () => showMapView(MV.i - 1); $('mNext').onclick = () => showMapView(MV.i + 1);
  $('bUseMap').onclick = () => { P.map = MAPS[MV.i].id; save(); showMapView(MV.i); toast('Mapa escolhido! ✔'); };
  $('shAct').onclick = shopAct;
  $('hwNext').onclick = () => { snd('tap'); if (HW.i === HOW.length - 1) closeHow(); else showHow(HW.i + 1); };
  $('hwPrev').onclick = () => { snd('tap'); showHow(HW.i - 1); }; $('bHowBack').onclick = closeHow;
  $('bLeave').onclick = () => { Net.leave(); goHome(); }; $('bShare').onclick = shareRoom; $('bLobStart').onclick = lobbyStart;
  $('lobDiff').onclick = e => { const v = e.target.dataset && e.target.dataset.v; if (v) Net.patchM({ diff: v }).catch(() => { }); };
  // jogo
  const b = $('board'); b.addEventListener('pointerdown', onBoardDown); b.addEventListener('pointermove', onBoardMove); b.addEventListener('pointerup', onBoardUp); b.addEventListener('pointercancel', onBoardUp);
  $('bModeMove').onclick = () => { if (G) { setMode('move'); snd('tap'); } };
  $('bModeFence').onclick = () => { if (G && humanTurn() && G.st.f[G.st.turn] > 0) { setMode('fence'); G.ghost = { o: G.fo, r: 3, c: 3, ok: canWall(G.st, G.fo, 3, 3) }; snd('tap'); } };
  $('bRot').onclick = () => { G.fo = G.fo === 'h' ? 'v' : 'h'; if (G.ghost) { G.ghost.o = G.fo; G.ghost.ok = canWall(G.st, G.fo, G.ghost.r, G.ghost.c); } snd('tap'); };
  $('bPlace').onclick = () => { if (G.ghost && G.ghost.ok) placeFence(); else snd('bad'); };
  $('bCancelF').onclick = () => setMode('move');
  $('bPause').onclick = () => { pauseLabels(); $('m-pause').hidden = false; };
  $('pgMusic').onclick = () => { P.set.music = !P.set.music; save(); audVol(); pauseLabels(); }; $('pgSfx').onclick = () => { P.set.sfx = !P.set.sfx; save(); audVol(); pauseLabels(); };
  $('pgRestart').onclick = () => { $('m-pause').hidden = true; if (G.mode === 'online') Net.startGame().catch(() => toast('Falha ao recomeçar')); else startLocalGame(G.mode, G.n, G.map, G.diff); };
  $('pgQuit').onclick = () => { $('m-pause').hidden = true; if (G.over) leaveGame(); else ask('Sair da partida?', leaveGame); };
  $('bChat').onclick = () => { if (!G) return; G.unread = 0; $('chatBadge').hidden = true; renderChatLog(); $('m-chat').hidden = false; };
  $('rAgain').onclick = () => { $('m-result').hidden = true; if (G.again) G.again(); else if (G.mode === 'online') Net.startGame().catch(() => toast('Falha ao recomeçar')); else startLocalGame(G.mode, G.n, G.map, G.diff); };
  $('rMenu').onclick = () => { $('m-result').hidden = true; leaveGame(); };
  document.addEventListener('pointerdown', () => { if (!AUD.ctx) { audInit(); if (AUD.ctx) musicPlay(CUR_MAP.music); } else if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); }, { capture: true });
}
function pauseLabels() {
  $('pgMusic').textContent = '🎵 ' + (P.set.music ? 'Ligada' : 'Desligada'); $('pgSfx').textContent = '🔊 ' + (P.set.sfx ? 'Ligados' : 'Desligados');
  $('pgRestart').hidden = G && G.mode === 'online' && Net.room && Net.room.m.host !== deviceId();
}
function init() {
  applyTheme(P.map); CUR_MAP = MAP_BY_ID[P.map]; resize(); buildChat(); initSetup(); wire(); refreshHome(); showScreen('home'); fxVisible();
  requestAnimationFrame(frame); runLoading();
  const m = /^#sala-([A-Za-z0-9]{5})$/.exec(location.hash);
  if (m && Net.ok()) { history.replaceState(null, '', location.pathname); P.mode = 'online'; joinCode(m[1]); }
  else if (!P.tut) openHow();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
}
init();
