#!/bin/bash
set -e

echo "🚀 Seeding Smart Warehouse database with demo data..."

# ═══════════════════════════════════════════════════════════════
# 1. PRODUCTS (sw-mongo-product → sw_product.products)
# ═══════════════════════════════════════════════════════════════
echo "📦 Seeding Products..."
docker exec sw-mongo-product mongosh sw_product --quiet --eval '
db.products.deleteMany({});
db.products.insertMany([
  { name: "iPhone 15 Pro Max", sku: "IPHONE-15PM", barcode: "8901234567001", categoryId: "electronics", description: "Apple flagship smartphone", price: 34990000, unit: "pcs", createdAt: new Date("2024-11-01"), updatedAt: new Date("2024-11-01") },
  { name: "MacBook Air M3", sku: "MBA-M3-2024", barcode: "8901234567002", categoryId: "electronics", description: "Apple laptop 15 inch", price: 32990000, unit: "pcs", createdAt: new Date("2024-11-05"), updatedAt: new Date("2024-11-05") },
  { name: "Samsung Galaxy S24 Ultra", sku: "SGS24U-256", barcode: "8901234567003", categoryId: "electronics", description: "Samsung flagship smartphone", price: 31990000, unit: "pcs", createdAt: new Date("2024-11-10"), updatedAt: new Date("2024-11-10") },
  { name: "AirPods Pro 2", sku: "APP2-USBC", barcode: "8901234567004", categoryId: "electronics", description: "Apple wireless earbuds USB-C", price: 6990000, unit: "pcs", createdAt: new Date("2024-12-01"), updatedAt: new Date("2024-12-01") },
  { name: "iPad Air M2", sku: "IPAD-AIR-M2", barcode: "8901234567005", categoryId: "electronics", description: "Apple tablet 11 inch", price: 18990000, unit: "pcs", createdAt: new Date("2024-12-05"), updatedAt: new Date("2024-12-05") },
  { name: "Dell Monitor U2723QE", sku: "DELL-U2723", barcode: "8901234567006", categoryId: "peripherals", description: "27 inch 4K USB-C Monitor", price: 12990000, unit: "pcs", createdAt: new Date("2024-12-10"), updatedAt: new Date("2024-12-10") },
  { name: "Logitech MX Master 3S", sku: "LOG-MXM3S", barcode: "8901234567007", categoryId: "peripherals", description: "Wireless mouse", price: 2490000, unit: "pcs", createdAt: new Date("2025-01-05"), updatedAt: new Date("2025-01-05") },
  { name: "Sony WH-1000XM5", sku: "SONY-XM5", barcode: "8901234567008", categoryId: "audio", description: "Noise cancelling headphones", price: 8490000, unit: "pcs", createdAt: new Date("2025-01-10"), updatedAt: new Date("2025-01-10") },
  { name: "Apple Watch Ultra 2", sku: "AW-ULTRA2", barcode: "8901234567009", categoryId: "wearables", description: "Apple smartwatch", price: 21990000, unit: "pcs", createdAt: new Date("2025-01-15"), updatedAt: new Date("2025-01-15") },
  { name: "Samsung T7 SSD 1TB", sku: "SSDT7-1TB", barcode: "8901234567010", categoryId: "storage", description: "Portable SSD USB 3.2", price: 2890000, unit: "pcs", createdAt: new Date("2025-02-01"), updatedAt: new Date("2025-02-01") },
  { name: "Anker 737 Power Bank", sku: "ANK-737-PB", barcode: "8901234567011", categoryId: "accessories", description: "24000mAh 140W", price: 3690000, unit: "pcs", createdAt: new Date("2025-02-10"), updatedAt: new Date("2025-02-10") },
  { name: "Keychron K3 Pro", sku: "KC-K3PRO", barcode: "8901234567012", categoryId: "peripherals", description: "Low profile wireless keyboard", price: 2690000, unit: "pcs", createdAt: new Date("2025-02-15"), updatedAt: new Date("2025-02-15") }
]);
print("✅ " + db.products.countDocuments() + " products inserted");
'

