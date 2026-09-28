// Mobii și vagonetul. Fiecare are actualizeaza(dt, lume, j) și deseneaza(ctx, atlas, camX, camY, p, timp);
// cei cu care poți interacționa au și loveste(j). `j` e legătura cu jocul (joc.js): minerul, intrarea,
// lista de mobi, hotbar-ul, mesajele, exploziile și particulele.
import { Corp } from './corp.js';
import { BLOC, LAVA, SINA, CREMA, LACRIMA, AUR } from './lume.js';
import { SARITURA } from './jucator.js';

const GRAVITATIE = 900;
const distanta = (a, b) => Math.hypot(a.centruX - b.centruX, a.centruY - b.centruY);

// ---------- Vagonetul: intri când pășești în el, mergi cu ← →, ieși sărind ----------
export class Vagonet extends Corp {
  constructor(x, y) {
    super(x, y, 24, 14);
    this.tip = 'vagonet';
    this.ocupat = false;
    this.pauza = 0; // după ce ieși, un timp scurt nu te bagă înapoi
  }

  // Un vagonet pe șina din celula (cx, rand): centrat pe celulă, cu roțile pe șină.
  static peSina(cx, rand) {
    return new Vagonet(cx * BLOC - 4, rand * BLOC + 2);
  }

  actualizeaza(dt, lume, j) {
    const { jucator, intrare } = j;
    this.pauza = Math.max(0, this.pauza - dt);
    if (!this.ocupat) {
      this.vx *= Math.max(0, 1 - 4 * dt);
      const cadeInEl = jucator.vy >= 0 && jucator.y + jucator.h <= this.y + this.h + 2;
      if (!this.pauza && jucator.suprapune(this) && cadeInEl) {
        this.ocupat = true;
        j.mesaj('Hop in! Ride with ← →, jump to get out', 'vagonet');
      }
    } else {
      const dir = (intrare.dreapta ? 1 : 0) - (intrare.stanga ? 1 : 0);
      if (dir) jucator.directie = dir;
      this.vx = Math.max(-170, Math.min(170, (this.vx + dir * 420 * dt) * Math.max(0, 1 - 0.8 * dt)));
      if (intrare.sus) {
        this.ocupat = false;
        this.pauza = 0.8;
        jucator.vy = -SARITURA;
        jucator.vx = this.vx * 0.5;
        jucator.peSol = false;
        return;
      }
    }
    // Merge doar pe șine: celula din fața lui trebuie să fie tot șină.
    if (Math.abs(this.vx) > 0.5) {
      const nx = this.x + this.vx * dt;
      const fata = Math.floor((this.vx > 0 ? nx + this.l - 1 : nx) / BLOC);
      const rand = Math.floor((this.y + this.h - 1) / BLOC);
      if (lume.get(fata, rand) === SINA) this.x = nx;
      else this.vx = 0;
    } else {
      this.vx = 0;
    }
    if (this.ocupat) {
      jucator.x = this.centruX - jucator.l / 2;
      jucator.y = this.y + 8 - jucator.h;
      jucator.vx = 0;
      jucator.vy = 0;
      jucator.peSol = true;
    }
  }

  deseneaza(ctx, a, camX, camY, p) {
    ctx.drawImage(a.imagine('vagonet'), Math.round(this.x * p) - camX, Math.round(this.y * p) - camY);
  }
}

// ---------- Cubul de magma: sare spre tine; lovit, se împarte; cel mic lasă cremă de magma ----------
const CUTIE_MAGMA = { 3: 30, 2: 15, 1: 8 };
const DESEN_MAGMA = { 3: 32, 2: 16, 1: 8 };

export class CubMagma extends Corp {
  constructor(x, y, marime = 3) {
    super(x, y, CUTIE_MAGMA[marime], CUTIE_MAGMA[marime]);
    this.tip = 'magma';
    this.marime = marime;
    this.asteapta = 0.5 + Math.random() * 2;
    this.turtit = 0;
  }

  actualizeaza(dt, lume, j) {
    const eraPeSol = this.peSol;
    this.vy = Math.min(420, this.vy + GRAVITATIE * dt);
    this.misca(this.vx * dt, 0, lume);
    this.peSol = false;
    this.misca(0, this.vy * dt, lume);
    if (this.peSol) {
      if (!eraPeSol) {
        this.turtit = 0.15;
        this.vx *= 0.2;
      }
      this.vx *= Math.max(0, 1 - 6 * dt);
      this.asteapta -= dt;
      if (this.asteapta <= 0 && distanta(this, j.jucator) < 12 * BLOC) {
        const dir = Math.sign(j.jucator.centruX - this.centruX) || 1;
        this.vx = dir * (40 + this.marime * 14);
        this.vy = -(170 + this.marime * 30);
        this.peSol = false;
        this.asteapta = 1.1 + Math.random() * 1.6;
      }
    }
    this.turtit = Math.max(0, this.turtit - dt);
    if (this.suprapune(j.jucator)) j.loveste(this.centruX, 0.5 + this.marime * 0.2);
  }

