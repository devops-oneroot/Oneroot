import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NumberInputScrollLock } from "@/components/ui/NumberInputScrollLock";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OneRoot Sales CRM",
  description: "OneRoot team sales pipeline and lead management",
  icons: {
    icon: "/oneroot_logo_black.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <AuthProvider>
            <NumberInputScrollLock />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
