// ---------- regras do jogo (2 a 4 jogadores) ----------
const grid8 = () => Array.from({ length: 8 }, () => Array(8).fill(0));
function newState(n) {
  return {
    n, mode: MODE_OF(n), p: START[n].map(([r, c]) => ({ r, c })), h: grid8(), v: grid8(), f: Array(n).fill(FENCES[n]),
    turn: 0, moves: 0, winner: -1, sc: Array(n).fill(0), jp: Array(n).fill(0)
  };
}
function cloneState(s) {
  return { n: s.n, mode: s.mode, p: s.p.map(o => ({ r: o.r, c: o.c })), h: s.h.map(r => r.slice()), v: s.v.map(r => r.slice()), f: s.f.slice(), turn: s.turn, moves: s.moves, winner: s.winner, sc: s.sc.slice(), jp: s.jp.slice() };
}
const encState = s => JSON.stringify({ p: s.p.map(o => [o.r, o.c]), h: s.h, v: s.v, f: s.f, t: s.turn, m: s.moves, w: s.winner, sc: s.sc, jp: s.jp });
function decState(str, n) {
  const o = JSON.parse(str), s = newState(n);
  s.p = o.p.map(a => ({ r: a[0], c: a[1] })); s.h = o.h; s.v = o.v; s.f = o.f; s.turn = o.t; s.moves = o.m; s.winner = o.w; s.sc = o.sc; s.jp = o.jp;
  return s;
}
const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
const Hw = (s, a, b) => a >= 0 && a < 8 && b >= 0 && b < 8 && s.h[a][b] > 0;
const Vw = (s, a, b) => a >= 0 && a < 8 && b >= 0 && b < 8 && s.v[a][b] > 0;
function blocked(s, r, c, dr, dc) {
  if (dr === -1) return Hw(s, r - 1, c) || Hw(s, r - 1, c - 1);
  if (dr === 1) return Hw(s, r, c) || Hw(s, r, c - 1);
  if (dc === 1) return Vw(s, r, c) || Vw(s, r - 1, c);
  return Vw(s, r, c - 1) || Vw(s, r - 1, c - 1);
}
function occ(s, r, c, ex) { for (let i = 0; i < s.n; i++) if (i !== ex && s.p[i].r === r && s.p[i].c === c) return true; return false; }
function atGoal(s, i) { const p = s.p[i]; return s.mode === 'race' ? p.r === (i === 0 ? 0 : 8) : (p.r === 4 && p.c === 4); }
function legalMoves(s, pl) {
  const me = s.p[pl], res = [], seen = new Set();
  const add = (r, c, j) => { const k = r * 9 + c; if (!seen.has(k)) { seen.add(k); res.push({ r, c, j }); } };
  for (const [dr, dc] of DIRS) {
    if (blocked(s, me.r, me.c, dr, dc)) continue;
    const nr = me.r + dr, nc = me.c + dc; if (!inb(nr, nc)) continue;
    if (occ(s, nr, nc, pl)) {
      const jr = nr + dr, jc = nc + dc;
      if (inb(jr, jc) && !blocked(s, nr, nc, dr, dc) && !occ(s, jr, jc, pl)) add(jr, jc, 1);
      else for (const [pr, pc] of (dr !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]])) {
        if (!blocked(s, nr, nc, pr, pc) && inb(nr + pr, nc + pc) && !occ(s, nr + pr, nc + pc, pl)) add(nr + pr, nc + pc, 1);
      }
    } else add(nr, nc, 0);
  }
  return res;
}
function bfs(s, pl, wantPath) {
  const st = s.p[pl], goalRow = s.mode === 'race' ? (pl === 0 ? 0 : 8) : -1;
  const d = new Int8Array(81).fill(-1), par = wantPath ? new Int8Array(81).fill(-1) : null, q = new Int8Array(81);
  let qh = 0, qt = 0; const s0 = st.r * 9 + st.c; d[s0] = 0; q[qt++] = s0;
  while (qh < qt) {
    const cur = q[qh++], r = (cur / 9) | 0, c = cur % 9;
    if (goalRow >= 0 ? r === goalRow : (r === 4 && c === 4)) {
      if (!wantPath) return d[cur];
      const path = []; let k = cur; while (k !== -1) { path.push([(k / 9) | 0, k % 9]); k = par[k]; } return path.reverse();
    }
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc; if (!inb(nr, nc)) continue; const k = nr * 9 + nc;
      if (d[k] >= 0 || blocked(s, r, c, dr, dc)) continue;
      d[k] = d[cur] + 1; if (par) par[k] = cur; q[qt++] = k;
    }
  }
  return wantPath ? null : Infinity;
}
const dist = (s, pl) => bfs(s, pl, false);
function wallFree(s, o, r, c) {
  if (r < 0 || r > 7 || c < 0 || c > 7) return false;
  if (o === 'h') return !s.h[r][c] && !s.v[r][c] && !(c > 0 && s.h[r][c - 1]) && !(c < 7 && s.h[r][c + 1]);
  return !s.v[r][c] && !s.h[r][c] && !(r > 0 && s.v[r - 1][c]) && !(r < 7 && s.v[r + 1][c]);
}
function canWall(s, o, r, c) {
  if (!wallFree(s, o, r, c)) return false;
  const a = o === 'h' ? s.h : s.v; a[r][c] = 1;
  let ok = true; for (let i = 0; i < s.n && ok; i++) if (!isFinite(dist(s, i))) ok = false;
  a[r][c] = 0; return ok;
}
const hasWallMove = s => { for (const o of ['h', 'v']) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (canWall(s, o, r, c)) return true; return false; };

