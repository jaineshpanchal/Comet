"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { RealTimeNotifications } from "@/components/RealTimeNotifications";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSocketProvider url={process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}>
      <RealTimeNotifications />
      <div className="min-h-screen bg-neutral-50/50">
        <Sidebar>
          <main className="pt-16">
            <EmailVerificationBanner />
            <AppHeader />
            <div className="px-6 py-8 lg:px-8">{children}</div>
          </main>
        </Sidebar>
      </div>
    </WebSocketProvider>
  );
}
