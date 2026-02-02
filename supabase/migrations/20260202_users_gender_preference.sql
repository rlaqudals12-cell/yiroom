-- Migration: users_gender_preference
-- Purpose: K-1 성별 중립화를 위한 gender_preference 필드 추가
-- Date: 2026-02-02
-- Author: Claude Code
-- Issue: Phase K - K-1 Gender Neutralization
-- Rollback: ALTER TABLE users DROP COLUMN IF EXISTS gender_preference;

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. gender_preference 컬럼 추가
-- 값: 'male', 'female', 'neutral' (기본값: neutral)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'neutral'
  CHECK (gender_preference IN ('male', 'female', 'neutral'));

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN users.gender_preference IS '사용자 성별 선호도 (K-1): male, female, neutral. 콘텐츠 개인화에 사용됨';

-- 3. 인덱스 추가 (성별 기반 필터링용)
CREATE INDEX IF NOT EXISTS idx_users_gender_preference
  ON users(gender_preference);

-- ============================================
-- 롤백 스크립트 (필요 시 수동 실행)
-- ============================================
-- DROP INDEX IF EXISTS idx_users_gender_preference;
-- ALTER TABLE users DROP COLUMN IF EXISTS gender_preference;
