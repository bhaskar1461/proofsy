const Certificate = require("../models/Certificate");
const Workspace = require("../models/Workspace");
const { getSigningProvider, toIsoUtc, verifyHmacPayload } = require("../services/signing");

const defaultBranding = {
  logo: "",
  primaryColor: "#2563EB",
  accentColor: "#16A34A",
  customDomain: "",
  brandingEnabled: false,
  verificationPageTitle: "",
  footerText: "",
};

function normalizeBranding(workspace) {
  const rawBranding = workspace?.branding;
  const plainBranding = rawBranding && typeof rawBranding.toObject === "function" ? rawBranding.toObject() : rawBranding;
  const branding = {
    ...defaultBranding,
    ...(plainBranding || {}),
  };

  return {
    workspaceId: workspace?._id || null,
    workspaceName: workspace?.name || "Proofsy",
    ...branding,
  };
}

function serializeCertificate(certificate, isSignatureValid = false) {
  const organizer = certificate.eventId?.organizerName || "Event Organizer";

  return {
    id: certificate.verificationCode,
    verificationCode: certificate.verificationCode,
    recipientName: certificate.userId?.name || "Unknown",
    // Privacy enforcement: Verify page shows only name, event, issuer, date. No emails or phone numbers.
    eventName: certificate.eventId?.name || "Unknown Event",
    eventDate: certificate.eventId?.date ? toIsoUtc(certificate.eventId.date) : null,
    organizerName: organizer,
    issuedBy: `Issued by ${organizer} via Proofsy`,
    issuedAt: toIsoUtc(certificate.createdAt) || new Date().toISOString(),
    expiresAt: certificate.expiresAt ? toIsoUtc(certificate.expiresAt) : null,
    revokedAt: certificate.revokedAt ? toIsoUtc(certificate.revokedAt) : null,
    revocationReason: certificate.revocationReason || "",
    suspendedAt: certificate.suspendedAt ? toIsoUtc(certificate.suspendedAt) : null,
    status: certificate.status === "revoked" ? "revoked" : (isSignatureValid ? "valid" : "invalid"),
    pdfUrl: certificate.pdfUrl,
    pngUrl: certificate.pngUrl || null,
    svgUrl: certificate.svgUrl || null,
    cryptographicSignature: certificate.cryptographicSignature || null,
    signingProvider: certificate.signingProvider || "hmac-sha256",
    signingKeyId: certificate.signingKeyId || null,
    signatureAlgorithm: certificate.signatureAlgorithm || "HMAC-SHA256",
    signedAt: certificate.signedAt ? toIsoUtc(certificate.signedAt) : (certificate.createdAt ? toIsoUtc(certificate.createdAt) : null),
    isCryptographicallyVerified: isSignatureValid,
  };
}

function invalidVerificationResponse(res, reason, certificate, branding) {
  return res.json({
    success: true,
    data: {
      isValid: false,
      reason,
      branding,
      certificate: serializeCertificate(certificate, false),
    },
  });
}

