#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/SmartWarehouse_Database"

echo "🌱 Seeding SmartWarehouse databases..."

import_data() {
  local file="$1"
  local container="$2"
  local db="$3"
  local collection="$4"

  echo "📦 Importing $(basename "$file") → $container/$db.$collection"
  docker cp "$file" "$container:/tmp/$(basename "$file")"
  docker exec "$container" mongoimport \
    --db "$db" \
    --collection "$collection" \
    --file "/tmp/$(basename "$file")" \
    --jsonArray \
    --mode upsert \
    --upsertFields _id \
    2>/dev/null || echo "  ⚠️  Some records may already exist"
}

import_data "$DATA_DIR/users.json" "sw-mongo-auth" "sw_auth" "users"
import_data "$DATA_DIR/products.json" "sw-mongo-product" "sw_product" "products"
import_data "$DATA_DIR/warehouses.json" "sw-mongo-inventory" "sw_inventory" "warehouses"
import_data "$DATA_DIR/inventorylogs.json" "sw-mongo-inventory" "sw_inventory" "inventorylogs"
import_data "$DATA_DIR/purchaseorders.json" "sw-mongo-order" "sw_order" "purchaseorders"
import_data "$DATA_DIR/salesorders.json" "sw-mongo-order" "sw_order" "salesorders"
import_data "$DATA_DIR/customers.json" "sw-mongo-order" "sw_order" "customers"
import_data "$DATA_DIR/suppliers.json" "sw-mongo-order" "sw_order" "suppliers"
import_data "$DATA_DIR/shipments.json" "sw-mongo-shipment" "sw_shipment" "shipments"
import_data "$DATA_DIR/notifications.json" "sw-mongo-notification" "sw_notification" "notifications"

echo ""
echo "✅ Seed complete!"
echo ""
echo "📋 Default accounts:"
echo "   admin@scm.com (admin role)"
echo "   manager@scm.com (warehouse_manager role)"
echo "   staff@scm.com (staff role)"
echo "   driver@scm.com (driver role)"
