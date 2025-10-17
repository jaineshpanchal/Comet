import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
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