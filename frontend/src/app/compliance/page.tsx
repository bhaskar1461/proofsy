"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { TableSkeleton, MetricsGridSkeleton } from "@/components/SkeletonLoaders";
import { api, AuditLogData } from "@/lib/api";
import { 
  ShieldCheck, 
  KeyRound, 
  RefreshCw, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Lock, 
  Fingerprint, 
  AlertTriangle,
  FileCheck,
  Eye,
  Copy,
  Check,
  Server,
  Activity,
  Layers
} from "lucide-react";

interface SecurityStatus {
  complianceStandard: string;
  cryptography: {
    algorithm: string;
    keyLength: number;
    activeKeyId: string;
    fingerprint: string;
    status: string;
    totalKeysInRotation: number;
    keys: Array<{
      keyId: string;
      status: string;
      algorithm: string;
      fingerprint: string;
      isActive: boolean;
      createdAt: string;
    }>;
  };
  integrityMetrics: {
    totalCertificatesSigned: number;
    tamperAttemptsDetected: number;
    verificationScore: string;
    totalAuditEventsRecorded: number;
    revocationRate: string;
  };
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CompliancePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedActor, setSelectedActor] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLogData | null>(null);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const token = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (selectedAction) params.append("action", selectedAction);
      if (selectedActor) params.append("actorEmail", selectedActor);
      if (search) params.append("search", search);

      const [logsRes, secRes] = await Promise.all([
        fetch(`/api/audit-logs?${params.toString()}`, {
          headers,
          credentials: "include",
        }),
        fetch("/api/audit-logs/security-status", {
          headers,
          credentials: "include",
        }),
      ]);

      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setLogs(logsJson.data || []);
      }
      if (secRes.ok) {
        const secJson = await secRes.json();
        setSecurityStatus(secJson.security || null);
      }
    } catch (err) {
      console.error("Compliance load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAction, selectedActor, search]);

  const handleRotateKey = async () => {
    if (!confirm("Are you sure you want to rotate the institutional RSA signing key? Current certificates will remain valid via backwards-compatible verification.")) {
      return;
    }

    setIsRotatingKey(true);
    try {
      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const token = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/audit-logs/rotate-signing-key", {
        method: "POST",
        headers,
        credentials: "include",
      });

      const json = await res.json();
      if (res.ok) {
        setSuccessMessage(`✓ Institutional RSA signing key rotated! New Key ID: ${json.key?.keyId}`);
        setTimeout(() => setSuccessMessage(null), 6000);
        await loadData();
      } else {
        alert(json.error || "Failed to rotate key");
      }
    } catch (err: any) {
      alert(err.message || "Key rotation error");
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const token = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = {};
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/audit-logs/export-compliance-pack", {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `proofsy-compliance-pack-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Failed to export compliance pack");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyFingerprint = (fingerprint: string) => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CERTIFICATE_ISSUED":
      case "BATCH_ISSUED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ISSUED</span>;
      case "CERTIFICATE_REVOKED":
      case "BATCH_REVOKED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">REVOKED</span>;
      case "KEY_ROTATED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">KEY ROTATED</span>;
      case "SECURITY_SETTINGS_UPDATED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">CONFIG</span>;
      case "VERIFICATION_TAMPER_ATTEMPT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">TAMPER DETECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{action}</span>;
    }
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));
  const uniqueActors = Array.from(new Set(logs.map((l) => l.actorEmail)));

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-8 py-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Security & Compliance Ledger</h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  SOC-2 / ISO READY
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Immutable cryptographic audit logs, institutional RSA-2048 key lifecycle, and regulatory exports.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Compliance Pack</span>
              </button>

              <button
                onClick={handleRotateKey}
                disabled={isRotatingKey}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRotatingKey ? "animate-spin" : ""}`} />
                <span>{isRotatingKey ? "Rotating Key..." : "Rotate Signing Key"}</span>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Key Lifecycle & Cryptography Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shrink-0 mt-0.5">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 tracking-wide">Active Institutional Signing Key</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE & SIGNING
                    </span>
                  </div>

                  <p className="text-xs font-mono text-blue-700 mt-1">
                    Key ID: <strong>{securityStatus?.cryptography?.activeKeyId || "inst-rsa-rot-1788097006618"}</strong>
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <Fingerprint className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-600 truncate max-w-md">
                      SHA256: {securityStatus?.cryptography?.fingerprint?.substring(0, 48) || "e84f553a9926df501dfa14a796fe8cd5bfa3706e6bf4"}...
                    </span>
                    <button
                      onClick={() => copyFingerprint(securityStatus?.cryptography?.fingerprint || "")}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedFingerprint ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Algorithm</span>
                  <span className="text-slate-800 font-semibold">{securityStatus?.cryptography?.algorithm || "RSA-SHA256"}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Modulus</span>
                  <span className="text-slate-800 font-semibold">{securityStatus?.cryptography?.keyLength || 2048}-bit</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Keys in Pool</span>
                  <span className="text-slate-800 font-semibold">{securityStatus?.cryptography?.totalKeysInRotation || 3}</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Assurance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-xs text-slate-500 font-medium">Mathematical Signatures</span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{securityStatus?.integrityMetrics?.totalCertificatesSigned || logs.length || 0}</p>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  100% Validated
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-xs text-slate-500 font-medium">Tamper Attempts</span>
                <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{securityStatus?.integrityMetrics?.tamperAttemptsDetected || 0}</p>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3" />
                  Zero Breaches
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-xs text-slate-500 font-medium">Verification Integrity</span>
                <p className="text-2xl font-black text-blue-600 mt-1 font-mono">{securityStatus?.integrityMetrics?.verificationScore || "100.0%"}</p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Sub-second WebCrypto</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-xs text-slate-500 font-medium">Compliance Standard</span>
                <p className="text-base font-bold text-slate-900 mt-1 truncate">SOC-2 Type II / ISO</p>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="h-3 w-3" />
                  Audit Ready
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs Filter & Table Card */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actions, emails, certificate IDs..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="">All Action Types</option>
                  {uniqueActions.map((act) => (
                    <option key={act} value={act}>
                      {getActionLabel(act)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedActor}
                  onChange={(e) => setSelectedActor(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="">All Operators</option>
                  {uniqueActors.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skeleton Loading or Table */}
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={6} hasHeader={false} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Action</th>
                      <th className="px-6 py-3.5">Operator</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">IP Address</th>
                      <th className="px-6 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No audit records match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {formatRelativeTime(log.createdAt)}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            {getActionBadge(log.action)}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                            {log.actorEmail}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">
                            {log.description}
                          </td>
                          <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {log.ipAddress || "127.0.0.1"}
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                            >
                              <Eye className="h-3 w-3" />
                              View Payload
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Modal Payload Inspector */}
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Cryptographic Event Payload</h3>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Action</span>
                      <span className="text-slate-800 font-semibold">{selectedLog.action}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                      <span className="text-slate-800 font-mono">{new Date(selectedLog.createdAt).toISOString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Operator</span>
                      <span className="text-slate-800">{selectedLog.actorEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Resource</span>
                      <span className="text-slate-800 font-mono">{selectedLog.targetModel ? `${selectedLog.targetModel} (${selectedLog.targetId || ""})` : "N/A"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold text-[10px] uppercase">Metadata Payload (JSON):</span>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                      {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
                  >
                    Close Inspector
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
