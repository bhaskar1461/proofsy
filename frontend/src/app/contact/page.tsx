"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  Building2, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Clock, 
  Copy, 
  Check 
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Query / Support");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const contactEmails = [
    {
      role: "Business & General Contact",
      email: "hello@proofsy.tech",
      description: "Main business inbox for partnerships, media, and general platform inquiries.",
      icon: "👋",
      badge: "General Inbox",
    },
    {
      role: "Customer & Technical Support",
      email: "support@proofsy.tech",
      description: "Dedicated assistance with event creation, bulk CSV rosters, and TrueType fonts.",
      icon: "💬",
      badge: "SLA: < 2 Hours",
    },
    {
      role: "Private Administration",
      email: "admin@proofsy.tech",
      description: "Private administration, billing adjustments, and institutional contract management.",
      icon: "🏛️",
      badge: "Institutional Access",
    },
    {
      role: "Automated App Notifications",
      email: "noreply@proofsy.tech",
      description: "Automated delivery address for event certificate PDFs, magic login links, and OTPs.",
      icon: "🚀",
      badge: "System Automated",
    },
    {
      role: "Security & Cryptographic Audit",
      email: "security@proofsy.tech",
      description: "For cryptographic verification reports, key rotation queries, and vulnerability disclosures.",
      icon: "🔒",
      badge: "24/7 Security Escalation",
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    // Simulate / send inquiry
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white font-sans relative overflow-x-hidden">
      
      {/* Soft Ambient Radiance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <span className="text-lg">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-2">
                Proofsy
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                  Support & Queries
                </span>
              </span>
              <span className="text-[10px] text-slate-500">Contact & Support Center</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
            >
              Back to Home
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              Get Started &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
            📬 Direct Support & Queries
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            How Can We Help You Today?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Have questions about certificate issuance, custom institutional branding, high-volume event passes, or API integrations? Our team is here to assist you.
          </p>
        </div>

        {/* Contact Email Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactEmails.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.role}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`mailto:${item.email}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline font-mono truncate mr-2"
                >
                  {item.email}
                </a>
                <button
                  onClick={() => handleCopy(item.email)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 text-xs transition cursor-pointer"
                  title="Copy email address"
                >
                  {copiedEmail === item.email ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Form and Office Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Inquiry Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Send Us a Direct Message</h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form below and we will get back to you within 2 to 4 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-900">Message Dispatched Successfully!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you for reaching out, <strong>{name}</strong>. Our technical support team will reply directly to <strong>{email}</strong> shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                  }}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Send another inquiry &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your Full Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your Email Address:</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Inquiry Topic:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="General Query / Support">General Query / Support</option>
                    <option value="Event Certificate Assistance">Event Certificate Creation Assistance</option>
                    <option value="Bulk CSV Import Help">Bulk CSV / Recipient Roster Import Help</option>
                    <option value="Custom Institutional Templates">Custom Institutional Templates & Fonts</option>
                    <option value="College Fest Pass / Pricing">College Fest Pass / Pricing Inquiries</option>
                    <option value="API & Webhook Integrations">API & Webhook Integrations</option>
                    <option value="Security / Key Rotation Inquiries">Security / Key Rotation Inquiries</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Detailed Message / Description:</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your question, issue, or task requirements in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl p-3.5 text-xs text-slate-900 outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Sending Query..." : "Submit Inquiry"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Quick FAQ / Info Box */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Support Hours & SLA</span>
              </h3>
              
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Technical Support:</span>
                  <span className="font-semibold text-slate-800">24 / 7 Monitoring</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email Response Time:</span>
                  <span className="font-semibold text-slate-800">&lt; 2 Hours</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Live Uptime SLA:</span>
                  <span className="font-semibold text-emerald-600">99.95% Availability</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl border border-blue-200 p-6 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                💡
              </div>
              <h4 className="text-sm font-bold text-slate-900">Need Immediate Help Creating an Event?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You can launch a certificate pipeline in under 60 seconds directly using our interactive visual studio and batch CSV dispatcher.
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1"
              >
                <span>Launch Event Creator</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white text-slate-600 text-xs mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              P
            </div>
            <div>
              <p className="text-slate-900 font-bold text-sm">Proofsy Support Network</p>
              <p className="text-[10px] text-slate-400 font-mono">contact@proofsy.tech • enterprise@proofsy.tech</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition">Home</Link>
            <Link href="/templates" className="hover:text-blue-600 transition">Templates</Link>
            <Link href="/verify" className="hover:text-blue-600 transition">Live Verifier</Link>
            <Link href="/compliance" className="hover:text-blue-600 transition">Compliance</Link>
            <Link href="/docs" className="hover:text-blue-600 transition">API Docs</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
