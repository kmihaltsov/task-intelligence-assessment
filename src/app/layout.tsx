import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Intelligence Dashboard",
  description: "AI-powered task categorization, prioritization, and action planning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ground-50">
        <nav className="bg-white shadow-sm">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-500 text-white text-xs font-bold tracking-tight">
                TI
              </span>
              <span className="text-[15px] font-semibold text-neutral-900 tracking-tight">
                Task Intelligence
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Submit
              </Link>
              <Link
                href="/tasks"
                className="px-3 py-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Tasks
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}