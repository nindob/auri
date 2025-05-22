import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auri",
  description:
    "Synchronize music playback across multiple devices in real-time",
  keywords: ["music", "sync", "audio", "collaboration", "real-time"],
  authors: [{ name: "Anindya Barua" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          inter.variable,
          "antialiased font-sans dark selection:bg-primary-800 selection:text-white"
        )}
      >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}