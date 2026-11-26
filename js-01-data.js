// ---------- dados do jogo ----------
const N = 9, DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const SEATS = [
  { name: 'Azul', color: '#3f7be0' }, { name: 'Vermelho', color: '#e0443f' },
  { name: 'Verde', color: '#2fa84f' }, { name: 'Laranja', color: '#f19a1c' }
];
const START = { 2: [[8, 4], [0, 4]], 3: [[8, 4], [4, 0], [0, 4]], 4: [[8, 4], [4, 0], [0, 4], [4, 8]] };
const VIEWQ = { '8,4': 0, '4,0': 3, '0,4': 2, '4,8': 1 }; // quartos de volta para o porco ficar embaixo
const FENCES = { 2: 10, 3: 7, 4: 5 };
const MODE_OF = n => (n === 2 ? 'race' : 'cup');

const RANKS = [[0, 'Leitão'], [100, 'Porquinho'], [300, 'Suíno Sábio'], [600, 'Javali Mestre'], [1000, 'Rei da Lama'], [2000, 'Lenda do Chiqueiro']];
function rankOf(tr) { let i = 0; RANKS.forEach((r, k) => { if (tr >= r[0]) i = k; }); const cur = RANKS[i], nx = RANKS[i + 1]; return { name: cur[1], idx: i, next: nx ? nx[1] : null, from: cur[0], to: nx ? nx[0] : cur[0], pct: nx ? (tr - cur[0]) / (nx[0] - cur[0]) : 1 }; }

const BOT_NAMES = ['Bacon-robô', 'Linguiça', 'Presunto', 'Costelinha', 'Pernil', 'Toucinho', 'Salsicha', 'Mortadela', 'Javaporco', 'Torresminho'];

const EMOJIS = ['😂', '😡', '😭', '😎', '🐷', '👏', '🔥', '😱', '🤯', '❤️', '🥓', '🏆'];
const PHRASES = ['Oinc oinc!', 'Boa jogada!', 'Calma, porco!', 'Vou te pegar!', 'Quem apagou a luz?', 'Revanche!', 'Foi sem querer!', 'Tá difícil, hein?', 'Corre que eu tô na frente!', 'GG!', 'Minha orelha ficou tonta!', 'Cerca? Eu como cerca!'];
const BOT_REPLY = [1, 3, 4, 7, 9, 10]; // frases que os robôs usam
const QUIPS = ['Oinc oinc oinc!', 'Eu sou um foguete rosa!', 'A lama me chama!', 'Quem apagou a luz?', 'Bacon voador!', 'Minha orelha ficou tonta!', 'Hi hi hi OINC!', 'Cerca? Eu como cerca!', 'Estou girando por dentro!'];

