const crypto = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}
if (!global.crypto) {
  global.crypto = crypto;
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = crypto.randomUUID || (() => crypto.randomBytes(16).toString('hex'));
}
