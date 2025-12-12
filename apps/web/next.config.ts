import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * PWA 설정 (Lite PWA - 홈 화면 추가만 지원)
 * Phase A-1: 2025-12-04
 */
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Lite PWA: 오프라인 캐싱 비활성화
  cacheOnFrontEndNav: false,
});

/**
 * Next.js 설정
 * - 이미지 최적화 (Task 6.4)
 * - PWA (Phase A-1)
 */
const nextConfig: NextConfig = {
  // Turbopack 설정 (Next.js 16 필수 - PWA 플러그인 webpack 호환)
  turbopack: {},
  images: {
    remotePatterns: [
      // Clerk 프로필 이미지
      { hostname: "img.clerk.com" },
      // YouTube 썸네일 (운동 비디오)
      { hostname: "img.youtube.com" },
      { hostname: "i.ytimg.com" },
      // Supabase Storage (향후 사용자 업로드 이미지)
      // ** 패턴: 0개 이상의 서브도메인 매칭 (예: xyz.supabase.co)
      { hostname: "**.supabase.co" },
      // Unsplash 이미지 (홈페이지)
      { hostname: "images.unsplash.com" },
    ],
    // 이미지 포맷 최적화 (WebP, AVIF)
    formats: ["image/avif", "image/webp"],
    // 디바이스 크기별 이미지 생성
    deviceSizes: [640, 750, 828, 1080, 1200],
    // 이미지 사이즈 (컴포넌트에서 지정한 크기)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

/**
 * 번들 분석기 설정
 * ANALYZE=true npm run build 로 실행
 */
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Sentry 설정
 * - 프로덕션에서만 소스맵 업로드
 * - 에러 트래킹 및 성능 모니터링
 */
const sentryConfig = {
  // Sentry 조직/프로젝트 설정 (환경변수로 관리)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 개발 환경에서는 소스맵 업로드 비활성화
  silent: !process.env.CI,

  // 소스맵 설정
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // 자동 계측 (선택적)
  disableLogger: true,

  // Turbopack 호환 설정
  tunnelRoute: "/monitoring",

  // 빌드 옵션
  automaticVercelMonitors: true,
};

export default withSentryConfig(
  withAnalyzer(withPWA(nextConfig)),
  sentryConfig
);
