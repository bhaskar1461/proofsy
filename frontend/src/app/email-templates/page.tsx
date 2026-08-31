"use client";

import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { pageVariants, fadeUp, fadeLeft, headerSlide, pulseGlow, cardHover, cardTap } from "@/lib/animations";

/* ─── Types ────────────────────────────────────── */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "delivery" | "reminder" | "verification" | "custom";
  updatedAt: string;
  accentColor?: string;
  layoutStyle?: "modern" | "institutional" | "minimal";
}

/* ─── Merge-tag helpers ────────────────────────── */
const MERGE_TAGS = [
  { label: "Recipient Name", tag: "[recipient.name]", desc: "e.g. Alex Johnson" },
  { label: "Recipient Email", tag: "[recipient.email]", desc: "e.g. alex@example.com" },
  { label: "Event / Course Name", tag: "[event.name]", desc: "e.g. Full-Stack Cloud Architecture" },
  { label: "Event Date", tag: "[event.date]", desc: "e.g. August 30, 2026" },
  { label: "Verification Code", tag: "[cert.code]", desc: "e.g. CERT-RSA-9941X7" },
  { label: "Direct PDF Download URL", tag: "[cert.pdfUrl]", desc: "https://proofsy.tech/download/..." },
  { label: "Online Verification URL", tag: "[cert.verifyUrl]", desc: "https://proofsy.tech/verify/..." },
  { label: "Organization Name", tag: "[org.name]", desc: "e.g. Stanford Academy" },
];

const CATEGORY_COLORS: Record<EmailTemplate["category"], string> = {
  delivery: "bg-blue-50 text-blue-700 border-blue-200",
  reminder: "bg-amber-50 text-amber-700 border-amber-200",
  verification: "bg-emerald-50 text-emerald-700 border-emerald-200",
  custom: "bg-purple-50 text-purple-700 border-purple-200",
};

/* ─── Starter templates ────────────────────────── */
const starterTemplates: EmailTemplate[] = [
  {
    id: "mail-delivery-official",
    name: "Official Credential Delivery (Default)",
    subject: "🎓 Congratulations! Your official certificate for [event.name] is ready",
    body: `Hi [recipient.name],

Congratulations on successfully completing [event.name]!

Your cryptographically verified digital certificate has been issued and signed by [org.name].

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 Credential Details:
• Recipient: [recipient.name]
• Program: [event.name]
• Issued On: [event.date]
• Certificate ID: [cert.code]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 Download Official PDF:
[cert.pdfUrl]

🔍 Live Verification & Add to LinkedIn:
[cert.verifyUrl]

You can add this verified credential directly to your LinkedIn profile in 1-click using the link above.

Best regards,
[org.name] Certification Team`,
    category: "delivery",
    layoutStyle: "institutional",
    accentColor: "#2563EB",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mail-delivery-modern",
    name: "Modern Tech / Hackathon Dispatch",
    subject: "⚡ You did it! Your [event.name] verified credential has arrived",
    body: `Hey [recipient.name]! 🚀

Huge congratulations on participating in and completing [event.name]!

Your credential [cert.code] is now permanently anchored on the Proofsy cryptographic registry.

👉 View & Add to LinkedIn: [cert.verifyUrl]
👉 Download High-Res PDF: [cert.pdfUrl]

Show off your achievement to recruiters and teammates!

Cheers,
The [org.name] Team`,
    category: "delivery",
    layoutStyle: "modern",
    accentColor: "#4F46E5",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mail-reminder",
    name: "Download Reminder Notice",
    subject: "📌 Reminder: Download your verified credential for [event.name]",
    body: `Hi [recipient.name],

This is a friendly reminder that your verified certificate for [event.name] (ID: [cert.code]) is ready for you.

Access your official document anytime here:
[cert.verifyUrl]

Don't forget to save a copy for your records or share it on your LinkedIn profile!

Warmly,
[org.name]`,
    category: "reminder",
    layoutStyle: "minimal",
    accentColor: "#D97706",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mail-verify-alert",
    name: "Credential Verification Alert",
    subject: "🔒 Verification Confirmation: Certificate [cert.code]",
    body: `Hi [recipient.name],

Someone has successfully verified your certificate authenticity for [event.name] on the Proofsy registry.

• Verification ID: [cert.code]
• Status: Cryptographically Authentic ✓
• Public Record: [cert.verifyUrl]

Thank you for upholding academic and professional integrity with Proofsy.

— [org.name] Security Team`,
    category: "verification",
    layoutStyle: "institutional",
    accentColor: "#059669",
    updatedAt: new Date().toISOString(),
  },
];

