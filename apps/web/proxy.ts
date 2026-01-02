import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitHeaders, rateLimitConfigs } from '@/lib/security/rate-limit';

// 인증 없이 접근 가능한 공개 라우트
const isPublicRoute = createRouteMatcher([
  '/',
  '/manifest.json',
  '/manifest.webmanifest',
  '/privacy',
  '/terms',
  '/robots.txt',
  '/sitemap.xml',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// API 라우트 매처
const isApiRoute = createRouteMatcher(['/api(.*)']);

// Rate Limiting이 적용되는 API 라우트
const isRateLimitedRoute = createRouteMatcher([
  '/api/analysis(.*)',
  '/api/gemini(.*)',
  '/api/feedback(.*)',
  '/api/nutrition(.*)',
  '/api/workout(.*)',
]);

// Next.js 16: middleware → proxy 마이그레이션
export const proxy = clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // API 라우트에 Rate Limiting 적용
  if (isApiRoute(req) && isRateLimitedRoute(req)) {
    // IP 주소 가져오기 (Vercel/Cloudflare 헤더 우선)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    const { success, remaining, resetTime } = checkRateLimit(ip, pathname);

    // Rate Limit 초과 시 429 응답
    if (!success) {
      const config = rateLimitConfigs[pathname] || rateLimitConfigs.default;
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(remaining, resetTime, config.maxRequests),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Rate Limit 헤더 추가 (성공 시에도)
    const response = NextResponse.next();
    const config = rateLimitConfigs[pathname] || rateLimitConfigs.default;
    const headers = getRateLimitHeaders(remaining, resetTime, config.maxRequests);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // 공개 라우트가 아닌 경우에만 인증 보호
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|manifest\\.json|manifest\\.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
