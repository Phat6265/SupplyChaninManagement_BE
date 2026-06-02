# PowerShell script: Khởi động tất cả services của SmartWarehouse
# Run: .\scripts\start-all.ps1

$services = @(
  @{ name="auth-service";         port=3001 },
  @{ name="product-service";      port=3002 },
  @{ name="inventory-service";    port=3003 },
  @{ name="order-service";        port=3004 },
  @{ name="shipment-service";     port=3005 },
  @{ name="notification-service"; port=3006 },
  @{ name="analytics-service";    port=3007 },
  @{ name="api-gateway";          port=8000 }
)

Write-Host "🔴 Đang kiểm tra và dọn dẹp các cổng bị kẹt (Clear old processes)..." -ForegroundColor Yellow
foreach ($svc in $services) {
  $port = $svc.port
  # Tìm tiến trình đang Listen trên port
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($connections) {
    foreach ($conn in $connections) {
      $pidToKill = $conn.OwningProcess
      if ($pidToKill -ne 0) {
        Write-Host "  ✅ Đã tắt tiến trình PID $pidToKill đang chiếm cổng $port" -ForegroundColor Green
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
      }
    }
  }
}
Write-Host ""

$root = Split-Path -Parent $PSScriptRoot

Write-Host "🚀 Đang khởi động tất cả dịch vụ..." -ForegroundColor Cyan
foreach ($svc in $services) {
  $path = Join-Path $root "services\$($svc.name)"
  if (Test-Path "$path\package.json") {
    Write-Host "  👉 Mở $($svc.name) trên cổng $($svc.port)..." -ForegroundColor Cyan
    # Bật cửa sổ PowerShell mới
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$path'; Write-Host '🟢 $($svc.name) starting on :$($svc.port)'; npm run dev" -WindowStyle Normal
    Start-Sleep -Milliseconds 500
  } else {
    Write-Host "  ⚠️ Không tìm thấy package.json cho $($svc.name), bỏ qua." -ForegroundColor Red
  }
}

Write-Host "`n✅ Hoàn tất kích hoạt tất cả dịch vụ! Vui lòng đợi khoảng 5-10 giây để backend khởi động xong, sau đó kiểm tra:" -ForegroundColor Green
Write-Host "   API Gateway: http://localhost:8000/health" -ForegroundColor Yellow
Write-Host "   Auth:        http://localhost:3001/health" -ForegroundColor Yellow
