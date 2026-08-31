"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AdBannerProps {
  type?: "leaderboard" | "card" | "inline";
  className?: string;
  adSlot?: string;
}

// Curated high-CPM sponsor items for education, cloud, and engineering
const SPONSOR_ADS = [
  {
    title: "AWS Cloud & DevOps Certification Grant",
    sponsor: "Cloud Skills Accelerator",
    description: "Get up to $500 in AWS cloud credits & free certification prep vouchers for verified graduates.",
    cta: "Claim Grant",
    badge: "Featured Partner",
    link: "https://aws.amazon.com/certification",
    color: "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600",
  },
  {
    title: "Hire Verified Full-Stack & AI Engineers",
    sponsor: "TopTalent Network",
    description: "Connect directly with candidates possessing verified Proofsy cryptographic certificates.",
    cta: "Hire Talent",
    badge: "Recruitment Sponsor",
    link: "/signup",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-600",
  },
  {
    title: "Zero-Knowledge & Cryptography Fellowship",
    sponsor: "Web3 Research Labs",
    description: "Apply for fully-funded fellowships in applied cryptography, zero-knowledge proofs, and secure systems.",
    cta: "Apply Now",
    badge: "Scholarship",
    link: "/signup",
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600",
  },
];

export default function AdBanner({
  type = "inline",
  className = "",
  adSlot,
}: AdBannerProps) {
  const [adIndex, setAdIndex] = useState(0);
  const [hasAdSense, setHasAdSense] = useState(false);

  useEffect(() => {
    // Check if Google AdSense client ID is defined
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    if (client && typeof window !== "undefined") {
      setHasAdSense(true);
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // ignore
      }
    } else {
      // Rotate sponsored promotions every 8 seconds
      const timer = setInterval(() => {
        setAdIndex((prev) => (prev + 1) % SPONSOR_ADS.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, []);

  const currentAd = SPONSOR_ADS[adIndex];

  if (hasAdSense && adSlot) {
    return (
      <div className={`my-4 overflow-hidden rounded-xl bg-gray-50 border border-gray-200 text-center p-2 ${className}`}>
        <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono mb-1">Sponsored Advertisement</div>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (type === "card") {
    return (
      <motion.div
        key={adIndex}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm relative overflow-hidden ${currentAd.color} ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-current">
            {currentAd.badge}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">Sponsored</span>
        </div>
        <h4 className="text-xs font-bold text-gray-900 mb-1">{currentAd.title}</h4>
        <p className="text-[11px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">{currentAd.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-gray-500">{currentAd.sponsor}</span>
          <a
            href={currentAd.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-white bg-gray-900 hover:bg-gray-800 px-3 py-1 rounded-lg transition shadow-xs"
          >
            {currentAd.cta} &rarr;
          </a>
        </div>
      </motion.div>
    );
  }

  // Inline Leaderboard / Banner
  return (
    <motion.div
      key={adIndex}
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border bg-gradient-to-r p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${currentAd.color} ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/90 items-center justify-center font-bold text-xs shadow-xs border border-current shrink-0">
          AD
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-current">
              {currentAd.badge}
            </span>
            <span className="text-[9px] font-semibold text-gray-800">{currentAd.sponsor}</span>
          </div>
          <p className="text-xs font-bold text-gray-900">{currentAd.title}</p>
          <p className="text-[11px] text-gray-600 line-clamp-1">{currentAd.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Link
          href="/pricing"
          className="text-[10px] text-gray-400 hover:text-gray-600 underline font-medium"
        >
          Ad-Free Pro
        </Link>
        <a
          href={currentAd.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg transition shadow-xs"
        >
          {currentAd.cta} &rarr;
        </a>
      </div>
    </motion.div>
  );
}
