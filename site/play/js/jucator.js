// Minerul: o cutie de 10×27 pixeli de sprite (sub 1 bloc lățime și 2 blocuri înălțime, deci încape prin
// orice tunel de 1×2), cu gravitație, săritură și coliziuni cu blocurile solide, pe câte o axă.
// Săritura automată: când mergi într-un perete de un singur bloc, sare singur (util pe telefon).
import { BLOC } from './lume.js';

const GRAVITATIE = 1100;     // pixeli de sprite / s²
const SARITURA = 222;        // viteza inițială: ajunge cam la 1,3 blocuri
const VITEZA = 74;           // mers: ~4,6 blocuri pe secundă
const ACCELERATIE_SOL = 1100;
const ACCELERATIE_AER = 600;
const CADERE_MAXIMA = 430;

export class Jucator {
  constructor(x, y) {
    this.l = 10;
    this.h = 27;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.peSol = false;
    this.directie = 1;  // 1 = spre dreapta, -1 = spre stânga
    this.mers = 0;      // timp de mers, pentru cadrul picioarelor
  }

  get centruX() { return this.x + this.l / 2; }
  get ochiY() { return this.y + 6; }

  // Se suprapune cutia cu blocul (cx, cy)? Folosit ca să nu pui blocuri peste tine.
  atinge(cx, cy) {
    return this.x < (cx + 1) * BLOC && this.x + this.l > cx * BLOC
      && this.y < (cy + 1) * BLOC && this.y + this.h > cy * BLOC;
  }

  actualizeaza(dt, lume, intrare) {
    const directie = (intrare.dreapta ? 1 : 0) - (intrare.stanga ? 1 : 0);
    if (directie) this.directie = directie;

    const tinta = directie * VITEZA;
    const acc = (this.peSol ? ACCELERATIE_SOL : ACCELERATIE_AER) * dt;
    this.vx += Math.max(-acc, Math.min(acc, tinta - this.vx));

    if (intrare.sus && this.peSol) {
      this.vy = -SARITURA;
      this.peSol = false;
    }
    this.vy = Math.min(CADERE_MAXIMA, this.vy + GRAVITATIE * dt);

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

  // Mută cutia pe o singură axă și o oprește la primul bloc solid. Întoarce true dacă s-a lovit ceva.
  misca(dx, dy, lume) {
    if (dx) {
      this.x += dx;
      const sus = Math.floor(this.y / BLOC);
      const jos = Math.floor((this.y + this.h - 0.001) / BLOC);
      const col = Math.floor((dx > 0 ? this.x + this.l - 0.001 : this.x) / BLOC);
      for (let r = sus; r <= jos; r++) {
        if (lume.solid(col, r)) {
          this.x = dx > 0 ? col * BLOC - this.l : (col + 1) * BLOC;
          this.vx = 0;
          return true;
        }
      }
    }
    if (dy) {
      this.y += dy;
      const st = Math.floor(this.x / BLOC);
      const dr = Math.floor((this.x + this.l - 0.001) / BLOC);
      const rand = Math.floor((dy > 0 ? this.y + this.h - 0.001 : this.y) / BLOC);
      for (let c = st; c <= dr; c++) {
        if (lume.solid(c, rand)) {
          if (dy > 0) {
            this.y = rand * BLOC - this.h;
            this.peSol = true;
          } else {
            this.y = (rand + 1) * BLOC;
          }
          this.vy = 0;
          return true;
        }
      }
    }
    return false;
  }
}
