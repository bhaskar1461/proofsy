"use client";

import React from "react";
import { useDesignerStore } from "@/store/designer/useDesignerStore";
import { PREDEFINED_CERTIFICATE_VARIABLES } from "@/types/designer/variables";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  Minus,
  Bold,
  Italic,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Variable,
  Layers,
} from "lucide-react";

const AVAILABLE_GOOGLE_FONTS = [
  "Inter",
  "Cinzel",
  "Playfair Display",
  "Great Vibes",
  "Montserrat",
  "Poppins",
  "Roboto",
  "Merriweather",
  "Lora",
  "Cormorant Garamond",
  "Arial",
  "Times New Roman",
];

export const InspectorPanel: React.FC = () => {
  const {
    template,
    selectedElementIds,
    updateElement,
    removeElement,
    duplicateSelected,
    alignSelected,
    bindVariable,
  } = useDesignerStore();

  const selectedElement = template.elements.find((el) => selectedElementIds.includes(el.id));

  if (!selectedElement) {
    return (
      <aside className="flex h-full w-80 flex-col items-center justify-center border-l border-slate-800 bg-slate-900 p-6 text-center text-slate-400 select-none">
        <Layers className="mb-3 h-10 w-10 text-slate-600" />
        <h4 className="text-sm font-semibold text-slate-300">No Element Selected</h4>
        <p className="mt-1 text-xs text-slate-500">
          Click on any text, placeholder, or asset on the certificate canvas to inspect and edit its properties.
        </p>
      </aside>
    );
  }

  const isTextType = selectedElement.type === "text" || selectedElement.type === "variable_text";

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-900 text-slate-200 select-none overflow-y-auto p-4 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
            {selectedElement.type.replace("_", " ")}
          </span>
          <h3 className="truncate max-w-[150px] text-xs font-semibold text-white">
            {selectedElement.type === "variable_text"
              ? `{{${selectedElement.variableKey}}}`
              : selectedElement.text || "Element"}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
            className={`rounded-lg p-1.5 transition-colors ${
              selectedElement.isLocked ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:bg-slate-800"
            }`}
            title={selectedElement.isLocked ? "Unlock" : "Lock"}
          >
            {selectedElement.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>

          <button
            onClick={duplicateSelected}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={() => removeElement(selectedElement.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 1. Dynamic Variable Binding (CORE FEATURE) */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
          <Variable className="h-4 w-4" />
          <span>Dynamic Variable Binding</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Map this element to dynamic recipient or event data.
        </p>

        <select
          value={selectedElement.variableKey || ""}
          onChange={(e) => {
            if (e.target.value) {
              bindVariable(selectedElement.id, e.target.value);
            } else {
              updateElement(selectedElement.id, {
                type: "text",
                variableKey: undefined,
                text: selectedElement.fallbackText || "Custom Text",
              });
            }
          }}
          className="mt-2.5 w-full rounded-lg border border-indigo-500/40 bg-slate-950 p-2 text-xs font-medium text-indigo-200 outline-none focus:border-indigo-500"
        >
          <option value="">Static Text (No Variable)</option>
          {PREDEFINED_CERTIFICATE_VARIABLES.map((v) => (
            <option key={v.key} value={v.key}>
              {`{{${v.key}}}`} — {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Position & Geometry */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400">Position & Size</h4>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-slate-400">X (px)</label>
            <input
              type="number"
              value={selectedElement.x}
              onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Y (px)</label>
            <input
              type="number"
              value={selectedElement.y}
              onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Width</label>
            <input
              type="number"
              value={selectedElement.width}
              onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400">Height</label>
            <input
              type="number"
              value={selectedElement.height}
              onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 16 })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Alignment Controls */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => alignSelected("left")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => alignSelected("center")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => alignSelected("right")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => alignSelected("top")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Align Top"
          >
            <ArrowUpToLine className="h-4 w-4" />
          </button>
          <button
            onClick={() => alignSelected("middle")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Align Middle"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => alignSelected("bottom")}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Align Bottom"
          >
            <ArrowDownToLine className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Typography Controls (Text / Variable Text) */}
      {isTextType && (
        <div className="space-y-3.5 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400">Typography</h4>

          {/* Text Content Input */}
          {selectedElement.type === "text" && (
            <div>
              <label className="text-[10px] text-slate-400">Static Text Value</label>
              <textarea
                rows={2}
                value={selectedElement.text || ""}
                onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Font Family */}
          <div>
            <label className="text-[10px] text-slate-400">Font Family</label>
            <select
              value={selectedElement.fontFamily || "Inter"}
              onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {AVAILABLE_GOOGLE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400">Font Size (px)</label>
              <input
                type="number"
                value={selectedElement.fontSize || 24}
                onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400">Weight</label>
              <select
                value={selectedElement.fontWeight || "normal"}
                onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value as any })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="bold">Bold</option>
                <option value="800">Extra Bold</option>
              </select>
            </div>
          </div>

          {/* Formatting Toggles & Color */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              <button
                onClick={() =>
                  updateElement(selectedElement.id, {
                    fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`rounded p-1.5 ${
                  selectedElement.fontWeight === "bold" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </button>

              <button
                onClick={() =>
                  updateElement(selectedElement.id, {
                    fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                className={`rounded p-1.5 ${
                  selectedElement.fontStyle === "italic" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1">
              <input
                type="color"
                value={selectedElement.color || "#000000"}
                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
              />
              <span className="font-mono text-xs text-slate-300">{selectedElement.color || "#000000"}</span>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="text-[10px] text-slate-400">Alignment</label>
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                  className={`flex-1 rounded py-1 text-center text-xs capitalize ${
                    selectedElement.textAlign === align ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Spacing */}
          <div>
            <label className="text-[10px] text-slate-400">Letter Spacing ({selectedElement.letterSpacing || 0}px)</label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={selectedElement.letterSpacing || 0}
              onChange={(e) => updateElement(selectedElement.id, { letterSpacing: parseInt(e.target.value) || 0 })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 4. QR Placeholder Config */}
      {selectedElement.type === "qr_placeholder" && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold tracking-wider uppercase text-indigo-400">QR Code Configuration</h4>

          <div>
            <label className="text-[10px] text-slate-400">Style</label>
            <select
              value={selectedElement.qrConfig?.style || "circular_premium"}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  qrConfig: { purpose: "certificate_verification" as const, ...selectedElement.qrConfig, style: e.target.value as any },
                })
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
            >
              <option value="circular_premium">Proofsy Circular Branded</option>
              <option value="standard_square">Standard Square</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400">Error Correction Level</label>
            <select
              value={selectedElement.qrConfig?.errorCorrectionLevel || "H"}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  qrConfig: { purpose: "certificate_verification" as const, ...selectedElement.qrConfig, errorCorrectionLevel: e.target.value as any },
                })
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
            >
              <option value="H">High (30% recovery - Recommended for center logo)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="M">Medium (15%)</option>
            </select>
          </div>
        </div>
      )}

      {/* 5. Signature Block Config */}
      {selectedElement.type === "signature_placeholder" && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold tracking-wider uppercase text-indigo-400">Signatory Details</h4>

          <div>
            <label className="text-[10px] text-slate-400">Signer Name</label>
            <input
              type="text"
              value={selectedElement.signatureConfig?.signerName || ""}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  signatureConfig: { ...selectedElement.signatureConfig, signerName: e.target.value } as any,
                })
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400">Signer Role / Title</label>
            <input
              type="text"
              value={selectedElement.signatureConfig?.signerDesignation || ""}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  signatureConfig: { ...selectedElement.signatureConfig, signerDesignation: e.target.value } as any,
                })
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
            />
          </div>
        </div>
      )}
    </aside>
  );
};
