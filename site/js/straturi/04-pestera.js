// Stratul 4: peștera.
// Torța (requestAnimationFrame, doar cât peștera e pe ecran): cu mouse urmează cursorul; pe ecranele tactile
// (sau până miști mouse-ul) urmează un drum legat de scroll, care trece pe la fiecare minereu exact când e găsit.
// Minereurile se găsesc la praguri de scroll: pulsează, zboară în hotbar și cresc numărul din slot;
// la scroll înapoi se întorc în perete. Fără GSAP, torța merge, dar minereurile rămân doar să sclipească.
(() => {
  const { miscareRedusa, areGsap } = window.Coborarea;
  const sectiune = document.querySelector('.strat--pestera');
  const scena = sectiune.querySelector('.pestera__scena');
  const intuneric = sectiune.querySelector('.pestera__intuneric');
  const torta = sectiune.querySelector('.pestera__torta');
  const hotbar = document.querySelector('.hotbar');
  const areMouse = window.matchMedia('(hover: hover) and (pointer: fine)');

  const minereuri = [...sectiune.querySelectorAll('.minereu')].map((el) => ({
    el,
    tip: el.dataset.tip,
    prag: parseFloat(el.dataset.prag),
    stare: 'ascuns', // ascuns → zbor → colectat
    tl: null,
    x: 0,
    y: 0,
  }));

  const sloturi = {};
  hotbar.querySelectorAll('[data-tip]').forEach((el) => {
    sloturi[el.dataset.tip] = { el, numar: 0, text: el.querySelector('.hotbar__numar'), icon: el.querySelector('svg') };
  });

  let pornit = false;
  let vizibil = false;
  let bucla = 0;
  let mouse = null;
  const curent = { x: 0, y: 0 };
  let primaData = true;
  let progresAnterior = null;
  let latimeTorta = 0;

  // Progresul prin peșteră: 0 când scena se lipește sus, 1 când se desprinde.
  function progres() {
    const r = sectiune.getBoundingClientRect();
    const drum = r.height - window.innerHeight;
    return drum > 0 ? -r.top / drum : 0;
  }

  // Centrele minereurilor în coordonatele scenei. Stilurile calculate (left/top/width) nu includ
  // transformările din timpul zborului, deci măsurătoarea e corectă oricând.
  function masoara() {
    latimeTorta = parseFloat(getComputedStyle(torta).width); // <svg> nu are offsetWidth
    for (const m of minereuri) {
      const st = getComputedStyle(m.el);
      m.x = parseFloat(st.left) + parseFloat(st.width) / 2;
      m.y = parseFloat(st.top) + parseFloat(st.height) / 2;
    }
  }

  // Drumul torței: de la mijlocul scenei, pe la fiecare minereu (la pragul lui), până jos.
  function drum(p) {
    const s = scena.getBoundingClientRect();
    const puncte = [
      { p: 0, x: s.width * 0.5, y: s.height * 0.42 },
      ...minereuri.map((m) => ({ p: m.prag, x: m.x, y: m.y })),
      { p: 0.86, x: s.width * 0.5, y: s.height * 0.6 }, // departe de marginea de jos, unde începe mina
    ];
    if (p <= 0) return puncte[0];
    for (let i = 1; i < puncte.length; i++) {
      const a = puncte[i - 1];
      const b = puncte[i];
      if (p <= b.p) {
        const t = (p - a.p) / (b.p - a.p);
        const u = t * t * (3 - 2 * t); // pornire și oprire line
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
      }
    }
    return puncte[puncte.length - 1];
  }

  function cadru() {
    if (!vizibil || !pornit) {
      bucla = 0;
      return;
    }
    const s = scena.getBoundingClientRect();
    const tinta = mouse && areMouse.matches
      ? { x: mouse.x - s.left, y: mouse.y - s.top }
      : drum(progres());
    curent.x += (tinta.x - curent.x) * 0.18;
    curent.y += (tinta.y - curent.y) * 0.18;
    const jumatate = intuneric.offsetWidth / 2;
    const t = latimeTorta;
    intuneric.style.transform = `translate3d(${curent.x - jumatate}px, ${curent.y - jumatate}px, 0)`;
    // Flacăra (rândurile 2–6 din sprite) cade în centrul luminii.
    torta.style.transform = `translate3d(${curent.x - t / 2}px, ${curent.y - t * 0.28}px, 0)`;
    bucla = requestAnimationFrame(cadru);
  }

  function pornesteBucla() {
    if (!bucla && vizibil && pornit) bucla = requestAnimationFrame(cadru);
  }

  // ---------- Minereurile și hotbar-ul ----------
  function adauga(tip, d, animat) {
    const slot = sloturi[tip];
    slot.numar = Math.max(0, slot.numar + d);
    slot.el.classList.toggle('hotbar__slot--plin', slot.numar > 0);
    slot.text.textContent = slot.numar > 1 ? String(slot.numar) : '';
    if (animat && d > 0) gsap.fromTo(slot.icon, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
  }

  function gaseste(m, animat) {
    m.el.classList.add('minereu--gasit');
    if (!animat) {
      m.stare = 'colectat';
      gsap.set(m.el, { opacity: 0 });
      adauga(m.tip, 1, false);
      return;
    }
    m.stare = 'zbor';
    const a = m.el.getBoundingClientRect();
    const b = sloturi[m.tip].el.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    m.tl = gsap.timeline({
      onComplete() {
        m.stare = 'colectat';
        adauga(m.tip, 1, true);
      },
    })
      // Opacitatea separat: cu yoyo, pulsul ar readuce-o la sclipirea slabă de dinainte.
      .set(m.el, { opacity: 1 })
      .to(m.el, { scale: 1.3, duration: 0.14, repeat: 3, yoyo: true, ease: 'power1.inOut' })
      .to(m.el, { x: dx, y: dy, scale: (b.width * 0.64) / a.width, duration: 0.6, ease: 'power2.in' })
      .set(m.el, { opacity: 0 });
  }

  function intoarce(m) {
    if (m.tl) m.tl.kill();
    m.tl = null;
    if (m.stare === 'colectat') adauga(m.tip, -1, false);
    m.stare = 'ascuns';
    gsap.set(m.el, { clearProps: 'transform,opacity' });
    m.el.classList.remove('minereu--gasit');
  }

  function laScroll() {
    if (!pornit) return;
    // Fără GSAP minereurile nu pot zbura, deci nici hotbar-ul n-are ce arăta.
    if (!areGsap) return;
    const p = progres();
    hotbar.classList.toggle('hotbar--vizibil', p > -0.12 && p < 1.02);
    for (const m of minereuri) {
      if (p >= m.prag && m.stare === 'ascuns') {
        // Animat doar când chiar treci prin prag cu scena pe ecran; la încărcare sau la un salt, direct în hotbar.
        const animat = !primaData && progresAnterior !== null && progresAnterior >= m.prag - 0.15 && p < 1;
        gaseste(m, animat);
      } else if (p < m.prag && m.stare !== 'ascuns') {
        intoarce(m);
      }
    }
    primaData = false;
    progresAnterior = p;
  }

  // ---------- Pornire / oprire, după preferința de mișcare ----------
  function porneste() {
    pornit = true;
    masoara();
    const s = scena.getBoundingClientRect();
    curent.x = s.width * 0.5;
    curent.y = s.height * 0.42;
    laScroll();
    pornesteBucla();
  }

  function opreste() {
    pornit = false;
    hotbar.classList.remove('hotbar--vizibil');
    if (areGsap) minereuri.forEach(intoarce);
    intuneric.style.transform = '';
    torta.style.transform = '';
    primaData = true;
    progresAnterior = null;
  }

  new IntersectionObserver(([intrare]) => {
    vizibil = intrare.isIntersecting;
    pornesteBucla();
  }).observe(sectiune);

  scena.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('scroll', laScroll, { passive: true });
  window.addEventListener('resize', () => { if (pornit) masoara(); });

  const laSchimbare = () => (miscareRedusa.matches ? opreste() : porneste());
  miscareRedusa.addEventListener('change', laSchimbare);
  if (!miscareRedusa.matches) porneste();
})();
