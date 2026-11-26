// ---------- áudio 100% sintetizado (sem arquivos) ----------
const AUD = { ctx: null, master: null, sfxG: null, musG: null, noiseBuf: null, timer: 0, step: 0, next: 0, track: null, want: null };
function audInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return AUD.ctx; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try {
    const c = AUD.ctx = new AC();
    AUD.master = c.createGain(); AUD.master.connect(c.destination);
    AUD.sfxG = c.createGain(); AUD.sfxG.connect(AUD.master);
    AUD.musG = c.createGain(); AUD.musG.connect(AUD.master);
    const b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AUD.noiseBuf = b; audVol();
    if (AUD.want) musicPlay(AUD.want);
  } catch (e) { AUD.ctx = null; }
  return AUD.ctx;
}
function audVol() {
  if (!AUD.ctx) return;
  AUD.sfxG.gain.value = P.set.sfx ? P.set.sfxVol * .9 : 0;
  AUD.musG.gain.value = P.set.music ? P.set.musicVol * .35 : 0;
}
function tone(type, f0, f1, dur, vol, delay, lp, vib, bus) {
  const c = AUD.ctx; if (!c || !(P.set.sfx || bus === AUD.musG)) return;
  const t0 = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f0 * .06; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + .05); }
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(.02, dur * .3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = o; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); out = f; }
  out.connect(g); g.connect(bus || AUD.sfxG); o.start(t0); o.stop(t0 + dur + .05);
}
function noise(dur, vol, delay, hp, lp) {
  const c = AUD.ctx; if (!c || !P.set.sfx) return;
  const t0 = c.currentTime + (delay || 0), s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = AUD.noiseBuf; f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || lp || 2000;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(AUD.sfxG); s.start(t0); s.stop(t0 + dur + .05);
}
function vibrate(p) { if (P.set.vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { } }
const SND = {
  tap() { tone('triangle', 520, 700, .07, .25); },
  oink(pitch) { const p = pitch || 1, b = (170 + Math.random() * 40) * p; tone('sawtooth', b * 1.4, b * .8, .11, .3, 0, 1100); tone('sawtooth', b, b * 1.25, .13, .3, .1, 900, 28); noise(.06, .08, 0, 0, 1200); },
  grunt() { tone('sawtooth', 120, 70, .18, .35, 0, 500, 22); },
  squeal() { tone('square', 700, 1900, .28, .18, 0, 2800, 18); tone('sawtooth', 1500, 900, .18, .12, .22, 3000); },
  boing() { tone('sine', 180, 520, .22, .4, 0, 0, 9); tone('triangle', 520, 220, .26, .25, .18); },
  step(pitch) { tone('triangle', (260 + Math.random() * 60) * (pitch || 1), 150, .08, .3); noise(.04, .1, 0, 0, 900); },
  jump() { tone('sine', 200, 900, .2, .4); tone('triangle', 900, 300, .22, .25, .18); SND.oink(1.3); },
  fence() { tone('square', 150, 90, .07, .3, 0, 700); noise(.07, .35, .01, 0, 1500); tone('square', 120, 80, .06, .25, .09, 600); },
  bad() { tone('sawtooth', 160, 90, .22, .3, 0, 600); },
  coin() { tone('square', 988, 988, .07, .18); tone('square', 1319, 1319, .18, .18, .07); },
  pop() { tone('sine', 600, 1200, .09, .3); },
  chat() { tone('triangle', 880, 1175, .09, .25); tone('triangle', 1175, 1568, .1, .2, .08); },
  turn() { tone('triangle', 660, 660, .08, .2); tone('triangle', 880, 880, .12, .2, .09); },
  win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone('square', f, f, .2, .2, i * .13, 3000)); SND.oink(1.2); setTimeout(() => SND.squeal(), 700); },
  lose() { [392, 349, 311, 262].forEach((f, i) => tone('sawtooth', f, f * .96, .3, .22, i * .22, 900, 6)); },
  trophy() { [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, .35, .25, i * .1)); noise(.5, .15, 0, 4000); },
  buy() { SND.coin(); tone('triangle', 1568, 2093, .2, .2, .2); },
  daily() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, .16, .25, i * .09)); },
  boss() { tone('sawtooth', 110, 55, .6, .4, 0, 500, 5); tone('square', 220, 110, .5, .2, .2, 900); noise(.4, .2, .3, 0, 600); },
  rand() { const a = ['oink', 'grunt', 'squeal', 'boing']; SND[a[(Math.random() * a.length) | 0]](.9 + Math.random() * .5); }
};
const snd = (n, a) => { if (!AUD.ctx || !P.set.sfx) return; try { SND[n](a); } catch (e) { } };

