// Sentry Client Configuration
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === 'production',

  // 프로덕션에서 10% 샘플링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Replay 세션 샘플링 (에러 발생 시 100%, 일반 세션 0.1%)
  replaysSessionSampleRate: 0.001,
  replaysOnErrorSampleRate: 1.0,

  // 디버그 모드 (개발 환경에서만)
  debug: false,

  // 앱 식별자
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // 민감 정보 필터링
  beforeSend(event) {
    // 이메일, 전화번호 등 민감 정보 제거
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
