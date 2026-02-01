/**
 * Next.js 16 Proxy (Middleware 대체)
 *
 * @description Clerk 인증 + Rate Limiting + 보안 헤더 미들웨어
 * @see SDD-RATE-LIMITING.md
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { applyRateLimitMiddleware, addRateLimitHeaders, isRateLimitedPath } from '@/lib/rate-limit';

/**
 * 보안 헤더 설정
 *
 * @description OWASP 권장 보안 헤더
 * @see https://owasp.org/www-project-secure-headers/
 */
const SECURITY_HEADERS = {
  // XSS 방지
  'X-XSS-Protection': '1; mode=block',
  // 클릭재킹 방지
  'X-Frame-Options': 'DENY',
  // MIME 스니핑 방지
  'X-Content-Type-Options': 'nosniff',
  // Referrer 정보 제한
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // 권한 정책 (카메라, 마이크 등 제한)
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',
};

/**
 * CSP(Content Security Policy) 생성
 *
 * @description 환경별 CSP 설정
 */
function generateCSP(isDev: boolean): string {
  const directives = [
    // 기본 소스
    "default-src 'self'",
    // 스크립트 소스 (Clerk, Kakao SDK, Vercel Analytics 포함)
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.yiroom.app https://*.kakaocdn.net https://va.vercel-scripts.com"
      : "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.yiroom.app https://*.kakaocdn.net https://va.vercel-scripts.com",
    // 스타일 소스 (inline style 허용 - Tailwind)
    "style-src 'self' 'unsafe-inline'",
    // 이미지 소스
    "img-src 'self' data: blob: https://*.supabase.co https://*.clerk.accounts.dev https://img.clerk.com https:",
    // 폰트 소스
    "font-src 'self'",
    // 연결 소스 (API, Supabase, Clerk, Gemini, Sentry)
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.dev https://clerk-telemetry.com https://*.google.com https://*.googleapis.com https://generativelanguage.googleapis.com https://va.vercel-scripts.com https://*.sentry.io",
    // Worker 소스 (Clerk에서 blob workers 사용)
    "worker-src 'self' blob:",
    // 프레임 소스 (Clerk, Cloudflare Turnstile)
    "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
    // 프레임 조상 (클릭재킹 방지)
    "frame-ancestors 'none'",
    // 폼 액션
    "form-action 'self'",
    // base-uri 제한
    "base-uri 'self'",
    // 객체 소스 금지
    "object-src 'none'",
    // 매니페스트 소스 (PWA)
    "manifest-src 'self'",
    // 업그레이드 요청
    !isDev ? 'upgrade-insecure-requests' : null,
  ];

  return directives.filter(Boolean).join('; ');
}

/**
 * 응답에 보안 헤더 추가
 */
function addSecurityHeaders(response: NextResponse): void {
  const isDev = process.env.NODE_ENV === 'development';

  // 정적 보안 헤더
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CSP 헤더 (개발/프로덕션 분리)
  response.headers.set('Content-Security-Policy', generateCSP(isDev));

  // HSTS (프로덕션만)
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
}

// 인증 없이 접근 가능한 공개 라우트
const isPublicRoute = createRouteMatcher([
  '/',
  '/home',
  '/manifest.json',
  '/manifest.webmanifest',
  '/privacy',
  '/privacy-policy',
  '/terms(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/announcements',
  '/help(.*)',
  '/offline',
  '/licenses(.*)',
  // 연령 검증 관련 페이지 (로그인 후 접근 가능하지만 인증 보호 제외)
  '/age-restricted',
  '/complete-profile',
  // API 웹훅 (외부 서비스 콜백)
  '/api/webhooks(.*)',
  '/api/affiliate/(.*)',
  // Health check
  '/api/health',
]);

// Next.js 16: middleware → proxy 마이그레이션
// 디버그 모드: 개발 환경에서 인증 문제 추적
const clerkDebug = process.env.NODE_ENV === 'development' && process.env.CLERK_DEBUG === 'true';

export const proxy = clerkMiddleware(
  async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    // Rate Limiting 적용 (API 경로만)
    if (isRateLimitedPath(pathname)) {
      // 사용자 ID 가져오기 (로그인 시)
      let userId: string | null = null;
      try {
        const session = await auth();
        userId = session?.userId ?? null;
      } catch {
        // 인증되지 않은 요청 - IP 기반 Rate Limiting
      }

      // Rate Limit 검사
      const rateLimitResult = await applyRateLimitMiddleware(req, userId);

      // Rate Limit 초과 시 429 응답 (보안 헤더 추가)
      if (!rateLimitResult.allowed && rateLimitResult.response) {
        addSecurityHeaders(rateLimitResult.response);
        return rateLimitResult.response;
      }

      // Rate Limit 통과 시 헤더 추가
      const response = NextResponse.next();
      addRateLimitHeaders(response, rateLimitResult.headers);
      addSecurityHeaders(response);

      // 공개 라우트가 아닌 경우 인증 보호
      if (!isPublicRoute(req)) {
        await auth.protect();
      }

      return response;
    }

    // Rate Limiting 대상이 아닌 경우
    // 공개 라우트가 아닌 경우에만 인증 보호
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    // 모든 응답에 보안 헤더 추가
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  },
  { debug: clerkDebug }
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|manifest\\.json|manifest\\.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
