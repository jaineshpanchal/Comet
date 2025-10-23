import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { CsrfProvider } from "@/components/providers/CsrfProvider";
import { ProgressBarProvider } from "@/components/providers/ProgressBarProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoLive DevOps Platform",
  description: "Complete end-to-end release management and DevOps automation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ProgressBarProvider />
        <CsrfProvider>
          <ToastProvider>
            <div className="min-h-screen bg-white text-gray-900">
              {/* Global shell for marketing pages; app sections provide their own layouts */}
              {children}
            </div>
          </ToastProvider>
        </CsrfProvider>
      </body>
    </html>
  );
}