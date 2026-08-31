/**
 * Signature Service Façade
 * 
 * Provides backward-compatible wrappers around the new SigningProvider architecture
 * while ensuring synchronous helper methods continue to work seamlessly.
 */
const { getSigningProvider, serializeLegacyPayload, serializeCanonicalPayload } = require("./signing");

/**
 * Sign data object using active institution signing provider
 * @param {Object} data 
 * @param {Object} [options]
 * @returns {string} Base64 encoded signature
 */
function signCertificateData(data, options = {}) {
  const provider = getSigningProvider("institution");
  // Synchronous extraction via provider's active key
  provider.init();
  const keyId = options.keyId || provider.getActiveKeyId();
  const entry = provider.keyCache.get(keyId);
  if (!entry || !entry.privateKeyPem) {
    throw new Error(`Active private key for version "${keyId}" not found for signing.`);
  }

  const crypto = require("crypto");
  // Use canonical serializer
  const { buildCanonicalPayload, serializeCanonicalPayload } = require("./signing/canonicalSerializer");
  const canonicalObj = buildCanonicalPayload(data);
  const serialized = serializeCanonicalPayload(canonicalObj);

  const signer = crypto.createSign("SHA256");
  signer.update(serialized, "utf8");
  signer.end();
  return signer.sign(entry.privateKeyPem, "base64");
}

/**
 * Full sign operation returning signature metadata
 * @param {Object} data
 * @param {Object} [options]
 * @returns {Promise<{ signature: string, algorithm: string, signingKeyId: string, signedAt: string, publicKeyPem: string, fingerprint: string }>}
 */
async function signCertificateWithMetadata(data, options = {}) {
  const provider = getSigningProvider("institution");
  return provider.sign(data, options);
}

/**
 * Verify base64 signature against data object using public key and SHA-256
 * Supports keyId lookup and backward-compatible legacy payload verification.
 * @param {Object} data 
 * @param {string} signature Base64 encoded signature
 * @param {Object} [options]
 * @returns {boolean}
 */
function verifyCertificateSignature(data, signature, options = {}) {
  if (!signature) return false;
  const provider = getSigningProvider("institution");
  provider.init();

  const keyId = options.keyId || options.signingKeyId || provider.getActiveKeyId();
  let publicKeyPem;
  try {
    publicKeyPem = provider.getPublicKey(keyId);
  } catch {
    try {
      publicKeyPem = provider.getPublicKey(provider.getActiveKeyId());
    } catch {
      return false;
    }
  }

  const crypto = require("crypto");
  const {
    buildCanonicalPayload,
    serializeCanonicalPayload,
    buildLegacyPayload,
    serializeLegacyPayload,
  } = require("./signing/canonicalSerializer");

  // 1. Try canonical v2 payload
  try {
    const canonicalObj = buildCanonicalPayload(data);
    const serialized = serializeCanonicalPayload(canonicalObj);
    const verifier = crypto.createVerify("SHA256");
    verifier.update(serialized, "utf8");
    verifier.end();
    if (verifier.verify(publicKeyPem, signature, "base64")) {
      return true;
    }
  } catch {
    // Continue to legacy fallback
  }

  // 2. Try legacy v1 payload
  try {
    const legacyObj = buildLegacyPayload(data);
    const legacySerialized = serializeLegacyPayload(legacyObj);
    const legacyVerifier = crypto.createVerify("SHA256");
    legacyVerifier.update(legacySerialized, "utf8");
    legacyVerifier.end();
    return legacyVerifier.verify(publicKeyPem, signature, "base64");
  } catch {
    return false;
  }
}

/**
 * Async verify with rich diagnostic output
 * @param {Object} data
 * @param {string} signature
 * @param {Object} [options]
 */
async function verifyCertificateWithMetadata(data, signature, options = {}) {
  const provider = getSigningProvider("institution");
  return provider.verify(data, signature, options);
}

/**
 * Returns the public key in PEM format
 * @param {string} [keyId]
 * @returns {string}
 */
function getPublicKeyPem(keyId) {
  const provider = getSigningProvider("institution");
  return provider.getPublicKey(keyId);
}

/**
 * List all known public keys
 */
function listPublicKeys() {
  const provider = getSigningProvider("institution");
  return provider.listPublicKeys();
}

/**
 * Rotate to a new active signing key version
 * @param {string} [newKeyId]
 */
function rotateSigningKey(newKeyId) {
  const provider = getSigningProvider("institution");
  return provider.rotateKey(newKeyId);
}

/**
 * Get active key ID
 */
function getActiveKeyId() {
  const provider = getSigningProvider("institution");
  return provider.getActiveKeyId();
}

module.exports = {
  signCertificateData,
  signCertificateWithMetadata,
  verifyCertificateSignature,
  verifyCertificateWithMetadata,
  getPublicKeyPem,
  listPublicKeys,
  rotateSigningKey,
  getActiveKeyId,
  getSigningProvider,
};
