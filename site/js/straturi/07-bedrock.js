// Stratul 7: bedrock. Încercarea (nereușită) de a sparge blocul rulează doar cât e pe ecran.
// Respawn e un link simplu spre #cer: merge și fără JS, iar derularea lină vine din CSS (scroll-behavior).
(() => {
  const sectiune = document.querySelector('.strat--bedrock');
  const bloc = sectiune.querySelector('.bedrock__bloc');

  new IntersectionObserver(([intrare]) => {
    sectiune.classList.toggle('bedrock--sapa', intrare.isIntersecting);
  }, { threshold: 0.4 }).observe(bloc);
})();
