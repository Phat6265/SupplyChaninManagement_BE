#!/bin/bash
# ============================================================
# SmartWarehouse — Stop All Services
# Run: bash scripts/stop-all.sh
# ============================================================

echo "🔴 Stopping all SmartWarehouse services..."

for port in 8000 3001 3002 3003 3004 3005 3006 3007; do
  pid=$(netstat -ano 2>/dev/null | grep ":${port} " | grep LISTENING | awk '{print $5}' | head -1)
  if [ -n "$pid" ] && [ "$pid" != "0" ]; then
    taskkill //PID "$pid" //F > /dev/null 2>&1
    echo "  ✅ Stopped :$port (PID $pid)"
  else
    echo "  ⚪ :$port already free"
  fi
done

echo ""
echo "✅ All services stopped!"
