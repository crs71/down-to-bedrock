// Stratul 3: pământ și piatră, puțul săpat sub crater.
// 1) Alinierea: puțul stă sub crater, iar grila zidului trece exact prin marginile lui.
// 2) Săpatul lent (doar cu mișcare permisă; layout-ul vine din 03-piatra.css): scena e sticky, iar scroll-ul
//    din secțiune se împarte între blocuri după data-duritate. În porțiunea unui bloc: 72% crapă (10 cadre),
//    apoi se sparge, iar în rest camera coboară spre rândul următor. Camera stă pe loc cât rândul săpat e în
//    jumătatea de sus a ecranului; la final, fundul puțului ajunge exact la marginea de jos, unde începe peștera.
// 3) La fiecare spargere: particule, iar la unele blocuri un mesaj de realizare care cade de sus.
(() => {
  const { miscareRedusa, areGsap } = window.Coborarea;
  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();

  const sectiune = document.querySelector('.strat--piatra');
  const scena = sectiune.querySelector('.sapat__scena');
  const lume = sectiune.querySelector('.sapat');
  const tinta = sectiune.querySelector('.sapat__tinta');
  const bara = sectiune.querySelector('.sapat__bara i');
  const indiciu = sectiune.querySelector('.sapat__indiciu');
  const realizari = document.querySelector('.realizari');

  const CRAPA = 0.72; // partea din porțiunea unui bloc în care crapă; restul e căderea camerei
  const COADA = 0.6;  // porțiunea de după ultimul bloc (aceeași ca în 03-piatra.css: 12 + 0.6)

  let inceput = 0;
  const celule = [...sectiune.querySelectorAll('.sapat__celula')].map((el) => {
    const duritate = parseFloat(el.dataset.duritate) || 1;
    const c = {
      el,
      foaie: el.querySelector('.sapat__foaie'),
      inceput,
      duritate,
      cadru: -1,
      spart: false,
    };
    inceput += duritate;
    return c;
  });
  const TOTAL = inceput;

  // ---------- 1) Alinierea ----------
  // Centrul puțului vine de la suprafață (Coborarea.sapat, la finalul zoom-ului), altfel e mijlocul ecranului.
  function aliniaza() {
    const b2 = celule[0].el.offsetWidth;
    if (!b2) return;
    const centru = window.Coborarea.sapat?.centru ?? sectiune.clientWidth / 2;
    const stanga = centru - b2 / 2;
    const faza = (((stanga % b2) + b2) % b2) - b2;
    sectiune.style.setProperty('--sapat-stanga', `${stanga}px`);
    sectiune.style.setProperty('--sapat-faza', `${faza}px`);
  }

  window.Coborarea.aliniazaSapatul = aliniaza;
  aliniaza();

  // ---------- 3) Mesajele de realizare ----------
  const aratate = new Set();

  function realizare(nume, icon) {
    if (!areGsap || aratate.has(nume)) return;
    aratate.add(nume);

    const el = document.createElement('div');
    el.className = 'realizare';
    el.innerHTML = `<svg><use href="${icon}"/></svg><span><span class="realizare__eticheta">Achievement unlocked</span><span class="realizare__nume"></span></span>`;
    el.querySelector('.realizare__nume').textContent = nume;
    realizari.appendChild(el);

    // Cade de deasupra ecranului, sare puțin la aterizare, stă 2 secunde și dispare.
    const inaltime = el.getBoundingClientRect().bottom + 20;
    gsap.timeline({ onComplete: () => el.remove() })
      .fromTo(el, { y: -inaltime, rotation: -3 }, { y: 0, rotation: 0, duration: 0.7, ease: 'power2.in' })
      .to(el, { y: -8, duration: 0.1, ease: 'power1.out' })
      .to(el, { y: 0, duration: 0.14, ease: 'power1.in' })
      .to(el, { autoAlpha: 0, duration: 0.4 }, '+=2.2');
  }

  function sparge(c) {
    const r = c.el.getBoundingClientRect();
    const pixel = r.width / 16;
    window.Coborarea.particule.explozie(r.left + r.width / 2, r.top + r.height / 2, {
      culori: c.el.dataset.culori.split(' ').map(variabila),
      numar: 50,
      viteza: 45 * pixel,
      marime: Math.max(3, Math.round(pixel * 1.2)),
      gravitatie: 120 * pixel,
      viata: 0.9,
    });
    if (c.el.dataset.realizare) {
      realizare(c.el.dataset.realizare, c.el.querySelector('.sapat__intreg use').getAttribute('href'));
    }
  }

  // ---------- 2) Săpatul ----------
  const m = { b2: 0, scena: 0, pas: 1, camere: [] };

  // Camera pentru rândul i: rândul pe la mijlocul ecranului, dar fără să iasă din lume (sus 0, jos fundul puțului).
  function masoara() {
    m.b2 = celule[0].el.offsetWidth;
    m.scena = scena.clientHeight;
    m.pas = (sectiune.offsetHeight - m.scena) / (TOTAL + COADA) || 1;
    const maxim = Math.max(0, m.b2 * celule.length - m.scena);
    m.camere = celule.map((_, i) => Math.min(maxim, Math.max(0, (i + 0.5) * m.b2 - m.scena / 2)));
    m.camere.push(maxim);
  }

  const lin = (t) => t * t * (3 - 2 * t);
  let activ = false;
  let uAnterior = null;
  let cerut = false;

  function seteazaCadru(c, cadru) {
    if (c.cadru === cadru) return;
    c.cadru = cadru;
    c.foaie.style.transform = `translateX(${-Math.max(0, cadru) * 10}%)`;
  }

  function actualizeaza() {
    cerut = false;
    if (!activ) return;
    const u = -sectiune.getBoundingClientRect().top / m.pas; // unități de duritate săpate
    let camera = m.camere[0];
    let rand = 0;
    let umplere = 0;

    for (let i = 0; i < celule.length; i++) {
      const c = celule[i];
      const local = (u - c.inceput) / c.duritate;
      const spart = local >= CRAPA;

      if (local < 0) {
        seteazaCadru(c, -1);
      } else if (!spart) {
        const cadru = Math.min(9, Math.floor((local / CRAPA) * 10));
        seteazaCadru(c, cadru);
        rand = i;
        umplere = cadru / 9;
        camera = m.camere[i];
      } else {
        rand = i + 1;
        camera = local < 1 ? m.camere[i] + (m.camere[i + 1] - m.camere[i]) * lin((local - CRAPA) / (1 - CRAPA)) : m.camere[i + 1];
      }

      if (spart !== c.spart) {
        c.spart = spart;
        c.el.classList.toggle('sapat__celula--spart', spart);
        // Efectele doar când chiar sapi prin bloc: nu la prima măsurătoare și nu la un salt (End, un link).
        const prag = c.inceput + c.duritate * CRAPA;
        if (spart && uAnterior !== null && uAnterior >= prag - 1.5 && u < prag + 1.5) sparge(c);
      }
    }

    lume.style.transform = `translate3d(0, ${-camera}px, 0)`;
    tinta.style.transform = `translate3d(0, ${rand * m.b2}px, 0)`;
    tinta.style.opacity = rand < celule.length ? '' : '0';
    bara.style.transform = `scaleX(${umplere})`;
    indiciu.classList.toggle('sapat__indiciu--ascuns', u > 0.4);
    uAnterior = u;
  }

  function cere() {
    if (!cerut) {
      cerut = true;
      requestAnimationFrame(actualizeaza);
    }
  }

  function porneste() {
    activ = true;
    uAnterior = null;
    masoara();
    actualizeaza();
  }

  function opreste() {
    activ = false;
    lume.style.transform = '';
    tinta.style.transform = '';
    for (const c of celule) {
      c.spart = false;
      c.el.classList.remove('sapat__celula--spart');
      seteazaCadru(c, -1);
    }
  }

  window.addEventListener('scroll', cere, { passive: true });
  window.addEventListener('resize', () => {
    aliniaza();
    if (activ) {
      masoara();
      cere();
    }
  });
  miscareRedusa.addEventListener('change', () => (miscareRedusa.matches ? opreste() : porneste()));
  if (!miscareRedusa.matches) porneste();
})();
