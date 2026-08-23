# Legacy 이미지 동의 정리 함수 폐기 Runbook

> 대상: `cleanup-expired-consents` Supabase Edge Function  
> 현행 정본: `apps/web/app/api/cron/cleanup-consents/route.ts`

과거 Edge Function은 더 이상 이미지 보유기간 정리를 실행하지 않는다. 저장소의 함수 코드는
환경변수와 서비스 역할 클라이언트에 접근하지 않고 항상 `410 Gone`만 반환한다. 운영에서
함수를 단순 재배포하는 것으로 끝내지 말고 아래 순서로 잔존 호출 경로까지 제거한다.

## 운영 적용 순서

1. 현재 저장소의 410 버전을 먼저 배포한다. 삭제와 pg_cron 해제 사이의 짧은 경합에서도
   개인정보 저장소에 접근하지 않게 만드는 안전 장치다.
2. Supabase Dashboard SQL Editor에서 배치 D의 decommission migration을 gap-apply한다.
   `supabase db push`는 사용하지 않는다.
3. `cron.job`에서 이름이 `cleanup-expired-consents`인 작업이 0건인지 확인한다.
4. `public.trigger_cleanup_expired_consents()`가 제거됐는지 확인한다.
5. Supabase Dashboard 또는 승인된 CLI 절차로 `cleanup-expired-consents` 함수를 삭제한다.
6. 함수 URL이 404 또는 410이고, Vercel의 `hard-delete-users` 일일 작업이 현행
   `/api/cron/cleanup-consents` 결과를 포함하는지 확인한다.

## 주의

- `verify_jwt = true`만으로 폐기가 완료되지는 않는다. 공개 anon key도 JWT이므로, 함수
  본문이 410 이외의 정리 로직을 다시 갖지 않도록 정적 테스트가 보호한다.
- 운영 SQL은 반드시 Dashboard SQL Editor에서 수동 적용한다.
- 함수 삭제 전에는 안전한 410 버전을 먼저 배포한다. 순서를 뒤집으면 배포 캐시나 남은
  pg_cron 호출이 구형 service-role 구현에 닿을 수 있다.
