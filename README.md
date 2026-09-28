# Down to Bedrock

Site cu temă de lume din blocuri (textul paginii e în engleză): cobori prin straturi, fiecare cu animațiile lui la scroll. Un HUD arată adâncimea Y și biomul curent.

- Cer: titlul DOWN TO / BEDROCK din blocuri, apusul și norii
- Suprafață: mers orizontal, creeper-ul explodează, zoom în crater
- Pământ și piatră: săpat lent, bloc cu bloc (fiecare bloc cere scroll după duritate)
- Peșteră: torța luminează, minereurile zboară în hotbar
- Mina abandonată: plimbare orizontală cu vagonetul până la un portal, intrarea în portal schimbă paleta paginii
- Nether: plimbare orizontală prin 4 biomi, cu mobi interactivi (cubi de magma, ghast, piglin, blaze, strider) și prada în hotbar
- Bedrock: blocul care nu se sparge, Respawn și butonul spre joc

## Jocul (`site/play/`)
Un joc 2D de minat, în aceeași lume: sapi de la iarbă până la bedrock, strângi blocuri și construiești. Peșterile sunt întunecate (torțe, lampa de pe cască), târnăcoapele se fac la crafting (lemn, piatră, fier, diamant), iar adânc sunt lacuri de lavă. Sub start e o mină abandonată cu un vagonet care te duce la un portal spre Nether (cubi de magma, ghaști, piglini, strideri, resturi antice pentru târnăcopul de netherite). Jocul se salvează singur în browser. Adresa: https://down-to-bedrock.pages.dev/play/

- Canvas 2D și module ES (`<script type="module">`), fără build și fără biblioteci
- `js/joc.js`: bucla (fizică la pas fix de 1/120 s), camera, săpatul, construitul, hotbar-ul, crafting-ul, salvarea, meniul
- `js/lume.js`: generarea lumilor dintr-o sămânță: cea de sus (relief, peșteri, minereuri pe adâncimi, stratul adânc, lava, mina și portalul, copaci, bedrock) și Nether-ul (caverne, ocean de lavă, pădurea purpurie, podul fortăreței, valea sufletelor)
- `js/corp.js`, `js/mobi.js`: corpul cu coliziuni comun și mobii (vagonet, cub de magma, ghast și mingea lui de foc, piglin, strider)
- `js/lumina.js`: lumina pe celule (cer, torțe, lavă), recalculată la fiecare bloc schimbat, și lampa minerului
- `js/jucator.js`: minerul, cu gravitație, coliziuni și săritură automată pe trepte de un bloc
- `js/control.js`: tastatură, mouse și atingere (butoane pe ecran pe telefon)
- `js/atlas.js`: desenează sprite-urile o dată, la mărimea de pe ecran; `js/sprite.js` e generat de `unelte/pixel.ps1`
- Etapa următoare: sunete create din cod, particule și realizări, reduced-motion

Publicat automat pe Cloudflare Pages: https://down-to-bedrock.pages.dev

## Tehnologii
- HTML, CSS și JavaScript simplu, fără build
- Animații, în sistem hibrid:
  - CSS scroll-driven și IntersectionObserver pentru efectele simple (apariții, parallax)
  - GSAP 3.15 și ScrollTrigger de pe jsdelivr, cu SRI, pentru secvențele cu pin și cronologie
- Grafică pixel art proprie, fără texturi din joc:
  - grilă 16×16; obiectele mai mari sunt multipli de 16
  - sprite-uri SVG inline (`<symbol>`) colorate prin variabile CSS
  - paleta Endesga 32, grupată pe straturi
- Font: Pixelify Sans (SIL OFL 1.1), găzduit local, doar subseturile latin și latin-ext

## Structură
Tot ce se publică stă în `site/`; restul repo-ului e doar pentru dezvoltare.

