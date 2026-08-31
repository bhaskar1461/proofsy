"use client";

import React, { useState, useRef } from "react";
import { useDesignerStore } from "../../store/useDesignerStore";
import { CanvasElement } from "../../types/template";
import { PREDEFINED_CERTIFICATE_VARIABLES } from "../../types/variables";
import {
  Type,
  Variable,
  Image as ImageIcon,
  Square,
  QrCode,
  PenTool,
  Award,
  Layers,
  Plus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  MoveUp,
  MoveDown,
  Upload,
} from "lucide-react";

export const LeftSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "text" | "variables" | "assets" | "shapes" | "placeholders" | "layers"
  >("text");

  const {
    template,
    addElement,
    selectedElementIds,
    selectElement,
    updateElement,
    removeElement,
    reorderElement,
    setTemplate,
  } = useDesignerStore();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Helper to add standard text element
  const handleAddText = (type: "title" | "subtitle" | "body") => {
    const pageW = template.page.width;
    const pageH = template.page.height;

    let fontSize = 24;
    let text = "Custom Text";
    let fontFamily = "Inter";
    let fontWeight: "normal" | "bold" = "normal";

    if (type === "title") {
      fontSize = 32;
      text = "CERTIFICATE OF ACHIEVEMENT";
      fontFamily = "Cinzel";
      fontWeight = "bold";
    } else if (type === "subtitle") {
      fontSize = 16;
      text = "FOR OUTSTANDING PERFORMANCE IN";
      fontWeight = "normal";
    } else {
      fontSize = 14;
      text = "Awarded on this 15th day of August, 2026";
    }

    const newEl: CanvasElement = {
      id: `el_txt_${Date.now().toString(36)}`,
      type: "text",
      x: pageW / 2,
      y: pageH / 2 - 50,
      width: 600,
      height: Math.round(fontSize * 1.4),
      rotation: 0,
      opacity: 1.0,
      zIndex: template.elements.length + 1,
      isLocked: false,
      isHidden: false,
      text,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle: "normal",
      color: "#0F172A",
      textAlign: "center",
      letterSpacing: 1,
    };

    addElement(newEl);
  };

  // Helper to add variable element
  const handleAddVariable = (variableKey: string, label: string) => {
    const pageW = template.page.width;
    const pageH = template.page.height;

    const newEl: CanvasElement = {
      id: `el_var_${Date.now().toString(36)}`,
      type: "variable_text",
      variableKey,
      fallbackText: label,
      x: pageW / 2,
      y: pageH / 2,
      width: 650,
      height: 50,
      rotation: 0,
      opacity: 1.0,
      zIndex: template.elements.length + 1,
      isLocked: false,
      isHidden: false,
      text: `{{${variableKey}}}`,
      fontFamily: variableKey === "student_name" ? "Great Vibes" : "Inter",
      fontSize: variableKey === "student_name" ? 42 : 20,
      fontWeight: variableKey === "student_name" ? "normal" : "bold",
      fontStyle: "normal",
      color: variableKey === "student_name" ? "#0F172A" : "#4F46E5",
      textAlign: "center",
    };

    addElement(newEl);
  };

  // Helper to add QR Placeholder
  const handleAddQR = () => {
    const newEl: CanvasElement = {
      id: `el_qr_${Date.now().toString(36)}`,
      type: "qr_placeholder",
      x: template.page.width - 160,
      y: template.page.height - 160,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1.0,
      zIndex: template.elements.length + 1,
      isLocked: false,
      isHidden: false,
      qrConfig: {
        purpose: "certificate_verification",
        errorCorrectionLevel: "H",
        style: "circular_premium",
        showCenterLogo: true,
      },
    };
    addElement(newEl);
  };

  // Helper to add Signature Placeholder
  const handleAddSignature = () => {
    const newEl: CanvasElement = {
      id: `el_sig_${Date.now().toString(36)}`,
      type: "signature_placeholder",
      x: 180,
      y: template.page.height - 150,
      width: 220,
      height: 80,
      rotation: 0,
      opacity: 1.0,
      zIndex: template.elements.length + 1,
      isLocked: false,
      isHidden: false,
      signatureConfig: {
        signerRole: "Dean of Academic Affairs",
        signerName: "Dr. Sarah Jenkins",
        signerDesignation: "Office of the Dean",
        showBaseline: true,
      },
    };
    addElement(newEl);
  };

  // Helper to add Seal Placeholder
  const handleAddSeal = () => {
    const newEl: CanvasElement = {
      id: `el_seal_${Date.now().toString(36)}`,
      type: "seal_placeholder",
      x: template.page.width / 2 - 45,
      y: template.page.height - 140,
      width: 90,
      height: 90,
      rotation: 0,
      opacity: 1.0,
      zIndex: template.elements.length + 1,
      isLocked: false,
      isHidden: false,
      sealConfig: {
        sealType: "institutional_emboss",
        maskShape: "circle",
      },
    };
    addElement(newEl);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newEl: CanvasElement = {
        id: `el_img_${Date.now().toString(36)}`,
        type: "image",
        assetUrl: dataUrl,
        x: template.page.width / 2 - 50,
        y: 60,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1.0,
        zIndex: template.elements.length + 1,
        isLocked: false,
        isHidden: false,
      };
      addElement(newEl);
    };
    reader.readAsDataURL(file);
  };

  // Handle Background Upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTemplate({
        ...template,
        background: {
          type: "image",
          url: dataUrl,
          opacity: 1.0,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const sortedElements = [...template.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  return (
    <aside className="flex h-full w-80 border-r border-slate-800 bg-slate-900 text-slate-200 select-none">
      {/* Icon Navigation Column */}
      <div className="flex w-16 flex-col items-center gap-4 border-r border-slate-800 bg-slate-950/80 py-4">
        {[
          { id: "text", icon: Type, label: "Text" },
          { id: "variables", icon: Variable, label: "Variables" },
          { id: "assets", icon: ImageIcon, label: "Assets" },
          { id: "shapes", icon: Square, label: "Shapes" },
          { id: "placeholders", icon: QrCode, label: "Smart Anchors" },
          { id: "layers", icon: Layers, label: "Layers" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[9px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Detail Content Column */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 1. Text Tab */}
        {activeTab === "text" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">Add Text</h3>
            <div className="grid gap-2">
              <button
                onClick={() => handleAddText("title")}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
              >
                <div>
                  <div className="font-serif text-sm font-bold text-white">Add Heading / Title</div>
                  <div className="text-[11px] text-slate-400">Cinzel · Bold · 32px</div>
                </div>
                <Plus className="h-4 w-4 text-indigo-400" />
              </button>

              <button
                onClick={() => handleAddText("subtitle")}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
              >
                <div>
                  <div className="text-xs font-semibold text-white">Add Subheading</div>
                  <div className="text-[11px] text-slate-400">Inter · Medium · 16px</div>
                </div>
                <Plus className="h-4 w-4 text-indigo-400" />
              </button>

              <button
                onClick={() => handleAddText("body")}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
              >
                <div>
                  <div className="text-xs font-normal text-slate-300">Add Paragraph / Body</div>
                  <div className="text-[11px] text-slate-400">Inter · Normal · 14px</div>
                </div>
                <Plus className="h-4 w-4 text-indigo-400" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Variables Tab */}
        {activeTab === "variables" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Dynamic Variables
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                Click a variable to insert a dynamic data placeholder.
              </p>
            </div>

            <div className="grid gap-2">
              {PREDEFINED_CERTIFICATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => handleAddVariable(v.key, v.label)}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 p-2.5 text-left hover:border-indigo-500/50 hover:bg-slate-800 transition-all"
                >
                  <div className="overflow-hidden">
                    <span className="font-mono text-xs font-semibold text-indigo-400">
                      {`{{${v.key}}}`}
                    </span>
                    <div className="truncate text-[10px] text-slate-400">{v.label}</div>
                  </div>
                  <Plus className="h-4 w-4 text-indigo-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Assets Tab */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">Images & Assets</h3>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/10 p-4 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Institutional Logo</span>
            </button>

            <input
              ref={bgInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
            <button
              onClick={() => bgInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Replace Background Image</span>
            </button>
          </div>
        )}

        {/* 4. Shapes Tab */}
        {activeTab === "shapes" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">Shapes & Rules</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  addElement({
                    id: `el_rect_${Date.now().toString(36)}`,
                    type: "shape_rect",
                    x: 60,
                    y: 60,
                    width: template.page.width - 120,
                    height: template.page.height - 120,
                    rotation: 0,
                    opacity: 1.0,
                    zIndex: 1,
                    isLocked: false,
                    isHidden: false,
                    strokeColor: "#D97706",
                    strokeWidth: 2,
                    fillColor: "transparent",
                  })
                }
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 p-3 hover:border-indigo-500/50"
              >
                <Square className="h-6 w-6 text-amber-500" />
                <span className="mt-1 text-[11px] font-medium">Border Frame</span>
              </button>

              <button
                onClick={() =>
                  addElement({
                    id: `el_line_${Date.now().toString(36)}`,
                    type: "shape_line",
                    x: template.page.width / 2 - 150,
                    y: 490,
                    width: 300,
                    height: 2,
                    rotation: 0,
                    opacity: 1.0,
                    zIndex: template.elements.length + 1,
                    isLocked: false,
                    isHidden: false,
                    strokeColor: "#CBD5E1",
                    strokeWidth: 2,
                  })
                }
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 p-3 hover:border-indigo-500/50"
              >
                <div className="h-0.5 w-8 bg-indigo-400" />
                <span className="mt-3 text-[11px] font-medium">Separator Line</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Smart Placeholders Tab */}
        {activeTab === "placeholders" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Smart Placeholders
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                Anchors dynamically populated by Proofsy during issuance.
              </p>
            </div>

            <div className="grid gap-2.5">
              <button
                onClick={handleAddQR}
                className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-left hover:bg-indigo-500/20 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-300">QR Verification Code</div>
                  <div className="text-[10px] text-slate-400">Proofsy branded verification link</div>
                </div>
              </button>

              <button
                onClick={handleAddSignature}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-left hover:border-indigo-500/40 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-white">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Authorized Signature</div>
                  <div className="text-[10px] text-slate-400">Signatory credentials & line</div>
                </div>
              </button>

              <button
                onClick={handleAddSeal}
                className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left hover:bg-amber-500/20 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">Institutional Seal</div>
                  <div className="text-[10px] text-slate-400">Foil or emboss stamp anchor</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 6. Layers Tab */}
        {activeTab === "layers" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
              Layers ({template.elements.length})
            </h3>

            <div className="space-y-1.5">
              {sortedElements.map((el) => {
                const isSelected = selectedElementIds.includes(el.id);
                return (
                  <div
                    key={el.id}
                    onClick={() => selectElement(el.id)}
                    className={`flex items-center justify-between rounded-lg p-2 text-xs transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow"
                        : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate max-w-[130px]">
                      {el.type === "variable_text"
                        ? `{{${el.variableKey}}}`
                        : el.text || el.type}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(el.id, { isHidden: !el.isHidden });
                        }}
                        className="p-1 hover:text-white"
                        title={el.isHidden ? "Show" : "Hide"}
                      >
                        {el.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(el.id, { isLocked: !el.isLocked });
                        }}
                        className="p-1 hover:text-white"
                        title={el.isLocked ? "Unlock" : "Lock"}
                      >
                        {el.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderElement(el.id, "forward");
                        }}
                        className="p-1 hover:text-white"
                        title="Bring Forward"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderElement(el.id, "backward");
                        }}
                        className="p-1 hover:text-white"
                        title="Send Backward"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeElement(el.id);
                        }}
                        className="p-1 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
