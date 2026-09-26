# Server static local pentru dezvoltare. Nu instaleaza nimic: foloseste HttpListener din .NET.
# Pornire:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8080]
# Oprire:   Ctrl+C
# Fisierul nu intra in arhiva de deploy.
param([int]$Port = 8080)

$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
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
      $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
      if ($rel -eq '' -or $rel.EndsWith('/')) { $rel += 'index.html' }
      $path = [IO.Path]::GetFullPath((Join-Path $root $rel))

      # Doar fisiere din proiect, fara cele ascunse (.git, .claude etc.).
      $permis = $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and
                $rel -notmatch '(^|/)\.' -and
                (Test-Path -LiteralPath $path -PathType Leaf)

      if ($permis) {
        $bytes = [IO.File]::ReadAllBytes($path)
        $ext = [IO.Path]::GetExtension($path).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $res.StatusCode = 200
      } else {
        $bytes = [Text.Encoding]::UTF8.GetBytes('404')
        $res.ContentType = 'text/plain; charset=utf-8'
        $res.StatusCode = 404
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
