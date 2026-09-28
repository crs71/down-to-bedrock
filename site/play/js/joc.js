// Down to Bedrock: jocul. Bucla principală: fizica la pas fix (1/120 s), apoi săpatul, construitul,
// lumina, camera și desenul pe canvas. Sprite-urile sunt aceleași ca pe site (unelte/sprite → sprite.js).
import { creeazaAtlas, culorileSpriteului, iconita } from './atlas.js';
import {
  Lume, BLOC, BLOCURI, AER, SUPRAFATA, Y_ADANC, PALETA_ADANC, coordonataY, randul,
  PIATRA, PIETRIS, CARBUNE, FIER, AUR, REDSTONE, DIAMANT, TRUNCHI, TORTA, SCANDURA, LAVA,
} from './lume.js';
import { calculeazaLumina, luminaLampii, UMBRA } from './lumina.js';
import { Jucator } from './jucator.js';
import { creeazaIntrare } from './control.js';
import { Particule } from './particule.js';

const canvas = document.querySelector('.joc__ecran');
const ctx = canvas.getContext('2d', { alpha: false });
const intrare = creeazaIntrare(canvas, document.querySelector('.joc__butoane'));
const hudY = document.querySelector('.hud__y');
const hudBiom = document.querySelector('.hud__biom');
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
const SALVARE = 'down-to-bedrock:joc:1';
const SOARE = { '--soare-1': '#ffffff', '--soare-2': '#fee761', '--soare-3': '#feae34' };
const NORI = [
  { id: 'nor-mare', x: 30, y: 6 }, { id: 'nor-mediu', x: 70, y: 11 }, { id: 'nor-mic', x: 110, y: 4 },
  { id: 'nor-mare', x: 150, y: 9 }, { id: 'nor-mediu', x: 190, y: 5 }, { id: 'nor-mic', x: 235, y: 12 },
];
const MINEREURI = {
  [CARBUNE]: 'Coal! Craft it into torches',
  [FIER]: 'Iron, for a better pickaxe',
  [AUR]: 'Shiny! Gold ore',
  [REDSTONE]: 'Redstone, glowing red',
  [DIAMANT]: 'Diamonds!',
};
// Blocurile desenate cu rampa pietrei, deci mai închise în stratul adânc.
const CU_PIATRA = new Set([PIATRA, PIETRIS, CARBUNE, FIER, AUR, REDSTONE, DIAMANT]);

// Târnăcoapele: viteza de săpat și culorile capului (peste culorile sprite-ului tarnacop).
const UNELTE = {
  1: { nume: 'Wooden pickaxe', scurt: 'a wooden', viteza: 1, paleta: { '--bedrock-0': '#c28569', '--os-2': '#e8b796', '--bedrock-1': '#733e39' } },
  2: { nume: 'Stone pickaxe', scurt: 'a stone', viteza: 1.6, paleta: { '--bedrock-0': '#5a6988', '--os-2': '#8b9bb4', '--bedrock-1': '#3a4466' } },
  3: { nume: 'Iron pickaxe', scurt: 'an iron', viteza: 2.4, paleta: { '--bedrock-0': '#c0cbdc', '--os-2': '#ffffff', '--bedrock-1': '#8b9bb4' } },
  4: { nume: 'Diamond pickaxe', scurt: 'a diamond', viteza: 3.4, paleta: { '--bedrock-0': '#2ce8f5', '--os-2': '#ffffff', '--bedrock-1': '#0099db' } },
};

const RETETE = [
  { nume: 'Torch ×4', icon: 'torta', da: TORTA, numar: 4, cere: [[CARBUNE, 1], [TRUNCHI, 1]] },
  { nume: 'Planks ×4', icon: 'bloc-scandura', da: SCANDURA, numar: 4, cere: [[TRUNCHI, 1]] },
  { nume: 'Stone pickaxe', unealta: 2, cere: [[PIATRA, 3], [TRUNCHI, 1]] },
  { nume: 'Iron pickaxe', unealta: 3, cere: [[FIER, 3], [TRUNCHI, 1]] },
  { nume: 'Diamond pickaxe', unealta: 4, cere: [[DIAMANT, 3], [TRUNCHI, 1]] },
];

let dpr = 1;
let p = 0;
let atlas = null;
let dither = null;
let lume;
let jucator;
let particule;
let lumina;
let luminaVeche = true;
let lampa = new Map();
const camera = { x: 0, y: 0 };
const sapat = { x: -1, y: -1, progres: 0 };
let leganare = 0; // faza loviturii de târnăcop
let inventar;
let selectat = 0;
let unealta = 1;
let pauza = true;
let timp = 0;
let ultimaSalvare = 0;
let terminat = false;
let realizari = new Set();
let culori = {};
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

