// ---------- perfil, moedas e ajustes (salvos no aparelho) ----------
const LS_KEY = 'porcos-loucos-v2';
const defaultProfile = () => ({
  v: 2, name: 'Torresmo', coins: 300, trophies: 0, ch: 'torresmo', ownedCh: { torresmo: 1, lama: 1 }, owned: {},
  outfit: { head: null, face: null, neck: null, body: null, back: null },
  set: { music: true, musicVol: .6, sfx: true, sfxVol: .8, vib: true, quality: 'high', fx: true, hints: true, confirmWall: true },
  map: 'farm', diff: 'medium', mode: 'bots', n: 2,
  stats: { games: 0, wins: 0, best: 0, walls: 0, earned: 0 }, tut: false, daily: { last: '', streak: 0 }, lastRoom: null
});
function loadProfile() {
  const d = defaultProfile();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      for (const k of Object.keys(d)) {
        if (o[k] === undefined) continue;
        if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) d[k] = Object.assign({}, d[k], o[k]); else d[k] = o[k];
      }
    }
  } catch (e) { /* sem armazenamento */ }
  d.name = cleanName(d.name) || 'Torresmo';
  if (!CHAR_BY_ID[d.ch] || !d.ownedCh[d.ch]) d.ch = 'torresmo';
  d.ownedCh.torresmo = 1; d.ownedCh.lama = 1;
  for (const s of Object.keys(d.outfit)) { const id = d.outfit[s]; if (id && (!ITEM_BY_ID[id] || !d.owned[id])) d.outfit[s] = null; }
  if (!MAP_BY_ID[d.map]) d.map = 'farm';
  if (![2, 3, 4].includes(d.n)) d.n = 2;
  return d;
}
const P = loadProfile();
let _saveT = 0;
function save() { clearTimeout(_saveT); _saveT = setTimeout(saveNow, 150); }
function saveNow() { try { localStorage.setItem(LS_KEY, JSON.stringify(P)); } catch (e) { /* ignorar */ } }
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

function deviceId() {
  try {
    let v = localStorage.getItem('porcos-id');
    if (!v) { v = 'p' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('porcos-id', v); }
    return v;
  } catch (e) { return window.__tmpId || (window.__tmpId = 'p' + Math.random().toString(36).slice(2, 12)); }
}
const myLook = () => ({ ch: P.ch, o: Object.assign({}, P.outfit) });

function addCoins(n) { P.coins = Math.max(0, Math.round(P.coins + n)); if (n > 0) P.stats.earned += n; save(); refreshCoins(); }
function buyItem(id) {
  const it = ITEM_BY_ID[id]; if (!it || P.owned[id] || P.coins < it.price) return false;
  P.coins -= it.price; P.owned[id] = 1; P.outfit[it.slot] = id; save(); refreshCoins(); return true;
}
function buyChar(id) {
  const c = CHAR_BY_ID[id]; if (!c || P.ownedCh[id] || P.coins < c.price) return false;
  P.coins -= c.price; P.ownedCh[id] = 1; P.ch = id; save(); refreshCoins(); return true;
}
function equipItem(slot, id) { P.outfit[slot] = id; save(); }
function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dailyInfo() {
  const today = dayKey(new Date()), y = new Date(); y.setDate(y.getDate() - 1);
  const streak = P.daily.last === dayKey(y) ? Math.min(P.daily.streak + 1, 7) : 1;
  return { avail: P.daily.last !== today, streak, amount: 40 + streak * 20 };
}
function claimDaily() {
  const d = dailyInfo(); if (!d.avail) return 0;
  P.daily = { last: dayKey(new Date()), streak: d.streak }; addCoins(d.amount); return d.amount;
}
