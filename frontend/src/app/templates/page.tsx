"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { TemplateGridSkeleton } from "@/components/SkeletonLoaders";
import { api, BACKEND_URL, TemplateListItem, CustomFontData, getAssetUrl } from "@/lib/api";
import { pageVariants, staggerContainer, fadeUp, headerSlide, scaleUp, pulseGlow, cardHover, cardTap } from "@/lib/animations";

interface PresetTemplate {
  id: string;
  name: string;
  category: "ai" | "hackathon" | "cyber" | "academic" | "executive" | "biotech";
  categoryLabel: string;
  badgeColor: string;
  sealEmoji: string;
  dimensions: string;
  orientation: "landscape" | "portrait";
  description: string;
  cardStyle: string;
  borderStyle: string;
  ribbonColor: string;
  bgGradient: string;
  accentColor: string;
  issuer: string;
  program: string;
  securityPill: string;
}

const PRESET_GALLERY: PresetTemplate[] = [
  {
    id: "preset-neural-ai",
    name: "Autonomous AI & Neural Systems Architect",
    category: "ai",
    categoryLabel: "AI & Neural Tech",
    badgeColor: "bg-cyan-50 text-cyan-800 border-cyan-300",
    sealEmoji: "🧠",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "High-contrast cyan and indigo neural circuit framing, hexagonal seal, and machine learning accreditation.",
    cardStyle: "bg-gradient-to-br from-cyan-50/50 via-white to-indigo-50/40 text-slate-900",
    borderStyle: "border-4 border-cyan-600 shadow-md",
    ribbonColor: "from-cyan-500 via-indigo-500 to-purple-600",
    bgGradient: "bg-gradient-to-br from-cyan-50/50 via-white to-indigo-50/40",
    accentColor: "#0891B2",
    issuer: "Open Neural Systems Initiative (Demo)",
    program: "Master of Science in Autonomous Agents & Neural Transformers",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-quantum-crypto",
    name: "Quantum Computing & Cryptography Fellow",
    category: "ai",
    categoryLabel: "AI & Neural Tech",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-300",
    sealEmoji: "⚛️",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Cosmic iridescent purple frame with orbital watermark and cryptographic signature.",
    cardStyle: "bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/50 text-slate-900",
    borderStyle: "border-4 border-purple-600 shadow-md",
    ribbonColor: "from-purple-500 via-pink-500 to-cyan-500",
    bgGradient: "bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/50",
    accentColor: "#9333EA",
    issuer: "Apex Quantum Engineering Consortium (Demo)",
    program: "Fellowship in Applied Cryptographic Protocols",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-hackathon-sapphire",
    name: "Global Web3 & AI Hackathon Winner",
    category: "hackathon",
    categoryLabel: "Hackathons & Web3",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    sealEmoji: "⚡",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Electric sapphire gradient with high-contrast tech borders, trophy lightning crest, and instant verification QR code.",
    cardStyle: "bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 text-slate-900",
    borderStyle: "border-4 border-blue-600 shadow-md",
    ribbonColor: "from-blue-600 via-cyan-500 to-indigo-600",
    bgGradient: "bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40",
    accentColor: "#2563EB",
    issuer: "Global AI Hackathon Series (Demo)",
    program: "1st Place Grand Laureate — Multi-Agent Autonomous Systems Track",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-cybersecurity-defense",
    name: "Zero-Trust Cybersecurity & Defense Master",
    category: "cyber",
    categoryLabel: "Cybersecurity & Cloud",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sealEmoji: "🛡️",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Clean emerald carbon grid, shield security seal, tamper-evident hash strip, and verification proofs.",
    cardStyle: "bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 text-slate-900",
    borderStyle: "border-4 border-emerald-600 shadow-md",
    ribbonColor: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGradient: "bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40",
    accentColor: "#059669",
    issuer: "Cloud Defense Research Labs (Demo)",
    program: "Certified Cloud Security & Defense Architect",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-generative-ai",
    name: "Generative AI & LLM Frontier Distinction",
    category: "ai",
    categoryLabel: "AI & Neural Tech",
    badgeColor: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300",
    sealEmoji: "✨",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Violet-magenta aesthetic with crisp typography and precision multi-modal AI certification seal.",
    cardStyle: "bg-gradient-to-br from-fuchsia-50/50 via-white to-purple-50/40 text-slate-900",
    borderStyle: "border-4 border-fuchsia-600 shadow-md",
    ribbonColor: "from-fuchsia-500 via-pink-500 to-amber-500",
    bgGradient: "bg-gradient-to-br from-fuchsia-50/50 via-white to-purple-50/40",
    accentColor: "#C026D3",
    issuer: "Frontier AI Research Network (Demo)",
    program: "Certified Frontier LLM Fine-Tuning & Evaluation Specialist",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-executive-platinum",
    name: "Executive Leadership Platinum Distinction",
    category: "executive",
    categoryLabel: "Executive & Leadership",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    sealEmoji: "👑",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Slate titanium and brushed gold framing with minimalist geometric watermark and executive leadership seal.",
    cardStyle: "bg-gradient-to-br from-slate-50 via-white to-stone-50 text-slate-900",
    borderStyle: "border-4 border-amber-500 shadow-md",
    ribbonColor: "from-amber-500 via-yellow-500 to-amber-600",
    bgGradient: "bg-gradient-to-br from-slate-50 via-white to-stone-50",
    accentColor: "#D97706",
    issuer: "Executive Technology Guild (Demo)",
    program: "Executive Fellowship in Venture Strategy & Corporate Governance",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-biotech-genomics",
    name: "Computational Genomics & BioTech Fellowship",
    category: "biotech",
    categoryLabel: "BioTech & Frontier Science",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-300",
    sealEmoji: "🧬",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Oceanic teal and indigo aura with DNA helix particle watermark and accreditation signature.",
    cardStyle: "bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/50 text-slate-900",
    borderStyle: "border-4 border-teal-600 shadow-md",
    ribbonColor: "from-teal-500 via-cyan-500 to-blue-600",
    bgGradient: "bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/50",
    accentColor: "#0D9488",
    issuer: "Genomic Informatics Institute (Demo)",
    program: "Distinguished Fellowship in Computational Biology & Informatics",
    securityPill: "HMAC-SHA256 SIGNED",
  },
  {
    id: "preset-academic-ivy",
    name: "Classic Academic Honors Diploma",
    category: "academic",
    categoryLabel: "Academic & University",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    sealEmoji: "🏛️",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Regal ivory parchment with gold leaf framing, crest seal, Playfair serif typography, and formal institution endorsement.",
    cardStyle: "bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] text-gray-950",
    borderStyle: "border-8 border-amber-600/40 ring-4 ring-amber-200 shadow-xl",
    ribbonColor: "from-amber-600 via-yellow-500 to-amber-700",
    bgGradient: "bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9]",
    accentColor: "#D97706",
    issuer: "Nexus Institute of Technology (Demo)",
    program: "Bachelor of Science in Computer Science & Applied Cryptography",
    securityPill: "HMAC-SHA256 SIGNED",
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<PresetTemplate | null>(null);
  const [previewName, setPreviewName] = useState("Alex Rivera");
  const [previewEvent, setPreviewEvent] = useState("");

  const [customFonts, setCustomFonts] = useState<CustomFontData[]>([]);
  const [fontName, setFontName] = useState("");
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [res, fontsRes] = await Promise.all([
          api.listTemplates(),
          api.getCustomFonts(),
        ]);
        if (res.success && res.data) {
          setTemplates(res.data);
        }
        if (fontsRes.success && fontsRes.data) {
          setCustomFonts(fontsRes.data);
        }
      } catch (err) {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedTemplates();
      const res = await api.listTemplates();
      if (res.success && res.data) {
        setTemplates(res.data);
      }
    } catch (err) {
      //
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete template "${name}"?`)) return;
    const res = await api.deleteTemplate(id);
    if (res.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleFontUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontName.trim()) {
      setErrorMsg("Font name is required");
      return;
    }
    if (!fontFile) {
      setErrorMsg("Please select a .ttf font file");
      return;
    }
    setUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("name", fontName.trim());
    formData.append("fontWeight", fontWeight);
    formData.append("file", fontFile);

    const res = await api.uploadCustomFont(formData);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to upload custom font");
      setUploading(false);
      return;
    }

    if (res.data) {
      setCustomFonts((prev) => [...prev, res.data!]);
    }
    setFontName("");
    setFontFile(null);
    const input = document.getElementById("font-file-input") as HTMLInputElement;
    if (input) input.value = "";
    setUploading(false);
  };

  const handleFontDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete font "${name}"?`)) return;
    const res = await api.deleteCustomFont(id);
    if (res.success) {
      setCustomFonts((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const filteredPresets = useMemo(() => {
    return PRESET_GALLERY.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.issuer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        {/* Soft Ambient Lights */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-[130px]" />
          <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[130px]" />
        </div>

        {/* Top Header */}
        <motion.header
          variants={headerSlide}
          initial="hidden"
          animate="visible"
          className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏛️</span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Certificate Template Gallery</h1>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                PRO PRESETS & AI STYLES
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore, customize, and issue institutional & high-tech certificate templates in 1 click.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.div whileTap={cardTap}>
              <Link
                href="/designer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <span>✨ Launch Visual Studio</span>
              </Link>
            </motion.div>

            <motion.div whileTap={cardTap}>
              <Link
                href="/templates/new"
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <span>+ Upload PDF / Image</span>
              </Link>
            </motion.div>
          </div>
        </motion.header>

        {/* Content Body */}
        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="p-6 sm:p-8 space-y-8 relative z-[1] max-w-7xl mx-auto"
        >
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Templates (8)" },
                { id: "ai", label: "🧠 AI & Neural Tech" },
                { id: "hackathon", label: "⚡ Hackathons & Web3" },
                { id: "cyber", label: "🛡️ Cyber & Cloud" },
                { id: "executive", label: "👑 Executive & Corporate" },
                { id: "biotech", label: "🧬 BioTech & Science" },
                { id: "academic", label: "🏛️ Academic & University" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 px-3.5 py-2 pl-9 rounded-xl outline-none transition"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Skeleton Loader When Loading */}
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-60 bg-slate-200 rounded animate-pulse" />
              <TemplateGridSkeleton count={6} />
            </div>
          ) : (
            /* Preset Showcase Cards */
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Curated Tech & AI Certificate Presets</h2>
                  <p className="text-xs text-slate-500">High-contrast, luxury institutional designs engineered for modern digital credentials</p>
                </div>
                <span className="text-xs text-slate-500 font-mono hidden sm:block">ISO/IEC 18004 QR • RSA-2048 Sealed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPresets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all group flex flex-col justify-between"
                  >
                    {/* Live Rendered Template Mockup Header */}
                    <div
                      onClick={() => {
                        setPreviewTemplate(preset);
                        setPreviewEvent(preset.program);
                      }}
                      className={`p-6 sm:p-8 cursor-pointer relative overflow-hidden transition-all ${preset.cardStyle} ${preset.borderStyle}`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${preset.ribbonColor}`} />

                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{preset.sealEmoji}</span>
                          <div>
                            <p className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-900 truncate max-w-[240px]">
                              {preset.issuer}
                            </p>
                            <p className="text-[8px] font-mono text-slate-500">Cryptographic Issuance Authority</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${preset.badgeColor}`}>
                          {preset.securityPill}
                        </span>
                      </div>

                      <div className="text-center my-6 space-y-1.5">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Certificate of Excellence</p>
                        <h3 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-slate-950">
                          Alex Rivera
                        </h3>
                        <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                          {preset.program}
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[8px] font-mono text-slate-500">
                        <span>Issued: August 31, 2026</span>
                        <span className="text-emerald-600 font-bold">RSA-2048 SEALED</span>
                        <span className="text-blue-600 font-semibold">SCAN QR VERIFY</span>
                      </div>
                    </div>

                    {/* Template Card Details & Action Row */}
                    <div className="p-6 bg-white border-t border-slate-100 flex flex-col justify-between flex-1 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {preset.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {preset.dimensions}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setPreviewTemplate(preset);
                            setPreviewEvent(preset.program);
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center transition cursor-pointer"
                        >
                          Live Preview
                        </button>
                        <Link
                          href={`/events/new`}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-xs transition cursor-pointer"
                        >
                          Use in Event &rarr;
                        </Link>
                        <Link
                          href={`/designer`}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          title="Customize in Visual Studio"
                        >
                          🎨
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* User's Custom Uploaded Templates */}
          {templates.length > 0 && (
            <section className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900">Your Custom Organization Templates ({templates.length})</h2>
                <Link href="/templates/new" className="text-xs font-bold text-blue-600 hover:underline">
                  + Upload New Template
                </Link>
              </div>

              <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {templates.map((t) => (
                  <motion.div
                    key={t.id}
                    variants={scaleUp}
                    whileHover={cardHover}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all group"
                  >
                    <div className="h-44 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                      {t.backgroundType === "image" ? (
                        <img
                          src={getAssetUrl(t.backgroundUrl)}
                          alt={t.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <span className="text-3xl">📄</span>
                          <span className="text-xs font-semibold">PDF Document Template</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{t.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {t.textLayerCount} Layers
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        {t.width} × {t.height} px · {t.backgroundType.toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/templates/${t.id}`}
                          className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 text-center transition cursor-pointer"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/events/new?template=${t.id}`}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center shadow-xs transition cursor-pointer"
                        >
                          Use this
                        </Link>
                        {!t.isStarter && (
                          <button
                            onClick={() => handleDelete(t.id, t.name)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete template"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Institutional Custom Fonts Engine */}
          <motion.section variants={fadeUp} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🔤</span>
                <h3 className="text-base font-extrabold text-slate-900">Custom Institutional Typefaces & Fonts</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Upload and register official university TrueType (.ttf) fonts to guarantee brand compliance on all rendered certificates.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleFontUpload} className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Typeface</h4>

                {errorMsg && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Font Family Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Garamond Premier Pro"
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Weight</label>
                    <select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">File (.ttf)</label>
                    <input
                      id="font-file-input"
                      type="file"
                      accept=".ttf"
                      onChange={(e) => setFontFile(e.target.files?.[0] || null)}
                      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? "Uploading Typeface..." : "+ Register Custom Font"}
                </button>
              </form>

              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Registered Typefaces</h4>
                {customFonts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">
                      No custom fonts uploaded yet. Default system typefaces (Inter, Outfit, Playfair Display, SF Mono) are active.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFonts.map((f) => (
                      <div key={f.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{f.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Weight: {f.fontWeight}</p>
                        </div>
                        <button
                          onClick={() => handleFontDelete(f.id, f.name)}
                          className="text-xs text-rose-500 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>

        {/* Live Interactive Preset Preview Modal */}
        <AnimatePresence>
          {previewTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{previewTemplate.sealEmoji}</span>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{previewTemplate.name}</h3>
                      <p className="text-xs text-slate-500">{previewTemplate.categoryLabel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Recipient Dynamic Name & Event Customizer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Recipient Name:</label>
                    <input
                      type="text"
                      value={previewName}
                      onChange={(e) => setPreviewName(e.target.value)}
                      placeholder="Type a recipient name..."
                      className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Event / Credential Title:</label>
                    <input
                      type="text"
                      value={previewEvent}
                      onChange={(e) => setPreviewEvent(e.target.value)}
                      placeholder="Type event title..."
                      className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Rendered Preview Sandbox */}
                <div
                  className={`p-8 sm:p-14 rounded-2xl text-center space-y-6 relative overflow-hidden ${previewTemplate.cardStyle} ${previewTemplate.borderStyle}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${previewTemplate.ribbonColor}`} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-3xl">{previewTemplate.sealEmoji}</span>
                      <div>
                        <p className="text-xs font-mono font-bold tracking-wider uppercase text-slate-900">{previewTemplate.issuer}</p>
                        <p className="text-[9px] font-mono text-slate-400">Cryptographic Issuance Authority</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border uppercase ${previewTemplate.badgeColor}`}>
                      RSA-2048 SEALED ✓
                    </span>
                  </div>

                  <div className="my-8 space-y-3">
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Certificate of Completion & Excellence</p>
                    <h2 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-slate-950">
                      {previewName || "Recipient Full Name"}
                    </h2>
                    <p className="text-xs max-w-lg mx-auto pt-1 leading-relaxed text-slate-600">
                      has demonstrated verified technical mastery and fulfilled all institutional requirements for:
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 pt-1">
                      {previewEvent || previewTemplate.program}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="text-[10px] font-mono text-slate-500">
                      <p>Issued: August 31, 2026</p>
                      <p>Verification: proofsy.tech/verify</p>
                    </div>
                    
                    {/* Sub-second QR card */}
                    <div className="flex items-center gap-3 bg-white text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="w-10 h-10 bg-white rounded p-0.5">
                        <svg className="w-full h-full text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm-3-5h2v2h-2v-2zm0 4h2v4h-2v-4zm5 2h2v2h-2v-2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-[8px] font-mono font-black">SCAN TO VERIFY</p>
                        <p className="text-[7px] font-mono text-blue-600 font-bold">0.08s LATENCY</p>
                      </div>
                    </div>

                    <div className="text-right text-[10px] font-mono text-emerald-600 font-bold">
                      CERT-RSA-9941X7
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Close Preview
                  </button>
                  <Link
                    href={`/designer`}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-center cursor-pointer transition"
                  >
                    Open in Visual Studio Studio 🎨
                  </Link>
                  <Link
                    href={`/events/new`}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-center cursor-pointer transition"
                  >
                    Issue with This Template &rarr;
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
