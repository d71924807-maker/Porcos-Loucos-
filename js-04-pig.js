// ---------- desenho dos porcos e das roupas (coordenadas em "unidades de porco") ----------
const PI = Math.PI;
const fsk = (g, fill) => { g.fillStyle = fill; g.fill(); g.stroke(); };
const poly = (g, p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); };
const ell = (g, x, y, rx, ry, rot) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
const dome = (g, y, rx, ry) => { g.beginPath(); g.ellipse(0, y, rx, ry, 0, PI, TAU); g.closePath(); };
const heart = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y + s * .35); g.bezierCurveTo(x - s, y - s * .2, x - s * .5, y - s, x, y - s * .4); g.bezierCurveTo(x + s * .5, y - s, x + s, y - s * .2, x, y + s * .35); g.closePath(); };
const star = (g, x, y, r, rot) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * PI / 5 - PI / 2, rr = i % 2 ? r * .45 : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
const ARM = { a: 0 }; // ângulo atual dos bracinhos
function arm(g, sd, color, ink) { g.save(); g.translate(sd * .29, .3); g.rotate(sd * (.45 + ARM.a * (sd > 0 ? -1 : 1))); ell(g, 0, .08, .085, .16); fsk(g, color); g.restore(); }
function sleeves(g, color) { arm(g, -1, color, null); arm(g, 1, color, null); }
const torso = g => ell(g, 0, .4, .27, .22);
function inTorso(g, fn) { g.save(); torso(g); g.clip(); fn(); g.restore(); torso(g); g.stroke(); }
function scarfPath(g) { g.beginPath(); g.moveTo(-.31, .13); g.quadraticCurveTo(0, .33, .31, .13); g.lineTo(.29, .27); g.quadraticCurveTo(0, .45, -.29, .27); g.closePath(); }

