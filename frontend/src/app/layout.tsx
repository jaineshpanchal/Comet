import type { Metadata } from "next";
import "../styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Comet DevOps Platform",
  description: "Complete end-to-end release management and DevOps automation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          <div className="min-h-screen bg-white text-gray-900">
            {/* Global shell for marketing pages; app sections provide their own layouts */}
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}