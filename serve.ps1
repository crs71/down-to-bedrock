# Server static local pentru dezvoltare. Nu instaleaza nimic: foloseste HttpListener din .NET.
# Serveste folderul site/ si imita Cloudflare Pages, ca erorile sa apara local inainte de publicare:
#   - aplica headerele din site/_headers (inclusiv Content-Security-Policy);
#   - raspunde cu site/404.html si codul 404 pentru fisierele care nu exista;
#   - nu serveste fisierele de configurare (_headers, _redirects) si nici fisierele ascunse.
# Pornire:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8080]
# Oprire:   Ctrl+C
param([int]$Port = 8080)

$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'site')).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'text/javascript; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.png'   = 'image/png'
  '.webp'  = 'image/webp'
  '.ico'   = 'image/x-icon'
  '.woff2' = 'font/woff2'
  '.txt'   = 'text/plain; charset=utf-8'
}

# Regulile din _headers: un rand fara indentare e calea (cu * ca wildcard), randurile indentate sunt headere.
function Read-Headers {
  $reguli = @()
  $cale = Join-Path $root '_headers'
  if (-not (Test-Path -LiteralPath $cale)) { return $reguli }
  $curenta = $null
  foreach ($linie in [IO.File]::ReadAllLines($cale)) {
    if ($linie.Trim() -eq '' -or $linie.Trim().StartsWith('#')) { continue }
    if ($linie -match '^\S') {
      $tipar = '^' + ([regex]::Escape($linie.Trim()) -replace '\\\*', '.*') + '$'
      $curenta = @{ tipar = $tipar; headere = [ordered]@{} }
      $reguli += $curenta
    } elseif ($curenta -and $linie -match '^\s+([^:]+):\s*(.*)$') {
      $curenta.headere[$matches[1].Trim()] = $matches[2].Trim()
    }
  }
  $reguli
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Coborarea: http://localhost:$Port/  (Ctrl+C pentru oprire)"

try {
  while ($listener.IsListening) {
    # Asteptare in pasi scurti, ca Ctrl+C sa opreasca serverul imediat.
    $task = $listener.GetContextAsync()
    while (-not $task.AsyncWaitHandle.WaitOne(250)) { }
    $ctx = $task.GetAwaiter().GetResult()
    $req = $ctx.Request
    $res = $ctx.Response

    try {
      $url = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
      $rel = $url.TrimStart('/')
      if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))

      # Doar fisiere din site/, fara cele ascunse (.git etc.) si fara fisierele de configurare Cloudflare.
      $permis = $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and
                $rel -notmatch '(^|/)\.' -and
                $rel -notmatch '^_(headers|redirects|routes\.json)$' -and
                (Test-Path -LiteralPath $path -PathType Leaf)

      if (-not $permis) {
        $path = Join-Path $root '404.html'
        $res.StatusCode = 404
      } else {
        $res.StatusCode = 200
      }

      if (Test-Path -LiteralPath $path -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($path)
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      } else {
        $bytes = [Text.Encoding]::UTF8.GetBytes('404')
        $res.ContentType = 'text/plain; charset=utf-8'
      }

      # Headerele din _headers se recitesc la fiecare cerere, ca modificarile sa se vada imediat.
      foreach ($regula in Read-Headers) {
        if ($url -match $regula.tipar) {
          foreach ($nume in $regula.headere.Keys) { $res.Headers[$nume] = $regula.headere[$nume] }
        }
      }
      $res.Headers['Cache-Control'] = 'no-store'

      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host "$($res.StatusCode) $($req.Url.AbsolutePath)"
    } catch {
      Write-Host "Eroare la $($req.Url.AbsolutePath): $($_.Exception.Message)"
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
