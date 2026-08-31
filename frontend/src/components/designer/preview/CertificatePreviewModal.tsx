"use client";

import React, { useState } from "react";
import { useDesignerStore } from "@/store/designer/useDesignerStore";
import { downloadTemplatePdf } from "@/services/designer/pdf/pdfExporter";
import { Eye, Download, Printer, X, Sparkles, QrCode, PenTool, Award } from "lucide-react";

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { template, sampleData, setSampleData } = useDesignerStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleDataChange = (key: string, value: string) => {
    setSampleData({
      ...sampleData,
      [key]: value,
    });
  };

  // Generate real vector PDF with downloadTemplatePdf
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadTemplatePdf(template, sampleData);
    } catch (err: any) {
      console.error("PDF Download Error:", err);
      alert(`Error generating PDF: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const { page, background, elements } = template;
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Certificate Preview</h2>
              <p className="text-xs text-slate-400">Rendered with dynamic recipient data injection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Preview</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Download className="h-4 w-4" />
              <span>{isGeneratingPdf ? "Rendering PDF..." : "Download Sample PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Data Injector + Right Preview Canvas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sample Data Injector Panel */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/60 p-5 overflow-y-auto space-y-4">
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Inject Sample Data</span>
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Change values below to see the template update in real-time.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Student / Recipient</label>
                <input
                  type="text"
                  value={sampleData["student_name"] || ""}
                  onChange={(e) => handleDataChange("student_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Course / Event Title</label>
                <input
                  type="text"
                  value={sampleData["course_name"] || ""}
                  onChange={(e) => handleDataChange("course_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Issue Date</label>
                <input
                  type="text"
                  value={sampleData["issue_date"] || ""}
                  onChange={(e) => handleDataChange("issue_date", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Credential Code</label>
                <input
                  type="text"
                  value={sampleData["certificate_id"] || ""}
                  onChange={(e) => handleDataChange("certificate_id", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-indigo-300 font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Signatory Name</label>
                <input
                  type="text"
                  value={sampleData["issuer_name"] || ""}
                  onChange={(e) => handleDataChange("issuer_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Right Preview Viewport */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-950 p-6">
            <div
              className="relative shadow-2xl overflow-hidden rounded-sm bg-white"
              style={{
                width: `${page.width * 0.72}px`,
                height: `${page.height * 0.72}px`,
                transform: "scale(1.0)",
                transformOrigin: "center center",
              }}
            >
              {/* Background */}
              {background.url && (
                <img
                  src={background.url}
                  alt="Background"
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                  style={{ opacity: background.opacity ?? 1.0 }}
                />
              )}

              {/* Elements with Injected Data */}
              <div
                className="absolute inset-0"
                style={{
                  transform: "scale(0.72)",
                  transformOrigin: "top left",
                  width: `${page.width}px`,
                  height: `${page.height}px`,
                }}
              >
                {sortedElements.map((el) => {
                  if (el.isHidden) return null;

                  return (
                    <div
                      key={el.id}
                      className="absolute"
                      style={{
                        left: `${el.textAlign === "center" ? el.x - el.width / 2 : el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        transformOrigin: "center center",
                        opacity: el.opacity ?? 1.0,
                        zIndex: el.zIndex,
                      }}
                    >
                      {(el.type === "text" || el.type === "variable_text") && (
                        <div
                          className="h-full w-full"
                          style={{
                            fontFamily: el.fontFamily || "Inter",
                            fontSize: `${el.fontSize || 24}px`,
                            fontWeight: el.fontWeight || "normal",
                            fontStyle: el.fontStyle || "normal",
                            color: el.color || "#0F172A",
                            textAlign: el.textAlign || "center",
                            letterSpacing: `${el.letterSpacing || 0}px`,
                            lineHeight: el.lineHeight || 1.2,
                            textTransform: el.textTransform || "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              el.textAlign === "left"
                                ? "flex-start"
                                : el.textAlign === "right"
                                ? "flex-end"
                                : "center",
                          }}
                        >
                          {el.type === "variable_text" && el.variableKey
                            ? sampleData[el.variableKey] || el.fallbackText || `{{${el.variableKey}}}`
                            : el.text}
                        </div>
                      )}

                      {el.type === "image" && el.assetUrl && (
                        <img src={el.assetUrl} alt="Asset" className="h-full w-full object-contain" />
                      )}

                      {el.type === "shape_rect" && (
                        <div
                          className="h-full w-full"
                          style={{
                            backgroundColor: el.fillColor || "transparent",
                            borderColor: el.strokeColor || "#000000",
                            borderWidth: `${el.strokeWidth || 1}px`,
                            borderRadius: `${el.borderRadius || 0}px`,
                          }}
                        />
                      )}

                      {el.type === "shape_line" && (
                        <div
                          className="w-full"
                          style={{
                            marginTop: `${(el.height || 2) / 2}px`,
                            borderTopColor: el.strokeColor || "#000000",
                            borderTopWidth: `${el.strokeWidth || 2}px`,
                            borderTopStyle: "solid",
                          }}
                        />
                      )}

                      {el.type === "qr_placeholder" && (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-indigo-600 bg-white p-2 text-indigo-700 shadow-md">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <QrCode className="h-7 w-7" />
                          </div>
                          <span className="mt-1 font-mono text-[9px] font-bold text-slate-800">
                            {sampleData["certificate_id"] || "PROOF-2026-X89K9"}
                          </span>
                        </div>
                      )}

                      {el.type === "signature_placeholder" && (
                        <div className="flex h-full w-full flex-col items-center justify-end text-center">
                          <div className="mb-2 font-serif text-lg italic text-slate-700">
                            {sampleData["issuer_name"] || el.signatureConfig?.signerName || "Dr. Sarah Jenkins"}
                          </div>
                          <div className="h-0.5 w-full bg-slate-800" />
                          <span className="mt-1.5 text-xs font-semibold text-slate-800">
                            {sampleData["issuer_name"] || el.signatureConfig?.signerName || "Signatory Name"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {el.signatureConfig?.signerDesignation || "Dean of Academic Affairs"}
                          </span>
                        </div>
                      )}

                      {el.type === "seal_placeholder" && (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-amber-500 bg-amber-50 p-2 text-amber-700 shadow-md">
                          <Award className="h-8 w-8 text-amber-600" />
                          <span className="text-[8px] font-black tracking-wider uppercase text-amber-900">
                            VERIFIED
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
