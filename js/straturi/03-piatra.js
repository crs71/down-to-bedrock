// Stratul 3: pământ și piatră.
// 1) Fisurile, bara și schimbarea blocurilor sunt doar în CSS (css/straturi/03-piatra.css). Aici urmărim
//    progresul aceluiași interval (contain 0–100% al .piatra__minerit) și aruncăm particule la fiecare spargere.
// 2) Cardurile cad cu gravitație (GSAP) când intră în ecran și sar puțin la aterizare, cu puțin praf.
(() => {
  const { miscareRedusa, areGsap } = window.Coborarea;
  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();

  // ---------- Spargerea blocurilor ----------
  const minerit = document.querySelector('.piatra__minerit');
  const blocuri = [...minerit.querySelectorAll('.piatra__bloc')];
  const praguri = [0.30, 0.58, 0.86]; // aceleași ca în keyframes bloc-1/2/3 din 03-piatra.css
  const areTimeline = CSS.supports('animation-timeline: view()');
  let progresAnterior = null;

  function progresMinerit() {
    const r = minerit.getBoundingClientRect();
    const drum = r.height - window.innerHeight;
    return drum > 0 ? -r.top / drum : 0;
  }

  function sparge(bloc) {
    const r = bloc.getBoundingClientRect();
    const pixel = r.width / 16;
    window.Coborarea.particule.explozie(r.left + r.width / 2, r.top + r.height / 2, {
      culori: bloc.dataset.culori.split(' ').map(variabila),
      numar: 60,
      viteza: 45 * pixel,
      marime: Math.round(pixel * 1.5),
      gravitatie: 120 * pixel,
      viata: 0.9,
    });
  }

  function verificaSpargeri() {
    if (!areTimeline || miscareRedusa.matches) return;
    const p = progresMinerit();
    if (progresAnterior !== null) {
      praguri.forEach((prag, i) => {
        if (progresAnterior < prag && p >= prag) sparge(blocuri[i]);
      });
    }
    progresAnterior = p;
  }

  window.addEventListener('scroll', verificaSpargeri, { passive: true });

  // ---------- Cardurile cu gravitație ----------
  if (!areGsap) return;
  const lista = document.querySelector('.carduri');
  const carduri = [...lista.querySelectorAll('.card')];

  function praf(card) {
    const r = card.getBoundingClientRect();
    const optiuni = {
      culori: ['--piatra-1', '--piatra-2'].map(variabila),
      numar: 6,
      viteza: 140,
      marime: 4,
      gravitatie: 500,
      viata: 0.5,
    };
    window.Coborarea.particule.explozie(r.left + 8, r.bottom, optiuni);
    window.Coborarea.particule.explozie(r.right - 8, r.bottom, optiuni);
  }

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set(carduri, { autoAlpha: 0 });

    ScrollTrigger.create({
      trigger: lista,
      start: 'top 80%',
      once: true,
      onEnter() {
        const tl = gsap.timeline();
        // Distanțele se măsoară o singură dată, înainte de animație: o funcție ar fi reevaluată
        // de GSAP la prima redare, când cardul e deja mutat în sus.
        const inaltimi = carduri.map((card) => card.getBoundingClientRect().bottom + 40);
        carduri.forEach((card, i) => {
          const start = i * 0.16;
          const cadere = 0.6;
          tl.fromTo(card,
            { y: -inaltimi[i], rotation: i % 2 ? 4 : -4, autoAlpha: 1 },
            { y: 0, rotation: 0, duration: cadere, ease: 'power2.in' },
            start)
            .call(praf, [card], start + cadere)
            .to(card, { y: -10, duration: 0.1, ease: 'power1.out' }, start + cadere)
            .to(card, { y: 0, duration: 0.14, ease: 'power1.in' }, start + cadere + 0.1);
        });
      },
    });
  });
})();
