// Spațiu de nume comun: straturile (js/straturi/NN-nume.js) citesc de aici setările partajate.
// miscareRedusa e un MediaQueryList: verifică .matches la momentul folosirii, ca să prindă și schimbările live.
// areGsap e false dacă CDN-ul n-a răspuns: atunci straturile rămân pe varianta statică (convenția din base.css).
const areGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (areGsap) gsap.registerPlugin(ScrollTrigger);

window.Coborarea = {
  miscareRedusa: window.matchMedia('(prefers-reduced-motion: reduce)'),
  areGsap,
};

// Bara de adâncime: Y scade de la 64 (cer) la -64 (bedrock) odată cu scroll-ul.
const adancimeY = document.querySelector('.adancime__y');

function actualizeazaAdancimea() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progres = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  adancimeY.textContent = `Y: ${Math.round(64 - progres * 128)}`;
}

window.addEventListener('scroll', actualizeazaAdancimea, { passive: true });
actualizeazaAdancimea();
