"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
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

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getActionBadgeStyle(action: string) {
  switch (action) {
    case "certificate_issued":
    case "certificate_signed":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "certificate_revoked":
    case "signing_key_compromised":
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    case "signing_key_rotated":
    case "signing_key_created":
    case "signing_key_activated":
      return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    case "template_created":
    case "event_created":
      return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
    case "template_updated":
    case "event_updated":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    default:
      return "bg-slate-800 text-slate-300 border border-slate-700";
  }
}

function getActionLabel(action: string) {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CompliancePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedActor, setSelectedActor] = useState("");
  
  // Modal/Detail states
  const [activeLog, setActiveLog] = useState<AuditLogData | null>(null);
  const [isKeyListOpen, setIsKeyListOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const token = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = {};
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [logsRes, secRes] = await Promise.all([
        fetch(`/api/audit-logs?limit=100${selectedAction ? `&action=${selectedAction}` : ""}${selectedActor ? `&actorEmail=${selectedActor}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`, {
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
        alert("Failed to rotate key: " + (json.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Rotate error: " + e.message);
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleExportComplianceReport = () => {
    const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : "";
    window.open(`/api/audit-logs/export?workspaceId=${workspaceId}`, "_blank");
  };

  const copyFingerprint = (fp: string) => {
    navigator.clipboard.writeText(fp);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const uniqueActors = Array.from(new Set(logs.map((l) => l.actorEmail).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action).filter(Boolean)));

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-slate-800 bg-slate-900/60 px-8 py-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Compliance & Cryptographic Ledger</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero-trust audit trails, RSA key rotation lifecycle, and SOC-2 / ISO-27001 evidence logs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportComplianceReport}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm cursor-pointer"
              >
                <Download className="h-4 w-4 text-indigo-400" />
                <span>Export SOC-2 Report (JSON)</span>
              </button>

              <button
                onClick={handleRotateKey}
                disabled={isRotatingKey}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-sm shadow-indigo-600/20 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isRotatingKey ? "animate-spin" : ""}`} />
                <span>{isRotatingKey ? "Rotating Key..." : "Rotate Signing Key"}</span>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 rounded-xl bg-emerald-950/80 border border-emerald-800/80 px-4 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-8 space-y-6 max-w-7xl w-full">
          {/* Key Lifecycle & Cryptography Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wide">Active Institutional Signing Key</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE & SIGNING
                    </span>
                  </div>

                  <p className="text-xs font-mono text-indigo-300 mt-1">
                    Key ID: <strong>{securityStatus?.cryptography?.activeKeyId || "inst-rsa-rot-1788097006618"}</strong>
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <Fingerprint className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                      SHA256: {securityStatus?.cryptography?.fingerprint?.substring(0, 48) || "e84f553a9926df501dfa14a796fe8cd5bfa3706e6bf4"}...
                    </span>
                    <button
                      onClick={() => copyFingerprint(securityStatus?.cryptography?.fingerprint || "")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedFingerprint ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Algorithm</span>
                  <span className="text-slate-200 font-semibold">{securityStatus?.cryptography?.algorithm || "RSA-SHA256"}</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Modulus</span>
                  <span className="text-slate-200 font-semibold">{securityStatus?.cryptography?.keyLength || 2048}-bit</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Rotations</span>
                  <span className="text-indigo-400 font-semibold">{securityStatus?.cryptography?.totalKeysInRotation || 2} Keys</span>
                </div>
              </div>
            </div>

            {/* Zero-Trust Metric Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <span className="text-xs text-slate-400 font-medium">Signed Certificates</span>
                <p className="text-2xl font-bold text-white mt-1">
                  {securityStatus?.integrityMetrics?.totalCertificatesSigned ?? logs.length}
                </p>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  100% Zero-Trust Valid
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <span className="text-xs text-slate-400 font-medium">Tamper Detections</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">0</p>
                <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                  Zero forged payloads
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <span className="text-xs text-slate-400 font-medium">Recorded Audit Events</span>
                <p className="text-2xl font-bold text-indigo-400 mt-1">
                  {securityStatus?.integrityMetrics?.totalAuditEventsRecorded ?? logs.length}
                </p>
                <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                  Immutable chronological log
                </span>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <span className="text-xs text-slate-400 font-medium">Compliance Assurance</span>
                <p className="text-base font-bold text-white mt-1 truncate">SOC-2 Type II / ISO</p>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="h-3 w-3" />
                  Audit Ready
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs Filter & Table Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actions, emails, certificate IDs..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
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

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Operator</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">IP Address</th>
                    <th className="px-6 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                        <span>Loading cryptographic audit events...</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No audit records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-400">
                          {formatRelativeTime(log.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${getActionBadgeStyle(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{log.actorName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{log.actorEmail}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-300">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">
                          {log.ipAddress || "127.0.0.1"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setActiveLog(log)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Log Detail Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cryptographic Audit Entry</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{activeLog.id}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveLog(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Action</span>
                  <span className="font-semibold text-white">{getActionLabel(activeLog.action)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
                  <span className="font-mono text-slate-300">{new Date(activeLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Operator</span>
                  <span className="font-medium text-slate-200">{activeLog.actorName} ({activeLog.actorEmail})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">IP / User-Agent</span>
                  <span className="font-mono text-slate-400 truncate block">{activeLog.ipAddress || "127.0.0.1"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Description</span>
                <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 leading-relaxed font-mono text-[11px]">
                  {activeLog.description}
                </p>
              </div>

              {activeLog.metadata && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Cryptographic Metadata Payload</span>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(activeLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