// ---------- mapas ----------
const MAPS = [
  {
    id: 'farm', name: 'Fazenda ao Pôr do Sol', emoji: '🌅', weather: 'fireflies', music: 'farm',
    desc: 'O clássico: céu alaranjado, celeiro vermelho e grama fofinha. Vagalumes aparecem no fim da tarde.',
    css: { skyTop: '#f39a78', skyLow: '#f9c99b', grass: '#93d150', grassDark: '#7fc043', wood: '#b8743a', woodDark: '#7e4a20', woodLight: '#c98443', paper: '#fff3dc', ink: '#4a2a14', onBg: '#4a2a14' },
    tile: ['#9ad75b', '#8acb4c'], goalTop: ['#b9d3f9', '#a6c6f5'], goalBot: ['#ffc6d2', '#ffb2c2'], deco: 'grass'
  },
  {
    id: 'sunny', name: 'Dia Ensolarado', emoji: '☀️', weather: 'pollen', music: 'sunny',
    desc: 'Céu azul, sol brilhante e nuvens fofas. A grama fica verde-limão e tem florzinhas pelo caminho.',
    css: { skyTop: '#59b8ff', skyLow: '#bfe6ff', grass: '#8ede4a', grassDark: '#6cc236', wood: '#d79a45', woodDark: '#8a5a22', woodLight: '#e8b365', paper: '#fffbe8', ink: '#4a2f14', onBg: '#3a2a10' },
    tile: ['#a4e85e', '#92dc4c'], goalTop: ['#bde0ff', '#a8d4fb'], goalBot: ['#ffd0dc', '#ffbccd'], deco: 'flowers'
  },
  {
    id: 'rain', name: 'Dia Chuvoso', emoji: '🌧️', weather: 'rain', music: 'rain',
    desc: 'Nuvens cinzentas, chuva fina e poças pelo gramado. De vez em quando cai um trovão!',
    css: { skyTop: '#6d7f93', skyLow: '#a9b9c8', grass: '#6ea957', grassDark: '#548a45', wood: '#7b6a58', woodDark: '#4a3d31', woodLight: '#93806b', paper: '#f4efe6', ink: '#33291f', onBg: '#22303c' },
    tile: ['#6fae5c', '#62a051'], goalTop: ['#a9c3e0', '#98b5d6'], goalBot: ['#e3b5c0', '#d9a3b0'], deco: 'puddles'
  },
  {
    id: 'xmas', name: 'Natal no Chiqueiro', emoji: '🎄', weather: 'snow', music: 'xmas',
    desc: 'Noite de neve, pinheiros com luzinhas e um boneco de neve. O tabuleiro vira um tapete branco.',
    css: { skyTop: '#1d3b5e', skyLow: '#5f8ab5', grass: '#e9f3fb', grassDark: '#c4dcef', wood: '#b8332f', woodDark: '#6b1715', woodLight: '#d9534e', paper: '#fff8ee', ink: '#40201a', onBg: '#1d3b5e' },
    tile: ['#f1f8ff', '#dcebf7'], goalTop: ['#bfe3ff', '#a5d4f6'], goalBot: ['#ffc4c4', '#ffadad'], deco: 'snow'
  },
  {
    id: 'halloween', name: 'Noite de Halloween', emoji: '🎃', weather: 'bats', music: 'halloween',
    desc: 'Lua laranja, casa assombrada e morcegos voando. As abóboras observam cada jogada.',
    css: { skyTop: '#1f1236', skyLow: '#7a3b7e', grass: '#46563a', grassDark: '#2f3b29', wood: '#6a4585', woodDark: '#321d47', woodLight: '#8660a6', paper: '#f7ead7', ink: '#2e1a3a', onBg: '#f7ead7' },
    tile: ['#566a46', '#4b5f3d'], goalTop: ['#8a63c4', '#7b55b5'], goalBot: ['#ffa24f', '#f28f36'], deco: 'spooky'
  }
];
const MAP_BY_ID = Object.fromEntries(MAPS.map(m => [m.id, m]));

