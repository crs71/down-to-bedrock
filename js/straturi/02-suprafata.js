// Stratul 2: suprafața. Secțiunea e fixată cu ScrollTrigger și o singură cronologie legată de scroll:
// mers orizontal → creeper-ul clipește și se umflă → explozie (o dată, în timp real) → zoom 2× pe crater.
// Zoom-ul e ancorat la marginea de jos, în dreptul craterului: la final, solul mărit continuă exact cu
// blocurile (tot 2×) din stratul 3, iar puțul de acolo se aliniază cu craterul (Coborarea.sapat).
(() => {
  if (!window.Coborarea.areGsap) return;

  const sectiune = document.querySelector('.strat--suprafata');
  const fereastra = sectiune.querySelector('.sup__fereastra');
  const scutura = sectiune.querySelector('.sup__scutura');
  const lume = sectiune.querySelector('.sup__lume');
  const pista = sectiune.querySelector('.sup__pista');
  const departe = sectiune.querySelector('.sup__departe');
  const creeper = sectiune.querySelector('.sup__creeper');
  const creeperAlb = sectiune.querySelector('.sup__creeper-alb');
  const crater = sectiune.querySelector('.sup__crater');
  const copaci = [...sectiune.querySelectorAll('.sup__copac')].map((el) => ({
    el,
    use: el.querySelector('use'),
    cadru: 3,
  }));

  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();

  function seteazaCadru(copac, cadru) {
    if (copac.cadru === cadru) return;
    copac.cadru = cadru;
    copac.use.setAttribute('href', `#copac-${cadru}`);
  }

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    sectiune.classList.add('sup--animat');
    fereastra.removeAttribute('tabindex');
    fereastra.scrollLeft = 0;
    gsap.set(creeper, { xPercent: -50, x: 0 });

    const distanta = () => pista.offsetWidth - fereastra.clientWidth;
    let explodat = false;

    // Poziția unui element în coordonatele pistei (SVG-urile nu au offsetLeft).
    // Împărțirea la scale anulează zoom-ul, dacă măsurătoarea cade în timpul lui.
    function inPista(el) {
      const r = el.getBoundingClientRect();
      const p = pista.getBoundingClientRect();
      const scara = gsap.getProperty(lume, 'scale') || 1;
      return {
        x: (r.left - p.left) / scara,
        y: (r.top - p.top) / scara,
        latime: r.width / scara,
        inaltime: r.height / scara,
      };
    }

    function masoara() {
      for (const copac of copaci) {
        const r = inPista(copac.el);
        copac.centru = r.x + r.latime / 2;
      }
      // Centrul craterului pe ecran, la finalul mersului orizontal. Zoom-ul pornește din punctul de jos
      // de sub el, deci marginea de jos a solului rămâne pe loc, iar craterul rămâne în aceeași coloană.
      const c = inPista(crater);
      const centru = c.x + c.latime / 2 - distanta();
      gsap.set(lume, { transformOrigin: `${centru}px ${fereastra.clientHeight}px` });
      window.Coborarea.sapat = { centru };
      window.Coborarea.aliniazaSapatul?.();
    }

    // Copacii cresc în 4 cadre pe măsură ce centrul lor trece de la 95% la 50% din lățimea ecranului.
    function cresteCopacii() {
      const x = gsap.getProperty(pista, 'x');
      const latime = fereastra.clientWidth;
      for (const copac of copaci) {
        const centru = copac.centru + x;
        const progres = gsap.utils.clamp(0, 1, (latime * 0.95 - centru) / (latime * 0.45));
        seteazaCadru(copac, Math.min(3, Math.floor(progres * 4)));
      }
    }

    function explodeaza() {
      explodat = true;
      const r = creeper.getBoundingClientRect();
      const pixel = parseFloat(variabila('--pixel')) || 4;
      window.Coborarea.particule.explozie(r.left + r.width / 2, r.top + r.height * 0.6, {
        culori: ['--iarba-1', '--iarba-2', '--iarba-3', '--pamant-2', '--pamant-3', '--nor-1', '--nor-2', '--pestera-3'].map(variabila),
        numar: 140,
        viteza: 175 * pixel,
        marime: pixel * 2,
        gravitatie: 300 * pixel,
      });
      gsap.set(creeper, { autoAlpha: 0 });
      gsap.set(crater, { opacity: 1 });
      gsap.fromTo(scutura, { x: 0, y: 0 }, {
        keyframes: {
          x: [-3, 3, -2, 2, -1, 0].map((v) => v * pixel),
          y: [2, -2, 1, -1, 0, 0].map((v) => v * pixel),
        },
        duration: 0.4,
        ease: 'none',
      });
    }

    function refa() {
      explodat = false;
      gsap.set(creeper, { autoAlpha: 1 });
      gsap.set(crater, { opacity: 0 });
    }

    // Durate relative: mers 2, clipit 0.8, pauză 0.35, zoom 0.8, oprire 0.25.
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sectiune,
        pin: true,
        start: 'top top',
        end: () => `+=${Math.max(distanta(), window.innerHeight * 2) + window.innerHeight * 2.2}`,
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
      onUpdate() {
        cresteCopacii();
        const trecut = this.time() >= this.labels.explozie;
        if (trecut && !explodat) explodeaza();
        else if (!trecut && explodat) refa();
      },
    });

    tl.to(pista, { x: () => -distanta(), duration: 2 }, 0)
      .to(departe, { x: () => -distanta() * 0.35, duration: 2 }, 0)
      .addLabel('clipit')
      .to(creeper, { scaleX: 1.2, scaleY: 1.08, duration: 0.8, ease: 'power1.in' }, 'clipit')
      .to(creeperAlb, { opacity: 0.85, duration: 0.1, repeat: 1, yoyo: true }, 'clipit')
      .to(creeperAlb, { opacity: 0.85, duration: 0.07, repeat: 1, yoyo: true }, 'clipit+=0.35')
      .to(creeperAlb, { opacity: 0.85, duration: 0.04, repeat: 3, yoyo: true }, 'clipit+=0.56')
      .addLabel('explozie', 'clipit+=0.8')
      .addLabel('zoom', 'explozie+=0.35')
      .to(lume, { scale: 2, duration: 0.8, ease: 'power1.inOut' }, 'zoom')
      .to({}, { duration: 0.25 });

    masoara();
    cresteCopacii();
    ScrollTrigger.addEventListener('refresh', masoara);

    // Revenire la varianta statică dacă utilizatorul activează reduced-motion cu pagina deschisă.
    return () => {
      ScrollTrigger.removeEventListener('refresh', masoara);
      delete window.Coborarea.sapat;
      window.Coborarea.aliniazaSapatul?.();
      sectiune.classList.remove('sup--animat');
      fereastra.setAttribute('tabindex', '0');
      copaci.forEach((copac) => seteazaCadru(copac, 3));
      gsap.set([creeper, crater, scutura], { clearProps: 'all' });
    };
  });
})();