// ---------- Lumea: nouă, salvată, încărcată ----------
function pregatesteLumea() {
  particule = new Particule();
  culori = {};
  for (const [id, def] of Object.entries(BLOCURI)) culori[id] = culorileSpriteului(def.sprite);
  luminaVeche = true;
  construiesteHotbar();
  actualizeazaButonAtelier();
  actualizeazaCamera(0, true);
}

function lumeNoua() {
  lume = new Lume(Math.floor(Math.random() * 2 ** 31));
  jucator = new Jucator(0, 0);
  laSuprafata();
  inventar = Array.from({ length: 9 }, () => ({ bloc: AER, numar: 0 }));
  inventar[0] = { bloc: TORTA, numar: 4 };
  selectat = 0;
  unealta = 1;
  timp = 0;
  ultimaSalvare = 0;
  terminat = false;
  realizari = new Set();
  sapat.progres = 0;
  pregatesteLumea();
}

// Minerul stă pe cel mai înalt bloc solid din coloana de start.
function laSuprafata() {
  const col = Math.floor(lume.latime / 2);
  let y = 0;
  while (y < lume.inaltime - 1 && !lume.solid(col, y)) y++;
  jucator.x = col * BLOC + 3;
  jucator.y = y * BLOC - jucator.h;
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
      samanta: lume.samanta,
      blocuri: laBase64(lume.blocuri),
      x: jucator.x,
      y: jucator.y,
      inventar,
      selectat,
      unealta,
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
    const d = JSON.parse(localStorage.getItem(SALVARE));
    if (!d) return false;
    const l = new Lume(d.samanta);
    const blocuri = dinBase64(d.blocuri);
    if (blocuri.length !== l.blocuri.length || !Array.isArray(d.inventar) || d.inventar.length !== 9) return false;
    l.blocuri.set(blocuri);
    lume = l;
    jucator = new Jucator(d.x, d.y);
    inventar = d.inventar.map((s) => ({ bloc: s.bloc in BLOCURI ? s.bloc : AER, numar: s.bloc in BLOCURI ? s.numar : 0 }));
    selectat = d.selectat || 0;
    unealta = UNELTE[d.unealta] ? d.unealta : 1;
    timp = d.timp || 0;
    ultimaSalvare = timp;
    terminat = !!d.terminat;
    realizari = new Set(d.realizari || []);
    sapat.progres = 0;
    pregatesteLumea();
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
  camera.y = Math.max(0, Math.min(lume.inaltime * BLOC - inalt, camera.y));
}

// Blocul țintit (sub cursor sau sub deget) și dacă e destul de aproape.
function tintaCurenta() {
  if (!intrare.tinta) return null;
  const wx = Math.round(camera.x * p) / p + (intrare.tinta.x * dpr) / p;
  const wy = Math.round(camera.y * p) / p + (intrare.tinta.y * dpr) / p;
  const x = Math.floor(wx / BLOC);
  const y = Math.floor(wy / BLOC);
  const dx = (x + 0.5) * BLOC - jucator.centruX;
  const dy = (y + 0.5) * BLOC - jucator.ochiY;
  return { x, y, aproape: Math.hypot(dx, dy) <= ATINGERE };
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
  if (acolo === LAVA && !BLOCURI[slot.bloc].solid) return; // lava se acoperă doar cu un bloc plin
  // Un bloc nou se sprijină pe alt bloc sau pe peretele din spate.
  const sprijin = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => lume.get(tinta.x + a, tinta.y + b) !== AER)
    || lume.fundal(tinta.x, tinta.y) !== AER;
  if (!sprijin) return;
  if (BLOCURI[slot.bloc].solid && jucator.atinge(tinta.x, tinta.y)) return;
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
function actualizeazaSlot(i) {
  const s = inventar[i];
  const el = hotbar.children[i];
  const vechi = el.querySelector('canvas');
  if (vechi && (Number(vechi.dataset.bloc) !== s.bloc || !s.numar)) vechi.remove();
  if (s.numar && !el.querySelector('canvas')) {
    iconite[s.bloc] = iconite[s.bloc] || iconita(BLOCURI[s.bloc].sprite);
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    c.dataset.bloc = String(s.bloc);
    c.getContext('2d').drawImage(iconite[s.bloc], 0, 0);
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
      const mic = iconita(BLOCURI[bloc].sprite);
      mic.setAttribute('aria-hidden', 'true');
      bucata.append(mic, `${BLOCURI[bloc].nume} ${are}/${n}`);
      ingrediente.append(bucata);
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
        mesaj(`Crafted a ${UNELTE[unealta].nume.toLowerCase()}`);
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
  const y = coordonataY(rand);
  if (y !== yCurent) {
    yCurent = y;
    hudY.textContent = `Y: ${y}`;
  }
  const col = Math.max(0, Math.min(lume.latime - 1, Math.floor(jucator.centruX / BLOC)));
  let biom = 'Plains';
  if (rand > lume.suprafata[col] + 1) biom = y > 0 ? 'Underground' : y > -48 ? 'Deep caves' : 'Bedrock level';
  if (biom !== biomCurent) {
    biomCurent = biom;
    hudBiom.textContent = biom;
    hudBiom.classList.remove('hud__biom--nou');
    void hudBiom.offsetWidth;
    hudBiom.classList.add('hud__biom--nou');
  }
  // Un sfat, o singură dată, când ajungi prima dată în beznă fără torțe puse.
  const cap = Math.floor(jucator.ochiY / BLOC) * lume.latime + col;
  if (lumina[cap] < 4 && !realizari.has('prima-torta')) mesaj('It’s dark down here. Place a torch, or craft some: coal + log', 'intuneric');
  if (y <= 0) mesaj('Halfway down', 'jumatate');
  if (y <= -60 && !terminat) castiga();
}

// Lava: dacă minerul o atinge, se întoarce la suprafață (cu tot ce are).
function verificaLava() {
  const c0 = Math.floor(jucator.x / BLOC);
  const c1 = Math.floor((jucator.x + jucator.l - 1) / BLOC);
  const r0 = Math.floor(jucator.y / BLOC);
  const r1 = Math.floor((jucator.y + jucator.h - 1) / BLOC);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (lume.get(c, r) !== LAVA) continue;
      particule.explozie(jucator.centruX, jucator.y + jucator.h, culori[LAVA], 24, 90);
      mesaj('You fell into lava! Back to the surface');
      laSuprafata();
      actualizeazaCamera(0, true);
      return;
    }
  }
}

