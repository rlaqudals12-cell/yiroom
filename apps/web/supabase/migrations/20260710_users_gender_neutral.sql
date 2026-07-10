-- Migration: users.gender CHECK 제약에 'neutral' 허용
-- Purpose: 앱(GenderType = 'male' | 'female' | 'neutral')이 'neutral'을 저장하는데,
--          기존 CHECK가 ('male','female','other')만 허용해 'neutral' 저장이 조용히 실패하던 버그 수리.
--          (K-1 성별 중립화 정합 — users.gender_preference는 이미 'neutral'을 쓴다)
-- Date: 2026-07-10
-- Author: Claude Code
-- 제약명 근거: 20251128_add_user_profile_fields.sql의 인라인 CHECK는
--            Postgres가 자동으로 'users_gender_check'로 명명한다.
-- Rollback: 아래 롤백 섹션 참조

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1) 기존 인라인 CHECK 제약 제거 (자동 명명된 users_gender_check)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;

-- 2) 'neutral'을 포함한 새 CHECK 제약 재생성 (NULL은 기존과 동일하게 허용)
ALTER TABLE users
  ADD CONSTRAINT users_gender_check
  CHECK (gender IN ('male', 'female', 'other', 'neutral'));

COMMENT ON COLUMN users.gender IS '성별 (male/female/other/neutral) - BMR 계산 + 콘텐츠 개인화용';

-- ============================================
-- 롤백 스크립트
-- ============================================
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;
-- ALTER TABLE users
--   ADD CONSTRAINT users_gender_check
--   CHECK (gender IN ('male', 'female', 'other'));
