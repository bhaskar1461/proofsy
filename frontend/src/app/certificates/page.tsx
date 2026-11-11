"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/SkeletonLoaders";
import { api, CertificateData, CertificateStatus } from "@/lib/api";
import { pageVariants, headerSlide, tableRow, pulseGlow } from "@/lib/animations";

type StatusFilter = "all" | CertificateStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string; dotColor: string }[] = [
  { value: "all", label: "All", color: "bg-[var(--color-surface-alt)] text-[var(--color-foreground)]", dotColor: "" },
  { value: "generated", label: "Generated", color: "bg-emerald-50 text-emerald-700", dotColor: "bg-emerald-500" },
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700", dotColor: "bg-amber-500" },
  { value: "failed", label: "Failed", color: "bg-red-50 text-red-700", dotColor: "bg-red-500" },
  { value: "revoked", label: "Revoked", color: "bg-red-50 text-red-600", dotColor: "bg-red-400" },
  { value: "expired", label: "Expired", color: "bg-slate-100 text-slate-600", dotColor: "bg-slate-400" },
  { value: "suspended", label: "Suspended", color: "bg-orange-50 text-orange-600", dotColor: "bg-orange-400" },
];

export default function CertificatesListPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCertificates = useCallback(async () => {
    const res = await api.listCertificates();
    if (res.success && res.data) {
      setCertificates(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCertificates(); }, [loadCertificates]);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: certificates.length };
    for (const c of certificates) {
      counts[c.status] = (counts[c.status] || 0) + 1;
    }
    return counts;
  }, [certificates]);

  // Filter
  const filteredCertificates = useMemo(() => {
    let result = certificates;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((c) =>
        [c.verificationCode, c.recipientName, c.recipientEmail, c.eventName]
          .join(" ").toLowerCase().includes(q)
      );
    }
    return result;
  }, [certificates, statusFilter, query]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCertificates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCertificates.map((c) => c.id)));
    }
  };

  // Bulk actions
  const handleBulkRevoke = async () => {
    if (selectedIds.size === 0) return;
    setBulkAction("revoking");
    const res = await api.bulkRevokeCertificates(Array.from(selectedIds), "Bulk revocation");
    if (res.success) {
      setActionResult({ type: "success", text: `Revoked ${selectedIds.size} certificate(s)` });
      setSelectedIds(new Set());
      await loadCertificates();
    } else {
      setActionResult({ type: "error", text: res.error || "Revocation failed" });
    }
    setBulkAction(null);
  };

  const handleRetry = async (id: string) => {
    const res = await api.retryCertificate(id);
    if (res.success) {
      setActionResult({ type: "success", text: "Certificate retry queued" });
      await loadCertificates();
    } else {
      setActionResult({ type: "error", text: res.error || "Retry failed" });
    }
  };

  // Status badge
  const statusBadge = (status: CertificateStatus) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${opt.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor} ${status === "pending" ? "animate-pulse" : ""}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Auto-dismiss action result
  useEffect(() => {
    if (actionResult) {
      const t = setTimeout(() => setActionResult(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionResult]);

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <motion.div variants={pulseGlow} animate="animate" className="absolute top-20 right-16 w-60 h-60 bg-emerald-200/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <motion.header variants={headerSlide} initial="hidden" animate="visible" className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[var(--color-border)] px-8 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">Certificate Management</h2>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {certificates.length} total credential{certificates.length !== 1 ? "s" : ""} issued
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--color-primary)]">{selectedIds.size} selected</span>
                <button
                  onClick={handleBulkRevoke}
                  disabled={bulkAction === "revoking"}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer transition-all disabled:opacity-50"
                >
                  {bulkAction === "revoking" ? "Revoking..." : "Revoke Selected"}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
            <Link href="/events/new" className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl hover:bg-[var(--color-primary-dark)] font-semibold text-sm shadow-sm flex items-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Issue New
            </Link>
          </div>
        </motion.header>

        {/* Action Result Toast */}
        <AnimatePresence>
          {actionResult && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium ${
                actionResult.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {actionResult.type === "success" ? "✓ " : "✗ "}{actionResult.text}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="px-8 py-6 relative z-[1]">
          {loading ? (
            <TableSkeleton rows={8} />
          ) : certificates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] px-6 py-16 text-center">
              <svg className="w-14 h-14 mx-auto text-[var(--color-muted)] opacity-25 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
              <p className="text-base font-semibold text-[var(--color-foreground)]">No credentials issued yet</p>
              <p className="text-sm text-[var(--color-muted)] mt-1 max-w-sm mx-auto">Create an event and add recipients to start issuing certificates.</p>
              <Link href="/events/new" className="inline-flex items-center gap-2 mt-5 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Create Event
              </Link>
            </div>
          ) : (
            <>
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {STATUS_OPTIONS.map((opt) => {
                  const count = statusCounts[opt.value] || 0;
                  if (opt.value !== "all" && count === 0) return null;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); setSelectedIds(new Set()); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                        statusFilter === opt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-faint)] text-[var(--color-primary)] shadow-sm"
                          : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-border-strong)]"
                      }`}
                    >
                      {opt.dotColor && <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor}`} />}
                      {opt.label}
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
                {/* Search + Count Bar */}
                <div className="px-6 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                  <p className="text-sm text-[var(--color-muted)]">
                    {filteredCertificates.length} credential{filteredCertificates.length !== 1 ? "s" : ""}
                    {statusFilter !== "all" && ` (${statusFilter})`}
                  </p>
                  <div className="relative">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      type="text"
                      placeholder="Search by name, email, code..."
                      className="border border-[var(--color-border)] rounded-lg pl-9 pr-4 py-1.5 text-xs w-64 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20"
                    />
                  </div>
                </div>

                {filteredCertificates.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-base font-semibold text-[var(--color-foreground)]">No matching credentials</p>
                    <p className="text-sm text-[var(--color-muted)] mt-1">Try a different search or filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--color-surface-alt)]">
                          <th className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={selectedIds.size === filteredCertificates.length && filteredCertificates.length > 0}
                              onChange={toggleSelectAll}
                              className="w-3.5 h-3.5 rounded cursor-pointer accent-[var(--color-primary)]"
                            />
                          </th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Code</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Recipient</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Event</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Issued</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Status</th>
                          <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {filteredCertificates.map((c, i) => (
                          <motion.tr
                            key={c.id}
                            variants={tableRow}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: i * 0.02 }}
                            className={`group hover:bg-[var(--color-surface-alt)] cursor-pointer ${selectedIds.has(c.id) ? "bg-indigo-50/50" : ""}`}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)}
                                className="w-3.5 h-3.5 rounded cursor-pointer accent-[var(--color-primary)]"
                              />
                            </td>
                            <td className="px-4 py-3" onClick={() => router.push(`/certificates/${c.id}`)}>
                              <span className="font-mono text-xs font-semibold text-[var(--color-primary)]">{c.verificationCode}</span>
                            </td>
                            <td className="px-4 py-3" onClick={() => router.push(`/certificates/${c.id}`)}>
                              <p className="text-sm font-medium text-[var(--color-foreground)]">{c.recipientName}</p>
                              <p className="text-[11px] text-[var(--color-muted)]">{c.recipientEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--color-muted)]" onClick={() => router.push(`/certificates/${c.id}`)}>{c.eventName}</td>
                            <td className="px-4 py-3 text-xs text-[var(--color-muted)]" onClick={() => router.push(`/certificates/${c.id}`)}>{formatDate(c.issuedAt)}</td>
                            <td className="px-4 py-3" onClick={() => router.push(`/certificates/${c.id}`)}>{statusBadge(c.status)}</td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {c.pdfUrl && (
                                  <a
                                    href={c.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Download PDF"
                                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                  </a>
                                )}
                                {c.status === "failed" && (
                                  <button
                                    onClick={() => handleRetry(c.id)}
                                    title="Retry generation"
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-all cursor-pointer"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => router.push(`/certificates/${c.id}`)}
                                  title="View details"
                                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-all cursor-pointer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
