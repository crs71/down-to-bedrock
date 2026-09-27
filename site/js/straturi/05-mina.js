// Stratul 5: mina abandonată. O singură cronologie GSAP legată de scroll (scena e sticky, din CSS):
// plimbare (galeria alunecă spre stânga, vagonetul rămâne la 20% din ecran) → vagonetul oprește în fața
// portalului → zoom în interiorul portalului → violetul acoperă ecranul și pagina trece pe paleta Nether.
// Pe drum, vagonetul rupe pânzele de păianjen (la scroll înapoi se refac), iar portalul aruncă sclipiri violete.
(() => {
  const { areGsap } = window.Coborarea;
  if (!areGsap) return;

  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();
  const sectiune = document.querySelector('.strat--mina');
  const scena = sectiune.querySelector('.mina__scena');
  const camera = sectiune.querySelector('.mina__camera');
  const lume = sectiune.querySelector('.mina__lume');
  const vagonet = sectiune.querySelector('.mina__vagonet');
  const portal = sectiune.querySelector('.mina__portal');
  const interior = sectiune.querySelector('.mina__interior');
  const violet = sectiune.querySelector('.mina__violet');
  const indiciu = sectiune.querySelector('.mina__indiciu');
  const piedici = [...sectiune.querySelectorAll('.mina__piedica')].map((el) => ({
    el,
    bucati: [...el.querySelectorAll('.mina__bucata')],
    rupta: null, // null = încă nemăsurată
    x: 0,
    latime: 0,
  }));

  function rupe(p, animat) {
    p.rupta = true;
    const [stanga, dreapta] = p.bucati;
    if (!animat) {
      gsap.set(p.bucati, { opacity: 0 });
      return;
    }
    gsap.to(stanga, { x: -p.latime * 0.5, y: p.latime * 0.7, rotation: -40, opacity: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(dreapta, { x: p.latime * 0.6, y: p.latime * 0.5, rotation: 35, opacity: 0, duration: 0.7, ease: 'power2.in' });
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

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    scena.removeAttribute('tabindex');
    scena.scrollLeft = 0;

    // Măsurători în coordonatele galeriei (offset*, fără transformări), refăcute la fiecare refresh.
    const m = {};
    function masoara() {
      const ecran = scena.clientWidth;
      m.vagonet = vagonet.offsetWidth;
      m.portal = portal.offsetLeft + portal.offsetWidth / 2;
      m.final = Math.min(lume.offsetWidth - ecran, m.portal - ecran * 0.58); // camera la final: portalul la 58%
      m.loc = ecran * 0.2; // unde stă vagonetul pe ecran cât merge
      for (const p of piedici) {
        p.x = p.el.offsetLeft;
        p.latime = p.el.offsetWidth;
      }
      // Zoom-ul pornește din centrul interiorului portalului, așa cum e pe ecran la capătul drumului.
      const cx = m.portal - m.final;
      const cy = portal.offsetTop + interior.offsetTop + interior.offsetHeight / 2;
      gsap.set(camera, { transformOrigin: `${cx}px ${cy}px` });
    }
    masoara();

    let nether = false;
    let botAnterior = null;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sectiune,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
      onUpdate() {
        // Pânzele: se rup când botul vagonetului trece de o treime din ele. Animat doar la mers normal;
        // la un salt mare (un link, tasta End) pânza dispare direct.
        const bot = gsap.getProperty(vagonet, 'x') + m.vagonet;
        const animat = botAnterior !== null && Math.abs(bot - botAnterior) < scena.clientWidth * 0.5;
        botAnterior = bot;
        for (const p of piedici) {
          const trecut = bot > p.x + p.latime * 0.35;
          if (p.rupta === null) {
            if (trecut) rupe(p, false); else p.rupta = false;
          } else if (trecut && !p.rupta) {
            rupe(p, animat);
          } else if (!trecut && p.rupta) {
            repara(p);
          }
        }
        // Paleta se schimbă cât violetul acoperă tot ecranul; la scroll înapoi, revine.
        const acum = this.time() >= this.labels.nether;
        if (acum !== nether) {
          nether = acum;
          window.Coborarea.paletaNether(nether);
        }
      },
    });

    tl.fromTo(lume, { x: 0 }, { x: () => -m.final, duration: 6 }, 0)
      .fromTo(vagonet, { x: () => m.loc }, { x: () => m.final + m.loc, duration: 6 }, 0)
      .to(indiciu, { autoAlpha: 0, duration: 0.3 }, 0.15)
      .to(vagonet, { x: () => m.portal - m.vagonet / 2, duration: 1.2, ease: 'power2.out' }, 6)
      .addLabel('zoom', 7.1)
      .to(camera, { scale: 24, duration: 1.5, ease: 'power2.in' }, 'zoom')
      .to(violet, { opacity: 1, duration: 0.45 }, 'zoom+=1.05')
      .addLabel('nether', 'zoom+=1.5')
      .to({}, { duration: 0.3 });

    ScrollTrigger.addEventListener('refreshInit', masoara);

    // Sclipirile violete din portal, cât portalul e pe ecran și camera încă n-a intrat în el.
    let emitator = 0;
    function sclipiri() {
      if (tl.time() > tl.labels.zoom + 0.3) return;
      const r = interior.getBoundingClientRect();
      if (r.right < 0 || r.left > window.innerWidth) return;
      window.Coborarea.particule.emite(r.left + Math.random() * r.width, r.top + Math.random() * r.height, {
        culori: ['--portal-1', '--portal-2', '--obsidian-1'].map(variabila),
        numar: 1,
        vx: [-30, 30],
        vy: [-50, -10],
        marime: 3,
        gravitatie: -20,
        viata: 1.2,
      });
    }
    const observator = new IntersectionObserver(([intrare]) => {
      if (intrare.isIntersecting && !emitator) emitator = setInterval(sclipiri, 120);
      else if (!intrare.isIntersecting && emitator) {
        clearInterval(emitator);
        emitator = 0;
      }
    });
    observator.observe(sectiune);

    // Revenire la varianta statică dacă utilizatorul activează reduced-motion cu pagina deschisă.
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', masoara);
      observator.disconnect();
      clearInterval(emitator);
      emitator = 0;
      piedici.forEach(repara);
      piedici.forEach((p) => { p.rupta = null; });
      window.Coborarea.paletaNether(false);
      scena.setAttribute('tabindex', '0');
      gsap.set([lume, vagonet, camera, violet, indiciu], { clearProps: 'all' });
    };
  });
})();