- `site/index.html`: pagina, câte o secțiune pe strat
- `site/404.html`: pagina pentru adresele care nu există
- `site/_headers`: headerele Cloudflare Pages (securitate, Content-Security-Policy, cache pentru fonturi)
- `site/favicon.svg`, `favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`: iconițele (blocul de iarbă)
- `site/og-image.png`: bannerul de previzualizare pentru linkuri (1200×630)
- `site/css/base.css`: variabile, reset, elemente permanente, varianta reduced-motion
- `site/css/straturi/NN-nume.css`: stilurile fiecărui strat
- `site/js/main.js`: spațiul de nume `window.Coborarea`, bara de adâncime
- `site/js/straturi/NN-nume.js`: animațiile fiecărui strat, scripturi clasice cu `defer`
- `site/js/util/`: cod comun: bucla de particule (`particule.js`) și hotbar-ul (`hotbar.js`)
- `site/css/despre.css`, `site/js/despre.js`: „Cum e făcut site-ul”, la finalul paginii, sub bedrock
- `site/assets/fonts/`: fontul și licența lui (`OFL.txt`)
- `serve.ps1`: server local care imită Cloudflare Pages
- `unelte/pixel.ps1` și `unelte/sprite/*.txt`: sursele sprite-urilor, ca grile de caractere
- `unelte/verifica.ps1`: verificările de dinainte de publicare
- `.githooks/pre-push` și `.github/workflows/verificare.yml`: rulează verificările automat
- `wrangler.toml`: configurarea Cloudflare Pages (publică doar `site/`), cu prioritate față de dashboard

## Sprite-uri
Fiecare sprite e un fișier text în `unelte/sprite/`: un antet (`id`, opțional `baza`, apoi `caracter = --variabila-css`), un rând gol și grila, cu `.` pentru transparent. După ce modifici sau adaugi un fișier, rulezi:

```
powershell -ExecutionPolicy Bypass -File unelte/pixel.ps1
```

Scriptul rescrie `<symbol>`-urile din `site/index.html`, între `<!-- sprite:inceput -->` și `<!-- sprite:sfarsit -->`. Zona dintre marcaje nu se editează de mână. Tot el scrie `site/play/js/sprite.js` (aceleași grile, cu culorile din paleta din `site/css/base.css`), pentru joc; nici acela nu se editează de mână.

Convenție pentru animații: stilul de bază e starea finală, vizibilă; animația descrie doar punctul de plecare. Așa, cu `prefers-reduced-motion`, pagina rămâne completă și statică.

## Rulare locală
Fără instalări, din folderul proiectului:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Apoi deschizi http://localhost:8080/ (portul se schimbă cu `-Port 3000`). Serverul servește `site/` ca Cloudflare Pages: aplică `_headers` (deci și CSP-ul), răspunde cu `404.html` pentru adresele greșite și nu servește fișierele de configurare.

## Verificări
`unelte/verifica.ps1` verifică, înainte de publicare:
- că toate căile din HTML și CSS există, cu literele mari/mici exacte (Cloudflare face diferența, Windows nu);
- că fiecare `href="#id"` are un element cu acel id;
- că sprite-urile sunt la zi;
- că CSP-ul permite scripturile paginii (hash-ul scriptului inline, domeniul GSAP, SRI);
- că fișierele respectă limitele Cloudflare Pages.

Rulează automat înainte de fiecare `git push` (push-ul se oprește dacă ceva nu e în regulă) și pe GitHub, la fiecare push. După o clonare nouă, hook-ul se activează o singură dată:

```
git config core.hooksPath .githooks
```

## Publicare
Cloudflare Pages e legat de repo-ul GitHub: fiecare push pe `main` publică automat site-ul, iar celelalte ramuri primesc o adresă de previzualizare. Folderul publicat vine din `wrangler.toml` (`pages_build_output_dir`), nu din dashboard. Setările proiectului:

| Setare | Valoare |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | *(gol)* |
| Build output directory | `site` |
| Root directory | *(gol)* |
