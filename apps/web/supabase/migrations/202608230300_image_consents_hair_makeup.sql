-- 헤어·메이크업 분석 이미지 저장 선택 동의 타입·비공개 버킷 확장
-- Date: 2026-08-23
-- Issue: 배치 D — hair/makeup 이미지 저장 선택 동의 경로 개설
-- Rollback: 파일 말미의 수동 롤백 절차를 따르되, 저장 객체를 먼저 파기한 뒤 버킷을 제거한다.
-- 기존 image_consents 행·UNIQUE는 유지하고, write RLS는 동의 API 전용으로 강화한다.

ALTER TABLE public.image_consents
  DROP CONSTRAINT IF EXISTS image_consents_analysis_type_check;

ALTER TABLE public.image_consents
  ADD CONSTRAINT image_consents_analysis_type_check
  CHECK (analysis_type IN ('skin', 'body', 'personal-color', 'hair', 'makeup'));

-- 철회 완료 뒤 늦게 커밋된 객체를 24시간 유예 후 한 번 더 prefix purge한 시각이다.
-- NULL은 아직 최종 재조정하지 않았다는 뜻이며 POST 재동의 때도 NULL로 되돌린다.
ALTER TABLE public.image_consents
  ADD COLUMN IF NOT EXISTS cleanup_reconciled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.image_consents.analysis_type IS
  '이미지 저장 동의 분석 축: skin, body, personal-color, hair, makeup';

-- 파기 대기 큐의 안정 keyset(retention_until, id) 순회를 지원한다.
CREATE INDEX IF NOT EXISTS idx_image_consents_cleanup_pending
  ON public.image_consents(retention_until, id)
  WHERE consent_given = false
    AND withdrawal_at IS NOT NULL
    AND retention_until IS NOT NULL;

-- retention_until=NULL 완료 행은 기존 pending keyset에 섞지 않고 withdrawal_at으로 별도 순회한다.
CREATE INDEX IF NOT EXISTS idx_image_consents_cleanup_reconciliation
  ON public.image_consents(withdrawal_at, id)
  WHERE consent_given = false
    AND withdrawal_at IS NOT NULL
    AND retention_until IS NULL
    AND cleanup_reconciled_at IS NULL;

-- 업로드 API의 10MB 제한 및 모바일 촬영 포맷을 버킷에서도 동일하게 강제한다.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'hair-images',
    'hair-images',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'makeup-images',
    'makeup-images',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 저장·서명·파기는 동의 게이트가 있는 service-role API만 수행한다.
-- 과거 authenticated 정책이 남아 있으면 클라이언트가 API의 활성 동의/PURGE_PENDING/CAS를
-- 우회할 수 있으므로 이름을 명시해 제거하고 새 정책은 만들지 않는다.
DROP POLICY IF EXISTS "Users can upload hair images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own hair images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own hair images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload makeup images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own makeup images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own makeup images" ON storage.objects;

-- 구 3축 버킷에도 같은 authenticated 우회 정책이 있으므로 5축을 한 경계로 닫는다.
DROP POLICY IF EXISTS "Users can upload skin images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own skin images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own skin images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload body images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own body images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own body images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload pc images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own pc images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own pc images" ON storage.objects;

-- image_consents 읽기는 모달 상태 조회를 위해 own SELECT만 유지한다.
-- 쓰기는 POST/DELETE API만 허용해 파기 대기·CAS 계약을 우회하지 못하게 한다.
DROP POLICY IF EXISTS "image_consents_insert_own" ON public.image_consents;
DROP POLICY IF EXISTS "image_consents_update_own" ON public.image_consents;
DROP POLICY IF EXISTS "image_consents_delete_own" ON public.image_consents;
REVOKE INSERT, UPDATE, DELETE ON public.image_consents FROM anon, authenticated;

-- Rollback (prod에서는 SQL Editor로 상태 확인 후 수동 실행):
-- 1) hair/makeup 동의 행과 Storage 객체를 먼저 내보내거나 파기한다.
-- 2) storage.buckets에서 hair-images, makeup-images 행을 제거한다.
-- 3) image_consents_analysis_type_check를 기존 3축 CHECK로 되돌린다.
-- 4) 클라이언트 직접 쓰기를 복원해야 한다면 위험 검토 후 구 write 정책을 수동 복원한다.
