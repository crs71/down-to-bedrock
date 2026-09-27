// Stratul 5: mina abandonată. Vagonetul e mișcat din CSS (view-timeline --mina).
// Aici: când vagonetul trece peste o pânză de păianjen, cele două jumătăți ale ei zboară în lături și cad;
// dacă derulezi înapoi și vagonetul se retrage, pânza se reface.
(() => {
  const { miscareRedusa, areGsap } = window.Coborarea;
  if (!areGsap || !CSS.supports('animation-timeline: view()')) return;

  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();
  const sectiune = document.querySelector('.strat--mina');
  const vagonet = sectiune.querySelector('.mina__vagonet');
  const piedici = [...sectiune.querySelectorAll('.mina__piedica')].map((el) => ({
    el,
    bucati: [...el.querySelectorAll('.mina__bucata')],
    rupta: null, // null = încă nemăsurată
  }));

  function rupe(p, animat) {
    p.rupta = true;
    const [stanga, dreapta] = p.bucati;
    if (!animat) {
      gsap.set(p.bucati, { opacity: 0 });
      return;
    }
    const latime = p.el.getBoundingClientRect().width;
    gsap.to(stanga, { x: -latime * 0.5, y: latime * 0.7, rotation: -40, opacity: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(dreapta, { x: latime * 0.6, y: latime * 0.5, rotation: 35, opacity: 0, duration: 0.7, ease: 'power2.in' });
    const r = p.el.getBoundingClientRect();
    window.Coborarea.particule.explozie(r.left + r.width / 2, r.top + r.height / 2, {
      culori: ['--nor-1', '--nor-2'].map(variabila),
      numar: 12,
      viteza: 160,
      marime: 3,
      gravitatie: 500,
      viata: 0.6,
    });
  }

  function repara(p) {
    p.rupta = false;
    gsap.killTweensOf(p.bucati);
    gsap.set(p.bucati, { clearProps: 'all' });
  }

  function laScroll() {
    if (miscareRedusa.matches) return;
    const v = vagonet.getBoundingClientRect();
    for (const p of piedici) {
      const r = p.el.getBoundingClientRect();
      const trecut = v.right > r.left + r.width * 0.35;
      if (p.rupta === null) {
        // Prima măsurătoare (pagina deschisă la mijloc): starea corectă, fără animație.
        if (trecut) rupe(p, false); else p.rupta = false;
      } else if (trecut && !p.rupta) {
        rupe(p, true);
      } else if (!trecut && p.rupta) {
        repara(p);
      }
    }
  }

  window.addEventListener('scroll', laScroll, { passive: true });
  miscareRedusa.addEventListener('change', () => {
    if (miscareRedusa.matches) piedici.forEach(repara);
  });
  laScroll();
})();
