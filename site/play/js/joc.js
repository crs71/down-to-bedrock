// Down to Bedrock: jocul. Bucla principală: fizica la pas fix (1/120 s), apoi săpatul, construitul,
// mobii, portalul, lumina, camera și desenul pe canvas. Sprite-urile sunt aceleași ca pe site
// (unelte/sprite → sprite.js). Sunt două lumi: cea de sus și Nether-ul, legate printr-un portal.
import { creeazaAtlas, culorileSpriteului, iconita } from './atlas.js';
import { PALETA_NETHER } from './sprite.js';
import {
  Lume, BLOC, BLOCURI, AER, SUPRAFATA, Y_ADANC, PALETA_ADANC, coordonataY, randul,
  PIATRA, PIETRIS, CARBUNE, FIER, AUR, REDSTONE, DIAMANT, BEDROCK, TRUNCHI, TORTA, SCANDURA, LAVA,
  SINA, OBSIDIAN, PORTAL, RAMA, CUART, RESTURI, GLOWSTONE, CREMA, LACRIMA,
} from './lume.js';
import { calculeazaLumina, luminaLampii, UMBRA } from './lumina.js';
import { Jucator } from './jucator.js';
import { Vagonet, CubMagma, Ghast, Piglin, Strider } from './mobi.js';
import { creeazaIntrare } from './control.js';
import { Particule } from './particule.js';

const canvas = document.querySelector('.joc__ecran');
const ctx = canvas.getContext('2d', { alpha: false });
const intrare = creeazaIntrare(canvas, document.querySelector('.joc__butoane'));
const hudY = document.querySelector('.hud__y');
const hudBiom = document.querySelector('.hud__biom');
const hudEfect = document.querySelector('.joc__efect');
const hotbar = document.querySelector('.hotbar');
const numeSlot = document.querySelector('.joc__nume-slot');
const meniu = document.querySelector('.joc__meniu');
const panouStart = meniu.querySelector('.joc__panou--start');
const panouFinal = meniu.querySelector('.joc__panou--final');
const butonJoaca = meniu.querySelector('.joc__joaca');
const atelier = document.querySelector('.joc__atelier');
const listaRetete = atelier.querySelector('.joc__retete');
const butonAtelier = document.querySelector('.joc__buton-atelier');
const mesaje = document.querySelector('.joc__mesaje');

const ATINGERE = 4.5 * BLOC;  // raza de săpat și construit, măsurată de la ochii minerului
const PAS = 1 / 120;
const LAMPA = 7;              // lumina lămpii de pe cască
const TIMP_PORTAL = 1.5;      // secunde în portal până la călătorie
const SALVARE = 'down-to-bedrock:joc:2';
const SOARE = { '--soare-1': '#ffffff', '--soare-2': '#fee761', '--soare-3': '#feae34' };
const NORI = [
  { id: 'nor-mare', x: 30, y: 6 }, { id: 'nor-mediu', x: 70, y: 11 }, { id: 'nor-mic', x: 110, y: 4 },
  { id: 'nor-mare', x: 150, y: 9 }, { id: 'nor-mediu', x: 190, y: 5 }, { id: 'nor-mic', x: 235, y: 12 },
];
const MINEREURI = {
  [CARBUNE]: 'Coal! Craft it into torches',
  [FIER]: 'Iron, for a better pickaxe',
  [AUR]: 'Gold! Piglins love it',
  [REDSTONE]: 'Redstone, glowing red',
  [DIAMANT]: 'Diamonds!',
  [RESTURI]: 'Ancient debris! Two make a netherite pickaxe',
  [GLOWSTONE]: 'Glowstone: a block that shines',
};
// Blocurile desenate cu rampa pietrei, deci mai închise în stratul adânc.
const CU_PIATRA = new Set([PIATRA, PIETRIS, CARBUNE, FIER, AUR, REDSTONE, DIAMANT]);
const NEPERISABILE = new Set([BEDROCK, OBSIDIAN, PORTAL, RAMA, LAVA]); // exploziile nu le strică
const EXPLOZIE = ['#fee761', '#feae34', '#f77622', '#e43b44', '#3e2731'];

// Târnăcoapele: viteza de săpat și culorile capului (peste culorile sprite-ului tarnacop).
const UNELTE = {
  1: { nume: 'Wooden pickaxe', scurt: 'a wooden', viteza: 1, paleta: { '--bedrock-0': '#c28569', '--os-2': '#e8b796', '--bedrock-1': '#733e39' } },
  2: { nume: 'Stone pickaxe', scurt: 'a stone', viteza: 1.6, paleta: { '--bedrock-0': '#5a6988', '--os-2': '#8b9bb4', '--bedrock-1': '#3a4466' } },
  3: { nume: 'Iron pickaxe', scurt: 'an iron', viteza: 2.4, paleta: { '--bedrock-0': '#c0cbdc', '--os-2': '#ffffff', '--bedrock-1': '#8b9bb4' } },
  4: { nume: 'Diamond pickaxe', scurt: 'a diamond', viteza: 3.4, paleta: { '--bedrock-0': '#2ce8f5', '--os-2': '#ffffff', '--bedrock-1': '#0099db' } },
  5: { nume: 'Netherite pickaxe', scurt: 'a netherite', viteza: 4.6, paleta: { '--bedrock-0': '#3e2731', '--os-2': '#733e39', '--bedrock-1': '#181425' } },
};

const RETETE = [
  { nume: 'Torch ×4', icon: 'torta', da: TORTA, numar: 4, cere: [[CARBUNE, 1], [TRUNCHI, 1]] },
  { nume: 'Planks ×4', icon: 'bloc-scandura', da: SCANDURA, numar: 4, cere: [[TRUNCHI, 1]] },
  { nume: 'Stone pickaxe', unealta: 2, cere: [[PIATRA, 3], [TRUNCHI, 1]] },
  { nume: 'Iron pickaxe', unealta: 3, cere: [[FIER, 3], [TRUNCHI, 1]] },
  { nume: 'Diamond pickaxe', unealta: 4, cere: [[DIAMANT, 3], [TRUNCHI, 1]] },
  { nume: 'Netherite pickaxe', unealta: 5, necesita: 4, cere: [[RESTURI, 2], [AUR, 2]] },
  { nume: 'Fire resistance (90 s)', icon: 'crema-magma', efect: 90, cere: [[CREMA, 2], [LACRIMA, 1]] },
];

