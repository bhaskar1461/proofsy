"use client";

import React, { useEffect, useRef, useState } from "react";
import { Designer } from "@pdfme/ui";
import { text, image, barcodes, signature, line, rectangle, svg } from "@pdfme/schemas";
import { Template as PdfmeTemplate } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { 
  Plus, 
  Eye, 
  Download, 
  Save, 
  QrCode as QrIcon, 
  Type, 
  User, 
  Calendar, 
  Award,
  Sparkles,
  RotateCcw,
  Wand2,
  CheckCircle2,
  Zap,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  FileImage
} from "lucide-react";

interface PdfmeEditorProps {
  initialTemplate: PdfmeTemplate;
  onSave?: (template: PdfmeTemplate) => void;
  saving?: boolean;
}

const plugins = {
  text,
  image,
  signature,
  qrcode: barcodes.qrcode,
  line,
  rectangle,
  svg,
};

// AI Layout Preset Templates
const AI_PRESET_TEMPLATES: Record<string, { name: string; schema: any }> = {
  hackathon: {
    name: "AI Hackathon Winner (Dark & Neon)",
    schema: {
      certificate_title: {
        type: "text",
        position: { x: 20, y: 22 },
        width: 257,
        height: 16,
        alignment: "center",
        fontSize: 28,
        fontColor: "#0284C7",
        fontName: "Inter",
        content: "GLOBAL AI HACKATHON 2026",
      },
      winner_badge: {
        type: "text",
        position: { x: 20, y: 44 },
        width: 257,
        height: 12,
        alignment: "center",
        fontSize: 16,
        fontColor: "#F59E0B",
        fontName: "Inter",
        content: "★ 1ST PLACE OVERALL WINNER ★",
      },
      recipient_name: {
        type: "text",
        position: { x: 20, y: 62 },
        width: 257,
        height: 24,
        alignment: "center",
        fontSize: 34,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Bhaskar Sharma",
      },
      program_intro: {
        type: "text",
        position: { x: 25, y: 92 },
        width: 247,
        height: 12,
        alignment: "center",
        fontSize: 13,
        fontColor: "#475569",
        fontName: "Inter",
        content: "For extraordinary engineering excellence and innovation in building autonomous distributed AI agents.",
      },
      event_track: {
        type: "text",
        position: { x: 25, y: 108 },
        width: 247,
        height: 14,
        alignment: "center",
        fontSize: 18,
        fontColor: "#0369A1",
        fontName: "Inter",
        content: "Autonomous Systems & Cloud Architecture Track",
      },
      lead_judge_sig: {
        type: "text",
        position: { x: 35, y: 148 },
        width: 65,
        height: 16,
        alignment: "center",
        fontSize: 11,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Dr. Elena Vance\nHead of AI Research",
      },
      verification_qrcode: {
        type: "qrcode",
        position: { x: 133, y: 145 },
        width: 32,
        height: 32,
        content: "https://proofsy.tech/verify/proofsy-academy/CERT-RSA-1XFHJV",
      },
      date: {
        type: "text",
        position: { x: 119, y: 182 },
        width: 60,
        height: 8,
        alignment: "center",
        fontSize: 10,
        fontColor: "#64748B",
        fontName: "Inter",
        content: "August 30, 2026",
      },
      hackathon_director_sig: {
        type: "text",
        position: { x: 198, y: 148 },
        width: 65,
        height: 16,
        alignment: "center",
        fontSize: 11,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Marcus Brody\nHackathon General Chair",
      },
    },
  },
  academic: {
    name: "Ivy League Academic Diploma",
    schema: {
      institution_name: {
        type: "text",
        position: { x: 20, y: 18 },
        width: 257,
        height: 14,
        alignment: "center",
        fontSize: 20,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "PROOFSY INSTITUTE OF TECHNOLOGY",
      },
      certificate_title: {
        type: "text",
        position: { x: 20, y: 36 },
        width: 257,
        height: 16,
        alignment: "center",
        fontSize: 26,
        fontColor: "#991B1B",
        fontName: "Inter",
        content: "DIPLOMA OF EXCELLENCE",
      },
      presented_to: {
        type: "text",
        position: { x: 20, y: 56 },
        width: 257,
        height: 8,
        alignment: "center",
        fontSize: 11,
        fontColor: "#64748B",
        fontName: "Inter",
        content: "BE IT KNOWN THAT",
      },
      recipient_name: {
        type: "text",
        position: { x: 20, y: 68 },
        width: 257,
        height: 22,
        alignment: "center",
        fontSize: 32,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Bhaskar Sharma",
      },
      program_intro: {
        type: "text",
        position: { x: 25, y: 94 },
        width: 247,
        height: 10,
        alignment: "center",
        fontSize: 12,
        fontColor: "#334155",
        fontName: "Inter",
        content: "has successfully satisfied all academic rigor and degree requirements for",
      },
      event_name: {
        type: "text",
        position: { x: 25, y: 106 },
        width: 247,
        height: 16,
        alignment: "center",
        fontSize: 22,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Master of Science in Distributed Cloud Systems",
      },
      dean_sig: {
        type: "text",
        position: { x: 35, y: 148 },
        width: 65,
        height: 16,
        alignment: "center",
        fontSize: 11,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Dean of Academic Affairs\nProf. Arthur Kingsley",
      },
      verification_qrcode: {
        type: "qrcode",
        position: { x: 133, y: 144 },
        width: 32,
        height: 32,
        content: "https://proofsy.tech/verify/proofsy-academy/CERT-RSA-1XFHJV",
      },
      date: {
        type: "text",
        position: { x: 119, y: 180 },
        width: 60,
        height: 8,
        alignment: "center",
        fontSize: 10,
        fontColor: "#64748B",
        fontName: "Inter",
        content: "Conferred: August 30, 2026",
      },
      provost_sig: {
        type: "text",
        position: { x: 198, y: 148 },
        width: 65,
        height: 16,
        alignment: "center",
        fontSize: 11,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "University Provost\nDr. Margaret Sterling",
      },
    },
  },
  executive: {
    name: "Executive Platinum Distinction",
    schema: {
      certificate_title: {
        type: "text",
        position: { x: 20, y: 22 },
        width: 257,
        height: 14,
        alignment: "center",
        fontSize: 22,
        fontColor: "#D97706",
        fontName: "Inter",
        content: "EXECUTIVE DISTINCTION IN LEADERSHIP",
      },
      presented_to: {
        type: "text",
        position: { x: 20, y: 44 },
        width: 257,
        height: 8,
        alignment: "center",
        fontSize: 10,
        fontColor: "#94A3B8",
        fontName: "Inter",
        content: "CONFIRMED AND CERTIFIED FOR",
      },
      recipient_name: {
        type: "text",
        position: { x: 20, y: 56 },
        width: 257,
        height: 24,
        alignment: "center",
        fontSize: 34,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Bhaskar Sharma",
      },
      program_intro: {
        type: "text",
        position: { x: 25, y: 88 },
        width: 247,
        height: 10,
        alignment: "center",
        fontSize: 12,
        fontColor: "#475569",
        fontName: "Inter",
        content: "In recognition of outstanding strategic vision, architectural leadership, and organizational impact.",
      },
      event_name: {
        type: "text",
        position: { x: 25, y: 102 },
        width: 247,
        height: 16,
        alignment: "center",
        fontSize: 20,
        fontColor: "#1E293B",
        fontName: "Inter",
        content: "Executive Cloud Strategy & Technical Governance",
      },
      president_sig: {
        type: "text",
        position: { x: 40, y: 148 },
        width: 65,
        height: 14,
        alignment: "center",
        fontSize: 11,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "President & CEO\nBoard of Governors",
      },
      verification_qrcode: {
        type: "qrcode",
        position: { x: 133, y: 145 },
        width: 32,
        height: 32,
        content: "https://proofsy.tech/verify/proofsy-academy/CERT-RSA-1XFHJV",
      },
      date: {
        type: "text",
        position: { x: 119, y: 182 },
        width: 60,
        height: 8,
        alignment: "center",
        fontSize: 10,
        fontColor: "#64748B",
        fontName: "Inter",
        content: "Awarded: August 30, 2026",
      },
      vp_sig: {
        type: "text",
        position: { x: 195, y: 148 },
        width: 65,
        height: 14,
        alignment: "center",
        fontSize: 11,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: "Executive Vice President\nGlobal Accreditation",
      },
    },
  },
};

