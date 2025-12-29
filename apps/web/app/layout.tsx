import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Navbar from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GamificationProvider } from "@/components/gamification";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '이룸 - 온전한 나는?',
    template: '%s | 이룸',
  },
  description: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션을 제공하는 웰니스 플랫폼',
  keywords: ['퍼스널컬러', '피부분석', '체형분석', 'AI분석', '뷰티', '웰니스', '이룸'],
  authors: [{ name: '이룸' }],
  creator: '이룸',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: '이룸',
    title: '이룸 - 온전한 나는?',
    description: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '이룸 - 온전한 나는?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '이룸 - 온전한 나는?',
    description: 'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.webmanifest', // PWA manifest - middleware에서 제외됨
  other: {
    'theme-color': '#2e5afa', // 이룸 블루 - manifest와 동일
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko" suppressHydrationWarning>
        <head>
          {/* Preconnect hints for external domains - Lighthouse Performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://supabase.co" />
        </head>
        <body
          className={`${inter.variable} ${notoSansKR.variable} antialiased font-sans bg-background text-foreground`}
          style={{ fontFamily: 'Inter, "Noto Sans KR", sans-serif' }}
        >
          <ThemeProvider defaultTheme="system">
            <OfflineBanner />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50"
            >
              본문으로 건너뛰기
            </a>
            <SyncUserProvider>
              <GamificationProvider>
                <Navbar />
                <main id="main-content" className="pb-16 md:pb-0">
                  {children}
                </main>
                <BottomNav />
              </GamificationProvider>
              <Toaster
                position="top-center"
                theme="system"
                toastOptions={{
                  classNames: {
                    toast: 'bg-card border border-border text-foreground shadow-lg',
                    title: 'text-foreground font-medium',
                    description: 'text-muted-foreground',
                    success: '!bg-status-success/10 !border-status-success/30 !text-status-success',
                    error: '!bg-status-error/10 !border-status-error/30 !text-status-error',
                    warning: '!bg-status-warning/10 !border-status-warning/30 !text-status-warning',
                    info: '!bg-primary/10 !border-primary/30 !text-primary',
                  },
                }}
              />
            </SyncUserProvider>
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
