"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface CSVRow {
  [key: string]: string;
}

type WizardStep = "upload" | "preview" | "confirm" | "progress";

interface BatchStatus {
  status: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  errors: string[];
  completedAt: string | null;
}

interface CSVImportWizardProps {
  eventId: string;
  eventName: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export default function CSVImportWizard({ eventId, eventName, onComplete, onClose }: CSVImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [nameCol, setNameCol] = useState("");
  const [emailCol, setEmailCol] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV in browser for preview
  const parseCSV = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      setParseError("CSV must have a header row and at least one data row.");
      return;
    }

    const headerLine = lines[0];
    const cols = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    setHeaders(cols);

    // Auto-detect name/email columns
    const nameCandidates = cols.filter((c) => /^(name|full.?name|recipient.?name|student.?name)$/i.test(c));
    const emailCandidates = cols.filter((c) => /^(email|e.?mail|recipient.?email|student.?email)$/i.test(c));
    setNameCol(nameCandidates[0] || "");
    setEmailCol(emailCandidates[0] || "");

    const rows: CSVRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 101); i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: CSVRow = {};
      cols.forEach((col, ci) => { row[col] = values[ci] || ""; });
      rows.push(row);
    }

    setCsvData(rows);
    setParseError(null);
    setStep("preview");
  }, []);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      setParseError("Please upload a .csv, .xlsx, or .xls file.");
      return;
    }
    setFile(f);
    if (ext.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        parseCSV(e.target?.result as string);
      };
      reader.readAsText(f);
    } else {
      // Excel files (.xlsx, .xls) are fully parsed and validated by backend
      setHeaders(["Recipient Name", "Email", "(Excel Document)"]);
      setCsvData([{ "Recipient Name": "Parsed from Excel sheet", "Email": f.name }]);
      setNameCol("Recipient Name");
      setEmailCol("Email");
      setParseError(null);
      setStep("preview");
    }
  }, [parseCSV]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStep("progress");

    try {
      const res = await api.generateCertificates(eventId, file);
      if (res.success && res.data) {
        const data = res.data as unknown as { batchId: string; totalRowsProcessed: number };
        setBatchId(data.batchId);
        setBatchStatus({
          status: "queued",
          totalCount: data.totalRowsProcessed,
          completedCount: 0,
          failedCount: 0,
          pendingCount: data.totalRowsProcessed,
          errors: [],
          completedAt: null,
        });
      } else {
        const anyRes = res as unknown as { error?: string; rowErrors?: Array<{ row: number; error: string }> };
        const baseError = anyRes.error || "Upload failed";
        if (anyRes.rowErrors && anyRes.rowErrors.length > 0) {
          const formatted = anyRes.rowErrors.map((r) => `Row ${r.row}: ${r.error}`).slice(0, 5).join("; ");
          setParseError(`${baseError} — ${formatted}`);
        } else {
          setParseError(baseError);
        }
        setStep("confirm");
      }
    } catch {
      setParseError("Network error during upload");
      setStep("confirm");
    }
    setUploading(false);
  };

  // Poll batch status
  useEffect(() => {
    if (!batchId || step !== "progress") return;
    const interval = setInterval(async () => {
      const res = await api.getBatchStatus(batchId);
      if (res.success && res.data) {
        setBatchStatus({
          status: res.data.status,
          totalCount: res.data.totalCount,
          completedCount: res.data.completedCount,
          failedCount: res.data.failedCount,
          pendingCount: res.data.pendingCount,
          errors: res.data.errors || [],
          completedAt: res.data.completedAt,
        });
        if (res.data.status === "completed" || res.data.status === "failed") {
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [batchId, step]);

  const progress = batchStatus && batchStatus.totalCount > 0
    ? Math.round(((batchStatus.completedCount + batchStatus.failedCount) / batchStatus.totalCount) * 100)
    : 0;

  const isComplete = batchStatus?.status === "completed" || batchStatus?.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">
              {step === "upload" && "Import Recipients"}
              {step === "preview" && "Preview & Map Columns"}
              {step === "confirm" && "Confirm Generation"}
              {step === "progress" && "Generating Certificates"}
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Event: {eventName}</p>
          </div>
          {!uploading && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)] cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
          <div className="flex items-center gap-3">
            {(["upload", "preview", "confirm", "progress"] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s ? "bg-[var(--color-primary)] text-white" :
                  (["upload", "preview", "confirm", "progress"].indexOf(step) > i ? "bg-emerald-500 text-white" : "bg-[var(--color-border)] text-[var(--color-muted)]")
                }`}>
                  {["upload", "preview", "confirm", "progress"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                <span className={`text-[11px] font-medium ${step === s ? "text-[var(--color-foreground)]" : "text-[var(--color-muted)]"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {i < 3 && <div className="w-8 h-px bg-[var(--color-border)]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-faint)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-base font-semibold text-[var(--color-foreground)]">Drop your CSV file here</p>
                  <p className="text-sm text-[var(--color-muted)] mt-1">or click to browse</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-3 opacity-60">Required columns: <code className="bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded">name</code> and <code className="bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded">email</code></p>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                {parseError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{parseError}</div>
                )}
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {step === "preview" && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Name Column</label>
                    <select value={nameCol} onChange={(e) => setNameCol(e.target.value)} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
                      <option value="">Select column</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Email Column</label>
                    <select value={emailCol} onChange={(e) => setEmailCol(e.target.value)} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
                      <option value="">Select column</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-[var(--color-border)] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--color-surface-alt)] sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-[var(--color-muted)] text-[10px] uppercase">#</th>
                        {headers.map((h) => (
                          <th key={h} className={`px-3 py-2 font-semibold text-[10px] uppercase ${
                            h === nameCol || h === emailCol ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                          }`}>
                            {h}
                            {h === nameCol && " 👤"}
                            {h === emailCol && " 📧"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {csvData.slice(0, 20).map((row, i) => (
                        <tr key={i} className="hover:bg-[var(--color-surface-alt)]">
                          <td className="px-3 py-2 text-[var(--color-muted)]">{i + 1}</td>
                          {headers.map((h) => (
                            <td key={h} className={`px-3 py-2 ${h === nameCol || h === emailCol ? "font-medium text-[var(--color-foreground)]" : "text-[var(--color-muted)]"}`}>
                              {row[h] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 20 && (
                  <p className="text-[11px] text-[var(--color-muted)] mt-2">Showing first 20 of {csvData.length} rows</p>
                )}

                <div className="flex justify-between items-center mt-5">
                  <button onClick={() => { setStep("upload"); setFile(null); setCsvData([]); }} className="px-4 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer">
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={!nameCol || !emailCol}
                    className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[var(--color-surface-alt)] rounded-xl p-5 mb-5">
                  <h4 className="text-sm font-bold text-[var(--color-foreground)] mb-3">Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[var(--color-muted)]">File</p>
                      <p className="font-medium">{file?.name}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted)]">Recipients</p>
                      <p className="font-medium">{csvData.length}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted)]">Name column</p>
                      <p className="font-medium">{nameCol}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-muted)]">Email column</p>
                      <p className="font-medium">{emailCol}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5">
                  ⚠️ This will generate <strong>{csvData.length}</strong> certificate(s) for event &quot;{eventName}&quot;. Each certificate uses 1 credit.
                </div>

                {parseError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-5">{parseError}</div>
                )}

                <div className="flex justify-between items-center">
                  <button onClick={() => setStep("preview")} className="px-4 py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer">
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmUpload}
                    disabled={uploading}
                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Uploading...
                      </>
                    ) : (
                      <>🚀 Generate Certificates</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Progress */}
            {step === "progress" && batchStatus && (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-6">
                  {isComplete ? (
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                      batchStatus.failedCount > 0 ? "bg-amber-100" : "bg-emerald-100"
                    }`}>
                      {batchStatus.failedCount > 0 ? (
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                      ) : (
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    </div>
                  )}
                  <h4 className="text-lg font-bold text-[var(--color-foreground)]">
                    {isComplete ? "Generation Complete!" : "Generating Certificates..."}
                  </h4>
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-1.5">
                    <span>{progress}% complete</span>
                    <span>{batchStatus.completedCount + batchStatus.failedCount} / {batchStatus.totalCount}</span>
                  </div>
                  <div className="w-full h-3 bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete && batchStatus.failedCount === 0 ? "bg-emerald-500" :
                        isComplete && batchStatus.failedCount > 0 ? "bg-amber-500" :
                        "bg-indigo-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{batchStatus.completedCount}</p>
                    <p className="text-[10px] font-semibold uppercase text-emerald-600">Generated</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{batchStatus.pendingCount}</p>
                    <p className="text-[10px] font-semibold uppercase text-amber-600">Pending</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{batchStatus.failedCount}</p>
                    <p className="text-[10px] font-semibold uppercase text-red-600">Failed</p>
                  </div>
                </div>

                {/* Errors */}
                {batchStatus.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                    {batchStatus.errors.slice(0, 10).map((e, i) => (
                      <p key={i} className="text-[11px] text-red-600">{e}</p>
                    ))}
                  </div>
                )}

                {isComplete && (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => { onComplete?.(); onClose?.(); }}
                      className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
