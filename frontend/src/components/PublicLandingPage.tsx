"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  Maximize, 
  RotateCcw, 
  ArrowRight,
  Check,
  Award,
  Zap,
  Clock,
  ChevronRight,
  QrCode,
  Layers,
  Cpu,
  Database,
  Building2,
  GraduationCap,
  Users,
  Code2,
  FileCheck2,
  Globe2,
  ExternalLink,
  Copy,
  ChevronDown
} from "lucide-react";

export default function PublicLandingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoProgress, setVideoProgress] = useState(38);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [calcCerts, setCalcCerts] = useState(500);
  const [simulatedVerifying, setSimulatedVerifying] = useState(false);
  const [simulatedVerified, setSimulatedVerified] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Auto-cycle the RSA diagram steps in the hero player when playing
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 5);
        setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const rsaSteps = [
    { 
      title: "Plain Text", 
      desc: "Recipient Name, Event Title, and Issue Date are canonicalized into a strict JSON payload.", 
      icon: "📄",
      detail: "Canonical SHA-256 digest creation"
    },
    { 
      title: "RSA-2048 Signer", 
      desc: "Issuer's private cryptographic key generates an asymmetric mathematical signature.", 
      icon: "🛡️",
      detail: "Asymmetric 2048-bit PKI signing"
    },
    { 
      title: "Encrypted Hash", 
      desc: "Tamper-proof digital seal embedded directly into the certificate bytecode.", 
      icon: "1010",
      detail: "Unique cryptographic hash generated"
    },
    { 
      title: "Public Key", 
      desc: "The public key is published on the blockchain / registry for instant validation.", 
      icon: "🔑",
      detail: "Distributed public ledger verification"
    },
    { 
      title: "Verified Proof", 
      desc: "Anyone scanning the QR code gets mathematical proof of authenticity in < 150ms.", 
      icon: "✨",
      detail: "Zero-Trust instant verification"
    },
  ];

  const handleSimulateVerification = () => {
    setSimulatedVerifying(true);
    setSimulatedVerified(false);
    setTimeout(() => {
      setSimulatedVerifying(false);
      setSimulatedVerified(true);
    }, 1200);
  };

  const hoursSaved = Math.round((calcCerts * 4.5) / 60);
  const dollarsSaved = Math.round(calcCerts * 1.75);

  const faqs = [
    {
      q: "What makes Proofsy different from ordinary PDF certificate tools?",
      a: "Standard certificate generators create simple flat images or PDFs that anyone can edit in Photoshop within 30 seconds. Proofsy embeds mathematical RSA-2048 cryptographic signatures and dynamic ISO QR codes. If a single letter or grade is altered, the verification signature mathematically fails."
    },
    {
      q: "How fast can I issue certificates for a hackathon or college fest with 2,000+ attendees?",
      a: "Under 60 seconds! You simply drop your attendee CSV spreadsheet into Proofsy. Our high-throughput Bull Redis background workers concurrently generate 2,000+ cryptographically signed PDFs and dispatch customized email notifications automatically."
    },
    {
      q: "Can employers and third parties verify credentials without creating an account?",
      a: "Yes! Proofsy features an open, zero-friction verification portal. Anyone can scan the certificate's QR code or enter the 12-character verification code at proofsy.tech/verify to instantly view the cryptographic validity, issuer identity, and exact timestamp."
    },
    {
      q: "Can I customize templates with our university or corporate branding and custom fonts?",
      a: "Absolutely. Proofsy includes an intuitive visual studio where you can upload custom TrueType (.ttf) and OpenType (.otf) fonts, organization logos, dynamic signatures, gold/blue ribbons, and unlimited custom variables."
    },
    {
      q: "What are the pricing options for institutions and organizers?",
      a: "Proofsy operates on transparent flat-tier pricing designed for organizers and universities. Unlike legacy platforms that charge up to $2.50 per certificate, Proofsy eliminates per-certificate taxes so you can issue thousands of credentials with predictable costs."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white font-sans overflow-x-hidden relative">
      
      {/* Soft Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] bg-indigo-100/50 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 -left-32 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[130px]" />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7l-9 5-9-5" />
              </svg>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#4F46E5] font-display">
              Proofsy
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <Link href="/" className="text-indigo-600 font-bold hover:text-indigo-700 transition">Home</Link>
            <a href="#about-proofsy" className="hover:text-indigo-600 transition">What is Proofsy?</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a>
            <a href="#verifier-demo" className="hover:text-indigo-600 transition">Live Verifier</a>
            <Link href="/templates" className="hover:text-indigo-600 transition">Templates</Link>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
            <Link href="/contact" className="hover:text-indigo-600 transition">Contact & Queries</Link>
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-xs font-bold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-2.5 rounded-full shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Section 1: Hero Showcase with Reference Video Player & Dual Certificates ── */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1E3A8A] font-display"
        >
          Tamper-Proof Digital Certificates.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto mt-4 font-normal leading-relaxed"
        >
          Issue branded credentials in bulk with <strong className="text-indigo-600 font-bold">128-bit unguessable IDs</strong>, <strong className="text-indigo-600 font-bold">HMAC-SHA256 integrity signatures</strong>, and instant public QR verification.
        </motion.p>

        {/* Hero Quick Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 relative z-30"
        >
          <a
            href="#verifier-demo"
            className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Try a Sample Verification</span>
          </a>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Create Organizer Account</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </motion.div>

        {/* Hero 3D Stage Composition with Video Player & Dual Certificates */}
        <div className="relative mt-12 sm:mt-16 max-w-6xl mx-auto">
          
          {/* Main Visual Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            
            {/* Left Certificate (Gold Aesthetic) */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -2 }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-3 hidden lg:block relative group"
            >
              {/* Flowing Gold Silk Ribbon Accent on the left */}
              <div className="absolute -left-6 -top-8 w-28 h-40 pointer-events-none z-20 opacity-90">
                <svg viewBox="0 0 100 150" fill="none" className="w-full h-full drop-shadow-md">
                  <path
                    d="M30 0 C10 40, 60 70, 20 110 C-10 140, 40 150, 50 150 C30 130, 80 80, 50 40 C30 10, 50 0, 30 0 Z"
                    fill="url(#goldRibbonGrad)"
                  />
                  <defs>
                    <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="#FDE68A" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Gold Certificate Frame */}
              <div className="bg-[#FFFDF9] rounded-2xl border-4 border-[#F59E0B]/40 shadow-2xl p-6 text-left relative overflow-hidden ring-1 ring-amber-200">
                <div className="absolute inset-2 border border-amber-300/60 rounded-xl pointer-events-none" />
                
                <div className="text-center space-y-1 my-2">
                  <div className="text-amber-500 text-xs tracking-widest">★★★★★</div>
                  <h4 className="text-xs font-serif font-black tracking-widest text-slate-800 uppercase">Certificate</h4>
                  <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">Of Achievement</p>
                  <p className="text-[8px] text-slate-500 italic pt-1">This is to certify that</p>
                </div>

                <div className="text-center my-3">
                  <h3 className="text-2xl font-calligraphy text-[#B45309] py-1 font-bold">
                    Bhaskar Sharma
                  </h3>
                  <p className="text-[7.5px] text-slate-500 max-w-[180px] mx-auto leading-tight mt-1">
                    has successfully completed the course with excellence and distinction.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-3 border-t border-amber-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full rounded-full border border-amber-700/40 flex items-center justify-center text-[10px] text-amber-950 font-bold">
                        ★
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-calligraphy text-slate-700 italic">Jonathan Doe</div>
                    <div className="text-[7px] font-mono text-slate-400 border-t border-slate-300 pt-0.5">Director</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Center Video Player (RSA Encryption Tech Video) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 relative z-30"
            >
              <div className="bg-[#0F142A] rounded-3xl border border-indigo-500/30 p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden group">
                
                {/* Subtle Grid Backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(#6366F1_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                {/* Player Header */}
                <div className="text-center space-y-1 mb-8">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    RSA Encryption
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">
                    Tech Video on Working
                  </p>
                </div>

                {/* Interactive Diagram Animation */}
                <div className="flex items-center justify-between gap-2 py-4 my-2 px-2 overflow-x-auto relative">
                  
                  {/* Step 1 */}
                  <div className={`flex flex-col items-center gap-1.5 transition-all ${activeStep === 0 ? "scale-110 text-cyan-400" : "text-slate-400 opacity-70"}`}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-sm shadow-inner">
                      📄
                    </div>
                    <span className="text-[9px] font-mono font-semibold">Plain Text</span>
                  </div>

                  <span className="text-indigo-400 text-xs">→</span>

                  {/* Step 2 */}
                  <div className={`flex flex-col items-center gap-1.5 transition-all ${activeStep === 1 ? "scale-110 text-blue-400" : "text-slate-400 opacity-70"}`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-sm shadow-inner">
                      🛡️
                    </div>
                    <span className="text-[9px] font-mono font-semibold">RSA Engine</span>
                  </div>

                  <span className="text-indigo-400 text-xs">→</span>

                  {/* Step 3 */}
                  <div className={`flex flex-col items-center gap-1.5 transition-all ${activeStep === 2 ? "scale-110 text-purple-400" : "text-slate-400 opacity-70"}`}>
                    <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-[9px] font-mono text-purple-300 shadow-inner">
                      1010
                    </div>
                    <span className="text-[9px] font-mono font-semibold">Encrypted</span>
                  </div>

                  <span className="text-indigo-400 text-xs">→</span>

                  {/* Step 4 */}
                  <div className={`flex flex-col items-center gap-1.5 transition-all ${activeStep === 3 ? "scale-110 text-amber-400" : "text-slate-400 opacity-70"}`}>
                    <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-sm shadow-inner">
                      🔑
                    </div>
                    <span className="text-[9px] font-mono font-semibold">Private Key</span>
                  </div>

                  <span className="text-indigo-400 text-xs">→</span>

                  {/* Step 5 */}
                  <div className={`flex flex-col items-center gap-1.5 transition-all ${activeStep === 4 ? "scale-110 text-emerald-400" : "text-slate-400 opacity-70"}`}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-[9px] font-mono text-emerald-300 shadow-inner">
                      0101
                    </div>
                    <span className="text-[9px] font-mono font-semibold">Verified</span>
                  </div>
                </div>

                {/* Big Center Glowing Play Button */}
                <div className="text-center my-6">
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      setShowVideoModal(true);
                    }}
                    className="w-14 h-14 rounded-full bg-white hover:bg-slate-100 text-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-110 transition-transform mx-auto cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </button>
                  <p className="text-xs font-bold text-slate-200 mt-2">
                    Watch Video
                  </p>
                </div>

                {/* Player Progress Bar & Controls */}
                <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white">
                        {isPlaying ? "❚❚" : "▶"}
                      </button>
                      <span>1:45 / 4:30</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Volume2 className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                      <Settings className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                      <Maximize onClick={() => setShowVideoModal(true)} className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Certificate (Royal Blue Aesthetic) */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-3 hidden lg:block relative group"
            >
              {/* Flowing Royal Blue Silk Ribbon Accent on the right */}
              <div className="absolute -right-6 -top-8 w-28 h-40 pointer-events-none z-20 opacity-90">
                <svg viewBox="0 0 100 150" fill="none" className="w-full h-full drop-shadow-md">
                  <path
                    d="M70 0 C90 40, 40 70, 80 110 C110 140, 60 150, 50 150 C70 130, 20 80, 50 40 C70 10, 50 0, 70 0 Z"
                    fill="url(#blueRibbonGrad)"
                  />
                  <defs>
                    <linearGradient id="blueRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="50%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#1E40AF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Blue Certificate Frame */}
              <div className="bg-white rounded-2xl border-4 border-blue-600/40 shadow-2xl p-6 text-left relative overflow-hidden ring-1 ring-blue-200">
                <div className="absolute inset-2 border border-blue-300/60 rounded-xl pointer-events-none" />
                
                <div className="text-center space-y-1 my-2">
                  <div className="text-blue-600 text-xs tracking-widest">★★★★★</div>
                  <h4 className="text-xs font-serif font-black tracking-widest text-slate-800 uppercase">Certificate</h4>
                  <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">Of Achievement</p>
                  <p className="text-[8px] text-slate-500 italic pt-1">This is to certify that</p>
                </div>

                <div className="text-center my-3">
                  <h3 className="text-2xl font-calligraphy text-[#1D4ED8] py-1 font-bold">
                    Bhaskar Sharma
                  </h3>
                  <p className="text-[7.5px] text-slate-500 max-w-[180px] mx-auto leading-tight mt-1">
                    has successfully completed the course with excellence and distinction.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-3 border-t border-blue-100">
                  <div className="text-left">
                    <div className="text-[9px] font-calligraphy text-slate-700 italic">Jonathan Doe</div>
                    <div className="text-[7px] font-mono text-slate-400 border-t border-slate-300 pt-0.5">Director</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full rounded-full border border-blue-800/40 flex items-center justify-center text-[10px] text-white font-bold">
                        ★
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Glowing Radiant Stage Floor */}
          <div className="relative -mt-16 sm:-mt-20 pt-20 pb-8 z-0">
            <div className="w-[90%] sm:w-[75%] h-32 bg-gradient-to-r from-blue-200/50 via-indigo-200/80 to-purple-200/50 rounded-[100%] mx-auto blur-2xl -mb-16 pointer-events-none" />

            <div className="text-center relative z-10 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#4F46E5] font-display">
                Proofsy
              </h2>

              {/* Three Pill Badges */}
              <div className="inline-flex items-center gap-4 text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full border border-slate-200 shadow-xs">
                <span className="flex items-center gap-1 text-pink-600">
                  <span className="w-3.5 h-3.5 rounded-full border border-pink-500 flex items-center justify-center text-[8px]">✓</span>
                  <span>easy</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-blue-600">
                  <span className="w-3.5 h-3.5 rounded-full border border-blue-500 flex items-center justify-center text-[8px]">✓</span>
                  <span>simple</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-purple-600">
                  <span>🧠</span>
                  <span>AI</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Feature Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mt-12">
          
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs text-left space-y-3 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">RSA Encryption</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Military-grade security for your important documents.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs text-left space-y-3 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Two Certificates</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dual verification with beautiful, verifiable certificates.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs text-left space-y-3 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Proofs</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Instant proof generation and validation.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs text-left space-y-3 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">AI Powered</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Smart verification and insights powered by AI.
              </p>
            </div>
          </motion.div>

        </div>

      </section>

      {/* ── Section 2: Comprehensive Explanation of Proofsy (The Problem & Solution) ── */}
      <section id="about-proofsy" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Explanation Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold uppercase tracking-wider">
              🛡️ The Proofsy Difference
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Why Traditional Certificates Fail & How Proofsy Solves It
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every day, thousands of fake certificates are forged using online PDF editors. Traditional event platforms offer zero cryptographic verification, exposing institutions, organizers, and recruiters to fraud.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold shrink-0 text-sm">
                  ✕
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">The Old Way (Flat PDFs & JPGs)</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Easily manipulated in Canva or Photoshop. No audit trail, no cryptographic signature, and no instant verification for recruiters.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold shrink-0 text-sm">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">The Proofsy Way (RSA-2048 Cryptographic Proofs)</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Every certificate is signed with asymmetric 2048-bit keys. Any single altered byte invalidates the mathematical signature immediately upon scanning.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/events/new"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95 flex items-center gap-2"
              >
                <span>Create Your Event Now</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/docs"
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition"
              >
                Read Cryptographic Spec
              </Link>
            </div>
          </div>

          {/* Right Interactive Visual Graphic */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-slate-800 uppercase">
                  Proofsy Cryptographic Verification Pipeline
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                RSA-2048 PKI
              </span>
            </div>

            {/* Visual Architecture Layers */}
            <div className="space-y-3">
              {[
                { layer: "01. Data Ingestion", desc: "Batch CSV attendees validated & normalized", icon: "📁", badge: "BullMQ Engine" },
                { layer: "02. Vector Layout Rendering", desc: "Dynamic {{variables}} mapped to SVG vector canvas", icon: "🎨", badge: "Vector Canvas" },
                { layer: "03. Asymmetric RSA Signing", desc: "SHA-256 hash signed with 2048-bit private key", icon: "🔒", badge: "PKI Signer" },
                { layer: "04. ISO QR Code Embedding", desc: "Encoded deep-link with anti-tamper hash code", icon: "📱", badge: "Sub-Second QR" },
                { layer: "05. Audit Trail & Verification", desc: "Permanent timestamp logged to compliance ledger", icon: "📜", badge: "Zero-Knowledge" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.layer}</h4>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 3: Interactive Live QR Verifier Simulator ── */}
      <section id="verifier-demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl text-center relative overflow-hidden">
          
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold uppercase tracking-wider">
              🔍 Interactive Demonstration
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Test Instant Cryptographic Verification Live
            </h2>
            
            <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Experience the exact verification process that employers, institutions, and attendees see when scanning a Proofsy credential.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleSimulateVerification}
                disabled={simulatedVerifying}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs text-indigo-950 bg-white hover:bg-indigo-50 shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {simulatedVerifying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
                    <span>Querying PKI Ledger...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Simulate QR Scan (Certificate #PRF-8829)</span>
                  </>
                )}
              </button>

              <Link
                href="/verify"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs text-white bg-indigo-800/60 hover:bg-indigo-800 border border-indigo-500/30 transition text-center"
              >
                Open Real Verifier Tool &rarr;
              </Link>
            </div>

            {/* Verification Result Card */}
            {simulatedVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 rounded-2xl bg-white text-slate-900 text-left border border-emerald-300 shadow-xl space-y-4 max-w-lg mx-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase">
                      100% Mathematically Verified
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Time: 42ms</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recipient Name:</span>
                    <span className="font-bold text-slate-900">Bhaskar Sharma</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Course / Event:</span>
                    <span className="font-bold text-slate-900">National AI Hackathon 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issuing Authority:</span>
                    <span className="font-bold text-indigo-600">Issued by National Tech Forum via Proofsy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Digital Signature:</span>
                    <span className="font-mono text-[10px] text-slate-600">RSA-SHA256 • Valid</span>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </section>

      {/* ── Section 4: 3-Step Event Certificate Creation Workflow ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
            ⚡ Ultra-Fast Event Workflow
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            How Easy Is It? Create Event Certificates in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            From template selection to mass cryptographic issuance and automated email delivery in under a minute.
          </p>
        </div>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Pick or Design Your Template",
              subtitle: "In 15 seconds",
              desc: "Choose from institutional grade templates or drag-and-drop dynamic variables like {{recipient_name}}, {{event_title}}, and {{grade}}.",
              icon: "🎨",
              color: "from-blue-600 to-indigo-600",
            },
            {
              step: "02",
              title: "Upload Recipient List",
              subtitle: "In 10 seconds",
              desc: "Drop any CSV or Excel attendee spreadsheet. Proofsy validates email syntax and sanitizes inputs against injection attacks.",
              icon: "📁",
              color: "from-indigo-600 to-purple-600",
            },
            {
              step: "03",
              title: "1-Click Cryptographic Issuance",
              subtitle: "Automated in seconds",
              desc: "Our Bull Redis workers sign every document with RSA-2048 asymmetric keys, embed ISO QR codes, and dispatch personalized emails.",
              icon: "🚀",
              color: "from-emerald-600 to-teal-600",
            },
          ].map((s) => (
            <motion.div
              key={s.step}
              whileHover={{ y: -6 }}
              className="relative rounded-3xl p-8 bg-white border border-slate-200 shadow-xl flex flex-col justify-between overflow-hidden group transition-all"
            >
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${s.color}`} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-slate-300 group-hover:text-indigo-600 transition-colors">{s.step}</span>
                  <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">{s.subtitle}</span>
                </div>
                <div className="text-3xl">{s.icon}</div>
                <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Section 5: Who Uses Proofsy (Use Cases) ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-bold uppercase tracking-wider">
            🏛️ Institutional Grade
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            Engineered for Every Educational & Event Scale
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Purpose-built for student clubs, hackathons, workshops, and educational programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Universities & Colleges",
              subtitle: "Degrees, Diplomas & Fest Passes",
              desc: "Issue tamper-proof graduation awards and annual symposium certificates with departmental workspace isolation.",
              icon: "🎓",
              actionText: "Explore Academic Templates",
              href: "/templates"
            },
            {
              title: "Hackathons & Bootcamps",
              subtitle: "Participant & Winner Credentials",
              desc: "Mass dispatch 5,000+ certificates right after the closing ceremony with zero delay and automated SMTP delivery.",
              icon: "💻",
              actionText: "Launch Hackathon Pipeline",
              href: "/events/new"
            },
            {
              title: "Corporate & Professional",
              subtitle: "Compliance & Training Badges",
              desc: "Cryptographically certified employee training badges with full compliance audit logs and immutable timestamps.",
              icon: "🏢",
              actionText: "View Security Ledger",
              href: "/compliance"
            },
          ].map((u, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6 text-left"
            >
              <div className="space-y-3">
                <span className="text-3xl">{u.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{u.title}</h3>
                  <p className="text-xs font-mono text-indigo-600 mt-0.5">{u.subtitle}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{u.desc}</p>
              </div>

              <Link
                href={u.href}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 pt-3 border-t border-slate-100"
              >
                <span>{u.actionText}</span>
                <span>&rarr;</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: ROI & Time Savings Calculator ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xl text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            💰 Time & Cost Savings Calculator
          </div>
          
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
            See How Much Time & Money Proofsy Saves You
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto mt-2">
            Traditional tools charge up to $2.50 per certificate with unpredictable billing. Proofsy provides automated batch workflows with flat predictable plans.
          </p>

          <div className="max-w-md mx-auto my-8 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Certificates Per Year:</span>
              <span className="text-lg font-mono text-indigo-600">{calcCerts.toLocaleString()} Certs</span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={calcCerts}
              onChange={(e) => setCalcCerts(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto my-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-3xl font-black text-emerald-600 font-mono">${dollarsSaved.toLocaleString()}</p>
              <p className="text-xs text-slate-800 font-semibold mt-1">Dollars Saved / Year</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-3xl font-black text-indigo-600 font-mono">{hoursSaved} Hours</p>
              <p className="text-xs text-slate-800 font-semibold mt-1">Manual Work Eliminated</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-3xl font-black text-purple-600 font-mono">0.0%</p>
              <p className="text-xs text-slate-800 font-semibold mt-1">Fraud & Forgery Risk</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 7: FAQ Section ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold uppercase tracking-wider">
            💡 Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180 text-indigo-600" : ""}`} />
              </button>

              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 8: Direct Contact & Inquiries ── */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
              📬 Direct Contact & Inquiries
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight font-display">
              Have Questions, Tasks, or Custom Queries?
            </h3>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Reach out directly to our engineering & support team for event certificate onboarding, bulk CSV imports, college fest passes, or custom API integrations.
            </p>
            
            {/* Direct Contact Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="mailto:hello@proofsy.tech"
                className="inline-flex items-center gap-2 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl border border-indigo-200 shadow-2xs transition"
              >
                <span>👋</span>
                <span>hello@proofsy.tech</span>
              </a>

              <a
                href="mailto:support@proofsy.tech"
                className="inline-flex items-center gap-2 font-mono text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl border border-blue-200 shadow-2xs transition"
              >
                <span>💬</span>
                <span>support@proofsy.tech</span>
              </a>

              <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Response Time: &lt; 2 Hours</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 w-full lg:w-72 shrink-0">
            <Link
              href="/contact"
              className="px-6 py-4 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 text-center transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Open Support Portal</span>
              <span>&rarr;</span>
            </Link>
            <a
              href="mailto:hello@proofsy.tech?subject=Proofsy%20Inquiry"
              className="px-6 py-3.5 rounded-2xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-center transition flex items-center justify-center gap-2"
            >
              <span>Send Direct Email</span>
              <span>✉️</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 9: Final Call to Action ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 sm:p-14 text-center text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-100 bg-blue-500/40 px-3.5 py-1 rounded-full border border-blue-300/40">
              Start in 60 Seconds
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-display">
              Ready to Issue Verifiable Event Certificates?
            </h2>
            <p className="text-sm sm:text-base text-blue-50 leading-relaxed">
              Join universities, hackathons, and global bootcamps issuing tamper-proof credentials with mathematical certainty.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm text-indigo-950 bg-white hover:bg-indigo-50 shadow-lg transition active:scale-95"
              >
                Start Your Event Pipeline &rarr;
              </Link>
              <Link
                href="/verify"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-bold text-sm text-white bg-indigo-700/60 hover:bg-indigo-700 border border-white/20 transition"
              >
                Test Verification Online
              </Link>
            </div>
            
            <p className="text-[11px] text-blue-100/80 font-mono">
              Enterprise Cryptography • Sub-Second QR Verification • Zero Per-Cert Surcharge
            </p>
          </div>
        </div>
      </section>

      {/* ── Rich Multi-Column Footer with Contact Info ── */}
      <footer className="pt-16 pb-12 border-t border-slate-200 bg-white text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Footer 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Column 1: Brand & Contact Overview (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/20">
                  P
                </div>
                <span className="font-extrabold text-xl text-slate-900 font-display">
                  Proofsy
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  PKI Network
                </span>
              </div>

              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                The enterprise verifiable credential platform. Cryptographically secure event certificates, automated bulk CSV issuance, and sub-second ISO QR verification.
              </p>

              {/* Direct Inquiries Contact Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 max-w-md">
                <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📬</span>
                  <span>Contact & Email Directory</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">General Inbox:</span>
                    <a href="mailto:hello@proofsy.tech" className="font-bold text-indigo-600 hover:underline">
                      hello@proofsy.tech
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Support & Help:</span>
                    <a href="mailto:support@proofsy.tech" className="font-bold text-blue-600 hover:underline">
                      support@proofsy.tech
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Administration:</span>
                    <a href="mailto:admin@proofsy.tech" className="font-bold text-purple-600 hover:underline">
                      admin@proofsy.tech
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Security Reports:</span>
                    <a href="mailto:security@proofsy.tech" className="font-bold text-emerald-600 hover:underline">
                      security@proofsy.tech
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Platform Links (2 Cols) */}
            <div className="lg:col-span-2 space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Platform</h4>
              <ul className="space-y-2 text-slate-600">
                <li><Link href="/events/new" className="hover:text-indigo-600 transition">Create Event</Link></li>
                <li><Link href="/templates" className="hover:text-indigo-600 transition">Template Gallery</Link></li>
                <li><Link href="/designer" className="hover:text-indigo-600 transition">Visual Studio</Link></li>
                <li><Link href="/certificates" className="hover:text-indigo-600 transition">Credentials</Link></li>
                <li><Link href="/analytics" className="hover:text-indigo-600 transition">Analytics</Link></li>
              </ul>
            </div>

            {/* Column 3: Trust & Security (2 Cols) */}
            <div className="lg:col-span-2 space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Trust & Security</h4>
              <ul className="space-y-2 text-slate-600">
                <li><Link href="/verify" className="hover:text-indigo-600 transition font-semibold text-emerald-600">Live Verifier</Link></li>
                <li><Link href="/compliance" className="hover:text-indigo-600 transition">Security Ledger</Link></li>
                <li><Link href="/docs" className="hover:text-indigo-600 transition">Cryptographic API</Link></li>
                <li><Link href="/integrations" className="hover:text-indigo-600 transition">Webhooks</Link></li>
                <li><Link href="/workspaces" className="hover:text-indigo-600 transition">Workspaces</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact & Inquiries (3 Cols) */}
            <div className="lg:col-span-3 space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Support & Inquiries</h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <Link href="/contact" className="hover:text-indigo-600 transition font-bold text-indigo-600 flex items-center gap-1">
                    <span>Contact Support Portal</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello@proofsy.tech" className="hover:text-indigo-600 transition font-mono text-[11px]">
                    hello@proofsy.tech
                  </a>
                </li>
                <li>
                  <a href="mailto:support@proofsy.tech" className="hover:text-indigo-600 transition font-mono text-[11px]">
                    support@proofsy.tech
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">Global Uptime: 99.95% SLA</span>
                </li>
                <li>
                  <span className="text-slate-500">24/7 PKI Monitoring</span>
                </li>
                <li className="pt-2">
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>All Systems Operational</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Guarantee Bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-400">
            <p>
              © {new Date().getFullYear()} Proofsy. Built by Bhaskar Sharma. Cryptographically verified with HMAC-SHA256 and RSA-SHA256.
            </p>
            <p className="font-mono text-slate-500">
              General: <a href="mailto:hello@proofsy.tech" className="text-indigo-600 hover:underline">hello@proofsy.tech</a> • Support: <a href="mailto:support@proofsy.tech" className="text-indigo-600 hover:underline">support@proofsy.tech</a>
            </p>
          </div>

        </div>
      </footer>

      {/* ── Interactive RSA Encryption Video Walkthrough Modal ── */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0F142A] rounded-3xl border border-indigo-500/40 p-6 sm:p-8 max-w-2xl w-full text-white shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    🔒
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">RSA Encryption Tech Walkthrough</h3>
                    <p className="text-xs text-indigo-300">How Proofsy guarantees tamper-proof verification</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Animated Walkthrough Stage */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs text-indigo-300">
                  <span>Step {activeStep + 1} of 5</span>
                  <span className="font-mono">{rsaSteps[activeStep].title}</span>
                </div>

                <div className="text-center py-6 space-y-3">
                  <div className="text-4xl">{rsaSteps[activeStep].icon}</div>
                  <h4 className="text-lg font-bold text-white">{rsaSteps[activeStep].title}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {rsaSteps[activeStep].desc}
                  </p>
                  <p className="text-[11px] font-mono text-indigo-400">
                    {rsaSteps[activeStep].detail}
                  </p>
                </div>

                {/* Step Selector Pills */}
                <div className="flex justify-center gap-2 pt-2">
                  {rsaSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeStep === idx ? "w-8 bg-indigo-500" : "w-2 bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : 4))}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  &larr; Previous Step
                </button>
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % 5)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Next Step &rarr;
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