// Ce poate da un piglin pentru un minereu de aur.
const SCHIMBURI = [[FIER, 2], [CUART, 4], [OBSIDIAN, 1], [GLOWSTONE, 2]];

let dpr = 1;
let p = 0;
let atlas = null;
let dither = null;
let lumi = {};          // { lume, nether }
let dimensiune = 'lume';
let lume;
let mobiPe = {};        // mobii fiecărei lumi
let mobi = [];
let mobiNoi = [];
let jucator;
let particule = new Particule();
let lumina;
let luminaVeche = true;
let lampa = new Map();
const camera = { x: 0, y: 0 };
const sapat = { x: -1, y: -1, progres: 0 };
let leganare = 0;       // faza loviturii de târnăcop
let lovituraMob = 0;    // pauza dintre două lovituri date unui mob
let lovit = 0;          // scurtă invulnerabilitate după ce ești împins
let tremur = 0;         // tremuratul ecranului după o explozie
let timpPortal = 0;
let reapar = 0;         // cronometru pentru mobii noi din Nether
let inventar;
let selectat = 0;
let unealta = 1;
let efectFoc = 0;       // secunde de rezistență la foc
let pauza = true;
let timp = 0;
let ultimaSalvare = 0;
let terminat = false;
let realizari = new Set();
let culori = {};
const culoriSprite = {};
let biomCurent = '';
let yCurent = null;

// ---------- Ecranul ----------
function redimensioneaza() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  // Cam 14 blocuri pe înălțime, dar cel puțin 9 pe lățime (telefonul ținut vertical); pixel întreg.
  const pNou = Math.max(1, Math.round(Math.min(canvas.height / (BLOC * 14), canvas.width / (BLOC * 9))));
  if (pNou !== p) {
    p = pNou;
    atlas = creeazaAtlas(p);
    // Trecerea dintre benzile cerului: tablă de șah cu pătrate de un pixel (ca pe site).
    const d = document.createElement('canvas');
    d.width = d.height = 2 * p;
    const dc = d.getContext('2d');
    dc.fillStyle = '#0099db';
    dc.fillRect(0, 0, 2 * p, 2 * p);
    dc.fillStyle = '#2ce8f5';
    dc.fillRect(p, 0, p, p);
    dc.fillRect(0, p, p, p);
    dither = ctx.createPattern(d, 'repeat');
  }
  ctx.imageSmoothingEnabled = false;
  if (jucator) actualizeazaCamera(0, true);
}

// ---------- Lumile: noi, salvate, încărcate ----------
function creeazaMobi(l) {
  const lista = l.vagonete.map((v) => Vagonet.peSina(v.x, v.y));
  if (l.tip === 'nether') {
    for (const tip of ['magma', 'ghast', 'piglin', 'strider']) {
      const n = { magma: 6, ghast: 3, piglin: 4, strider: 4 }[tip];
      locuri(l, tip).sort(() => Math.random() - 0.5).slice(0, n).forEach((m) => lista.push(mobNou(tip, m)));
    }
  }
  return lista;
}

// Locurile de apariție ale unui tip de mob, doar cele cu destul loc deasupra.
function locuri(l, tip) {
  return l.mobi.filter((m) => m.tip === tip && (tip !== 'magma' && tip !== 'piglin' || l.get(m.x, m.y - 1) === AER));
}

function mobNou(tip, m) {
  if (tip === 'magma') return new CubMagma(m.x * BLOC, (m.y + 1) * BLOC - 30, Math.random() < 0.5 ? 3 : 2);
  if (tip === 'ghast') return new Ghast(m.x * BLOC, m.y * BLOC);
  if (tip === 'piglin') return new Piglin(m.x * BLOC + 3, (m.y + 1) * BLOC - 30);
  return new Strider(m.x * BLOC + 1, (m.y + 1) * BLOC + 4 - 18);
}

function intraInLume(dest) {
  dimensiune = dest;
  lume = lumi[dest];
  if (!mobiPe[dest]) mobiPe[dest] = creeazaMobi(lume);
  mobi = mobiPe[dest];
  luminaVeche = true;
  particule = new Particule();
}

function pregatesteJocul() {
  culori = {};
  for (const [id, def] of Object.entries(BLOCURI)) culori[id] = culorileSpriteului(def.sprite, def.paleta === 'nether' ? PALETA_NETHER : undefined);
  construiesteHotbar();
  actualizeazaButonAtelier();
  actualizeazaCamera(0, true);
}

function lumeNoua() {
  lumi = { lume: new Lume(Math.floor(Math.random() * 2 ** 31), 'lume') };
  mobiPe = {};
  intraInLume('lume');
  jucator = new Jucator(0, 0);
  laStart();
  inventar = Array.from({ length: 9 }, () => ({ bloc: AER, numar: 0 }));
  inventar[0] = { bloc: TORTA, numar: 4 };
  selectat = 0;
  unealta = 1;
  efectFoc = 0;
  timp = 0;
  ultimaSalvare = 0;
  terminat = false;
  realizari = new Set();
  sapat.progres = 0;
  pregatesteJocul();
}

// Minerul apare la începutul lumii curente: sus, pe coloana de start, sau lângă portalul din Nether.
function laStart() {
  let { x, y } = lume.start;
  if (lume.tip === 'lume') {
    y = 0;
    while (y < lume.inaltime - 1 && !lume.solid(x, y + 1)) y++;
  }
  jucator.x = x * BLOC + 3;
  jucator.y = (y + 1) * BLOC - jucator.h;
  jucator.vx = 0;
  jucator.vy = 0;
}

function laBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function dinBase64(text) {
  const s = atob(text);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

// Salvarea stă în browser. Dacă stocarea e plină sau blocată, jocul merge mai departe fără ea.
function salveaza() {
  if (!lume) return;
  ultimaSalvare = timp;
  try {
    localStorage.setItem(SALVARE, JSON.stringify({
      samanta: lumi.lume.samanta,
      lume: laBase64(lumi.lume.blocuri),
      nether: lumi.nether ? laBase64(lumi.nether.blocuri) : null,
      dimensiune,
      x: jucator.x,
      y: jucator.y,
      inventar,
      selectat,
      unealta,
      efectFoc,
      timp,
      terminat,
      realizari: [...realizari],
    }));
  } catch {
    // nimic de făcut
  }
}

function incarca() {
  try {
    localStorage.removeItem('down-to-bedrock:joc:1'); // salvările din etapa 2 nu au mină și portal
    const d = JSON.parse(localStorage.getItem(SALVARE));
    if (!d) return false;
    const incarcata = (tip, text) => {
      const l = new Lume(d.samanta, tip);
      const blocuri = dinBase64(text);
      if (blocuri.length !== l.blocuri.length) throw new Error('lume stricată');
      l.blocuri.set(blocuri);
      return l;
    };
    if (!Array.isArray(d.inventar) || d.inventar.length !== 9) return false;
    lumi = { lume: incarcata('lume', d.lume) };
    if (d.nether) lumi.nether = incarcata('nether', d.nether);
    mobiPe = {};
    intraInLume(d.dimensiune === 'nether' && lumi.nether ? 'nether' : 'lume');
    jucator = new Jucator(d.x, d.y);
    inventar = d.inventar.map((s) => ({ bloc: s.bloc in BLOCURI ? s.bloc : AER, numar: s.bloc in BLOCURI ? s.numar : 0 }));
    selectat = d.selectat || 0;
    unealta = UNELTE[d.unealta] ? d.unealta : 1;
    efectFoc = d.efectFoc || 0;
    timp = d.timp || 0;
    ultimaSalvare = timp;
    terminat = !!d.terminat;
    realizari = new Set(d.realizari || []);
    sapat.progres = 0;
    pregatesteJocul();
    return true;
  } catch {
    return false;
  }
}

// ---------- Camera: urmărește minerul, fără să iasă din lume ----------
function actualizeazaCamera(dt, imediat = false) {
  const lat = canvas.width / p;
  const inalt = canvas.height / p;
  const tx = jucator.centruX - lat / 2;
  const ty = jucator.y + jucator.h / 2 - inalt / 2;
  const k = imediat ? 1 : 1 - Math.exp(-dt * 9);
  camera.x += (tx - camera.x) * k;
  camera.y += (ty - camera.y) * k;
  const maxX = lume.latime * BLOC - lat;
  camera.x = maxX < 0 ? maxX / 2 : Math.max(0, Math.min(maxX, camera.x));
  const maxY = lume.inaltime * BLOC - inalt;
  camera.y = maxY < 0 ? maxY / 2 : Math.max(0, Math.min(maxY, camera.y));
}

// Punctul țintit (sub cursor sau sub deget), blocul de acolo și dacă e destul de aproape.
function tintaCurenta() {
  if (!intrare.tinta) return null;
  const wx = Math.round(camera.x * p) / p + (intrare.tinta.x * dpr) / p;
  const wy = Math.round(camera.y * p) / p + (intrare.tinta.y * dpr) / p;
  const x = Math.floor(wx / BLOC);
  const y = Math.floor(wy / BLOC);
  const dx = (x + 0.5) * BLOC - jucator.centruX;
  const dy = (y + 0.5) * BLOC - jucator.ochiY;
  return { x, y, wx, wy, aproape: Math.hypot(dx, dy) <= ATINGERE };
}

// ---------- Mobii: lovitura, explozii, împinsul minerului ----------
// Dacă ținta e pe un mob, lovitura merge la el (o dată la 0,35 s) și nu se sapă blocul din spate.
function lovesteMob(dt, tinta) {
  if (!intrare.mina || !tinta) return false;
  const mob = mobi.find((m) => m.loveste && !m.mort && !m.sters && m.contine(tinta.wx, tinta.wy));
  if (!mob) return false;
  if (Math.hypot(tinta.wx - jucator.centruX, tinta.wy - jucator.ochiY) > ATINGERE + BLOC) return true;
  leganare += dt * 16;
  if (!lovituraMob) {
    mob.loveste(legatura);
    lovituraMob = 0.35;
  }
  return true;
}

function lovesteJucator(dinX, putere = 1) {
  if (lovit > 0 || mobi.some((m) => m.tip === 'vagonet' && m.ocupat)) return;
  lovit = 0.5;
  const dir = Math.sign(jucator.centruX - dinX) || 1;
  jucator.vx = dir * 170 * putere;
  jucator.vy = -150 * putere;
  jucator.peSol = false;
  tremur = Math.max(tremur, 0.25);
}

// Mingea de foc explodează: particule, ecranul tremură; lovind un perete, sparge blocurile din jur.
function explozie(x, y, strica) {
  particule.explozie(x, y, EXPLOZIE, 40, 110);
  tremur = 0.4;
  if (strica) {
    const cx = Math.floor(x / BLOC);
    const cy = Math.floor(y / BLOC);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const b = lume.get(cx + dx, cy + dy);
        if (b !== AER && !NEPERISABILE.has(b) && Math.hypot(dx, dy) < 1.3) lume.set(cx + dx, cy + dy, AER);
      }
    }
    luminaVeche = true;
  }
  if (Math.hypot(jucator.centruX - x, jucator.centruY - y) < 2.5 * BLOC) lovesteJucator(x, 1.3);
}

