// Particule în coordonatele lumii (pixeli de sprite): bucățile care sar dintr-un bloc spart.
export class Particule {
  constructor() {
    this.lista = [];
  }

  explozie(x, y, culori, numar = 14, viteza = 70) {
    for (let i = 0; i < numar; i++) {
      const unghi = Math.random() * Math.PI * 2;
      const v = viteza * (0.3 + Math.random() * 0.7);
      this.lista.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(unghi) * v,
        vy: Math.sin(unghi) * v - viteza * 0.6,
        viata: 0.4 + Math.random() * 0.4,
        marime: Math.random() < 0.3 ? 2 : 1,
        culoare: culori[i % culori.length],
      });
    }
  }

  actualizeaza(dt) {
    this.lista = this.lista.filter((p) => (p.viata -= dt) > 0);
    for (const p of this.lista) {
      p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  // camX, camY: colțul camerei în pixeli de ecran; p: pixeli de ecran pe pixel de sprite.
  deseneaza(ctx, camX, camY, p) {
    for (const q of this.lista) {
      ctx.globalAlpha = Math.min(1, q.viata / 0.2);
      ctx.fillStyle = q.culoare;
      ctx.fillRect(Math.round(q.x * p) - camX, Math.round(q.y * p) - camY, q.marime * p, q.marime * p);
    }
    ctx.globalAlpha = 1;
  }
}
