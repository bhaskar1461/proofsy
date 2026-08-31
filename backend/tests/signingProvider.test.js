const fs = require("fs");
const path = require("path");
const {
  getSigningProvider,
  InstitutionSigningProvider,
  buildCanonicalPayload,
  serializeCanonicalPayload,
  buildLegacyPayload,
  serializeLegacyPayload,
  resetSigningProviders,
} = require("../src/services/signing");

describe("SigningProvider & Canonical Serializer Tests", () => {
  const testKeysDir = path.join(__dirname, "temp_test_keys");

  beforeEach(() => {
    resetSigningProviders();
    if (fs.existsSync(testKeysDir)) {
      fs.rmSync(testKeysDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    resetSigningProviders();
    if (fs.existsSync(testKeysDir)) {
      fs.rmSync(testKeysDir, { recursive: true, force: true });
    }
  });

  describe("Canonical Serializer", () => {
    it("should produce deterministic sorted JSON output regardless of input key ordering", () => {
      const claims1 = {
        verificationCode: "cert-abc12345",
        recipientName: "Alice Smith",
        recipientEmail: "ALICE@Example.Com",
        eventName: "Annual Symposium",
        eventDate: "2026-05-15T09:00:00.000Z",
        organizationId: "org-1",
        issuedAt: "2026-05-15T12:00:00.000Z",
        expiresAt: null,
      };

      const claims2 = {
        expiresAt: null,
        issuedAt: "2026-05-15T12:00:00.000Z",
        organizationId: "org-1",
        eventName: "Annual Symposium",
        recipientEmail: "alice@example.com",
        recipientName: "Alice Smith",
        eventDate: "2026-05-15T09:00:00.000Z",
        verificationCode: "CERT-ABC12345",
      };

      const payload1 = buildCanonicalPayload(claims1);
      const payload2 = buildCanonicalPayload(claims2);

      const serialized1 = serializeCanonicalPayload(payload1);
      const serialized2 = serializeCanonicalPayload(payload2);

      expect(serialized1).toBe(serialized2);
      expect(payload1.verificationCode).toBe("CERT-ABC12345");
      expect(payload1.recipientEmail).toBe("alice@example.com");
    });
  });

  describe("InstitutionSigningProvider", () => {
    it("should sign a valid payload and verify it successfully", async () => {
      const provider = new InstitutionSigningProvider({ keysDir: testKeysDir });
      provider.init();

      const claims = {
        verificationCode: "CERT-TEST-999",
        recipientName: "Bob Jones",
        recipientEmail: "bob@jones.com",
        eventName: "Hackathon 2026",
        issuedAt: new Date().toISOString(),
      };

      const signResult = await provider.sign(claims);
      expect(signResult).toHaveProperty("signature");
      expect(signResult.algorithm).toBe("RSA-SHA256");
      expect(signResult.signingKeyId).toBe("inst-rsa-2026-v1");
      expect(signResult.signingProvider).toBe("institution");

      const verifyResult = await provider.verify(claims, signResult.signature);
      expect(verifyResult.isValid).toBe(true);
      expect(verifyResult.error).toBeNull();
    });

    it("should reject tampered payload", async () => {
      const provider = new InstitutionSigningProvider({ keysDir: testKeysDir });
      provider.init();

      const claims = {
        verificationCode: "CERT-SECURE-001",
        recipientName: "Charlie Brown",
        recipientEmail: "charlie@peanuts.com",
        eventName: "Spring Fest",
        issuedAt: new Date().toISOString(),
      };

      const signResult = await provider.sign(claims);

      // Tamper recipient name
      const tamperedClaims = {
        ...claims,
        recipientName: "Evil Imposter",
      };

      const verifyResult = await provider.verify(tamperedClaims, signResult.signature);
      expect(verifyResult.isValid).toBe(false);
      expect(verifyResult.error).toContain("failed");
    });

    it("should reject corrupted signature", async () => {
      const provider = new InstitutionSigningProvider({ keysDir: testKeysDir });
      provider.init();

      const claims = {
        verificationCode: "CERT-SECURE-002",
        recipientName: "David Miller",
        recipientEmail: "david@example.com",
        eventName: "Science Fair",
        issuedAt: new Date().toISOString(),
      };

      const signResult = await provider.sign(claims);
      const corruptedSig = signResult.signature.substring(0, signResult.signature.length - 4) + "AAAA";

      const verifyResult = await provider.verify(claims, corruptedSig);
      expect(verifyResult.isValid).toBe(false);
    });

    it("should support backward compatibility verification for legacy v1 payloads", async () => {
      const provider = new InstitutionSigningProvider({ keysDir: testKeysDir });
      provider.init();

      // Legacy payload format
      const legacyClaims = {
        verificationCode: "CERT-LEGACY-001",
        recipientName: "Legacy User",
        recipientEmail: "legacy@proofsy.io",
        eventName: "Old Event 2025",
        issuedAt: "2025-01-01T00:00:00.000Z",
      };

      // Sign using legacy serialization
      const crypto = require("crypto");
      const serializedLegacy = serializeLegacyPayload(buildLegacyPayload(legacyClaims));
      const entry = provider.keyCache.get(provider.getActiveKeyId());
      const signer = crypto.createSign("SHA256");
      signer.update(serializedLegacy, "utf8");
      signer.end();
      const legacySignature = signer.sign(entry.privateKeyPem, "base64");

      // Verify with legacy fallback
      const verifyResult = await provider.verify(legacyClaims, legacySignature, { legacy: true });
      expect(verifyResult.isValid).toBe(true);
    });
  });
});
