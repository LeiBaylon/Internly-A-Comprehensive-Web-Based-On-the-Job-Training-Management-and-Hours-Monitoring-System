import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import ClientShell from "./ClientShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Internly — Effortless Weekly Reporting & Hour Tracking",
  description: "A comprehensive web-based on-the-job training management system. Log daily activities, generate formatted weekly reports, and track real-time progress toward hour requirements.",
  keywords: ["internship", "hour tracking", "weekly report", "OJT", "training management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProvider>
          <ClientShell>
            {children}
          </ClientShell>
        </AppProvider>
      </body>
    </html>
  );
}