function schimbPiglin(piglin) {
  const [bloc, numar] = SCHIMBURI[Math.floor(Math.random() * SCHIMBURI.length)];
  adauga(bloc, numar);
  particule.explozie(piglin.centruX, piglin.y + 10, ['#fee761', '#feae34'], 10, 40);
  mesaj(`The piglin gave you ${numar} × ${BLOCURI[bloc].nume.toLowerCase()}`);
}

// Legătura dintre mobi și joc (vezi mobi.js).
const legatura = {
  get jucator() { return jucator; },
  get intrare() { return intrare; },
  get mobi() { return mobi; },
  get particule() { return particule; },
  adauga: (bloc, n) => adauga(bloc, n),
  mesaj: (text, cheie) => mesaj(text, cheie),
  numara: (bloc) => numara(bloc),
  consuma: (bloc, n) => consuma(bloc, n),
  adaugaMob: (m) => mobiNoi.push(m),
  scoate: (m) => { m.sters = true; },
  explozie,
  loveste: lovesteJucator,
  culori: (id) => (culoriSprite[id] = culoriSprite[id] || culorileSpriteului(id)),
  schimb: schimbPiglin,
};

function actualizeazaMobi(dt) {
  const vagonet = mobi.find((m) => m.tip === 'vagonet' && m.ocupat);
  for (const m of mobi) {
    // Mobii departe de miner stau pe loc (mingile de foc zboară mereu).
    if (m.tip !== 'minge' && m !== vagonet && Math.abs(m.centruX - jucator.centruX) > 30 * BLOC) continue;
    m.actualizeaza(dt, lume, legatura);
  }
  if (mobiNoi.length) {
    mobi.push(...mobiNoi);
    mobiNoi = [];
  }
  for (let i = mobi.length - 1; i >= 0; i--) if (mobi[i].sters) mobi.splice(i, 1);

  // În Nether apar mobi noi, departe de miner, când sunt prea puțini.
  if (lume.tip === 'nether') {
    reapar -= dt;
    if (reapar <= 0) {
      reapar = 15;
      for (const [tip, minim] of [['magma', 3], ['ghast', 2], ['piglin', 2]]) {
        if (mobi.filter((m) => m.tip === tip).length >= minim) continue;
        const loc = locuri(lume, tip).filter((m) => Math.abs(m.x * BLOC - jucator.centruX) > 14 * BLOC);
        if (loc.length) mobi.push(mobNou(tip, loc[Math.floor(Math.random() * loc.length)]));
      }
    }
  }
}

// ---------- Portalul ----------
function actualizeazaPortal(dt) {
  const inPortal = jucator.celule().some(([x, y]) => lume.get(x, y) === PORTAL);
  timpPortal = inPortal ? timpPortal + dt : Math.max(0, timpPortal - dt * 2);
  if (inPortal && Math.random() < dt * 20) {
    particule.emite(jucator.centruX + (Math.random() - 0.5) * 16, jucator.y + Math.random() * jucator.h, '#b55088', 0, -20, 0.8);
  }
  if (timpPortal >= TIMP_PORTAL) calatoreste();
}

function calatoreste() {
  timpPortal = 0;
  const dest = dimensiune === 'lume' ? 'nether' : 'lume';
  if (!lumi[dest]) lumi[dest] = new Lume(lumi.lume.samanta, dest);
  mobi.forEach((m) => { if (m.tip === 'vagonet') m.ocupat = false; });
  intraInLume(dest);
  // Apari în dreapta portalului, pe podea.
  const pt = lume.portal;
  jucator.x = (pt.x + 4) * BLOC + 3;
  jucator.y = (pt.y + 5) * BLOC - jucator.h;
  jucator.vx = 0;
  jucator.vy = 0;
  actualizeazaCamera(0, true);
  if (dest === 'nether') {
    mesaj('Welcome to the Nether', 'nether');
    mesaj('Hit magma cubes, send fireballs back, give gold to piglins', 'nether-sfat');
  } else {
    mesaj('Back in the Overworld');
  }
  salveaza();
}

// ---------- Săpatul ----------
function actualizeazaSapat(dt, tinta) {
  const bloc = tinta ? lume.get(tinta.x, tinta.y) : AER;
  if (!intrare.mina || !tinta || !tinta.aproape || bloc === AER || BLOCURI[bloc].lichid || tinta.y < 0
    || tinta.x < 0 || tinta.x >= lume.latime) {
    sapat.progres = 0;
    sapat.x = -1;
    return;
  }
  if (tinta.x !== sapat.x || tinta.y !== sapat.y) {
    sapat.x = tinta.x;
    sapat.y = tinta.y;
    sapat.progres = 0;
  }
  leganare += dt * 16;
  const def = BLOCURI[bloc];
  if (def.duritate === Infinity) {
    // Bedrock-ul: fisurile urcă puțin, apoi se refac. Ca pe site, nu se sparge.
    sapat.progres += dt / 2.5;
    if (sapat.progres >= 0.35) {
      sapat.progres = 0;
      mesaj('Bedrock can’t be broken', 'bedrock');
    }
    return;
  }
  // Cu un târnăcop prea slab, blocul se sparge de trei ori mai greu și nu lasă nimic.
  const potrivit = (def.nivel || 0) <= unealta;
  sapat.progres += (dt * UNELTE[unealta].viteza) / (def.duritate * (potrivit ? 1 : 3));
  if (sapat.progres >= 1) sparge(tinta.x, tinta.y, bloc, potrivit);
}

function sparge(x, y, bloc, potrivit) {
  const def = BLOCURI[bloc];
  lume.set(x, y, AER);
  luminaVeche = true;
  sapat.progres = 0;
  particule.explozie((x + 0.5) * BLOC, (y + 0.5) * BLOC, culori[bloc]);
  mesaj('First block broken', 'primul');
  if (!potrivit) {
    mesaj(`You need ${UNELTE[def.nivel].scurt} pickaxe to collect ${def.nume.toLowerCase()}`, `nivel-${bloc}`);
    return;
  }
  const drop = def.drop === undefined ? bloc : def.drop;
  if (drop !== null) adauga(drop);
  if (MINEREURI[bloc]) mesaj(MINEREURI[bloc], `minereu-${bloc}`);
  if (bloc === TRUNCHI) mesaj('Wood! Open Craft to make torches and tools', 'lemn');
}