// ---------- roupas: cada função desenha com o contexto já escalado ----------
const HEAD = {
  cap: (g, c) => { dome(g, -.36, .4, .27); fsk(g, c); ell(g, .14, -.35, .34, .065); fsk(g, shade(c, -.25)); circ(g, 0, -.63, .04); fsk(g, shade(c, -.25)); },
  beanie: (g, c) => { dome(g, -.34, .4, .3); fsk(g, c); rrect(g, -.42, -.42, .84, .13, .06); fsk(g, shade(c, .3)); circ(g, 0, -.66, .1); fsk(g, '#fff'); },
  party: (g, c) => { g.save(); g.translate(0, -.38); g.rotate(-.12); poly(g, [-.22, 0, .22, 0, 0, -.55]); fsk(g, c); g.fillStyle = shade(c, .5); for (const [x, y] of [[-.06, -.14], [.07, -.24], [-.02, -.34]]) { circ(g, x, y, .035); g.fill(); } circ(g, 0, -.56, .07); fsk(g, '#fff'); g.restore(); },
  top: (g, c) => { ell(g, 0, -.38, .46, .08); fsk(g, c); rrect(g, -.27, -.88, .54, .5, .04); fsk(g, c); rrect(g, -.27, -.5, .54, .1, 0); fsk(g, c === '#2c2c34' ? '#e0443f' : '#ffd23f'); },
  crown: (g, c) => { poly(g, [-.3, -.38, -.32, -.74, -.16, -.55, 0, -.82, .16, -.55, .32, -.74, .3, -.38]); fsk(g, c); rrect(g, -.31, -.46, .62, .09, .03); fsk(g, shade(c, -.2)); for (const [x, y, k] of [[0, -.8, '#e0443f'], [-.32, -.72, '#3f7be0'], [.32, -.72, '#3fae4a']]) { circ(g, x, y, .04); fsk(g, k); } },
  pirate: (g, c) => { g.beginPath(); g.moveTo(-.47, -.36); g.quadraticCurveTo(-.4, -.84, 0, -.8); g.quadraticCurveTo(.4, -.84, .47, -.36); g.quadraticCurveTo(0, -.28, -.47, -.36); g.closePath(); fsk(g, c); circ(g, 0, -.58, .07); fsk(g, '#fff'); g.beginPath(); g.moveTo(-.08, -.46); g.lineTo(.08, -.5); g.moveTo(.08, -.46); g.lineTo(-.08, -.5); g.stroke(); },
  helmet: (g, c) => { dome(g, -.34, .42, .32); fsk(g, c); rrect(g, -.47, -.38, .94, .07, .03); fsk(g, shade(c, -.25)); rrect(g, -.05, -.66, .1, .3, .02); fsk(g, shade(c, .25)); },
  santa: g => { poly(g, [-.4, -.36, -.3, -.72, .12, -.82, .5, -.62, .42, -.36]); fsk(g, '#e0443f'); rrect(g, -.45, -.44, .9, .12, .06); fsk(g, '#fff'); circ(g, .5, -.6, .09); fsk(g, '#fff'); },
  elf: g => { poly(g, [-.4, -.36, -.22, -.64, .32, -.9, .12, -.52, .4, -.36]); fsk(g, '#3fae4a'); rrect(g, -.42, -.43, .84, .09, .04); fsk(g, '#e0443f'); circ(g, .32, -.9, .05); fsk(g, '#ffd23f'); },
  witch: (g, c) => { ell(g, 0, -.38, .52, .09); fsk(g, c); poly(g, [-.28, -.4, -.12, -.72, .04, -.98, .16, -.52, .28, -.4]); fsk(g, c); rrect(g, -.28, -.5, .56, .09, .02); fsk(g, '#ffc83a'); },
  wizard: (g, c) => { ell(g, 0, -.38, .5, .08); fsk(g, c); poly(g, [-.34, -.4, -.04, -1, .34, -.4]); fsk(g, c); g.fillStyle = '#ffd23f'; for (const [x, y, r] of [[-.06, -.55, .045], [.1, -.7, .035], [-.02, -.8, .03]]) { star(g, x, y, r * 1.6, 0); g.fill(); } },
  cowboy: (g, c) => { g.beginPath(); g.moveTo(-.56, -.4); g.quadraticCurveTo(-.4, -.3, 0, -.32); g.quadraticCurveTo(.4, -.3, .56, -.4); g.quadraticCurveTo(.42, -.45, 0, -.45); g.quadraticCurveTo(-.42, -.45, -.56, -.4); g.closePath(); fsk(g, shade(c, -.1)); rrect(g, -.27, -.76, .54, .36, .12); fsk(g, c); rrect(g, -.27, -.5, .54, .08, 0); fsk(g, shade(c, -.35)); },
  beret: (g, c) => { g.save(); g.rotate(-.12); ell(g, -.02, -.45, .42, .14); fsk(g, c); rrect(g, -.03, -.66, .06, .1, .02); fsk(g, shade(c, -.3)); g.restore(); },
  chef: g => { for (const [x, y, r] of [[-.2, -.62, .19], [.2, -.62, .19], [0, -.72, .22]]) { circ(g, x, y, r); fsk(g, '#fff'); } rrect(g, -.3, -.5, .6, .15, .03); fsk(g, '#fff'); },
  viking: g => { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * .36, -.44); g.quadraticCurveTo(sd * .66, -.46, sd * .62, -.82); g.quadraticCurveTo(sd * .52, -.58, sd * .3, -.52); g.closePath(); fsk(g, '#fff6df'); } dome(g, -.36, .4, .28); fsk(g, '#aab4c0'); rrect(g, -.42, -.42, .84, .08, .03); fsk(g, '#7d8794'); },
  straw: g => { ell(g, 0, -.38, .56, .1); fsk(g, '#e8c26a'); rrect(g, -.27, -.64, .54, .28, .1); fsk(g, '#f0d27f'); rrect(g, -.27, -.46, .54, .07, 0); fsk(g, '#e0443f'); },
  tiara: (g, c) => { poly(g, [-.3, -.4, -.22, -.62, -.1, -.46, 0, -.7, .1, -.46, .22, -.62, .3, -.4]); fsk(g, c); circ(g, 0, -.56, .045); fsk(g, '#3f7be0'); },
  halo: (g, c, t) => { g.save(); g.lineWidth = .06; g.strokeStyle = '#ffc83a'; ell(g, 0, -.66 + Math.sin(t * 3) * .02, .27, .075); g.stroke(); g.lineWidth = .02; g.strokeStyle = '#fff6b0'; ell(g, 0, -.66 + Math.sin(t * 3) * .02, .27, .075); g.stroke(); g.restore(); },
  horns: g => { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * .2, -.46); g.quadraticCurveTo(sd * .42, -.6, sd * .32, -.82); g.quadraticCurveTo(sd * .22, -.62, sd * .08, -.5); g.closePath(); fsk(g, '#e0443f'); } },
  catears: (g, c) => { for (const sd of [-1, 1]) { poly(g, [sd * .38, -.4, sd * .4, -.76, sd * .12, -.5]); fsk(g, c); poly(g, [sd * .33, -.46, sd * .35, -.66, sd * .2, -.52]); fsk(g, '#ffb3c6'); } },
  bow: (g, c) => { g.save(); g.translate(.24, -.5); g.rotate(.3); poly(g, [0, 0, -.2, -.12, -.2, .12]); fsk(g, c); poly(g, [0, 0, .2, -.12, .2, .12]); fsk(g, c); circ(g, 0, 0, .05); fsk(g, shade(c, -.2)); g.restore(); },
  flower: (g, c) => { g.save(); g.translate(.25, -.46); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circ(g, Math.cos(a) * .08, Math.sin(a) * .08, .07); fsk(g, c); } circ(g, 0, 0, .05); fsk(g, c === '#ffd23f' ? '#e0443f' : '#ffd23f'); g.restore(); },
  phones: (g, c) => { g.save(); g.lineWidth = .07; g.strokeStyle = c; g.beginPath(); g.arc(0, -.12, .5, PI * 1.07, PI * 1.93); g.stroke(); g.restore(); for (const sd of [-1, 1]) { rrect(g, sd * .5 - .07, -.24, .14, .26, .06); fsk(g, shade(c, -.2)); } },
  alien: g => { for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * .14, -.48); g.quadraticCurveTo(sd * .3, -.66, sd * .26, -.84); g.stroke(); circ(g, sd * .26, -.86, .06); fsk(g, '#7dff7a'); } },
  astro: g => { g.save(); ell(g, 0, -.14, .56, .5); g.fillStyle = 'rgba(190,225,255,.28)'; g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = .04; g.beginPath(); g.arc(0, -.14, .44, PI * 1.12, PI * 1.38); g.stroke(); g.restore(); ell(g, 0, .2, .42, .08); fsk(g, '#eef2f7'); },
  pumpkin: g => { ell(g, 0, -.58, .32, .22); fsk(g, '#f08a1c'); rrect(g, -.04, -.84, .08, .1, .02); fsk(g, '#3fae4a'); g.fillStyle = '#4a2a14'; poly(g, [-.16, -.62, -.08, -.62, -.12, -.7]); g.fill(); poly(g, [.08, -.62, .16, -.62, .12, -.7]); g.fill(); g.beginPath(); g.moveTo(-.12, -.52); g.lineTo(-.04, -.55); g.lineTo(.04, -.52); g.lineTo(.12, -.55); g.stroke(); },
  turban: (g, c) => { ell(g, 0, -.42, .43, .28); fsk(g, c); g.save(); g.beginPath(); ell(g, 0, -.42, .43, .28); g.clip(); g.strokeStyle = shade(c, -.35); g.lineWidth = .03; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * .13 - .2, -.7); g.lineTo(i * .13 + .2, -.14); g.stroke(); } g.restore(); circ(g, 0, -.5, .06); fsk(g, c === '#ffc83a' ? '#e0443f' : '#ffc83a'); },
  pizza: g => { poly(g, [-.3, -.4, .3, -.4, 0, -.9]); fsk(g, '#ffcf4a'); rrect(g, -.31, -.43, .62, .07, .035); fsk(g, '#d9923f'); g.fillStyle = '#d9402c'; for (const [x, y] of [[-.08, -.52], [.09, -.62], [-.01, -.74]]) { circ(g, x, y, .05); g.fill(); } },
  duck: g => { ell(g, 0, -.56, .22, .14); fsk(g, '#ffd23f'); circ(g, .12, -.72, .1); fsk(g, '#ffd23f'); poly(g, [.2, -.72, .32, -.7, .2, -.67]); fsk(g, '#f19a1c'); circ(g, .14, -.75, .015); g.fillStyle = '#000'; g.fill(); },
  ninja: (g, c) => { rrect(g, -.44, -.38, .88, .1, .04); fsk(g, c); rrect(g, -.1, -.39, .2, .12, .02); fsk(g, '#cfd6df'); poly(g, [.42, -.34, .6, -.26, .52, -.36]); fsk(g, c); poly(g, [.42, -.32, .56, -.18, .5, -.3]); fsk(g, c); }
};
const FACE = {
  round: (g, c) => { g.save(); g.lineWidth = .045; g.strokeStyle = c; for (const sd of [-1, 1]) { circ(g, sd * .17, -.22, .14); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.stroke(); } g.beginPath(); g.moveTo(-.03, -.22); g.lineTo(.03, -.22); g.moveTo(-.31, -.22); g.lineTo(-.42, -.26); g.moveTo(.31, -.22); g.lineTo(.42, -.26); g.stroke(); g.restore(); },
  shades: (g, c) => { for (const sd of [-1, 1]) { rrect(g, sd > 0 ? .04 : -.32, -.33, .28, .2, .07); fsk(g, c); } g.beginPath(); g.moveTo(-.04, -.25); g.lineTo(.04, -.25); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = .025; g.beginPath(); g.moveTo(-.27, -.3); g.lineTo(-.2, -.3); g.moveTo(.09, -.3); g.lineTo(.16, -.3); g.stroke(); },
  aviator: g => { for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * .17, -.2, .15, .16, 0, 0, TAU); g.fillStyle = 'rgba(60,80,110,.55)'; g.fill(); g.lineWidth = .04; g.strokeStyle = '#ffc83a'; g.stroke(); } g.beginPath(); g.moveTo(-.04, -.28); g.lineTo(.04, -.28); g.stroke(); },
  g3d: g => { rrect(g, -.34, -.32, .3, .2, .03); fsk(g, '#ff4a4a'); rrect(g, .04, -.32, .3, .2, .03); fsk(g, '#33b8ff'); },
  goggles: (g, c) => { g.save(); g.lineWidth = .06; g.strokeStyle = shade(c, -.3); g.beginPath(); g.moveTo(-.46, -.22); g.lineTo(-.3, -.22); g.moveTo(.3, -.22); g.lineTo(.46, -.22); g.stroke(); g.restore(); for (const sd of [-1, 1]) { circ(g, sd * .17, -.22, .15); g.fillStyle = 'rgba(180,225,255,.55)'; g.fill(); g.lineWidth = .05; g.strokeStyle = c; g.stroke(); } },
  monocle: g => { g.save(); g.lineWidth = .035; g.strokeStyle = '#ffc83a'; circ(g, .17, -.21, .14); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(.2, -.07); g.quadraticCurveTo(.3, .1, .22, .3); g.stroke(); g.restore(); },
  hero: (g, c) => { g.beginPath(); g.moveTo(-.4, -.3); g.quadraticCurveTo(0, -.42, .4, -.3); g.quadraticCurveTo(.4, -.1, .22, -.12); g.quadraticCurveTo(.08, -.2, 0, -.18); g.quadraticCurveTo(-.08, -.2, -.22, -.12); g.quadraticCurveTo(-.4, -.1, -.4, -.3); g.closePath(); g.ellipse(-.17, -.22, .1, .08, 0, 0, TAU); g.moveTo(.27, -.22); g.ellipse(.17, -.22, .1, .08, 0, 0, TAU); g.fillStyle = c; g.fill('evenodd'); g.stroke(); },
  stache: (g, c) => { for (const sd of [-1, 1]) { g.save(); g.translate(sd * .1, .02); g.rotate(sd * -.25); ell(g, 0, 0, .14, .05); fsk(g, c); g.restore(); } },
  beard: (g, c) => { g.beginPath(); g.moveTo(-.4, -.02); g.quadraticCurveTo(-.34, .08, -.14, .06); g.quadraticCurveTo(0, .0, .14, .06); g.quadraticCurveTo(.34, .08, .4, -.02); g.quadraticCurveTo(.4, .28, 0, .34); g.quadraticCurveTo(-.4, .28, -.4, -.02); g.closePath(); fsk(g, c); g.beginPath(); g.moveTo(-.1, .14); g.quadraticCurveTo(0, .2, .1, .14); g.stroke(); },
  clown: g => { circ(g, 0, -.05, .1); fsk(g, '#e0443f'); circ(g, -.03, -.08, .025); g.fillStyle = 'rgba(255,255,255,.8)'; g.fill(); },
  patch: g => { g.save(); g.lineWidth = .03; g.beginPath(); g.moveTo(-.42, -.36); g.lineTo(-.17, -.22); g.lineTo(.4, -.36); g.stroke(); g.restore(); circ(g, -.17, -.22, .14); fsk(g, '#1b1b22'); },
  heartg: (g, c) => { for (const sd of [-1, 1]) { heart(g, sd * .17, -.2, .17); fsk(g, c); } g.beginPath(); g.moveTo(-.04, -.25); g.lineTo(.04, -.25); g.stroke(); },
  starg: (g, c) => { for (const sd of [-1, 1]) { star(g, sd * .17, -.21, .17, 0); fsk(g, c); } },
  blush: (g, c) => { g.save(); g.globalAlpha = .6; for (const sd of [-1, 1]) { ell(g, sd * .3, -.02, .09, .055); g.fillStyle = c; g.fill(); } g.restore(); },
  bandaid: g => { g.save(); g.translate(.27, .0); g.rotate(-.5); rrect(g, -.1, -.04, .2, .08, .03); fsk(g, '#ffd7b0'); g.fillStyle = '#e8b887'; g.fillRect(-.03, -.04, .06, .08); g.restore(); },
  freckles: g => { g.fillStyle = '#9a5a3a'; for (const [x, y] of [[-.3, -.04], [-.24, .0], [-.33, .03], [.3, -.04], [.24, 0], [.33, .03]]) { circ(g, x, y, .015); g.fill(); } },
  vamp: g => { g.fillStyle = '#fff'; for (const sd of [-1, 1]) { poly(g, [sd * .09, .1, sd * .03, .1, sd * .06, .21]); g.fill(); g.stroke(); } },
  party: (g, c) => { g.beginPath(); g.moveTo(-.42, -.3); g.quadraticCurveTo(0, -.44, .42, -.3); g.quadraticCurveTo(.4, -.1, .2, -.1); g.quadraticCurveTo(.08, -.18, 0, -.16); g.quadraticCurveTo(-.08, -.18, -.2, -.1); g.quadraticCurveTo(-.4, -.1, -.42, -.3); g.closePath(); g.ellipse(-.17, -.22, .1, .08, 0, 0, TAU); g.moveTo(.27, -.22); g.ellipse(.17, -.22, .1, .08, 0, 0, TAU); g.fillStyle = c; g.fill('evenodd'); g.stroke(); g.fillStyle = '#fff'; for (const [x, y] of [[-.34, -.3], [.34, -.3], [0, -.3]]) { star(g, x, y, .04, 0); g.fill(); } }
};
const NECK = {
  scarf: (g, c) => { scarfPath(g); fsk(g, c); poly(g, [.14, .31, .28, .56, .13, .5, .05, .38]); fsk(g, shade(c, -.1)); },
  striped: (g, c) => { scarfPath(g); fsk(g, c); g.save(); scarfPath(g); g.clip(); g.strokeStyle = '#fff'; g.lineWidth = .05; for (let i = -4; i < 5; i++) { g.beginPath(); g.moveTo(i * .1 - .06, .1); g.lineTo(i * .1 + .06, .46); g.stroke(); } g.restore(); scarfPath(g); g.stroke(); poly(g, [.14, .31, .28, .56, .13, .5, .05, .38]); fsk(g, '#fff'); },
  tie: (g, c) => { poly(g, [-.2, .15, -.02, .24, -.16, .32]); fsk(g, '#fff'); poly(g, [.2, .15, .02, .24, .16, .32]); fsk(g, '#fff'); poly(g, [-.05, .24, .05, .24, .04, .3, -.04, .3]); fsk(g, c); poly(g, [-.04, .3, .04, .3, .09, .52, 0, .58, -.09, .52]); fsk(g, c); },
  bowtie: (g, c) => { poly(g, [0, .25, -.19, .14, -.19, .36]); fsk(g, c); poly(g, [0, .25, .19, .14, .19, .36]); fsk(g, c); circ(g, 0, .25, .05); fsk(g, shade(c, -.25)); },
  pearls: g => { for (let i = -5; i <= 5; i++) { circ(g, i * .055, .19 + i * i * .0045, .04); fsk(g, '#fffaf0'); } },
  medal: (g, c) => { poly(g, [-.1, .14, -.02, .14, .06, .38, -.02, .38]); fsk(g, '#e0443f'); poly(g, [.1, .14, .02, .14, -.06, .38, .02, .38]); fsk(g, '#3f7be0'); circ(g, 0, .44, .09); fsk(g, c); star(g, 0, .44, .05, 0); g.fillStyle = shade(c, -.3); g.fill(); },
  chain: g => { g.save(); g.lineWidth = .05; g.strokeStyle = '#8a5a00'; g.beginPath(); g.moveTo(-.28, .15); g.quadraticCurveTo(0, .5, .28, .15); g.stroke(); g.lineWidth = .035; g.strokeStyle = '#ffc83a'; g.beginPath(); g.moveTo(-.28, .15); g.quadraticCurveTo(0, .5, .28, .15); g.stroke(); g.restore(); circ(g, 0, .39, .075); fsk(g, '#ffc83a'); g.beginPath(); g.moveTo(-.02, .37); g.lineTo(.02, .37); g.moveTo(-.02, .41); g.lineTo(.02, .41); g.stroke(); },
  lei: g => { for (let i = -5; i <= 5; i++) { circ(g, i * .055, .2 + i * i * .006, .05); fsk(g, i % 2 ? '#ff7eb6' : '#ff9f43'); circ(g, i * .055, .2 + i * i * .006, .015); g.fillStyle = '#ffd23f'; g.fill(); } },
  bell: (g, c) => { rrect(g, -.28, .16, .56, .07, .035); fsk(g, c); circ(g, 0, .3, .07); fsk(g, '#ffc83a'); g.beginPath(); g.moveTo(-.04, .31); g.lineTo(.04, .31); g.stroke(); },
  bib: g => { poly(g, [-.24, .17, .24, .17, .2, .44, 0, .52, -.2, .44]); fsk(g, '#fff'); g.fillStyle = '#e0443f'; circ(g, 0, .36, .05); g.fill(); },
  ribbon: (g, c) => { poly(g, [-.26, .2, -.1, .17, .27, .56, .13, .62]); fsk(g, c); star(g, .02, .4, .06, .2); g.fillStyle = '#ffd23f'; g.fill(); },
  collar: g => { ell(g, 0, .21, .35, .1); fsk(g, '#fff'); g.fillStyle = '#222'; for (const x of [-.24, -.1, .08, .22]) { ell(g, x, .25, .018, .035); g.fill(); } circ(g, 0, .3, .04); fsk(g, '#ffc83a'); }
};
const BODY = {
  tee: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); }); sleeves(g, c); g.beginPath(); g.arc(0, .2, .1, 0, PI); g.stroke(); },
  stripe: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#fff'; for (let y = .26; y < .64; y += .12) g.fillRect(-.3, y, .6, .05); }); sleeves(g, c); },
  hoodie: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); }); sleeves(g, c); ell(g, 0, .22, .27, .06); fsk(g, shade(c, -.2)); rrect(g, -.14, .45, .28, .1, .04); fsk(g, shade(c, -.15)); g.beginPath(); g.moveTo(-.05, .24); g.lineTo(-.06, .38); g.moveTo(.05, .24); g.lineTo(.06, .38); g.stroke(); },
  vest: (g, c) => { inTorso(g, () => { g.fillStyle = '#fff'; g.fillRect(-.3, .15, .6, .5); }); sleeves(g, '#fff'); poly(g, [-.27, .22, -.03, .2, -.03, .62, -.27, .58]); fsk(g, c); poly(g, [.27, .22, .03, .2, .03, .62, .27, .58]); fsk(g, c); g.fillStyle = '#ffc83a'; for (const y of [.34, .46]) { circ(g, -.1, y, .02); g.fill(); } },
  suit: (g, c) => { inTorso(g, () => { g.fillStyle = '#fff'; g.fillRect(-.3, .15, .6, .5); }); sleeves(g, c); poly(g, [-.27, .2, -.03, .22, -.12, .62, -.27, .58]); fsk(g, c); poly(g, [.27, .2, .03, .22, .12, .62, .27, .58]); fsk(g, c); poly(g, [-.03, .24, .03, .24, .05, .5, 0, .55, -.05, .5]); fsk(g, '#e0443f'); },
  overalls: (g, c) => { inTorso(g, () => { g.fillStyle = '#fff'; g.fillRect(-.3, .15, .6, .5); }); sleeves(g, '#fff'); inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .43, .6, .3); }); rrect(g, -.15, .3, .3, .26, .04); fsk(g, c); g.beginPath(); g.moveTo(-.14, .31); g.lineTo(-.2, .2); g.moveTo(.14, .31); g.lineTo(.2, .2); g.lineWidth = .05; g.strokeStyle = shade(c, -.4); g.stroke(); circ(g, 0, .46, .025); g.fillStyle = '#ffc83a'; g.fill(); },
  tutu: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .3); }); for (let i = 0; i < 3; i++) { ell(g, 0, .55 + i * .02, .4 - i * .05, .09); fsk(g, i % 2 ? shade(c, .2) : c); } },
  hawaii: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#fff'; for (const [x, y] of [[-.15, .32], [.1, .42], [-.05, .55], [.18, .28]]) { circ(g, x, y, .04); g.fill(); } g.fillStyle = '#ff7eb6'; for (const [x, y] of [[-.18, .5], [.05, .3], [.17, .54]]) { circ(g, x, y, .035); g.fill(); } }); sleeves(g, c); poly(g, [-.1, .2, 0, .32, -.04, .2]); fsk(g, '#fff'); poly(g, [.1, .2, 0, .32, .04, .2]); fsk(g, '#fff'); },
  lab: g => { inTorso(g, () => { g.fillStyle = '#fff'; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#e8f1fa'; g.fillRect(-.02, .2, .04, .5); }); sleeves(g, '#fff'); poly(g, [-.12, .2, 0, .34, -.04, .2]); fsk(g, '#e8f1fa'); poly(g, [.12, .2, 0, .34, .04, .2]); fsk(g, '#e8f1fa'); rrect(g, .08, .44, .1, .08, .01); fsk(g, '#fff'); g.beginPath(); g.moveTo(.12, .44); g.lineTo(.12, .4); g.strokeStyle = '#3f7be0'; g.stroke(); },
  armor: (g, c) => { inTorso(g, () => { const gr = g.createLinearGradient(-.27, 0, .27, 0); gr.addColorStop(0, shade(c, .35)); gr.addColorStop(.5, c); gr.addColorStop(1, shade(c, -.25)); g.fillStyle = gr; g.fillRect(-.3, .15, .6, .5); g.strokeStyle = shade(c, -.4); g.lineWidth = .02; g.beginPath(); g.moveTo(0, .2); g.lineTo(0, .62); g.moveTo(-.25, .42); g.lineTo(.25, .42); g.stroke(); }); sleeves(g, shade(c, -.1)); for (const sd of [-1, 1]) { circ(g, sd * .28, .22, .1); fsk(g, c); } },
  jersey: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); g.fillStyle = shade(c, .5); g.fillRect(-.3, .36, .6, .07); }); sleeves(g, c); poly(g, [-.1, .19, 0, .3, .1, .19]); fsk(g, shade(c, .5)); },
  santa: g => { inTorso(g, () => { g.fillStyle = '#e0443f'; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#fff'; g.fillRect(-.04, .15, .08, .5); g.fillStyle = '#222'; g.fillRect(-.3, .46, .6, .07); }); sleeves(g, '#e0443f'); rrect(g, -.05, .44, .1, .11, .015); fsk(g, '#ffc83a'); },
  hero: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#ffd23f'; g.fillRect(-.3, .5, .6, .06); }); sleeves(g, c); circ(g, 0, .36, .09); fsk(g, '#ffd23f'); star(g, 0, .36, .06, 0); g.fillStyle = c; g.fill(); },
  rain: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-.3, .5, .6, .04); }); sleeves(g, c); ell(g, 0, .2, .26, .06); fsk(g, shade(c, -.15)); g.fillStyle = shade(c, -.4); for (const y of [.3, .4]) { circ(g, 0, y, .02); g.fill(); } },
  sweater: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#fff'; g.fillRect(-.3, .37, .6, .06); for (let x = -.24; x < .26; x += .12) { star(g, x, .5, .035, 0); g.fill(); } }); sleeves(g, c); ell(g, 0, .21, .17, .05); fsk(g, shade(c, -.2)); },
  skeleton: g => { inTorso(g, () => { g.fillStyle = '#25252d'; g.fillRect(-.3, .15, .6, .5); g.strokeStyle = '#fff'; g.lineWidth = .04; g.beginPath(); g.moveTo(0, .2); g.lineTo(0, .62); for (const y of [.3, .42, .54]) { g.moveTo(-.2, y); g.quadraticCurveTo(0, y - .05, .2, y); } g.stroke(); }); sleeves(g, '#25252d'); },
  dress: (g, c) => { inTorso(g, () => { g.fillStyle = c; g.fillRect(-.3, .15, .6, .5); }); poly(g, [-.24, .5, .24, .5, .4, .66, -.4, .66]); fsk(g, c); rrect(g, -.26, .44, .52, .06, .02); fsk(g, shade(c, .35)); },
  ninja: g => { inTorso(g, () => { g.fillStyle = '#25252d'; g.fillRect(-.3, .15, .6, .5); g.fillStyle = '#e0443f'; g.fillRect(-.3, .46, .6, .07); }); sleeves(g, '#25252d'); }
};
const BACK = {
  cape: (g, c, t) => { const w = Math.sin(t * 4) * .03; g.beginPath(); g.moveTo(-.3, .16); g.lineTo(.3, .16); g.quadraticCurveTo(.56 + w, .5, .46 + w, .74); g.quadraticCurveTo(.2, .68 + w, 0, .76); g.quadraticCurveTo(-.2, .68 - w, -.46 - w, .74); g.quadraticCurveTo(-.56 - w, .5, -.3, .16); g.closePath(); fsk(g, c); },
  angel: (g, c, t) => { const f = Math.sin(t * 5) * .12; for (const sd of [-1, 1]) { g.save(); g.translate(sd * .22, .26); g.rotate(sd * f); g.scale(sd, 1); for (const [x, y, rx, ry, r] of [[-.3, .1, .28, .09, -.5], [-.34, -.02, .26, .085, -.85], [-.34, -.16, .22, .08, -1.15]]) { ell(g, x, y, rx, ry, r); fsk(g, '#fff'); } g.restore(); } },
  bat: (g, c, t) => { const f = Math.sin(t * 6) * .1; for (const sd of [-1, 1]) { g.save(); g.translate(sd * .2, .26); g.rotate(sd * f); g.scale(sd, 1); poly(g, [-.05, -.04, -.5, -.36, -.62, -.22, -.52, -.1, -.6, .06, -.44, 0, -.34, .14, -.2, .04]); fsk(g, c); g.restore(); } },
  fairy: (g, c, t) => { const f = Math.sin(t * 8) * .1; for (const sd of [-1, 1]) { g.save(); g.translate(sd * .2, .28); g.rotate(sd * f); g.scale(sd, 1); g.globalAlpha = .75; ell(g, -.3, -.12, .3, .13, -.6); fsk(g, c); ell(g, -.22, .1, .2, .09, .5); fsk(g, shade(c, .25)); g.restore(); } },
  dragon: (g, c, t) => { const f = Math.sin(t * 4) * .09; for (const sd of [-1, 1]) { g.save(); g.translate(sd * .2, .26); g.rotate(sd * f); g.scale(sd, 1); poly(g, [-.05, -.02, -.4, -.5, -.52, -.24, -.64, -.38, -.62, -.04, -.74, .06, -.5, .08, -.4, .24, -.2, .08]); fsk(g, c); g.beginPath(); g.moveTo(-.05, -.02); g.lineTo(-.6, -.04); g.moveTo(-.05, -.02); g.lineTo(-.52, -.24); g.moveTo(-.05, -.02); g.lineTo(-.4, .22); g.stroke(); g.restore(); } },
  pack: (g, c) => { rrect(g, -.32, .2, .64, .44, .1); fsk(g, c); rrect(g, -.15, .42, .3, .16, .04); fsk(g, shade(c, -.2)); rrect(g, -.1, .12, .2, .1, .05); fsk(g, shade(c, -.3)); },
  jet: (g, c, t) => { for (const sd of [-1, 1]) { rrect(g, sd * .36 - .09, .18, .18, .44, .08); fsk(g, c); rrect(g, sd * .36 - .09, .26, .18, .05, 0); fsk(g, '#e0443f'); const fl = .1 + Math.sin(t * 25 + sd) * .04; poly(g, [sd * .36 - .07, .62, sd * .36 + .07, .62, sd * .36, .62 + fl + .08]); fsk(g, '#ff9f43'); poly(g, [sd * .36 - .035, .62, sd * .36 + .035, .62, sd * .36, .62 + fl]); fsk(g, '#ffe27a'); } },
  balloon: (g, c, t) => { const sw = Math.sin(t * 2) * .05; g.beginPath(); g.moveTo(.3, .32); g.quadraticCurveTo(.5 + sw, -.2, .56 + sw, -.62); g.stroke(); ell(g, .56 + sw, -.8, .14, .18); fsk(g, c); poly(g, [.56 + sw, -.62, .52 + sw, -.56, .6 + sw, -.56]); fsk(g, shade(c, -.2)); g.fillStyle = 'rgba(255,255,255,.55)'; ell(g, .5 + sw, -.86, .035, .06, .4); g.fill(); },
  umbrella: (g, c) => { g.save(); g.translate(.3, -.38); g.rotate(.32); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, .75); g.quadraticCurveTo(0, .84, .07, .82); g.lineWidth = .04; g.stroke(); g.lineWidth = .035; g.beginPath(); g.arc(0, 0, .36, PI, TAU); for (let i = 0; i < 3; i++) g.arc(.24 - i * .24, 0, .12, 0, PI); g.closePath(); fsk(g, c); g.beginPath(); g.moveTo(0, -.36); g.lineTo(0, 0); g.stroke(); g.restore(); },
  surf: (g, c) => { g.save(); g.translate(-.42, .12); g.rotate(.3); ell(g, 0, 0, .12, .56); fsk(g, c); g.fillStyle = '#fff'; g.fillRect(-.02, -.5, .04, 1); g.restore(); }
};
const ITEM_DRAW = { head: HEAD, face: FACE, neck: NECK, body: BODY, back: BACK };
function drawItem(g, it, t, ph) {
  const fn = ITEM_DRAW[it.slot][it.key]; if (!fn) return;
  g.save(); g.lineWidth = .035; g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = it.color ? shade(it.color, -.5) : '#3a2417';
  try { fn(g, it.color, t, ph); } catch (e) { /* ignora item quebrado */ }
  g.restore();
}

