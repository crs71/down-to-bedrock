# Verificari inainte de publicare. Ruleaza local inainte de fiecare push (.githooks/pre-push)
# si pe GitHub la fiecare push (.github/workflows/verificare.yml). Merge pe PowerShell 5.1 si 7.
#
#  1. Caile locale din HTML (href/src) si din CSS (url()) exista, cu literele mari/mici exacte:
#     serverele Cloudflare (Linux) fac diferenta intre ele, Windows nu.
#  2. Fiecare trimitere interna (href="#id", url(#id)) are un element cu acel id.
#  3. Sprite-urile din site/index.html sunt la zi fata de unelte/sprite/*.txt.
#  4. Content-Security-Policy din site/_headers permite scripturile paginii: hash-ul fiecarui
#     script inline si domeniul fiecarui script extern; scripturile externe au SRI.
#  5. Fara handlere inline (onclick=...) sau linkuri javascript:, pe care CSP le-ar bloca.
#  6. Niciun fisier nu depaseste limita Cloudflare Pages (25 MiB) si sunt sub 20 000 de fisiere.
#
# Rulare: powershell -ExecutionPolicy Bypass -File unelte/verifica.ps1

$ErrorActionPreference = 'Stop'
$proiect = Split-Path $PSScriptRoot -Parent
$site = [IO.Path]::GetFullPath((Join-Path $proiect 'site'))
$utf8 = New-Object Text.UTF8Encoding($false)
$erori = New-Object 'System.Collections.Generic.List[string]'

