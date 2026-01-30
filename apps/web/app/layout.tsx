import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { koKR, enUS } from '@clerk/localizations';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getLocale, getMessages } from 'next-intl/server';

import Navbar from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { OfflineBanner } from '@/components/OfflineBanner';
import { PWAInstallPrompt, OrganizationJsonLd, WebApplicationJsonLd } from '@/components/common';
import { SyncUserProvider } from '@/components/providers/sync-user-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { GamificationProvider } from '@/components/gamification';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { WebVitalsProvider } from '@/components/providers/web-vitals-provider';
import './globals.css';

// Clerk 로컬라이제이션 맵
const clerkLocalizations = {
  ko: koKR,
  en: enUS,
} as const;

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '이룸 - 온전한 나는?',
    template: '%s | 이룸',
  },
  description:
    'AI 퍼스널 컬러, 피부, 체형 분석으로 나만의 맞춤 뷰티 솔루션을 제공하는 웰니스 플랫폼',
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
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

/**
 * iOS Safe Area 지원을 위한 Viewport 설정
 * viewport-fit=cover로 env(safe-area-inset-*) 활성화
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2e5afa',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const clerkLocalization = clerkLocalizations[locale as keyof typeof clerkLocalizations] || koKR;

  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang={locale} suppressHydrationWarning>
        <head>
          {/* Preconnect hints for external domains - Lighthouse Performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://supabase.co" />
          <link rel="dns-prefetch" href="https://developers.kakao.com" />
          {/* Kakao SDK for 소셜 공유 */}
          <script
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
            integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
            crossOrigin="anonymous"
            async
          />
          {/* JSON-LD 구조화 데이터 */}
          <OrganizationJsonLd />
          <WebApplicationJsonLd />
        </head>
        <body
          className={`${inter.variable} ${notoSansKR.variable} antialiased font-sans bg-background text-foreground`}
          style={{ fontFamily: 'Inter, "Noto Sans KR", sans-serif' }}
        >
          <ThemeProvider defaultTheme="system">
            <I18nProvider locale={locale} messages={messages}>
              <OfflineBanner />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-lg z-50"
              >
                {locale === 'ko' ? '본문으로 건너뛰기' : 'Skip to main content'}
              </a>
              <SyncUserProvider>
                <GamificationProvider>
                  <Navbar />
                  <main id="main-content" className="pb-bottom-nav md:pb-0">
                    {children}
                  </main>
                  <BottomNav />
                  <PWAInstallPrompt />
                </GamificationProvider>
                <Toaster
                  position="top-center"
                  theme="system"
                  toastOptions={{
                    classNames: {
                      toast: 'bg-card border border-border text-foreground shadow-lg',
                      title: 'text-foreground font-medium',
                      description: 'text-muted-foreground',
                      success:
                        '!bg-status-success/10 !border-status-success/30 !text-status-success',
                      error: '!bg-status-error/10 !border-status-error/30 !text-status-error',
                      warning:
                        '!bg-status-warning/10 !border-status-warning/30 !text-status-warning',
                      info: '!bg-primary/10 !border-primary/30 !text-primary',
                    },
                  }}
                />
              </SyncUserProvider>
            </I18nProvider>
            <Analytics />
            <SpeedInsights />
            <WebVitalsProvider />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
