import type { Metadata } from "next";
import VerificationPage from "@/components/VerificationPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const code = resolvedParams.code?.toUpperCase() || "";
  const slug = resolvedParams.slug || "credential";

  const ogImageUrl = `https://proofsy.tech/og?code=${encodeURIComponent(code)}&issuer=${encodeURIComponent(slug)}`;

  return {
    title: `Verify Certificate ${code} | Proofsy Credential Registry`,
    description: `Official cryptographic verification record for credential ${code}. Validate digital signatures, issuing authority, and tampering status.`,
    openGraph: {
      title: `Verified Credential ${code} | Proofsy`,
      description: `Official cryptographic verification proof for certificate ${code} issued by ${slug}.`,
      url: `https://proofsy.tech/verify/${slug}/${code}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Proofsy Verified Certificate ${code}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Verified Credential: ${code}`,
      description: `Cryptographically authenticated digital certificate issued on Proofsy.`,
      images: [ogImageUrl],
    },
  };
}

export default async function VerifySlugCodePage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const resolvedParams = await params;

  return <VerificationPage initialCode={resolvedParams.code?.toUpperCase() || ""} />;
}
