# Run this ON YOUR DEV MACHINE (F:\FITIT) to produce a clean zip to copy to the server.
# It excludes everything that must be rebuilt/created on the server (node_modules, builds,
# the local database, uploads, logs, and the ROOT .env with dev secrets).
# NOTE: apps\web\.env IS included on purpose — it is the FIT IT brand identity
# (name, colors, origin), not secrets; the web build needs it.
#
#   powershell -File F:\FITIT\deploy\make-bundle.ps1
#
# Result: F:\fitit-bundle.zip  ->  copy to the server, extract to C:\fitit.

$ErrorActionPreference = 'Stop'
$src   = 'F:\FITIT'
$stage = Join-Path $env:TEMP 'fitit-bundle'
$out   = 'F:\fitit-bundle.zip'

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }

# Copy source only; skip artifacts + local data. .env NOT excluded here…
robocopy $src $stage /E `
  /XD node_modules dist dev-dist uploads backups logs .git .vscode e2e-shots marketing-cards `
  /XF *.db *.db-journal *.db-wal *.db-shm *.log client_secret_*.json `
  | Out-Null

# …because only the ROOT .env holds secrets — remove just that one from the stage.
if (Test-Path (Join-Path $stage '.env')) { Remove-Item (Join-Path $stage '.env') -Force }

if (Test-Path $out) { Remove-Item $out -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $out -Force
Remove-Item $stage -Recurse -Force

$size = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Host "Created $out ($size MB). Copy it to the server and extract to C:\fitit." -ForegroundColor Green
