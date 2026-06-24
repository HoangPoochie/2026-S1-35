# Sets up docker\.env if needed, then asks whether to expose the app to the
# internet via a free Cloudflare Quick Tunnel before starting everything.

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

& "$PSScriptRoot\setup-env.ps1"

Write-Host ""
Write-Host "Make this app accessible from other devices over the internet?"
Write-Host "This uses a free Cloudflare Quick Tunnel - no account or domain needed."
Write-Host "The link changes every time you start the app, and it's meant for"
Write-Host "letting someone else try the app remotely, not permanent hosting."
Write-Host ""
$enableTunnel = Read-Host "Enable remote access for this session? [y/N]"

Set-Location (Join-Path $root "docker")

if ($enableTunnel -match "^[Yy]") {
  # Started detached (-d) so we can read the generated URL from its logs.
  # The finally block ensures everything still stops when you close this
  # window, since detached containers would otherwise keep running.
  try {
    docker compose --profile tunnel up --build -d

    Write-Host ""
    Write-Host "Waiting for your public link..."
    $publicUrl = $null
    for ($i = 0; $i -lt 30; $i++) {
      $logs = docker compose logs cloudflared 2>$null
      $match = [regex]::Match($logs, "https://[a-zA-Z0-9-]*\.trycloudflare\.com")
      if ($match.Success) {
        $publicUrl = $match.Value
        break
      }
      Start-Sleep -Seconds 1
    }

    Write-Host ""
    Write-Host "=================================================="
    if ($publicUrl) {
      Write-Host " Share this link so others can access the app:"
      Write-Host "   $publicUrl"
      Write-Host ""
      Write-Host " This link stops working once you close this window."
    } else {
      Write-Host " Couldn't detect the public link yet. Check it with:"
      Write-Host "   cd docker; docker compose logs cloudflared"
    }
    Write-Host "=================================================="
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the app."
    docker compose logs -f
  } finally {
    Write-Host ""
    Write-Host "Stopping the app..."
    docker compose --profile tunnel down
  }
} else {
  docker compose up --build
}