// ---------- olhos e boca ----------
function drawEye(g, style, x, y, r, t, ph, side, ink) {
  g.save(); g.translate(x, y); g.lineWidth = .04; g.strokeStyle = ink;
  if (style === 'heart') { heart(g, 0, 0, r * 1.5 * (1 + Math.sin(t * 8 + ph) * .08)); fsk(g, '#ff4d7a'); g.restore(); return; }
  if (style === 'robot') { rrect(g, -r, -r * .8, r * 2, r * 1.6, r * .3); fsk(g, '#1b2a38'); g.strokeStyle = (Math.sin(t * 1.3 + ph) > .96) ? '#1b2a38' : '#4af0ff'; g.lineWidth = .045; g.beginPath(); g.moveTo(-r * .6, 0); g.lineTo(r * .6, 0); g.stroke(); g.restore(); return; }
  if (style === 'small') { circ(g, 0, 0, r * .55); fsk(g, '#1a1410'); circ(g, -r * .15, -r * .15, r * .15); g.fillStyle = '#fff'; g.fill(); g.restore(); return; }
  circ(g, 0, 0, r); fsk(g, '#fff');
  if (style === 'spiral') { g.rotate(t * (side ? -6 : 6) + ph); g.lineWidth = .03; g.beginPath(); for (let a = 0; a < 12.5; a += .3) { const rr = r * .82 * a / 12.5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); }
  else if (style === 'x') { g.lineWidth = .045; g.beginPath(); g.moveTo(-r * .6, -r * .6); g.lineTo(r * .6, r * .6); g.moveTo(r * .6, -r * .6); g.lineTo(-r * .6, r * .6); g.stroke(); }
  else if (style === 'star') { star(g, 0, 0, r * .85, t * 2 * (side ? -1 : 1)); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = .025; g.stroke(); }
  else if (style === 'sparkle') { circ(g, 0, r * .05, r * .68); g.fillStyle = '#3a2a6a'; g.fill(); circ(g, -r * .22, -r * .22, r * .22); g.fillStyle = '#fff'; g.fill(); circ(g, r * .2, r * .22, r * .1); g.fill(); }
  else { const px = Math.sin(t * 2 + ph + side) * r * .3, py = Math.cos(t * 2.4 + ph) * r * .25; circ(g, px, py, r * .42); g.fillStyle = '#1a1410'; g.fill(); if (style === 'angry') { g.lineWidth = .05; g.beginPath(); g.moveTo(-r * 1.1 * (side ? -1 : 1), -r * 1.35); g.lineTo(r * 1.1 * (side ? -1 : 1), -r * .6); g.stroke(); } }
  g.restore();
}
function drawMouth(g, style, ink, act, t, ph) {
  g.save(); g.lineWidth = .04; g.strokeStyle = ink; g.lineCap = 'round';
  if (style === 'zig') { g.beginPath(); g.moveTo(-.14, .13); for (let i = 1; i <= 6; i++) g.lineTo(-.14 + i * .047, .13 + (i % 2 ? .04 : -.01)); g.stroke(); }
  else if (style === 'grill') { rrect(g, -.14, .1, .28, .09, .02); fsk(g, '#2c3a48'); g.strokeStyle = '#b8c4d0'; g.lineWidth = .02; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(i * .05, .1); g.lineTo(i * .05, .19); } g.stroke(); }
  else if (style === 'smile') { g.beginPath(); g.moveTo(-.13, .1); g.quadraticCurveTo(0, .22, .13, .1); g.stroke(); }
  else if (style === 'tusks') { g.beginPath(); g.moveTo(-.13, .12); g.quadraticCurveTo(0, .17, .13, .12); g.stroke(); for (const sd of [-1, 1]) { poly(g, [sd * .12, .12, sd * .06, .12, sd * .14, -.04]); fsk(g, '#fff6df'); } }
  else { g.beginPath(); g.moveTo(-.12, .11); g.quadraticCurveTo(0, .19, .14, .09); g.stroke(); const tl = .05 + (act ? .05 : .015) * (1 + Math.sin(t * 9 + ph)); rrect(g, .01, .13, .1, tl + .04, .05); fsk(g, '#e5385f'); }
  g.restore();
}