// ---------- porcos ----------
const CHARS = [
  { id: 'torresmo', name: 'Torresmo', price: 0, body: '#ffb6c8', ear: '#ff9db5', snout: '#ff8aa6', ink: '#8a2f4a', eyes: 'spiral', mouth: 'tongue', x: [], pitch: 1, desc: 'O clássico pirado.' },
  { id: 'lama', name: 'Lama', price: 0, body: '#cfa97e', ear: '#b88a5e', snout: '#a8764a', ink: '#5b3a22', eyes: 'dots', mouth: 'smile', x: ['mud'], pitch: .8, desc: 'Nunca tomou banho. Nunca vai tomar.' },
  { id: 'bacon', name: 'Bacon', price: 150, body: '#ffb6c8', ear: '#ff9db5', snout: '#ff8aa6', ink: '#8a2f4a', eyes: 'angry', mouth: 'tongue', x: ['stripes'], pitch: 1.15, desc: 'Listrado e nervoso.' },
  { id: 'fofura', name: 'Fofura', price: 200, body: '#fff0f3', ear: '#ffd0dc', snout: '#ffb3c6', ink: '#b06a82', eyes: 'heart', mouth: 'smile', x: ['cheeks'], pitch: 1.4, desc: 'Apaixonada por tudo.' },
  { id: 'ze', name: 'Javali Zé', price: 250, body: '#8b6b55', ear: '#6e5242', snout: '#5c4235', ink: '#2e1f17', eyes: 'small', mouth: 'tusks', x: ['bristle'], pitch: .6, desc: 'Chegou pela mata, com presas.' },
  { id: 'zumbi', name: 'Zumbi', price: 350, body: '#9ccf7c', ear: '#7fb862', snout: '#6aa04e', ink: '#2f4a22', eyes: 'x', mouth: 'zig', x: ['stitches', 'bolts'], pitch: .7, desc: 'Voltou do chiqueiro de lá.' },
  { id: 'astro', name: 'Astro', price: 400, body: '#b9a8ff', ear: '#9d8af0', snout: '#8672e0', ink: '#3d2f8a', eyes: 'star', mouth: 'smile', x: ['antenna'], pitch: 1.25, desc: 'Veio de outro planeta.' },
  { id: 'unicornio', name: 'Unicórnio', price: 600, body: '#ffeafc', ear: '#ffc4ee', snout: '#ffa6e0', ink: '#a0508f', eyes: 'sparkle', mouth: 'smile', x: ['horn'], pitch: 1.5, desc: 'Mágico e muito brilhante.' },
  { id: 'robo', name: 'Porcão Robô', price: 700, body: '#b8c4d0', ear: '#8e9cac', snout: '#6f7f90', ink: '#2c3a48', eyes: 'robot', mouth: 'grill', x: ['rivets', 'antenna'], pitch: .9, desc: 'Bip bip oinc.' },
  { id: 'rei', name: 'Rei Dourado', price: 1500, body: '#ffd84a', ear: '#f2b92a', snout: '#e69f10', ink: '#8a5a00', eyes: 'spiral', mouth: 'tongue', x: ['sparkle', 'kcrown'], pitch: .85, desc: 'Só os mais ricos têm.' }
];
CHARS.push(
  { id: 'dourado', name: 'Porco Louco Dourado', price: 99999, event: true, body: '#ffd54a', ear: '#f1b21c', snout: '#e89a10', ink: '#7a4b00', eyes: 'spiral', mouth: 'tongue', x: ['sparkle', 'kcrown'], pitch: 1.1, desc: 'Exclusivo do Desafio do Porco Louco!' },
  { id: 'papai', name: 'Papai Porcoel', price: 99999, event: true, body: '#ff6b5e', ear: '#d94a40', snout: '#ffb3a8', ink: '#6e1a14', eyes: 'heart', mouth: 'smile', x: ['sparkle', 'cheeks'], pitch: .7, desc: 'Exclusivo do Natal dos Porcos!' }
);
const CHAR_BY_ID = Object.fromEntries(CHARS.map(c => [c.id, c]));

