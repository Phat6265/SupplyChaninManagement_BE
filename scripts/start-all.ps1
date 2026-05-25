# PowerShell script: Khởi động tất cả services trong các cửa sổ Terminal riêng
# Run: .\scripts\start-all.ps1

$services = @(
  @{ name="auth-service";         port=3001 },
  @{ name="product-service";      port=3002 },
  @{ name="inventory-service";    port=3003 },
  @{ name="order-service";        port=3004 },
  @{ name="shipment-service";     port=3005 },
  @{ name="notification-service"; port=3006 },
  @{ name="analytics-service";    port=3007 },
  @{ name="api-gateway";          port=8080 }
)

$root = Split-Path -Parent $PSScriptRoot

foreach ($svc in $services) {
  $path = Join-Path $root "services\$($svc.name)"
  if (Test-Path "$path\package.json") {
    Write-Host "🚀 Starting $($svc.name) on port $($svc.port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$path'; npm run dev" -WindowStyle Normal
    Start-Sleep -Milliseconds 500
  }
}

Write-Host "`n✅ All services launching! Wait ~5s then visit:" -ForegroundColor Green
Write-Host "   API Gateway: http://localhost:8080/health" -ForegroundColor Yellow
Write-Host "   Auth:        http://localhost:3001/health" -ForegroundColor Yellow
