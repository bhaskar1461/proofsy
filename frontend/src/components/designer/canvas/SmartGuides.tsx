"use client";

import React from "react";
import { GuideLine } from "@/store/designer/useDesignerStore";

interface SmartGuidesProps {
  guides: GuideLine[];
  canvasWidth: number;
  canvasHeight: number;
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({ guides, canvasWidth, canvasHeight }) => {
  if (!guides || guides.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-50 h-full w-full"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
    >
      {guides.map((guide, idx) => {
        if (guide.type === "x") {
          return (
            <line
              key={`guide-x-${idx}`}
              x1={guide.position}
              y1={0}
              x2={guide.position}
              y2={canvasHeight}
              stroke="#06B6D4"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        } else {
          return (
            <line
              key={`guide-y-${idx}`}
              x1={0}
              y1={guide.position}
              x2={canvasWidth}
              y2={guide.position}
              stroke="#06B6D4"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        }
      })}
    </svg>
  );
};
