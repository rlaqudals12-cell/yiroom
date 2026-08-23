/**
 * @deprecated 2026-08-23
 *
 * 이미지 보유기간 정리는 Next.js의 `/api/cron/cleanup-consents`가 단독으로 소유한다.
 * 이 함수는 과거 pg_cron 호출이나 배포 캐시가 남아 있어도 개인정보 저장소에 접근하지
 * 않도록 의도적으로 410만 반환한다. 환경변수·서비스 역할 키·외부 클라이언트를 추가하지 말 것.
 */

Deno.serve(
  () =>
    new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'LEGACY_FUNCTION_GONE',
          message: 'This legacy cleanup function has been decommissioned.',
          userMessage: '폐기된 정리 경로입니다.',
        },
      }),
      {
        status: 410,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    )
);
