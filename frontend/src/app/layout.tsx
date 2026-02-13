import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SkipLink } from "@/components/layout/skip-link";
import { RootShell } from "@/components/layout/root-shell";
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

export const metadata: Metadata = {
  title: {
    default: "Quantum X - AI Quantitative Trading Platform",
    template: "%s | Quantum X",
  },
  description:
    "Professional-grade quantitative trading platform with AI-powered strategies",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <SkipLink />
            <RootShell>{children}</RootShell>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
