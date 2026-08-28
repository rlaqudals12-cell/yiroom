-- AI 아바타 생성 결과 저장 동의 타입 확장
-- Date: 2026-08-27
-- Issue: 배치 G — AI 트윈 생체·이미지 저장 동의 fail-closed 게이트
-- Rollback: twin 동의 행·twins Storage 객체·user_twins 행을 먼저 파기한 뒤 CHECK를 5축으로 복원한다.

ALTER TABLE public.image_consents
  DROP CONSTRAINT IF EXISTS image_consents_analysis_type_check;

ALTER TABLE public.image_consents
  ADD CONSTRAINT image_consents_analysis_type_check
  CHECK (analysis_type IN ('skin', 'body', 'personal-color', 'hair', 'makeup', 'twin'));

COMMENT ON COLUMN public.image_consents.analysis_type IS
  '이미지 저장 동의 목적: skin, body, personal-color, hair, makeup, twin(AI 아바타 생성 결과)';

-- 이전 버전은 twin 저장 동의를 받지 않았으므로 기존 생성물은 동의로 추정하지 않는다.
-- users FK가 유효한 소유자만 파기 대기 행으로 넣고, 배포 중 사용자가 새 동의를 마친 경우
-- UNIQUE 충돌을 덮지 않는다. cleanup-consents가 Storage API로 객체와 user_twins 행을 함께 지운다.
INSERT INTO public.image_consents (
  clerk_user_id,
  analysis_type,
  consent_given,
  consent_version,
  consent_at,
  withdrawal_at,
  retention_until,
  cleanup_reconciled_at
)
SELECT DISTINCT
  twins.clerk_user_id,
  'twin',
  false,
  'v1.0',
  NULL,
  now(),
  now(),
  NULL
FROM public.user_twins AS twins
INNER JOIN public.users AS users
  ON users.clerk_user_id = twins.clerk_user_id
ON CONFLICT (clerk_user_id, analysis_type) DO NOTHING;

-- twins 버킷은 ADR-115에서 이미 생성됐다. API가 동의·생체 게이트를 수행하므로
-- authenticated 클라이언트가 Storage를 직접 우회할 수 있는 정책은 두지 않는다.
