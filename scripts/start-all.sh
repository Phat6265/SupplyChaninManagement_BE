#!/bin/bash
# ============================================================
# SmartWarehouse — Start All Services
# Run: bash scripts/start-all.sh
# Works in Git Bash (MINGW64) on Windows
# ============================================================

ROOT="/d/fpt/WDP/BE_reafactor/services"

# ── 1. Kill old processes on service ports ──────────────────
echo "🔴 Clearing old processes..."
for port in 8000 3001 3002 3003 3004 3005 3006 3007; do
  pid=$(netstat -ano 2>/dev/null | grep ":${port} " | grep LISTENING | awk '{print $5}' | head -1)
  if [ -n "$pid" ] && [ "$pid" != "0" ]; then
    taskkill //PID "$pid" //F > /dev/null 2>&1
    echo "  ✅ Killed PID $pid on :$port"
  fi
done
echo ""

# ── 2. Define services ──────────────────────────────────────
declare -a SERVICES=(
  "auth-service:3001"
  "product-service:3002"
  "inventory-service:3003"
  "order-service:3004"
  "shipment-service:3005"
  "notification-service:3006"
  "analytics-service:3007"
  "api-gateway:8000"
)

# ── 3. Open each service in a new Git Bash window ──────────
echo "🚀 Starting all services..."
for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  path="$ROOT/$name"

  if [ -f "$path/package.json" ]; then
    # mintty = Git Bash terminal emulator, opens a new window
    mintty --title "$name (:$port)" -e bash -c \
      "echo '🟢 $name starting on :$port'; cd '$path' && npm run dev; echo ''; echo 'Press Enter to close...'; read" &
    echo "  ✅ $name  → http://localhost:$port"
    sleep 0.3
  else
    echo "  ⚠️  $name: package.json not found, skipped"
  fi
done

echo ""
echo "========================================"
echo "✅ All services launching!"
echo "   Wait ~5 seconds, then test:"
echo ""
echo "   curl http://localhost:8000/health"
echo ""
echo "   Login:"
echo '   curl -X POST http://localhost:8000/api/auth/login \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"email":"admin@smartwarehouse.com","password":"Admin@123"}'"'"
echo "========================================"
