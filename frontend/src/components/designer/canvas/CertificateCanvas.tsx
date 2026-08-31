"use client";

import React, { useRef, useState, useEffect } from "react";
import { CanvasElement } from "@/types/designer/template";
import { useDesignerStore } from "@/store/designer/useDesignerStore";
import { TransformGizmo } from "./TransformGizmo";
import { SmartGuides } from "./SmartGuides";
import { QrCode, Award, ShieldCheck, PenTool, Hand, ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

export const CertificateCanvas: React.FC = () => {
  const {
    template,
    selectedElementIds,
    selectElement,
    clearSelection,
    updateElement,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    viewMode,
    activeGuideLines,
  } = useDesignerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Handle Spacebar hold for Hand/Pan tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isSpacePressed && (e.target as HTMLElement).tagName !== "INPUT") {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  // Canvas Mouse Down: Start Pan or Clear Selection
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const isBgClick = e.target === containerRef.current || (e.target as HTMLElement).dataset.canvasBg;
    if (e.button === 1 || isBgClick || isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
      if (isBgClick) {
        clearSelection();
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: Math.round(panStartRef.current.startPanX + dx),
        y: Math.round(panStartRef.current.startPanY + dy),
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Wheel Panning & Zooming
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      setZoom(Math.min(3.0, Math.max(0.2, Number((zoom + delta).toFixed(2)))));
    } else {
      setPanOffset({
        x: Math.round(panOffset.x - e.deltaX * 0.7),
        y: Math.round(panOffset.y - e.deltaY * 0.7),
      });
    }
  };

  // Direct Drag Element Handler
  const handleElementMouseDown = (e: React.MouseEvent, elId: string) => {
    if (isSpacePressed) return; // Allow spacebar pan over elements

    e.stopPropagation();
    selectElement(elId, e.shiftKey);

    const startX = e.clientX;
    const startY = e.clientY;
    const targetEl = template.elements.find((item) => item.id === elId);
    if (!targetEl || targetEl.isLocked) return;

    const initialElX = targetEl.x;
    const initialElY = targetEl.y;

    const onDocMouseMove = (moveEvt: MouseEvent) => {
      const dx = (moveEvt.clientX - startX) / zoom;
      const dy = (moveEvt.clientY - startY) / zoom;
      updateElement(elId, {
        x: Math.round(initialElX + dx),
        y: Math.round(initialElY + dy),
      });
    };

    const onDocMouseUp = () => {
      document.removeEventListener("mousemove", onDocMouseMove);
      document.removeEventListener("mouseup", onDocMouseUp);
    };

    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", onDocMouseUp);
  };

  const { page, background, elements } = template;
  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const bgOpacity =
    viewMode === "clean"
      ? 0
      : viewMode === "hybrid"
      ? 0.20
      : (background.opacity ?? 1.0);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
      className={`relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950 p-8 select-none ${
        isPanning || isSpacePressed ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
    >
      {/* Scaled Canvas Container */}
      <div
        className="relative shadow-2xl transition-transform duration-75 ease-out"
        style={{
          width: `${page.width}px`,
          height: `${page.height}px`,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        {/* Background Layer */}
        <div
          data-canvas-bg="true"
          className="absolute inset-0 overflow-hidden rounded-sm bg-white shadow-xl"
          style={{
            backgroundColor: background.color || "#ffffff",
          }}
        >
          {background.url && bgOpacity > 0 && (
            <img
              src={background.url}
              alt="Certificate Background"
              className="pointer-events-none h-full w-full object-contain"
              style={{ opacity: bgOpacity }}
            />
          )}
        </div>

        {/* Elements Layer */}
        <div className="absolute inset-0">
          {sortedElements.map((el) => {
            if (el.isHidden) return null;
            const isSelected = selectedElementIds.includes(el.id);

            const isTextElement = el.type === "text";
            const isVariable = el.type === "variable_text";
            const hideStaticInArtwork = viewMode === "artwork" && isTextElement && !isSelected;

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                className={`absolute cursor-move transition-all ${
                  el.isLocked ? "pointer-events-none" : ""
                } ${isSelected ? "z-40 ring-2 ring-indigo-500 rounded bg-white/95 shadow-md" : ""} ${
                  hideStaticInArtwork ? "hover:bg-indigo-500/15 hover:ring-1 hover:ring-indigo-400 rounded" : ""
                }`}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  opacity: el.opacity ?? 1.0,
                  zIndex: el.zIndex,
                }}
              >
                {/* 1. Text & Variable Text */}
                {(el.type === "text" || el.type === "variable_text") && (
                  <div
                    className={`h-full w-full select-none ${
                      hideStaticInArtwork ? "opacity-0 hover:opacity-100 bg-white/90 px-1 rounded" : ""
                    } ${isSelected ? "bg-white px-1 rounded shadow-sm" : ""}`}
                    style={{
                      fontFamily: el.fontFamily || "Inter",
                      fontSize: `${el.fontSize || 14}px`,
                      fontWeight: el.fontWeight || "normal",
                      fontStyle: el.fontStyle || "normal",
                      color: el.color || "#0F172A",
                      textAlign: el.textAlign || "left",
                      letterSpacing: `${el.letterSpacing || 0}px`,
                      lineHeight: el.lineHeight || 1.2,
                      textTransform: el.textTransform || "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        el.textAlign === "left"
                          ? "flex-start"
                          : el.textAlign === "right"
                          ? "flex-end"
                          : "center",
                    }}
                  >
                    {isVariable ? (
                      <span className="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm ring-1 ring-indigo-400">
                        {el.text || `{{${el.variableKey}}}`}
                      </span>
                    ) : (
                      el.text || "Text"
                    )}
                  </div>
                )}

                {/* 2. Image / Logo */}
                {el.type === "image" && el.assetUrl && (
                  <img
                    src={el.assetUrl}
                    alt="Asset"
                    className="h-full w-full object-contain pointer-events-none"
                  />
                )}

                {/* 3. Shapes */}
                {el.type === "shape_rect" && (
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundColor: el.fillColor || "transparent",
                      borderColor: el.strokeColor || "#000000",
                      borderWidth: `${el.strokeWidth || 1}px`,
                      borderRadius: `${el.borderRadius || 0}px`,
                    }}
                  />
                )}

                {/* 4. QR Code Placeholder */}
                {el.type === "qr_placeholder" && (
                  <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/90 p-2 text-indigo-700 shadow-sm backdrop-blur-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                      <QrCode className="h-7 w-7" />
                    </div>
                    <span className="mt-1 text-[10px] font-bold tracking-wider uppercase text-indigo-900">
                      [QR Verification]
                    </span>
                  </div>
                )}

                {/* 5. Institutional Seal */}
                {el.type === "seal_placeholder" && (
                  <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dashed border-amber-400 bg-amber-50/90 p-2 text-amber-700 shadow-sm">
                    <Award className="h-8 w-8 text-amber-600" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900">
                      Proofsy Stamp
                    </span>
                  </div>
                )}

                {/* 6. Signature Line */}
                {el.type === "signature_placeholder" && (
                  <div className="flex h-full w-full flex-col justify-end">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <PenTool className="h-3 w-3" />
                      <span className="text-[10px] font-medium">{el.signatureConfig?.signerName || "Dean / Principal"}</span>
                    </div>
                    <div className="w-full border-b-2 border-slate-700" />
                    <span className="mt-1 text-[10px] text-slate-500">{el.signatureConfig?.signerDesignation || "Office of the Registrar"}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Transform Gizmo with resize handles */}
        {selectedElementIds.length === 1 && (
          (() => {
            const selectedElement = template.elements.find((el) => el.id === selectedElementIds[0]);
            if (!selectedElement || selectedElement.isLocked) return null;
            return <TransformGizmo element={selectedElement} zoom={zoom} />;
          })()
        )}

        {/* Dynamic Snap Align Guides */}
        <SmartGuides guides={activeGuideLines} canvasWidth={page.width} canvasHeight={page.height} />
      </div>

      {/* Floating Canvas Navigation Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setPanOffset({ x: 0, y: 0 })}
          title="Center Certificate Canvas"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Move className="h-3.5 w-3.5" />
          <span>Center View</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={() => setZoom(Math.max(0.2, Number((zoom - 0.1).toFixed(2))))}
          title="Zoom Out"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="min-w-[44px] text-center text-xs font-semibold text-slate-200">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(Math.min(3.0, Number((zoom + 0.1).toFixed(2))))}
          title="Zoom In"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            setZoom(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          title="Reset to 100%"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
