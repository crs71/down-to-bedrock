// Sunetele jocului, create din cod cu Web Audio: zgomot filtrat și tonuri scurte, fără fișiere audio și fără
// sunetele din jocul original. Contextul audio pornește abia după primul gest al jucătorului (regula
// browserelor). sunet.porneste() se cheamă la „Play”; sunet.activ(false) oprește tot (butonul Sound, tasta M).
let ac = null;
let master = null;
let zgomotAlb = null;
let activ = true;
const bucle = {};

const VOLUM = 0.45;

function pregateste() {
  if (ac) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = activ ? VOLUM : 0;
  master.connect(ac.destination);
  // O secundă de zgomot alb, refolosită de toate sunetele „de materie” (săpat, pași, explozii).
  zgomotAlb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const date = zgomotAlb.getChannelData(0);
  for (let i = 0; i < date.length; i++) date[i] = Math.random() * 2 - 1;
  return true;
}

export function porneste() {
  if (pregateste() && ac.state === 'suspended') ac.resume();
}

export function activeaza(da) {
  activ = da;
  if (master) master.gain.setTargetAtTime(da ? VOLUM : 0, ac.currentTime, 0.03);
}

export const esteActiv = () => activ;

// Zgomot trecut printr-un filtru, cu un plic scurt de volum.
function zgomot({ durata = 0.08, tip = 'bandpass', frecventa = 1200, q = 1, volum = 0.5, atac = 0.004, pana = null }) {
  if (!ac || !activ) return;
  const t = ac.currentTime;
  const sursa = ac.createBufferSource();
  sursa.buffer = zgomotAlb;
  const filtru = ac.createBiquadFilter();
  filtru.type = tip;
  filtru.frequency.setValueAtTime(frecventa, t);
  if (pana) filtru.frequency.exponentialRampToValueAtTime(pana, t + durata);
  filtru.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volum, t + atac);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  sursa.connect(filtru).connect(g).connect(master);
  sursa.start(t, Math.random() * 0.5);
  sursa.stop(t + durata + 0.02);
}

// Un ton cu frecvența care alunecă de la `de` la `la`.
function ton({ forma = 'square', de = 440, la = de, durata = 0.1, volum = 0.2, intarziere = 0 }) {
  if (!ac || !activ) return;
  const t = ac.currentTime + intarziere;
  const osc = ac.createOscillator();
  osc.type = forma;
  osc.frequency.setValueAtTime(de, t);
  if (la !== de) osc.frequency.exponentialRampToValueAtTime(la, t + durata);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volum, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + durata + 0.02);
}

// Materialele sună diferit: pământ (moale, jos), piatră (sec, sus), lemn (gol), frunze (foșnet).
const MATERIALE = {
  pamant: { frecventa: 500, q: 0.8 },
  piatra: { frecventa: 1800, q: 2.5 },
  lemn: { frecventa: 850, q: 4 },
  frunze: { frecventa: 3500, q: 0.6 },
};
const varia = (v, cat = 0.15) => v * (1 + (Math.random() * 2 - 1) * cat);

