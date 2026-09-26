// Spațiu de nume comun: straturile (js/straturi/NN-nume.js) citesc de aici setările partajate.
// miscareRedusa e un MediaQueryList: verifică .matches la momentul folosirii, ca să prindă și schimbările live.
window.Coborarea = {
  miscareRedusa: window.matchMedia('(prefers-reduced-motion: reduce)'),
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