// aplica uma ação (sem pontuação). Retorna { jump, gain } com os efeitos úteis para pontos.
function applyAction(s, a) {
  const pl = s.turn;
  if (a.t === 'move') { s.p[pl].r = a.r; s.p[pl].c = a.c; }
  else { (a.o === 'h' ? s.h : s.v)[a.r][a.c] = pl + 1; s.f[pl]--; }
  s.moves++;
}
function scoreAction(s, a) { // pontos ao vivo, calculados ANTES de aplicar
  const pl = s.turn; let pts = 0, info = {};
  if (a.t === 'move') {
    const d0 = dist(s, pl), old = s.p[pl], t = { r: old.r, c: old.c };
    s.p[pl] = { r: a.r, c: a.c }; const d1 = dist(s, pl); s.p[pl] = t;
    if (d1 < d0) pts += 2;
    if (a.j) { pts += 8; info.jump = true; }
  } else {
    const before = []; for (let i = 0; i < s.n; i++) before.push(i === pl ? 0 : dist(s, i));
    const arr = a.o === 'h' ? s.h : s.v; arr[a.r][a.c] = pl + 1;
    let best = 0; for (let i = 0; i < s.n; i++) if (i !== pl) best = Math.max(best, dist(s, i) - before[i]);
    arr[a.r][a.c] = 0;
    pts += clamp(best * 3, 0, 12); info.gain = best;
  }
  return { pts, info };
}
function finalLines(s, i) {
  const lines = [];
  if (s.winner === i) {
    lines.push(['Vitória!', 100]);
    const turns = Math.ceil(s.moves / s.n), sp = turns <= 12 ? 40 : turns <= 16 ? 25 : turns <= 22 ? 10 : 0;
    if (sp) lines.push(['Rapidez', sp]);
    const placed = FENCES[s.n] - s.f[i];
    if (placed === 0) lines.push(['Mãos limpas', 20]); else if (s.f[i] === 0) lines.push(['Cercador total', 15]);
  } else {
    const d = dist(s, i); lines.push([s.mode === 'cup' ? 'Perto da taça' : 'Chegou perto', Math.max(0, 40 - (isFinite(d) ? d : 8) * 5)]);
  }
  return lines;
}
const finalTotal = (s, i) => s.sc[i] + finalLines(s, i).reduce((a, l) => a + l[1], 0);

