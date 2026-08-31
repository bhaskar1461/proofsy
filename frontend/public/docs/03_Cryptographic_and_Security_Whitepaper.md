# 🛡️ Proofsy Cryptographic & Security Architecture Whitepaper
**Technical Document Version**: 2.4.0  
**Security Standard**: FIPS 186-4 / RFC 8017 (PKCS#1 v2.2)  
**Platform**: Proofsy Digital Credential Infrastructure ([https://proofsy.tech](https://proofsy.tech))

---

## 1. Abstract & Threat Model

In conventional digital credential management, digital certificates are typically distributed as unsecured PDF files or image artifacts. This architecture suffers from fundamental vulnerabilities:
1. **Bit-Level Tampering**: Unauthorized modification of student names, distinction grades, or issuance dates using graphic design software.
2. **Identity Spoofing**: Malicious actors forging institutional crests and signatures without verifiable provenance.
3. **Database Centralization Dependency**: Traditional verification systems rely on querying an active central database, failing if the server suffers downtime, network partitions, or corporate obsolescence.

**Proofsy resolves these issues by introducing asymmetric cryptographic attestation directly into the credential payload**, decoupling authenticity verification from active network infrastructure.

---

## 2. Cryptographic Specification

Proofsy employs industry-standard asymmetric public-key cryptography adhering to **NIST Special Publication 800-57** recommendations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROOFSY SIGNING PIPELINE                              │
│                                                                             │
│  [ Raw Credential Data ]                                                    │
│  (Recipient, Event, Code, Date)                                             │
│             │                                                               │
│             ▼                                                               │
│  [ Canonical JSON Normalization ] ──► [ SHA-256 Digest ]                   │
│                                               │                             │
│                                               ▼                             │
│  [ Institutional RSA-2048 Private Key ] ──► [ RSA-SHA256 PKCS#1 v1.5 Sign ] │
│                                               │                             │
│                                               ▼                             │
│                                      [ Base64 Signature ]                   │
│                                               │                             │
│                                               ▼                             │
│                           [ Embedded in PDF / QR Code / Webhook ]           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Canonical Payload Normalization
To prevent hash discrepancies caused by JSON key ordering, whitespace, or platform-dependent character encodings, Proofsy passes all issuance metadata through a deterministic canonical serializer:

$$\text{Payload} = \text{Serialize}_{\text{RFC 8785}}(\{\text{code}, \text{recipientName}, \text{recipientEmail}, \text{eventName}, \text{issuedAt}, \text{keyId}\})$$

### 2.2 Digital Signature Generation
The canonical payload string $M$ is hashed using SHA-256 to produce a 256-bit digest $H(M)$. The digest is then signed using the institution's 2048-bit RSA private key $K_{\text{priv}}$ under PKCS#1 v1.5 padding:

$$\sigma = \text{Sign}_{K_{\text{priv}}}(H(M)) = (H(M) \oplus \text{Padding})^{d} \pmod n$$

Where:
* $n$ is the 2048-bit RSA modulus.
* $d$ is the private exponent.
* $\sigma$ is encoded as a URL-safe Base64 string embedded directly within the certificate's metadata and QR verification matrix.

---

## 3. Zero-Trust Offline Verification Protocol

Because verification relies on public-key cryptography, a third-party verifier (employer, university, border authority) can mathematically confirm credential validity without requiring live API access to Proofsy servers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     OFFLINE ZERO-TRUST VERIFICATION                         │
│                                                                             │
│  1. Extract payload string M and signature σ from Certificate.              │
│  2. Compute local digest: H_local = SHA-256(Canonical(M))                   │
│  3. Decrypt signature using Institution Public Key K_pub:                   │
│     H_decrypted = Verify_RSA(σ, K_pub)                                      │
│  4. Assert: If H_local == H_decrypted ──► AUTHENTIC & UNTAMPERED            │
│             Else ──► INVALID / TAMPERED (Verification Rejected)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mathematical Guarantee:
If an attacker modifies a single byte in the recipient's name $M \to M'$, then:
$$H(M') \neq H(M)$$
Because the attacker does not possess the private key $K_{\text{priv}}$, they cannot compute $\sigma'$ such that $\text{Verify}_{K_{\text{pub}}}(\sigma', K_{\text{pub}}) = H(M')$. The verification fails with mathematical certainty.

---

## 4. Key Management & Rotation Lifecycle

Proofsy implements a secure key lifecycle management model aligned with **SOC-2 Type II** and **ISO/IEC 27001**:

```
[ Active Key K_1 ] ────(1-Click Rotation)────► [ New Active Key K_2 ]
       │                                              │
       ▼                                              ▼
(Signs new certs)                              (Signs new certs)
       │                                              │
       └──────────────► [ Archived Key Registry ] ◄───┘
                               │
                               ▼
     (Retains public keys for backwards-compatible validation)
```

1. **Generation**: RSA keypairs are generated with strong cryptographically secure entropy (`/dev/urandom` / crypto CSPRNG) with 2048-bit modulus size.
2. **Isolation**: Private keys are stored in encrypted system keyrings with restrictive file permissions (`0o600`).
3. **Zero-Downtime Rotation**: When an administrator initiates key rotation, the previous key is archived and transitioned to `retired` status. The system immediately uses the new key for subsequent issuances while maintaining the retired public key in the verification ring to ensure perpetual validity of older credentials.
4. **Key Fingerprinting**: Public keys are indexed by their SHA-256 fingerprint for unambiguous provenance matching.

---

## 5. Multi-Tenant Isolation & Cloud Security

* **Data Isolation**: Multi-tenant database layer utilizes tenant-scoped query filters (`workspaceId` indexing) to ensure complete data boundary isolation between institutions.
* **Transport Layer Security**: All communications enforce TLS 1.3 with automated HSTS headers and modern cryptographic cipher suites.
* **Immutable Audit Trail**: All administrative events, key rotations, template updates, and revocations are recorded in an append-only MongoDB audit collection with client IP and user-agent logging.