// ---------- catálogo de roupas ----------
const COLORS = {
  red: ['Vermelho', 'Vermelha', '#e0443f'], blue: ['Azul', 'Azul', '#3f7be0'], green: ['Verde', 'Verde', '#3fae4a'], yellow: ['Amarelo', 'Amarela', '#ffd23f'],
  pink: ['Rosa', 'Rosa', '#ff7eb6'], purple: ['Roxo', 'Roxa', '#8a54d6'], orange: ['Laranja', 'Laranja', '#f19a1c'], black: ['Preto', 'Preta', '#2c2c34'],
  white: ['Branco', 'Branca', '#f6f6f6'], brown: ['Marrom', 'Marrom', '#8a5a35'], gold: ['Dourado', 'Dourada', '#ffc83a'], silver: ['Prata', 'Prata', '#cfd6df'],
  teal: ['Turquesa', 'Turquesa', '#27b9b0'], gray: ['Cinza', 'Cinza', '#8a93a0']
};
const SLOTS = [
  { id: 'head', label: 'Chapéus', icon: '🎩' }, { id: 'face', label: 'Rosto', icon: '🕶️' }, { id: 'neck', label: 'Pescoço', icon: '🧣' },
  { id: 'body', label: 'Roupas', icon: '👕' }, { id: 'back', label: 'Costas', icon: '🦸' }
];
// [slot, chave, nome, preço, cores, gênero]  (gênero m/f só muda o nome da cor)
const DESIGNS = [
  ['head', 'cap', 'Boné', 60, 'red blue green yellow black', 'm'], ['head', 'beanie', 'Gorro de Lã', 80, 'red blue green pink purple', 'm'],
  ['head', 'party', 'Chapéu de Festa', 70, 'pink blue yellow green', 'm'], ['head', 'top', 'Cartola', 220, 'black purple red', 'f'],
  ['head', 'crown', 'Coroa', 600, 'gold silver pink', 'f'], ['head', 'pirate', 'Chapéu de Pirata', 250, 'black red', 'm'],
  ['head', 'helmet', 'Capacete', 130, 'yellow red blue', 'm'], ['head', 'santa', 'Gorro de Papai Noel', 180, '', 'm'],
  ['head', 'elf', 'Chapéu de Elfo', 160, '', 'm'], ['head', 'witch', 'Chapéu de Bruxa', 200, 'purple black', 'm'],
  ['head', 'wizard', 'Chapéu de Mago', 320, 'blue purple', 'm'], ['head', 'cowboy', 'Chapéu de Cowboy', 190, 'brown black white', 'm'],
  ['head', 'beret', 'Boina', 110, 'red black blue', 'f'], ['head', 'chef', 'Chapéu de Chef', 150, '', 'm'],
  ['head', 'viking', 'Capacete Viking', 380, '', 'm'], ['head', 'straw', 'Chapéu de Palha', 90, '', 'm'],
  ['head', 'tiara', 'Tiara', 300, 'gold pink', 'f'], ['head', 'halo', 'Auréola', 450, '', 'f'],
  ['head', 'horns', 'Chifres de Diabo', 260, '', 'm'], ['head', 'catears', 'Orelhas de Gato', 120, 'black white pink', 'f'],
  ['head', 'bow', 'Laço', 70, 'pink red blue yellow', 'm'], ['head', 'flower', 'Flor', 80, 'pink yellow red', 'f'],
  ['head', 'phones', 'Fones de Ouvido', 170, 'black pink blue', 'm'], ['head', 'alien', 'Antenas Alienígenas', 280, '', 'f'],
  ['head', 'astro', 'Capacete de Astronauta', 650, '', 'm'], ['head', 'pumpkin', 'Chapéu de Abóbora', 230, '', 'm'],
  ['head', 'turban', 'Turbante', 210, 'purple gold', 'm'], ['head', 'pizza', 'Fatia de Pizza', 140, '', 'f'],
  ['head', 'duck', 'Patinho de Borracha', 180, '', 'm'], ['head', 'ninja', 'Faixa Ninja', 100, 'red black', 'f'],

  ['face', 'round', 'Óculos Redondo', 70, 'black red blue gold', 'm'], ['face', 'shades', 'Óculos Escuros', 90, 'black red blue pink', 'm'],
  ['face', 'aviator', 'Óculos Aviador', 180, '', 'm'], ['face', 'g3d', 'Óculos 3D', 110, '', 'm'],
  ['face', 'goggles', 'Óculos de Natação', 120, 'blue pink', 'm'], ['face', 'monocle', 'Monóculo', 200, '', 'm'],
  ['face', 'hero', 'Máscara de Herói', 160, 'red blue green black', 'f'], ['face', 'stache', 'Bigode', 80, 'black brown orange', 'm'],
  ['face', 'beard', 'Barba', 140, 'black brown white', 'f'], ['face', 'clown', 'Nariz de Palhaço', 50, '', 'm'],
  ['face', 'patch', 'Tapa-olho', 90, '', 'm'], ['face', 'heartg', 'Óculos de Coração', 130, 'red pink', 'm'],
  ['face', 'starg', 'Óculos de Estrela', 130, 'yellow purple', 'm'], ['face', 'blush', 'Bochechas Coradas', 40, 'pink red', 'f'],
  ['face', 'bandaid', 'Curativo', 30, '', 'm'], ['face', 'freckles', 'Sardas', 50, '', 'f'],
  ['face', 'vamp', 'Dentes de Vampiro', 150, '', 'm'], ['face', 'party', 'Máscara de Festa', 230, 'gold purple', 'f'],

  ['neck', 'scarf', 'Cachecol', 50, 'red blue green yellow pink purple', 'm'], ['neck', 'striped', 'Cachecol Listrado', 90, 'red blue green', 'm'],
  ['neck', 'tie', 'Gravata', 80, 'red blue green black', 'f'], ['neck', 'bowtie', 'Gravata-Borboleta', 90, 'red blue black pink', 'f'],
  ['neck', 'pearls', 'Colar de Pérolas', 250, '', 'm'], ['neck', 'medal', 'Medalha', 200, 'gold silver', 'f'],
  ['neck', 'chain', 'Correntão', 400, '', 'm'], ['neck', 'lei', 'Colar Havaiano', 140, '', 'm'],
  ['neck', 'bell', 'Coleira de Sino', 100, 'red blue', 'f'], ['neck', 'bib', 'Babador', 60, '', 'm'],
  ['neck', 'ribbon', 'Fita de Campeão', 170, 'red blue', 'f'], ['neck', 'collar', 'Gola Real', 500, '', 'f'],

  ['body', 'tee', 'Camiseta', 70, 'red blue green yellow pink purple white black', 'f'], ['body', 'stripe', 'Camiseta Listrada', 100, 'red blue green', 'f'],
  ['body', 'hoodie', 'Moletom', 140, 'gray red blue green purple', 'm'], ['body', 'vest', 'Colete', 110, 'brown red blue', 'm'],
  ['body', 'suit', 'Terno', 300, 'black blue', 'm'], ['body', 'overalls', 'Macacão', 160, 'blue red green', 'm'],
  ['body', 'tutu', 'Tutu de Bailarina', 190, 'pink white purple', 'm'], ['body', 'hawaii', 'Camisa Havaiana', 150, 'orange blue', 'f'],
  ['body', 'lab', 'Jaleco', 180, '', 'm'], ['body', 'armor', 'Armadura', 520, 'silver gold', 'f'],
  ['body', 'jersey', 'Camisa de Futebol', 130, 'yellow blue red green', 'f'], ['body', 'santa', 'Roupa de Papai Noel', 280, '', 'f'],
  ['body', 'hero', 'Uniforme de Herói', 350, 'red blue green', 'm'], ['body', 'rain', 'Capa de Chuva', 120, 'yellow red blue', 'f'],
  ['body', 'sweater', 'Suéter de Natal', 170, 'red green', 'm'], ['body', 'skeleton', 'Fantasia de Esqueleto', 260, '', 'f'],
  ['body', 'dress', 'Vestido', 200, 'pink purple red', 'm'], ['body', 'ninja', 'Roupa Ninja', 240, '', 'f'],

  ['back', 'cape', 'Capa', 150, 'red blue purple green', 'f'], ['back', 'angel', 'Asas de Anjo', 400, '', 'f'],
  ['back', 'bat', 'Asas de Morcego', 300, 'black purple', 'f'], ['back', 'fairy', 'Asas de Fada', 350, 'pink teal', 'f'],
  ['back', 'dragon', 'Asas de Dragão', 550, 'green red', 'f'], ['back', 'pack', 'Mochila', 90, 'red blue green yellow', 'f'],
  ['back', 'jet', 'Mochila a Jato', 450, '', 'f'], ['back', 'balloon', 'Balão', 70, 'red blue yellow pink', 'm'],
  ['back', 'umbrella', 'Guarda-Chuva', 100, 'red blue yellow', 'm'], ['back', 'surf', 'Prancha de Surfe', 180, 'blue pink yellow', 'f']
];
const ITEMS = [];
DESIGNS.forEach(([slot, key, name, price, cols, g]) => {
  const list = cols ? cols.split(' ') : [''];
  list.forEach(cn => {
    const c = cn ? COLORS[cn] : null;
    ITEMS.push({ id: `${slot}.${key}.${cn || 'x'}`, slot, key, color: c ? c[2] : null, cname: cn, name: c ? `${name} ${g === 'f' ? c[1] : c[0]}` : name, base: name, price });
  });
});
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
function rarityOf(price) { return price < 100 ? ['Comum', '#8aa0b0'] : price < 250 ? ['Incomum', '#3fae4a'] : price < 500 ? ['Raro', '#3f7be0'] : price < 1000 ? ['Épico', '#8a54d6'] : ['Lendário', '#f19a1c']; }