# ═══════════════════════════════════════════════════════════════
# 2. WAREHOUSES (sw-mongo-inventory → sw_inventory.warehouses)
# ═══════════════════════════════════════════════════════════════
echo "🏭 Seeding Warehouses..."
docker exec sw-mongo-inventory mongosh sw_inventory --quiet --eval '
db.warehouses.deleteMany({});
db.warehouses.insertMany([
  { name: "Kho Trung Tâm HCM", location: "Ho Chi Minh City", address: "123 Nguyen Van Linh, Q7", capacity: 50000, currentStock: 12500, createdAt: new Date("2024-10-01"), updatedAt: new Date("2024-10-01") },
  { name: "Kho Hà Nội", location: "Hanoi", address: "456 Pham Hung, Cau Giay", capacity: 30000, currentStock: 8200, createdAt: new Date("2024-10-15"), updatedAt: new Date("2024-10-15") },
  { name: "Kho Đà Nẵng", location: "Da Nang", address: "789 Ngo Quyen, Son Tra", capacity: 20000, currentStock: 5100, createdAt: new Date("2024-11-01"), updatedAt: new Date("2024-11-01") },
  { name: "Kho Cần Thơ", location: "Can Tho", address: "321 30/4, Ninh Kieu", capacity: 15000, currentStock: 3200, createdAt: new Date("2025-01-10"), updatedAt: new Date("2025-01-10") }
]);
print("✅ " + db.warehouses.countDocuments() + " warehouses inserted");
'

# ═══════════════════════════════════════════════════════════════
# 3. CUSTOMERS & SUPPLIERS (sw-mongo-order → sw_order)
# ═══════════════════════════════════════════════════════════════
echo "👥 Seeding Customers & Suppliers..."
docker exec sw-mongo-order mongosh sw_order --quiet --eval '
db.customers.deleteMany({});
db.suppliers.deleteMany({});

var custIds = [];
var suppIds = [];

