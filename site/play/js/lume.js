// Lumile jocului: grile de blocuri (Uint8Array), generate dintr-o sămânță. Sunt două: lumea de sus
// (tip 'lume') și Nether-ul (tip 'nether'), legate printr-un portal.
// Coordonate: coloana x de la stânga, rândul y de sus în jos. În lumea de sus, rândul SUPRAFATA are Y = 64
// (ca pe site), iar ultimul rând are Y = -64, unde e bedrock-ul. Un bloc are 16 pixeli de sprite.

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
// Mina abandonată și portalul
export const SINA = 16;
export const PANZA = 17;
export const GARD = 18;
export const OBSIDIAN = 19;
export const PORTAL = 20;
// Nether
export const NETHERRACK = 21;
export const NYLIUM = 22;
export const NISIP = 23;
export const CUART = 24;
export const RESTURI = 25;
export const GLOWSTONE = 26;
export const CARAMIDA = 27;
export const TULPINA = 28;
export const NEGI = 29;
export const CIUPERCA = 30;
export const LIANE = 31;
export const FOC_SUFLET = 32;
export const RAMA = 33; // rama portalului: arată ca obsidianul, dar treci prin fața ei și nu se sparge
export const CUFAR = 34;
export const CUFAR_DESCHIS = 35;
// Obiecte (doar în hotbar, nu se pun în lume)
export const CREMA = 40;
export const LACRIMA = 41;

