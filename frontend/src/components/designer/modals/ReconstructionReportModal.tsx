"use client";

import React, { useState } from "react";
import { useDesignerStore } from "@/store/designer/useDesignerStore";
import { ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, X } from "lucide-react";

interface ReconstructionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReconstructionReportModal: React.FC<ReconstructionReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { reconstructionReport, applyVariableSuggestions } = useDesignerStore();

  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Record<string, boolean>>({});

  if (!isOpen || !reconstructionReport) return null;

  const handleToggleSuggestion = (id: string) => {
    setAcceptedSuggestions((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const handleApplyAndClose = () => {
    const toApply = (reconstructionReport.suggestedVariables || [])
      .filter((s) => (acceptedSuggestions[s.elementId] ?? s.accepted))
      .map((s) => ({
        elementId: s.elementId,
        variableKey: s.suggestedVariableKey,
      }));

    applyVariableSuggestions(toApply);
    onClose();
  };

  const { classification, overallQuality, textFidelity, fontFidelity, layoutFidelity, detectedFonts, suggestedVariables, warnings } =
    reconstructionReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">PDF Reconstruction Report</h2>
              <p className="text-xs text-slate-400">Structural extraction & typography analysis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quality Score Hero Card */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">Classification Level</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-black tracking-wide ${
                    classification === "DETECTED"
                      ? "text-emerald-400"
                      : classification === "APPROXIMATED"
                      ? "text-amber-400"
                      : "text-blue-400"
                  }`}
                >
                  {classification}
                </span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                  {overallQuality}% Fidelity
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {classification === "DETECTED"
                  ? "Full structural vector extraction successful. Text and typography directly editable."
                  : classification === "APPROXIMATED"
                  ? "Vector text extracted with font substitutions applied."
                  : "Flattened or scanned document. High-resolution 300 DPI canvas loaded with editable overlays."}
              </p>
            </div>

            {/* Score Breakdown Pills */}
            <div className="grid grid-cols-2 gap-2 text-right">
              <div className="rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Text</div>
                <div className="text-xs font-bold text-slate-200">{textFidelity}%</div>
              </div>
              <div className="rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Fonts</div>
                <div className="text-xs font-bold text-slate-200">{fontFidelity}%</div>
              </div>
              <div className="rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Layout</div>
                <div className="text-xs font-bold text-slate-200">{layoutFidelity}%</div>
              </div>
              <div className="rounded-lg bg-slate-900 px-3 py-1.5 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Pages</div>
                <div className="text-xs font-bold text-slate-200">1 (A4)</div>
              </div>
            </div>
          </div>

          {/* Suggested Dynamic Variables */}
          {suggestedVariables && suggestedVariables.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-wider uppercase text-indigo-400">
                Detected Certificate Variables (Review & Confirm)
              </h3>
              <p className="text-xs text-slate-400">
                We detected the following fields in the PDF. Select the variables you want to automatically bind:
              </p>

              <div className="space-y-2">
                {suggestedVariables.map((s) => {
                  const isChecked = acceptedSuggestions[s.elementId] ?? s.accepted;
                  return (
                    <label
                      key={s.elementId}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 p-3 hover:border-indigo-500/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSuggestion(s.elementId)}
                          className="h-4 w-4 rounded accent-indigo-600"
                        />
                        <div>
                          <div className="text-xs font-medium text-white">
                            &ldquo;{s.detectedText}&rdquo;
                          </div>
                          <div className="text-[11px] text-indigo-400 font-mono">
                            → {`{{${s.suggestedVariableKey}}}`} ({s.suggestedLabel})
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-500">
                        {Math.round(s.confidence * 100)}% match
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings & Font Matrix */}
          {warnings && warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Font & Formatting Notices</span>
              </h3>
              <div className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                {warnings.map((w, idx) => (
                  <div key={idx}>• {w}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/60 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAndClose}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Open in Editor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
