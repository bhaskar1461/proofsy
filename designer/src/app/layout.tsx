import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proofsy Template Studio — Certificate Designer",
  description: "PDF-to-Editable Certificate Template Designer for the Proofsy Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800&family=Montserrat:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