// ---------- Construitul ----------
function actualizeazaConstructie(tinta) {
  if (!intrare.pune) return;
  intrare.pune = false;
  if (!tinta || !tinta.aproape || tinta.y < 0) return;
  const acolo = lume.get(tinta.x, tinta.y);
  if (acolo !== AER && acolo !== LAVA) return;
  const slot = inventar[selectat];
  if (!slot.numar) {
    mesaj('Pick a block from the hotbar to build', 'fara-bloc');
    return;
  }
  const def = BLOCURI[slot.bloc];
  if (def.obiect) {
    mesaj(`${def.nume} is for crafting, not for building`, `obiect-${slot.bloc}`);
    return;
  }
  if (acolo === LAVA && !def.solid) return; // lava se acoperă doar cu un bloc plin
  // Un bloc nou se sprijină pe alt bloc sau pe peretele din spate.
  const sprijin = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => lume.get(tinta.x + a, tinta.y + b) !== AER)
    || lume.fundal(tinta.x, tinta.y) !== AER;
  if (!sprijin) return;
  if (def.solid && (jucator.atinge(tinta.x, tinta.y) || mobi.some((m) => m.atinge(tinta.x, tinta.y)))) return;
  lume.set(tinta.x, tinta.y, slot.bloc);
  luminaVeche = true;
  if (slot.bloc === TORTA) mesaj('Let there be light', 'prima-torta');
  consuma(slot.bloc, 1, selectat);
}

// ---------- Inventarul și hotbar-ul ----------
function adauga(bloc, numar = 1) {
  for (let k = 0; k < numar; k++) {
    let slot = inventar.find((s) => s.bloc === bloc && s.numar > 0 && s.numar < 64);
    if (!slot) slot = inventar.find((s) => !s.numar);
    if (!slot) {
      mesaj('Your hotbar is full', 'plin');
      return;
    }
    slot.bloc = bloc;
    slot.numar += 1;
    const i = inventar.indexOf(slot);
    actualizeazaSlot(i);
    const el = hotbar.children[i];
    el.classList.remove('hotbar__slot--nou');
    void el.offsetWidth; // repornește animația
    el.classList.add('hotbar__slot--nou');
  }
}

const numara = (bloc) => inventar.reduce((n, s) => n + (s.bloc === bloc ? s.numar : 0), 0);

// Scoate `numar` bucăți; întâi din slotul dat (cel selectat), apoi din celelalte.
function consuma(bloc, numar, primul = -1) {
  const ordine = primul >= 0 ? [primul, ...inventar.keys()] : [...inventar.keys()];
  for (const i of ordine) {
    const s = inventar[i];
    while (numar > 0 && s.bloc === bloc && s.numar > 0) {
      s.numar -= 1;
      numar -= 1;
    }
    if (!s.numar) s.bloc = AER;
    actualizeazaSlot(i);
  }
}

function construiesteHotbar() {
  hotbar.replaceChildren();
  inventar.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hotbar__slot';
    b.innerHTML = '<span class="hotbar__numar"></span>';
    b.addEventListener('click', () => selecteaza(i));
    hotbar.appendChild(b);
    actualizeazaSlot(i);
  });
}

const iconite = {};
function iconitaBloc(bloc) {
  const def = BLOCURI[bloc];
  iconite[bloc] = iconite[bloc] || iconita(def.sprite, def.paleta === 'nether' ? PALETA_NETHER : undefined);
  return iconite[bloc];
}

function actualizeazaSlot(i) {
  const s = inventar[i];
  const el = hotbar.children[i];
  const vechi = el.querySelector('canvas');
  if (vechi && (Number(vechi.dataset.bloc) !== s.bloc || !s.numar)) vechi.remove();
  if (s.numar && !el.querySelector('canvas')) {
    const sursa = iconitaBloc(s.bloc);
    const c = document.createElement('canvas');
    c.width = sursa.width;
    c.height = sursa.height;
    c.dataset.bloc = String(s.bloc);
    c.getContext('2d').drawImage(sursa, 0, 0);
    el.prepend(c);
  }
  el.querySelector('.hotbar__numar').textContent = s.numar > 1 ? String(s.numar) : '';
  el.classList.toggle('hotbar__slot--activ', i === selectat);
  el.setAttribute('aria-label', s.numar ? `${BLOCURI[s.bloc].nume}, ${s.numar}` : 'Empty slot');
  el.setAttribute('aria-pressed', String(i === selectat));
}

let ascundeNume = 0;
function selecteaza(i) {
  const vechi = selectat;
  selectat = (i + 9) % 9;
  actualizeazaSlot(vechi);
  actualizeazaSlot(selectat);
  // Numele blocului ales apare o clipă deasupra hotbar-ului.
  const s = inventar[selectat];
  numeSlot.textContent = s.numar ? BLOCURI[s.bloc].nume : '';
  numeSlot.hidden = !s.numar;
  clearTimeout(ascundeNume);
  ascundeNume = setTimeout(() => { numeSlot.hidden = true; }, 1400);
}

// ---------- Crafting ----------
function iconitaUnelte(nivel) {
  return iconita('tarnacop', UNELTE[nivel].paleta);
}

function actualizeazaButonAtelier() {
  butonAtelier.querySelector('canvas')?.remove();
  const c = iconitaUnelte(unealta);
  c.setAttribute('aria-hidden', 'true');
  butonAtelier.prepend(c);
}

function poateFace(r) {
  if (r.unealta && unealta >= r.unealta) return false;
  if (r.necesita && unealta < r.necesita) return false;
  return r.cere.every(([bloc, n]) => numara(bloc) >= n);
}