/* ─── Email preview sample data ────────────────── */
const sampleData: Record<string, string> = {
  "[recipient.name]": "Alex Rivera",
  "[recipient.email]": "alex.rivera@example.com",
  "[event.name]": "Full-Stack Cloud Architecture & Distributed Systems",
  "[event.date]": "August 30, 2026",
  "[cert.code]": "CERT-RSA-9941X7",
  "[cert.pdfUrl]": "https://proofsy.tech/storage/certificates/sample.pdf",
  "[cert.verifyUrl]": "https://proofsy.tech/verify/CERT-RSA-9941X7",
  "[org.name]": "Proofsy Academy of Technology",
};

function renderPreview(text: string): string {
  let rendered = text;
  for (const [tag, value] of Object.entries(sampleData)) {
    rendered = rendered.replaceAll(tag, value);
  }
  return rendered;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(starterTemplates);
  const [selectedId, setSelectedId] = useState(starterTemplates[0].id);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState("bhaskarsharma0109@gmail.com");
  const [testSent, setTestSent] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("proofsy_email_templates");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch (e) {
      // fallback to starterTemplates
    }
  }, []);

  const selected = templates.find((t) => t.id === selectedId) || templates[0];

  const updateSelected = useCallback(
    (field: keyof EmailTemplate, value: string) => {
      setTemplates((curr) => {
        const updated = curr.map((t) =>
          t.id === selectedId
            ? { ...t, [field]: value, updatedAt: new Date().toISOString() }
            : t
        );
        try {
          localStorage.setItem("proofsy_email_templates", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    [selectedId]
  );

  const createTemplate = () => {
    const id = `mail-${Date.now()}`;
    const newTemplate: EmailTemplate = {
      id,
      name: "New Custom Email Template",
      subject: "Your certificate for [event.name] is ready",
      body: `Hi [recipient.name],\n\nCongratulations on completing [event.name]!\n\nView and download your official credential here:\n[cert.verifyUrl]\n\nBest regards,\n[org.name]`,
      category: "custom",
      layoutStyle: "modern",
      accentColor: "#2563EB",
      updatedAt: new Date().toISOString(),
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    setSelectedId(id);
    localStorage.setItem("proofsy_email_templates", JSON.stringify(updated));
  };

  const duplicateTemplate = () => {
    const id = `mail-${Date.now()}`;
    const dup: EmailTemplate = {
      ...selected,
      id,
      name: `${selected.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...templates, dup];
    setTemplates(updated);
    setSelectedId(id);
    localStorage.setItem("proofsy_email_templates", JSON.stringify(updated));
  };

  const deleteTemplate = (tid: string) => {
    if (templates.length <= 1) return;
    const updated = templates.filter((t) => t.id !== tid);
    setTemplates(updated);
    setSelectedId(updated[0].id);
    localStorage.setItem("proofsy_email_templates", JSON.stringify(updated));
  };

  const insertTag = (tag: string) => {
    updateSelected("body", selected.body + "\n" + tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("proofsy_email_templates", JSON.stringify(templates));
    } catch (e) {}
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2500);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    setTestSent(true);
    setTimeout(() => {
      setTestSent(false);
      setTestEmailModal(false);
    }, 2000);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <motion.div variants={pulseGlow} animate="animate" className="absolute top-16 right-20 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <motion.div variants={pulseGlow} animate="animate" style={{ animationDelay: "1.2s" }} className="absolute bottom-24 left-8 w-56 h-56 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <motion.header variants={headerSlide} initial="hidden" animate="visible" className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✉️</span>
              <h1 className="text-xl font-black text-slate-900">Certificate Email Designer</h1>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                DISPATCH STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Customize the automated email notifications sent to students and attendees when certificates are generated.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <AnimatePresence>
              {showSaved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Template Saved
                </motion.span>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={cardTap}
              onClick={() => setTestEmailModal(true)}
              className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              <span>Test Send</span>
            </motion.button>

            <motion.button
              whileTap={cardTap}
              onClick={handleSave}
              className="border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Save Template
            </motion.button>

            <motion.button
              whileTap={cardTap}
              onClick={createTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Template</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Main Content Layout */}
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-8 grid lg:grid-cols-[300px_1fr_420px] gap-6 relative z-[1]">
          {/* Left: Template Navigator */}
          <motion.aside variants={fadeLeft} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 h-fit shadow-xs">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {templates.length} Saved Templates
              </span>
              <button
                onClick={duplicateTemplate}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                + Duplicate
              </button>
            </div>

            <div className="space-y-2">
              {templates.map((t) => (
                <motion.button
                  key={t.id}
                  layout
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left rounded-xl p-3.5 border transition relative group cursor-pointer ${
                    selectedId === t.id
                      ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/20"
                      : "border-slate-200 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{t.name}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category]} shrink-0`}>
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-mono">{t.subject}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{formatTime(t.updatedAt)}</span>
                    {templates.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(t.id);
                        }}
                        className="text-rose-500 hover:underline opacity-0 group-hover:opacity-100 transition"
                      >
                        Delete
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.aside>

          {/* Center: Template Editor */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            {/* Merge Tag Chips */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> Click to Insert Dynamic Merge Tags:
                </span>
                {copiedTag && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-pulse">
                    Inserted {copiedTag} ✓
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_TAGS.map((mt) => (
                  <motion.button
                    key={mt.tag}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => insertTag(mt.tag)}
                    className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 shadow-2xs transition cursor-pointer"
                    title={mt.desc}
                  >
                    {mt.tag}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Template Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Template Title</label>
                <input
                  type="text"
                  value={selected.name}
                  onChange={(e) => updateSelected("name", e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={selected.category}
                  onChange={(e) => updateSelected("category", e.target.value as any)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none transition cursor-pointer"
                >
                  <option value="delivery">Credential Delivery</option>
                  <option value="reminder">Download Reminder</option>
                  <option value="verification">Verification Alert</option>
                  <option value="custom">Custom Announcement</option>
                </select>
              </div>
            </div>

            {/* Subject Line */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Subject Line</label>
              <input
                type="text"
                value={selected.subject}
                onChange={(e) => updateSelected("subject", e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none transition"
              />
            </div>

            {/* Email Body Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Email Message Body</label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selected.body.length} characters · {selected.body.split("\n").length} lines
                </span>
              </div>
              <textarea
                rows={15}
                value={selected.body}
                onChange={(e) => updateSelected("body", e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl p-4 text-xs font-mono text-slate-800 outline-none leading-relaxed resize-y transition"
              />
            </div>
          </motion.div>

          {/* Right: Live Simulated Email Client Preview */}
          <motion.div variants={fadeUp} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Recipient Inbox Preview
              </span>

              {/* Desktop vs Mobile Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDevicePreview("desktop")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    devicePreview === "desktop"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevicePreview("mobile")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    devicePreview === "mobile"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Email Client Wrapper */}
            <div
              className={`bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-lg transition-all ${
                devicePreview === "mobile" ? "max-w-[340px] mx-auto border-4 border-slate-800 rounded-3xl" : "w-full"
              }`}
            >
              {/* Mail App Header */}
              <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">Proofsy Mail Client</span>
                <span className="text-[10px] text-slate-400">Now</span>
              </div>

              {/* Sender & Subject Information */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      P
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Proofsy Notifications</p>
                      <p className="text-[10px] text-slate-500 font-mono">noreply@proofsy.tech</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    SIGNED ✓
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-extrabold text-slate-900 leading-snug">
                    {renderPreview(selected.subject)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    To: {sampleData["[recipient.name]"]} &lt;{sampleData["[recipient.email]"]}&gt;
                  </p>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="p-5 bg-white text-xs text-slate-800 leading-relaxed font-sans space-y-4">
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                  {renderPreview(selected.body)}
                </pre>

                {/* Interactive Simulated CTA Buttons */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="block w-full py-2.5 rounded-xl bg-blue-600 text-white text-center font-bold text-xs shadow-md shadow-blue-500/20"
                  >
                    View & Verify Credential &rarr;
                  </a>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="block w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-semibold text-xs transition"
                  >
                    Download Official PDF Document
                  </a>
                </div>
              </div>

              {/* Email Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[9px] text-slate-400">
                  Cryptographically secured by Proofsy · RSA-2048 Digital Trust
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Send Test Email Modal */}
        <AnimatePresence>
          {testEmailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✉️</span>
                    <h3 className="text-base font-extrabold text-slate-900">Send Test Email</h3>
                  </div>
                  <button
                    onClick={() => setTestEmailModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Send a live test dispatch of <strong>&ldquo;{selected.name}&rdquo;</strong> with sample student data to check rendering in your actual mailbox.
                </p>

                <form onSubmit={handleSendTest} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Recipient Test Address</label>
                    <input
                      type="email"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setTestEmailModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={testSent}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer transition flex items-center gap-1.5"
                    >
                      {testSent ? "Test Dispatch Queued ✓" : "Send Test Now"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
