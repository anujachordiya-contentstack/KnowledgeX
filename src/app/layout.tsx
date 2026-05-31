import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "knowledgeX — Engineering Knowledge Base",
  description:
    "Curated explainers on caching, auth, DNS, CDN, edge functions, and more. Written by engineers, for engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
