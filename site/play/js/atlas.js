// Atlasul de imagini: fiecare sprite din sprite.js e desenat o singură dată pe un canvas mic, deja la
// mărimea de pe ecran (p pixeli de ecran pe pixel de sprite, număr întreg), ca desenul să rămână clar.
// Jocul le copiază apoi cu drawImage, fără scalare. Variantele (umbrit, oglindit) au câte un canvas propriu.
import { PALETA, SPRITE } from './sprite.js';

export function culoare(variabila, paleta = PALETA) {
  return paleta[variabila] || PALETA[variabila] || '#ff00ff';
}

// Desenează grila unui sprite (întâi baza de sub el), pe rânduri, cu fâșii de aceeași culoare.
export function deseneazaGrila(ctx, id, x, y, p, paleta = PALETA) {
  const s = SPRITE[id];
  if (!s) throw new Error(`Sprite necunoscut: ${id}`);
  if (s.baza) deseneazaGrila(ctx, s.baza, x, y, p, paleta);
  for (let r = 0; r < s.h; r++) {
    const rand = s.grila[r];
    let c = 0;
    while (c < s.l) {
      const ch = rand[c];
      let n = 1;
      while (c + n < s.l && rand[c + n] === ch) n++;
      if (ch !== '.') {
        ctx.fillStyle = culoare(s.culori[ch], paleta);
        ctx.fillRect(x + c * p, y + r * p, n * p, p);
      }
      c += n;
    }
  }
}

// Culorile folosite de un sprite (pentru particulele de la spargere), fără duplicate.
export function culorileSpriteului(id, paleta = PALETA) {
  const s = SPRITE[id];
  const set = new Set();
  if (s.baza) culorileSpriteului(s.baza, paleta).forEach((c) => set.add(c));
  Object.values(s.culori).forEach((v) => set.add(culoare(v, paleta)));
  return [...set];
}

export function creeazaAtlas(p) {
  const cache = new Map();

  // opt: { umbra: 0..1 (strat închis peste sprite), oglindit: întors pe orizontală,
  //        paleta: { variabila: culoare } peste paleta de bază, cu numele ei în opt.numePaleta }
  function imagine(id, opt = {}) {
    const umbra = opt.umbra || 0;
    const oglindit = !!opt.oglindit;
    const cheie = `${id}|${umbra}|${oglindit ? 1 : 0}|${opt.numePaleta || ''}`;
    let c = cache.get(cheie);
    if (c) return c;
    const s = SPRITE[id];
    c = document.createElement('canvas');
    c.width = s.l * p;
    c.height = s.h * p;
    const ctx = c.getContext('2d');
    if (oglindit) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    deseneazaGrila(ctx, id, 0, 0, p, opt.paleta ? { ...PALETA, ...opt.paleta } : PALETA);
    if (umbra) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(8, 6, 14, ${umbra})`;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    cache.set(cheie, c);
    return c;
  }

  return { p, imagine };
}

// O iconiță la mărimea naturală (de ex. 16×16), pentru hotbar și crafting; CSS-ul o mărește pixelat.
export function iconita(id, paleta) {
  const s = SPRITE[id];
  const c = document.createElement('canvas');
  c.width = s.l;
  c.height = s.h;
  deseneazaGrila(c.getContext('2d'), id, 0, 0, 1, paleta ? { ...PALETA, ...paleta } : PALETA);
  return c;
}
