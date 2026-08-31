"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface SocialShareBarProps {
  certificateName: string;
  organizationName?: string;
  certificateCode: string;
  issueDate?: string | Date;
  verificationUrl?: string;
  className?: string;
}

export default function SocialShareBar({
  certificateName,
  organizationName = "Proofsy Technologies",
  certificateCode,
  issueDate,
  verificationUrl,
  className = "",
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);

  const dateObj = issueDate ? new Date(issueDate) : new Date();
  const issueYear = dateObj.getFullYear();
  const issueMonth = dateObj.getMonth() + 1;

  const currentUrl =
    verificationUrl ||
    (typeof window !== "undefined"
      ? window.location.href
      : `https://proofsy.tech/verify/${certificateCode}`);

  // Official LinkedIn "Add to Profile Certifications" URL
  const linkedInAddUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
    certificateName
  )}&organizationName=${encodeURIComponent(
    organizationName
  )}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(
    currentUrl
  )}&certId=${encodeURIComponent(certificateCode)}`;

  // LinkedIn Post Share URL
  const linkedInPostUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    currentUrl
  )}`;

  // Twitter/X Share URL
  const tweetText = `🎓 I just earned my cryptographically verified certificate in "${certificateName}" issued by ${organizationName}! Verify my credential on @ProofsyTech:`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}&url=${encodeURIComponent(currentUrl)}&hashtags=Proofsy,VerifiedCredential,Certification`;

  // WhatsApp Share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out my verified certificate: ${currentUrl}`
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className={`space-y-3 pt-2 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">
          Share & Add to Professional Profile
        </p>
        <span className="text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          VIRAL VERIFICATION ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 1-Click Add to LinkedIn Profile */}
        <motion.a
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          href={linkedInAddUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0077B5] hover:bg-[#005f93] text-white font-bold text-xs shadow-md shadow-blue-500/15 transition cursor-pointer text-center"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8.37h2.8v-4.67c0-.25.02-.5.1-.68a1.14 1.14 0 0 1 1-.77c.76 0 1 .58 1 1.42v4.7h2.8M6.5 8.37a1.37 1.37 0 1 0 0-2.75 1.37 1.37 0 0 0 0 2.75M8 18.5V10.13H5v8.37h3z" />
          </svg>
          <span>Add to LinkedIn Profile</span>
        </motion.a>

        {/* Copy Direct Verification Link */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
            copied
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-xs"
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9 9 9 0 0 0-9 9v7.5c0 .621.504 1.125 1.125 1.125h3.375" />
              </svg>
              <span>Copy Verification Link</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Social Network Share Badges */}
      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
        <span className="text-[10px] text-gray-500 font-medium">Broadcast:</span>
        <a
          href={linkedInPostUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0077b5]/10 hover:text-[#0077b5] text-gray-700 text-[11px] font-semibold transition border border-gray-200"
        >
          LinkedIn Feed
        </a>
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-black/10 hover:text-black text-gray-700 text-[11px] font-semibold transition border border-gray-200"
        >
          X (Twitter)
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100/60 hover:text-emerald-700 text-gray-700 text-[11px] font-semibold transition border border-gray-200"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
