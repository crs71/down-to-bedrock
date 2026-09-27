// Spațiu de nume comun: straturile (js/straturi/NN-nume.js) citesc de aici setările partajate.
// miscareRedusa e un MediaQueryList: verifică .matches la momentul folosirii, ca să prindă și schimbările live.
// areGsap e false dacă CDN-ul n-a răspuns: atunci straturile rămân pe varianta statică (convenția din base.css).
const areGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (areGsap) gsap.registerPlugin(ScrollTrigger);

window.Coborarea = {
  miscareRedusa: window.matchMedia('(prefers-reduced-motion: reduce)'),
  areGsap,
};

// HUD: adâncimea Y și biomul. Fiecare secțiune are data-y="sus jos" și data-biom; Y se interpolează după
// cât din secțiune a trecut de mijlocul ecranului. La secțiunile fixate de GSAP se măsoară pin-spacer-ul,
// altfel secțiunea ar sta pe loc cât e fixată și Y n-ar mai coborî.
(() => {
  const hudY = document.querySelector('.hud__y');
  const hud = document.querySelector('.hud');
  const hudBiom = document.querySelector('.hud__biom');
  const sectiuni = [...document.querySelectorAll('[data-y][data-biom]')].map((el) => {
    const [sus, jos] = el.dataset.y.split(' ').map(Number);
    return { el, sus, jos, biom: el.dataset.biom };
  });
  let biomCurent = hudBiom.textContent;
  let yCurent = null;

  function cutie(s) {
    const parinte = s.el.parentElement;
    return (parinte && parinte.classList.contains('pin-spacer') ? parinte : s.el).getBoundingClientRect();
  }

  function actualizeaza() {
    const mijloc = window.innerHeight / 2;
    let gasit = sectiuni[0];
    let t = 0;
    for (const s of sectiuni) {
      const r = cutie(s);
      if (r.top <= mijloc) {
        gasit = s;
        t = Math.min(1, Math.max(0, (mijloc - r.top) / r.height));
      }
    }
    // Sub lume (secțiunea „Cum e făcut site-ul”) HUD-ul se ascunde, ca să nu stea peste text.
    hud.classList.toggle('hud--ascuns', gasit.el.dataset.hud === 'ascuns');
    const y = Math.round(gasit.sus + (gasit.jos - gasit.sus) * t);
    if (y !== yCurent) {
      yCurent = y;
      hudY.textContent = `Y: ${y}`;
    }
    if (gasit.biom !== biomCurent) {
      biomCurent = gasit.biom;
      hudBiom.textContent = biomCurent;
      hudBiom.classList.remove('hud__biom--nou');
      void hudBiom.offsetWidth; // repornește animația de schimbare
      hudBiom.classList.add('hud__biom--nou');
    }
  }

  window.addEventListener('scroll', actualizeaza, { passive: true });
  window.addEventListener('resize', actualizeaza);
  window.addEventListener('load', actualizeaza);
  actualizeaza();
})();
