"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Template as PdfmeTemplate } from "@pdfme/common";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  proofsyToPdfme,
  pdfmeToProofsy,
  fetchBackgroundAsDataUrl,
  type ProofsyTemplate,
} from "@/lib/templateFormatConverter";

// Dynamically import PdfmeEditor to avoid SSR DOM/Canvas errors
const PdfmeEditor = dynamic(() => import("@/components/PdfmeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold tracking-wide text-slate-300">Loading Proofsy Template Studio...</span>
      </div>
    </div>
  ),
});

const DEFAULT_PDFME_TEMPLATE: any = {
  basePdf: {
    width: 297,
    height: 210,
    padding: [0, 0, 0, 0],
  },
  schemas: [
    {
      certificate_title: {
        name: "certificate_title",
        type: "text",
        position: { x: 20, y: 22 },
        width: 257,
        height: 16,
        alignment: "center",
        fontSize: 26,
        fontColor: "#1E293B",
        fontName: "Inter",
        content: "CERTIFICATE OF COMPLETION",
      },
      presented_to: {
        type: "text",
        position: { x: 20, y: 46 },
        width: 257,
        height: 10,
        alignment: "center",
        fontSize: 13,
        fontColor: "#64748B",
        fontName: "Inter",
        content: "PROUDLY PRESENTED TO",
      },
      recipient_name: {
        type: "text",
        position: { x: 20, y: 60 },
        width: 257,
        height: 22,
        alignment: "center",
        fontSize: 32,
        fontColor: "#1E293B",
        fontName: "Inter",
        content: "Bhaskar Sharma",
      },
      program_intro: {
        type: "text",
        position: { x: 25, y: 88 },
        width: 247,
        height: 12,
        alignment: "center",
        fontSize: 14,
        fontColor: "#334155",
        fontName: "Inter",
        content: "for the successful completion of the",
      },
      event_name: {
        type: "text",
        position: { x: 25, y: 100 },
        width: 247,
        height: 15,
        alignment: "center",
        fontSize: 20,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Project Management Certification Program",
      },
      description: {
        type: "text",
        position: { x: 30, y: 118 },
        width: 237,
        height: 16,
        alignment: "center",
        fontSize: 11,
        fontColor: "#64748B",
        fontName: "Inter",
        content: "The recipient has fulfilled all course requirements and demonstrated competence in applying project management principles, methodologies, and best practices.",
      },
      signature_left: {
        type: "text",
        position: { x: 35, y: 150 },
        width: 60,
        height: 14,
        alignment: "center",
        fontSize: 12,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Jack Rowe\nLead Trainer",
      },
      date: {
        type: "text",
        position: { x: 118, y: 142 },
        width: 60,
        height: 10,
        alignment: "center",
        fontSize: 12,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "28 August 2026",
      },
      verification_qrcode: {
        type: "qrcode",
        position: { x: 133, y: 154 },
        width: 30,
        height: 30,
        content: "https://proofsy.tech/verify/proofsy-academy/CERT-RSA-1XFHJV",
      },
      signature_right: {
        type: "text",
        position: { x: 200, y: 150 },
        width: 60,
        height: 14,
        alignment: "center",
        fontSize: 12,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Zain Ahmed\nProgram Director",
      },
    },
  ],
};

/* ───── Inner component that uses useSearchParams ───── */
function DesignerContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [pdfmeTemplate, setPdfmeTemplate] = useState<any>(null);
  const [proofsySource, setProofsySource] = useState<ProofsyTemplate | null>(null);
  const [templateName, setTemplateName] = useState<string>("Custom Studio Certificate Template");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!templateId);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch template from DB when templateId is provided
  useEffect(() => {
    if (!templateId) {
      setPdfmeTemplate(DEFAULT_PDFME_TEMPLATE);
      return;
    }

    let cancelled = false;

    const loadTemplate = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
        const adminToken = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

        const headers: Record<string, string> = {};
        if (workspaceId) headers["x-workspace-id"] = workspaceId;
        if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

        const res = await fetch(`/api/templates/${templateId}`, {
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          throw new Error(`Failed to load template: ${res.status}`);
        }

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Invalid template response");
        }

        if (cancelled) return;

        const proofsy: ProofsyTemplate = json.data;
        setProofsySource(proofsy);
        setTemplateName(proofsy.name || "Custom Template");

        // Fetch background image and convert to data URL for pdfme
        let bgDataUrl: string | undefined;
        if (proofsy.backgroundUrl) {
          bgDataUrl = await fetchBackgroundAsDataUrl(proofsy.backgroundUrl);
        }

        if (cancelled) return;

        // Convert Proofsy format → pdfme format
        const converted = proofsyToPdfme(proofsy, bgDataUrl);
        setPdfmeTemplate(converted);
      } catch (err: any) {
        console.error("[Designer] Template load error:", err);
        if (!cancelled) {
          setLoadError(err.message || "Failed to load template");
          // Fall back to default
          setPdfmeTemplate(DEFAULT_PDFME_TEMPLATE);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTemplate();
    return () => { cancelled = true; };
  }, [templateId]);

  const handlePdfmeSave = async (savedTemplate: any) => {
    try {
      setIsSaving(true);

      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

      if (templateId && proofsySource) {
        // UPDATE existing template via PUT
        const converted = pdfmeToProofsy(
          savedTemplate,
          proofsySource.width || 1056,
          proofsySource.height || 746
        );

        const res = await fetch(`/api/templates/${templateId}`, {
          method: "PUT",
          credentials: "include",
          headers,
          body: JSON.stringify({
            name: templateName,
            textLayers: converted.textLayers,
            qrCode: converted.qrCode,
          }),
        });

        if (res.ok) {
          alert("✓ Template updated successfully!");
        } else {
          const errJson = await res.json().catch(() => ({}));
          alert("Save failed: " + (errJson.error || res.statusText));
        }
      } else {
        // CREATE new template via import
        const res = await fetch("/api/templates/import", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            name: templateName,
            templateJson: savedTemplate,
            schemaVersion: "2.0",
          }),
        });
        if (res.ok) {
          alert("✓ Template saved successfully to Proofsy!");
        }
      }
    } catch (e: any) {
      console.error("Save error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">Loading template from database...</span>
        </div>
      </div>
    );
  }

  if (!pdfmeTemplate) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-300">
        <span className="text-sm">Initializing editor...</span>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Application Header Bar */}
      <header className="flex h-11 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-6 text-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Template Gallery</span>
          </Link>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Proofsy Visual Studio</span>
          </span>

          {templateId && (
            <>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <span className="text-indigo-300 font-medium truncate max-w-[200px]" title={templateName}>
                {templateName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          {loadError && (
            <span className="text-amber-400">⚠ {loadError} — using default</span>
          )}
          <span>Format: <strong className="text-white">A4 Landscape (297 × 210 mm)</strong></span>
          <span>•</span>
          <span>Sample: <strong className="text-white">Bhaskar Sharma</strong></span>
        </div>
      </header>

      {/* Editor Viewport */}
      <div className="flex-1 overflow-hidden">
        <PdfmeEditor
          initialTemplate={pdfmeTemplate}
          onSave={handlePdfmeSave}
          saving={isSaving}
        />
      </div>
    </main>
  );
}

/* ───── Page wrapper with Suspense for useSearchParams ───── */
export default function DesignerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-semibold tracking-wide text-slate-300">Loading Proofsy Template Studio...</span>
          </div>
        </div>
      }
    >
      <DesignerContent />
    </Suspense>
  );
}
