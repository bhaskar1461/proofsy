const fs = require("fs");
const path = require("path");
const { InstitutionSigningProvider, resetSigningProviders } = require("../src/services/signing");

describe("Signing Key Versioning & Rotation Tests", () => {
  const testKeysDir = path.join(__dirname, "temp_rotation_keys");

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

  it("should support key rotation: old certificates signed with v1 remain verifiable while new certificates sign with v2", async () => {
    const provider = new InstitutionSigningProvider({ keysDir: testKeysDir });
    provider.init();

    const initialKeyId = provider.getActiveKeyId();
    expect(initialKeyId).toBe("inst-rsa-2026-v1");

    // 1. Sign Certificate A with initial key (v1)
    const certAClaims = {
      verificationCode: "CERT-ROTATION-A",
      recipientName: "Alice User",
      recipientEmail: "alice@rotation.com",
      eventName: "Conference 2026",
      issuedAt: new Date().toISOString(),
    };

    const signResultA = await provider.sign(certAClaims);
    expect(signResultA.signingKeyId).toBe(initialKeyId);

    // 2. Rotate to Key v2
    const rotationResult = provider.rotateKey("inst-rsa-2026-v2");
    expect(rotationResult.newKeyId).toBe("inst-rsa-2026-v2");
    expect(provider.getActiveKeyId()).toBe("inst-rsa-2026-v2");

    // 3. Sign Certificate B with new active key (v2)
    const certBClaims = {
      verificationCode: "CERT-ROTATION-B",
      recipientName: "Bob User",
      recipientEmail: "bob@rotation.com",
      eventName: "Symposium 2026",
      issuedAt: new Date().toISOString(),
    };

    const signResultB = await provider.sign(certBClaims);
    expect(signResultB.signingKeyId).toBe("inst-rsa-2026-v2");

    // 4. Verify Certificate A using its stored keyId (v1)
    const verifyA = await provider.verify(certAClaims, signResultA.signature, {
      keyId: signResultA.signingKeyId,
    });
    expect(verifyA.isValid).toBe(true);

    // 5. Verify Certificate B using its stored keyId (v2)
    const verifyB = await provider.verify(certBClaims, signResultB.signature, {
      keyId: signResultB.signingKeyId,
    });
    expect(verifyB.isValid).toBe(true);

    // 6. Verify listPublicKeys lists both active and retired keys
    const publicKeys = provider.listPublicKeys();
    expect(publicKeys.length).toBe(2);

    const v1Meta = publicKeys.find((k) => k.keyId === "inst-rsa-2026-v1");
    const v2Meta = publicKeys.find((k) => k.keyId === "inst-rsa-2026-v2");

    expect(v1Meta.status).toBe("retired");
    expect(v1Meta.isActive).toBe(false);
    expect(v2Meta.status).toBe("active");
    expect(v2Meta.isActive).toBe(true);
  });
});
