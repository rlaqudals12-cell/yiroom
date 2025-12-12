// Sentry Server Configuration
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === 'production',

  // 서버 트레이싱 샘플링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // 디버그 모드
  debug: false,

  // 앱 식별자
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
});
