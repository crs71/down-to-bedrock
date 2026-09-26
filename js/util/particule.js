// Particule pixelate, desenate pe un singur canvas fix peste pagină.
// Bucla requestAnimationFrame rulează doar cât timp există particule, apoi se oprește singură.
// Folosire: Coborarea.particule.explozie(x, y, { culori, numar, viteza, marime, gravitatie, viata })
// (x, y în pixeli de ecran, de exemplu centrul unui getBoundingClientRect()).
(() => {
  const { miscareRedusa } = window.Coborarea;
  let canvas = null;
  let ctx = null;
  let particule = [];
  let ruleaza = false;
  let ultimCadru = 0;

  function redimensioneaza() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function pregateste() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'particule';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    redimensioneaza();
    window.addEventListener('resize', redimensioneaza);
  }

  function cadru(acum) {
    const dt = Math.min((acum - ultimCadru) / 1000, 0.05);
    ultimCadru = acum;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particule = particule.filter((p) => (p.viata -= dt) > 0);
    for (const p of particule) {
      p.vx *= 1 - p.frecare * dt;
      p.vy += p.gravitatie * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.viata / 0.3);
      ctx.fillStyle = p.culoare;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.marime, p.marime);
    }
    ctx.globalAlpha = 1;

    if (particule.length) {
      requestAnimationFrame(cadru);
    } else {
      ruleaza = false;
    }
  }

  function explozie(x, y, optiuni = {}) {
    if (miscareRedusa.matches) return;
    const {
      culori = ['#ffffff'],
      numar = 80,
      viteza = 600,
      marime = 8,
      gravitatie = 1200,
      viata = 1.2,
    } = optiuni;

    pregateste();
    for (let i = 0; i < numar; i++) {
      const unghi = Math.random() * Math.PI * 2;
      const v = viteza * (0.25 + Math.random() * 0.75);
      particule.push({
        x,
        y,
        vx: Math.cos(unghi) * v,
        vy: Math.sin(unghi) * v - viteza * 0.35,
        marime: Math.random() < 0.25 ? marime * 2 : marime,
        culoare: culori[i % culori.length],
        gravitatie,
        frecare: 1.5,
        viata: viata * (0.5 + Math.random() * 0.5),
      });
    }

    if (!ruleaza) {
      ruleaza = true;
      ultimCadru = performance.now();
      requestAnimationFrame(cadru);
    }
  }

  window.Coborarea.particule = { explozie };
})();
