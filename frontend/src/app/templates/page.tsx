"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { api, BACKEND_URL, TemplateListItem, CustomFontData, getAssetUrl } from "@/lib/api";
import { pageVariants, staggerContainer, fadeUp, headerSlide, scaleUp, pulseGlow, cardHover, cardTap } from "@/lib/animations";

interface PresetTemplate {
  id: string;
  name: string;
  category: "academic" | "hackathon" | "executive" | "workshop";
  categoryLabel: string;
  badgeColor: string;
  sealEmoji: string;
  dimensions: string;
  orientation: "landscape" | "portrait";
  description: string;
  borderStyle: string;
  bgGradient: string;
  accentColor: string;
  issuer: string;
  program: string;
}

const PRESET_GALLERY: PresetTemplate[] = [
  {
    id: "preset-academic-ivy",
    name: "Classic Academic Diploma",
    category: "academic",
    categoryLabel: "Academic & University",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    sealEmoji: "🏛️",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Traditional dual-gold border with regal crest, serif typography, and formal university endorsement.",
    borderStyle: "border-8 border-amber-600/30 ring-4 ring-amber-100",
    bgGradient: "bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9]",
    accentColor: "#D97706",
    issuer: "Stanford Institute of Technology",
    program: "Master of Science in Computational Intelligence",
  },
  {
    id: "preset-executive-platinum",
    name: "Executive Platinum Distinction",
    category: "executive",
    categoryLabel: "Executive & Corporate",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    sealEmoji: "💎",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Minimalist slate-charcoal framing with geometric watermark and executive leadership seal.",
    borderStyle: "border-4 border-slate-800 ring-2 ring-slate-300",
    bgGradient: "bg-gradient-to-b from-white via-slate-50 to-white",
    accentColor: "#0F172A",
    issuer: "Global Leadership Institute",
    program: "Executive Leadership & Venture Strategy",
  },
  {
    id: "preset-hackathon-sapphire",
    name: "Silicon Valley Hackathon Winner",
    category: "hackathon",
    categoryLabel: "Hackathons & Competitions",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    sealEmoji: "⚡",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "High-contrast sapphire and cobalt accents designed for developer hackathons and tech symposiums.",
    borderStyle: "border-4 border-blue-600 ring-4 ring-blue-100",
    bgGradient: "bg-gradient-to-b from-blue-50/40 via-white to-indigo-50/30",
    accentColor: "#2563EB",
    issuer: "AI World Hackathon Series",
    program: "1st Place Winner — Autonomous Agents Track",
  },
  {
    id: "preset-workshop-modern",
    name: "Modern Professional Mastery",
    category: "workshop",
    categoryLabel: "Bootcamps & Workshops",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    sealEmoji: "📜",
    dimensions: "1056 × 746 px",
    orientation: "landscape",
    description: "Clean contemporary layout with vibrant emerald certification stamp and clear competency breakdown.",
    borderStyle: "border-4 border-emerald-600/40 ring-4 ring-emerald-50",
    bgGradient: "bg-gradient-to-b from-white via-emerald-50/20 to-white",
    accentColor: "#059669",
    issuer: "Cloud DevOps Academy",
    program: "Certified Kubernetes & Distributed Systems Engineer",
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
    setErrorMsg("");
    setUploading(true);

    const formData = new FormData();
    formData.append("name", fontName.trim());
    formData.append("fontWeight", fontWeight);
    formData.append("fontFile", fontFile);

    const res = await api.uploadCustomFont(formData);
    if (res.success && res.data) {
      setCustomFonts((prev) => [res.data!, ...prev]);
      setFontName("");
      setFontFile(null);
      const fileInput = document.getElementById("font-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } else {
      setErrorMsg(res.error || "Failed to upload custom font");
    }
    setUploading(false);
  };

  const handleFontDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete custom font "${name}"?`)) return;
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
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <motion.div variants={pulseGlow} animate="animate" className="absolute top-20 right-12 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
        <motion.div variants={pulseGlow} animate="animate" style={{ animationDelay: "1.2s" }} className="absolute bottom-28 left-20 w-60 h-60 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <motion.header variants={headerSlide} initial="hidden" animate="visible" className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h1 className="text-xl font-black text-slate-900">Certificate Template Gallery</h1>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                OFFICIAL PRESETS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Explore, customize, and clone institutional-grade certificate templates in 1 click.</p>
          </div>

          <div className="flex items-center gap-2.5">
            {templates.length === 0 && !loading && (
              <motion.button
                whileTap={cardTap}
                onClick={handleSeed}
                disabled={seeding}
                className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {seeding ? "Importing Presets..." : "Load Starter Templates"}
              </motion.button>
            )}

            <motion.div whileTap={cardTap}>
              <Link
                href="/designer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <span>Launch Visual Studio</span>
              </Link>
            </motion.div>

            <motion.div whileTap={cardTap}>
              <Link
                href="/templates/new"
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Upload PDF/Image</span>
              </Link>
            </motion.div>
          </div>
        </motion.header>

        {/* Content Body */}
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-8 space-y-8 relative z-[1]">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Templates" },
                { id: "academic", label: "Academic & University" },
                { id: "hackathon", label: "Hackathons & Tech" },
                { id: "executive", label: "Executive & Leadership" },
                { id: "workshop", label: "Bootcamps & Mastery" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === tab.id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
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
                className="w-full text-xs bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white px-3.5 py-2 pl-9 rounded-xl outline-none transition"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Preset Showcase Cards */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Featured Institutional Templates</h2>
              <span className="text-xs text-slate-500 font-medium">Ready to issue immediately with ISO/IEC QR codes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredPresets.map((preset) => (
                <motion.div
                  key={preset.id}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-400 transition-all group flex flex-col justify-between"
                >
                  {/* Live Rendered Template Mockup Header */}
                  <div
                    onClick={() => setPreviewTemplate(preset)}
                    className={`p-6 sm:p-8 cursor-pointer relative overflow-hidden transition-all ${preset.bgGradient} ${preset.borderStyle}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{preset.sealEmoji}</span>
                        <div>
                          <p className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-800">{preset.issuer}</p>
                          <p className="text-[8px] font-mono text-slate-400">Institutional Registry</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${preset.badgeColor}`}>
                        VERIFIED ✓
                      </span>
                    </div>

                    <div className="text-center my-4 space-y-1">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Certificate of Completion</p>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-950 font-serif tracking-tight">
                        Alex Rivera
                      </h3>
                      <p className="text-[10px] text-slate-600 line-clamp-1">
                        {preset.program}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[8px] font-mono text-slate-400">
                      <span>Date: August 30, 2026</span>
                      <span className="text-emerald-600 font-bold">RSA-2048 SEALED</span>
                      <span className="text-blue-600 font-semibold">SCAN QR VERIFY</span>
                    </div>
                  </div>

                  {/* Template Card Details & Action Row */}
                  <div className="p-5 bg-white border-t border-slate-100 flex flex-col justify-between flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{preset.name}</h4>
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
                        onClick={() => setPreviewTemplate(preset)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center transition cursor-pointer"
                      >
                        Live Preview
                      </button>
                      <Link
                        href={`/events/new`}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-md shadow-blue-500/20 transition cursor-pointer"
                      >
                        Use Template &rarr;
                      </Link>
                      <Link
                        href={`/designer`}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
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

          {/* User's Custom Uploaded Templates */}
          {templates.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-900">Your Custom Organization Templates ({templates.length})</h2>
                <Link href="/templates/new" className="text-xs font-bold text-blue-600 hover:underline">
                  + Upload New Template Background
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
                    <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
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
              <p className="text-xs text-slate-500 mt-1">Upload and register official university TrueType (.ttf) fonts to guarantee brand compliance on all rendered certificates.</p>
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
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Weight</label>
                    <select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
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
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">No custom fonts uploaded yet. Default system typefaces (Inter, Outfit, Garamond, Playfair Display) are available.</p>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{previewTemplate.sealEmoji}</span>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{previewTemplate.name}</h3>
                      <p className="text-xs text-slate-500">{previewTemplate.categoryLabel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Recipient Dynamic Name Customizer */}
                <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 shrink-0">Sample Recipient Name:</label>
                  <input
                    type="text"
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    placeholder="Type a recipient name..."
                    className="flex-1 bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                {/* Rendered Preview Sandbox */}
                <div className={`p-8 sm:p-12 rounded-2xl text-center space-y-6 ${previewTemplate.bgGradient} ${previewTemplate.borderStyle}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-2xl">{previewTemplate.sealEmoji}</span>
                      <div>
                        <p className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-800">{previewTemplate.issuer}</p>
                        <p className="text-[8px] font-mono text-slate-400">Cryptographic Issuance Authority</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border uppercase ${previewTemplate.badgeColor}`}>
                      DIGITALLY SEALED ✓
                    </span>
                  </div>

                  <div className="my-6 space-y-2">
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Certificate of Completion</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-serif tracking-tight">
                      {previewName || "Recipient Name"}
                    </h2>
                    <p className="text-xs text-slate-600 max-w-md mx-auto pt-1 leading-relaxed">
                      has demonstrated validated mastery and satisfied all credential requirements for:
                    </p>
                    <p className="text-sm font-bold text-slate-900 pt-1">
                      {previewTemplate.program}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="text-[10px] font-mono text-slate-500">
                      <p>Issued: August 30, 2026</p>
                      <p>Registry: proofsy.tech/verify</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-xs">📱</span>
                      <span className="text-[9px] font-mono font-bold text-blue-600">ISO/IEC 18004 QR CODE</span>
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
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Close Preview
                  </button>
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
