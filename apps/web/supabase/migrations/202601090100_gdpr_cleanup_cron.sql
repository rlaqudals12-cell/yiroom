-- GDPR 자동 삭제 배치 작업 (Supabase Cron)
-- Created: 2026-01-09
-- Purpose: retention_until 만료된 이미지 동의 및 연관 데이터 자동 삭제

-- ================================================
-- 1. pg_cron extension 활성화
-- ================================================
-- pg_cron은 Supabase 프로젝트 대시보드에서 활성화해야 합니다.
-- 이 SQL은 마이그레이션 파일로만 존재하며, 실제 실행은 Supabase UI에서 합니다.

-- 참고: pg_cron extension은 기본적으로 비활성화되어 있습니다.
-- Supabase 대시보드 > SQL Editor에서 다음 명령어를 관리자 권한으로 실행하세요:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ================================================
-- 2. Edge Function 호출 헬퍼 함수 생성
-- ================================================
-- cleanup-expired-consents Edge Function을 호출하는 SQL 함수

CREATE OR REPLACE FUNCTION trigger_cleanup_expired_consents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  anon_key TEXT;
  response jsonb;
BEGIN
  -- Supabase 프로젝트 URL 및 ANON 키는 환경변수에서 가져옵니다.
  -- 실제 값은 Supabase Dashboard > Settings > API에서 확인 가능합니다.
  
  -- Edge Function URL 구성
  -- 예시: https://[project-ref].supabase.co/functions/v1/cleanup-expired-consents
  function_url := current_setting('app.supabase_url', true) || '/functions/v1/cleanup-expired-consents';
  anon_key := current_setting('app.supabase_anon_key', true);

  -- HTTP POST 요청 (Supabase net extension 사용)
  -- 주의: net extension은 Supabase에서 기본 제공됩니다.
  SELECT content::jsonb INTO response
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000  -- 1분 타임아웃
  );

  -- 로그 기록
  INSERT INTO cleanup_logs (
    job_type,
    processed_count,
    failed_count,
    error_details,
    started_at,
    completed_at,
    status
  ) VALUES (
    'consent_expiry',
    COALESCE((response ->> 'processed')::int, 0),
    COALESCE((response ->> 'failed')::int, 0),
    CASE
      WHEN response ->> 'success' = 'true' THEN NULL
      ELSE response
    END,
    now(),
    now(),
    CASE
      WHEN response ->> 'success' = 'true' THEN 'completed'
      ELSE 'failed'
    END
  );

EXCEPTION WHEN OTHERS THEN
  -- 에러 발생 시 로그 기록
  INSERT INTO cleanup_logs (
    job_type,
    processed_count,
    failed_count,
    error_details,
    started_at,
    completed_at,
    status
  ) VALUES (
    'consent_expiry',
    0,
    1,
    jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE),
    now(),
    now(),
    'failed'
  );
  
  -- 에러 재발생 (모니터링용)
  RAISE;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION trigger_cleanup_expired_consents() TO service_role;
COMMENT ON FUNCTION trigger_cleanup_expired_consents() IS 'Calls cleanup-expired-consents Edge Function via HTTP POST';


-- ================================================
-- 3. Cron Job 스케줄 설정
-- ================================================
-- 아래 SQL은 Supabase 대시보드에서 수동으로 실행해야 합니다.
-- (마이그레이션 파일로는 pg_cron 스케줄 등록이 안 됨)

/*
-- Supabase Dashboard > SQL Editor에서 실행:

SELECT cron.schedule(
  'cleanup-expired-consents',
  '0 2 * * *',  -- 매일 02:00 UTC (한국 시간 11:00)
  $$
  SELECT trigger_cleanup_expired_consents();
  $$
);
*/


-- ================================================
-- 4. Cron Job 관리 쿼리 (참고용)
-- ================================================

-- 등록된 Cron Job 목록 조회
-- SELECT * FROM cron.job ORDER BY jobid DESC;

-- Cron Job 실행 이력 조회
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-consents')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Cron Job 삭제 (필요 시)
-- SELECT cron.unschedule('cleanup-expired-consents');


