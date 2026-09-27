# Genereaza sprite-urile SVG din grilele de caractere din unelte/sprite/*.txt
# si le scrie in site/index.html, intre <!-- sprite:inceput --> si <!-- sprite:sfarsit -->.
#
# Rulare (din folderul proiectului):
#   powershell -ExecutionPolicy Bypass -File unelte/pixel.ps1
#
# Formatul unui fisier .txt:
#   # comentariu
#   id: bloc-piatra          -> id-ul <symbol>
#   baza: bloc-piatra        -> (optional) alt sprite desenat dedesubt
#   a = --piatra-1           -> caracter = variabila CSS pentru culoare
#   (rand gol)
#   grila, un rand pe linie; '.' = transparent
#
# Culoarea cea mai frecventa devine un singur patrat desenat primul
# (doar cand grila nu are pixeli transparenti), restul se deseneaza peste.
# Folderul unelte/ nu se publica: Cloudflare Pages publica doar site/.
# Toate sortarile sunt ordinale, ca rezultatul sa fie identic pe Windows si pe Linux
# (unelte/verifica.ps1 il regenereaza si pe GitHub, ca sa verifice ca e la zi).

$ErrorActionPreference = 'Stop'
$proiect = Split-Path $PSScriptRoot -Parent
$sursa = Join-Path $PSScriptRoot 'sprite'
$pagina = Join-Path (Join-Path $proiect 'site') 'index.html'

function Read-Sprite([string]$cale) {
  $s = @{ id = $null; baza = $null; culori = @{}; grila = @() }
  $inGrila = $false
  foreach ($linie in [IO.File]::ReadAllLines($cale)) {
    $l = $linie.TrimEnd()
    if (-not $inGrila) {
      if ($l -eq '') { if ($s.id) { $inGrila = $true }; continue }
      if ($l.StartsWith('#')) { continue }
      if ($l -match '^(id|baza):\s*(\S+)$') { $s[$matches[1]] = $matches[2]; continue }
      if ($l -match '^(\S)\s*=\s*(--[\w-]+)$') { $s.culori[$matches[1]] = $matches[2]; continue }
      throw "$cale : linie de antet necunoscuta '$l'"
    } elseif ($l -ne '') {
      $s.grila += $l
    }
  }
  if (-not $s.id -or $s.grila.Count -eq 0) { throw "$cale : lipseste id-ul sau grila" }
  $s
}

function ConvertTo-Symbol($s) {
  $grila = $s.grila; $id = $s.id
  $h = $grila.Count; $w = $grila[0].Length
  foreach ($r in $grila) { if ($r.Length -ne $w) { throw "$id : rand de lungime $($r.Length) in loc de ${w}: '$r'" } }

  # Culoarea de baza = cea mai frecventa; la egalitate, caracterul cel mai mic (ordinal), ca sa fie stabila.
  $numar = New-Object 'System.Collections.Generic.Dictionary[char,int]'
  foreach ($ch in ($grila -join '').ToCharArray()) {
    if ($numar.ContainsKey($ch)) { $numar[$ch]++ } else { $numar[$ch] = 1 }
  }
  $baza = $null
  foreach ($ch in $numar.Keys) {
    if ($null -eq $baza -or $numar[$ch] -gt $numar[$baza] -or
        ($numar[$ch] -eq $numar[$baza] -and [int]$ch -lt [int]$baza)) { $baza = $ch }
  }
  $baza = if ($numar.ContainsKey([char]'.')) { $null } else { [string]$baza }

  $trasee = [ordered]@{}
  if ($baza) { $trasee[$baza] = New-Object Text.StringBuilder("M0 0h${w}v${h}h-${w}z") }
  $chei = [string[]]@($s.culori.Keys)
  [Array]::Sort($chei, [StringComparer]::Ordinal)
  foreach ($k in $chei) { if ($k -cne $baza) { $trasee[$k] = New-Object Text.StringBuilder } }

  for ($y = 0; $y -lt $h; $y++) {
    $x = 0
    while ($x -lt $w) {
      $c = [string]$grila[$y][$x]
      $len = 1
      while ($x + $len -lt $w -and [string]$grila[$y][$x + $len] -ceq $c) { $len++ }
      if ($c -ne '.' -and $c -cne $baza) {
        if (-not $s.culori.ContainsKey($c)) { throw "$id : caracter fara culoare '$c'" }
        [void]$trasee[$c].Append("M$x ${y}h${len}v1h-${len}z")
      }
      $x += $len
    }
  }

  $out = "    <symbol id=`"$id`" viewBox=`"0 0 $w $h`" shape-rendering=`"crispEdges`">`n"
  if ($s.baza) { $out += "      <use href=`"#$($s.baza)`" width=`"$w`" height=`"$h`"/>`n" }
  foreach ($k in $trasee.Keys) {
    if ($trasee[$k].Length) { $out += "      <path style=`"fill:var($($s.culori[$k]))`" d=`"$($trasee[$k])`"/>`n" }
  }
  $out + "    </symbol>`n"
}

$simboluri = ''
$fisiere = [string[]]@(Get-ChildItem $sursa -Filter *.txt | ForEach-Object { $_.FullName })
[Array]::Sort($fisiere, [StringComparer]::Ordinal)
foreach ($f in $fisiere) { $simboluri += ConvertTo-Symbol (Read-Sprite $f) }

$utf8 = New-Object Text.UTF8Encoding($false)
$html = [IO.File]::ReadAllText($pagina, $utf8)
$tipar = '(?s)(<!-- sprite:inceput -->).*?([ \t]*<!-- sprite:sfarsit -->)'
if ($html -notmatch $tipar) { throw 'site/index.html: lipsesc marcajele sprite:inceput / sprite:sfarsit' }
$html = [regex]::Replace($html, $tipar, { param($m) $m.Groups[1].Value + "`n" + $simboluri + $m.Groups[2].Value })
[IO.File]::WriteAllText($pagina, $html, $utf8)

Write-Host "$($fisiere.Count) sprite-uri scrise in site/index.html"