function durata(secunde) {
  const m = Math.floor(secunde / 60);
  const s = Math.floor(secunde % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function castiga() {
  terminat = true;
  const blocuri = inventar.reduce((n, s) => n + s.numar, 0);
  panouFinal.querySelector('.joc__rezultat').textContent =
    `You dug down to bedrock in ${durata(timp)}, with a ${UNELTE[unealta].nume.toLowerCase()} and ${blocuri} ${blocuri === 1 ? 'item' : 'items'} in your hotbar.`;
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
  const opt = { umbra };
  if (adanc && CU_PIATRA.has(bloc)) {
    opt.paleta = PALETA_ADANC;
    opt.numePaleta = 'adanc';
  }
  // Lava licărește: blocurile vecine își schimbă pe rând desenul cu oglindirea lui.
  if (bloc === LAVA) opt.oglindit = ((Math.floor(timp * 1.5) + c + r) & 1) === 1;
  return atlas.imagine(BLOCURI[bloc].sprite, opt);
}

function deseneaza() {
  const W = canvas.width;
  const H = canvas.height;
  const b = BLOC * p;
  const camX = Math.round(camera.x * p);
  const camY = Math.round(camera.y * p);

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
    }
  }

  // Fisurile pe blocul săpat (10 cadre din aceeași foaie ca pe site).
  if (sapat.progres > 0 && sapat.x >= 0) {
    const cadru = Math.min(9, Math.floor(sapat.progres * 10));
    ctx.globalAlpha = 0.85;
    ctx.drawImage(atlas.imagine('fisuri'), cadru * b, 0, b, b, sapat.x * b - camX, sapat.y * b - camY, b, b);
    ctx.globalAlpha = 1;
  }

  deseneazaMinerul(camX, camY);
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
  ctx.drawImage(atlas.imagine(`miner-${cadru}`, { oglindit: stanga }), x, y);

  // Târnăcopul, ținut în mână (coloana 6, rândul 15 din sprite); se leagănă cât sapi.
  const mana = { x: x + (stanga ? 12 - 6.5 : 6.5) * p, y: y + 15 * p };
  const unghi = sapat.progres > 0 || intrare.mina ? -0.2 + Math.sin(leganare) * 0.8 : 0.35;
  ctx.save();
  ctx.translate(mana.x, mana.y);
  if (stanga) ctx.scale(-1, 1);
  ctx.rotate(unghi);
  ctx.drawImage(atlas.imagine('tarnacop', { paleta: UNELTE[unealta].paleta, numePaleta: `unealta-${unealta}` }), -2 * p, -8 * p);
  ctx.restore();
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
    acumulat += dt;
    while (acumulat >= PAS) {
      jucator.actualizeaza(PAS, lume, intrare);
      acumulat -= PAS;
    }
    timp += dt;
    if (intrare.slot !== null) {
      selecteaza(intrare.slot);
      intrare.slot = null;
    }
    if (intrare.roata) {
      selecteaza(selectat + intrare.roata);
      intrare.roata = 0;
    }
    const tinta = tintaCurenta();
    actualizeazaSapat(dt, tinta);
    actualizeazaConstructie(tinta);
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
  return { lume, jucator, camera, inventar, selectat, sapat, p, dpr, timp, pauza, unealta, lumina };
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
