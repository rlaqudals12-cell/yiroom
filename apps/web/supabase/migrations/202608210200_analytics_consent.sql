-- Migration: 이용기록 분석 동의 저장
-- Purpose: 모바일 계측을 사용자의 선택적 분석 동의와 서버에서 일치시킨다.
-- Date: 2026-08-21
-- Rollback:
--   ALTER TABLE user_agreements
--     DROP COLUMN IF EXISTS analytics_withdrawn_at,
--     DROP COLUMN IF EXISTS analytics_agreed_at,
--     DROP COLUMN IF EXISTS analytics_agreed;

-- 기존 이용자는 별도 분석 동의를 한 사실이 없으므로 false로 시작한다.
ALTER TABLE user_agreements
  ADD COLUMN IF NOT EXISTS analytics_agreed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analytics_withdrawn_at TIMESTAMPTZ;

COMMENT ON COLUMN user_agreements.analytics_agreed IS
  '(선택) 서비스 개선을 위한 이용기록 분석 동의';
COMMENT ON COLUMN user_agreements.analytics_agreed_at IS
  '이용기록 분석 동의 시각';
COMMENT ON COLUMN user_agreements.analytics_withdrawn_at IS
  '이용기록 분석 동의 철회 시각';