// GET /api/verify/:code
// GET /api/verify/:workspaceSlug/:code
exports.verifyCertificate = async (req, res) => {
  try {
    const { code, workspaceSlug } = req.params;

    const certificate = await Certificate.findOne({
      verificationCode: code.toUpperCase(),
    })
      .populate("userId")
      .populate("eventId");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: "Invalid verification code or certificate not found.",
      });
    }

    const workspace = await Workspace.findById(certificate.workspaceId).select("name branding slug").lean();
    const branding = normalizeBranding(workspace);

    // Tenant Scoping Guard: reject if accessing via another tenant's branded slug
    if (workspaceSlug && workspace?.slug && workspace.slug.toLowerCase() !== workspaceSlug.toLowerCase()) {
      return res.status(404).json({
        success: false,
        error: "Certificate not found under this workspace portal.",
      });
    }

    const now = new Date();
    if (certificate.status === "revoked") {
      return invalidVerificationResponse(
        res,
        certificate.revocationReason || "Certificate has been revoked",
        certificate,
        branding
      );
    }
    if (certificate.status === "suspended") {
      return invalidVerificationResponse(res, "Certificate is currently suspended", certificate, branding);
    }
    if (certificate.status === "expired" || (certificate.expiresAt && certificate.expiresAt < now)) {
      if (certificate.status === "generated") {
        certificate.status = "expired";
        await certificate.save();
      }
      return invalidVerificationResponse(res, "Certificate has expired", certificate, branding);
    }

    // On-demand PNG & SVG retrofit for legacy certificates
    if (certificate.status === "generated" && (!certificate.pngUrl || !certificate.svgUrl)) {
      try {
        const Template = require("../models/Template");
        const { generatePremiumPNG, generatePremiumSVG } = require("../workers/certificateWorker");

        const event = certificate.eventId;
        let template;
        if (typeof event.templateId === "string" && !event.templateId.match(/^[0-9a-fA-F]{24}$/)) {
          template = await Template.findOne({ name: { $regex: new RegExp(event.templateId, "i") }, isStarter: true });
          if (!template) {
            template = await Template.findOne();
          }
        } else {
          template = await Template.findById(event.templateId);
        }

        if (template) {
          let themeColor = "#2563eb";
          if (template.textLayers && template.textLayers.length > 0) {
            const accentLayer = template.textLayers.find(l => l.variable === "recipient_name") || template.textLayers[0];
            if (accentLayer && accentLayer.color) {
              themeColor = accentLayer.color;
            }
          }

          if (!certificate.pngUrl) {
            certificate.pngUrl = await generatePremiumPNG(template, certificate.userId, event, certificate, themeColor);
          }
          if (!certificate.svgUrl) {
            certificate.svgUrl = await generatePremiumSVG(template, certificate.userId, event, certificate, themeColor);
          }
          await certificate.save();
        }
      } catch (genErr) {
        console.error("[API] Failed to dynamically generate missing PNG/SVG for legacy certificate:", genErr);
      }
    }

    // Cryptographic signature verification: HMAC-SHA256 (constant-time) with legacy RSA fallback
    let isSignatureValid = false;
    let signatureError = null;

    if (certificate.cryptographicSignature) {
      const isHmac = certificate.signatureAlgorithm === "HMAC-SHA256" || 
                     certificate.signingProvider === "hmac-sha256" ||
                     /^[a-f0-9]{64}$/i.test(certificate.cryptographicSignature);

      if (isHmac) {
        const hmacPayload = {
          id: certificate.verificationCode,
          name: certificate.userId?.name || "",
          event: certificate.eventId?.name || "",
          issuer: certificate.eventId?.organizerName || "",
          date: certificate.eventId?.date,
        };
        isSignatureValid = verifyHmacPayload(hmacPayload, certificate.cryptographicSignature);
        if (!isSignatureValid) {
          signatureError = "Cryptographic signature verification failed (tampered payload or invalid signature)";
        }
      } else {
        // Fallback to RSA verification for legacy certs
        try {
          const claims = {
            verificationCode: certificate.verificationCode,
            recipientName: certificate.userId?.name || "Unknown",
            recipientEmail: certificate.userId?.email || "",
            eventName: certificate.eventId?.name || "Unknown Event",
            eventDate: certificate.eventId?.date,
            organizationId: certificate.organizationId || certificate.eventId?.organizationId,
            issuedAt: certificate.createdAt,
            expiresAt: certificate.expiresAt || null,
          };
          const signingProvider = getSigningProvider(certificate.signingProvider || "institution");
          const verifyResult = await signingProvider.verify(claims, certificate.cryptographicSignature, {
            keyId: certificate.signingKeyId,
            legacy: !certificate.signingKeyId,
          });
          isSignatureValid = verifyResult.isValid;
          if (!isSignatureValid) signatureError = verifyResult.error;
        } catch (rsaErr) {
          isSignatureValid = false;
          signatureError = rsaErr.message;
        }
      }
    }

    // Cryptographic validation gate: If signature does not verify, mark entire response invalid
    if (!isSignatureValid) {
      return invalidVerificationResponse(
        res,
        signatureError || "Cryptographic signature verification failed (data altered or invalid signature)",
        certificate,
        branding
      );
    }

    // Record Verification Audit Event asynchronously
    (async () => {
      try {
        const VerificationAudit = require("../models/VerificationAudit");
        
        const referer = req.headers.referer || req.headers.referrer || "";
        const queryRef = req.query.ref || "";
        let referralSource = "direct";
        
        if (queryRef === "linkedin" || referer.includes("linkedin.com")) {
          referralSource = "linkedin";
        } else if (queryRef === "twitter" || queryRef === "x" || referer.includes("twitter.com") || referer.includes("x.com") || referer.includes("t.co")) {
          referralSource = "twitter";
        } else if (queryRef === "qr") {
          referralSource = "qr";
        } else if (queryRef === "offline") {
          referralSource = "offline";
        }
        
        const ua = req.headers["user-agent"] || "";
        let deviceType = "desktop";
        let browser = "Other";
        let os = "Other";
        
        if (/mobi|android|iphone|ipad|ipod/i.test(ua)) {
          deviceType = /ipad/i.test(ua) ? "tablet" : "mobile";
        }
        
        if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr/i.test(ua)) {
          browser = "Chrome";
        } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
          browser = "Safari";
        } else if (/firefox|fxios/i.test(ua)) {
          browser = "Firefox";
        } else if (/edge|edg/i.test(ua)) {
          browser = "Edge";
        } else if (/opr/i.test(ua)) {
          browser = "Opera";
        }
        
        if (/windows/i.test(ua)) {
          os = "Windows";
        } else if (/macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua)) {
          os = "macOS";
        } else if (/iphone|ipad|ipod/i.test(ua)) {
          os = "iOS";
        } else if (/android/i.test(ua)) {
          os = "Android";
        } else if (/linux/i.test(ua)) {
          os = "Linux";
        }
        
        await VerificationAudit.create({
          certificateId: certificate._id,
          workspaceId: certificate.workspaceId,
          eventId: certificate.eventId?._id || certificate.eventId,
          referralSource,
          deviceType,
          browser,
          os,
          country: "Unknown",
        });
      } catch (auditErr) {
        console.error("[API] Failed to record verification audit:", auditErr);
      }
    })();

    return res.json({
      success: true,
      data: {
        isValid: true,
        branding,
        certificate: serializeCertificate(certificate, isSignatureValid),
      },
    });
  } catch (err) {
    console.error("verifyCertificate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/verify/public-key?keyId=
exports.getPublicKey = async (req, res) => {
  try {
    const { keyId } = req.query;
    const provider = getSigningProvider("institution");
    const resolvedKeyId = keyId || provider.getActiveKeyId();
    const publicKey = provider.getPublicKey(resolvedKeyId);
    const metadata = provider.getKeyMetadata(resolvedKeyId);

    return res.json({
      success: true,
      data: {
        keyId: resolvedKeyId,
        algorithm: metadata?.algorithm || "RSA-SHA256",
        fingerprint: metadata?.fingerprint || "",
        status: metadata?.status || "active",
        publicKey,
      },
    });
  } catch (err) {
    console.error("getPublicKey error:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
};

// GET /api/verify/public-keys
exports.listPublicKeys = async (req, res) => {
  try {
    const provider = getSigningProvider("institution");
    const keys = provider.listPublicKeys();
    return res.json({
      success: true,
      data: keys,
    });
  } catch (err) {
    console.error("listPublicKeys error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
