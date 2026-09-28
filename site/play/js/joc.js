// Down to Bedrock: jocul. Bucla principală: fizica la pas fix (1/120 s), apoi săpatul, construitul,
// camera și desenul pe canvas. Sprite-urile sunt aceleași ca pe site (unelte/sprite → sprite.js).
import { creeazaAtlas, culorileSpriteului, iconita } from './atlas.js';
import {
  Lume, BLOC, BLOCURI, AER, SUPRAFATA, coordonataY,
  CARBUNE, FIER, AUR, REDSTONE, DIAMANT,
} from './lume.js';
import { Jucator } from './jucator.js';
import { creeazaIntrare } from './control.js';
import { Particule } from './particule.js';

const canvas = document.querySelector('.joc__ecran');
const ctx = canvas.getContext('2d', { alpha: false });
const intrare = creeazaIntrare(canvas, document.querySelector('.joc__butoane'));
const hudY = document.querySelector('.hud__y');
const hudBiom = document.querySelector('.hud__biom');
const hotbar = document.querySelector('.hotbar');
const meniu = document.querySelector('.joc__meniu');
const panouStart = meniu.querySelector('.joc__panou--start');
const panouFinal = meniu.querySelector('.joc__panou--final');
const butonJoaca = meniu.querySelector('.joc__joaca');
const mesaje = document.querySelector('.joc__mesaje');

const ATINGERE = 4.5 * BLOC;  // raza de săpat și construit, măsurată de la ochii minerului
const PAS = 1 / 120;
const SOARE = { '--soare-1': '#ffffff', '--soare-2': '#fee761', '--soare-3': '#feae34' };
const NORI = [
  { id: 'nor-mare', x: 30, y: 6 }, { id: 'nor-mediu', x: 70, y: 11 }, { id: 'nor-mic', x: 110, y: 4 },
  { id: 'nor-mare', x: 150, y: 9 }, { id: 'nor-mediu', x: 190, y: 5 }, { id: 'nor-mic', x: 235, y: 12 },
];
const MINEREURI = {
  [CARBUNE]: 'Coal for your torches',
  [FIER]: 'Found some iron',
  [AUR]: 'Shiny! Gold ore',
  [REDSTONE]: 'Redstone, glowing red',
  [DIAMANT]: 'Diamonds!',
};

let dpr = 1;
let p = 0;
let atlas = null;
let dither = null;
let lume;
let jucator;
let particule;
const camera = { x: 0, y: 0 };
const sapat = { x: -1, y: -1, progres: 0 };
let leganare = 0; // faza loviturii de târnăcop
let inventar;
let selectat = 0;
let pauza = true;
let timp = 0;
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

// ---------- O lume nouă ----------
function lumeNoua() {
  lume = new Lume(Math.floor(Math.random() * 2 ** 31));
  const col = Math.floor(lume.latime / 2);
  jucator = new Jucator(col * BLOC + 3, lume.suprafata[col] * BLOC - 27);
  particule = new Particule();
  inventar = Array.from({ length: 9 }, () => ({ bloc: AER, numar: 0 }));
  selectat = 0;
  timp = 0;
  terminat = false;
  realizari = new Set();
  sapat.progres = 0;
  culori = {};
  for (const [id, def] of Object.entries(BLOCURI)) culori[id] = culorileSpriteului(def.sprite);
  construiesteHotbar();
  actualizeazaCamera(0, true);
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
  if (!intrare.mina || !tinta || !tinta.aproape || bloc === AER || tinta.y < 0
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
  sapat.progres += dt / def.duritate;
  if (sapat.progres >= 1) sparge(tinta.x, tinta.y, bloc);
}

function sparge(x, y, bloc) {
  const def = BLOCURI[bloc];
  lume.set(x, y, AER);
  sapat.progres = 0;
  particule.explozie((x + 0.5) * BLOC, (y + 0.5) * BLOC, culori[bloc]);
  const drop = def.drop === undefined ? bloc : def.drop;
  if (drop !== null) adauga(drop);
  mesaj('First block broken', 'primul');
  if (MINEREURI[bloc]) mesaj(MINEREURI[bloc], `minereu-${bloc}`);
}

// ---------- Construitul ----------
function actualizeazaConstructie(tinta) {
  if (!intrare.pune) return;
  intrare.pune = false;
  if (!tinta || !tinta.aproape || lume.get(tinta.x, tinta.y) !== AER || tinta.y < 0) return;
  const slot = inventar[selectat];
  if (!slot.numar) {
    mesaj('Pick a block from the hotbar to build', 'fara-bloc');
    return;
  }
  // Un bloc nou se sprijină pe alt bloc sau pe peretele din spate.
  const sprijin = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => lume.get(tinta.x + a, tinta.y + b) !== AER)
    || lume.fundal(tinta.x, tinta.y) !== AER;
  if (!sprijin) return;
  if (BLOCURI[slot.bloc].solid && jucator.atinge(tinta.x, tinta.y)) return;
  lume.set(tinta.x, tinta.y, slot.bloc);
  slot.numar -= 1;
  if (!slot.numar) slot.bloc = AER;
  actualizeazaSlot(inventar.indexOf(slot));
}

