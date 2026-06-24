# Creates docker/.env with secure random secrets on first run.
# Safe to re-run later - it will never overwrite an existing docker/.env.

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root "docker\.env"
$exampleFile = Join-Path $root "docker\.env.example"

if (Test-Path $envFile) {
  Write-Host "docker\.env already exists - leaving it as is."
  exit 0
}

$existingVolume = docker volume ls --format "{{.Name}}" 2>$null | Where-Object { $_ -eq "docker_mysql_data" }
if ($existingVolume) {
  Write-Host ""
  Write-Host "Warning: a database from a previous run already exists, but"
  Write-Host "docker\.env is missing, so new random database credentials are"
  Write-Host "about to be generated. The existing database won't recognize them,"
  Write-Host "and the app will fail to start with 'Access denied' errors."
  Write-Host ""
  $resetDb = Read-Host "Reset the existing database so the new credentials work? This deletes all current app data (modules, surveys, etc). [y/N]"
  if ($resetDb -match "^[Yy]") {
    docker volume rm docker_mysql_data
    Write-Host "Database reset."
  } else {
    Write-Host "Keeping the existing database - you'll need to restore the matching docker\.env yourself, or the app won't start."
  }
  Write-Host ""
}

function New-RandomValue {
  $bytes = New-Object byte[] 24
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  -join ($bytes | ForEach-Object { $_.ToString("x2") })
}

$adminPassword = New-RandomValue

$content = Get-Content $exampleFile -Raw
$content = $content -replace "__RANDOM_DB_PASSWORD__", (New-RandomValue)
$content = $content -replace "__RANDOM_DB_ROOT_PASSWORD__", (New-RandomValue)
$content = $content -replace "__RANDOM_ADMIN_PASSWORD__", $adminPassword
$content = $content -replace "__RANDOM_RECOVERY_KEY__", (New-RandomValue)
$content = $content -replace "__RANDOM_SESSION_SECRET__", (New-RandomValue)

Set-Content -Path $envFile -Value $content -NoNewline

Write-Host ""
Write-Host "Created docker\.env with new secure secrets."
Write-Host ""
Write-Host "=================================================="
Write-Host " Admin login for this app (write this down):"
Write-Host "   Username: admin"
Write-Host "   Password: $adminPassword"
Write-Host "=================================================="
Write-Host ""
Write-Host "You can change the password later from the admin dashboard."
Write-Host ""
