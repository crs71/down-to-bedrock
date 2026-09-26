// Stratul 1: cerul. Titlul se construiește din blocuri care cad pe rând și sar puțin la aterizare.
// Cerul, soarele și norii sunt animați doar din CSS (css/straturi/01-cer.css).
(() => {
  const blocuri = document.querySelectorAll('.titlu__bloc');

  if (!window.Coborarea.areGsap) {
    // Fără GSAP: blocurile apar direct pe poziția finală.
    blocuri.forEach((bloc) => { bloc.style.visibility = 'visible'; });
    return;
  }

  // Cu reduced-motion, CSS-ul nu ascunde blocurile și animația nu se creează deloc.
  // gsap.matchMedia o anulează și singur dacă preferința se schimbă în timp ce pagina e deschisă.
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const cadere = 0.55;
    const tl = gsap.timeline({ delay: 0.3 });

    blocuri.forEach((bloc, i) => {
      const start = i * 0.12;
      const saritura = bloc.getBoundingClientRect().height / 10;

      tl.fromTo(bloc,
        { y: () => -(bloc.getBoundingClientRect().bottom + 20), autoAlpha: 1 },
        { y: 0, duration: cadere, ease: 'power2.in' },
        start)
        .to(bloc, { y: -saritura, duration: 0.09, ease: 'power1.out' }, start + cadere)
        .to(bloc, { y: 0, duration: 0.12, ease: 'power1.in' }, start + cadere + 0.09);
    });
  });
})();
