"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeout = React.useRef<number | undefined>(undefined);

  const show = () => {
    window.clearTimeout(timeout.current);
    setOpen(true);
  };
  const hide = () => {
    timeout.current = window.setTimeout(() => setOpen(false), 100);
  };

  return (
    <div className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {open && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-md dark:bg-gray-800",
            "left-1/2 mt-2",
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