  loveste(j) {
    j.particule.explozie(this.centruX, this.centruY, j.culori('cub-magma'), 8 + this.marime * 6, 70);
    j.scoate(this);
    if (this.marime > 1) {
      const m = this.marime - 1;
      for (const dir of [-1, 1]) {
        const c = new CubMagma(this.centruX - CUTIE_MAGMA[m] / 2, this.y + this.h - CUTIE_MAGMA[m], m);
        c.vx = dir * 70;
        c.vy = -170;
        c.asteapta = 0.8 + Math.random();
        j.adaugaMob(c);
      }
    } else {
      j.adauga(CREMA);
      j.mesaj('Magma cream!', 'crema');
    }
  }

  deseneaza(ctx, a, camX, camY, p) {
    const s = DESEN_MAGMA[this.marime];
    const sx = s * (this.turtit ? 1.15 : 1);
    const sy = s * (this.turtit ? 0.8 : 1);
    ctx.drawImage(a.imagine('cub-magma'),
      Math.round((this.centruX - sx / 2) * p) - camX, Math.round((this.y + this.h - sy) * p) - camY,
      Math.round(sx * p), Math.round(sy * p));
  }
}

// ---------- Mingea de foc a ghast-ului: explodează la impact; lovită, se întoarce ----------
export class MingeFoc extends Corp {
  constructor(x, y, tx, ty) {
    super(x - 5, y - 5, 10, 10);
    this.tip = 'minge';
    const dx = tx - x;
    const dy = ty - y;
    const l = Math.hypot(dx, dy) || 1;
    this.vx = (dx / l) * 95;
    this.vy = (dy / l) * 95;
    this.intoarsa = false;
    this.viata = 9;
  }

  actualizeaza(dt, lume, j) {
    this.viata -= dt;
    if (this.viata <= 0) {
      j.scoate(this);
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (lume.solid(Math.floor(this.centruX / BLOC), Math.floor(this.centruY / BLOC))) {
      j.explozie(this.centruX, this.centruY, true);
      j.scoate(this);
      return;
    }
    if (!this.intoarsa && this.suprapune(j.jucator)) {
      j.explozie(this.centruX, this.centruY, false);
      j.scoate(this);
      return;
    }
    if (this.intoarsa) {
      for (const m of j.mobi) {
        if (m.tip === 'ghast' && !m.mort && this.suprapune(m)) {
          j.explozie(this.centruX, this.centruY, false);
          m.moare(j);
          j.scoate(this);
          return;
        }
      }
    }
  }

  loveste(j) {
    if (this.intoarsa) return;
    this.intoarsa = true;
    this.viata = 6;
    const ghasti = j.mobi.filter((m) => m.tip === 'ghast' && !m.mort);
    const g = ghasti.sort((a, b) => distanta(a, this) - distanta(b, this))[0];
    if (g) {
      const dx = g.centruX - this.centruX;
      const dy = g.centruY - this.centruY;
      const l = Math.hypot(dx, dy) || 1;
      this.vx = (dx / l) * 170;
      this.vy = (dy / l) * 170;
    } else {
      this.vx *= -1.6;
      this.vy *= -1.6;
    }
    j.particule.explozie(this.centruX, this.centruY, j.culori('minge-foc'), 8, 60);
    j.mesaj('Nice hit! Send it back to the ghast', 'returnat');
  }

  deseneaza(ctx, a, camX, camY, p, timp) {
    const s = 12 + Math.sin(timp * 20) * 1;
    ctx.drawImage(a.imagine('minge-foc'), Math.round((this.centruX - s / 2) * p) - camX, Math.round((this.centruY - s / 2) * p) - camY, Math.round(s * p), Math.round(s * p));
  }
}

// ---------- Ghast-ul: plutește deasupra ta și trage; se doboară doar cu propria minge ----------
export class Ghast extends Corp {
  constructor(x, y) {
    super(x, y, 30, 32);
    this.tip = 'ghast';
    this.tinta = null;
    this.schimba = 0;
    this.trage = 2.5 + Math.random() * 3;
    this.gura = 0;
    this.mort = 0;
  }