var custs = db.customers.insertMany([
  { name: "FPT Shop", email: "purchasing@fptshop.com.vn", phone: "02873007300", companyName: "FPT Digital Retail JSC", taxId: "0311609355", address: { street: "261-263 Khanh Hoi", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-10-01"), updatedAt: new Date("2024-10-01") },
  { name: "The Gioi Di Dong", email: "order@thegioididong.com", phone: "18001060", companyName: "MWG JSC", taxId: "0303217354", address: { street: "128 Tran Quang Khai", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-10-05"), updatedAt: new Date("2024-10-05") },
  { name: "CellphoneS", email: "wholesale@cellphones.com.vn", phone: "18002097", companyName: "CellphoneS JSC", taxId: "0316871040", address: { street: "60-62 Tran Quang Khai", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-11-01"), updatedAt: new Date("2024-11-01") },
  { name: "Phong Vu", email: "b2b@phongvu.vn", phone: "18006867", companyName: "Phong Vu Trading JSC", taxId: "0300455072", address: { street: "117 Nguyen Du", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-11-10"), updatedAt: new Date("2024-11-10") },
  { name: "Hoang Ha Mobile", email: "import@hoanghamobile.com", phone: "19006463", companyName: "Hoang Ha JSC", taxId: "0106145319", address: { street: "126 Tran Duy Hung", city: "Hanoi", state: "HN", zipCode: "100000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-12-01"), updatedAt: new Date("2024-12-01") },
  { name: "Nguyen Kim", email: "supply@nguyenkim.com", phone: "19001202", companyName: "Nguyen Kim Trading JSC", taxId: "0300588075", address: { street: "63-65 Hai Ba Trung", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2025-01-05"), updatedAt: new Date("2025-01-05") }
]);
custIds = custs.insertedIds;

var supps = db.suppliers.insertMany([
  { name: "Apple Vietnam", email: "distribution@apple.com.vn", phone: "02838239999", taxId: "0315553921", rating: 5, address: { street: "2 Hai Trieu", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-10-01"), updatedAt: new Date("2024-10-01") },
  { name: "Samsung Vina", email: "b2b@samsung.com.vn", phone: "1800588889", taxId: "0305987458", rating: 5, address: { street: "2 Hai Trieu", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-10-05"), updatedAt: new Date("2024-10-05") },
  { name: "Synnex FPT", email: "sales@synnexfpt.com.vn", phone: "02873007888", taxId: "0305862386", rating: 4, address: { street: "Lot L29B-31B-33B Tan Thuan EPZ", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-11-01"), updatedAt: new Date("2024-11-01") },
  { name: "Digiworld Corp", email: "order@digiworld.com.vn", phone: "02862556677", taxId: "0302807295", rating: 4, address: { street: "40 Cong Hoa", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2024-11-15"), updatedAt: new Date("2024-11-15") },
  { name: "PNY Technologies VN", email: "supply@pny.com.vn", phone: "02838218899", taxId: "0316299148", rating: 3, address: { street: "186 Dien Bien Phu", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" }, isActive: true, createdAt: new Date("2025-01-10"), updatedAt: new Date("2025-01-10") }
]);
suppIds = supps.insertedIds;

print("✅ " + db.customers.countDocuments() + " customers, " + db.suppliers.countDocuments() + " suppliers inserted");

// ── PURCHASE ORDERS ──
db.purchaseorders.deleteMany({});
var months = ["2024-11","2024-12","2025-01","2025-02","2025-03","2025-04"];
var statuses = ["approved","approved","approved","received","received","pending","draft"];
var poCount = 0;
for (var m = 0; m < months.length; m++) {
  var ordersPerMonth = 3 + Math.floor(Math.random() * 4);
  for (var k = 0; k < ordersPerMonth; k++) {
    poCount++;
    var day = 1 + Math.floor(Math.random() * 27);
    var dateStr = months[m] + "-" + (day < 10 ? "0"+day : day);
    var suppIdx = Math.floor(Math.random() * 5);
    var qty1 = 10 + Math.floor(Math.random() * 90);
    var price1 = 5000000 + Math.floor(Math.random() * 30000000);
    var qty2 = 5 + Math.floor(Math.random() * 30);
    var price2 = 2000000 + Math.floor(Math.random() * 15000000);
    db.purchaseorders.insertOne({
      poNumber: "PO-2024-" + String(poCount).padStart(4,"0"),
      supplierId: suppIds[suppIdx],
      warehouseId: "wh-hcm-01",
      items: [
        { productId: custIds[0], quantity: qty1, unitPrice: price1, totalPrice: qty1 * price1 },
        { productId: custIds[1], quantity: qty2, unitPrice: price2, totalPrice: qty2 * price2 }
      ],
      totalAmount: qty1 * price1 + qty2 * price2,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      expectedDeliveryDate: new Date(dateStr),
      notes: "Auto-generated PO",
      createdBy: "system",
      createdAt: new Date(dateStr),
      updatedAt: new Date(dateStr)
    });
  }
}
print("✅ " + db.purchaseorders.countDocuments() + " purchase orders inserted");

// ── SALES ORDERS ──
db.salesorders.deleteMany({});
var soStatuses = ["confirmed","confirmed","delivered","delivered","shipped","processing","pending","cancelled"];
var soCount = 0;
for (var m = 0; m < months.length; m++) {
  var ordersPerMonth = 4 + Math.floor(Math.random() * 6);
  for (var k = 0; k < ordersPerMonth; k++) {
    soCount++;
    var day = 1 + Math.floor(Math.random() * 27);
    var dateStr = months[m] + "-" + (day < 10 ? "0"+day : day);
    var custIdx = Math.floor(Math.random() * 6);
    var qty1 = 2 + Math.floor(Math.random() * 20);
    var price1 = 6990000 + Math.floor(Math.random() * 28000000);
    var qty2 = 1 + Math.floor(Math.random() * 10);
    var price2 = 2490000 + Math.floor(Math.random() * 20000000);
    db.salesorders.insertOne({
      orderNumber: "SO-2024-" + String(soCount).padStart(4,"0"),
      customerId: custIds[custIdx],
      items: [
        { productId: suppIds[0], quantity: qty1, unitPrice: price1, totalPrice: qty1 * price1 },
        { productId: suppIds[1], quantity: qty2, unitPrice: price2, totalPrice: qty2 * price2 }
      ],
      totalAmount: qty1 * price1 + qty2 * price2,
      status: soStatuses[Math.floor(Math.random() * soStatuses.length)],
      expectedDeliveryDate: new Date(dateStr),
      shippingAddress: { street: "123 Le Loi", city: "Ho Chi Minh", state: "HCM", zipCode: "700000", country: "Vietnam" },
      notes: "Auto-generated SO",
      createdBy: "system",
      createdAt: new Date(dateStr),
      updatedAt: new Date(dateStr)
    });
  }
}
print("✅ " + db.salesorders.countDocuments() + " sales orders inserted");
'

# ═══════════════════════════════════════════════════════════════
# 4. SHIPMENTS (sw-mongo-shipment → sw_shipment.shipments)
# ═══════════════════════════════════════════════════════════════
echo "🚚 Seeding Shipments..."
docker exec sw-mongo-shipment mongosh sw_shipment --quiet --eval '
db.shipments.deleteMany({});
var months = ["2024-11","2024-12","2025-01","2025-02","2025-03","2025-04"];
var shipStatuses = ["delivered","delivered","delivered","in_transit","in_transit","pending","cancelled"];
var drivers = ["Nguyen Van A","Tran Thi B","Le Van C","Pham Duc D","Hoang Minh E"];
var count = 0;
for (var m = 0; m < months.length; m++) {
  var shipmentsPerMonth = 3 + Math.floor(Math.random() * 5);
  for (var k = 0; k < shipmentsPerMonth; k++) {
    count++;
    var day = 1 + Math.floor(Math.random() * 27);
    var dateStr = months[m] + "-" + (day < 10 ? "0"+day : day);
    db.shipments.insertOne({
      shipmentCode: "SHP-" + String(count).padStart(5,"0"),
      originWarehouseId: "wh-hcm-01",
      destinationWarehouseId: ["wh-hn-01","wh-dn-01","wh-ct-01"][Math.floor(Math.random()*3)],
      status: shipStatuses[Math.floor(Math.random() * shipStatuses.length)],
      driverId: "driver-" + (Math.floor(Math.random()*5)+1),
      latitude: 10.7 + Math.random() * 0.2,
      longitude: 106.6 + Math.random() * 0.2,
      items: [
        { productId: "prod-" + (Math.floor(Math.random()*12)+1), quantity: 5 + Math.floor(Math.random()*50) },
        { productId: "prod-" + (Math.floor(Math.random()*12)+1), quantity: 2 + Math.floor(Math.random()*20) }
      ],
      createdAt: new Date(dateStr),
      updatedAt: new Date(dateStr)
    });
  }
}
print("✅ " + db.shipments.countDocuments() + " shipments inserted");
'

# ═══════════════════════════════════════════════════════════════
# 5. INVENTORY LOGS (sw-mongo-inventory → sw_inventory.inventorylogs)
# ═══════════════════════════════════════════════════════════════
echo "📋 Seeding Inventory Logs..."
docker exec sw-mongo-inventory mongosh sw_inventory --quiet --eval '
db.inventorylogs.deleteMany({});
var months = ["2024-11","2024-12","2025-01","2025-02","2025-03","2025-04"];
var actions = ["import","import","import","export","export","adjustment","transfer"];
var products = [];
for (var i = 1; i <= 12; i++) products.push("prod-" + i);
var count = 0;
for (var m = 0; m < months.length; m++) {
  var logsPerMonth = 8 + Math.floor(Math.random() * 12);
  for (var k = 0; k < logsPerMonth; k++) {
    count++;
    var day = 1 + Math.floor(Math.random() * 27);
    var dateStr = months[m] + "-" + (day < 10 ? "0"+day : day);
    var action = actions[Math.floor(Math.random() * actions.length)];
    var qty = 10 + Math.floor(Math.random() * 200);
    var prodId = products[Math.floor(Math.random() * products.length)];
    db.inventorylogs.insertOne({
      productId: prodId,
      warehouseId: ["wh-hcm-01","wh-hn-01","wh-dn-01","wh-ct-01"][Math.floor(Math.random()*4)],
      actionType: action,
      quantity: qty,
      previousQuantity: Math.floor(Math.random() * 500),
      newQuantity: Math.floor(Math.random() * 500) + qty,
      batchNumber: "BATCH-" + months[m].replace("-","") + "-" + String(k+1).padStart(3,"0"),
      createdBy: "system",
      notes: action + " " + qty + " units of " + prodId,
      createdAt: new Date(dateStr),
      updatedAt: new Date(dateStr)
    });
  }
}
print("✅ " + db.inventorylogs.countDocuments() + " inventory logs inserted");
'

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ SEED COMPLETE! All databases populated."
echo "════════════════════════════════════════════════════"
echo "   Products:        12"
echo "   Warehouses:      4"
echo "   Customers:       6"
echo "   Suppliers:       5"
echo "   Purchase Orders: ~20-30"
echo "   Sales Orders:    ~25-45"
echo "   Shipments:       ~20-35"
echo "   Inventory Logs:  ~50-100"
echo "════════════════════════════════════════════════════"
echo "🔄 Refresh your browser to see the data!"
