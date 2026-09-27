// „Cum e făcut site-ul”: cardurile cad cu gravitație (GSAP) când intră în ecran,
// se îndreaptă, sar puțin la aterizare și ridică praf.
(() => {
  if (!window.Coborarea.areGsap) return;

  const variabila = (nume) => getComputedStyle(document.documentElement).getPropertyValue(nume).trim();
  const lista = document.querySelector('.despre .carduri');
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
