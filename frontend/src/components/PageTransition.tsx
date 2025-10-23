"use client";

import React from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * No Animation Page Transition
 *
 * Instant page changes - NProgress bar provides the only visual feedback.
 * This is how GitHub, YouTube, and Linear actually work.
 */

export function PageTransition({ children }: PageTransitionProps) {
  return <div className="h-full">{children}</div>;
}
