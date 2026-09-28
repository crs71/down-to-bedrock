// Lumea jocului: o grilă de blocuri (Uint8Array), generată dintr-o sămânță.
// Coordonate: coloana x de la stânga, rândul y de sus în jos. Rândul SUPRAFATA are Y = 64 (ca pe site),
// iar ultimul rând are Y = -64, unde e bedrock-ul. Un bloc are 16 pixeli de sprite.

export const BLOC = 16;
export const SUPRAFATA = 40;
export const Y_MAXIM = 64;
export const Y_MINIM = -64;
export const Y_ADANC = 0; // de aici în jos, piatra e mai închisă (stratul adânc)

export const AER = 0;
export const IARBA = 1;
export const PAMANT = 2;
export const PIATRA = 3;
export const PIETRIS = 4;
export const CARBUNE = 5;
export const FIER = 6;
export const AUR = 7;
export const REDSTONE = 8;
export const DIAMANT = 9;
export const BEDROCK = 10;
export const TRUNCHI = 11;
export const FRUNZE = 12;
export const TORTA = 13;
export const SCANDURA = 14;
export const LAVA = 15;

// duritate = secunde de săpat cu târnăcopul de lemn; nivel = târnăcopul minim ca blocul să lase ceva
// (1 lemn, 2 piatră, 3 fier); solid = te oprește; drop = ce primești (implicit blocul însuși, null = nimic);
// lumina = cât luminează (0–15); lichid = nu se sapă, dar se poate acoperi cu un bloc.
export const BLOCURI = {
  [IARBA]: { nume: 'Grass block', sprite: 'bloc-iarba', duritate: 0.6, solid: true, drop: PAMANT },
  [PAMANT]: { nume: 'Dirt', sprite: 'bloc-pamant', duritate: 0.5, solid: true },
  [PIATRA]: { nume: 'Stone', sprite: 'bloc-piatra', duritate: 1.3, nivel: 1, solid: true },
  [PIETRIS]: { nume: 'Gravel', sprite: 'bloc-pietris', duritate: 0.6, solid: true },
  [CARBUNE]: { nume: 'Coal ore', sprite: 'bloc-carbune', duritate: 1.7, nivel: 1, solid: true },
  [FIER]: { nume: 'Iron ore', sprite: 'bloc-fier', duritate: 2, nivel: 2, solid: true },
  [AUR]: { nume: 'Gold ore', sprite: 'bloc-aur', duritate: 2.2, nivel: 3, solid: true },
  [REDSTONE]: { nume: 'Redstone ore', sprite: 'bloc-redstone', duritate: 2.2, nivel: 3, solid: true },
  [DIAMANT]: { nume: 'Diamond ore', sprite: 'bloc-diamant', duritate: 2.6, nivel: 3, solid: true },
  [BEDROCK]: { nume: 'Bedrock', sprite: 'bloc-bedrock', duritate: Infinity, solid: true },
  // Copacii sunt decor prin care treci (ca într-un joc 2D), dar se pot tăia.
  [TRUNCHI]: { nume: 'Log', sprite: 'bloc-trunchi', duritate: 0.9, solid: false },
  [FRUNZE]: { nume: 'Leaves', sprite: 'bloc-frunze', duritate: 0.2, solid: false, drop: null },
  [TORTA]: { nume: 'Torch', sprite: 'torta', duritate: 0.05, solid: false, lumina: 14 },
  [SCANDURA]: { nume: 'Planks', sprite: 'bloc-scandura', duritate: 0.9, solid: true },
  [LAVA]: { nume: 'Lava', sprite: 'lava', duritate: Infinity, solid: false, lumina: 12, lichid: true },
};

// Piatra din stratul adânc: aceleași sprite-uri, cu rampa pietrei coborâtă o treaptă.
export const PALETA_ADANC = {
  '--piatra-1': '#8b9bb4',
  '--piatra-2': '#5a6988',
  '--piatra-3': '#3a4466',
  '--piatra-4': '#262b44',
};

export const coordonataY = (rand) => Y_MAXIM - (rand - SUPRAFATA);
export const randul = (y) => SUPRAFATA + (Y_MAXIM - y);

// Generator de numere pseudo-aleatoare cu sămânță (mulberry32): aceeași sămânță, aceeași lume.
export function aleator(samanta) {
  let a = samanta >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Un număr stabil între 0 și 1 pentru fiecare celulă (pentru marginea zimțată dintre straturi).
function hash(x, y) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Zgomot de valoare, netezit: 1D pentru relief, 2D pentru peșteri. Valori între 0 și 1.
function zgomot(rng) {
  const N = 256;
  const valori = new Float32Array(N * N);
  for (let i = 0; i < valori.length; i++) valori[i] = rng();
  const neted = (t) => t * t * (3 - 2 * t);
  const v = (x, y) => valori[(((y % N) + N) % N) * N + (((x % N) + N) % N)];
  return (x, y = 0) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = neted(x - x0);
    const ty = neted(y - y0);
    const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * tx;
    const b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * tx;
    return a + (b - a) * ty;
  };
}

export class Lume {
  constructor(samanta, latime = 200) {
    this.samanta = samanta;
    this.latime = latime;
    this.inaltime = SUPRAFATA + (Y_MAXIM - Y_MINIM) + 1;
    this.blocuri = new Uint8Array(this.latime * this.inaltime);
    this.suprafata = new Int16Array(this.latime); // rândul blocului de iarbă, pe fiecare coloană
    this.pamant = new Int16Array(this.latime);    // ultimul rând de pământ, pe fiecare coloană
    this.genereaza();
  }

