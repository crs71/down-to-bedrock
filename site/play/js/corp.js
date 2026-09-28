// Un corp în lume (minerul, mobii, vagonetul): o cutie în pixeli de sprite, cu viteză și coliziuni
// cu blocurile solide, rezolvate pe câte o axă.
import { BLOC } from './lume.js';

export class Corp {
  constructor(x, y, l, h) {
    this.x = x;
    this.y = y;
    this.l = l;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.peSol = false;
  }

  get centruX() { return this.x + this.l / 2; }
  get centruY() { return this.y + this.h / 2; }

  // Se suprapune cutia cu blocul (cx, cy)?
  atinge(cx, cy) {
    return this.x < (cx + 1) * BLOC && this.x + this.l > cx * BLOC
      && this.y < (cy + 1) * BLOC && this.y + this.h > cy * BLOC;
  }

  // Se suprapune cu alt corp?
  suprapune(alt) {
    return this.x < alt.x + alt.l && this.x + this.l > alt.x && this.y < alt.y + alt.h && this.y + this.h > alt.y;
  }

  contine(px, py) {
    return px >= this.x && px < this.x + this.l && py >= this.y && py < this.y + this.h;
  }

  // Celulele atinse de cutie, ca listă de [x, y].
  celule() {
    const lista = [];
    for (let y = Math.floor(this.y / BLOC); y <= Math.floor((this.y + this.h - 0.001) / BLOC); y++) {
      for (let x = Math.floor(this.x / BLOC); x <= Math.floor((this.x + this.l - 0.001) / BLOC); x++) lista.push([x, y]);
    }
    return lista;
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
