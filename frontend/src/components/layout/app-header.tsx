"use client";

import * as React from "react";

export function AppHeader() {
  return (
    <header className="fixed top-0 right-0 z-40 h-16 border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-white/50 backdrop-blur-sm shadow-sm transition-all duration-300 box-border" 
            style={{ 
              left: 'var(--sidebar-width, 320px)',
              transition: 'left 300ms ease-out'
            }}>
      <div className="flex h-16 items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0 relative overflow-hidden">
            <img 
              src="/Comet.png" 
              alt="Comet Logo" 
              className="w-10 h-10 object-contain"
              style={{ 
                mixBlendMode: 'multiply',
                filter: 'brightness(0) invert(1)'
              }}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold tracking-tight text-slate-900 truncate">Comet DevOps</span>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 truncate">DEVOPS PLATFORM</span>
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