  get(x, y) {
    if (x < 0 || x >= this.latime || y >= this.inaltime) return BEDROCK;
    if (y < 0) return AER;
    return this.blocuri[y * this.latime + x];
  }

  set(x, y, bloc) {
    if (x < 0 || x >= this.latime || y < 0 || y >= this.inaltime) return;
    this.blocuri[y * this.latime + x] = bloc;
  }

  solid(x, y) {
    const b = this.get(x, y);
    return b !== AER && BLOCURI[b].solid;
  }

  // Peretele din spate, vizibil unde ai săpat: pământ sau piatră; deasupra solului nu e nimic (cer).
  fundal(x, y) {
    if (x < 0 || x >= this.latime || y <= this.suprafata[x]) return AER;
    return y <= this.pamant[x] ? PAMANT : PIATRA;
  }

  // Stratul adânc începe la Y_ADANC, cu o margine zimțată de 3 rânduri.
  adanc(x, y) {
    const r = randul(Y_ADANC);
    return y > r || (y > r - 3 && hash(x, y) < (y - (r - 3)) / 3);
  }

  genereaza() {
    const rng = aleator(this.samanta);
    const relief = zgomot(rng);
    const pesteri = zgomot(rng);
    const { latime, inaltime } = this;

    // Relieful: dealuri line, cu mici denivelări.
    for (let x = 0; x < latime; x++) {
      const h = (relief(x / 28) - 0.5) * 12 + (relief(x / 7, 50) - 0.5) * 4;
      this.suprafata[x] = SUPRAFATA + Math.round(h);
      this.pamant[x] = this.suprafata[x] + 3 + Math.round(relief(x / 11, 90) * 2);
    }

    for (let x = 0; x < latime; x++) {
      for (let y = 0; y < inaltime; y++) {
        let b = AER;
        const s = this.suprafata[x];
        if (y === s) b = IARBA;
        else if (y > s && y <= this.pamant[x]) b = PAMANT;
        else if (y > this.pamant[x]) b = PIATRA;

        // Peșteri: zgomot 2D întins pe orizontală, mai largi spre adânc; nu chiar sub iarbă.
        if (b !== AER && y > s + 5 && y < inaltime - 4) {
          const adanc = (y - s) / (inaltime - s);
          const v = pesteri(x / 13, y / 7) * 0.75 + pesteri(x / 5 + 100, y / 4) * 0.25;
          if (v > 0.66 - adanc * 0.09) b = AER;
        }
        this.set(x, y, b);
      }
    }

    // Minereuri și buzunare de pietriș, în vine, fiecare de la o anumită adâncime în jos.
    const vine = [
      { bloc: PIETRIS, yMax: 56, incercari: 70, marime: [4, 9] },
      { bloc: CARBUNE, yMax: 60, incercari: 150, marime: [3, 7] },
      { bloc: FIER, yMax: 40, incercari: 110, marime: [2, 5] },
      { bloc: AUR, yMax: 4, incercari: 45, marime: [2, 4] },
      { bloc: REDSTONE, yMax: -16, incercari: 45, marime: [3, 6] },
      { bloc: DIAMANT, yMax: -40, incercari: 22, marime: [1, 3] },
    ];
    for (const v of vine) {
      const randMin = randul(v.yMax);
      for (let i = 0; i < v.incercari; i++) {
        let x = Math.floor(rng() * latime);
        let y = randMin + Math.floor(rng() * (inaltime - 4 - randMin));
        const n = v.marime[0] + Math.floor(rng() * (v.marime[1] - v.marime[0] + 1));
        for (let k = 0; k < n; k++) {
          if (this.get(x, y) === PIATRA) this.set(x, y, v.bloc);
          x += Math.floor(rng() * 3) - 1;
          y += Math.floor(rng() * 3) - 1;
        }
      }
    }

    // Lacuri de lavă pe fundul peșterilor adânci: un rând, cât ține podeaua (cel mult 9 blocuri).
    for (let y = randul(-30); y < inaltime - 4; y++) {
      for (let x = 1; x < latime - 1; x++) {
        if (this.get(x, y) !== AER || !this.solid(x, y + 1) || rng() > 0.05) continue;
        for (let k = x, n = 0; n < 9 && this.get(k, y) === AER && this.solid(k, y + 1); k++, n++) {
          this.set(k, y, LAVA);
        }
      }
    }

    // Bedrock: ultimul rând plin, cele trei de deasupra tot mai rare.
    for (let x = 0; x < latime; x++) {
      this.set(x, inaltime - 1, BEDROCK);
      [0.6, 0.35, 0.15].forEach((sansa, i) => {
        if (rng() < sansa) this.set(x, inaltime - 2 - i, BEDROCK);
      });
    }

    // Copaci pe iarbă, la cel puțin 5 coloane unul de altul.
    let ultimul = -10;
    for (let x = 3; x < latime - 3; x++) {
      if (x - ultimul < 5 || rng() > 0.12 || this.get(x, this.suprafata[x]) !== IARBA) continue;
      if (Math.abs(x - latime / 2) < 3) continue; // locul de start rămâne liber
      ultimul = x;
      const baza = this.suprafata[x] - 1;
      const inalt = 4 + Math.floor(rng() * 2);
      const varf = baza - inalt + 1;
      for (let dy = -2; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const colt = Math.abs(dx) === 2 && (dy === -2 || dy === 1);
          if (colt && rng() < 0.7) continue;
          if (dy === -2 && Math.abs(dx) === 2) continue;
          if (this.get(x + dx, varf + dy) === AER) this.set(x + dx, varf + dy, FRUNZE);
        }
      }
      for (let y = baza; y >= varf; y--) this.set(x, y, TRUNCHI);
    }
  }
}
