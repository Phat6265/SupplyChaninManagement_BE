/**
 * Reset passwords cho tất cả test accounts về "Warehouse@123"
 * Chạy: node scripts/reset-passwords.js
 */
const { MongoClient } = require('../services/auth-service/node_modules/mongodb');
const bcrypt = require('../services/auth-service/node_modules/bcryptjs');

async function resetPasswords() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('sw_auth');
    const users = db.collection('users');

    const password = 'Warehouse@123';
    const hash = await bcrypt.hash(password, 10);

    const testEmails = [
      'admin@scm.com',
      'manager@scm.com',
      'staff@scm.com',
      'staff2@scm.com',
      'driver@scm.com',
      'driver2@scm.com',
      'admin@warehouse.com',
      'staff@warehouse.com',
    ];

    for (const email of testEmails) {
      const result = await users.updateOne(
        { email },
        { $set: { password: hash } }
      );
      if (result.matchedCount > 0) {
        console.log(`✅ Reset password: ${email}`);
      } else {
        console.log(`⚠️  Not found: ${email}`);
      }
    }

    console.log(`\n🔑 All passwords reset to: ${password}`);
    console.log('\n📋 Test accounts:');
    console.log('   admin@scm.com       → admin');
    console.log('   manager@scm.com     → warehouse_manager');
    console.log('   staff@scm.com       → staff');
    console.log('   driver@scm.com      → driver');
    console.log(`\n   Password: ${password}`);

  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    await client.close();
  }
}

resetPasswords();
