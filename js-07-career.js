// ---------- carreira, puzzles, evento e missões (regras e dados) ----------
const NEUTRAL = 5; // dono das cercas de obstáculo (cinza)
function addObstacles(s, count, rnd) {
  let placed = 0, tries = 0;
  while (placed < count && tries < 600) {
    tries++; const o = rnd() < .5 ? 'h' : 'v', r = 1 + Math.floor(rnd() * 6), c = Math.floor(rnd() * 8);
    if (canWall(s, o, r, c)) { (o === 'h' ? s.h : s.v)[r][c] = NEUTRAL; placed++; }
  }
  return placed;
}
function seededLook(rnd, chId, crown) {
  const o = {}; for (const sl of SLOTS) if (rnd() < .6) { const l = ITEMS.filter(i => i.slot === sl.id); o[sl.id] = l[Math.floor(rnd() * l.length)].id; }
  if (crown && ITEM_BY_ID['head.crown.gold']) o.head = 'head.crown.gold';
  const pool = CHARS.filter(c => !c.event);
  return { ch: chId || pool[Math.floor(rnd() * pool.length)].id, o };
}

// ----- carreira: 100 fases, chefe a cada 10 -----
const WORLDS = ['Quintal', 'Pradaria', 'Pântano', 'Pico Nevado', 'Castelo Assombrado', 'Deserto Maluco', 'Selva Perdida', 'Vulcão', 'Lua dos Porcos', 'Palácio do Rei Porco'];
const BOSSES = [
  { name: 'Chefe Lamaçal', ch: 'lama', say: 'Aqui ninguém passa na lama!' }, { name: 'Dona Linguiça', ch: 'bacon', say: 'Vou te transformar em churrasco!' },
  { name: 'Barão Presunto', ch: 'ze', say: 'Sou dono desse pântano!' }, { name: 'Capitão Focinho', ch: 'fofura', say: 'Oink! Prepare-se!' },
  { name: 'Conde Zumbão', ch: 'zumbi', say: 'Cérebros… quer dizer, cercas!' }, { name: 'General Javali', ch: 'ze', say: 'Atacar! Pelo bacon!' },
  { name: 'Astro Porcão', ch: 'astro', say: 'Da lua eu vejo você perder.' }, { name: 'Unicórnio Sombrio', ch: 'unicornio', say: 'Meu brilho vai te cegar!' },
  { name: 'Robô-3000', ch: 'robo', say: 'Calculando sua derrota…' }, { name: 'REI PORCO LOUCO', ch: 'rei', say: 'EU SOU O REI DO CHIQUEIRO!' }
];
const OPP_NAMES = ['Zé Lama', 'Mariquinha', 'Seu Pernil', 'Tia Costela', 'Dudu Bacon', 'Lili Focinho', 'Nando Torresmo', 'Pepa', 'Juca Javali', 'Nina Salsicha', 'Tonho', 'Bia Presunto', 'Rex', 'Dona Mortadela', 'Lulu', 'Xuxu', 'Binho', 'Cacau', 'Pipoca', 'Tião'];
function careerCfg(lv) {
  const w = Math.ceil(lv / 10), boss = lv % 10 === 0, rnd = mulberry(lv * 7919 + 13);
  let diff = lv <= 12 ? 'easy' : lv <= 40 ? 'medium' : 'hard'; if (boss) diff = diff === 'easy' ? 'medium' : 'hard';
  const b = boss ? BOSSES[lv / 10 - 1] : null;
  return {
    lv, world: w, worldName: WORLDS[w - 1], boss, diff, myF: 10, oppF: 10 + (boss ? 3 : 0) + (lv > 50 ? 1 : 0) + (lv > 80 ? 1 : 0),
    obst: Math.min(14, Math.floor(lv / 7) + (boss ? 2 : 0)), map: MAPS[(w - 1) % MAPS.length].id,
    name: b ? b.name : OPP_NAMES[Math.floor(rnd() * OPP_NAMES.length)], say: b ? b.say : null,
    look: seededLook(rnd, b ? b.ch : null, boss), coins: boss ? 150 + lv * 3 : 15 + lv * 2
  };
}
function careerStars(lv) { return (P.career.stars[lv] | 0); }
function careerUnlocked(lv) { return lv <= P.career.best + 1; }
function careerState(cfg) {
  const s = newState(2); s.f = [cfg.myF, cfg.oppF]; addObstacles(s, cfg.obst, mulberry(cfg.lv * 31 + 5)); return s;
}
function grantReward(maxPrice) {
  const l = ITEMS.filter(i => !P.owned[i.id] && i.price <= maxPrice).sort((a, b) => b.price - a.price).slice(0, 6);
  if (!l.length) return null; const it = pick(l); P.owned[it.id] = 1; save(); return it;
}