function construiesteRetete() {
  atelier.querySelector('.joc__unealta').textContent = UNELTE[unealta].nume;
  listaRetete.replaceChildren();
  RETETE.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'joc__reteta';
    const icon = r.unealta ? iconitaUnelte(r.unealta) : iconita(r.icon);
    icon.className = 'joc__reteta-icon';
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('div');
    text.className = 'joc__reteta-text';
    const nume = document.createElement('b');
    nume.textContent = r.nume;
    const ingrediente = document.createElement('span');
    ingrediente.className = 'joc__ingrediente';
    for (const [bloc, n] of r.cere) {
      const are = numara(bloc);
      const bucata = document.createElement('span');
      bucata.className = are >= n ? 'joc__ingredient' : 'joc__ingredient joc__ingredient--lipsa';
      const mic = iconita(BLOCURI[bloc].sprite, BLOCURI[bloc].paleta === 'nether' ? PALETA_NETHER : undefined);
      mic.setAttribute('aria-hidden', 'true');
      bucata.append(mic, `${BLOCURI[bloc].nume} ${are}/${n}`);
      ingrediente.append(bucata);
    }
    if (r.necesita && unealta < r.necesita) {
      const nota = document.createElement('span');
      nota.className = 'joc__ingredient joc__ingredient--lipsa';
      nota.textContent = `needs ${UNELTE[r.necesita].scurt} pickaxe first`;
      ingrediente.append(nota);
    }
    text.append(nume, ingrediente);

    const buton = document.createElement('button');
    buton.type = 'button';
    const detinut = r.unealta && unealta >= r.unealta;
    buton.textContent = detinut ? 'Owned' : 'Craft';
    buton.disabled = !poateFace(r);
    buton.setAttribute('aria-label', detinut ? `${r.nume}: you already have it` : `Craft ${r.nume}`);
    buton.addEventListener('click', () => {
      if (!poateFace(r)) return;
      for (const [bloc, n] of r.cere) consuma(bloc, n);
      if (r.unealta) {
        unealta = r.unealta;
        actualizeazaButonAtelier();
        mesaj(`Crafted ${UNELTE[unealta].scurt} pickaxe`);
      } else if (r.efect) {
        efectFoc = r.efect;
        mesaj('Fire resistance: lava can’t hurt you for 90 s');
      } else {
        adauga(r.da, r.numar);
      }
      construiesteRetete();
      const urmator = listaRetete.children[i].querySelector('button');
      (urmator.disabled ? atelier.querySelector('.joc__inchide') : urmator).focus({ preventScroll: true });
      salveaza();
    });
    li.append(icon, text, buton);
    listaRetete.append(li);
  });
}

function deschideAtelier() {
  if (!meniu.hidden) return;
  pauza = true;
  intrare.mina = false;
  construiesteRetete();
  atelier.hidden = false;
  atelier.querySelector('.joc__inchide').focus({ preventScroll: true });
}

function inchideAtelier() {
  atelier.hidden = true;
  if (meniu.hidden) pauza = false;
}

butonAtelier.addEventListener('click', () => (atelier.hidden ? deschideAtelier() : inchideAtelier()));
atelier.querySelector('.joc__inchide').addEventListener('click', inchideAtelier);

// ---------- Mesaje și obiective ----------
function mesaj(text, cheie) {
  if (cheie) {
    if (realizari.has(cheie)) return;
    realizari.add(cheie);
  }
  const el = document.createElement('div');
  el.className = 'joc__mesaj';
  el.textContent = text;
  mesaje.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

function actualizeazaHud() {
  const rand = Math.floor((jucator.y + jucator.h - 1) / BLOC);
  const col = Math.max(0, Math.min(lume.latime - 1, Math.floor(jucator.centruX / BLOC)));
  let y;
  let biom;
  if (lume.tip === 'nether') {
    y = lume.inaltime - 1 - rand;
    biom = col < 40 ? 'Nether Wastes' : col < 80 ? 'Crimson Forest' : col < 115 ? 'Nether Fortress' : 'Soul Sand Valley';
  } else {
    y = coordonataY(rand);
    biom = 'Plains';
    if (rand > lume.suprafata[col] + 1) biom = y > 0 ? 'Underground' : y > -48 ? 'Deep caves' : 'Bedrock level';
    if (lume.get(col, rand) === SINA || lume.get(col, rand + 1) === SINA) biom = 'Abandoned Mineshaft';
  }
  if (y !== yCurent) {
    yCurent = y;
    hudY.textContent = `Y: ${y}`;
  }
  if (biom !== biomCurent) {
    biomCurent = biom;
    hudBiom.textContent = biom;
    hudBiom.classList.remove('hud__biom--nou');
    void hudBiom.offsetWidth;
    hudBiom.classList.add('hud__biom--nou');
  }
  hudEfect.hidden = efectFoc <= 0;
  if (efectFoc > 0) hudEfect.textContent = `Fire resistance ${Math.ceil(efectFoc)} s`;

  // Sfaturi, câte o singură dată.
  const cap = Math.floor(jucator.ochiY / BLOC) * lume.latime + col;
  if (lume.tip === 'lume' && lumina[cap] < 4 && !realizari.has('prima-torta')) mesaj('It’s dark down here. Place a torch, or craft some: coal + log', 'intuneric');
  if (biom === 'Abandoned Mineshaft') mesaj('An abandoned mineshaft! Find the minecart and follow the rails', 'mina');
  if (lume.tip === 'lume' && y <= 0) mesaj('Halfway down', 'jumatate');
  if (lume.tip === 'lume' && y <= -60 && !terminat) castiga();
}

// Lava: dacă minerul o atinge fără rezistență la foc, se întoarce la începutul lumii (cu tot ce are).
function verificaLava() {
  if (efectFoc > 0) return;
  if (!jucator.celule().some(([x, y]) => lume.get(x, y) === LAVA)) return;
  particule.explozie(jucator.centruX, jucator.y + jucator.h, culori[LAVA], 24, 90);
  mesaj(lume.tip === 'nether' ? 'You fell into lava! Back to the portal' : 'You fell into lava! Back to the surface');
  laStart();
  actualizeazaCamera(0, true);
}

function durata(secunde) {
  const m = Math.floor(secunde / 60);
  const s = Math.floor(secunde % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function castiga() {
  terminat = true;
  const obiecte = inventar.reduce((n, s) => n + s.numar, 0);
  const nether = realizari.has('nether') ? ', after a trip to the Nether' : '';
  panouFinal.querySelector('.joc__rezultat').textContent =
    `You dug down to bedrock in ${durata(timp)}${nether}, with ${UNELTE[unealta].scurt} pickaxe and ${obiecte} ${obiecte === 1 ? 'item' : 'items'} in your hotbar.`;
  arataMeniu(panouFinal);
}

// ---------- Meniul ----------
function arataMeniu(panou = panouStart) {
  pauza = true;
  intrare.mina = false;
  atelier.hidden = true;
  panouStart.hidden = panou !== panouStart;
  panouFinal.hidden = panou !== panouFinal;
  meniu.hidden = false;
  panou.querySelector('button').focus({ preventScroll: true });
  if (timp > 0) salveaza(); // o lume abia creată, în care nu s-a jucat nimeni, nu se salvează
}

function ascundeMeniu() {
  meniu.hidden = true;
  pauza = false;
  butonJoaca.textContent = 'Resume';
  mesaj('Dig all the way down to bedrock', 'start');
}

butonJoaca.addEventListener('click', ascundeMeniu);
meniu.querySelectorAll('.joc__nou').forEach((b) => b.addEventListener('click', () => {
  if (timp > 10 && !window.confirm('Start a new world? The current one will be lost.')) return;
  lumeNoua();
  salveaza();
  ascundeMeniu();
}));
meniu.querySelector('.joc__continua').addEventListener('click', ascundeMeniu);
document.querySelector('.joc__pauza').addEventListener('click', () => arataMeniu());
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (!atelier.hidden) inchideAtelier();
  else if (meniu.hidden) arataMeniu();
  else if (!panouStart.hidden) ascundeMeniu();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && meniu.hidden) arataMeniu();
});
window.addEventListener('pagehide', salveaza);

