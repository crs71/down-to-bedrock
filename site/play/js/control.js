// Intrările, adunate într-o singură stare pe care o citește bucla jocului.
// - Tastatură: A/D sau săgeți pentru mers, W, săgeata sus sau Space pentru săritură, 1–9 pentru slot,
//   E pentru crafting, I pentru rucsac.
// - Mouse: ținta e sub cursor; click stânga ținut apăsat sapă, click dreapta pune blocul din slot.
// - Atingere: butoanele de pe ecran pentru mers și săritură; atingi un bloc și ții apăsat ca să-l sapi.
//   Butonul de mod trece între săpat și construit (în modul construit, o atingere pune un bloc).
// Degetul sau mouse-ul rămân legate de element chiar dacă ies din el (unele browsere refuză pentru
// evenimente sintetice sau deja încheiate; atunci mergem mai departe fără).
function captureaza(el, id) {
  try {
    el.setPointerCapture(id);
  } catch {
    // nimic de făcut
  }
}

export function creeazaIntrare(canvas, butoane) {
  const stare = {
    stanga: false,
    dreapta: false,
    sus: false,
    mina: false,        // săpatul e ținut apăsat
    pune: false,        // cerere de a pune un bloc (consumată de joc)
    tinta: null,        // punctul țintit, în pixeli CSS: { x, y }
    constructie: false, // modul de pe telefon
    slot: null,         // slotul ales de la tastatură (consumat de joc)
    roata: 0,           // pași de rotiță (consumați de joc)
    atelier: false,     // cerere de a deschide sau închide crafting-ul, tasta E (consumată de joc)
    rucsac: false,      // la fel pentru rucsac, tasta I
    tactil: false,      // ultima intrare a fost o atingere
  };

  const taste = {
    ArrowLeft: 'stanga', KeyA: 'stanga',
    ArrowRight: 'dreapta', KeyD: 'dreapta',
    ArrowUp: 'sus', KeyW: 'sus', Space: 'sus',
  };

  window.addEventListener('keydown', (e) => {
    // Pe un buton (de exemplu un slot apăsat cu mouse-ul), Space și Enter rămân ale butonului;
    // tastele de mers merg în continuare.
    const peButon = e.target.closest && e.target.closest('button, a');
    if (peButon && (e.code === 'Space' || e.code === 'Enter')) return;
    if (taste[e.code]) {
      stare[taste[e.code]] = true;
      e.preventDefault();
    } else if (/^Digit[1-9]$/.test(e.code)) {
      stare.slot = Number(e.code.slice(5)) - 1;
    } else if (e.code === 'KeyE' && !e.repeat) {
      stare.atelier = true;
    } else if (e.code === 'KeyI' && !e.repeat) {
      stare.rucsac = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (taste[e.code]) stare[taste[e.code]] = false;
  });
  // Când fereastra pierde focusul, nicio tastă nu rămâne „apăsată”.
  window.addEventListener('blur', () => {
    stare.stanga = stare.dreapta = stare.sus = stare.mina = false;
  });

  // ---------- Ecranul: mouse și atingere ----------
  let degetMina = null;

  const punct = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener('pointerdown', (e) => {
    stare.tactil = e.pointerType !== 'mouse';
    stare.tinta = punct(e);
    if (e.pointerType === 'mouse') {
      if (e.button === 0) stare.mina = true;
      if (e.button === 2) stare.pune = true;
    } else if (degetMina === null) {
      degetMina = e.pointerId;
      if (stare.constructie) stare.pune = true;
      else stare.mina = true;
    }
    captureaza(canvas, e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || e.pointerId === degetMina) stare.tinta = punct(e);
  });

  const ridica = (e) => {
    if (e.pointerType === 'mouse') {
      if (e.button === 0 || e.type !== 'pointerup') stare.mina = false;
    } else if (e.pointerId === degetMina) {
      degetMina = null;
      stare.mina = false;
      stare.tinta = null;
    }
  };
  canvas.addEventListener('pointerup', ridica);
  canvas.addEventListener('pointercancel', ridica);
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      stare.tinta = null;
      stare.mina = false;
    }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    stare.roata += Math.sign(e.deltaY);
    e.preventDefault();
  }, { passive: false });

  // ---------- Butoanele de pe ecran (telefon) ----------
  for (const b of butoane.querySelectorAll('[data-control]')) {
    const nume = b.dataset.control;
    const apasa = (e) => {
      e.preventDefault();
      stare.tactil = true;
      captureaza(b, e.pointerId);
      if (nume === 'mod') {
        stare.constructie = !stare.constructie;
        b.setAttribute('aria-pressed', String(stare.constructie));
        b.textContent = stare.constructie ? 'Build' : 'Mine';
      } else {
        stare[nume] = true;
        b.classList.add('joc__buton--apasat');
      }
    };
    const elibereaza = () => {
      if (nume !== 'mod') {
        stare[nume] = false;
        b.classList.remove('joc__buton--apasat');
      }
    };
    b.addEventListener('pointerdown', apasa);
    b.addEventListener('pointerup', elibereaza);
    b.addEventListener('pointercancel', elibereaza);
    b.addEventListener('lostpointercapture', elibereaza);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  return stare;
}