// ----- puzzles -----
const PUZZLES = 24;
function puzzleKind(i) { return i <= 12 ? 'maze' : 'block'; }
function puzzleBuild(idx) {
  const kind = puzzleKind(idx);
  if (kind === 'maze') {
    const rnd = mulberry(idx * 104729 + 3); let best = null;
    for (let t = 0; t < 120; t++) {
      const s = newState(2); s.p[0] = { r: 8, c: Math.floor(rnd() * 9) }; s.p[1] = { r: 0, c: 0 }; s.f = [0, 0];
      addObstacles(s, 9 + idx * 1, rnd); const d = dist(s, 0);
      if (!best || d > best.K) best = { s, K: d }; if (d >= 12 + Math.floor(idx / 2)) break;
    }
    return { kind, idx, s: best.s, K: best.K, title: 'Labirinto ' + idx, tip: 'Chegue ao outro lado no menor número de jogadas. Meta: ' + best.K + ' jogadas.' };
  }
  const F = idx <= 18 ? 1 : 2; let s, base, best;
  for (let salt = 0; salt < 30; salt++) {
    const rnd = mulberry(idx * 7717 + 11 + salt * 97); s = newState(2);
    s.p[0] = { r: 8, c: 4 }; s.p[1] = { r: 1 + Math.floor(rnd() * 3), c: Math.floor(rnd() * 9) }; s.f = [F, 0];
    addObstacles(s, 3 + (idx % 6), rnd);
    base = dist(s, 1); const walls = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) for (const o of ['h', 'v']) if (canWall(s, o, r, c)) walls.push([o, r, c]);
    best = base;
    for (const [o, r, c] of walls) {
      const s1 = cloneState(s); applyAction(s1, { t: 'wall', o, r, c }); best = Math.max(best, dist(s1, 1));
      if (F === 2) for (const [o2, r2, c2] of walls) if (canWall(s1, o2, r2, c2)) { const s2 = cloneState(s1); applyAction(s2, { t: 'wall', o: o2, r: r2, c: c2 }); best = Math.max(best, dist(s2, 1)); }
    }
    if (best - base >= (F === 1 ? 3 : 5)) break;
  }
  return { kind, idx, s, F, base, best, title: 'Bloqueio ' + (idx - 12), tip: 'Use ' + F + (F > 1 ? ' cercas' : ' cerca') + ' para o rival andar o MÁXIMO possível. Hoje ele faz ' + base + ' passos.' };
}
function puzzleStars(pz, st) { // st = estado atual
  if (pz.kind === 'maze') { const m = pz.moves; return m <= pz.K ? 3 : m <= pz.K + 2 ? 2 : 1; }
  const gain = dist(st, 1) - pz.base, B = pz.best - pz.base;
  return gain >= B ? 3 : gain >= B - 1 && gain >= 1 ? 2 : gain >= Math.max(1, Math.ceil(B / 2)) ? 1 : 0;
}
function puzzleUnlocked(i) { return i === 1 || (P.puz.stars[i - 1] | 0) > 0; }

// ----- eventos temporários -----
const EVENTS = [
  { id: 'louco-1126', name: 'Desafio do Porco Louco', emoji: '🌀', start: '2026-11-25', end: '2026-12-14', goal: 5, map: 'halloween', reward: { ch: 'dourado', coins: 800 }, bossName: 'Porco Louco', bossCh: 'zumbi', say: 'HAHAHA! Eu sou LOUCO! 🌀' },
  { id: 'natal-1226', name: 'Natal dos Porcos', emoji: '🎅', start: '2026-12-15', end: '2027-01-06', goal: 5, map: 'xmas', reward: { ch: 'papai', coins: 800 }, bossName: 'Grinch Suíno', bossCh: 'ze', say: 'Vou roubar o seu Natal! 🎄' }
];
function activeEvent() { const t = dayKey(new Date()); return EVENTS.find(e => t >= e.start && t <= e.end) || null; }
function eventProg(e) { if (P.event.id !== e.id) { P.event = { id: e.id, wins: 0, done: 0 }; save(); } return P.event; }
function eventDaysLeft(e) { return Math.max(0, Math.ceil((new Date(e.end + 'T23:59:59') - new Date()) / 864e5)); }
function eventState(e) {
  const s = newState(2), rnd = mulberry(Date.now() & 0xffff); s.f = [8, 14]; addObstacles(s, 8 + Math.floor(rnd() * 4), rnd); return s;
}

// ----- missões diárias -----
const MISSIONS = [
  { id: 'win1', t: 'Vença 1 partida', n: 1, coins: 60, kind: 'win' }, { id: 'play3', t: 'Jogue 3 partidas', n: 3, coins: 50, kind: 'games' },
  { id: 'fence8', t: 'Coloque 8 cercas', n: 8, coins: 60, kind: 'fence' }, { id: 'jump3', t: 'Pule 3 vezes', n: 3, coins: 70, kind: 'jump' },
  { id: 'career2', t: 'Vença 2 fases da carreira', n: 2, coins: 100, kind: 'career' }, { id: 'puz2', t: 'Resolva 2 puzzles', n: 2, coins: 100, kind: 'puzzle' },
  { id: 'step30', t: 'Ande 30 casas', n: 30, coins: 50, kind: 'step' }
];
function todayMissions() {
  const day = dayKey(new Date());
  if (P.miss.day !== day) {
    const rnd = mulberry(hashStr(day)), pool = MISSIONS.slice(), list = [];
    while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0].id);
    P.miss = { day, list, prog: {}, got: {} }; save();
  }
  return P.miss.list.map(id => MISSIONS.find(m => m.id === id));
}
function track(kind, n) { todayMissions(); P.miss.prog[kind] = (P.miss.prog[kind] || 0) + (n || 1); save(); }
function missionDone(m) { return (P.miss.prog[m.kind] || 0) >= m.n; }
function missionClaimable() { return todayMissions().filter(m => missionDone(m) && !P.miss.got[m.id]).length; }
function claimMission(id) { const m = MISSIONS.find(x => x.id === id); if (!m || !missionDone(m) || P.miss.got[id]) return 0; P.miss.got[id] = 1; addCoins(m.coins); return m.coins; }