// ---------- robôs ----------
function others(s, me) { const r = []; for (let i = 0; i < s.n; i++) if (i !== me) r.push(i); return r; }
function evalFor(s, me) {
  const my = dist(s, me); let best = 99, sum = 0, cnt = 0;
  for (const i of others(s, me)) { const d = dist(s, i); if (d < best) best = d; sum += d; cnt++; }
  return (best - my) + (sum / cnt - my) * 0.35;
}
function candidateWalls(s, targets) {
  const out = [], seen = new Set();
  for (const t of targets) {
    const path = bfs(s, t, true); if (!path) continue;
    for (let k = 0; k + 1 < path.length; k++) {
      const [ra, ca] = path[k], [rb, cb] = path[k + 1];
      const opts = ra !== rb ? [['h', Math.min(ra, rb), ca], ['h', Math.min(ra, rb), ca - 1]] : [['v', ra, Math.min(ca, cb)], ['v', ra - 1, Math.min(ca, cb)]];
      for (const [o, r, c] of opts) { const key = o + r + ',' + c; if (seen.has(key)) continue; seen.add(key); if (canWall(s, o, r, c)) out.push({ t: 'wall', o, r, c }); }
    }
  }
  return out;
}
function simulate(s, a) { const s2 = cloneState(s); applyAction(s2, a); s2.turn = (s2.turn + 1) % s2.n; return s2; }
function aiChoose(s, diff) {
  const me = s.turn, moves = legalMoves(s, me), opps = others(s, me);
  for (const m of moves) { const old = s.p[me]; s.p[me] = { r: m.r, c: m.c }; const w = atGoal(s, me); s.p[me] = old; if (w) return { t: 'move', r: m.r, c: m.c, j: m.j }; }
  const mv = m => ({ t: 'move', r: m.r, c: m.c, j: m.j });
  if (diff === 'easy') {
    if (moves.length && Math.random() < .4) return mv(pick(moves));
    let best = null, bs = -1e9;
    for (const m of moves) { const s2 = simulate(s, mv(m)); const sc = -dist(s2, me) + Math.random() * .8; if (sc > bs) { bs = sc; best = mv(m); } }
    if (s.f[me] > 0 && Math.random() < .07) { const ws = candidateWalls(s, opps); if (ws.length) return pick(ws); }
    return best;
  }
  const noise = diff === 'hard' ? .12 : .55, fenceCost = diff === 'hard' ? .35 : .75;
  if (diff === 'medium' && moves.length && Math.random() < .1) return mv(pick(moves));
  const minOpp = Math.min(...opps.map(i => dist(s, i)));
  const cands = [];
  for (const m of moves) { const s2 = simulate(s, mv(m)); cands.push({ a: mv(m), sc: evalFor(s2, me) + (Math.random() - .5) * noise, s2 }); }
  if (s.f[me] > 0) {
    const targets = opps.filter(i => dist(s, i) <= minOpp + (diff === 'hard' ? 3 : 2));
    for (const w of candidateWalls(s, targets.length ? targets : opps)) {
      const s2 = simulate(s, w); const gain = Math.min(...opps.map(i => dist(s2, i))) - minOpp;
      let sc = evalFor(s2, me) - fenceCost + (Math.random() - .5) * noise;
      if (minOpp <= 2 && gain >= 1) sc += 3 + gain; // emergência: alguém quase chegando
      cands.push({ a: w, sc, s2 });
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b.sc - a.sc);
  if (diff !== 'hard') return cands[0].a;
  // difícil: olha a resposta do próximo jogador
  let bestA = cands[0].a, bestV = -1e9;
  for (const c of cands.slice(0, 5)) {
    const nx = c.s2.turn, r = []; let worst = 1e9;
    if (atGoal(c.s2, me)) return c.a;
    const rm = legalMoves(c.s2, nx);
    for (const m of rm) { const s3 = simulate(c.s2, { t: 'move', r: m.r, c: m.c }); worst = Math.min(worst, evalFor(s3, me)); }
    if (c.s2.f[nx] > 0) for (const w of candidateWalls(c.s2, [me]).slice(0, 8)) { const s3 = simulate(c.s2, w); worst = Math.min(worst, evalFor(s3, me)); }
    if (worst === 1e9) worst = c.sc;
    const v = c.sc * .4 + worst * .6;
    if (v > bestV) { bestV = v; bestA = c.a; }
  }
  return bestA;
}
