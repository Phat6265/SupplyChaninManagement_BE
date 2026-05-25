# PowerShell script: Cài npm deps cho tất cả services
# Run: .\scripts\install-all.ps1

$services = @(
  "auth-service",
  "api-gateway",
  "product-service",
  "inventory-service",
  "order-service",
  "shipment-service",
  "notification-service",
  "analytics-service"
)

$root = Split-Path -Parent $PSScriptRoot

foreach ($svc in $services) {
  $path = Join-Path $root "services\$svc"
  if (Test-Path "$path\package.json") {
    Write-Host "`n📦 Installing deps: $svc..." -ForegroundColor Cyan
    Push-Location $path
    npm install
    Pop-Location
    Write-Host "✅ $svc done" -ForegroundColor Green
  } else {
    Write-Host "⚠️  $svc: package.json not found, skipping" -ForegroundColor Yellow
  }
}

Write-Host "`n✅ All services installed!" -ForegroundColor Green
