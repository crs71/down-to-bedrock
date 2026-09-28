// Lumina: un nivel de 0 la 15 pe fiecare celulă, ca în jocul original.
// - Lumina cerului (15) coboară drept în jos prin aer până la primul bloc opac, apoi se întinde în lături.
// - Torțele (14) și lava (12) luminează în jurul lor.
// - Fiecare pas prin aer scade lumina cu 1, prin frunze cu 2, printr-un bloc plin cu 4: lumina intră
//   câteva rânduri în pământ și în pereții peșterilor și se stinge treptat (ca într-un joc 2D văzut din lateral),
//   iar peșterile închise, departe de orice sursă, rămân în beznă.
// Totul se recalculează când se schimbă un bloc: lumea are ~34 000 de celule, deci durează câteva ms.
import { BLOCURI, FRUNZE } from './lume.js';

const MAXIM = 15;
const OPAC = new Uint8Array(256);
const EMISIE = new Uint8Array(256);
const ATENUARE = new Uint8Array(256).fill(1);
for (const [id, def] of Object.entries(BLOCURI)) {
  OPAC[id] = def.solid ? 1 : 0;
  EMISIE[id] = def.lumina || 0;
}
ATENUARE[FRUNZE] = 2;
for (let id = 0; id < 256; id++) if (OPAC[id]) ATENUARE[id] = 4;

// Propagarea în lățime (BFS) de la celulele din coadă. Întoarce nimic; modifică `lumina`.
function propaga(lume, lumina, coada) {
  const { latime: L, inaltime: H, blocuri } = lume;
  for (let cap = 0; cap < coada.length; cap++) {
    const i = coada[cap];
    const nivel = lumina[i];
    if (nivel <= 1) continue;
    const x = i % L;
    const y = (i - x) / L;
    for (let k = 0; k < 4; k++) {
      const nx = k === 0 ? x - 1 : k === 1 ? x + 1 : x;
      const ny = k === 2 ? y - 1 : k === 3 ? y + 1 : y;
      if (nx < 0 || nx >= L || ny < 0 || ny >= H) continue;
      const n = ny * L + nx;
      const nou = nivel - ATENUARE[blocuri[n]];
      if (lumina[n] < nou) {
        lumina[n] = nou;
        coada.push(n);
      }
    }
  }
}

export function calculeazaLumina(lume) {
  const { latime: L, inaltime: H, blocuri } = lume;
  const lumina = new Uint8Array(L * H);
  const coada = [];

  // Cerul: pe fiecare coloană, în jos până la primul bloc opac sau până la frunze (inclusiv ele).
  for (let x = 0; x < L; x++) {
    for (let y = 0; y < H; y++) {
      const i = y * L + x;
      const b = blocuri[i];
      lumina[i] = MAXIM;
      coada.push(i);
      if (OPAC[b] || b === FRUNZE) break;
    }
  }

  // Sursele: torțe și lavă.
  for (let i = 0; i < blocuri.length; i++) {
    const e = EMISIE[blocuri[i]];
    if (e > lumina[i]) {
      lumina[i] = e;
      coada.push(i);
    }
  }

  propaga(lume, lumina, coada);
  return lumina;
}

// Lampa de pe casca minerului: o lumină slabă care pornește din celula capului și trece doar prin aer
// (nu se vede prin pereți). Întoarce o hartă index → nivel, doar pentru celulele atinse.
export function luminaLampii(lume, cx, cy, nivel) {
  const { latime: L, inaltime: H, blocuri } = lume;
  const harta = new Map();
  if (cx < 0 || cx >= L || cy < 0 || cy >= H) return harta;
  const start = cy * L + cx;
  harta.set(start, nivel);
  const coada = [start];
  for (let cap = 0; cap < coada.length; cap++) {
    const i = coada[cap];
    const v = harta.get(i);
    if (v <= 1) continue;
    const x = i % L;
    const y = (i - x) / L;
    for (let k = 0; k < 4; k++) {
      const nx = k === 0 ? x - 1 : k === 1 ? x + 1 : x;
      const ny = k === 2 ? y - 1 : k === 3 ? y + 1 : y;
      if (nx < 0 || nx >= L || ny < 0 || ny >= H) continue;
      const n = ny * L + nx;
      const nou = v - 1;
      if ((harta.get(n) || 0) >= nou) continue;
      harta.set(n, nou);
      if (!OPAC[blocuri[n]]) coada.push(n);
    }
  }
  return harta;
}

// Cât de închis e stratul de umbră peste o celulă, pentru fiecare nivel de lumină (0 = beznă).
export const UMBRA = [0.94, 0.9, 0.85, 0.79, 0.72, 0.65, 0.57, 0.49, 0.41, 0.33, 0.25, 0.18, 0.11, 0.06, 0.02, 0]
  .map((a) => (a ? `rgba(8, 6, 14, ${a})` : null));
