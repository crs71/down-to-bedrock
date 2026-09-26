# Coborârea

Site cu temă de lume din blocuri: cobori prin straturi (cer → suprafață → piatră → peșteră → mină → Nether → bedrock), fiecare cu animațiile lui la scroll.

## Tehnologii
- HTML, CSS și JavaScript simplu, fără build
- Animații: CSS scroll-driven animations și IntersectionObserver (eventual GSAP ScrollTrigger de pe CDN)
- Grafică pixel art proprie, fără texturi din joc

## Structură
- `index.html`: pagina, câte o secțiune pe strat
- `css/base.css`: variabile, reset, elemente permanente, varianta reduced-motion
- `css/straturi/NN-nume.css`: stilurile fiecărui strat (se adaugă pe rând)
- `js/main.js`: spațiul de nume `window.Coborarea`, bara de adâncime
- `js/straturi/NN-nume.js`: animațiile fiecărui strat, scripturi clasice cu `defer`
- `js/util/`: cod comun (de ex. bucla de particule)
- `assets/pixel/`: grafica pixel art
- `serve.ps1`: server local pentru dezvoltare

Convenție pentru animații: stilul de bază e starea finală, vizibilă; animația descrie doar punctul de plecare. Așa, cu `prefers-reduced-motion`, pagina rămâne completă și statică.

## Rulare locală
Fără instalări, din folderul proiectului:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Apoi deschizi http://localhost:8080/ (portul se schimbă cu `-Port 3000`). Pagina merge și deschisă direct din fișier, dar serverul se comportă ca pe Cloudflare.

## Deploy
Site separat pe Cloudflare Pages, încărcat manual dintr-o arhivă .zip. Arhiva conține doar `index.html`, `css/`, `js/` și `assets/`, fără `README.md`, `serve.ps1` și `.gitignore`.