// ---------- Desenul ----------
function imagineBloc(bloc, adanc, umbra, c, r) {
  const def = BLOCURI[bloc];
  const opt = { umbra };
  if (def.paleta === 'nether') {
    opt.paleta = PALETA_NETHER;
    opt.numePaleta = 'nether';
  } else if (adanc && CU_PIATRA.has(bloc)) {
    opt.paleta = PALETA_ADANC;
    opt.numePaleta = 'adanc';
  }
  // Lava și portalul licăresc: celulele vecine își schimbă pe rând desenul cu oglindirea lui.
  if (bloc === LAVA || bloc === PORTAL) opt.oglindit = ((Math.floor(timp * 1.5) + c + r) & 1) === 1;
  return atlas.imagine(def.sprite, opt);
}

function deseneaza() {
  const W = canvas.width;
  const H = canvas.height;
  const b = BLOC * p;
  const zgaltaie = tremur > 0 ? Math.round((Math.random() * 2 - 1) * tremur * 8 * p) : 0;
  const camX = Math.round(camera.x * p) + zgaltaie;
  const camY = Math.round(camera.y * p) + zgaltaie;

  if (lume.tip === 'nether') {
    ctx.fillStyle = '#3e2731';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Cerul, legat de lume: albastru sus, mai deschis spre orizont; dedesubt, întuneric.
    const orizont = (SUPRAFATA - 3) * b - camY;
    ctx.fillStyle = '#0099db';
    ctx.fillRect(0, 0, W, H);
    dither.setTransform(new DOMMatrix([1, 0, 0, 1, -camX % (2 * p), -camY % (2 * p)]));
    ctx.fillStyle = dither;
    ctx.fillRect(0, orizont - b / 2, W, b / 2);
    ctx.fillStyle = '#2ce8f5';
    ctx.fillRect(0, orizont, W, H);
    ctx.fillStyle = '#181425';
    ctx.fillRect(0, orizont + 14 * b, W, H);

    // Soarele și norii, mai departe decât lumea (se mișcă pe jumătate).
    ctx.drawImage(atlas.imagine('soare', { paleta: SOARE, numePaleta: 'zi' }), Math.round(W * 0.78 - camX * 0.1), Math.round(3 * b - camY * 0.5));
    for (const n of NORI) {
      const x = Math.round(((n.x * BLOC + timp * 4) * p - camX * 0.5) % (lume.latime * b));
      ctx.drawImage(atlas.imagine(n.id), x, Math.round(n.y * b - camY * 0.5));
    }
  }

  // Blocurile vizibile: întâi peretele din spate (unde e gol), apoi blocul.
  const c0 = Math.max(0, Math.floor(camX / b));
  const c1 = Math.min(lume.latime - 1, Math.floor((camX + W) / b));
  const r0 = Math.max(0, Math.floor(camY / b));
  const r1 = Math.min(lume.inaltime - 1, Math.floor((camY + H) / b));
  const randAdanc = randul(Y_ADANC) - 3;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const x = c * b - camX;
      const y = r * b - camY;
      const bloc = lume.get(c, r);
      const adanc = r > randAdanc && lume.adanc(c, r);
      if (bloc === AER || !BLOCURI[bloc].solid) {
        const f = lume.fundal(c, r);
        if (f !== AER) ctx.drawImage(imagineBloc(f, adanc, 0.62, c, r), x, y);
      }
      if (bloc !== AER) ctx.drawImage(imagineBloc(bloc, adanc, 0, c, r), x, y);
      // Sclipiri violete care urcă din portal.
      if (bloc === PORTAL && !pauza && Math.random() < 0.01) {
        particule.emite((c + Math.random()) * BLOC, (r + Math.random()) * BLOC, Math.random() < 0.5 ? '#b55088' : '#68386c', 0, -18, 1.2);
      }
    }
  }

  // Fisurile pe blocul săpat (10 cadre din aceeași foaie ca pe site).
  if (sapat.progres > 0 && sapat.x >= 0) {
    const cadru = Math.min(9, Math.floor(sapat.progres * 10));
    ctx.globalAlpha = 0.85;
    ctx.drawImage(atlas.imagine('fisuri'), cadru * b, 0, b, b, sapat.x * b - camX, sapat.y * b - camY, b, b);
    ctx.globalAlpha = 1;
  }

  // Mobii, minerul, apoi vagoanele (ca picioarele minerului să stea în vagonet).
  for (const m of mobi) if (m.tip !== 'vagonet') m.deseneaza(ctx, atlas, camX, camY, p, timp);
  deseneazaMinerul(camX, camY);
  for (const m of mobi) if (m.tip === 'vagonet') m.deseneaza(ctx, atlas, camX, camY, p, timp);
  particule.deseneaza(ctx, camX, camY, p);

  // Umbra: câte un pătrat închis peste fiecare celulă, după lumina ei (a lumii sau a lămpii).
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const i = r * lume.latime + c;
      const nivel = Math.max(lumina[i], lampa.get(i) || 0);
      if (UMBRA[nivel]) {
        ctx.fillStyle = UMBRA[nivel];
        ctx.fillRect(c * b - camX, r * b - camY, b, b);
      }
    }
  }

  // Violetul portalului, tot mai des cât stai în el.
  if (timpPortal > 0) {
    ctx.fillStyle = `rgba(104, 56, 108, ${Math.min(0.9, (timpPortal / TIMP_PORTAL) * 0.9)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Conturul blocului țintit, doar dacă e la îndemână.
  const tinta = tintaCurenta();
  if (tinta && tinta.aproape && meniu.hidden && atelier.hidden) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = p;
    ctx.strokeRect(tinta.x * b - camX + p / 2, tinta.y * b - camY + p / 2, b - p, b - p);
  }
}

function deseneazaMinerul(camX, camY) {
  const stanga = jucator.directie < 0;
  const cadru = jucator.mers ? Math.floor(jucator.mers * 7) % 2 : 0;
  const x = Math.round((jucator.x - 1) * p) - camX;
  const y = Math.round((jucator.y - 1) * p) - camY;
  if (lovit > 0 && Math.floor(lovit * 20) % 2) ctx.globalAlpha = 0.5; // clipește după o lovitură
  ctx.drawImage(atlas.imagine(`miner-${cadru}`, { oglindit: stanga }), x, y);

  // Târnăcopul, ținut în mână (coloana 6, rândul 15 din sprite); se leagănă cât sapi sau lovești.
  const mana = { x: x + (stanga ? 12 - 6.5 : 6.5) * p, y: y + 15 * p };
  const unghi = sapat.progres > 0 || intrare.mina ? -0.2 + Math.sin(leganare) * 0.8 : 0.35;
  ctx.save();
  ctx.translate(mana.x, mana.y);
  if (stanga) ctx.scale(-1, 1);
  ctx.rotate(unghi);
  ctx.drawImage(atlas.imagine('tarnacop', { paleta: UNELTE[unealta].paleta, numePaleta: `unealta-${unealta}` }), -2 * p, -8 * p);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------- Bucla ----------
let ultim = 0;
let acumulat = 0;

function cadru(acum) {
  requestAnimationFrame(cadru);
  const dt = Math.min(0.05, ultim ? (acum - ultim) / 1000 : 0);
  ultim = acum;
  if (intrare.atelier) {
    intrare.atelier = false;
    if (!atelier.hidden) inchideAtelier();
    else deschideAtelier();
  }
  if (!pauza) {
    const calare = mobi.some((m) => m.tip === 'vagonet' && m.ocupat);
    acumulat += dt;
    while (acumulat >= PAS) {
      if (!calare) jucator.actualizeaza(PAS, lume, intrare);
      acumulat -= PAS;
    }
    timp += dt;
    lovituraMob = Math.max(0, lovituraMob - dt);
    lovit = Math.max(0, lovit - dt);
    tremur = Math.max(0, tremur - dt);
    efectFoc = Math.max(0, efectFoc - dt);
    if (intrare.slot !== null) {
      selecteaza(intrare.slot);
      intrare.slot = null;
    }
    if (intrare.roata) {
      selecteaza(selectat + intrare.roata);
      intrare.roata = 0;
    }
    const tinta = tintaCurenta();
    if (!lovesteMob(dt, tinta)) actualizeazaSapat(dt, tinta);
    else sapat.progres = 0;
    actualizeazaConstructie(tinta);
    actualizeazaMobi(dt);
    actualizeazaPortal(dt);
    verificaLava();
    particule.actualizeaza(dt);
    actualizeazaCamera(dt);
    if (timp - ultimaSalvare > 10) salveaza();
  } else {
    intrare.pune = false;
  }
  if (luminaVeche) {
    lumina = calculeazaLumina(lume);
    luminaVeche = false;
  }
  lampa = luminaLampii(lume, Math.floor(jucator.centruX / BLOC), Math.floor(jucator.ochiY / BLOC), LAMPA);
  if (!pauza) actualizeazaHud();
  deseneaza();
}

// Starea curentă, doar pentru verificări din consolă: (await import('./js/joc.js')).stare().
export function stare() {
  return { lume, lumi, dimensiune, jucator, mobi, camera, inventar, selectat, sapat, p, dpr, timp, pauza, unealta, lumina, efectFoc };
}

window.addEventListener('resize', redimensioneaza);
redimensioneaza();
if (incarca()) {
  butonJoaca.textContent = 'Continue';
} else {
  lumeNoua();
}
lumina = calculeazaLumina(lume);
luminaVeche = false;
actualizeazaHud();
arataMeniu();
requestAnimationFrame(cadru);