// ---------- o porco inteiro ----------
function drawPig(g, x, y, s, look, t, o) {
  o = o || {};
  const ch = CHAR_BY_ID[look.ch] || CHARS[0], eq = look.o || {}, ph = o.phase || 0, act = !!o.active;
  const item = slot => (eq[slot] && ITEM_BY_ID[eq[slot]]) || null;
  const iHead = item('head'), iFace = item('face'), iNeck = item('neck'), iBody = item('body'), iBack = item('back');
  const bob = act ? Math.abs(Math.sin(t * 6 + ph)) * .09 : Math.sin(t * 3 + ph) * .014;
  const tilt = Math.sin(t * 3 + ph) * (act ? .13 : .05);
  ARM.a = act ? Math.sin(t * 9 + ph) * .5 : Math.sin(t * 2.5 + ph) * .1;
  const ink = ch.ink;
  g.save(); g.translate(x, y); if (o.rot) g.rotate(-o.rot); g.scale(s, s); g.translate(0, -.07);
  // sombra e anel do jogador
  g.fillStyle = 'rgba(40,20,10,.22)'; ell(g, 0, .64, .34 - bob * .8, .075); g.fill();
  if (o.ring) { g.lineWidth = .055; g.strokeStyle = o.ring; ell(g, 0, .64, .4, .1); g.stroke(); }
  g.translate(0, -bob); g.translate(0, .6); g.rotate(tilt); g.translate(0, -.6);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = .04; g.strokeStyle = ink;
  if (iBack) drawItem(g, iBack, t, ph);
  // rabinho
  g.lineWidth = .045; g.beginPath(); g.moveTo(.22, .5); g.quadraticCurveTo(.4, .46, .34, .58); g.quadraticCurveTo(.3, .64, .4, .62); g.stroke(); g.lineWidth = .04;
  // pés
  for (const sd of [-1, 1]) { ell(g, sd * .13, .62, .1, .06); fsk(g, ch.snout); }
  // corpo e braços
  torso(g); fsk(g, ch.body);
  if (ch.x.includes('stripes')) { g.save(); torso(g); g.clip(); g.fillStyle = '#e0443f'; for (const y0 of [.3, .42, .54]) { g.beginPath(); g.moveTo(-.3, y0); g.quadraticCurveTo(-.15, y0 - .05, 0, y0); g.quadraticCurveTo(.15, y0 + .05, .3, y0); g.lineTo(.3, y0 + .05); g.quadraticCurveTo(.15, y0 + .1, 0, y0 + .05); g.quadraticCurveTo(-.15, y0, -.3, y0 + .05); g.closePath(); g.fill(); } g.restore(); torso(g); g.stroke(); }
  if (ch.x.includes('mud')) { g.save(); torso(g); g.clip(); g.fillStyle = 'rgba(110,70,40,.55)'; for (const [mx, my, mr] of [[-.15, .5, .09], [.12, .55, .08], [.2, .35, .06]]) { circ(g, mx, my, mr); g.fill(); } g.restore(); }
  if (!iBody) { arm(g, -1, ch.body); arm(g, 1, ch.body); }
  if (iBody) drawItem(g, iBody, t, ph);
  // orelhas
  for (const sd of [-1, 1]) { g.save(); g.translate(sd * .3, -.4); g.rotate(sd * (.6 + Math.sin(t * 6 + ph + sd) * (act ? .35 : .08))); g.beginPath(); g.moveTo(-.14, 0); g.quadraticCurveTo(0, -.36, .14, 0); g.closePath(); fsk(g, ch.ear); g.restore(); }
  // cabeça
  ell(g, 0, -.14, .44, .37); fsk(g, ch.body);
  g.save(); ell(g, 0, -.14, .44, .37); g.clip();
  if (ch.x.includes('stripes')) { g.fillStyle = '#e0443f'; for (const y0 of [-.46, -.37]) { g.beginPath(); g.moveTo(-.5, y0); g.quadraticCurveTo(-.25, y0 - .06, 0, y0); g.quadraticCurveTo(.25, y0 + .06, .5, y0); g.lineTo(.5, y0 + .04); g.quadraticCurveTo(.25, y0 + .1, 0, y0 + .04); g.quadraticCurveTo(-.25, y0 - .02, -.5, y0 + .04); g.closePath(); g.fill(); } }
  if (ch.x.includes('mud')) { g.fillStyle = 'rgba(110,70,40,.6)'; for (const [mx, my, mr] of [[-.3, -.34, .1], [.32, -.18, .08], [.06, -.44, .08], [-.38, -.05, .06]]) { circ(g, mx, my, mr); g.fill(); } }
  if (ch.x.includes('cheeks')) { g.fillStyle = 'rgba(255,120,150,.55)'; for (const sd of [-1, 1]) { circ(g, sd * .3, -.02, .09); g.fill(); } }
  if (ch.x.includes('rivets')) { g.fillStyle = '#5b6b7c'; for (const [rx, ry] of [[-.34, -.34], [.34, -.34], [-.36, .1], [.36, .1]]) { circ(g, rx, ry, .025); g.fill(); } }
  if (ch.x.includes('stitches')) { g.strokeStyle = '#2a3a1a'; g.lineWidth = .03; g.beginPath(); g.moveTo(-.2, -.4); g.lineTo(.2, -.3); for (let i = 0; i < 5; i++) { const px = -.16 + i * .08, py = -.39 + i * .02; g.moveTo(px, py - .04); g.lineTo(px, py + .05); } g.stroke(); }
  g.restore(); ell(g, 0, -.14, .44, .37); g.stroke();
  if (ch.x.includes('bristle')) { g.fillStyle = ch.ear; for (let i = 0; i < 9; i++) { const a = PI * 1.05 + i * (PI * .9 / 8), px = Math.cos(a) * .42, py = -.14 + Math.sin(a) * .35; poly(g, [px - .035, py + .01, px + .035, py + .01, Math.cos(a) * .52, -.14 + Math.sin(a) * .44]); g.fill(); g.stroke(); } }
  if (ch.x.includes('bolts')) for (const sd of [-1, 1]) { rrect(g, sd * .44 - .05, -.2, .1, .12, .02); fsk(g, '#9aa5b1'); }
  if (!iHead) {
    if (ch.x.includes('antenna')) { g.beginPath(); g.moveTo(0, -.5); g.lineTo(0, -.7); g.stroke(); circ(g, 0, -.73, .05 + Math.sin(t * 5) * .008); fsk(g, ch.id === 'robo' ? '#ff5a5a' : '#7dff7a'); }
    if (ch.x.includes('horn')) { poly(g, [-.07, -.48, .07, -.48, 0, -.86]); fsk(g, '#ffd86b'); g.beginPath(); g.moveTo(-.05, -.56); g.lineTo(.05, -.6); g.moveTo(-.04, -.66); g.lineTo(.04, -.7); g.stroke(); }
    if (ch.x.includes('kcrown')) { poly(g, [-.2, -.46, -.22, -.68, -.1, -.58, 0, -.74, .1, -.58, .22, -.68, .2, -.46]); fsk(g, '#e0443f'); circ(g, 0, -.7, .03); fsk(g, '#fff'); }
  }
  // cachecol padrão ou item de pescoço
  const seatColor = o.ring || '#e0443f';
  if (iNeck) drawItem(g, iNeck, t, ph); else { g.save(); g.lineWidth = .04; g.strokeStyle = shade(seatColor, -.5); scarfPath(g); fsk(g, seatColor); poly(g, [.14, .31, .28, .56 + Math.sin(t * 4 + ph) * .02, .13, .5, .05, .38]); fsk(g, shade(seatColor, -.1)); g.restore(); }
  // olhos, focinho e boca
  const big = ch.eyes === 'robot' ? .11 : .13, sm = ch.eyes === 'robot' ? .11 : .1;
  drawEye(g, ch.eyes, -.17, -.24, big, t, ph, 0, ink); drawEye(g, ch.eyes, .17, -.21, sm, t, ph, 1, ink);
  g.lineWidth = .04; g.strokeStyle = ink; ell(g, 0, -.03, .17, .115); fsk(g, ch.snout);
  g.fillStyle = ink; for (const sd of [-1, 1]) { ell(g, sd * .06, -.03, .02, .035); g.fill(); }
  drawMouth(g, ch.mouth, ink, act, t, ph);
  if (ch.x.includes('sparkle')) { g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.7 + ph, k = (Math.sin(t * 4 + i * 2) + 1) / 2; star(g, Math.cos(a) * .5, -.1 + Math.sin(a * 1.3) * .45, .03 + k * .04, a); g.fill(); } }
  if (iFace) drawItem(g, iFace, t, ph);
  if (iHead) drawItem(g, iHead, t, ph);
  g.restore();
}
