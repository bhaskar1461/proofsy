# Proofsy — Signing Key Standard Operating Procedures (SOP)

> **Audience**: Platform Administrators, DevOps Engineers, and Security Officers.
> **Security Notice**: Never commit private keys to version control, logs, or public repositories.

---

## 1. Initial Key Generation & Setup

### Automatic Generation (Development & First Boot)
On first startup in non-production mode, if no key exists in `storage/keys/` or environment variables, `InstitutionSigningProvider` automatically generates:
1. `inst-rsa-2026-v1.private.pem` (2048-bit RSA, mode `0600`)
2. `inst-rsa-2026-v1.public.pem` (SPKI format, mode `0644`)
3. `inst-rsa-2026-v1.meta.json` (metadata with SHA-256 fingerprint)
4. `active_key_id.txt` (set to `inst-rsa-2026-v1`)

### Manual Generation (Production Setup)
To generate an institutional production keypair manually using OpenSSL:

```bash
# 1. Create a secure directory for keys
mkdir -p storage/keys
chmod 700 storage/keys

# 2. Generate 2048-bit (or 4096-bit) RSA private key
openssl genpkey -algorithm RSA -out storage/keys/inst-rsa-2026-v1.private.pem -pkeyopt rsa_keygen_bits:2048
chmod 600 storage/keys/inst-rsa-2026-v1.private.pem

# 3. Extract public key in SPKI PEM format
openssl rsa -in storage/keys/inst-rsa-2026-v1.private.pem -pubout -out storage/keys/inst-rsa-2026-v1.public.pem
chmod 644 storage/keys/inst-rsa-2026-v1.public.pem

# 4. Set active key ID
echo "inst-rsa-2026-v1" > storage/keys/active_key_id.txt
```

---

## 2. Environment-Based Key Provisioning (Docker / Kubernetes)

In containerized or serverless environments where persistent disk storage is not attached, inject keys via environment variables:

```env
SIGNING_ACTIVE_KEY_ID=inst-rsa-2026-v1
INSTITUTION_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----"
INSTITUTION_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
```

---

## 3. Key Rotation Procedure

Key rotation allows issuing new certificates with a fresh key version while keeping all previous certificates verifiable.

### When to Rotate:
- Annually as part of routine cryptographic maintenance.
- When expanding institutional scope or organizational branding.
- Immediately following an operational security review or key compromise.

### Rotation Steps:
1. **Initiate Rotation Programmatically**:
   ```js
   const { getSigningProvider } = require("./services/signing");
   const provider = getSigningProvider("institution");
   const result = provider.rotateKey("inst-rsa-2027-v1");
   console.log("New Active Key:", result.newKeyId, "Fingerprint:", result.fingerprint);
   ```
2. **Verify Dual-Key Verification**:
   - Verify that newly issued certificates have `signingKeyId: "inst-rsa-2027-v1"`.
   - Verify that existing certificates with `signingKeyId: "inst-rsa-2026-v1"` continue to return `isValid: true` on `/api/verify/:code`.

---

## 4. Key Backup & Disaster Recovery

### Secure Backup:
```bash
# Encrypt keys directory with GPG before offsite archival
tar -czf - storage/keys | gpg --symmetric --cipher-algo AES256 -o proofsy-keys-backup-$(date +%Y%m%d).tar.gz.gpg
```

### Recovery:
```bash
# Decrypt archive into production keys directory
gpg -d proofsy-keys-backup-YYYYMMDD.tar.gz.gpg | tar -xzf - -C ./
```

---

## 5. Emergency Incident Response (Compromised Key)

If a private key is suspected of compromise:
1. **Immediate Rotation**: Generate and activate a new key version immediately.
2. **Audit Certificate Log**: Query `Certificate.find({ signingKeyId: "compromised-key-id" })` and cross-reference with `AuditLog`.
3. **Revocation**: If fraudulent certificates were generated, execute bulk revocation using `POST /api/certificates/bulk-revoke`.
4. **Update Key Status**: Mark key status as `"compromised"` in `SigningKeyRegistry`.