export const sunete = {
  sapa(material = 'piatra') {
    const m = MATERIALE[material] || MATERIALE.piatra;
    zgomot({ durata: 0.06, frecventa: varia(m.frecventa), q: m.q, volum: 0.35 });
  },
  sparge(material = 'piatra') {
    const m = MATERIALE[material] || MATERIALE.piatra;
    zgomot({ durata: 0.18, frecventa: varia(m.frecventa * 0.8), q: m.q * 0.7, volum: 0.6, pana: m.frecventa * 0.3 });
    ton({ forma: 'triangle', de: varia(160), la: 70, durata: 0.12, volum: 0.25 });
  },
  pas(material = 'pamant') {
    const m = MATERIALE[material] || MATERIALE.pamant;
    zgomot({ durata: 0.05, frecventa: varia(m.frecventa * 0.7, 0.25), q: m.q, volum: 0.14 });
  },
  aterizare(material = 'pamant') {
    const m = MATERIALE[material] || MATERIALE.pamant;
    zgomot({ durata: 0.1, frecventa: m.frecventa * 0.5, q: 0.7, volum: 0.3 });
  },
  saritura() {
    ton({ forma: 'triangle', de: 220, la: 330, durata: 0.08, volum: 0.08 });
  },
  pune(material = 'piatra') {
    const m = MATERIALE[material] || MATERIALE.piatra;
    zgomot({ durata: 0.09, frecventa: m.frecventa * 0.6, q: m.q, volum: 0.45 });
  },
  obiect() {
    ton({ forma: 'square', de: varia(660, 0.05), la: 990, durata: 0.07, volum: 0.08 });
  },
  crafting() {
    ton({ forma: 'triangle', de: 523, durata: 0.1, volum: 0.18 });
    ton({ forma: 'triangle', de: 784, durata: 0.16, volum: 0.18, intarziere: 0.09 });
  },
  realizare() {
    [523, 659, 784, 1047].forEach((f, i) => ton({ forma: 'square', de: f, durata: 0.14, volum: 0.1, intarziere: i * 0.08 }));
  },
  explozie() {
    zgomot({ durata: 0.8, tip: 'lowpass', frecventa: 1800, pana: 90, q: 0.5, volum: 0.9, atac: 0.01 });
    ton({ forma: 'sine', de: 110, la: 38, durata: 0.6, volum: 0.5 });
  },
  lovitura() {
    zgomot({ durata: 0.07, tip: 'lowpass', frecventa: 900, q: 0.5, volum: 0.5 });
    ton({ forma: 'square', de: 180, la: 90, durata: 0.08, volum: 0.12 });
  },
  magma() {
    ton({ forma: 'sine', de: varia(260), la: 90, durata: 0.18, volum: 0.22 });
  },
  ghast() {
    // Un geamăt care coboară, cu vibrato.
    if (!ac || !activ) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const lfo = ac.createOscillator();
    const adancime = ac.createGain();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(varia(620), t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.7);
    lfo.frequency.value = 7;
    adancime.gain.value = 18;
    lfo.connect(adancime).connect(osc.frequency);
    const filtru = ac.createBiquadFilter();
    filtru.type = 'lowpass';
    filtru.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    osc.connect(filtru).connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.8);
    lfo.stop(t + 0.8);
  },
  piglin() {
    ton({ forma: 'square', de: 170, la: 120, durata: 0.12, volum: 0.1 });
    ton({ forma: 'square', de: 150, la: 110, durata: 0.12, volum: 0.1, intarziere: 0.14 });
  },
  lava() {
    ton({ forma: 'sine', de: varia(140), la: varia(420), durata: 0.09, volum: 0.08 });
  },
  calatorie() {
    zgomot({ durata: 1.1, tip: 'bandpass', frecventa: 300, pana: 2400, q: 1.5, volum: 0.5, atac: 0.2 });
  },
};

// Sunete continue, cu volumul potrivit în fiecare cadru (0 = liniște): zumzetul portalului și
// huruitul vagonetului pe șine.
function bucla(nume, construieste) {
  if (!bucle[nume] && ac) bucle[nume] = construieste();
  return bucle[nume];
}

export function portal(intensitate) {
  if (!ac) return;
  const b = bucla('portal', () => {
    const g = ac.createGain();
    g.gain.value = 0;
    const filtru = ac.createBiquadFilter();
    filtru.type = 'lowpass';
    filtru.frequency.value = 600;
    for (const f of [110, 113.5, 165]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(filtru);
      o.start();
    }
    filtru.connect(g).connect(master);
    return g;
  });
  b.gain.setTargetAtTime(activ ? intensitate * 0.12 : 0, ac.currentTime, 0.1);
}

export function vagonet(viteza) {
  if (!ac) return;
  const b = bucla('vagonet', () => {
    const g = ac.createGain();
    g.gain.value = 0;
    const sursa = ac.createBufferSource();
    sursa.buffer = zgomotAlb;
    sursa.loop = true;
    const filtru = ac.createBiquadFilter();
    filtru.type = 'bandpass';
    filtru.frequency.value = 700;
    filtru.Q.value = 1.2;
    // Huruitul „clac-clac”: volumul pulsează de câteva ori pe secundă.
    const puls = ac.createGain();
    const lfo = ac.createOscillator();
    const adancime = ac.createGain();
    lfo.type = 'square';
    lfo.frequency.value = 6;
    adancime.gain.value = 0.5;
    puls.gain.value = 0.5;
    lfo.connect(adancime).connect(puls.gain);
    sursa.connect(filtru).connect(puls).connect(g).connect(master);
    sursa.start();
    lfo.start();
    g.lfo = lfo;
    return g;
  });
  if (b.lfo) b.lfo.frequency.setTargetAtTime(3 + viteza * 8, ac.currentTime, 0.1);
  b.gain.setTargetAtTime(activ ? Math.min(1, viteza) * 0.25 : 0, ac.currentTime, 0.08);
}