// duritate = secunde de săpat cu târnăcopul de lemn; nivel = târnăcopul minim ca blocul să lase ceva
// (1 lemn, 2 piatră, 3 fier, 4 diamant); solid = te oprește; drop = ce primești (implicit blocul însuși,
// null = nimic); lumina = cât luminează (0–15); lichid = nu se sapă, dar se poate acoperi cu un bloc;
// paleta 'nether' = sprite-ul de pe site recolorat ca în Nether; incetineste = cât de încet treci prin el;
// obiect = stă doar în hotbar.
export const BLOCURI = {
  [IARBA]: { nume: 'Grass block', sprite: 'bloc-iarba', duritate: 0.6, solid: true, drop: PAMANT },
  [PAMANT]: { nume: 'Dirt', sprite: 'bloc-pamant', duritate: 0.5, solid: true },
  [PIATRA]: { nume: 'Stone', sprite: 'bloc-piatra', duritate: 1.3, nivel: 1, solid: true },
  [PIETRIS]: { nume: 'Gravel', sprite: 'bloc-pietris', duritate: 0.6, solid: true },
  // Minereurile sclipesc slab în întuneric (lumina 3–6), ca pe site: le vezi și în peșterile neluminate.
  [CARBUNE]: { nume: 'Coal ore', sprite: 'bloc-carbune', duritate: 1.7, nivel: 1, solid: true, lumina: 3, minereu: true },
  [FIER]: { nume: 'Iron ore', sprite: 'bloc-fier', duritate: 2, nivel: 2, solid: true, lumina: 4, minereu: true },
  [AUR]: { nume: 'Gold ore', sprite: 'bloc-aur', duritate: 2.2, nivel: 3, solid: true, lumina: 5, minereu: true },
  [REDSTONE]: { nume: 'Redstone ore', sprite: 'bloc-redstone', duritate: 2.2, nivel: 3, solid: true, lumina: 6, minereu: true },
  [DIAMANT]: { nume: 'Diamond ore', sprite: 'bloc-diamant', duritate: 2.6, nivel: 3, solid: true, lumina: 6, minereu: true },
  [BEDROCK]: { nume: 'Bedrock', sprite: 'bloc-bedrock', duritate: Infinity, solid: true },
  // Copacii sunt decor prin care treci (ca într-un joc 2D), dar se pot tăia.
  [TRUNCHI]: { nume: 'Log', sprite: 'bloc-trunchi', duritate: 0.9, solid: false },
  [FRUNZE]: { nume: 'Leaves', sprite: 'bloc-frunze', duritate: 0.2, solid: false, drop: null },
  [TORTA]: { nume: 'Torch', sprite: 'torta', duritate: 0.05, solid: false, lumina: 14 },
  [SCANDURA]: { nume: 'Planks', sprite: 'bloc-scandura', duritate: 0.9, solid: true },
  [LAVA]: { nume: 'Lava', sprite: 'lava', duritate: Infinity, solid: false, lumina: 12, lichid: true },
  [SINA]: { nume: 'Rail', sprite: 'bloc-sina', duritate: 0.4, solid: false },
  [PANZA]: { nume: 'Cobweb', sprite: 'panza', duritate: 0.4, solid: false, drop: null, incetineste: 0.3 },
  [GARD]: { nume: 'Support beam', sprite: 'gard', duritate: 0.6, solid: false, drop: SCANDURA },
  [OBSIDIAN]: { nume: 'Obsidian', sprite: 'bloc-obsidian', duritate: 9, nivel: 4, solid: true },
  [PORTAL]: { nume: 'Nether portal', sprite: 'portal', duritate: Infinity, solid: false, lumina: 11, lichid: true },
  [NETHERRACK]: { nume: 'Netherrack', sprite: 'bloc-piatra', paleta: 'nether', duritate: 0.5, nivel: 1, solid: true },
  [NYLIUM]: { nume: 'Crimson nylium', sprite: 'bloc-iarba', paleta: 'nether', duritate: 0.5, nivel: 1, solid: true, drop: NETHERRACK },
  [NISIP]: { nume: 'Soul sand', sprite: 'bloc-nisip', duritate: 0.6, solid: true, incetineste: 0.55 },
  [CUART]: { nume: 'Nether quartz ore', sprite: 'bloc-cuart', paleta: 'nether', duritate: 1.4, nivel: 1, solid: true, lumina: 4, minereu: true },
  [RESTURI]: { nume: 'Ancient debris', sprite: 'bloc-resturi', duritate: 6, nivel: 4, solid: true, lumina: 4, minereu: true },
  [GLOWSTONE]: { nume: 'Glowstone', sprite: 'bloc-lumina', paleta: 'nether', duritate: 0.4, solid: true, lumina: 15 },
  [CARAMIDA]: { nume: 'Nether bricks', sprite: 'bloc-caramida', duritate: 2, nivel: 1, solid: true },
  [TULPINA]: { nume: 'Crimson stem', sprite: 'bloc-tulpina', duritate: 0.9, solid: false },
  [NEGI]: { nume: 'Nether wart block', sprite: 'bloc-negi', duritate: 0.3, solid: false },
  [CIUPERCA]: { nume: 'Shroomlight', sprite: 'bloc-lumina-rosie', duritate: 0.3, solid: false, lumina: 15 },
  [LIANE]: { nume: 'Weeping vines', sprite: 'liane', duritate: 0.1, solid: false, drop: null },
  [FOC_SUFLET]: { nume: 'Soul fire', sprite: 'foc-suflet', duritate: 0.05, solid: false, drop: null, lumina: 10 },
  [RAMA]: { nume: 'Portal frame', sprite: 'bloc-obsidian', duritate: Infinity, solid: false, lichid: true },
  // Cuferele din mină: o atingere le deschide (joc.js împarte prada); cel deschis se poate sparge.
  [CUFAR]: { nume: 'Chest', sprite: 'cufar', duritate: Infinity, solid: false, cufar: true },
  [CUFAR_DESCHIS]: { nume: 'Open chest', sprite: 'cufar-deschis', duritate: 0.8, solid: false, drop: SCANDURA },
  [CREMA]: { nume: 'Magma cream', sprite: 'crema-magma', obiect: true },
  [LACRIMA]: { nume: 'Ghast tear', sprite: 'lacrima-ghast', obiect: true },
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
  constructor(samanta, tip = 'lume') {
    this.samanta = samanta;
    this.tip = tip;
    this.latime = tip === 'nether' ? 160 : 200;
    this.inaltime = tip === 'nether' ? 72 : SUPRAFATA + (Y_MAXIM - Y_MINIM) + 1;
    this.ambient = tip === 'nether' ? 7 : 0; // lumina minimă: Nether-ul nu e niciodată în beznă totală
    this.blocuri = new Uint8Array(this.latime * this.inaltime);
    this.suprafata = new Int16Array(this.latime); // rândul blocului de iarbă, pe fiecare coloană
    this.pamant = new Int16Array(this.latime);    // ultimul rând de pământ, pe fiecare coloană
    this.portal = null;     // colțul din stânga-sus al ramei de obsidian { x, y }
    this.start = null;      // unde apare minerul { x, y } (celula picioarelor)
    this.vagonete = [];     // vagonetele de pe șine { x, y }
    this.mobi = [];         // locurile de apariție ale mobilor { tip, x, y }
    if (tip === 'nether') this.genereazaNether();
    else this.genereaza();
  }

  get(x, y) {
    if (x < 0 || x >= this.latime || y >= this.inaltime) return BEDROCK;
    if (y < 0) return this.tip === 'nether' ? BEDROCK : AER;
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

  // Peretele din spate, vizibil unde ai săpat: pământ sau piatră (netherrack în Nether); deasupra solului, cer.
  fundal(x, y) {
    if (this.tip === 'nether') return NETHERRACK;
    if (x < 0 || x >= this.latime || y <= this.suprafata[x]) return AER;
    return y <= this.pamant[x] ? PAMANT : PIATRA;
  }

  // Stratul adânc începe la Y_ADANC, cu o margine zimțată de 3 rânduri.
  adanc(x, y) {
    if (this.tip === 'nether') return false;
    const r = randul(Y_ADANC);
    return y > r || (y > r - 3 && hash(x, y) < (y - (r - 3)) / 3);
  }

  // Un dreptunghi de celule, umplut cu același bloc.
  umple(x0, y0, x1, y1, bloc) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, bloc);
  }

  // Rama de obsidian 4×5 cu colțul din stânga-sus în (x, y) și portalul de 2×3 în mijloc. Văzută din lateral,
  // prin ramă trebuie să poți intra: doar rândul de jos e obsidian plin, restul e RAMA, prin care treci.
  construiestePortal(x, y) {
    this.umple(x, y, x + 3, y + 3, RAMA);
    this.umple(x, y + 4, x + 3, y + 4, OBSIDIAN);
    this.umple(x + 1, y + 1, x + 2, y + 3, PORTAL);
    this.portal = { x, y };
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

    // Minereuri și buzunare de pietriș, în vine, fiecare de la o anumită adâncime în jos. Aproape jumătate
    // din vine pornesc de pe peretele unei peșteri, ca să se vadă când explorezi.
    const vine = [
      { bloc: PIETRIS, yMax: 56, incercari: 80, marime: [4, 9] },
      { bloc: CARBUNE, yMax: 62, incercari: 280, marime: [4, 8] },
      { bloc: FIER, yMax: 52, incercari: 240, marime: [3, 7] },
      { bloc: AUR, yMax: 16, incercari: 100, marime: [3, 5] },
      { bloc: REDSTONE, yMax: -8, incercari: 90, marime: [3, 7] },
      { bloc: DIAMANT, yMax: -32, incercari: 60, marime: [2, 4] },
    ];
    const pePerete = (x, y) => this.get(x, y) === PIATRA
      && (this.get(x - 1, y) === AER || this.get(x + 1, y) === AER || this.get(x, y - 1) === AER || this.get(x, y + 1) === AER);
    for (const v of vine) {
      const randMin = randul(v.yMax);
      for (let i = 0; i < v.incercari; i++) {
        let x = Math.floor(rng() * latime);
        let y = randMin + Math.floor(rng() * (inaltime - 4 - randMin));
        if (rng() < 0.45) {
          for (let k = 0; k < 14 && !pePerete(x, y); k++) {
            x = Math.floor(rng() * latime);
            y = randMin + Math.floor(rng() * (inaltime - 4 - randMin));
          }
        }
        const n = v.marime[0] + Math.floor(rng() * (v.marime[1] - v.marime[0] + 1));
        for (let k = 0; k < n; k++) {
          if (this.get(x, y) === PIATRA) this.set(x, y, v.bloc);
          x += Math.floor(rng() * 3) - 1;
          y += Math.floor(rng() * 3) - 1;
        }
      }
    }

    this.genereazaMina(rng);

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

    const col = Math.floor(latime / 2);
    this.start = { x: col, y: this.suprafata[col] - 1 };
  }

  // Mina abandonată: tuneluri de 4 rânduri cu șine pe jos, stâlpi și grinzi la fiecare 6 coloane,
  // pânze și câteva torțe. Tunelul principal trece pe sub locul de start (Y 8), are un vagonet
  // chiar dedesubt și se termină într-o cameră cu portalul spre Nether.
  genereazaMina(rng) {
    const col = Math.floor(this.latime / 2);
    const tunele = [
      { y: randul(8), x0: 34, x1: 170, principal: true },
      { y: randul(-8 - Math.floor(rng() * 10)), x0: 8 + Math.floor(rng() * 30), lungime: 45 + Math.floor(rng() * 30) },
      { y: randul(26 + Math.floor(rng() * 8)), x0: 110 + Math.floor(rng() * 30), lungime: 35 + Math.floor(rng() * 25) },
      { y: randul(-26 - Math.floor(rng() * 8)), x0: 95 + Math.floor(rng() * 40), lungime: 40 + Math.floor(rng() * 20) },
      { y: randul(44 + Math.floor(rng() * 6)), x0: 10 + Math.floor(rng() * 30), lungime: 30 + Math.floor(rng() * 20) },
    ];
    for (const t of tunele) {
      const x1 = Math.min(this.latime - 3, t.x1 || t.x0 + t.lungime);
      // Întâi tot tunelul, apoi decorul, ca grinzile și torțele să nu fie șterse de coloana următoare.
      for (let x = t.x0; x <= x1; x++) {
        this.umple(x, t.y - 3, x, t.y, AER);
        if (!this.solid(x, t.y + 1)) this.set(x, t.y + 1, SCANDURA); // pod peste goluri
        this.set(x, t.y, SINA);
      }
      for (let x = t.x0 + 1; x < x1; x++) {
        if (x % 6 === 0) {
          this.umple(x, t.y - 2, x, t.y - 1, GARD);
          this.umple(x - 1, t.y - 3, x + 1, t.y - 3, SCANDURA);
          if (x % 18 === 0) this.set(x + 1, t.y - 2, TORTA);
        } else if ((x % 6 === 1 || x % 6 === 5) && rng() < 0.3) {
          this.set(x, t.y - 2, PANZA);
        }
      }
      if (t.principal) {
        // Camera portalului, la capătul tunelului, cu un cufăr în colț; alt cufăr la începutul șinelor.
        this.umple(x1 + 1, t.y - 5, x1 + 7, t.y, AER);
        this.umple(x1 + 1, t.y + 1, x1 + 7, t.y + 1, PIATRA);
        this.construiestePortal(x1 + 2, t.y - 4);
        this.set(x1 + 7, t.y, CUFAR);
        this.set(t.x0, t.y, CUFAR);
        this.vagonete.push({ x: col, y: t.y });
      } else {
        // Tunelurile laterale n-au vagonet: câte un cufăr la capete și, uneori, unul pe drum.
        this.set(t.x0, t.y, CUFAR);
        this.set(x1, t.y, CUFAR);
        if (rng() < 0.6) this.set(t.x0 + Math.floor((x1 - t.x0) / 2) + 1, t.y, CUFAR);
      }
    }
  }

  // Nether-ul: caverne mari de netherrack între două straturi de bedrock, un ocean de lavă jos și patru
  // zone: Nether Wastes, Crimson Forest, un pod al fortăreței peste lavă și Soul Sand Valley.
  genereazaNether() {
    const rng = aleator(this.samanta ^ 0x5eed);
    const caverne = zgomot(rng);
    const { latime, inaltime } = this;
    const LAVA_DE_LA = 54;

    for (let x = 0; x < latime; x++) {
      for (let y = 0; y < inaltime; y++) {
        let b = NETHERRACK;
        const v = caverne(x / 16, y / 9) * 0.7 + caverne(x / 6 + 50, y / 5) * 0.3;
        if (y > 3 && y < inaltime - 4 && v > 0.5) b = AER;
        if (b === AER && y >= LAVA_DE_LA) b = LAVA;
        if (y < 2 || y >= inaltime - 2 || (y < 4 && rng() < 0.4) || (y >= inaltime - 4 && rng() < 0.4)) b = BEDROCK;
        this.set(x, y, b);
      }
    }

    // Camera de sosire, cu portalul de întoarcere și un tunel spre dreapta până dă de o cavernă.
    this.umple(4, 30, 18, 38, AER);
    this.umple(4, 39, 18, 40, NETHERRACK);
    this.construiestePortal(7, 34);
    this.start = { x: 13, y: 38 };
    for (let x = 19; x < 60; x++) {
      const liber = this.get(x, 37) === AER && this.get(x, 36) === AER;
      this.umple(x, 36, x, 38, AER);
      if (!this.solid(x, 39)) this.set(x, 39, NETHERRACK);
      if (liber && x > 24) break;
    }

    const zona = (x) => (x < 40 ? 'wastes' : x < 80 ? 'crimson' : x < 115 ? 'fortress' : 'soul');

    // Podele și tavane: nylium și ciuperci în pădure, nisip de suflete și foc albastru în vale,
    // glowstone pe tavane, liane în pădure.
    let ultimaCiuperca = -10;
    for (let x = 1; x < latime - 1; x++) {
      for (let y = 4; y < LAVA_DE_LA; y++) {
        if (this.get(x, y) !== AER) continue;
        const z = zona(x);
        if (this.get(x, y + 1) === NETHERRACK) {
          if (z === 'crimson') {
            this.set(x, y + 1, NYLIUM);
            if (x - ultimaCiuperca > 4 && rng() < 0.18) {
              ultimaCiuperca = x;
              this.ciuperca(x, y, rng);
            }
          } else if (z === 'soul') {
            this.umple(x, y + 1, x, y + 2, NISIP);
            if (rng() < 0.08) this.set(x, y, FOC_SUFLET);
          }
          if (z !== 'crimson' && rng() < 0.03) this.mobi.push({ tip: 'magma', x, y });
          if (z === 'crimson' && rng() < 0.04) this.mobi.push({ tip: 'piglin', x, y });
        }
        if (this.get(x, y - 1) === NETHERRACK) {
          if (rng() < 0.035) {
            let gx = x;
            let gy = y - 1;
            for (let k = 0; k < 6; k++) {
              if (this.get(gx, gy) === NETHERRACK) this.set(gx, gy, GLOWSTONE);
              gx += Math.floor(rng() * 3) - 1;
              gy -= Math.floor(rng() * 2);
            }
          } else if (z === 'crimson' && rng() < 0.12) {
            const n = 1 + Math.floor(rng() * 4);
            for (let k = 0; k < n && this.get(x, y + k) === AER; k++) this.set(x, y + k, LIANE);
          }
        }
      }
    }

    // Cuarț în vine și resturi antice, rare, aproape de lavă.
    for (let i = 0; i < 90; i++) {
      let x = Math.floor(rng() * latime);
      let y = 4 + Math.floor(rng() * (inaltime - 8));
      for (let k = 0; k < 2 + Math.floor(rng() * 4); k++) {
        if (this.get(x, y) === NETHERRACK) this.set(x, y, CUART);
        x += Math.floor(rng() * 3) - 1;
        y += Math.floor(rng() * 3) - 1;
      }
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rng() * latime);
      const y = 40 + Math.floor(rng() * 20);
      if (this.get(x, y) === NETHERRACK) this.set(x, y, RESTURI);
    }

    // Podul fortăreței: cărămidă peste lavă, pe stâlpi până jos.
    const pod = 44;
    this.umple(82, pod - 3, 113, pod - 1, AER);
    this.umple(82, pod, 113, pod, CARAMIDA);
    for (let x = 86; x <= 110; x += 8) {
      for (let y = pod + 1; y < inaltime - 2 && !this.solid(x, y); y++) this.set(x, y, CARAMIDA);
    }

    // Mobii: strideri pe lavă, ghaști în cavernele largi.
    for (let x = 3; x < latime - 3; x++) {
      const y = LAVA_DE_LA - 1;
      if (this.get(x, y) === AER && this.get(x, y + 1) === LAVA && rng() < 0.03) this.mobi.push({ tip: 'strider', x, y });
    }
    let ghasti = 0;
    for (let i = 0; i < 400 && ghasti < 4; i++) {
      const x = 30 + Math.floor(rng() * (latime - 40));
      const y = 8 + Math.floor(rng() * 36);
      let liber = true;
      for (let dy = -2; dy <= 3 && liber; dy++) for (let dx = -2; dx <= 3 && liber; dx++) if (this.get(x + dx, y + dy) !== AER) liber = false;
      if (liber) {
        this.mobi.push({ tip: 'ghast', x, y });
        ghasti += 1;
      }
    }
  }

  // O ciupercă purpurie uriașă: tulpină de 3–5 blocuri și o pălărie de negi cu ciuperci luminoase.
  ciuperca(x, y, rng) {
    const inalt = 3 + Math.floor(rng() * 3);
    let varf = y;
    for (let k = 0; k < inalt && this.get(x, y - k) === AER; k++) {
      this.set(x, y - k, TULPINA);
      varf = y - k;
    }
    for (let dy = -2; dy <= 0; dy++) {
      const lat = dy === -2 ? 1 : 2;
      for (let dx = -lat; dx <= lat; dx++) {
        const cx = x + dx;
        const cy = varf - 1 + dy;
        if (this.get(cx, cy) === AER) this.set(cx, cy, rng() < 0.15 ? CIUPERCA : NEGI);
      }
    }
  }
}