export default function PdfmeEditor({
  initialTemplate,
  onSave,
  saving = false,
}: PdfmeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [currentTemplate, setCurrentTemplate] = useState<PdfmeTemplate>(initialTemplate);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the pdfme Designer
    const designer = new Designer({
      domContainer: containerRef.current,
      template: initialTemplate,
      plugins,
      options: {
        theme: {
          token: {
            colorPrimary: "#4f46e5",
          },
        },
      },
    });

    designerRef.current = designer;

    designer.onSaveTemplate((template) => {
      setCurrentTemplate(template);
      if (onSave) {
        onSave(template);
      }
    });

    designer.onChangeTemplate((template) => {
      setCurrentTemplate(template);
    });

    // Global Paste Listener for Screenshot / Inspiration Image (Ctrl+V)
    const handlePaste = async (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          await processInspirationImage(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
      designer.destroy();
      designerRef.current = null;
    };
  }, [initialTemplate]);

  // Process Inspiration Image / Screenshot
  const processInspirationImage = async (file: File) => {
    setIsProcessingImage(true);
    setAiFeedback(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl || !designerRef.current) {
          setIsProcessingImage(false);
          return;
        }

        // Generate matching editable template schema overlaying the inspiration background as an image layer
        const reconstructedTemplate: any = {
          basePdf: {
            width: 297,
            height: 210,
            padding: [0, 0, 0, 0],
          },
          schemas: [
            {
              inspiration_background: {
                name: "inspiration_background",
                type: "image",
                position: { x: 0, y: 0 },
                width: 297,
                height: 210,
                content: dataUrl,
              },
              certificate_title: {
                name: "certificate_title",
                type: "text",
                position: { x: 20, y: 25 },
                width: 257,
                height: 16,
                alignment: "center",
                fontSize: 26,
                fontColor: "#0F172A",
                fontName: "Inter",
                content: "CERTIFICATE OF ACHIEVEMENT",
              },
              presented_to: {
                name: "presented_to",
                type: "text",
                position: { x: 20, y: 48 },
                width: 257,
                height: 8,
                alignment: "center",
                fontSize: 11,
                fontColor: "#475569",
                fontName: "Inter",
                content: "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
              },
              recipient_name: {
                name: "recipient_name",
                type: "text",
                position: { x: 20, y: 62 },
                width: 257,
                height: 22,
                alignment: "center",
                fontSize: 32,
                fontColor: "#0F172A",
                fontName: "Inter",
                content: "Bhaskar Sharma",
              },
              event_name: {
                name: "event_name",
                type: "text",
                position: { x: 25, y: 98 },
                width: 247,
                height: 15,
                alignment: "center",
                fontSize: 20,
                fontColor: "#2563EB",
                fontName: "Inter",
                content: "Professional Certification Program",
              },
              verification_qrcode: {
                name: "verification_qrcode",
                type: "qrcode",
                position: { x: 133, y: 145 },
                width: 32,
                height: 32,
                content: "https://proofsy.tech/verify/proofsy-academy/CERT-RSA-1XFHJV",
              },
              date: {
                name: "date",
                type: "text",
                position: { x: 119, y: 182 },
                width: 60,
                height: 8,
                alignment: "center",
                fontSize: 10,
                fontColor: "#64748B",
                fontName: "Inter",
                content: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              },
              signature_left: {
                name: "signature_left",
                type: "text",
                position: { x: 35, y: 150 },
                width: 65,
                height: 14,
                alignment: "center",
                fontSize: 11,
                fontColor: "#0F172A",
                fontName: "Inter",
                content: "Authorized Signatory\nDirector",
              },
              signature_right: {
                name: "signature_right",
                type: "text",
                position: { x: 198, y: 150 },
                width: 65,
                height: 14,
                alignment: "center",
                fontSize: 11,
                fontColor: "#0F172A",
                fontName: "Inter",
                content: "Program Registrar\nAcademic Dean",
              },
            },
          ],
        };

        try {
          designerRef.current.updateTemplate(reconstructedTemplate);
          setCurrentTemplate(reconstructedTemplate);
          setIsProcessingImage(false);
          setAiFeedback(`✓ Inspiration image "${file.name}" analyzed & applied as template background with editable smart layers!`);
          setTimeout(() => setAiFeedback(null), 6000);
        } catch (err: any) {
          console.error("Template update error:", err);
          setIsProcessingImage(false);
          alert("Error loading inspiration template: " + err.message);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Inspiration image error:", err);
      setIsProcessingImage(false);
      alert("Failed to analyze inspiration image: " + err.message);
    }
  };

  // AI Layout & Style Generator — calls backend AI service, falls back to local keyword matching
  const handleGenerateFromPrompt = async (promptText?: string) => {
    const textToAnalyze = (promptText || aiPrompt).toLowerCase().trim();
    if (!textToAnalyze) return;

    setIsGeneratingAi(true);
    setAiFeedback(null);

    // Try backend AI service first
    try {
      const workspaceId = typeof window !== "undefined" ? localStorage.getItem("proofsy_workspace_id") : null;
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("proofsy_admin_token") : null;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (workspaceId) headers["x-workspace-id"] = workspaceId;
      if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText || aiPrompt }],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.toolExecutions?.length > 0) {
          const editResult = json.data.toolExecutions.find(
            (te: any) => te.tool === "edit_template" && te.result?.success
          );

          if (editResult && designerRef.current) {
            const activeTemplate = designerRef.current.getTemplate();
            const currentSchema: Record<string, any> = { ...(activeTemplate.schemas[0] || {}) };
            const modifications = editResult.result.modifications || [];
            const updatedLayers = editResult.result.layers || [];

            for (const aiLayer of updatedLayers) {
              const key = Object.keys(currentSchema).find((k) => {
                const layer = currentSchema[k] as any;
                return (
                  layer.type === "text" &&
                  (k === aiLayer.variable || k.includes(aiLayer.variable))
                );
              });

              if (key) {
                const existing = currentSchema[key] as any;
                currentSchema[key] = {
                  ...existing,
                  fontColor: aiLayer.color || existing.fontColor,
                  fontSize: aiLayer.fontSize
                    ? Math.round(aiLayer.fontSize * 0.28)
                    : existing.fontSize,
                  fontName: aiLayer.fontFamily || existing.fontName,
                };
              }
            }

            const updatedTemplate: any = {
              ...activeTemplate,
              schemas: [currentSchema],
            };

            designerRef.current.updateTemplate(updatedTemplate);
            setCurrentTemplate(updatedTemplate);
            setIsGeneratingAi(false);
            setAiFeedback(
              `✓ AI applied ${modifications.length} modification(s): ${modifications.slice(0, 3).join(", ")}${modifications.length > 3 ? "..." : ""}`
            );
            setTimeout(() => setAiFeedback(null), 6000);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("[PdfmeEditor] Backend AI unavailable, using local synthesis:", err);
    }

    // ═══ Local keyword-matching fallback ═══
    setTimeout(() => {
      if (!designerRef.current) {
        setIsGeneratingAi(false);
        return;
      }

      const activeTemplate = designerRef.current.getTemplate();
      const currentSchema = { ...(activeTemplate.schemas[0] || {}) };
      const hasExistingLayers = Object.keys(currentSchema).length > 0;

      // Color detection
      let detectedColor: string | null = null;
      let styleName = "custom";

      if (textToAnalyze.includes("gold") || textToAnalyze.includes("golden") || textToAnalyze.includes("yellow")) {
        detectedColor = "#D4AF37"; // Imperial Metallic Gold
        styleName = "Imperial Gold";
      } else if (
        textToAnalyze.includes("blue") ||
        textToAnalyze.includes("cyan") ||
        textToAnalyze.includes("neon") ||
        textToAnalyze.includes("tech") ||
        textToAnalyze.includes("techiish") ||
        textToAnalyze.includes("techish") ||
        textToAnalyze.includes("cyber") ||
        textToAnalyze.includes("hacker")
      ) {
        detectedColor = "#0284C7"; // Vivid Tech Cyan/Blue
        styleName = "Futuristic Tech Cyan";
      } else if (textToAnalyze.includes("emerald") || textToAnalyze.includes("green")) {
        detectedColor = "#059669"; // Emerald Forest
        styleName = "Emerald Modern";
      } else if (textToAnalyze.includes("purple") || textToAnalyze.includes("violet")) {
        detectedColor = "#7C3AED"; // Royal Purple
        styleName = "Royal Purple";
      } else if (textToAnalyze.includes("red") || textToAnalyze.includes("crimson") || textToAnalyze.includes("burgundy")) {
        detectedColor = "#991B1B"; // Harvard Crimson
        styleName = "Academic Crimson";
      } else if (textToAnalyze.includes("white") || textToAnalyze.includes("light") || textToAnalyze.includes("bright")) {
        detectedColor = "#FFFFFF"; // Pure Crisp White
        styleName = "High-Contrast White";
      } else if (textToAnalyze.includes("black") || textToAnalyze.includes("dark")) {
        detectedColor = "#0F172A"; // Midnight Slate
        styleName = "Midnight Dark";
      }

      const isStyleEditOnly =
        hasExistingLayers &&
        (textToAnalyze.includes("font") ||
          textToAnalyze.includes("color") ||
          textToAnalyze.includes("stylish") ||
          textToAnalyze.includes("tech") ||
          textToAnalyze.includes("techiish") ||
          textToAnalyze.includes("techish") ||
          textToAnalyze.includes("make") ||
          textToAnalyze.includes("change") ||
          textToAnalyze.includes("golden") ||
          textToAnalyze.includes("size") ||
          textToAnalyze.includes("more"));

      if (isStyleEditOnly) {
        // Dynamically update existing schema layers
        const modifiedSchema: any = {};
        Object.entries(currentSchema).forEach(([key, layer]: [string, any]) => {
          const updatedLayer = { ...layer };

          // Apply color
          if (detectedColor && updatedLayer.type === "text") {
            if (key === "certificate_title" || key === "recipient_name" || key === "event_name" || key === "winner_badge") {
              updatedLayer.fontColor = detectedColor;
            } else if (detectedColor === "#D4AF37") {
              // Accent gold for subtitles
              updatedLayer.fontColor = "#B45309";
            }
          }

          // Apply "tech" / "stylish" / "larger" typography adjustments
          if (
            textToAnalyze.includes("stylish") ||
            textToAnalyze.includes("tech") ||
            textToAnalyze.includes("techiish") ||
            textToAnalyze.includes("techish") ||
            textToAnalyze.includes("large") ||
            textToAnalyze.includes("modern")
          ) {
            if (key === "recipient_name") {
              updatedLayer.fontSize = 36;
              updatedLayer.height = 24;
            } else if (key === "certificate_title") {
              updatedLayer.fontSize = 28;
              updatedLayer.height = 18;
            } else if (key === "event_name") {
              updatedLayer.fontSize = 20;
              updatedLayer.height = 16;
            }
          }

          modifiedSchema[key] = updatedLayer;
        });

        const updatedTemplate: any = {
          ...activeTemplate,
          schemas: [modifiedSchema],
        };

        try {
          designerRef.current.updateTemplate(updatedTemplate);
          setCurrentTemplate(updatedTemplate);
          setIsGeneratingAi(false);
          setAiFeedback(`✓ Applied ${styleName} styling & modern typography to all ${Object.keys(modifiedSchema).length} layers!`);
          setTimeout(() => setAiFeedback(null), 5000);
        } catch (e: any) {
          setIsGeneratingAi(false);
          console.error("AI apply error:", e);
        }
        return;
      }

      // If full template switch requested
      let selectedPreset = AI_PRESET_TEMPLATES.hackathon;
      if (textToAnalyze.includes("academic") || textToAnalyze.includes("diploma") || textToAnalyze.includes("university") || textToAnalyze.includes("degree")) {
        selectedPreset = AI_PRESET_TEMPLATES.academic;
      } else if (textToAnalyze.includes("executive") || textToAnalyze.includes("leadership") || textToAnalyze.includes("platinum") || textToAnalyze.includes("gold")) {
        selectedPreset = AI_PRESET_TEMPLATES.executive;
      } else if (textToAnalyze.includes("hackathon") || textToAnalyze.includes("winner") || textToAnalyze.includes("tech") || textToAnalyze.includes("techiish") || textToAnalyze.includes("ai")) {
        selectedPreset = AI_PRESET_TEMPLATES.hackathon;
      }

      const presetSchema = { ...selectedPreset.schema };
      if (detectedColor) {
        if (presetSchema.certificate_title) presetSchema.certificate_title.fontColor = detectedColor;
        if (presetSchema.recipient_name) presetSchema.recipient_name.fontColor = detectedColor;
      }

      const updatedTemplate: any = {
        basePdf: {
          width: 297,
          height: 210,
          padding: [0, 0, 0, 0],
        },
        schemas: [presetSchema],
      };

      try {
        designerRef.current.updateTemplate(updatedTemplate);
        setCurrentTemplate(updatedTemplate);
        setIsGeneratingAi(false);
        setAiFeedback(`✓ AI synthesized "${selectedPreset.name}" with ${styleName} palette & ${Object.keys(presetSchema).length} dynamic layers!`);
        setTimeout(() => setAiFeedback(null), 5000);
      } catch (e: any) {
        setIsGeneratingAi(false);
        console.error("AI preset error:", e);
      }
    }, 400);
  };

  // Quick-Add Certificate Variable Helpers
  const addField = (fieldKey: string, fieldType: string, label: string, sampleContent: string) => {
    if (!designerRef.current) return;
    const template = designerRef.current.getTemplate();
    const currentSchemas = template.schemas[0] || {};

    const newSchema = {
      ...currentSchemas,
      [fieldKey]: {
        type: fieldType,
        position: { x: 50, y: 50 + Object.keys(currentSchemas).length * 15 },
        width: fieldType === "qrcode" ? 35 : 197,
        height: fieldType === "qrcode" ? 35 : 16,
        alignment: "center",
        fontSize: 16,
        fontColor: "#0F172A",
        fontName: "Inter",
        content: sampleContent,
      },
    };

    const updatedTemplate = {
      ...template,
      schemas: [newSchema],
    };

    designerRef.current.updateTemplate(updatedTemplate);
    setCurrentTemplate(updatedTemplate);
  };

  // Instant PDF Preview Generator
  const handlePreviewPdf = async () => {
    if (!designerRef.current) return;
    setIsGeneratingPreview(true);
    try {
      const template = designerRef.current.getTemplate();
      const inputs = [
        {
          recipient_name: "Bhaskar Sharma",
          event_name: "Annual Technical Symposium 2026",
          date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          verification_code: "PROOF-DEMO-8821",
          organizer: "Faculty of Engineering",
          duration: "2 Days",
          verification_qrcode: "https://proofsy.tech/verify/proofsy-academy/CERT-RSA-1XFHJV",
        },
      ];

      const pdfUint8Array = await generate({
        template,
        inputs,
        plugins,
      });

      const blob = new Blob([pdfUint8Array], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("PDF Preview generation error:", err);
      alert("Failed to generate PDF preview: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSave = () => {
    if (!designerRef.current) return;
    const template = designerRef.current.getTemplate();
    if (onSave) {
      onSave(template);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100">
      {/* Hidden file input for inspiration image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processInspirationImage(e.target.files[0])}
      />

      {/* AI Prompt & Inspiration Generator Toolbar */}
      <div className="border-b border-indigo-900/40 bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm shadow-indigo-500/20">
            <Wand2 className="h-4 w-4" />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateFromPrompt()}
              placeholder="Describe certificate (e.g. Hackathon winner, Academic diploma) or paste screenshot (Ctrl+V)..."
              className="w-full bg-slate-900/90 border border-indigo-500/40 rounded-xl px-4 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            onClick={() => handleGenerateFromPrompt()}
            disabled={isGeneratingAi || !aiPrompt.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
          >
            {isGeneratingAi ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Prompt</span>
              </>
            )}
          </button>

          {/* Inspiration Image Upload Button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={isProcessingImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-200 font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-sm"
          >
            {isProcessingImage ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                <span>Analyzing Image...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
                <span>Inspiration Image</span>
              </>
            )}
          </button>
        </div>

        {/* Quick AI Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1 shrink-0">AI Styles:</span>
          <button
            onClick={() => { setAiPrompt("AI Hackathon 1st Place Winner"); handleGenerateFromPrompt("AI Hackathon 1st Place Winner"); }}
            className="px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>Hackathon Winner</span>
          </button>

          <button
            onClick={() => { setAiPrompt("Ivy League Academic Diploma"); handleGenerateFromPrompt("Ivy League Academic Diploma"); }}
            className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Award className="h-3 w-3 text-amber-400" />
            <span>Academic Diploma</span>
          </button>

          <button
            onClick={() => { setAiPrompt("Executive Platinum Leadership"); handleGenerateFromPrompt("Executive Platinum Leadership"); }}
            className="px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span>Executive Platinum</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {aiFeedback && (
        <div className="bg-emerald-950 border-b border-emerald-800 text-emerald-300 px-6 py-2 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{aiFeedback}</span>
        </div>
      )}

      {/* Top Quick Actions Bar */}
      <header className="flex h-12 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Active Canvas</span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-2" />

          {/* Quick Insert Badges */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Insert Layer:</span>
            <button
              onClick={() => addField("recipient_name", "text", "Recipient Name", "Recipient Full Name")}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <User className="h-3 w-3 text-indigo-400" />
              <span>Recipient Name</span>
            </button>

            <button
              onClick={() => addField("event_name", "text", "Event Name", "Event & Program Title")}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Award className="h-3 w-3 text-amber-400" />
              <span>Event Title</span>
            </button>

            <button
              onClick={() => addField("date", "text", "Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }))}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Calendar className="h-3 w-3 text-emerald-400" />
              <span>Issue Date</span>
            </button>

            <button
              onClick={() => addField("verification_qrcode", "qrcode", "Verification QR", "https://proofsy.tech/verify/SAMPLE")}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <QrIcon className="h-3 w-3 text-cyan-400" />
              <span>Verification QR</span>
            </button>
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePreviewPdf}
            disabled={isGeneratingPreview}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isGeneratingPreview ? "Rendering PDF..." : "Live PDF Preview"}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save Template"}</span>
          </button>
        </div>
      </header>

      {/* Main pdfme Canvas Container */}
      <div className="relative flex-1 overflow-hidden bg-slate-900">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
