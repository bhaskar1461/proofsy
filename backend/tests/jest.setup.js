const crypto = require('crypto');
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proofsy-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_local_jest_min_32_characters';
process.env.SIGNING_SECRET = process.env.SIGNING_SECRET || 'test_signing_secret_for_local_jest_32_chars';

if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}
if (!global.crypto) {
  global.crypto = crypto;
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = crypto.randomUUID || (() => crypto.randomBytes(16).toString('hex'));
}
