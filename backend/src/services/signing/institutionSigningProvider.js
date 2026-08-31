const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const SigningProvider = require("./signingProvider");
const {
  buildCanonicalPayload,
  serializeCanonicalPayload,
  buildLegacyPayload,
  serializeLegacyPayload,
} = require("./canonicalSerializer");

const DEFAULT_KEYS_DIR = path.join(__dirname, "../../../storage/keys");
const LEGACY_KEY_PATH = path.join(__dirname, "../../../proofsy_key.pem");
const DEFAULT_KEY_VERSION = "inst-rsa-2026-v1";
const ALGORITHM = "RSA-SHA256";

class InstitutionSigningProvider extends SigningProvider {
  constructor(options = {}) {
    super();
    this.keysDir = options.keysDir || process.env.SIGNING_KEYS_DIR || DEFAULT_KEYS_DIR;
    this.activeKeyId = options.activeKeyId || process.env.SIGNING_ACTIVE_KEY_ID || null;
    
    // In-memory key caches: keyId -> { privateKeyPem, publicKeyPem, metadata }
    this.keyCache = new Map();
    this.initialized = false;
  }

  get providerType() {
    return "institution";
  }

  /**
   * Ensure storage directory exists
   */
  _ensureKeysDir() {
    if (!fs.existsSync(this.keysDir)) {
      fs.mkdirSync(this.keysDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Compute standard SHA-256 fingerprint for a public key
   */
  _computeFingerprint(publicKeyPem) {
    if (!publicKeyPem) return "";
    return crypto.createHash("sha256").update(publicKeyPem.trim()).digest("hex").toUpperCase();
  }

  /**
   * Load or initialize the signing keypairs
   */
  init() {
    if (this.initialized) return;
    this._ensureKeysDir();

    // 1. Check if environment variables directly supply the active keypair
    if (process.env.INSTITUTION_PRIVATE_KEY_PEM && process.env.INSTITUTION_PUBLIC_KEY_PEM) {
      const keyId = this.activeKeyId || DEFAULT_KEY_VERSION;
      const priv = process.env.INSTITUTION_PRIVATE_KEY_PEM.replace(/\\n/g, "\n");
      const pub = process.env.INSTITUTION_PUBLIC_KEY_PEM.replace(/\\n/g, "\n");
      const fp = this._computeFingerprint(pub);
      
      this.keyCache.set(keyId, {
        privateKeyPem: priv,
        publicKeyPem: pub,
        metadata: {
          keyId,
          algorithm: ALGORITHM,
          keySize: 2048,
          fingerprint: fp,
          status: "active",
          source: "environment",
          createdAt: new Date().toISOString(),
        },
      });
      this.activeKeyId = keyId;
      this.initialized = true;
      console.log(`[SigningProvider] Loaded active signing key "${keyId}" from environment variables.`);
      return;
    }

    // 2. Discover all key files in keysDir
    this._loadAllKeysFromDisk();

    // 3. If legacy proofsy_key.pem exists and no keys found, import it as legacy-v0
    if (this.keyCache.size === 0 && fs.existsSync(LEGACY_KEY_PATH)) {
      try {
        const legacyPriv = fs.readFileSync(LEGACY_KEY_PATH, "utf8");
        const keyObj = crypto.createPublicKey({ key: legacyPriv, format: "pem" });
        const legacyPub = keyObj.export({ type: "spki", format: "pem" });
        const legacyKeyId = "inst-rsa-legacy-v0";
        const fp = this._computeFingerprint(legacyPub);

        this._saveKeypairToDisk(legacyKeyId, legacyPriv, legacyPub, {
          keyId: legacyKeyId,
          algorithm: ALGORITHM,
          keySize: 2048,
          fingerprint: fp,
          status: "active",
          source: "legacy_file",
          createdAt: new Date().toISOString(),
        });
        this.activeKeyId = legacyKeyId;
        this.initialized = true;
        console.log(`[SigningProvider] Imported legacy key as "${legacyKeyId}" to persistent storage.`);
        return;
      } catch (err) {
        console.error("[SigningProvider] Error importing legacy key:", err.message);
      }
    }

    // 4. If still no keys exist, generate the default production-grade RSA 2048-bit keypair
    if (this.keyCache.size === 0) {
      const defaultKeyId = DEFAULT_KEY_VERSION;
      console.log(`[SigningProvider] No signing keys found. Generating persistent keypair: ${defaultKeyId}...`);
      
      const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const fp = this._computeFingerprint(publicKey);
      this._saveKeypairToDisk(defaultKeyId, privateKey, publicKey, {
        keyId: defaultKeyId,
        algorithm: ALGORITHM,
        keySize: 2048,
        fingerprint: fp,
        status: "active",
        source: "auto_generated_persistent",
        createdAt: new Date().toISOString(),
      });
      this.activeKeyId = defaultKeyId;
    }

    // 5. Determine active key ID from active_key_id.txt or fallback to first available active
    if (!this.activeKeyId) {
      const activeFile = path.join(this.keysDir, "active_key_id.txt");
      if (fs.existsSync(activeFile)) {
        this.activeKeyId = fs.readFileSync(activeFile, "utf8").trim();
      } else {
        const firstKey = Array.from(this.keyCache.keys())[0];
        this.activeKeyId = firstKey;
        fs.writeFileSync(activeFile, firstKey, "utf8");
      }
    }

    this.initialized = true;
    console.log(`[SigningProvider] Institutional signing initialized. Active key: "${this.activeKeyId}" (Total keys: ${this.keyCache.size})`);
  }

  /**
   * Scan disk and load all keypairs and metadata
   */
  _loadAllKeysFromDisk() {
    if (!fs.existsSync(this.keysDir)) return;
    const files = fs.readdirSync(this.keysDir);

    const keyIds = new Set();
    files.forEach((file) => {
      if (file.endsWith(".private.pem")) {
        keyIds.add(file.replace(".private.pem", ""));
      } else if (file.endsWith(".public.pem")) {
        keyIds.add(file.replace(".public.pem", ""));
      }
    });

    keyIds.forEach((keyId) => {
      const privPath = path.join(this.keysDir, `${keyId}.private.pem`);
      const pubPath = path.join(this.keysDir, `${keyId}.public.pem`);
      const metaPath = path.join(this.keysDir, `${keyId}.meta.json`);

      let privPem = null;
      let pubPem = null;
      let meta = null;

      if (fs.existsSync(privPath)) {
        privPem = fs.readFileSync(privPath, "utf8");
      }
      if (fs.existsSync(pubPath)) {
        pubPem = fs.readFileSync(pubPath, "utf8");
      } else if (privPem) {
        // Derive public key from private key if missing
        try {
          const keyObj = crypto.createPublicKey({ key: privPem, format: "pem" });
          pubPem = keyObj.export({ type: "spki", format: "pem" });
          fs.writeFileSync(pubPath, pubPem, "utf8");
        } catch (e) {
          console.error(`[SigningProvider] Could not derive public key for ${keyId}:`, e.message);
        }
      }

      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        } catch {
          meta = null;
        }
      }

      if (pubPem) {
        const fp = this._computeFingerprint(pubPem);
        if (!meta) {
          meta = {
            keyId,
            algorithm: ALGORITHM,
            keySize: 2048,
            fingerprint: fp,
            status: "active",
            createdAt: new Date().toISOString(),
          };
        }

        this.keyCache.set(keyId, {
          privateKeyPem: privPem,
          publicKeyPem: pubPem,
          metadata: meta,
        });
      }
    });

    const activeFile = path.join(this.keysDir, "active_key_id.txt");
    if (fs.existsSync(activeFile)) {
      this.activeKeyId = fs.readFileSync(activeFile, "utf8").trim();
    }
  }

  /**
   * Persist a keypair and its metadata to disk
   */
  _saveKeypairToDisk(keyId, privateKeyPem, publicKeyPem, metadata) {
    this._ensureKeysDir();
    const privPath = path.join(this.keysDir, `${keyId}.private.pem`);
    const pubPath = path.join(this.keysDir, `${keyId}.public.pem`);
    const metaPath = path.join(this.keysDir, `${keyId}.meta.json`);
    const activeFile = path.join(this.keysDir, "active_key_id.txt");

    if (privateKeyPem) {
      fs.writeFileSync(privPath, privateKeyPem, { encoding: "utf8", mode: 0o600 });
    }
    if (publicKeyPem) {
      fs.writeFileSync(pubPath, publicKeyPem, { encoding: "utf8", mode: 0o644 });
    }
    if (metadata) {
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf8");
    }

    if (metadata?.status === "active") {
      fs.writeFileSync(activeFile, keyId, "utf8");
    }

    this.keyCache.set(keyId, {
      privateKeyPem,
      publicKeyPem,
      metadata,
    });
  }

  /**
   * Get the active key version ID
   */
  getActiveKeyId() {
    this.init();
    return this.activeKeyId;
  }

  /**
   * Get public key PEM for a given key ID (or active key if omitted)
   */
  getPublicKey(keyId) {
    this.init();
    const id = keyId || this.activeKeyId;
    const entry = this.keyCache.get(id);
    if (!entry || !entry.publicKeyPem) {
      // Re-scan disk in case a new public key was added dynamically
      this._loadAllKeysFromDisk();
      const freshEntry = this.keyCache.get(id);
      if (freshEntry && freshEntry.publicKeyPem) return freshEntry.publicKeyPem;
      throw new Error(`Signing public key for version "${id}" not found.`);
    }
    return entry.publicKeyPem;
  }

  /**
   * Get metadata for a specific key version
   */
  getKeyMetadata(keyId) {
    this.init();
    const id = keyId || this.activeKeyId;
    const entry = this.keyCache.get(id);
    return entry ? entry.metadata : null;
  }

  /**
   * List all public keys known to the system
   */
  listPublicKeys() {
    this.init();
    const list = [];
    for (const [keyId, entry] of this.keyCache.entries()) {
      list.push({
        ...entry.metadata,
        keyId,
        isActive: keyId === this.activeKeyId,
        publicKeyPem: entry.publicKeyPem,
      });
    }
    return list;
  }

  /**
   * Rotate to a new active signing key
   * @param {string} [customKeyId]
   * @param {Object} [options]
   */
  rotateKey(customKeyId = null, options = {}) {
    this.init();
    const year = new Date().getFullYear();
    const nextIndex = this.keyCache.size + 1;
    const newKeyId = customKeyId || `inst-rsa-${year}-v${nextIndex}`;

    if (this.keyCache.has(newKeyId)) {
      throw new Error(`Key with ID "${newKeyId}" already exists.`);
    }

    console.log(`[SigningProvider] Rotating key. Retiring "${this.activeKeyId}" and generating "${newKeyId}"...`);

    // 1. Mark previous active key as retired
    if (this.activeKeyId && this.keyCache.has(this.activeKeyId)) {
      const oldEntry = this.keyCache.get(this.activeKeyId);
      oldEntry.metadata.status = "retired";
      oldEntry.metadata.retiredAt = new Date().toISOString();
      const oldMetaPath = path.join(this.keysDir, `${this.activeKeyId}.meta.json`);
      fs.writeFileSync(oldMetaPath, JSON.stringify(oldEntry.metadata, null, 2), "utf8");
    }

    // 2. Generate new 2048-bit RSA keypair
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: options.keySize || 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const fp = this._computeFingerprint(publicKey);
    const metadata = {
      keyId: newKeyId,
      algorithm: ALGORITHM,
      keySize: options.keySize || 2048,
      fingerprint: fp,
      status: "active",
      source: "rotated",
      createdAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
    };

    this._saveKeypairToDisk(newKeyId, privateKey, publicKey, metadata);
    this.activeKeyId = newKeyId;

    return {
      newKeyId,
      publicKeyPem: publicKey,
      fingerprint: fp,
      metadata,
    };
  }

  /**
   * Cryptographically sign a canonical certificate payload
   * @param {Object|string} payload Raw claims or pre-serialized canonical string
   * @param {Object} [options]
   */
  async sign(payload, options = {}) {
    this.init();
    const keyId = options.keyId || this.activeKeyId;
    const entry = this.keyCache.get(keyId);

    if (!entry || !entry.privateKeyPem) {
      throw new Error(`Active private key for version "${keyId}" is not available for signing.`);
    }

    let serialized;
    let canonicalObj;
    if (typeof payload === "string") {
      serialized = payload;
      canonicalObj = null;
    } else {
      canonicalObj = buildCanonicalPayload(payload);
      serialized = serializeCanonicalPayload(canonicalObj);
    }

    const signer = crypto.createSign("SHA256");
    signer.update(serialized, "utf8");
    signer.end();
    const signature = signer.sign(entry.privateKeyPem, "base64");
    const signedAt = new Date().toISOString();

    return {
      signature,
      algorithm: ALGORITHM,
      signingKeyId: keyId,
      signingProvider: this.providerType,
      signedAt,
      publicKeyPem: entry.publicKeyPem,
      fingerprint: entry.metadata?.fingerprint || this._computeFingerprint(entry.publicKeyPem),
      canonicalPayload: serialized,
    };
  }

  /**
   * Verify a cryptographic signature against a payload
   * @param {Object|string} payload Raw claims or serialized string
   * @param {string} signature Base64 signature
   * @param {Object} [options] Options including keyId and legacy mode
   */
  async verify(payload, signature, options = {}) {
    if (!signature) {
      return { isValid: false, error: "Missing cryptographic signature" };
    }

    this.init();
    const requestedKeyId = options.keyId || options.signingKeyId;
    const keyId = requestedKeyId || this.activeKeyId;
    let publicKeyPem;

    try {
      publicKeyPem = this.getPublicKey(keyId);
    } catch {
      // If a specific keyId was requested and not found, do NOT fall back to active key. Fail immediately.
      if (requestedKeyId) {
        return { isValid: false, signingKeyId: requestedKeyId, error: `Public key not found for version "${requestedKeyId}"` };
      }
      // If no key was requested, try active key as fallback
      try {
        publicKeyPem = this.getPublicKey(this.activeKeyId);
      } catch {
        return { isValid: false, error: `Public key not found for version "${keyId}"` };
      }
    }

    try {
      let serialized;
      if (options.legacy || (!options.keyId && options.useLegacySerialization)) {
        serialized = typeof payload === "string" ? payload : serializeLegacyPayload(buildLegacyPayload(payload));
      } else if (typeof payload === "string") {
        serialized = payload;
      } else {
        serialized = serializeCanonicalPayload(buildCanonicalPayload(payload));
      }

      const verifier = crypto.createVerify("SHA256");
      verifier.update(serialized, "utf8");
      verifier.end();
      const isValid = verifier.verify(publicKeyPem, signature, "base64");

      // If modern canonical verification failed and this might be a legacy certificate, try legacy payload format
      if (!isValid && typeof payload === "object" && !options.legacy) {
        const legacySerialized = serializeLegacyPayload(buildLegacyPayload(payload));
        const legacyVerifier = crypto.createVerify("SHA256");
        legacyVerifier.update(legacySerialized, "utf8");
        legacyVerifier.end();
        const isLegacyValid = legacyVerifier.verify(publicKeyPem, signature, "base64");
        if (isLegacyValid) {
          return {
            isValid: true,
            signingKeyId: keyId,
            algorithm: ALGORITHM,
            isLegacyPayload: true,
          };
        }
      }

      return {
        isValid,
        signingKeyId: keyId,
        algorithm: ALGORITHM,
        error: isValid ? null : "Cryptographic signature verification failed (payload altered or key mismatch)",
      };
    } catch (err) {
      return {
        isValid: false,
        signingKeyId: keyId,
        algorithm: ALGORITHM,
        error: `Verification error: ${err.message}`,
      };
    }
  }
}

module.exports = InstitutionSigningProvider;
