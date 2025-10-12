"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Sidebar />
      <main className="lg:pl-64">
        <AppHeader />
        <div className="px-6 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