function Relativ([string]$cale) { $cale.Substring($site.Length).TrimStart('\', '/').Replace('\', '/') }
function Citeste([string]$cale) { [IO.File]::ReadAllText($cale, $utf8) }

# Exista fisierul, cu exact aceleasi litere mari/mici pe fiecare segment al caii?
function Test-CaleExacta([string]$dosar, [string]$rel) {
  $curent = $dosar
  foreach ($seg in ($rel -split '/')) {
    if ($seg -eq '' -or $seg -eq '.') { continue }
    if ($seg -eq '..') { $curent = Split-Path $curent -Parent; continue }
    if (-not (Test-Path -LiteralPath $curent -PathType Container)) { return $false }
    $gasit = Get-ChildItem -LiteralPath $curent -Force | Where-Object { $_.Name -ceq $seg } | Select-Object -First 1
    if (-not $gasit) { return $false }
    $curent = $gasit.FullName
  }
  return ($curent.StartsWith($site) -and (Test-Path -LiteralPath $curent -PathType Leaf))
}

function Este-Extern([string]$v) { $v -match '^(https?:|//|data:|mailto:|tel:|javascript:)' }

$html = @(Get-ChildItem -LiteralPath $site -Recurse -File -Filter *.html)
$css = @(Get-ChildItem -LiteralPath $site -Recurse -File -Filter *.css)

# ---------- 1 si 2: cai locale si trimiteri interne ----------
foreach ($f in $html) {
  $text = Citeste $f.FullName
  $ids = @{}
  foreach ($m in [regex]::Matches($text, '\sid="([^"]+)"')) { $ids[$m.Groups[1].Value] = $true }

  foreach ($m in [regex]::Matches($text, '\s(?:href|src)="([^"]*)"')) {
    $v = $m.Groups[1].Value
    if ($v -eq '' -or (Este-Extern $v)) { continue }
    if ($v.StartsWith('#')) {
      if ($v.Length -gt 1 -and -not $ids.ContainsKey($v.Substring(1))) { $erori.Add("$(Relativ $f.FullName): nu exista id-ul pentru '$v'") }
      continue
    }
    $cale = ($v -split '[?#]')[0]
    if ($cale.EndsWith('/')) { $cale += 'index.html' }
    $dosar = if ($cale.StartsWith('/')) { $site } else { $f.DirectoryName }
    if (-not (Test-CaleExacta $dosar $cale)) { $erori.Add("$(Relativ $f.FullName): fisier lipsa sau cu alte litere mari/mici: '$v'") }
  }

  foreach ($m in [regex]::Matches($text, 'url\(#([^)]+)\)')) {
    if (-not $ids.ContainsKey($m.Groups[1].Value)) { $erori.Add("$(Relativ $f.FullName): nu exista id-ul pentru 'url(#$($m.Groups[1].Value))'") }
  }

  # ---------- 5: handlere inline si javascript: ----------
  if ($text -match '<[^>]+\son[a-z]+\s*=') { $erori.Add("$(Relativ $f.FullName): are un handler inline (on...=), blocat de CSP") }
  if ($text -match '(?:href|src)="javascript:') { $erori.Add("$(Relativ $f.FullName): are un link javascript:, blocat de CSP") }
}

foreach ($f in $css) {
  $text = Citeste $f.FullName
  foreach ($m in [regex]::Matches($text, 'url\(\s*[''"]?([^''")]+)[''"]?\s*\)')) {
    $v = $m.Groups[1].Value.Trim()
    if ($v.StartsWith('#') -or (Este-Extern $v)) { continue }
    $cale = ($v -split '[?#]')[0]
    $dosar = if ($cale.StartsWith('/')) { $site } else { $f.DirectoryName }
    if (-not (Test-CaleExacta $dosar $cale)) { $erori.Add("$(Relativ $f.FullName): fisier lipsa sau cu alte litere mari/mici: url($v)") }
  }
}

# ---------- 3: sprite-urile sunt la zi ----------
# pixel.ps1 regenereaza zona dintre marcaje; daca iese altceva decat ce e in fisier, sursa si pagina nu se potrivesc.
$pagina = Join-Path $site 'index.html'
$inainte = Citeste $pagina
& (Join-Path $PSScriptRoot 'pixel.ps1') 6>$null | Out-Null
$dupa = Citeste $pagina
if ($dupa -cne $inainte) {
  [IO.File]::WriteAllText($pagina, $inainte, $utf8)
  $erori.Add('site/index.html: sprite-urile nu sunt la zi; ruleaza unelte/pixel.ps1 si fa commit')
}

# ---------- 4: Content-Security-Policy ----------
$headersCale = Join-Path $site '_headers'
if (-not (Test-Path -LiteralPath $headersCale)) {
  $erori.Add('site/_headers lipseste')
} else {
  $headere = Citeste $headersCale
  # Doar randurile de header (indentate), nu comentariile care pomenesc numele headerului.
  $csp = [regex]::Match($headere, '(?m)^[ \t]+Content-Security-Policy:[ \t]*(.+)$').Groups[1].Value
  if (-not $csp) { $erori.Add('site/_headers: lipseste Content-Security-Policy') }
  $scriptSrc = [regex]::Match($csp, "script-src ([^;]+)").Groups[1].Value
  foreach ($f in $html) {
    $text = Citeste $f.FullName
    foreach ($m in [regex]::Matches($text, '<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)</script>')) {
      $sha = [Security.Cryptography.SHA256]::Create()
      $hash = 'sha256-' + [Convert]::ToBase64String($sha.ComputeHash($utf8.GetBytes($m.Groups[1].Value)))
      if (-not $scriptSrc.Contains("'$hash'")) { $erori.Add("$(Relativ $f.FullName): scriptul inline nu e permis de CSP; pune '$hash' in script-src din site/_headers") }
    }
    foreach ($m in [regex]::Matches($text, '<script[^>]*\ssrc="(https?://[^"]+)"[^>]*>')) {
      $gazda = ([Uri]$m.Groups[1].Value).GetLeftPart([UriPartial]::Authority)
      if (-not $scriptSrc.Contains($gazda)) { $erori.Add("$(Relativ $f.FullName): $gazda nu e in script-src din site/_headers") }
      if ($m.Value -notmatch '\sintegrity="sha(256|384|512)-' -or $m.Value -notmatch '\scrossorigin=') { $erori.Add("$(Relativ $f.FullName): scriptul extern $($m.Groups[1].Value) nu are integrity + crossorigin") }
    }
  }
}

# ---------- 6: limitele Cloudflare Pages ----------
$toate = @(Get-ChildItem -LiteralPath $site -Recurse -File -Force)
foreach ($f in $toate) { if ($f.Length -gt 25MB) { $erori.Add("$(Relativ $f.FullName): are peste 25 MiB") } }
if ($toate.Count -gt 20000) { $erori.Add("site/ are $($toate.Count) fisiere, peste limita de 20 000") }

# ---------- Rezultat ----------
if ($erori.Count) {
  Write-Host "Verificare ESUATA ($($erori.Count)):" -ForegroundColor Red
  foreach ($e in $erori) { Write-Host "  - $e" -ForegroundColor Red }
  exit 1
}
Write-Host "Verificare OK: $($html.Count) HTML, $($css.Count) CSS, $($toate.Count) fisiere in site/." -ForegroundColor Green
exit 0