// ---------- música por mapa ----------
const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);
const TRACKS = {
  farm: { bpm: 104, root: 57, scale: [0, 2, 4, 7, 9], wave: 'triangle', bass: [0, 0, -5, -3], pat: [0, 2, 4, 2, 5, 4, 2, 1] },
  sunny: { bpm: 124, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], wave: 'square', bass: [0, -5, -3, -7], pat: [0, 2, 4, 7, 4, 2, 5, 3] },
  rain: { bpm: 80, root: 57, scale: [0, 2, 3, 7, 9], wave: 'sine', bass: [0, -4, -2, -5], pat: [4, 2, 0, 2, 3, 1, 0, -1] },
  xmas: { bpm: 112, root: 62, scale: [0, 2, 4, 5, 7, 9, 11], wave: 'triangle', bass: [0, 0, -5, 0], pat: [4, 4, 4, -1, 4, 4, 4, -1, 4, 6, 0, 2, 4, -1, -1, -1], bells: true },
  halloween: { bpm: 96, root: 52, scale: [0, 1, 4, 5, 7, 8, 10], wave: 'sawtooth', bass: [0, 0, -1, -2], pat: [0, 1, 0, 3, 2, 1, 0, -1], lp: 1400 }
};
function musicStep() {
  const c = AUD.ctx, T = AUD.track; if (!c || !T) return;
  const spb = 60 / T.bpm / 2;
  while (AUD.next < c.currentTime + .35) {
    const i = AUD.step, t = AUD.next - c.currentTime, bar = (i / T.pat.length | 0) % 4, d = T.pat[i % T.pat.length];
    if (d !== -1 || T.pat.length === 8) {
      if (d >= 0 && !(T.pat.length === 8 && Math.random() < .15)) {
        const sc = T.scale, deg = d % sc.length, oct = Math.floor(d / sc.length);
        tone(T.wave, NOTE(T.root + 12 + sc[deg] + oct * 12 + T.bass[bar] * 0), 0, spb * 1.6, .35, t, T.lp || 2400, 0, AUD.musG);
        if (T.bells && i % 2 === 0) tone('sine', NOTE(T.root + 24 + sc[deg]), 0, spb * 2.5, .12, t, 0, 0, AUD.musG);
      }
    }
    if (i % 4 === 0) tone(T.wave === 'square' ? 'triangle' : 'sine', NOTE(T.root - 12 + T.bass[bar]), 0, spb * 3.5, .5, t, 500, 0, AUD.musG);
    if (T.bpm > 100 && i % 2 === 1) { /* chimbal leve */ const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = AUD.noiseBuf; f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.05, c.currentTime + t); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + t + .05); s.connect(f); f.connect(g); g.connect(AUD.musG); s.start(c.currentTime + t); s.stop(c.currentTime + t + .08); }
    if (T === TRACKS.halloween && i % 16 === 8) tone('sawtooth', 900, 300, .5, .12, t, 1500, 6, AUD.musG);
    if (T === TRACKS.rain && i % 8 === 3) tone('sine', NOTE(T.root + 24 + T.scale[(Math.random() * 5) | 0]), 0, .5, .1, t, 0, 0, AUD.musG);
    AUD.step++; AUD.next += spb;
  }
}
function musicPlay(id) {
  AUD.want = id; if (!AUD.ctx) return;
  clearInterval(AUD.timer); AUD.track = TRACKS[id] || TRACKS.farm; AUD.step = 0; AUD.next = AUD.ctx.currentTime + .1;
  AUD.timer = setInterval(musicStep, 120);
}
function musicStop() { AUD.want = null; clearInterval(AUD.timer); AUD.timer = 0; AUD.track = null; }
document.addEventListener('visibilitychange', () => {
  if (!AUD.ctx) return;
  if (document.hidden) { clearInterval(AUD.timer); AUD.timer = 0; AUD.ctx.suspend(); }
  else { AUD.ctx.resume(); if (AUD.track && !AUD.timer) { AUD.next = AUD.ctx.currentTime + .1; AUD.timer = setInterval(musicStep, 120); } }
});