// ---------- Inventarul și hotbar-ul ----------
function adauga(bloc) {
  let slot = inventar.find((s) => s.bloc === bloc && s.numar > 0 && s.numar < 64);
  if (!slot) slot = inventar.find((s) => !s.numar);
  if (!slot) return;
  slot.bloc = bloc;
  slot.numar += 1;
  const i = inventar.indexOf(slot);
  actualizeazaSlot(i);
  const el = hotbar.children[i];
  el.classList.remove('hotbar__slot--nou');
  void el.offsetWidth; // repornește animația
  el.classList.add('hotbar__slot--nou');
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
  if (vechi && Number(vechi.dataset.bloc) !== s.bloc) vechi.remove();
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

function selecteaza(i) {
  const vechi = selectat;
  selectat = (i + 9) % 9;
  actualizeazaSlot(vechi);
  actualizeazaSlot(selectat);
}

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
  if (y <= 0) mesaj('Halfway down', 'jumatate');
  if (y <= -60 && !terminat) castiga();
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
    `You dug down to bedrock in ${durata(timp)}, with ${blocuri} ${blocuri === 1 ? 'block' : 'blocks'} in your hotbar.`;
  arataMeniu(panouFinal);
}

// ---------- Meniul ----------
function arataMeniu(panou = panouStart) {
  pauza = true;
  intrare.mina = false;
  panouStart.hidden = panou !== panouStart;
  panouFinal.hidden = panou !== panouFinal;
  meniu.hidden = false;
  panou.querySelector('button').focus({ preventScroll: true });
}

function ascundeMeniu() {
  meniu.hidden = true;
  pauza = false;
  butonJoaca.textContent = 'Resume';
  mesaj('Dig all the way down to bedrock', 'start');
}

butonJoaca.addEventListener('click', ascundeMeniu);
meniu.querySelectorAll('.joc__nou').forEach((b) => b.addEventListener('click', () => {
  lumeNoua();
  ascundeMeniu();
}));
meniu.querySelector('.joc__continua').addEventListener('click', ascundeMeniu);
document.querySelector('.joc__pauza').addEventListener('click', () => arataMeniu());
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape') return;
  if (meniu.hidden) arataMeniu();
  else if (!panouStart.hidden) ascundeMeniu();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && meniu.hidden) arataMeniu();
});

// ---------- Desenul ----------
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
  const c0 = Math.floor(camX / b);
  const c1 = Math.floor((camX + W) / b);
  const r0 = Math.floor(camY / b);
  const r1 = Math.floor((camY + H) / b);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const x = c * b - camX;
      const y = r * b - camY;
      const bloc = lume.get(c, r);
      if (bloc === AER || !BLOCURI[bloc].solid) {
        const f = lume.fundal(c, r);
        if (f !== AER) ctx.drawImage(atlas.imagine(BLOCURI[f].sprite, { umbra: 0.62 }), x, y);
      }
      if (bloc !== AER) ctx.drawImage(atlas.imagine(BLOCURI[bloc].sprite), x, y);
    }
  }

  // Fisurile pe blocul săpat (10 cadre din aceeași foaie ca pe site).
  if (sapat.progres > 0 && sapat.x >= 0) {
    const cadru = Math.min(9, Math.floor(sapat.progres * 10));
    ctx.globalAlpha = 0.85;
    ctx.drawImage(atlas.imagine('fisuri'), cadru * b, 0, b, b, sapat.x * b - camX, sapat.y * b - camY, b, b);
    ctx.globalAlpha = 1;
  }

  // Conturul blocului țintit, doar dacă e la îndemână.
  const tinta = tintaCurenta();
  if (tinta && tinta.aproape && meniu.hidden) {
    ctx.strokeStyle = 'rgba(24, 20, 37, 0.9)';
    ctx.lineWidth = p;
    ctx.strokeRect(tinta.x * b - camX + p / 2, tinta.y * b - camY + p / 2, b - p, b - p);
  }

  deseneazaMinerul(camX, camY);
  particule.deseneaza(ctx, camX, camY, p);
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
  ctx.drawImage(atlas.imagine('tarnacop'), -2 * p, -8 * p);
  ctx.restore();
}

// ---------- Bucla ----------
let ultim = 0;
let acumulat = 0;

function cadru(acum) {
  requestAnimationFrame(cadru);
  const dt = Math.min(0.05, ultim ? (acum - ultim) / 1000 : 0);
  ultim = acum;
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
    particule.actualizeaza(dt);
    actualizeazaCamera(dt);
    actualizeazaHud();
  } else {
    intrare.pune = false;
  }
  deseneaza();
}

// Starea curentă, doar pentru verificări din consolă: (await import('./js/joc.js')).stare().
export function stare() {
  return { lume, jucator, camera, inventar, selectat, sapat, p, dpr, timp, pauza };
}

window.addEventListener('resize', redimensioneaza);
redimensioneaza();
lumeNoua();
actualizeazaHud();
arataMeniu();
requestAnimationFrame(cadru);