  actualizeaza(dt, lume, j) {
    if (this.mort) {
      this.mort -= dt;
      this.y += 30 * dt;
      if (this.mort <= 0) j.scoate(this);
      return;
    }
    const pl = j.jucator;
    const d = distanta(this, pl);
    this.schimba -= dt;
    if (this.schimba <= 0) {
      this.schimba = 2.5 + Math.random() * 2;
      this.tinta = { x: pl.centruX + (Math.random() * 2 - 1) * 6 * BLOC, y: pl.centruY - (3 + Math.random() * 3) * BLOC };
    }
    if (this.tinta && d < 22 * BLOC) {
      const dx = this.tinta.x - this.centruX;
      const dy = this.tinta.y - this.centruY;
      const l = Math.hypot(dx, dy) || 1;
      const v = Math.min(26, l);
      this.vx = (dx / l) * v;
      this.vy = (dy / l) * v;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
    this.misca(this.vx * dt, 0, lume);
    this.misca(0, this.vy * dt, lume);
    this.gura = Math.max(0, this.gura - dt);
    this.trage -= dt;
    if (this.trage <= 0 && d < 15 * BLOC && d > 3 * BLOC) {
      this.trage = 4 + Math.random() * 2.5;
      this.gura = 0.6;
      j.adaugaMob(new MingeFoc(this.centruX, this.y + 20, pl.centruX, pl.centruY));
    }
  }

  moare(j) {
    if (this.mort) return;
    this.mort = 1.2;
    j.particule.explozie(this.centruX, this.centruY, j.culori('ghast'), 40, 110);
    j.adauga(LACRIMA);
    j.mesaj('Ghast down! It dropped a tear', 'ghast');
  }

  loveste(j) {
    j.mesaj('Ghasts are out of reach. Hit their fireballs back!', 'ghast-sfat');
  }

  deseneaza(ctx, a, camX, camY, p, timp) {
    const plutire = Math.sin(timp * 2 + this.x) * 2;
    ctx.globalAlpha = this.mort ? Math.max(0, this.mort / 1.2) : 1;
    ctx.drawImage(a.imagine(this.gura || this.mort ? 'ghast-trage' : 'ghast'),
      Math.round((this.x - 1) * p) - camX, Math.round((this.y - 1 + plutire) * p) - camY, 32 * p, 48 * p);
    ctx.globalAlpha = 1;
  }
}

// ---------- Piglinul: se plimbă; dacă îi dai minereu de aur, îl admiră și îți dă ceva în schimb ----------
export class Piglin extends Corp {
  constructor(x, y) {
    super(x, y, 10, 30);
    this.tip = 'piglin';
    this.directie = 1;
    this.plimbare = 1;
    this.stai = false;
    this.admira = 0;
    this.nu = 0;
  }

  actualizeaza(dt, lume, j) {
    if (this.admira > 0) {
      this.admira -= dt;
      this.vx = 0;
      if (this.admira <= 0) j.schimb(this);
    } else {
      this.plimbare -= dt;
      if (this.plimbare <= 0) {
        this.plimbare = 1.5 + Math.random() * 2.5;
        this.directie = Math.random() < 0.5 ? -1 : 1;
        this.stai = Math.random() < 0.4;
      }
      // Nu cade de pe margini și se întoarce la pereți.
      const fata = Math.floor((this.directie > 0 ? this.x + this.l + 2 : this.x - 2) / BLOC);
      const sub = Math.floor((this.y + this.h + 2) / BLOC);
      if (this.peSol && (!lume.solid(fata, sub) || lume.solid(fata, sub - 1))) this.directie *= -1;
      this.vx = this.stai || this.nu ? 0 : this.directie * 22;
    }
    this.nu = Math.max(0, this.nu - dt);
    this.vy = Math.min(420, this.vy + GRAVITATIE * dt);
    this.misca(this.vx * dt, 0, lume);
    this.peSol = false;
    this.misca(0, this.vy * dt, lume);
  }

  loveste(j) {
    if (this.admira > 0) return;
    if (j.numara(AUR) > 0) {
      j.consuma(AUR, 1);
      this.admira = 1.6;
      j.mesaj('The piglin inspects your gold…');
    } else {
      this.nu = 0.6;
      j.mesaj('The piglin wants gold ore', 'piglin-aur');
    }
  }

  deseneaza(ctx, a, camX, camY, p, timp) {
    const tremur = this.nu ? Math.round(Math.sin(timp * 40) * 1.5) : 0;
    const x = Math.round((this.x - 3 + tremur) * p) - camX;
    const y = Math.round((this.y - 2) * p) - camY;
    ctx.drawImage(a.imagine('piglin'), x, y);
    if (this.admira > 0) ctx.drawImage(a.imagine('lingou-aur'), x + 7 * p, y + 10 * p, 10 * p, 10 * p);
  }
}

// ---------- Strider-ul: merge încolo și încoace pe lava din Nether ----------
export class Strider extends Corp {
  constructor(x, y) {
    super(x, y, 14, 18);
    this.tip = 'strider';
    this.directie = Math.random() < 0.5 ? -1 : 1;
  }

  actualizeaza(dt, lume) {
    const nx = this.x + this.directie * 18 * dt;
    const fata = Math.floor((this.directie > 0 ? nx + this.l : nx) / BLOC);
    const lava = Math.floor((this.y + this.h + 2) / BLOC);
    if (lume.get(fata, lava) !== LAVA || lume.solid(fata, lava - 1)) this.directie *= -1;
    else this.x = nx;
  }

  deseneaza(ctx, a, camX, camY, p, timp) {
    const pas = Math.round(Math.sin(timp * 6 + this.x) * 1);
    ctx.drawImage(a.imagine('strider'), Math.round((this.x - 1) * p) - camX, Math.round((this.y - 2 + pas) * p) - camY);
  }
}
