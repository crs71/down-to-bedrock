// Minerul: o cutie de 10×27 pixeli de sprite (sub 1 bloc lățime și 2 blocuri înălțime, deci încape prin
// orice tunel de 1×2), cu gravitație, săritură și coliziuni (corp.js).
// Săritura automată: când mergi într-un perete de un singur bloc, sare singur (util pe telefon).
// Pânzele de păianjen și nisipul de suflete te încetinesc.
import { BLOC, BLOCURI } from './lume.js';
import { Corp } from './corp.js';

const GRAVITATIE = 1100;     // pixeli de sprite / s²
export const SARITURA = 222; // viteza inițială: ajunge cam la 1,3 blocuri
const VITEZA = 74;           // mers: ~4,6 blocuri pe secundă
const ACCELERATIE_SOL = 1100;
const ACCELERATIE_AER = 600;
const CADERE_MAXIMA = 430;

export class Jucator extends Corp {
  constructor(x, y) {
    super(x, y, 10, 27);
    this.directie = 1;  // 1 = spre dreapta, -1 = spre stânga
    this.mers = 0;      // timp de mers, pentru cadrul picioarelor
  }

  get ochiY() { return this.y + 6; }

  // Cât de încet te miști acum: prin pânze, sau pe nisip de suflete (blocul de sub picioare).
  incetinire(lume) {
    let f = 1;
    for (const [x, y] of this.celule()) {
      const b = lume.get(x, y);
      if (b && BLOCURI[b] && !BLOCURI[b].solid && BLOCURI[b].incetineste) f = Math.min(f, BLOCURI[b].incetineste);
    }
    const sub = lume.get(Math.floor(this.centruX / BLOC), Math.floor((this.y + this.h + 1) / BLOC));
    if (this.peSol && BLOCURI[sub] && BLOCURI[sub].incetineste) f = Math.min(f, BLOCURI[sub].incetineste);
    return f;
  }

  actualizeaza(dt, lume, intrare) {
    const directie = (intrare.dreapta ? 1 : 0) - (intrare.stanga ? 1 : 0);
    if (directie) this.directie = directie;
    const incet = this.incetinire(lume);

    const tinta = directie * VITEZA * incet;
    const acc = (this.peSol ? ACCELERATIE_SOL : ACCELERATIE_AER) * dt;
    this.vx += Math.max(-acc, Math.min(acc, tinta - this.vx));

    if (intrare.sus && this.peSol) {
      this.vy = -SARITURA * (incet < 1 ? 0.75 : 1);
      this.peSol = false;
    }
    this.vy = Math.min(CADERE_MAXIMA * incet, this.vy + GRAVITATIE * dt);

    const lovitPerete = this.misca(this.vx * dt, 0, lume);
    this.peSol = false;
    this.misca(0, this.vy * dt, lume);

    // Săritura automată pe o treaptă de un bloc, cu loc liber deasupra ei și deasupra capului.
    if (lovitPerete && directie && this.peSol) {
      const col = Math.floor((directie > 0 ? this.x + this.l + 1 : this.x - 1) / BLOC);
      const picioare = Math.floor((this.y + this.h - 1) / BLOC);
      const cap = Math.floor(this.y / BLOC);
      const liberSus = !lume.solid(col, picioare - 1) && !lume.solid(col, picioare - 2)
        && !lume.solid(Math.floor(this.x / BLOC), cap - 1) && !lume.solid(Math.floor((this.x + this.l - 1) / BLOC), cap - 1);
      if (lume.solid(col, picioare) && liberSus) {
        this.vy = -SARITURA;
        this.peSol = false;
      }
    }

    // Marginile lumii.
    this.x = Math.max(0, Math.min(lume.latime * BLOC - this.l, this.x));
    this.mers = this.peSol && Math.abs(this.vx) > 10 ? this.mers + dt : 0;
  }
}
