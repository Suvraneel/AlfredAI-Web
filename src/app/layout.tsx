import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AlfredAI — Your Team's Knowledge, Unified",
  description: "AI-powered B2B SaaS that connects your Jira, GitHub, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-bg-base text-text-primary antialiased font-sans">
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#18181B",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#FAFAFA",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
