"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AdBanner from "@/components/AdBanner";
import { fadeUp, staggerContainer } from "@/lib/animations";

// Interactive demo certificate styles matching Proofsy's clean light institutional designs
const DEMO_TEMPLATES = [
  {
    id: "classic",
    name: "Classic Academic",
    program: "Master of Computer Science & Advanced Cryptography",
    issuer: "Stanford School of Engineering",
    date: "August 30, 2026",
    containerClass: "bg-white border-2 border-blue-900/20 text-gray-900 shadow-xl",
    borderPattern: "border-blue-900/30",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    sealBg: "bg-blue-900 text-amber-300",
    accent: "#1E3A8A",
  },
  {
    id: "executive",
    name: "Executive Platinum",
    program: "Executive Leadership in Artificial Intelligence & Digital Strategy",
    issuer: "Global Business Institute",
    date: "August 30, 2026",
    containerClass: "bg-gradient-to-b from-slate-50 to-white border-2 border-slate-300 text-slate-900 shadow-xl",
    borderPattern: "border-slate-400/40",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    sealBg: "bg-slate-800 text-amber-400",
    accent: "#334155",
  },
  {
    id: "modern",
    name: "Modern Tech Sapphire",
    program: "Full-Stack Cloud Architecture & Distributed Systems Certification",
    issuer: "Cloud Systems Academy",
    date: "August 30, 2026",
    containerClass: "bg-white border-2 border-blue-500/30 text-gray-900 shadow-xl",
    borderPattern: "border-blue-500/30",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    sealBg: "bg-blue-600 text-white",
    accent: "#2563EB",
  },
  {
    id: "honor",
    name: "Prestige Honor Gold",
    program: "International Innovation Hackathon - First Prize Laureate",
    issuer: "Global Technology Foundation",
    date: "August 30, 2026",
    containerClass: "bg-[#FDFAF5] border-2 border-amber-400/40 text-gray-900 shadow-xl",
    borderPattern: "border-amber-400/30",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    sealBg: "bg-amber-600 text-amber-100",
    accent: "#D97706",
  },
];

const FAQS = [
  {
    q: "How does Proofsy cryptographic certificate verification work?",
    a: "Every certificate issued on Proofsy is cryptographically signed using an institutional RSA private key. The payload (recipient name, event title, issuance date) is canonicalized and hashed via SHA-256. Anyone can verify mathematical authenticity online or offline without trusting third-party databases.",
  },
  {
    q: "Can certificates be verified completely offline without internet?",
    a: "Yes. Proofsy embeds the asymmetric RSA digital signature directly inside the PDF document properties. Using our WebCrypto offline verifier, employers and recruiters can drag-and-drop the PDF file into their browser to verify the mathematical signature against the public key without making any server requests.",
  },
  {
    q: "How do I issue thousands of certificates in bulk?",
    a: "Upload a standard CSV file with recipient names and email addresses. Proofsy's distributed queue worker generates high-resolution PDFs, signs each credential individually, and dispatches personalized emails with attached certificates automatically in seconds.",
  },
  {
    q: "How does monetization and ad-supported verification work?",
    a: "Proofsy is 100% free for all educators, institutions, and hackathons. Verification pages include non-intrusive career opportunities and sponsor placements to offset hosting and cryptographic infrastructure costs.",
  },
];

