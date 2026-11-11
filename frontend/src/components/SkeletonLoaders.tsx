"use client";

import React from "react";

// Reusable animated skeleton block
export function SkeletonBlock({
  className = "",
  rounded = "rounded-xl",
  style,
}: {
  className?: string;
  rounded?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`bg-slate-200/80 animate-pulse ${rounded} ${className}`}
    />
  );
}

// 4-column metric cards skeleton
export function MetricsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="w-10 h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-28" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Enterprise table skeleton
export function TableSkeleton({
  rows = 5,
  cols = 5,
  hasHeader = true,
}: {
  rows?: number;
  cols?: number;
  hasHeader?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      {hasHeader && (
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-9 w-48 rounded-xl" />
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1">
              <SkeletonBlock className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-8 w-16 rounded-lg" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Template gallery grid skeleton
export function TemplateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col justify-between"
        >
          {/* Certificate Frame Mockup */}
          <div className="h-48 bg-slate-100/80 p-6 flex flex-col justify-between relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-8 h-8 rounded-lg" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2 text-center my-auto">
              <SkeletonBlock className="h-3 w-28 mx-auto" />
              <SkeletonBlock className="h-6 w-44 mx-auto" />
              <SkeletonBlock className="h-3 w-36 mx-auto" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <SkeletonBlock className="h-2.5 w-16" />
              <SkeletonBlock className="h-2.5 w-20" />
            </div>
          </div>

          {/* Details & Actions */}
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-4 w-16 rounded" />
              </div>
              <SkeletonBlock className="h-3 w-full" />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <SkeletonBlock className="h-9 flex-1 rounded-xl" />
              <SkeletonBlock className="h-9 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Analytics chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-3 w-60" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-8 w-20 rounded-lg" />
          <SkeletonBlock className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="h-64 bg-slate-50 rounded-xl p-4 flex items-end justify-between gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <SkeletonBlock
              className="w-full rounded-t-md"
              style={{ height: `${Math.max(20, Math.floor(Math.random() * 85))}%` } as any}
            />
            <SkeletonBlock className="h-2.5 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Event detail page header skeleton
export function EventDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-6 w-24 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="h-8 w-72" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
        </div>
      </div>
      <MetricsGridSkeleton count={3} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
