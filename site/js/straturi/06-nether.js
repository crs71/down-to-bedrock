// Stratul 6: Nether. Portalul și intrarea în el sunt în CSS (view-timeline --nether). Aici:
// 1) la 36% din secțiune (violetul acoperă ecranul), paleta Nether trece pe toată pagina (html.paleta-nether);
//    la scroll înapoi, pagina revine la paleta normală;
// 2) scânteile care urcă din lavă și sclipirile violete din portal (modulul de particule);
// 3) filtrul de căldură (animație SMIL în #caldura) rulează doar cât Nether-ul e pe ecran.
(() => {
  const { miscareRedusa } = window.Coborarea;
  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();

  const radacina = document.documentElement;
  const sectiune = document.querySelector('.strat--nether');
  const lava = sectiune.querySelector('.nether__lava');
  const interior = sectiune.querySelector('.nether__interior');
  const sprite = document.querySelector('svg.sprite');
  const culoareTema = document.querySelector('meta[name="theme-color"]');
  const temaNormala = culoareTema.content;
  const areTimeline = CSS.supports('animation-timeline: view()');
  const PRAG_PALETA = 0.36; // același moment ca în @keyframes portal-intra
  const PRAG_LUME = 0.42;   // de aici se vede Nether-ul, deci pornesc scânteile

  let vizibil = false;
  let emitator = 0;

  // SMIL nu ascultă de prefers-reduced-motion din CSS: îl pornim și oprim din JS.
  sprite.pauseAnimations();

  function progres() {
    const r = sectiune.getBoundingClientRect();
    const drum = r.height - window.innerHeight;
    return drum > 0 ? -r.top / drum : 0;
  }

  function animat() {
    return !miscareRedusa.matches && areTimeline;
  }

  function actualizeazaPaleta() {
    const nether = animat() && progres() >= PRAG_PALETA;
    if (nether !== radacina.classList.contains('paleta-nether')) {
      radacina.classList.toggle('paleta-nether', nether);
      culoareTema.content = nether ? '#a22633' : temaNormala;
    }
  }

  function scantei() {
    const p = progres();
    if (p >= PRAG_LUME && p <= 1.05) {
      const r = lava.getBoundingClientRect();
      window.Coborarea.particule.emite(r.left + Math.random() * r.width, r.top + 4, {
        culori: ['--apus-1', '--nether-1', '--nether-2'].map(variabila),
        numar: 2,
        vx: [-25, 25],
        vy: [-160, -60],
        marime: Math.max(3, Math.round(r.height / 32)),
        gravitatie: -60,
        viata: 1.8,
      });
    } else if (p > 0 && p < PRAG_PALETA) {
      const r = interior.getBoundingClientRect();
      window.Coborarea.particule.emite(r.left + Math.random() * r.width, r.top + Math.random() * r.height, {
        culori: ['--portal-1', '--portal-2'].map(variabila),
        numar: 1,
        vx: [-30, 30],
        vy: [-50, -10],
        marime: 3,
        gravitatie: -20,
        viata: 1.2,
      });
    }
  }

  function actualizeazaMiscarea() {
    const merge = vizibil && animat();
    if (merge && !emitator) {
      emitator = setInterval(scantei, 110);
      sprite.unpauseAnimations();
    } else if (!merge && emitator) {
      clearInterval(emitator);
      emitator = 0;
      sprite.pauseAnimations();
    }
  }

  new IntersectionObserver(([intrare]) => {
    vizibil = intrare.isIntersecting;
    actualizeazaMiscarea();
  }).observe(sectiune);

  window.addEventListener('scroll', actualizeazaPaleta, { passive: true });
  miscareRedusa.addEventListener('change', () => {
    actualizeazaPaleta();
    actualizeazaMiscarea();
  });
  actualizeazaPaleta();
})();
