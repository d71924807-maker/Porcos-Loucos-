// ---------- modo online (Firebase Realtime Database via REST) ----------
// sala: rooms/CODE = { s: estado, rev: nº, m: {n,map,diff,st,host,seats:[{id,name,look,bot}]}, c: {k,seat,i} }
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const Net = {
  code: null, me: -1, rev: -1, room: null, timer: 0, busy: false, lastC: 0, fails: 0, h: {},
  base() { return ((window.PORCOS_CONFIG || {}).firebaseUrl || '').replace(/\/+$/, ''); },
  ok() { return /^https:\/\//.test(Net.base()); },
  async req(method, path, body) {
    const r = await fetch(Net.base() + '/' + path + '.json', { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  },
  newCode() { let s = ''; for (let i = 0; i < 5; i++) s += ALPHA[(Math.random() * ALPHA.length) | 0]; return s; },
  cleanCode(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); },
  seatOf(m) { return (m.seats || []).findIndex(x => x && x.id === deviceId()); },
  safeLook(l) {
    const o = { ch: 'torresmo', o: {} }; if (!l || typeof l !== 'object') return o;
    if (CHAR_BY_ID[l.ch]) o.ch = l.ch;
    for (const sl of SLOTS) { const id = l.o && l.o[sl]; if (id && ITEM_BY_ID[id] && ITEM_BY_ID[id].slot === sl) o.o[sl] = id; }
    return o;
  },
  // normaliza o que veio da rede (nunca confiar em nada)
  clean(raw) {
    if (!raw || typeof raw.s !== 'string' || !raw.m) return null;
    const m = raw.m, n = [2, 3, 4].includes(m.n) ? m.n : 2, seats = [];
    for (let i = 0; i < n; i++) {
      const x = (m.seats && m.seats[i]) || null;
      seats.push(x ? { id: String(x.id || '').slice(0, 40), name: cleanName(x.name) || 'Porco', look: Net.safeLook(x.look), bot: x.bot ? 1 : 0 } : null);
    }
    const c = raw.c && typeof raw.c === 'object' ? { k: raw.c.k | 0, seat: raw.c.seat | 0, i: raw.c.i | 0 } : null;
    return { s: raw.s.slice(0, 4000), rev: raw.rev | 0, c, m: { n, map: MAP_BY_ID[m.map] ? m.map : 'farm', diff: ['easy', 'medium', 'hard'].includes(m.diff) ? m.diff : 'medium', st: ['lobby', 'play'].includes(m.st) ? m.st : 'lobby', host: String(m.host || '').slice(0, 40), seats, g: m.g | 0 } };
  },
  async create(n, map, diff) {
    for (let t = 0; t < 4; t++) {
      const code = Net.newCode();
      if (await Net.req('GET', 'rooms/' + code + '/rev') !== null) continue;
      const seats = []; for (let i = 0; i < n; i++) seats.push(i === 0 ? { id: deviceId(), name: P.name, look: myLook(), bot: 0 } : null);
      const doc = { s: encState(newState(n)), rev: 0, m: { n, map, diff, st: 'lobby', host: deviceId(), g: 0, seats: Object.assign({}, seats.map(x => x || 0)) }, t: Date.now() };
      await Net.req('PUT', 'rooms/' + code, doc);
      Net.revOut = 0; Net.code = code; Net.me = 0; Net.rev = -1; Net.room = null; Net.lastC = 0; P.lastRoom = code; save(); return code;
    }
    throw new Error('sem código livre');
  },
  async join(code) {
    code = Net.cleanCode(code); if (code.length !== 5) throw new Error('codigo');
    const raw = await Net.req('GET', 'rooms/' + code); const r = Net.clean(raw); if (!r) throw new Error('nao existe');
    let me = Net.seatOf(r.m);
    if (me < 0) {
      me = r.m.seats.findIndex(x => !x || (x.bot && r.m.st === 'lobby'));
      if (me < 0 && r.m.st === 'play') me = r.m.seats.findIndex(x => x && x.bot && x.left);
      if (me < 0) throw new Error('cheia');
      await Net.req('PUT', 'rooms/' + code + '/m/seats/' + me, { id: deviceId(), name: P.name, look: myLook(), bot: 0 });
      const chk = Net.clean(await Net.req('GET', 'rooms/' + code)); if (!chk || Net.seatOf(chk.m) !== me) throw new Error('cheia');
    } else { await Net.req('PATCH', 'rooms/' + code + '/m/seats/' + me, { name: P.name, look: myLook(), bot: 0, left: null }); }
    Net.revOut = 0; Net.code = code; Net.me = me; Net.rev = -1; Net.room = null; Net.lastC = (r.c && r.c.k) | 0; P.lastRoom = code; save(); return code;
  },
  start() { Net.stop(); const tick = async () => { await Net.poll(); Net.timer = setTimeout(tick, document.hidden ? 3000 : 850); }; tick(); },
  stop() { clearTimeout(Net.timer); Net.timer = 0; },
  async poll() {
    if (!Net.code || Net.busy) return; Net.busy = true;
    try {
      const r = Net.clean(await Net.req('GET', 'rooms/' + Net.code)); Net.fails = 0;
      if (!r) { Net.h.gone && Net.h.gone(); return; }
      if (r.rev < (Net.revOut || 0)) return;
      const prev = Net.room; Net.room = r;
      const me = Net.seatOf(r.m); if (me >= 0) Net.me = me; else if (Net.me >= 0 && !(prev && prev.m.seats[Net.me])) { /* ainda entrando */ } else if (me < 0) { Net.h.kicked && Net.h.kicked(); return; }
      Net.h.room && Net.h.room(r, prev);
      if (r.c && r.c.k !== Net.lastC) { const first = Net.lastC === 0 && !prev; Net.lastC = r.c.k; if (!first && r.c.seat !== Net.me) Net.h.chat && Net.h.chat(r.c); }
    } catch (e) { if (++Net.fails === 4) Net.h.offline && Net.h.offline(); }
    finally { Net.busy = false; }
  },
  async patchM(p) { await Net.req('PATCH', 'rooms/' + Net.code + '/m', p); },
  async sendState(s) { const rev = Math.max(Net.revOut || 0, Net.room ? Net.room.rev : 0) + 1; Net.revOut = rev; await Net.req('PATCH', 'rooms/' + Net.code, { s: encState(s), rev }); },
  async startGame() { const r = Net.room, rev = Math.max(Net.revOut || 0, r.rev) + 1; Net.revOut = rev; await Net.req('PATCH', 'rooms/' + Net.code, { s: encState(newState(r.m.n)), rev, 'm/st': 'play', 'm/g': r.m.g + 1 }); },
  async chat(i) { const k = (Net.lastC + 1) | 0; Net.lastC = k; await Net.req('PUT', 'rooms/' + Net.code + '/c', { k, seat: Net.me, i }); },
  async leave() {
    const code = Net.code, r = Net.room; Net.stop(); Net.code = null; P.lastRoom = null; save();
    if (!code || !r || Net.me < 0) return;
    try {
      const humans = r.m.seats.map((x, i) => x && !x.bot && i !== Net.me ? i : -1).filter(i => i >= 0);
      if (!humans.length) { await Net.req('DELETE', 'rooms/' + code); return; }
      if (r.m.st === 'play') await Net.req('PATCH', 'rooms/' + code + '/m/seats/' + Net.me, { bot: 1, left: 1 }); else await Net.req('DELETE', 'rooms/' + code + '/m/seats/' + Net.me);
      if (r.m.host === deviceId()) await Net.req('PATCH', 'rooms/' + code + '/m', { host: r.m.seats[humans[0]].id });
    } catch (e) { /* ignorar */ }
  }
};
