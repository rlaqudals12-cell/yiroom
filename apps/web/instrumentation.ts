/**
 * Sentry 서버 사이드 계측 (Next.js 13+ 권장)
 *
 * Next.js는 이 파일을 서버 시작 시 자동으로 로드하여
 * Sentry 초기화가 서버 컴포넌트 및 API 라우트에서 올바르게 작동하도록 합니다.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js 런타임 (Server Components, API Routes)
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge 런타임 (Edge Functions, Middleware)
    await import('./sentry.edge.config');
  }
}
