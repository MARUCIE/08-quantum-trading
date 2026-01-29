import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { DynamicSidebar } from "@/components/layout/dynamic-sidebar";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { Providers } from "@/components/providers";
import "./globals.css";

// Optimize viewport for faster rendering
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quantum X - AI Quantitative Trading Platform",
  description:
    "Professional-grade quantitative trading platform with AI-powered strategies",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale and messages for i18n
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <SkipLink />
            <div className="flex h-dvh overflow-hidden">
              <DynamicSidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main
                  id="main-content"
                  className="flex-1 overflow-auto bg-background p-4 md:p-6 custom-scrollbar"
                  tabIndex={-1}
                >
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
