/**
 * Canonical Payload Serializer for Proofsy Cryptographic Signatures
 * 
 * Enforces deterministic representation:
 * 1. Normalized claim values (NFC Unicode, lowercased emails, trimmed strings)
 * 2. Standardized ISO 8601 UTC date formats
 * 3. Strict alphabetical key ordering
 * 4. Explicit null handling
 * 5. UTF-8 encoding
 */

const crypto = require("crypto");

/**
 * Format a Date or date string to strict ISO 8601 UTC string
 * @param {Date|string|number} date
 * @returns {string|null}
 */
function toIsoUtc(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Build canonical payload according to Phase 1 spec: (id, name, event, issuer, date)
 * All fields strictly normalized and sorted alphabetically.
 */
function buildHmacCanonicalPayload({ id, name, recipientName, event, eventName, issuer, organizerName, date, eventDate }) {
  const normId = String(id || "").trim().toUpperCase();
  if (!normId) {
    throw new Error("id (verificationCode) is required for HMAC canonical payload");
  }
  return {
    date: toIsoUtc(date || eventDate),
    event: String(event || eventName || "").trim().normalize("NFC"),
    id: normId,
    issuer: String(issuer || organizerName || "").trim().normalize("NFC"),
    name: String(name || recipientName || "").trim().normalize("NFC"),
  };
}

/**
 * Deterministically serialize HMAC canonical payload with alphabetical keys
 */
function serializeHmacCanonicalPayload(payload) {
  const normalized = buildHmacCanonicalPayload(payload);
  const sortedKeys = Object.keys(normalized).sort();
  const sortedObj = {};
  for (const k of sortedKeys) {
    sortedObj[k] = normalized[k];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Sign canonical payload with HMAC-SHA256 and server-side secret
 * @param {Object} payload { id, name, event, issuer, date }
 * @param {string} [secret] Server secret
 * @returns {string} Hex-encoded HMAC-SHA256 signature
 */
function signHmacPayload(payload, secret = null) {
  const key = secret || process.env.SIGNING_SECRET || process.env.JWT_SECRET;
  if (!key) {
    throw new Error("Server secret (SIGNING_SECRET or JWT_SECRET) is required for HMAC signing");
  }
  const serialized = serializeHmacCanonicalPayload(payload);
  return crypto.createHmac("sha256", key).update(serialized, "utf8").digest("hex");
}

/**
 * Recompute HMAC-SHA256 signature and compare in constant time
 * @param {Object} payload { id, name, event, issuer, date }
 * @param {string} signature Hex-encoded signature to verify
 * @param {string} [secret] Server secret
 * @returns {boolean} True if signature matches, false otherwise
 */
function verifyHmacPayload(payload, signature, secret = null) {
  if (!signature || typeof signature !== "string") return false;
  try {
    const expected = signHmacPayload(payload, secret);
    const expectedBuf = Buffer.from(expected, "hex");
    const actualBuf = Buffer.from(signature.trim().toLowerCase(), "hex");
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Build normalized canonical payload object from certificate and event claims
 * @param {Object} claims
 * @returns {Object}
 */
function buildCanonicalPayload(claims) {
  if (!claims) {
    throw new Error("Claims object is required for canonical payload construction");
  }

  const verificationCode = String(claims.verificationCode || "").trim().toUpperCase();
  if (!verificationCode) {
    throw new Error("verificationCode is required for canonical payload");
  }

  return {
    expiresAt: toIsoUtc(claims.expiresAt),
    eventDate: toIsoUtc(claims.eventDate),
    eventName: String(claims.eventName || "").trim().normalize("NFC"),
    issuedAt: toIsoUtc(claims.issuedAt) || new Date().toISOString(),
    organizationId: claims.organizationId ? String(claims.organizationId) : "",
    recipientEmail: String(claims.recipientEmail || "").trim().toLowerCase(),
    recipientName: String(claims.recipientName || "").trim().normalize("NFC"),
    verificationCode: verificationCode,
  };
}

/**
 * Deterministically stringify a payload with alphabetical key sorting
 * @param {Object} data
 * @returns {string} Canonical UTF-8 string
 */
function serializeCanonicalPayload(data) {
  if (!data || typeof data !== "object") return "";

  const sortedKeys = Object.keys(data).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = data[key] === undefined ? null : data[key];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Build legacy deterministic payload for backwards compatibility with v1 certificates
 * @param {Object} claims
 * @returns {Object}
 */
function buildLegacyPayload(claims) {
  return {
    verificationCode: String(claims.verificationCode || "").trim().toUpperCase(),
    recipientName: String(claims.recipientName || "").trim(),
    recipientEmail: String(claims.recipientEmail || "").trim(),
    eventName: String(claims.eventName || "").trim(),
    issuedAt: toIsoUtc(claims.issuedAt) || new Date().toISOString(),
  };
}

/**
 * Serialize legacy payload with sorted keys matching signatureService v1
 * @param {Object} data
 * @returns {string}
 */
function serializeLegacyPayload(data) {
  if (!data || typeof data !== "object") return "";
  const sorted = {};
  Object.keys(data).sort().forEach((key) => {
    sorted[key] = data[key];
  });
  return JSON.stringify(sorted);
}

module.exports = {
  buildCanonicalPayload,
  serializeCanonicalPayload,
  buildLegacyPayload,
  serializeLegacyPayload,
  toIsoUtc,
  buildHmacCanonicalPayload,
  serializeHmacCanonicalPayload,
  signHmacPayload,
  verifyHmacPayload,
};
