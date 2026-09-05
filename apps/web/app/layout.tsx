import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { koKR, enUS } from '@clerk/localizations';
import { Inter, Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { DynamicToaster } from '@/components/providers/DynamicToaster';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getLocale, getMessages } from 'next-intl/server';

import Navbar from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { OfflineBanner } from '@/components/OfflineBanner';
import { StaleDeploymentBanner } from '@/components/StaleDeploymentBanner';
import { PWAInstallPrompt, OrganizationJsonLd, WebApplicationJsonLd } from '@/components/common';
import { SyncUserProvider } from '@/components/providers/sync-user-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { GamificationProvider } from '@/components/gamification';
import { GenderProvider } from '@/components/providers/gender-provider';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { WebVitalsProvider } from '@/components/providers/web-vitals-provider';
import { pickClientMessages } from '@/lib/i18n/client-messages';
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

// 에디토리얼 세리프(결과 리포트·공유카드 시그니처) — 없으면 font-serif가 기기별
// 시스템 세리프로 폴백해 한글 품질이 들쭉날쭉해진다. 홈 크리티컬 패스 보호를 위해 preload 제외.
const notoSerifKR = Noto_Serif_KR({
  variable: '--font-noto-serif-kr',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yiroom.app';

// 현재 OG 제목·설명은 한국어 정본이다. 언어별 고유 URL과 메타 카피를 함께
// 마련하기 전에는 요청 UI 로케일을 OG 로케일인 것처럼 표시하지 않는다.
const OPEN_GRAPH_CONTENT_LOCALE = 'ko_KR';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // ADR-098 정체성 재정의 v2 — 5축 AI 분석 (대중 카피: 셀카 한 장)
    default: '이룸 - 셀카 한 장으로 색·피부·헤어·메이크업 AI 분석',
    template: '%s | 이룸',
  },
  description:
    '셀카 한 장으로 퍼스널컬러·피부·헤어·메이크업을, 전신 사진을 더하면 체형까지 AI가 분석하고 오늘 입을 옷까지 추천해줘요.',
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
    url: siteUrl,
    siteName: '이룸',
    title: '이룸 - 셀카 한 장으로 색·피부·헤어·메이크업 AI 분석',
    description:
      '셀카 한 장으로 퍼스널컬러·피부·헤어·메이크업을, 전신 사진을 더하면 체형까지 AI가 분석해요.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '이룸 - 셀카 한 장으로 색·피부·헤어·메이크업 AI 분석',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '이룸 - 셀카 한 장으로 색·피부·헤어·메이크업 AI 분석',
    description:
      '셀카 한 장으로 퍼스널컬러·피부·헤어·메이크업을, 전신 사진을 더하면 체형까지 AI가 분석해요.',
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
  const messages = pickClientMessages(await getMessages());
  const clerkLocalization = clerkLocalizations[locale as keyof typeof clerkLocalizations] || koKR;
  // 하단 탭바는 로그인 사용자 전용 앱 셸이다. 5탭 목적지가 모두 로그인 게이트라
  // 비로그인(랜딩 `/` 포함)에 띄우면 "가입도 안 했는데 앱 안에 있는" 오독을 만든다.
  // 탭바를 감출 땐 본문 하단 패딩(pb-bottom-nav)도 같이 풀어야 빈 여백이 남지 않는다.
  const { userId } = await auth();
  const showBottomNav = Boolean(userId);

  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang={locale} suppressHydrationWarning>
        <head>
          {/* 하위 openGraph가 부모 객체를 덮어써도 실제 OG 카피 언어를 전 페이지에 유지한다. */}
          <meta property="og:locale" content={OPEN_GRAPH_CONTENT_LOCALE} />
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
          className={`${inter.variable} ${notoSansKR.variable} ${notoSerifKR.variable} antialiased bg-background text-foreground`}
          style={{ fontFamily: 'Inter, "Noto Sans KR", system-ui, sans-serif' }}
        >
          <ThemeProvider defaultTheme="system">
            <I18nProvider locale={locale} messages={messages}>
              <StaleDeploymentBanner />
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
                    <main
                      id="main-content"
                      className={showBottomNav ? 'pb-bottom-nav md:pb-0' : undefined}
                    >
                      {children}
                    </main>
                    {showBottomNav && <BottomNav />}
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
