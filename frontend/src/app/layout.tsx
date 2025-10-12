import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

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
        <div className="min-h-screen bg-white text-gray-900">
          {/* Global shell for marketing pages; app sections provide their own layouts */}
          {children}
        </div>
      </body>
    </html>
  );
}