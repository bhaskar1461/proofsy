/**
 * Base Abstract Interface for Digital Signing Providers
 *
 * All signing implementations (InstitutionSigningProvider, and future CASigningProvider,
 * ESignProvider) must implement these methods.
 */
class SigningProvider {
  /**
   * Provider identifier (e.g. 'institution', 'ca', 'esign')
   */
  get providerType() {
    throw new Error("providerType must be implemented by subclass");
  }

  /**
   * Sign a canonical payload
   * @param {Object|string} payload Canonical payload or claims object
   * @param {Object} [options]
   * @returns {Promise<{ signature: string, algorithm: string, signingKeyId: string, signedAt: string, publicKeyPem: string, fingerprint: string }>}
   */
  async sign(payload, options = {}) {
    throw new Error("sign() must be implemented by subclass");
  }

  /**
   * Verify signature against canonical payload
   * @param {Object|string} payload Canonical payload or claims object
   * @param {string} signature Base64 encoded signature
   * @param {Object} [options] Options including keyId
   * @returns {Promise<{ isValid: boolean, signingKeyId: string, algorithm: string, error?: string }>}
   */
  async verify(payload, signature, options = {}) {
    throw new Error("verify() must be implemented by subclass");
  }

  /**
   * Returns current active key ID
   * @returns {string}
   */
  getActiveKeyId() {
    throw new Error("getActiveKeyId() must be implemented by subclass");
  }

  /**
   * Returns public key in PEM format for a given keyId (or active key if keyId omitted)
   * @param {string} [keyId]
   * @returns {string} Public key PEM
   */
  getPublicKey(keyId) {
    throw new Error("getPublicKey() must be implemented by subclass");
  }

  /**
   * Returns metadata for a key version
   * @param {string} [keyId]
   * @returns {Object} Key metadata (algorithm, keySize, fingerprint, status, createdAt)
   */
  getKeyMetadata(keyId) {
    throw new Error("getKeyMetadata() must be implemented by subclass");
  }

  /**
   * List all known public keys (active, previous, retired)
   * @returns {Array<Object>}
   */
  listPublicKeys() {
    throw new Error("listPublicKeys() must be implemented by subclass");
  }
}

module.exports = SigningProvider;
