-- Migration: 생체정보(얼굴·체형 이미지) 수집·이용 별도 동의 (BIPA / PIPA 제23조 / GDPR Art.9)
-- Date: 2026-07-12
-- Author: Claude Code
-- Purpose:
--   기존 image_consents(저장 동의, 분석 유형별)와는 별개로, 얼굴/체형 이미지의 "수집·처리" 동의를
--   가입 약관(user_agreements) 단계에서 별도·필수로 받는다. 모든 분석 흐름(skin/body/personal-color/
--   hair/makeup/posture/integrated)이 /agreement 게이트를 거치므로, 이 한 곳에서 생체 수집 동의를
--   확인하면 캡처 전 사전 동의를 보장한다. 서버 라우트는 이 플래그로 방어선 게이트를 건다.

-- 1. 컬럼 추가 (기존 RLS 정책이 행 단위로 그대로 적용됨 — 별도 정책 불필요)
ALTER TABLE user_agreements
  ADD COLUMN IF NOT EXISTS biometric_agreed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS biometric_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS biometric_version TEXT;

COMMENT ON COLUMN user_agreements.biometric_agreed IS '(필수) 생체정보(얼굴·체형 이미지) 수집·이용 동의 — BIPA/PIPA 제23조';
COMMENT ON COLUMN user_agreements.biometric_agreed_at IS '생체정보 수집·이용 동의 시각';
COMMENT ON COLUMN user_agreements.biometric_version IS '생체 동의 문구 버전 (변경 시 재동의 필요)';

-- Rollback:
-- ALTER TABLE user_agreements
--   DROP COLUMN IF EXISTS biometric_agreed,
--   DROP COLUMN IF EXISTS biometric_agreed_at,
--   DROP COLUMN IF EXISTS biometric_version;
