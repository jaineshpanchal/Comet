"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { RealTimeNotifications } from "@/components/RealTimeNotifications";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";

function AppContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <AppHeader />
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-16 lg:pt-16",
        collapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <EmailVerificationBanner />
        <PageTransition>
          <div className="px-6 py-8 lg:px-8">{children}</div>
        </PageTransition>
      </main>
    </>
  );
}

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSocketProvider url={process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}>
      <SidebarProvider>
        <RealTimeNotifications />
        <div className="min-h-screen bg-neutral-50/50">
          <AppContent>{children}</AppContent>
        </div>
      </SidebarProvider>
    </WebSocketProvider>
  );
}
