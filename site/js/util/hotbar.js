// Hotbar-ul comun, folosit de peșteră (minereuri) și de Nether (prada de la mobi, schimbul cu piglinul).
// Coborarea.hotbar:
//   arata(sursa, da)          cere sau retrage vizibilitatea; hotbar-ul se vede cât cel puțin o sursă o cere
//   adauga(tip, d, animat)    schimbă numărul din slot (niciodată sub 0), cu un mic salt al icoanei
//   numar(tip), cutie(tip)    numărul curent și dreptunghiul slotului pe ecran
//   zbor(dela, spre, icon)    o copie a icoanei zboară între două dreptunghiuri de pe ecran (Promise)
//   colecteaza(dela, tip, icon)  zbor până în slot, apoi +1
(() => {
  const hotbar = document.querySelector('.hotbar');
  const sloturi = {};
  hotbar.querySelectorAll('[data-tip]').forEach((el) => {
    sloturi[el.dataset.tip] = { el, numar: 0, text: el.querySelector('.hotbar__numar'), icon: el.querySelector('svg') };
  });
  const cereri = new Set();

  function arata(sursa, da) {
    if (da) cereri.add(sursa); else cereri.delete(sursa);
    hotbar.classList.toggle('hotbar--vizibil', cereri.size > 0);
  }

  function adauga(tip, d, animat) {
    const slot = sloturi[tip];
    slot.numar = Math.max(0, slot.numar + d);
    slot.el.classList.toggle('hotbar__slot--plin', slot.numar > 0);
    slot.text.textContent = slot.numar > 1 ? String(slot.numar) : '';
    if (animat && d > 0 && window.Coborarea.areGsap) {
      gsap.fromTo(slot.icon, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
    }
  }

  const numar = (tip) => sloturi[tip].numar;
  const cutie = (tip) => sloturi[tip].el.getBoundingClientRect();

  // Copia icoanei e fixă peste pagină: sare puțin în sus, apoi cade în țintă.
  function zbor(dela, spre, icon) {
    return new Promise((gata) => {
      const marime = Math.max(24, spre.width * 0.64);
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('class', 'hotbar__zbor');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `<use href="${icon}"/>`;
      el.style.width = `${marime}px`;
      el.style.height = `${marime}px`;
      el.style.left = `${dela.left + dela.width / 2 - marime / 2}px`;
      el.style.top = `${dela.top + dela.height / 2 - marime / 2}px`;
      document.body.appendChild(el);
      const dx = spre.left + spre.width / 2 - (dela.left + dela.width / 2);
      const dy = spre.top + spre.height / 2 - (dela.top + dela.height / 2);
      gsap.timeline({ onComplete() { el.remove(); gata(); } })
        .fromTo(el, { scale: 0.5 }, { scale: 1.3, y: -marime * 0.8, duration: 0.25, ease: 'power2.out' })
        .to(el, { x: dx, y: dy, scale: 1, duration: 0.55, ease: 'power2.in' });
    });
  }

  function colecteaza(dela, tip, icon) {
    return zbor(dela, cutie(tip), icon).then(() => adauga(tip, 1, true));
  }

  window.Coborarea.hotbar = { arata, adauga, numar, cutie, zbor, colecteaza };
})();
