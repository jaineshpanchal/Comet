"use client";

import * as React from "react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3L4 14h6l-2 7 9-11h-6l2-7z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-neutral-900">Comet</span>
            <span className="text-[10px] font-medium tracking-wide text-neutral-500 uppercase">DevOps Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700 md:flex">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
            Operational
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