-- ================================================
-- 5. 모니터링 뷰 생성
-- ================================================

-- 최근 7일간 cleanup 통계
CREATE OR REPLACE VIEW cleanup_stats_weekly AS
SELECT
  job_type,
  COUNT(*) AS total_runs,
  SUM(processed_count) AS total_processed,
  SUM(failed_count) AS total_failed,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_duration_seconds,
  MAX(completed_at) AS last_run_at
FROM cleanup_logs
WHERE started_at >= now() - INTERVAL '7 days'
GROUP BY job_type;

COMMENT ON VIEW cleanup_stats_weekly IS '최근 7일간 자동 삭제 배치 작업 통계';


-- 실패한 cleanup 작업 목록
CREATE OR REPLACE VIEW cleanup_failures AS
SELECT
  id,
  job_type,
  processed_count,
  failed_count,
  error_details,
  started_at,
  completed_at
FROM cleanup_logs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 20;

COMMENT ON VIEW cleanup_failures IS '실패한 cleanup 작업 목록 (최근 20개)';


-- ================================================
-- 6. 알림 트리거 설정 (선택사항)
-- ================================================
-- 실패한 cleanup 작업 발생 시 알림을 보내는 트리거
-- (Supabase Webhooks 또는 Edge Function 연동 필요)

/*
CREATE OR REPLACE FUNCTION notify_cleanup_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Webhook 또는 Edge Function 호출 (예시)
  -- PERFORM net.http_post(
  --   url := 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
  --   body := jsonb_build_object(
  --     'text', format('🚨 Cleanup Failed: %s - %s', NEW.job_type, NEW.error_details::text)
  --   )
  -- );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_cleanup_failure
AFTER INSERT ON cleanup_logs
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION notify_cleanup_failure();
*/


-- ================================================
-- 7. 테스트 쿼리 (개발 환경에서만 실행)
-- ================================================

-- 만료 예정 동의 조회 (테스트용)
-- SELECT
--   id,
--   clerk_user_id,
--   analysis_type,
--   consent_given,
--   retention_until,
--   (retention_until - now()) AS time_until_expiry
-- FROM image_consents
-- WHERE consent_given = true
--   AND retention_until < now() + INTERVAL '7 days'
-- ORDER BY retention_until;


-- ================================================
-- 8. 실행 가이드
-- ================================================

/*
[Supabase 대시보드 실행 순서]

1. SQL Editor에서 pg_cron extension 활성화:
   CREATE EXTENSION IF NOT EXISTS pg_cron;

2. 환경 변수 설정 (Settings > App Settings):
   app.supabase_url = 'https://[project-ref].supabase.co'
   app.supabase_anon_key = '[YOUR_ANON_KEY]'

3. Edge Function 배포:
   cd supabase/functions
   supabase functions deploy cleanup-expired-consents

4. Cron Job 등록 (SQL Editor):
   SELECT cron.schedule(
     'cleanup-expired-consents',
     '0 2 * * *',
     $$SELECT trigger_cleanup_expired_consents();$$
   );

5. 모니터링 (SQL Editor):
   SELECT * FROM cleanup_stats_weekly;
   SELECT * FROM cleanup_failures;

6. 수동 실행 (테스트용):
   SELECT trigger_cleanup_expired_consents();
*/


-- ================================================
-- 9. 권한 설정 (RLS 확인)
-- ================================================

-- cleanup_logs 테이블은 이미 RLS가 활성화되어 있으며,
-- service_role만 접근 가능 (일반 사용자는 조회 불가)

-- 추가 확인:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'cleanup_logs';
-- SELECT * FROM pg_policies WHERE tablename = 'cleanup_logs';


-- ================================================
-- 10. 변경 이력
-- ================================================

/*
Version: 1.0
Created: 2026-01-09
Author: Claude Opus 4.5 + 이룸팀

Changes:
- 초기 버전: pg_cron 기반 자동 삭제 배치 작업
- Edge Function 호출 헬퍼 함수
- 모니터링 뷰 (cleanup_stats_weekly, cleanup_failures)
- 테스트 쿼리 및 실행 가이드 포함
*/
