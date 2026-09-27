// Stratul 6: Nether.
// 1) Plimbarea: violetul portalului se retrage, apoi lumea alunecă spre stânga (GSAP, scena e sticky din CSS).
// 2) Mobii și blocurile interactive devin butoane (click, atingere, Enter sau Space):
//    - cubii de magma se împart în doi cubi mai mici; cei mai mici se sparg și lasă cremă de magma;
//    - ghast-ul trage cu mingi de foc spre ecran; lovită la timp, mingea se întoarce și doboară ghast-ul,
//      care lasă o lacrimă (butonul ghast-ului trimite înapoi mingea din zbor, pentru tastatură);
//    - resturile antice se sparg din 5 lovituri și dau netherite;
//    - piglinul ia un lingou de aur din hotbar și dă în schimb fier; fără aur, arată că vrea aur;
//    - blaze-ul se înfurie, strider-ul sare.
// 3) Scânteile din lavă și filtrul de căldură (SMIL în #caldura) rulează doar cât Nether-ul e pe ecran.
(() => {
  const { miscareRedusa, areGsap } = window.Coborarea;
  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();
  const culori = (...nume) => nume.map(variabila);

  const sectiune = document.querySelector('.strat--nether');
  const scena = sectiune.querySelector('.nether__scena');
  const cutremur = sectiune.querySelector('.nether__cutremur');
  const lume = sectiune.querySelector('.nether__lume');
  const violet = sectiune.querySelector('.nether__violet');
  const indiciu = sectiune.querySelector('.nether__indiciu');
  const lave = [...sectiune.querySelectorAll('.nether__lava')];
  const sprite = document.querySelector('svg.sprite');

  let vizibil = false;
  let emitator = 0;

  // ---------- 3) Scânteile și căldura ----------
  // SMIL nu ascultă de prefers-reduced-motion din CSS: îl pornim și oprim din JS.
  sprite.pauseAnimations();

  function scantei() {
    const latime = window.innerWidth;
    for (const lava of lave) {
      const r = lava.getBoundingClientRect();
      const stanga = Math.max(0, r.left);
      const dreapta = Math.min(latime, r.right);
      if (dreapta - stanga < 8 || r.top > window.innerHeight) continue;
      window.Coborarea.particule.emite(stanga + Math.random() * (dreapta - stanga), r.top + 4, {
        culori: culori('--apus-1', '--nether-1', '--nether-2'),
        numar: 1 + Math.round((dreapta - stanga) / 600),
        vx: [-25, 25],
        vy: [-160, -60],
        marime: Math.max(3, Math.round(r.height / 32)),
        gravitatie: -60,
        viata: 1.8,
      });
    }
  }

  function actualizeazaMiscarea() {
    const merge = vizibil && !miscareRedusa.matches;
    if (merge && !emitator) {
      emitator = setInterval(scantei, 140);
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
  miscareRedusa.addEventListener('change', actualizeazaMiscarea);

  if (!areGsap) return;
  const hotbar = window.Coborarea.hotbar;
  const particule = window.Coborarea.particule;
  const pixel = () => parseFloat(variabila('--pixel')) || 4;
  const centru = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

  // Un element din lume devine buton; întoarce funcția care îl readuce la decor.
  function butonul(el, actiune) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', el.dataset.eticheta);
    el.removeAttribute('aria-hidden');
    const laClick = (e) => {
      e.preventDefault();
      actiune(e);
    };
    const laTasta = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        actiune(e);
      }
    };
    el.addEventListener('click', laClick);
    el.addEventListener('keydown', laTasta);
    return () => {
      el.removeEventListener('click', laClick);
      el.removeEventListener('keydown', laTasta);
      el.removeAttribute('role');
      el.removeAttribute('tabindex');
      el.removeAttribute('aria-label');
      el.setAttribute('aria-hidden', 'true');
    };
  }

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    scena.removeAttribute('tabindex');
    scena.scrollLeft = 0;
    const curatenie = [];
    const cronometre = new Set();
    const dupa = (secunde, f) => {
      const t = setTimeout(() => {
        cronometre.delete(t);
        f();
      }, secunde * 1000);
      cronometre.add(t);
    };

    // ---------- 1) Plimbarea ----------
    const m = {};
    function masoara() {
      m.final = lume.offsetWidth - scena.clientWidth;
    }
    masoara();

    const MERS = 0.3; // momentul din cronologie în care pornește mersul (după ce violetul s-a retras pe jumătate)
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sectiune,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
      onUpdate: () => window.Coborarea.actualizeazaHud?.(),
    })
      .fromTo(violet, { opacity: 1 }, { opacity: 0, duration: 0.6 }, 0)
      .fromTo(lume, { x: 0 }, { x: () => -m.final, duration: 10 }, MERS)
      .fromTo(indiciu, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 2.4);

    ScrollTrigger.addEventListener('refreshInit', masoara);
    curatenie.push(() => ScrollTrigger.removeEventListener('refreshInit', masoara));

    // Cu tastatura: când focusul ajunge pe un mob din afara ecranului, pagina derulează până la el.
    function laFocus(e) {
      const el = e.target.closest('[role="button"]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.left >= 0 && r.right <= window.innerWidth) return;
      const st = tl.scrollTrigger;
      const inLume = r.left + r.width / 2 - scena.getBoundingClientRect().left - gsap.getProperty(lume, 'x');
      const tinta = Math.min(m.final, Math.max(0, inLume - scena.clientWidth / 2));
      const timp = MERS + (m.final > 0 ? (10 * tinta) / m.final : 0);
      window.scrollTo({ top: st.start + (timp / tl.duration()) * (st.end - st.start) });
    }
    lume.addEventListener('focusin', laFocus);
    curatenie.push(() => lume.removeEventListener('focusin', laFocus));

    // Hotbar-ul se vede cât ești în Nether.
    const arataHotbar = ScrollTrigger.create({
      trigger: sectiune,
      start: 'top 40%',
      end: 'bottom 60%',
      onToggle: (st) => hotbar.arata('nether', st.isActive),
    });
    curatenie.push(() => {
      arataHotbar.kill();
      hotbar.arata('nether', false);
    });

    // Scena tremură la impact (mingea de foc).
    function tremura(putere) {
      const p = pixel() * putere;
      gsap.fromTo(cutremur, { x: 0, y: 0 }, {
        keyframes: { x: [-3, 3, -2, 2, -1, 0].map((v) => v * p), y: [2, -2, 1, -1, 0, 0].map((v) => v * p) },
        duration: 0.4,
        ease: 'none',
      });
    }

    // ---------- Cubii de magma ----------
    const originale = [...sectiune.querySelectorAll('.nether__magma')].map((el) => ({
      x: parseFloat(el.style.getPropertyValue('--x')),
      marime: el.dataset.marime,
    }));

    function cubNou(x, marime) {
      const el = document.createElement('div');
      el.className = 'nether__magma';
      el.dataset.marime = String(marime);
      el.dataset.eticheta = 'Magma cube';
      el.style.setProperty('--x', x.toFixed(2));
      el.innerHTML = '<div class="nether__corp"><svg><use href="#cub-magma"/></svg></div>';
      lume.appendChild(el);
      activeazaCub(el);
      return el;
    }

    const cubi = new Map(); // element → funcția de dezactivare

    function activeazaCub(el) {
      cubi.set(el, butonul(el, () => lovesteCub(el)));
    }

    function scoateCub(el) {
      cubi.get(el)?.();
      cubi.delete(el);
      el.remove();
    }

    function lovesteCub(el) {
      if (el.dataset.lovit) return;
      el.dataset.lovit = '1';
      const marime = Number(el.dataset.marime);
      const x = parseFloat(el.style.getPropertyValue('--x'));
      const r = el.getBoundingClientRect();
      const c = centru(r);
      particule.explozie(c.x, c.y, {
        culori: culori('--nether-1', '--nether-2', '--lemn-4', '--apus-1'),
        numar: 14 + marime * 8,
        viteza: 60 * pixel(),
        marime: Math.max(3, Math.round(pixel())),
        gravitatie: 180 * pixel(),
        viata: 0.7,
      });

      const aveaFocus = document.activeElement === el;
      scoateCub(el);

      if (marime > 1) {
        // Doi cubi mai mici sar în lături din locul celui mare.
        const latimeVeche = marime === 3 ? 1.5 : 1;
        const noua = marime - 1;
        const latime = noua === 2 ? 1 : 0.5;
        const bloc = r.width / latimeVeche; // pixeli pe bloc
        const mijloc = x + latimeVeche / 2;
        [-1, 1].forEach((directie, i) => {
          const xNou = mijloc - latime / 2 + directie * latime * 0.9;
          const cub = cubNou(xNou, noua);
          const dx = (mijloc - latime / 2 - xNou) * bloc; // pornește din mijlocul cubului vechi
          gsap.timeline()
            .fromTo(cub, { x: dx, y: 0 }, { x: dx / 2, y: -bloc * 0.9, duration: 0.22, ease: 'power1.out' })
            .to(cub, { x: 0, y: 0, duration: 0.24, ease: 'power1.in' });
          if (aveaFocus && i === 0) cub.focus({ preventScroll: true });
        });
      } else {
        hotbar.colecteaza(r, 'crema-magma', '#crema-magma');
        // Când nu mai e niciun cub, vin alții, căzând din tavan.
        if (!lume.querySelector('.nether__magma')) {
          dupa(4, () => {
            for (const o of originale) {
              const cub = cubNou(o.x, Number(o.marime));
              gsap.from(cub, { y: -window.innerHeight * 0.6, duration: 0.7, ease: 'bounce.out' });
            }
          });
        }
      }
    }

    sectiune.querySelectorAll('.nether__magma').forEach(activeazaCub);
    curatenie.push(() => {
      [...cubi.keys()].forEach(scoateCub);
      // Cubii inițiali, în starea statică.
      for (const o of originale) {
        const el = document.createElement('div');
        el.className = 'nether__magma';
        el.dataset.marime = o.marime;
        el.dataset.eticheta = 'Magma cube';
        el.setAttribute('aria-hidden', 'true');
        el.style.setProperty('--x', String(o.x));
        el.innerHTML = '<div class="nether__corp"><svg><use href="#cub-magma"/></svg></div>';
        lume.appendChild(el);
      }
    });

    // ---------- Resturile antice ----------
    const resturi = sectiune.querySelector('.nether__resturi');
    const resturiCorp = resturi.querySelector('.nether__corp');
    const resturiFoaie = resturi.querySelector('.nether__foaie');
    let lovituri = 0;

    function seteazaFisuri(cadru) {
      resturiFoaie.style.transform = `translateX(${-Math.min(9, cadru) * 10}%)`;
    }

    curatenie.push(butonul(resturi, () => {
      if (resturi.classList.contains('nether__resturi--spart')) return;
      lovituri += 1;
      const r = resturi.getBoundingClientRect();
      const c = centru(r);
      if (lovituri < 5) {
        seteazaFisuri(lovituri * 2);
        gsap.fromTo(resturiCorp, { x: 0 }, { keyframes: { x: [-2, 2, -1, 0].map((v) => v * pixel()) }, duration: 0.18, ease: 'none' });
        particule.explozie(c.x, c.y, {
          culori: culori('--lemn-2', '--lemn-3', '--lemn-4'),
          numar: 8,
          viteza: 40 * pixel(),
          marime: Math.max(2, Math.round(pixel())),
          gravitatie: 150 * pixel(),
          viata: 0.5,
        });
        return;
      }
      resturi.classList.add('nether__resturi--spart');
      particule.explozie(c.x, c.y, {
        culori: culori('--lemn-2', '--lemn-3', '--lemn-4', '--obsidian-4'),
        numar: 45,
        viteza: 55 * pixel(),
        marime: Math.max(3, Math.round(pixel() * 1.2)),
        gravitatie: 150 * pixel(),
        viata: 0.9,
      });
      hotbar.colecteaza(r, 'resturi', '#resturi');
      // Blocul crește la loc după un timp, ca să poată fi minat din nou.
      dupa(12, () => {
        lovituri = 0;
        seteazaFisuri(0);
        resturi.classList.remove('nether__resturi--spart');
        gsap.fromTo(resturiCorp, { scale: 0.2 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
      });
    }));
    curatenie.push(() => {
      lovituri = 0;
      seteazaFisuri(0);
      resturi.classList.remove('nether__resturi--spart');
      gsap.set(resturiCorp, { clearProps: 'all' });
    });

    // ---------- Piglinul ----------
    const piglin = sectiune.querySelector('.nether__piglin');
    const piglinCorp = piglin.querySelector('.nether__corp');
    const piglinAur = piglin.querySelector('.nether__piglin-aur');
    const balon = piglin.querySelector('.nether__balon');
    let piglinOcupat = false;

    curatenie.push(butonul(piglin, async () => {
      if (piglinOcupat) return;
      piglinOcupat = true;
      if (hotbar.numar('aur') > 0) {
        // Aurul zboară din hotbar în mâna piglinului, el îl admiră, apoi aruncă fier.
        const slot = hotbar.cutie('aur');
        hotbar.adauga('aur', -1, false);
        await hotbar.zbor(slot, piglinAur.getBoundingClientRect(), '#lingou-aur');
        gsap.set(piglinAur, { opacity: 1 });
        await gsap.to(piglinCorp, {
          keyframes: { rotation: [-6, 5, -4, 3, 0] },
          duration: 1.6,
          ease: 'none',
          transformOrigin: '50% 100%',
        });
        gsap.set(piglinAur, { opacity: 0 });
        const r = piglin.getBoundingClientRect();
        particule.explozie(r.left + r.width / 2, r.top + r.height * 0.4, {
          culori: culori('--apus-1', '--apus-2'),
          numar: 10,
          viteza: 40 * pixel(),
          marime: 3,
          gravitatie: 100 * pixel(),
          viata: 0.6,
        });
        await hotbar.colecteaza(r, 'fier', '#bloc-fier');
      } else {
        // Fără aur: piglinul dă din cap și arată un lingou într-un balon.
        gsap.fromTo(balon, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2 });
        await gsap.fromTo(piglinCorp, { x: 0 }, { keyframes: { x: [-2, 2, -2, 2, 0].map((v) => v * pixel()) }, duration: 0.5, ease: 'none' });
        await gsap.to(balon, { opacity: 0, duration: 0.3, delay: 1 });
      }
      piglinOcupat = false;
    }));
    curatenie.push(() => gsap.set([piglinCorp, piglinAur, balon], { clearProps: 'all' }));

    // ---------- Blaze-ul și strider-ul ----------
    const blaze = sectiune.querySelector('.nether__blaze');
    curatenie.push(butonul(blaze, () => {
      blaze.classList.add('nether__blaze--furios');
      const r = blaze.getBoundingClientRect();
      particule.explozie(r.left + r.width / 2, r.top + r.height * 0.3, {
        culori: culori('--apus-1', '--apus-2', '--nether-2', '--nether-3'),
        numar: 30,
        viteza: 70 * pixel(),
        marime: Math.max(3, Math.round(pixel())),
        gravitatie: -40 * pixel(),
        viata: 0.8,
      });
      dupa(1.4, () => blaze.classList.remove('nether__blaze--furios'));
    }));

    const strider = sectiune.querySelector('.nether__strider');
    const striderCorp = strider.querySelector('.nether__corp');
    curatenie.push(butonul(strider, () => {
      if (gsap.isTweening(striderCorp)) return;
      const r = strider.getBoundingClientRect();
      gsap.timeline()
        .to(striderCorp, { y: -r.height * 0.7, duration: 0.25, ease: 'power2.out' })
        .to(striderCorp, { y: 0, duration: 0.3, ease: 'power2.in' })
        .call(() => {
          const s = strider.getBoundingClientRect();
          particule.explozie(s.left + s.width / 2, s.bottom, {
            culori: culori('--nether-1', '--nether-2', '--apus-1'),
            numar: 16,
            viteza: 50 * pixel(),
            marime: 3,
            gravitatie: 200 * pixel(),
            viata: 0.6,
          });
        });
    }));
    curatenie.push(() => gsap.set(striderCorp, { clearProps: 'all' }));

    // ---------- Ghast-ul ----------
    const ghast = sectiune.querySelector('.nether__ghast');
    const ghastCorp = ghast.querySelector('.nether__corp');
    const ghastUse = ghast.querySelector('use');
    const lovit = ghast.querySelector('.nether__lovit');
    let ghastViu = true;
    let minge = null; // { el, zbor, stare: 'vine' | 'intoarce' }
    let ultimaTragere = 0;

    const peEcran = (r) => r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
    const inScena = (x, y) => {
      const s = scena.getBoundingClientRect();
      return { x: x - s.left, y: y - s.top };
    };
    // Gura ghast-ului, în coordonatele scenei.
    function gura() {
      const r = ghastCorp.getBoundingClientRect();
      return inScena(r.left + r.width / 2, r.top + r.height * 0.45);
    }

    function trage() {
      if (!ghastViu || minge) return;
      ultimaTragere = performance.now();
      ghastUse.setAttribute('href', '#ghast-trage');
      dupa(0.35, () => {
        if (!ghastViu) return;
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'nether__minge';
        el.setAttribute('aria-label', 'Fireball: hit it back');
        el.innerHTML = '<svg aria-hidden="true"><use href="#minge-foc"/></svg>';
        scena.appendChild(el);
        const marime = el.offsetWidth;
        const start = gura();
        const tinta = { x: scena.clientWidth * 0.5, y: scena.clientHeight * 0.55 };
        minge = { el, stare: 'vine' };
        el.addEventListener('click', (e) => {
          e.preventDefault();
          intoarce();
        });
        minge.zbor = gsap.timeline({ onComplete: impact })
          .fromTo(el,
            { x: start.x - marime / 2, y: start.y - marime / 2, scale: 0.6, rotation: 0 },
            { x: tinta.x - marime / 2, y: tinta.y - marime / 2, scale: 4, rotation: 360, duration: 2.6, ease: 'power1.in' });
        dupa(0.5, () => { if (ghastViu) ghastUse.setAttribute('href', '#ghast'); });
      });
    }

    // Mingea ajunge la tine: explozie și ecranul tremură.
    function impact() {
      if (!minge) return;
      const r = minge.el.getBoundingClientRect();
      const c = centru(r);
      minge.el.remove();
      minge = null;
      particule.explozie(c.x, c.y, {
        culori: culori('--apus-1', '--nether-1', '--nether-2', '--nether-3', '--lemn-4'),
        numar: 90,
        viteza: 120 * pixel(),
        marime: Math.max(4, Math.round(pixel() * 2)),
        gravitatie: 200 * pixel(),
        viata: 1,
      });
      tremura(1.5);
    }

    // Lovită la timp, mingea se întoarce în ghast.
    function intoarce() {
      if (!minge || minge.stare !== 'vine') return;
      minge.stare = 'intoarce';
      minge.zbor.kill();
      const el = minge.el;
      const marime = el.offsetWidth;
      const g = gura();
      const lovitura = centru(el.getBoundingClientRect());
      particule.explozie(lovitura.x, lovitura.y, {
        culori: culori('--apus-1', '--nether-1'),
        numar: 12,
        viteza: 80 * pixel(),
        marime: 3,
        gravitatie: 0,
        viata: 0.4,
      });
      minge.zbor = gsap.to(el, {
        x: g.x - marime / 2,
        y: g.y - marime / 2,
        scale: 0.6,
        rotation: '-=540',
        duration: 0.45,
        ease: 'power1.out',
        onComplete: doboara,
      });
    }

    function doboara() {
      if (minge) {
        minge.el.remove();
        minge = null;
      }
      ghastViu = false;
      ghastUse.setAttribute('href', '#ghast-trage');
      const r = ghastCorp.getBoundingClientRect();
      const c = centru(r);
      particule.explozie(c.x, c.y, {
        culori: culori('--os-1', '--os-2', '--apus-1', '--nether-2'),
        numar: 60,
        viteza: 90 * pixel(),
        marime: Math.max(3, Math.round(pixel() * 1.5)),
        gravitatie: 120 * pixel(),
        viata: 1,
      });
      gsap.timeline()
        .to(lovit, { opacity: 1, duration: 0.08, repeat: 3, yoyo: true })
        .to(ghastCorp, { y: r.height * 0.4, rotation: 18, autoAlpha: 0, duration: 0.8, ease: 'power2.in' });
      hotbar.colecteaza(r, 'lacrima-ghast', '#lacrima-ghast');
      // Alt ghast apare după câteva secunde.
      dupa(7, () => {
        ghastUse.setAttribute('href', '#ghast');
        gsap.set(lovit, { opacity: 0 });
        gsap.fromTo(ghastCorp, { y: -r.height * 0.5, rotation: 0, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 1.2,
          ease: 'power1.out',
          onComplete() { ghastViu = true; },
        });
      });
    }

    curatenie.push(butonul(ghast, () => {
      if (minge && minge.stare === 'vine') intoarce();
      else trage();
    }));

    // Ghast-ul trage singur la câteva secunde, cât e pe ecran.
    const santinela = setInterval(() => {
      if (!ghastViu || minge || document.hidden) return;
      if (!peEcran(ghastCorp.getBoundingClientRect())) return;
      if (performance.now() - ultimaTragere > 4200 + Math.random() * 1500) trage();
    }, 500);
    curatenie.push(() => {
      clearInterval(santinela);
      if (minge) {
        minge.zbor?.kill();
        minge.el.remove();
        minge = null;
      }
      ghastViu = true;
      ghastUse.setAttribute('href', '#ghast');
      gsap.set([ghastCorp, lovit, cutremur], { clearProps: 'all' });
    });

    // Revenire la varianta statică dacă utilizatorul activează reduced-motion cu pagina deschisă.
    return () => {
      cronometre.forEach(clearTimeout);
      cronometre.clear();
      curatenie.reverse().forEach((f) => f());
      scena.setAttribute('tabindex', '0');
      gsap.set([lume, violet, indiciu], { clearProps: 'all' });
    };
  });
})();
