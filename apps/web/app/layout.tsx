import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { koKR, enUS } from '@clerk/localizations';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import { DynamicToaster } from '@/components/providers/DynamicToaster';
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
import { GenderProvider } from '@/components/providers/gender-provider';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { WebVitalsProvider } from '@/components/providers/web-vitals-provider';
import './globals.css';

// Clerk 로컬라이제이션 맵
const clerkLocalizations = {
  ko: koKR,
  en: enUS,
} as const;

// 폰트 최적화: preload + display swap + subset 최소화
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  // LCP 최적화: 필수 weight만 로드
  weight: ['400', '500', '600', '700'],
});

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  // 한국어 서브셋은 next/font가 자동 분할 (unicode-range 기반)
  // weight 지정 시 필요한 글리프만 로드됨
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // ADR-098 정체성 재정의 v2 — 5축 AI 분석 (대중 카피: 셀카 한 장)
    default: '이룸 - 셀카 한 장으로 색·피부·체형·헤어 AI 분석',
    template: '%s | 이룸',
  },
  description:
    '셀카 한 장으로 퍼스널컬러·피부·체형·헤어·메이크업 5축을 AI가 분석하고, 오늘 입을 옷까지 추천해줘요.',
  keywords: [
    '퍼스널컬러',
    '피부분석',
    '체형분석',
    '헤어분석',
    '메이크업',
    'AI분석',
    '시각 정체성',
    '옷장',
    '코디',
    '이룸',
  ],
  authors: [{ name: '이룸' }],
  creator: '이룸',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: '이룸',
    title: '이룸 - 셀카 한 장으로 색·피부·체형·헤어 AI 분석',
    description: '셀카 한 장으로 퍼스널컬러·피부·체형·헤어·메이크업 5축을 AI가 분석해요.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '이룸 - 셀카 한 장으로 색·피부·체형·헤어 AI 분석',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '이룸 - 셀카 한 장으로 색·피부·체형·헤어 AI 분석',
    description: '셀카 한 장으로 퍼스널컬러·피부·체형·헤어·메이크업 5축을 AI가 분석해요.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.webmanifest', // PWA manifest - middleware에서 제외됨
  other: {
    'theme-color': '#EC4899', // 이룸 핑크 - manifest와 동일
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#EC4899',
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
          {/* 테마 CLS 방지: 렌더링 전에 저장된 테마 적용 */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('yiroom-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){}})()`,
            }}
          />
          {/* Preconnect hints for external domains - Lighthouse Performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* Supabase - critical for home page data fetching */}
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://developers.kakao.com" />
          {/* Kakao SDK: 공유 기능 호출 시 동적 로드 (lib/kakao/lazy-sdk.ts) - LCP 최적화 */}
          {/* JSON-LD 구조화 데이터 */}
          <OrganizationJsonLd />
          <WebApplicationJsonLd />
          {/* Tawk.to 고객 지원 위젯 (환경변수 설정 시에만 로드) */}
          {process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `var Tawk_API=Tawk_API||{};var Tawk_LoadStart=new Date();(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];s1.async=true;s1.src='https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID}/default';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();`,
              }}
            />
          )}
        </head>
        <body
          className={`${inter.variable} ${notoSansKR.variable} antialiased bg-background text-foreground`}
          style={{ fontFamily: 'Inter, "Noto Sans KR", system-ui, sans-serif' }}
        >
          <ThemeProvider defaultTheme="dark">
            <I18nProvider locale={locale} messages={messages}>
              <OfflineBanner />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-primary focus:ring-2 focus:ring-primary/50"
              >
                {{
                  ko: '본문으로 건너뛰기',
                  ja: 'メインコンテンツへスキップ',
                  zh: '跳至主要内容',
                  en: 'Skip to main content',
                }[locale] ?? 'Skip to main content'}
              </a>
              <SyncUserProvider>
                <GenderProvider>
                  <GamificationProvider>
                    <Navbar />
                    <main id="main-content" className="pb-bottom-nav md:pb-0">
                      {children}
                    </main>
                    <BottomNav />
                    <PWAInstallPrompt />
                  </GamificationProvider>
                </GenderProvider>
                <DynamicToaster />
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
