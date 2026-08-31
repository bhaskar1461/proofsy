"use client";

import React, { useEffect, useState } from "react";
import { CanvasElement } from "../../types/template";
import { GuideLine, useDesignerStore } from "../../store/useDesignerStore";

interface TransformGizmoProps {
  element: CanvasElement;
  zoom: number;
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ element, zoom }) => {
  const { updateElement, setActiveGuideLines, template, snapToGuides } = useDesignerStore();

  const handleMouseDown = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    e.preventDefault();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = element.x;
    const startY = element.y;
    const startW = element.width;
    const startH = element.height;
    const startRotation = element.rotation || 0;

    const pageW = template.page.width;
    const pageH = template.page.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startMouseX) / zoom;
      const dy = (moveEvent.clientY - startMouseY) / zoom;

      const guides: GuideLine[] = [];

      if (action === "move") {
        let newX = Math.round(startX + dx);
        let newY = Math.round(startY + dy);

        if (snapToGuides) {
          // Snap center X
          const centerX = newX + startW / 2;
          if (Math.abs(centerX - pageW / 2) < 8) {
            newX = Math.round(pageW / 2 - startW / 2);
            guides.push({ type: "x", position: pageW / 2 });
          }

          // Snap center Y
          const centerY = newY + startH / 2;
          if (Math.abs(centerY - pageH / 2) < 8) {
            newY = Math.round(pageH / 2 - startH / 2);
            guides.push({ type: "y", position: pageH / 2 });
          }
        }

        setActiveGuideLines(guides);
        updateElement(element.id, { x: newX, y: newY });
      } else if (action.startsWith("resize-")) {
        const handle = action.replace("resize-", "");
        let newW = startW;
        let newH = startH;
        let newX = startX;
        let newY = startY;

        if (handle.includes("e")) newW = Math.max(20, startW + dx);
        if (handle.includes("s")) newH = Math.max(16, startH + dy);
        if (handle.includes("w")) {
          const proposedW = Math.max(20, startW - dx);
          newX = startX + (startW - proposedW);
          newW = proposedW;
        }
        if (handle.includes("n")) {
          const proposedH = Math.max(16, startH - dy);
          newY = startY + (startH - proposedH);
          newH = proposedH;
        }

        updateElement(element.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      } else if (action === "rotate") {
        const rectCenter = {
          x: (startX + startW / 2) * zoom,
          y: (startY + startH / 2) * zoom,
        };
        const angleRad = Math.atan2(moveEvent.clientY - rectCenter.y, moveEvent.clientX - rectCenter.x);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
        if (angleDeg < 0) angleDeg += 360;

        // Snap rotation to 0, 90, 180, 270 if close
        if (Math.abs(angleDeg % 90) < 4) {
          angleDeg = Math.round(angleDeg / 90) * 90;
        }

        updateElement(element.id, { rotation: angleDeg });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setActiveGuideLines([]);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      className="pointer-events-none absolute border-2 border-indigo-500 ring-1 ring-indigo-500/30"
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,

        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: "center center",
      }}
    >
      {/* Move Drag Area */}
      <div
        className="pointer-events-auto absolute inset-0 cursor-move"
        onMouseDown={(e) => handleMouseDown(e, "move")}
      />

      {/* Rotation Handle */}
      <div
        className="pointer-events-auto absolute -top-7 left-1/2 flex -translate-x-1/2 cursor-grab flex-col items-center"
        onMouseDown={(e) => handleMouseDown(e, "rotate")}
        title="Rotate element"
      >
        <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white shadow hover:scale-125 transition-transform" />
        <div className="h-3 w-0.5 bg-indigo-500" />
      </div>

      {/* 8 Resize Handles */}
      <div
        className="pointer-events-auto absolute -top-1.5 -left-1.5 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-nwse-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-nw")}
      />
      <div
        className="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-ns-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-n")}
      />
      <div
        className="pointer-events-auto absolute -top-1.5 -right-1.5 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-nesw-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-ne")}
      />
      <div
        className="pointer-events-auto absolute top-1/2 -right-1.5 -translate-y-1/2 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-ew-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-e")}
      />
      <div
        className="pointer-events-auto absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-nwse-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-se")}
      />
      <div
        className="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-ns-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-s")}
      />
      <div
        className="pointer-events-auto absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-nesw-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-sw")}
      />
      <div
        className="pointer-events-auto absolute top-1/2 -left-1.5 -translate-y-1/2 h-3 w-3 rounded-sm border border-indigo-600 bg-white shadow cursor-ew-resize hover:scale-125 transition-transform"
        onMouseDown={(e) => handleMouseDown(e, "resize-w")}
      />
    </div>
  );
};
