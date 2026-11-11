"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { api, BACKEND_URL, BrandingData } from "@/lib/api";

const defaultBranding: BrandingData = {
  logo: "",
  primaryColor: "#2563EB",
  accentColor: "#16A34A",
  customDomain: "",
  brandingEnabled: true,
  verificationPageTitle: "Official Institutional Verification",
  footerText: "Cryptographically verified by Proofsy Zero-Trust Infrastructure.",
};

const brandPresets = [
  { name: "Proofsy Royal", primary: "#2563EB", accent: "#10B981" },
  { name: "Crimson Red", primary: "#A31F34", accent: "#8A8B8C" },
  { name: "Cardinal Rose", primary: "#8C1515", accent: "#B269A0" },
  { name: "Deep Navy", primary: "#002147", accent: "#C59B27" },
  { name: "Emerald Tech", primary: "#059669", accent: "#3B82F6" },
  { name: "Executive Onyx", primary: "#0F172A", accent: "#D97706" },
];

export default function BrandingSettingsPage() {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Proofsy Academy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"card" | "mobile">("card");

  useEffect(() => {
    async function loadBranding() {
      let activeWorkspaceId = localStorage.getItem("proofsy_workspace_id") || "";
      if (!activeWorkspaceId) {
        const workspaces = await api.listWorkspaces();
        if (workspaces.success && workspaces.data?.[0]?._id) {
          activeWorkspaceId = workspaces.data[0]._id;
          localStorage.setItem("proofsy_workspace_id", activeWorkspaceId);
        }
      }

      if (!activeWorkspaceId) {
        setError("No active workspace found. Create a workspace first.");
        setLoading(false);
        return;
      }

      setWorkspaceId(activeWorkspaceId);
      const res = await api.getBranding(activeWorkspaceId);
      if (res.success && res.data) {
        setWorkspaceName(res.data.workspaceName || "Proofsy Academy");
        setBranding({
          ...defaultBranding,
          ...res.data.branding,
          workspaceId: res.data.workspaceId,
          workspaceName: res.data.workspaceName,
        });
      } else {
        setError(res.error || "Unable to load branding settings.");
      }
      setLoading(false);
    }

    loadBranding();
  }, []);

  const updateField = (field: keyof BrandingData, value: string | boolean) => {
    setBranding((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  };

  const applyPreset = (primary: string, accent: string) => {
    setBranding((current) => ({
      ...current,
      primaryColor: primary,
      accentColor: accent,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await api.updateBranding({
      logo: branding.logo,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      customDomain: branding.customDomain,
      brandingEnabled: branding.brandingEnabled,
      verificationPageTitle: branding.verificationPageTitle,
      footerText: branding.footerText,
    });

    if (res.success && res.data) {
      setBranding({
        ...defaultBranding,
        ...res.data.branding,
        workspaceId: res.data.workspaceId,
        workspaceName: res.data.workspaceName,
      });
      setMessage("✓ Institutional branding saved and synchronized live.");
    } else {
      setError(res.error || "Failed to save branding settings.");
    }
    setSaving(false);
  };

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    const res = await api.uploadBrandingLogo(file);
    if (res.success && res.data) {
      setBranding((current) => ({ ...current, ...res.data!.branding }));
      setMessage("✓ Official logo uploaded and applied.");
    } else {
      setError(res.error || "Failed to upload logo.");
    }
    setUploading(false);
  };

  const logoSrc = branding.logo && branding.logo.startsWith("/storage")
    ? `${BACKEND_URL}${branding.logo}`
    : branding.logo;

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[var(--color-border)] px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">Institutional Branding Studio</h1>
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              White-label your public certificate verification portal for <span className="font-semibold text-[var(--color-foreground)]">{workspaceName}</span>.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !workspaceId}
            className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-dark)] cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving...
              </>
            ) : (
              "Publish Branding Live"
            )}
          </button>
        </header>

        <div className="px-8 py-8">
          {loading ? (
            <div className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-16 text-center text-sm text-[var(--color-muted)]">
              Loading branding controls...
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_460px] gap-8">
              {/* Left Column: Form Controls */}
              <div className="space-y-6">
                {/* Status Message */}
                {message && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-semibold">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-semibold">
                    {error}
                  </div>
                )}

                {/* Main Card */}
                <section className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--color-foreground)]">Custom Appearance & Identity</h2>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5">Applied to all public verification pages & certificates.</p>
                    </div>
                    <label className="flex items-center gap-2.5 text-xs font-bold text-[var(--color-foreground)] cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                      <input
                        type="checkbox"
                        checked={branding.brandingEnabled}
                        onChange={(e) => updateField("brandingEnabled", e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                      />
                      Enable Custom Branding
                    </label>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Palette Presets */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                        Institutional Palette Presets
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {brandPresets.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => applyPreset(preset.primary, preset.accent)}
                            className="flex flex-col items-center p-2 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all cursor-pointer text-center group"
                          >
                            <div className="flex items-center gap-1 mb-1.5">
                              <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: preset.primary }} />
                              <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: preset.accent }} />
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--color-muted)] group-hover:text-[var(--color-foreground)] truncate w-full">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary and Accent Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                          Primary Brand Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={branding.primaryColor}
                            onChange={(e) => updateField("primaryColor", e.target.value)}
                            className="h-11 w-14 rounded-xl border border-[var(--color-border)] cursor-pointer p-0.5 bg-white"
                          />
                          <input
                            value={branding.primaryColor}
                            onChange={(e) => updateField("primaryColor", e.target.value)}
                            className="flex-1 border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                          Accent / Seal Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={branding.accentColor}
                            onChange={(e) => updateField("accentColor", e.target.value)}
                            className="h-11 w-14 rounded-xl border border-[var(--color-border)] cursor-pointer p-0.5 bg-white"
                          />
                          <input
                            value={branding.accentColor}
                            onChange={(e) => updateField("accentColor", e.target.value)}
                            className="flex-1 border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo & Crest */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                        Official Crest / Logo
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          value={branding.logo}
                          onChange={(e) => updateField("logo", e.target.value)}
                          placeholder="https://your-institution.edu/logo.png"
                          className="flex-1 border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />
                        <label className="inline-flex items-center justify-center cursor-pointer border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-alt)] bg-white shadow-sm shrink-0">
                          {uploading ? "Uploading..." : "Upload Logo"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                        </label>
                      </div>
                    </div>

                    {/* Portal Title & Custom Domain */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                          Verification Page Title
                        </label>
                        <input
                          value={branding.verificationPageTitle}
                          onChange={(e) => updateField("verificationPageTitle", e.target.value)}
                          placeholder="Official Credential Verification"
                          className="w-full border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                          Custom Subdomain / Host
                        </label>
                        <input
                          value={branding.customDomain}
                          onChange={(e) => updateField("customDomain", e.target.value)}
                          placeholder="credentials.yourdomain.edu"
                          className="w-full border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] font-mono"
                        />
                      </div>
                    </div>

                    {/* Footer Text */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                        Verification Footer & Accreditation Text
                      </label>
                      <textarea
                        rows={2}
                        value={branding.footerText}
                        onChange={(e) => updateField("footerText", e.target.value)}
                        placeholder="Issued by Proofsy Academy. Cryptographically certified by Proofsy."
                        className="w-full border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)] resize-none"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Live Verification Portal Preview */}
              <aside className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-[var(--color-foreground)]">Live Verification Preview</h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-[var(--color-border)]">
                    <button
                      onClick={() => setPreviewViewport("card")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${previewViewport === "card" ? "bg-white shadow-xs text-[var(--color-foreground)]" : "text-[var(--color-muted)]"}`}
                    >
                      Card
                    </button>
                    <button
                      onClick={() => setPreviewViewport("mobile")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${previewViewport === "mobile" ? "bg-white shadow-xs text-[var(--color-foreground)]" : "text-[var(--color-muted)]"}`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
                  {/* Outer preview frame */}
                  <div
                    className={`rounded-2xl border transition-all overflow-hidden mx-auto ${previewViewport === "mobile" ? "max-w-[320px] shadow-lg" : "w-full"}`}
                    style={{ borderColor: branding.brandingEnabled ? branding.primaryColor : "#E2E8F0" }}
                  >
                    {/* Header Bar */}
                    <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: `${branding.primaryColor}14` }}>
                      {logoSrc ? (
                        <img src={logoSrc} alt={workspaceName} className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-1" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-bold shadow-sm"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          {workspaceName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate" style={{ color: branding.primaryColor }}>
                          {branding.verificationPageTitle || "Credential Verification"}
                        </p>
                        <p className="text-[11px] text-[var(--color-muted)] truncate">{workspaceName}</p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4 bg-white">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Verified Recipient</p>
                        <p className="text-base font-bold text-[var(--color-foreground)]">Bhaskar Sharma</p>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Program Title</p>
                        <p className="text-xs font-semibold text-slate-700">Full-Stack Cloud Architecture & Distributed Systems</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs"
                          style={{ color: branding.accentColor, backgroundColor: `${branding.accentColor}18`, border: `1px solid ${branding.accentColor}33` }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: branding.accentColor }} />
                          Authentic & Verified
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">RSA-2048</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 text-[10px] text-center text-slate-400 bg-slate-50">
                      {branding.footerText || "Powered by Proofsy Zero-Trust Infrastructure."}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
