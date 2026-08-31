"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDesignerStore } from "@/store/designer/useDesignerStore";
import { parsePdfStructure } from "@/services/designer/pdf/pdfParser";
import { renderPdfPageToHighResImage } from "@/services/designer/pdf/rasterFallback";
import { calculateFidelityReport } from "@/services/designer/pdf/fidelityScorer";
import { suggestCertificateVariables } from "@/services/designer/variables/variableSuggester";
import { downloadTemplatePdf } from "@/services/designer/pdf/pdfExporter";
import { exportDirectlyToProofsy } from "@/services/designer/api/proofsyExport";
import { ProofsyTemplate } from "@/types/designer/template";
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileUp,
  Eye,
  Download,
  Share2,
  Sparkles,
  ShieldCheck,
  Plus,
  Send,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Bot,
  ArrowLeft,
} from "lucide-react";

interface TopBarProps {
  onOpenPreview: () => void;
  onOpenReport: () => void;
  onOpenAgentModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenPreview, onOpenReport, onOpenAgentModal }) => {
  const router = useRouter();
  const {
    template,
    setTemplate,
    undo,
    redo,
    historyIndex,
    history,
    zoom,
    setZoom,
    setPanOffset,
    reconstructionReport,
    setReconstructionReport,
    setIsAnalyzing,
    isAnalyzing,
    analysisProgressText,
    viewMode,
    setViewMode,
    sampleData,
  } = useDesignerStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportingProofsy, setIsExportingProofsy] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [proofsyExportSuccess, setProofsyExportSuccess] = useState<string | null>(null);
  const [proofsyExportError, setProofsyExportError] = useState<string | null>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Handle PDF Upload & Multi-Tier Analysis
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true, "Reading PDF document structure...");
      const arrayBuffer = await file.arrayBuffer();

      setIsAnalyzing(true, "Extracting text streams and font descriptors...");
      const extracted = await parsePdfStructure(arrayBuffer.slice(0));

      // Always render a 300 DPI high-res background to preserve logos, borders, frames, and graphics
      setIsAnalyzing(true, "Rasterizing 300 DPI high-res artwork & vector background...");
      const backgroundUrl = await renderPdfPageToHighResImage(
        arrayBuffer.slice(0),
        1,
        extracted.pageSettings.width,
        extracted.pageSettings.height
      );
      const isFallback = extracted.textElements.length < 2;

      setIsAnalyzing(true, "Evaluating structural fidelity & font availability...");
      const report = calculateFidelityReport(
        extracted.textElements,
        extracted.rawTextItems,
        extracted.detectedFontNames,
        isFallback
      );

      // Heuristic variable suggestions
      const suggestions = suggestCertificateVariables(extracted.textElements);
      report.suggestedVariables = suggestions;

      // Construct New Template
      const newTemplate: ProofsyTemplate = {
        schemaVersion: "2.0",
        id: `tpl_${Date.now().toString(36)}`,
        version: 1,
        name: file.name.replace(/\.pdf$/i, "") || "Imported Certificate Template",
        page: extracted.pageSettings,
        background: {
          type: "image",
          url: backgroundUrl,
          opacity: 1.0,
        },
        elements: extracted.textElements,
        variables: template.variables,
        fonts: extracted.detectedFontNames.map((name) => ({
          family: name,
          source: "google",
          fallbackFamily: "Inter",
        })),
        assets: [],
        createdAt: new Date().toISOString(),
      };

      setTemplate(newTemplate, true);
      setReconstructionReport(report);
      setIsAnalyzing(false);

      // Trigger Reconstruction Report Modal
      onOpenReport();
    } catch (err: any) {
      console.error("PDF Parsing Error:", err);
      alert(`Error analyzing PDF: ${err.message}`);
      setIsAnalyzing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Export template.json
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${template.name.toLowerCase().replace(/\s+/g, "_")}.template.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Direct Export as High-Resolution PDF
  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      await downloadTemplatePdf(template, sampleData);
    } catch (err: any) {
      alert(`Error generating PDF: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Direct 1-Click Export to Proofsy Platform
  const handleDirectExportProofsy = async () => {
    try {
      setIsExportingProofsy(true);
      setProofsyExportSuccess(null);
      setProofsyExportError(null);

      const result = await exportDirectlyToProofsy(template);
      if (result.success) {
        setProofsyExportSuccess(result.message || "Template saved to Proofsy! Redirecting to templates...");
        setTimeout(() => {
          router.push("/templates");
        }, 1400);
      } else {
        setProofsyExportError(result.error || "Failed to export template to Proofsy Platform");
      }
    } catch (err: any) {
      setProofsyExportError(err.message || "Error exporting template");
    } finally {
      setIsExportingProofsy(false);
    }
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
      {/* Brand Identity & Back Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/templates"
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm cursor-pointer"
          title="Return to Templates Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Proofsy</span>
        </Link>
        <div className="h-6 w-px bg-slate-800" />
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white">Proofsy</span>
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
              Template Studio
            </span>
          </div>
          <p className="text-xs text-slate-400">PDF-to-Editable Certificate Designer</p>
        </div>
      </div>

      {/* Center Tool Operations: Undo/Redo & Zoom */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-1.5 shadow-inner">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-slate-800" />

        <button
          onClick={() => setZoom(zoom - 0.1)}
          title="Zoom Out"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[48px] text-center text-xs font-semibold text-slate-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.1)}
          title="Zoom In"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          title="Reset View"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas View Mode Toggle: Artwork vs Hybrid vs Clean */}
      <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/70 p-1 text-xs">
        <button
          onClick={() => setViewMode("artwork")}
          title="Crisp Original Document with Highlighted Variables"
          className={`rounded-lg px-3 py-1 font-medium transition-all ${
            viewMode === "artwork"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Original View
        </button>
        <button
          onClick={() => setViewMode("hybrid")}
          title="Faded Guide with All Editable Form Fields"
          className={`rounded-lg px-3 py-1 font-medium transition-all ${
            viewMode === "hybrid"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Hybrid Guide
        </button>
        <button
          onClick={() => setViewMode("clean")}
          title="Pure Canvas with Reconstructed Text Only"
          className={`rounded-lg px-3 py-1 font-medium transition-all ${
            viewMode === "clean"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Clean Canvas
        </button>
      </div>

      {/* Right Actions: PDF Import, Preview, Direct Proofsy Export, PDF Export */}
      <div className="flex items-center gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handlePdfUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
        >
          <FileUp className="h-4 w-4" />
          <span>{isAnalyzing ? analysisProgressText || "Analyzing..." : "Upload PDF"}</span>
        </button>

        {/* AI Agent & SSH Integration */}
        <button
          onClick={onOpenAgentModal}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm"
        >
          <Bot className="h-4 w-4 text-indigo-400" />
          <span>AI & SSH Connect</span>
        </button>

        {/* Live Preview Modal */}
        <button
          onClick={onOpenPreview}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </button>

        {/* Direct Export as PDF */}
        <button
          onClick={handleExportPDF}
          disabled={isExportingPdf}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/25 transition-all shadow-sm"
        >
          {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          <span>{isExportingPdf ? "Generating..." : "Export as PDF"}</span>
        </button>

        {/* Direct 1-Click Export to Proofsy Platform */}
        <button
          onClick={handleDirectExportProofsy}
          disabled={isExportingProofsy}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all disabled:opacity-60"
        >
          {isExportingProofsy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>{isExportingProofsy ? "Saving..." : "Export to Proofsy"}</span>
        </button>

        {/* JSON Export Secondary Button */}
        <button
          onClick={handleExportJSON}
          title="Download Template Schema JSON"
          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Proofsy Export Success Modal Toast */}
      {proofsyExportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-white">Template Saved to Proofsy!</p>
            <p className="text-xs text-slate-400">Redirecting to templates dashboard...</p>
          </div>
          <Link
            href="/templates"
            className="ml-2 flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
          >
            <span>View Templates</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            onClick={() => setProofsyExportSuccess(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Proofsy Export Error Toast */}
      {proofsyExportError && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md">
          <div className="text-red-400 font-bold">⚠️</div>
          <div>
            <p className="text-sm font-semibold text-white">Export Notice</p>
            <p className="text-xs text-slate-300">{proofsyExportError}</p>
          </div>
          <button
            onClick={() => setProofsyExportError(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
