#!/usr/bin/env node
/**
 * RSA Key Generation Script
 * Generates a 2048-bit RSA key pair for JWT RS256 signing.
 * Run once before starting the auth-service:
 *   node scripts/generate-keys.js
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '..', 'keys');

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const privatePath = path.join(keysDir, 'private.pem');
const publicPath = path.join(keysDir, 'public.pem');

fs.writeFileSync(privatePath, privateKey);
fs.writeFileSync(publicPath, publicKey);

console.log('✅ RSA key pair generated successfully!');
console.log(`   Private key: ${privatePath}`);
console.log(`   Public  key: ${publicPath}`);
console.log('');
console.log('⚠️  Remember:');
console.log('   - Add keys/ to .gitignore');
console.log('   - Copy public.pem to api-gateway/keys/public.pem');
