-- 통합 분석 선택 원본용 비공개 Storage 버킷 정본화
-- Date: 2026-08-23
-- Issue: 배치 D — 통합 문진 이미지 저장 동의 경로 개설
-- 적용: prod는 Supabase Dashboard SQL Editor에서 gap-apply한다. `supabase db push` 금지.
-- Rollback: 객체 파기 확인 후 말미의 정책과 bucket 행을 수동 제거한다.

-- Storage/DB의 분산 정리 실패를 일일 cron이 즉시 재시도할 영속 소유권 표식.
ALTER TABLE public.integrated_analysis_sessions
  ADD COLUMN IF NOT EXISTS image_cleanup_pending BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_integrated_sessions_image_cleanup_pending
  ON public.integrated_analysis_sessions (created_at ASC, id ASC)
  WHERE image_cleanup_pending = true;

DROP INDEX IF EXISTS public.idx_integrated_sessions_abandoned_image_cleanup;
CREATE INDEX IF NOT EXISTS idx_integrated_sessions_consented_image_cleanup
  ON public.integrated_analysis_sessions (created_at ASC, id ASC)
  WHERE questionnaire->>'imageStorageConsent' = 'true'
    AND questionnaire->>'_imageStoragePurgedAt' IS NULL;

COMMENT ON COLUMN public.integrated_analysis_sessions.image_cleanup_pending IS
  'Storage/DB 분산 파기 실패 또는 전역 철회 후 원본 삭제를 재시도해야 하는 fail-closed 표식';

-- 결과 조회는 owner SELECT만 필요하다. 클라이언트 write가 열려 있으면 pending·questionnaire·
-- 이미지 포인터를 변조해 서버 서명 게이트를 우회할 수 있으므로 기존 broad 정책을 닫는다.
DROP POLICY IF EXISTS "integrated_sessions_insert_own" ON public.integrated_analysis_sessions;
DROP POLICY IF EXISTS "integrated_sessions_update_own" ON public.integrated_analysis_sessions;
DROP POLICY IF EXISTS "integrated_sessions_delete_own" ON public.integrated_analysis_sessions;
REVOKE INSERT, UPDATE, DELETE ON public.integrated_analysis_sessions FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'integrated-sessions',
  'integrated-sessions',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 서버 업로더/파기 작업은 service_role만 쓴다. 명시 정책은 운영 감사용이며 service_role bypass와 양립한다.
DROP POLICY IF EXISTS "Service role manages integrated session images" ON storage.objects;
CREATE POLICY "Service role manages integrated session images"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'integrated-sessions')
WITH CHECK (bucket_id = 'integrated-sessions');

-- 원본 조회도 결과 Server Component가 회차·글로벌 동의·파기 상태를 확인한 뒤 서명한다.
-- 과거 초안 정책이 이미 적용된 환경도 닫히도록 DROP만 두고 authenticated 정책은 만들지 않는다.
DROP POLICY IF EXISTS "Users can view own integrated session images" ON storage.objects;

-- 구형 Edge Function cron은 JWT 검증 없이 얕은 3축 파기만 수행해 새 재시도 큐를 우회한다.
-- pg_cron이 없거나 SQL Editor 역할에 권한이 없는 환경에서도 gap-apply 전체를 중단하지 않는다.
DO $$
DECLARE
  legacy_job RECORD;
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'pg_cron catalog not found; legacy cleanup job was not scheduled here';
    RETURN;
  END IF;

  FOR legacy_job IN EXECUTE
    'SELECT jobid FROM cron.job WHERE jobname = ''cleanup-expired-consents'''
  LOOP
    BEGIN
      EXECUTE format('SELECT cron.unschedule(%s)', legacy_job.jobid);
    EXCEPTION
      WHEN insufficient_privilege OR undefined_function THEN
        RAISE WARNING 'Could not unschedule legacy cleanup-expired-consents job %', legacy_job.jobid;
    END;
  END LOOP;
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE WARNING 'Could not inspect pg_cron jobs; verify cleanup-expired-consents manually';
END
$$;

DROP FUNCTION IF EXISTS public.trigger_cleanup_expired_consents();

-- Rollback (prod SQL Editor 수동 실행):
-- 1) integrated-sessions 객체와 integrated_analysis_sessions의 두 이미지 포인터를 먼저 파기/NULL 처리한다.
-- 2) DROP POLICY IF EXISTS "Service role manages integrated session images" ON storage.objects;
-- 3) DELETE FROM storage.buckets WHERE id = 'integrated-sessions';
-- 4) DROP INDEX IF EXISTS public.idx_integrated_sessions_image_cleanup_pending;
-- 5) DROP INDEX IF EXISTS public.idx_integrated_sessions_consented_image_cleanup;
-- 6) ALTER TABLE public.integrated_analysis_sessions DROP COLUMN IF EXISTS image_cleanup_pending;
-- 7) 필요 시 20260423 정책·GRANT로 client INSERT/UPDATE/DELETE를 수동 복원한다(권장하지 않음).
