// Stratul 3: pământ și piatră, puțul săpat sub crater.
// Fisurile și spargerea fiecărui bloc sunt doar în CSS (view(), cover 25% → 50%, în 03-piatra.css). Aici:
// 1) aliniem puțul cu craterul de la suprafață și grila zidului cu puțul;
// 2) bara de minerit urmează blocul care crapă acum;
// 3) la fiecare spargere aruncăm particule, iar la unele blocuri cade de sus un mesaj de realizare.
(() => {
  const { miscareRedusa, areGsap } = window.Coborarea;
  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();

  const sectiune = document.querySelector('.strat--piatra');
  const celule = [...sectiune.querySelectorAll('.sapat__celula')];
  const bara = sectiune.querySelector('.sapat__bara i');
  const realizari = document.querySelector('.realizari');
  const areTimeline = CSS.supports('animation-timeline: view()');
  const INCEPUT = 0.25;  // aceleași valori ca animation-range: cover 25% cover 50%
  const SPARGERE = 0.5;

  // ---------- 1) Alinierea ----------
  // Centrul puțului vine de la suprafață (Coborarea.sapat, la finalul zoom-ului), altfel e mijlocul ecranului.
  // Faza zidului mută grila de blocuri ca o margine de bloc să cadă exact pe marginea puțului.
  function aliniaza() {
    const b2 = celule[0].offsetWidth;
    if (!b2) return;
    const centru = window.Coborarea.sapat?.centru ?? sectiune.clientWidth / 2;
    const stanga = centru - b2 / 2;
    const faza = (((stanga % b2) + b2) % b2) - b2;
    sectiune.style.setProperty('--sapat-stanga', `${stanga}px`);
    sectiune.style.setProperty('--sapat-faza', `${faza}px`);
  }

  window.Coborarea.aliniazaSapatul = aliniaza;
  aliniaza();
  window.addEventListener('resize', aliniaza);

  // ---------- 3) Mesajele de realizare ----------
  const aratate = new Set();

  function realizare(nume, icon) {
    if (!areGsap || aratate.has(nume)) return;
    aratate.add(nume);

    const el = document.createElement('div');
    el.className = 'realizare';
    el.innerHTML = `<svg><use href="${icon}"/></svg><span><span class="realizare__eticheta">Realizare deblocată</span><span class="realizare__nume"></span></span>`;
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

  // ---------- Spargerea ----------
  function sparge(celula) {
    const r = celula.getBoundingClientRect();
    const pixel = r.width / 16;
    window.Coborarea.particule.explozie(r.left + r.width / 2, r.top + r.height / 2, {
      culori: celula.dataset.culori.split(' ').map(variabila),
      numar: 50,
      viteza: 45 * pixel,
      marime: Math.max(3, Math.round(pixel * 1.2)),
      gravitatie: 120 * pixel,
      viata: 0.9,
    });
    if (celula.dataset.realizare) {
      realizare(celula.dataset.realizare, celula.querySelector('.sapat__intreg use').getAttribute('href'));
    }
  }

  // ---------- 2) Bara și pragurile, la fiecare scroll ----------
  // Progresul unei celule = poziția ei în intervalul `cover` al view(): 0 când intră pe jos, 1 când iese pe sus.
  const anterior = celule.map(() => null);

  function progres(el) {
    const r = el.getBoundingClientRect();
    return (window.innerHeight - r.top) / (window.innerHeight + r.height);
  }

  function laScroll() {
    if (!areTimeline || miscareRedusa.matches) return;
    let umplere = 0;
    celule.forEach((celula, i) => {
      const p = progres(celula);
      const pAnterior = anterior[i];
      // Spargem doar blocul care chiar a trecut prin zona de crăpare: nu la prima măsurătoare
      // (pagina deschisă la mijloc) și nu când un salt (tasta End, un link) trece peste el.
      if (pAnterior !== null && pAnterior < SPARGERE && p >= SPARGERE
        && pAnterior >= INCEPUT - 0.1 && p < 0.8) {
        sparge(celula);
      }
      anterior[i] = p;
      if (p >= INCEPUT && p < SPARGERE) {
        umplere = Math.min(9, Math.floor(((p - INCEPUT) / (SPARGERE - INCEPUT)) * 10)) / 9;
      }
    });
    bara.style.transform = `scaleX(${umplere})`;
  }

  window.addEventListener('scroll', laScroll, { passive: true });
  laScroll();
})();
