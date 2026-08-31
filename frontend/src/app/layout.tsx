import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://proofsy.tech"),
  title: {
    default: "Proofsy | Cryptographic Digital Credentials & Verifiable Certificates",
    template: "%s | Proofsy",
  },
  description:
    "Enterprise platform for issuing, cryptographically signing, and instantly verifying tamper-proof digital certificates, degrees, and professional credentials. Powered by RSA-SHA256 asymmetric cryptography and instant QR code verification.",
  keywords: [
    "digital credentials",
    "cryptographic certificates",
    "verifiable certificates",
    "RSA certificate signing",
    "digital diploma verification",
    "bulk certificate generator",
    "tamper-proof certificates",
    "credential management system",
    "university accreditation software",
    "LMS certificate automation",
    "blockchain alternative credentials",
    "Proofsy",
  ],
  authors: [{ name: "Proofsy Technologies", url: "https://proofsy.tech" }],
  creator: "Proofsy Technologies",
  publisher: "Proofsy Technologies",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://proofsy.tech",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://proofsy.tech",
    siteName: "Proofsy",
    title: "Proofsy - Cryptographic Digital Credentials & Verifiable Certificates",
    description:
      "Eliminate credential fraud with mathematical certainty. Issue thousands of tamper-proof certificates in seconds with RSA-SHA256 signatures and instant QR scanning.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Proofsy - Cryptographic Credential Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proofsy - Cryptographic Digital Credentials & Certificates",
    description:
      "Enterprise digital credential infrastructure with mathematical verification and instant QR proof.",
    images: ["/logo.png"],
    creator: "@ProofsyTech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
  },
};

// JSON-LD Structured Data Schemas for Google Rich Results & AI Knowledge Extraction
const jsonLdSchemas = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://proofsy.tech/#organization",
      "name": "Proofsy",
      "url": "https://proofsy.tech",
      "logo": {
        "@type": "ImageObject",
        "url": "https://proofsy.tech/logo.png",
        "caption": "Proofsy Logo",
      },
      "description":
        "Proofsy provides enterprise-grade cryptographic credential issuance and instant verification infrastructure for academic institutions, certification bodies, and companies.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@proofsy.tech",
        "url": "https://proofsy.tech",
      },
      "sameAs": [
        "https://twitter.com/ProofsyTech",
        "https://linkedin.com/company/proofsy",
        "https://github.com/proofsy",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://proofsy.tech/#software",
      "name": "Proofsy Credential Platform",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, Cloud, Cross-platform",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
      "description":
        "Automated digital certificate generation system with RSA-SHA256 asymmetric cryptographic signatures, bulk CSV issuance, and instant offline/online verification.",
      "featureList": [
        "RSA-2048 & RSA-SHA256 Institutional Cryptographic Signing",
        "High-Speed QR Code Instant Verification",
        "Zero-Trust Offline PDF Verification via WebCrypto",
        "Bulk CSV Recipient Batch Generation",
        "Automated SMTP Multi-Channel Delivery",
        "Custom Institutional Branding & White-Label Domains",
        "SOC2-Ready Compliance & Key Rotation Audit Logs",
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "128",
        "bestRating": "5",
        "worstRating": "1",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://proofsy.tech/#website",
      "url": "https://proofsy.tech",
      "name": "Proofsy",
      "description": "Verifiable Digital Credentials & Cryptographic Certificates",
      "publisher": {
        "@id": "https://proofsy.tech/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://proofsy.tech/verify?code={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://proofsy.tech/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Proofsy cryptographic certificate verification work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every certificate generated on Proofsy is cryptographically signed using the issuing institution's private RSA key. The resulting RSA-SHA256 signature is mathematically bound to the recipient's name, credential title, and issuance date. Anyone can verify authenticity online or offline by validating the signature against the institution's public key.",
          },
        },
        {
          "@type": "Question",
          "name": "Can Proofsy certificates be verified offline without internet access?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Proofsy embeds the cryptographic claims and digital signature directly inside the PDF document metadata. Users can drag and drop any certificate PDF onto the Proofsy Verifier, which uses the browser's native WebCrypto API to verify the mathematical signature completely offline without contacting a server.",
          },
        },
        {
          "@type": "Question",
          "name": "How do I issue thousands of certificates in bulk with Proofsy?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Organizations can upload a standard CSV file containing recipient names and email addresses. Proofsy's distributed queue worker generates high-resolution PDFs, signs each credential with unique RSA keys, and dispatches personalized emails with attached certificates automatically in seconds.",
          },
        },
        {
          "@type": "Question",
          "name": "How fast do Proofsy QR codes scan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Proofsy generates standard ISO/IEC 18004 high-contrast QR codes inside clean quiet-zone card containers. They scan instantly in under 0.1 seconds on any iPhone, Android (Google Lens), or hardware scanner from any camera angle.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-00S0NFQJ3Q"
        />
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-00S0NFQJ3Q', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* Google AdSense */}
        <meta name="google-adsense-account" content="ca-pub-9489106845571181" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9489106845571181"
          crossOrigin="anonymous"
        />
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchemas) }}
        />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900">
        <AuthProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
