import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code") || "CERT-RSA-VERIFIED";
    const name = searchParams.get("name") || "Verified Recipient";
    const event = searchParams.get("event") || "Official Certificate of Achievement";
    const issuer = searchParams.get("issuer") || "Proofsy Institutional Registry";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0F172A",
            padding: "48px 56px",
            fontFamily: "sans-serif",
            backgroundImage:
              "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.08) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.04) 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        >
          {/* Inner Golden Border Container */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: "28px",
              border: "3px solid rgba(217, 119, 6, 0.5)",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              padding: "40px 48px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            {/* Top Header Row */}
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    backgroundColor: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: "24px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                  }}
                >
                  P
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      letterSpacing: "1px",
                    }}
                  >
                    PROOFSY REGISTRY
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#94A3B8",
                      fontFamily: "monospace",
                    }}
                  >
                    {issuer}
                  </span>
                </div>
              </div>

              {/* Verified Trust Seal Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(5, 150, 105, 0.15)",
                  border: "1.5px solid #059669",
                  borderRadius: "9999px",
                  padding: "8px 20px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "9999px",
                    backgroundColor: "#10B981",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#34D399",
                    letterSpacing: "1.5px",
                  }}
                >
                  CRYPTOGRAPHICALLY VERIFIED
                </span>
              </div>
            </div>

            {/* Central Credential Title & Recipient */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                margin: "24px 0",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#D97706",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  marginBottom: "12px",
                }}
              >
                Official Certificate of Achievement
              </span>

              <h1
                style={{
                  fontSize: "44px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  margin: "0 0 14px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                {name}
              </h1>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#60A5FA",
                  maxWidth: "850px",
                  lineHeight: "1.4",
                }}
              >
                {event}
              </div>
            </div>

            {/* Bottom Proof Bar */}
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(148, 163, 184, 0.2)",
                paddingTop: "20px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase" }}>
                  Verification Code
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#F8FAFC",
                    fontFamily: "monospace",
                  }}
                >
                  {code}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#94A3B8",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                >
                  <span>🔐 RSA-2048 Asymmetric Proof</span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#38BDF8",
                    backgroundColor: "rgba(56, 189, 248, 0.1)",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                >
                  proofsy.tech/verify
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
