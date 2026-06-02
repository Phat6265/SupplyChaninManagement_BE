/**
 * Seed script cho local development (không cần Docker/mongoimport)
 * Chạy: node scripts/seed-local.js
 * (Dùng mongodb driver từ node_modules của auth-service)
 */
const { MongoClient } = require('../services/auth-service/node_modules/mongodb');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'SmartWarehouse_Database');

const DATABASES = [
  { file: 'users.json', uri: 'mongodb://localhost:27017', db: 'sw_auth', collection: 'users' },
  { file: 'products.json', uri: 'mongodb://localhost:27017', db: 'sw_product', collection: 'products' },
  { file: 'warehouses.json', uri: 'mongodb://localhost:27017', db: 'sw_inventory', collection: 'warehouses' },
  { file: 'inventorylogs.json', uri: 'mongodb://localhost:27017', db: 'sw_inventory', collection: 'inventorylogs' },
  { file: 'purchaseorders.json', uri: 'mongodb://localhost:27017', db: 'sw_order', collection: 'purchaseorders' },
  { file: 'salesorders.json', uri: 'mongodb://localhost:27017', db: 'sw_order', collection: 'salesorders' },
  { file: 'customers.json', uri: 'mongodb://localhost:27017', db: 'sw_order', collection: 'customers' },
  { file: 'suppliers.json', uri: 'mongodb://localhost:27017', db: 'sw_order', collection: 'suppliers' },
  { file: 'shipments.json', uri: 'mongodb://localhost:27017', db: 'sw_shipment', collection: 'shipments' },
  { file: 'notifications.json', uri: 'mongodb://localhost:27017', db: 'sw_notification', collection: 'notifications' },
];

async function seed() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    for (const item of DATABASES) {
      const filePath = path.join(DATA_DIR, item.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${item.file}, skipping...`);
        continue;
      }

      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`⚠️  Empty or invalid data in ${item.file}, skipping...`);
        continue;
      }

      const db = client.db(item.db);
      const collection = db.collection(item.collection);

      // Drop existing data and re-insert
      await collection.deleteMany({});
      await collection.insertMany(data);

      console.log(`📦 ${item.file} → ${item.db}.${item.collection} (${data.length} documents)`);
    }

    console.log('\n✅ Seed complete!');
    console.log('\n📋 Test accounts (password: Admin@123):');
    console.log('   admin@scm.com      (admin)');
    console.log('   manager@scm.com    (warehouse_manager)');
    console.log('   staff@scm.com      (staff)');
    console.log('   driver@scm.com     (driver)');
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await client.close();
  }
}

seed();