export default function PublicLandingPage() {
  const [demoName, setDemoName] = useState("Alex Rivera");
  const [selectedTemplate, setSelectedTemplate] = useState(DEMO_TEMPLATES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      {/* Decorative ambient background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/90 border-b border-gray-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-gray-900 flex items-center gap-1.5">
                Proofsy
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                  RSA-SHA256
                </span>
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:block">Cryptographic Digital Credentials</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#demo" className="hover:text-blue-600 transition">Live Demo</a>
            <Link href="/verify" className="hover:text-blue-600 transition flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Verifier
            </Link>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
            <Link href="/compliance" className="hover:text-blue-600 transition">Compliance</Link>
            <Link href="/integrations" className="hover:text-blue-600 transition">Integrations</Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition active:scale-95"
            >
              Get Started Free &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Trust Banner Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-200/80 shadow-xs text-xs font-medium text-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Next-Generation Verifiable Credential Platform</span>
            <span className="text-gray-300">|</span>
            <span className="text-blue-600 font-semibold">Zero Fraud Guarantee</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-950 leading-tight"
          >
            Issue Tamper-Proof Credentials With{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
              Mathematical Certainty
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Automate bulk certificate generation, embed unforgeable RSA-2048 asymmetric cryptographic signatures, and provide instant sub-second QR verification for universities, academies, and global enterprises.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Start Issuing Free (50 Certs)
            </Link>
            <Link
              href="/verify"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs hover:border-gray-400 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              Verify A Credential Online
            </Link>
          </motion.div>

          {/* Security Features Pill Grid */}
          <motion.div
            variants={fadeUp}
            className="pt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs font-medium text-gray-600"
          >
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              🔒 RSA-SHA256 Asymmetric Signing
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              ⚡ 0.1s Instant QR Scanner
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              🛡️ Zero-Trust Offline PDF Verifier
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-2xs">
              📦 Bulk CSV Dispatch Automation
            </span>
          </motion.div>
        </motion.div>

        {/* Interactive Live Demo Certificate Section */}
        <div id="demo" className="mt-16 max-w-5xl mx-auto bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600 tracking-wider">Live Interactive Sandbox</span>
              <h3 className="text-lg font-bold text-gray-900">Experience Real-Time Certificate Generation</h3>
            </div>

            {/* Live Name Input */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-xs text-gray-600 font-semibold whitespace-nowrap">Recipient Name:</label>
              <input
                type="text"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="Enter Recipient Name"
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:bg-white transition w-full sm:w-52 font-medium"
              />
            </div>
          </div>

          {/* Template Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-6">
            {DEMO_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className={`text-left p-3 rounded-xl border text-xs font-semibold transition ${
                  selectedTemplate.id === tmpl.id
                    ? "bg-blue-50 border-blue-600 text-blue-900 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
                }`}
              >
                <div className="text-[10px] text-gray-400 mb-0.5">Template Style</div>
                <div className="truncate">{tmpl.name}</div>
              </button>
            ))}
          </div>

          {/* Live Rendered Interactive Certificate Card */}
          <motion.div
            key={selectedTemplate.id + demoName}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`relative rounded-xl border-4 p-6 sm:p-12 overflow-hidden ${selectedTemplate.containerClass}`}
          >
            {/* Header Crest */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${selectedTemplate.sealBg}`}>
                  🏛️
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-gray-800">{selectedTemplate.issuer}</p>
                  <p className="text-[9px] font-mono text-gray-500">Official Accredited Registry</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${selectedTemplate.badgeColor}`}>
                DIGITALLY SIGNED ✓
              </span>
            </div>

            {/* Title & Recipient */}
            <div className="text-center my-8 space-y-2">
              <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Certificate of Completion</p>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight font-serif py-1">
                {demoName || "Recipient Name"}
              </h2>
              <p className="text-xs max-w-lg mx-auto text-gray-600 leading-relaxed pt-1">
                has successfully fulfilled all institutional criteria and demonstrated certified competency in:
              </p>
              <p className="text-sm sm:text-base font-bold text-gray-900 pt-1">
                {selectedTemplate.program}
              </p>
            </div>

            {/* Footer Signatures and QR Code */}
            <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left text-xs">
                <p className="text-[9px] font-mono text-gray-400 uppercase">Issuance Date</p>
                <p className="font-semibold text-gray-800">{selectedTemplate.date}</p>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="flex items-center gap-3 bg-white border border-gray-200 p-2 rounded-xl shadow-xs">
                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center border border-gray-100 shadow-2xs">
                  {/* High contrast QR code SVG */}
                  <svg className="w-full h-full text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-3-5h2v2h-2v-2zm0 4h2v4h-2v-4zm5 2h2v2h-2v-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-mono font-bold text-gray-900">SCAN TO VERIFY</p>
                  <p className="text-[8px] font-mono text-blue-600 font-semibold">proofsy.tech/verify</p>
                </div>
              </div>

              <div className="text-right text-xs">
                <p className="text-[9px] font-mono text-gray-400 uppercase">Cryptographic ID</p>
                <p className="font-mono text-[10px] text-emerald-600 font-bold">CERT-RSA-9941X7</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Counter Section */}
      <section className="py-12 border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">320,000+</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Credentials Issued</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-600">&lt; 0.1s</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Instant QR Scan Latency</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">100%</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Forgery Prevention Rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600">99.99%</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Infrastructure Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold text-blue-600 tracking-wider">Enterprise Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950">Everything You Need for Digital Trust</h2>
          <p className="text-gray-600 text-sm">
            Replace static image templates and insecure PDFs with verifiable, cryptographically sealed academic and professional credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              🔐
            </div>
            <h3 className="text-base font-bold text-gray-900">Asymmetric RSA-2048 Signing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every document is signed using the institution's private RSA key. Any tampering with names, dates, or grades invalidates the mathematical proof instantly.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
              ⚡
            </div>
            <h3 className="text-base font-bold text-gray-900">Sub-Second QR Scanning</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Standard ISO/IEC 18004 high-contrast QR codes in white quiet-zone card containers scan effortlessly on any smartphone camera in under 0.1 seconds.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
              🛡️
            </div>
            <h3 className="text-base font-bold text-gray-900">Zero-Trust Offline Verifier</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Drag-and-drop any certificate PDF into our browser verifier. Uses native WebCrypto to decrypt claims and prove authenticity completely offline.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
              📊
            </div>
            <h3 className="text-base font-bold text-gray-900">Bulk CSV & SMTP Automation</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Upload spreadsheets of 10,000+ graduates. Our distributed Bull Redis queues render PDFs and dispatch personalized emails with attached certificates automatically.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
              🎨
            </div>
            <h3 className="text-base font-bold text-gray-900">Custom Institutional Branding</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Full white-labeling with custom subdomains, logos, brand theme colors, vector SVG exports, and customized verification portal pages.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">
              🔗
            </div>
            <h3 className="text-base font-bold text-gray-900">LMS & Webhook Integrations</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Native webhook triggers for Canvas, Moodle, Coursera, Blackboard, and custom REST APIs for automated completion workflows.
            </p>
          </div>
        </div>
      </section>

      {/* 100% Free Community Plan Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-gray-200">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 tracking-wider">Free & Open Platform</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950">100% Free For Everyone</h2>
          <p className="text-gray-600 text-sm">
            Proofsy is free for universities, hackathons, academies, and communities. All enterprise cryptographic security features are included at zero cost.
          </p>
        </div>

        <div className="bg-white border-2 border-blue-600/30 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-6 py-1.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-bl-2xl shadow-xs">
            Free Community Edition
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                Complete Access Included
              </span>
              <h3 className="text-3xl font-black text-gray-950">Free Forever</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-blue-600">$0</span>
                <span className="text-sm text-gray-500 font-medium">/ no credit card required</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Everything you need to design, cryptographically sign, and distribute verifiable credentials without any paywalls or hidden fees.
              </p>
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition active:scale-95 text-center"
                >
                  Create Free Account & Start Issuing &rarr;
                </Link>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/80 p-6 rounded-2xl border border-gray-200/80">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">What&apos;s Included Free:</p>
              <ul className="space-y-2.5 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>RSA-2048 Cryptographic Signing</strong> with private institutional keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Sub-Second QR Code Verification</strong> (ISO/IEC 18004)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Zero-Trust Offline Browser Verifier</strong> (WebCrypto)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>1-Click &quot;Add to LinkedIn&quot;</strong> Certification Badges</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Bulk CSV Batch Upload</strong> & automated email delivery</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>High-Res PDF, Vector SVG & PNG</strong> Certificate Downloads</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sponsor Placement Monetization Banner */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-semibold">
              Monetization & Sponsored Career Opportunities
            </span>
          </div>
          <AdBanner type="inline" />
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-gray-200">
        <div className="text-center mb-12 space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold text-blue-600 tracking-wider">Help & Documentation</span>
          <h2 className="text-3xl font-extrabold text-gray-950">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-sm text-gray-900 hover:text-blue-600 transition"
              >
                <span>{faq.q}</span>
                <span className="text-lg font-bold text-gray-400">
                  {openFaq === idx ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-14 text-center text-white space-y-6 shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to Upgrade Your Credential Security?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking educators, hackathons, and global institutions issuing unforgeable cryptographic digital certificates today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-blue-900 bg-white hover:bg-slate-50 shadow-lg transition active:scale-95"
            >
              Get Started for Free &rarr;
            </Link>
            <Link
              href="/verify"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-700/60 hover:bg-blue-700/80 border border-white/20 transition"
            >
              Try Live Verifier
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-gray-500">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                P
              </div>
              <span className="font-bold text-sm text-gray-900">Proofsy</span>
            </div>
            <p className="text-[11px] text-gray-500 max-w-sm leading-relaxed">
              The gold standard in verifiable credential infrastructure, asymmetric RSA-2048 signing, and tamper-proof digital certificates.
            </p>
          </div>

          <div>
            <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-[10px]">Product</p>
            <ul className="space-y-2">
              <li><Link href="/verify" className="hover:text-blue-600 transition">Live Verifier</Link></li>
              <li><Link href="/designer" className="hover:text-blue-600 transition">Certificate Studio</Link></li>
              <li><Link href="/templates" className="hover:text-blue-600 transition">Templates</Link></li>
              <li><Link href="/ask" className="hover:text-blue-600 transition">AI Operator</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-[10px]">Trust & Compliance</p>
            <ul className="space-y-2">
              <li><Link href="/compliance" className="hover:text-blue-600 transition">Audit Logs</Link></li>
              <li><Link href="/integrations" className="hover:text-blue-600 transition">Integrations</Link></li>
              <li><Link href="/llms.txt" className="hover:text-blue-600 transition">LLMs Reference</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-blue-600 transition">Sitemap</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-[10px]">Account</p>
            <ul className="space-y-2">
              <li><Link href="/login" className="hover:text-blue-600 transition">Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-blue-600 transition">Register</Link></li>
              <li><Link href="/recipient/login" className="hover:text-blue-600 transition">Student Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Proofsy Technologies Inc. All rights reserved.</p>
          <p className="font-mono text-[10px] text-gray-400">
            Protected by RSA-2048 Asymmetric Cryptographic Infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
