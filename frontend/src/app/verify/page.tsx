import type { Metadata } from "next";
import VerificationPage from "@/components/VerificationPage";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.code?.toUpperCase() || "";

  const ogImageUrl = code
    ? `https://proofsy.tech/og?code=${encodeURIComponent(code)}`
    : "https://proofsy.tech/logo.png";

  return {
    title: code
      ? `Verify Certificate ${code} | Proofsy Credential Registry`
      : "Verify Digital Certificate | Proofsy Cryptographic Credential Registry",
    description: code
      ? `Official cryptographic verification record for credential ${code}. Validate digital signatures, issuing authority, and tampering status.`
      : "Verify official digital credentials, degrees, and certificates issued by accredited organizations. Check RSA cryptographic integrity and offline PDF proofs instantly.",
    openGraph: {
      title: code
        ? `Verified Credential ${code} | Proofsy`
        : "Verify Digital Certificate | Proofsy",
      description: code
        ? `Official cryptographic verification proof for certificate ${code}.`
        : "Instant cryptographic verification for digital credentials and certificates. Validate authenticity online or offline.",
      url: code
        ? `https://proofsy.tech/verify?code=${encodeURIComponent(code)}`
        : "https://proofsy.tech/verify",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Proofsy Certificate Verification`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: code ? `Verified Credential: ${code}` : "Verify Digital Certificate | Proofsy",
      description: "Cryptographically authenticated digital certificate issued on Proofsy.",
      images: [ogImageUrl],
    },
  };
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return <VerificationPage initialCode={resolvedSearchParams.code?.toUpperCase() || ""} />;
}
