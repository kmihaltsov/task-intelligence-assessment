import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NavActions } from "@/components/nav-actions";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Task Intelligence Dashboard",
  description: "AI-powered task categorization, prioritization, and action planning",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-ground-50 overflow-x-hidden ${inter.className}`}>
        <nav className="bg-white shadow-sm">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-500 text-white text-sm font-bold tracking-tight">
                TI
              </span>
              <span className="text-base font-semibold text-neutral-900 tracking-tight">
                Task Intelligence
              </span>
            </Link>
            <NavActions />
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}