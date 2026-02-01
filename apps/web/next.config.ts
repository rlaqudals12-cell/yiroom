import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

// i18n 플러그인 (서버 컴포넌트에서 메시지 로드)
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * PWA 설정 (오프라인 지원 활성화)
 * Phase A-1: 2025-12-04
 * Task 6: 오프라인 지원 추가
 */
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // 오프라인 캐싱 활성화
  cacheOnFrontEndNav: true,
  // 커스텀 서비스 워커 (Push 핸들러 포함)
  customWorkerSrc: 'worker',
  // 런타임 캐싱 설정
  workboxOptions: {
    // 오프라인 폴백 페이지
    runtimeCaching: [
      // 정적 자산 캐싱 (이미지, 폰트)
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|webp|svg|gif|ico|woff|woff2)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
          },
        },
      },
      // API 요청 캐싱 (네트워크 우선, 실패시 캐시)
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5분
          },
          networkTimeoutSeconds: 10,
        },
      },
      // 페이지 캐싱 (주요 페이지)
      {
        urlPattern: /^\/(home|beauty|style|record|search|profile|workout|nutrition)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24, // 24시간
          },
        },
      },
      // 분석 페이지 캐싱
      {
        urlPattern: /^\/analysis\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'analysis-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7일
          },
        },
      },
    ],
  },
});

/**
 * Next.js 설정
 * - 이미지 최적화 (Task 6.4)
 * - PWA (Phase A-1)
 * - React Compiler (2026-01-02 활성화)
 */
const nextConfig: NextConfig = {
  // React Compiler: 자동 메모이제이션 (Next.js 16에서 top-level로 이동)
  reactCompiler: true,
  // Turbopack 설정 (Next.js 16 필수 - PWA 플러그인 webpack 호환)
  turbopack: {},

  // 프로덕션 컴파일러 최적화
  compiler: {
    // 프로덕션에서 console.log 제거 (console.error, console.warn 유지)
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 실험적 기능: 패키지 최적화 (tree-shaking 개선)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'framer-motion',
      'zod',
    ],
  },

  // 보안 헤더 설정
  async headers() {
    return [
      {
        // 모든 라우트에 보안 헤더 적용
        source: '/:path*',
        headers: [
          // XSS 공격 방지
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // MIME 타입 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // HTTPS 강제 (1년)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Referrer 정책
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 권한 정책 (불필요한 API 차단)
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // CSP (Content Security Policy) - proxy.ts에서 통합 관리
          // proxy.ts의 generateCSP() 함수가 실제 CSP를 설정합니다.
          // 여기서는 proxy가 적용되지 않는 정적 파일용 기본 CSP만 설정합니다.
        ],
      },
    ];
  },

  // UX 리스트럭처링 리다이렉트 (기존 라우트 → 신규 라우트)
  async redirects() {
    return [
      // 대시보드 → 홈
      {
        source: '/dashboard',
        destination: '/home',
        permanent: true,
      },
      // 설정 → 프로필/설정
      {
        source: '/settings',
        destination: '/profile/settings',
        permanent: true,
      },
      // 루트 → 홈 리다이렉트 제거 (2026-01-31)
      // LCP 1.7s 지연 유발 - 랜딩 페이지가 이미 SignedIn/SignedOut 로직 포함
      // 로그인 사용자는 랜딩 페이지에서 "대시보드로 이동" 버튼으로 /home 접근
      // 제품 → 뷰티 (기본값)
      {
        source: '/products',
        destination: '/beauty',
        permanent: true,
      },
      // 제품 상세 → 뷰티 상세
      {
        source: '/products/:id',
        destination: '/beauty/:id',
        permanent: true,
      },
      // 리포트 → 기록/리포트
      {
        source: '/reports',
        destination: '/record/report',
        permanent: true,
      },
      // 친구 검색은 기존 경로 유지 (/friends/search, /friends/requests)
    ];
  },

  images: {
    remotePatterns: [
      // Clerk 프로필 이미지
      { hostname: 'img.clerk.com' },
      // YouTube 썸네일 (운동 비디오)
      { hostname: 'img.youtube.com' },
      { hostname: 'i.ytimg.com' },
      // Supabase Storage (향후 사용자 업로드 이미지)
      // ** 패턴: 0개 이상의 서브도메인 매칭 (예: xyz.supabase.co)
      { hostname: '**.supabase.co' },
      // Unsplash 이미지 (홈페이지)
      { hostname: 'images.unsplash.com' },
      // 플레이스홀더 이미지 (제품 이미지 없을 때)
      { hostname: 'placehold.co' },
    ],
    // 이미지 포맷 최적화 (WebP, AVIF)
    formats: ['image/avif', 'image/webp'],
    // 디바이스 크기별 이미지 생성
    deviceSizes: [640, 750, 828, 1080, 1200],
    // 이미지 사이즈 (컴포넌트에서 지정한 크기)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 이미지 캐시 TTL: 30일 (성능 최적화)
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

/**
 * 번들 분석기 설정
 * ANALYZE=true npm run build 로 실행
 */
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * Sentry 설정
 * - 프로덕션에서만 소스맵 업로드
 * - 에러 트래킹 및 성능 모니터링
 * - SENTRY_AUTH_TOKEN 없으면 소스맵 업로드 건너뜀
 */
const sentryConfig = {
  // Sentry 조직/프로젝트 설정 (환경변수로 관리)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 개발 환경 또는 AUTH_TOKEN 없으면 소스맵 업로드 비활성화
  silent: !process.env.CI,

  // 소스맵 설정
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // 자동 계측 (선택적)
  disableLogger: true,

  // Turbopack 호환 설정
  tunnelRoute: '/monitoring',

  // 빌드 옵션
  automaticVercelMonitors: true,

  // SENTRY_AUTH_TOKEN 없으면 소스맵 업로드 건너뜀 (빌드 실패 방지)
  skipEnvironmentCheck: !process.env.SENTRY_AUTH_TOKEN,
};

// Sentry 설정이 완전하면 withSentryConfig 사용, 아니면 기본 config 사용
const hasSentryConfig = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT;

// 플러그인 체인: i18n → PWA → Analyzer → (Sentry)
const baseConfig = withNextIntl(withAnalyzer(withPWA(nextConfig)));

export default hasSentryConfig ? withSentryConfig(baseConfig, sentryConfig) : baseConfig;
