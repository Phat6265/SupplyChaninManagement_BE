# ================================================================
#  START ALL - FE + BE (no Docker, no Redis, no RabbitMQ)
#  Yeu cau: MongoDB dang chay, Node.js >= 18
#  Usage:   .\start.ps1
# ================================================================

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

$beRoot = Join-Path $root "SupplyChaninManagement_BE"
$feRoot = Join-Path $root "SupplyChaninManagement_FE"

$services = @(
  @{ name="auth-service";         port="3001" },
  @{ name="product-service";      port="3002" },
  @{ name="inventory-service";    port="3003" },
  @{ name="order-service";        port="3004" },
  @{ name="shipment-service";     port="3005" },
  @{ name="notification-service"; port="3006" },
  @{ name="analytics-service";    port="3007" },
  @{ name="api-gateway";          port="8080" }
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SMART WAREHOUSE - Local Dev Launcher" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── BACKEND: Install deps ─────────────────────────────────────
$needInstall = $false
foreach ($svc in $services) {
  $nm = Join-Path $beRoot "services\$($svc.name)\node_modules"
  if (-not (Test-Path $nm)) { $needInstall = $true; break }
}

if ($needInstall) {
  Write-Host "[BE] Installing dependencies..." -ForegroundColor Yellow
  foreach ($svc in $services) {
    $svcPath = Join-Path $beRoot "services\$($svc.name)"
    if (Test-Path "$svcPath\package.json") {
      Write-Host "     $($svc.name)" -ForegroundColor Gray
      Push-Location $svcPath
      npm install --silent 2>$null
      Pop-Location
    }
  }
  Write-Host "[BE] Done!" -ForegroundColor Green
  Write-Host ""
}

# ── BACKEND: Generate RSA keys ────────────────────────────────
$privateKey = Join-Path $beRoot "services\auth-service\keys\private.pem"
if (-not (Test-Path $privateKey)) {
  Write-Host "[BE] Generating RSA keys..." -ForegroundColor Yellow
  Push-Location (Join-Path $beRoot "services\auth-service")
  npm run generate-keys --silent
  Pop-Location
  Write-Host "[BE] Keys ready!" -ForegroundColor Green
  Write-Host ""
}

# ── BACKEND: Seed database ────────────────────────────────────
Write-Host "[DB] Seeding database with demo data..." -ForegroundColor Yellow
Push-Location $beRoot
node scripts/seed-local.js
Pop-Location
Write-Host ""

# ── BACKEND: Start all services ───────────────────────────────
Write-Host "[BE] Starting services..." -ForegroundColor Yellow
foreach ($svc in $services) {
  $svcPath = Join-Path $beRoot "services\$($svc.name)"
  $portVal = $svc.port
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$svcPath'; `$env:PORT='$portVal'; npm run dev" -WindowStyle Minimized
  Write-Host "     [OK] $($svc.name) :$portVal" -ForegroundColor Green
  Start-Sleep -Milliseconds 400
}
Write-Host ""

# ── FRONTEND: Install deps ────────────────────────────────────
$feNm = Join-Path $feRoot "node_modules"
if (-not (Test-Path $feNm)) {
  Write-Host "[FE] Installing dependencies..." -ForegroundColor Yellow
  Push-Location $feRoot
  npm install --silent 2>$null
  Pop-Location
  Write-Host "[FE] Done!" -ForegroundColor Green
  Write-Host ""
}

# ── FRONTEND: Start Vite ──────────────────────────────────────
Write-Host "[FE] Starting frontend (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$feRoot'; npm run dev" -WindowStyle Normal
Write-Host "     [OK] Frontend starting..." -ForegroundColor Green

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ALL STARTED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Gateway:   http://localhost:8080/health" -ForegroundColor White
Write-Host ""
Write-Host "  Seed data: node SupplyChaninManagement_BE\scripts\seed-local.js" -ForegroundColor DarkGray
Write-Host "  Stop all:  Get-Process node | Stop-Process" -ForegroundColor DarkGray
Write-Host ""
