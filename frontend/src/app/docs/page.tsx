"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Printer, 
  ArrowUpRight, 
  ShieldCheck, 
  Scale, 
  Lock, 
  DollarSign, 
  Presentation,
  Check,
  Copy
} from "lucide-react";

interface DocItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  filename: string;
}

const DOC_ITEMS: DocItem[] = [
  {
    id: "pitch",
    title: "01. Enterprise Pitch Deck & Script",
    category: "Sales Presentation",
    icon: Presentation,
    filename: "/docs/01_Enterprise_Pitch_Deck_and_Script.md",
  },
  {
    id: "one-pager",
    title: "02. Executive Product One-Pager",
    category: "Executive Summary",
    icon: FileText,
    filename: "/docs/02_Product_One_Pager_Executive_Summary.md",
  },
  {
    id: "whitepaper",
    title: "03. Cryptographic Security Whitepaper",
    category: "Technical Security",
    icon: Lock,
    filename: "/docs/03_Cryptographic_and_Security_Whitepaper.md",
  },
  {
    id: "msa",
    title: "04. Master Services (MSA) & SLA",
    category: "Legal Contract",
    icon: Scale,
    filename: "/docs/04_Master_Services_Agreement_and_SLA.md",
  },
  {
    id: "dpa",
    title: "05. DPA (FERPA & GDPR Privacy)",
    category: "Compliance Addendum",
    icon: ShieldCheck,
    filename: "/docs/05_Data_Protection_Addendum_and_FERPA_GDPR.md",
  },
  {
    id: "pricing",
    title: "06. Pricing & Order Form Template",
    category: "Commercial Proposal",
    icon: DollarSign,
    filename: "/docs/06_Enterprise_Pricing_and_Proposal_Template.md",
  },
];

export default function EnterpriseDocsPage() {
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [markdownContent, setMarkdownContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchDoc() {
      setLoading(true);
      try {
        const res = await fetch(DOC_ITEMS[activeDocIndex].filename);
        if (res.ok) {
          const text = await res.text();
          setMarkdownContent(text);
        } else {
          setMarkdownContent("# Document Loading\nPlease view this file in your IDE or download the package.");
        }
      } catch (e) {
        setMarkdownContent("# Document Loading\nPlease view this file in your IDE or download the package.");
      } finally {
        setLoading(false);
      }
    }
    fetchDoc();
  }, [activeDocIndex]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            P
          </Link>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Proofsy Enterprise Dossier</h1>
            <p className="text-xs text-slate-400">Institutional Sales, Legal, Technical & Compliance Papers</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </button>

          <Link
            href="/"
            className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1"
          >
            <span>Live App</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-8">
        {/* Sidebar Nav */}
        <aside className="w-80 shrink-0 space-y-2 print:hidden">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 block mb-3">
            Institutional Papers
          </span>

          {DOC_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeDocIndex === idx;
            return (
              <button
                key={item.id}
                onClick={() => setActiveDocIndex(idx)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold transition-all flex items-start gap-3 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 border border-transparent hover:text-slate-200"
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${isActive ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs leading-snug">{item.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-normal">{item.category}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Rendered Document Viewport */}
        <main className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 lg:p-12 shadow-2xl backdrop-blur-sm overflow-hidden print:border-0 print:bg-white print:p-0 print:text-black">
          {loading ? (
            <div className="text-center py-20 text-slate-500 text-sm">
              Loading enterprise document...
            </div>
          ) : (
            <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-table:border-slate-800 prose-th:bg-slate-950 prose-td:border-slate-800 whitespace-pre-wrap font-sans text-xs lg:text-sm leading-relaxed">
              {markdownContent}
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
