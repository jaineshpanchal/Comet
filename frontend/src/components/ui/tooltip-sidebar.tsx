"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

export function SidebarTooltip({
  children,
  content,
  side = "right",
  delayDuration = 100,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const positionRef = React.useRef({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    // Calculate position and store in ref (synchronous)
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      positionRef.current = {
        top: rect.top + rect.height / 2,
        left: rect.right + 16,
      };
    }

    // Show tooltip after delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipContent = isVisible && typeof window !== 'undefined' ? (
    createPortal(
      <div
        className="fixed pointer-events-none animate-in fade-in-0 slide-in-from-left-2 duration-200"
        style={{
          top: `${positionRef.current.top}px`,
          left: `${positionRef.current.left}px`,
          transform: "translateY(-50%)",
          zIndex: 99999,
        }}
      >
        <div
          className="relative px-3.5 py-2 text-white text-sm font-semibold whitespace-nowrap backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(79, 70, 229) 100%)",
            boxShadow: "0 8px 32px -8px rgba(59, 130, 246, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
            borderRadius: "10px",
          }}
        >
          {content}

          {/* Sleek arrow */}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "6px solid rgb(59, 130, 246)",
            }}
          />

          {/* Subtle top highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)",
            }}
          />
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="relative flex items-center justify-center w-full h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {tooltipContent}
    </>
  );
}
