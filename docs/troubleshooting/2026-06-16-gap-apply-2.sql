-- ============================================================
-- 갭 적용 스크립트 2차 (컬럼) — 복원 prod DB ihlrjhqyopjmhqvjnnnu 전용
-- 생성: 2026-06-16 by Claude Code
-- 목적: db-schema 헬스가 'warning'으로 보고한 누락 컬럼 6개 보강(3 마이그)
--   users: latest_pc_assessment_id, personal_color_season, personal_color_undertone,
--          face_image_url (20260109), gender_preference (20260202)
--   personal_color_assessments: wrist_image_url (20260115)
-- 적용: SQL Editor 전체 붙여넣기 1회 Run. 전부 IF NOT EXISTS → 트랜잭션·재실행 안전.
-- 출처: supabase/migrations/ (root, PC 컬럼 마이그)
-- ============================================================

BEGIN;

-- [1/3] users PC 컬럼 4개 + 인덱스 + 백필 — 20260109_users_pc_columns.sql
-- Migration: users 테이블에 PC-1 결과 컬럼 추가
-- Purpose: 퍼스널 컬러 결과를 users 테이블에서 빠르게 조회
-- Date: 2026-01-08

-- ============================================================
-- users 테이블에 PC-1 관련 컬럼 추가
-- ============================================================

-- FK: 최신 PC-1 분석 결과 참조
ALTER TABLE users ADD COLUMN IF NOT EXISTS latest_pc_assessment_id UUID
  REFERENCES personal_color_assessments(id) ON DELETE SET NULL;

-- 비정규화 컬럼 (빠른 조회용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_color_season TEXT
  CHECK (personal_color_season IN ('Spring', 'Summer', 'Autumn', 'Winter'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_color_undertone TEXT
  CHECK (personal_color_undertone IN ('Warm', 'Cool', 'Neutral'));

-- 얼굴 이미지 URL (PC-1/S-1 공유용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_image_url TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_pc_season ON users(personal_color_season);

-- 코멘트
COMMENT ON COLUMN users.latest_pc_assessment_id IS '최신 퍼스널 컬러 분석 ID (FK)';
COMMENT ON COLUMN users.personal_color_season IS '퍼스널 컬러 시즌 (Spring/Summer/Autumn/Winter)';
COMMENT ON COLUMN users.personal_color_undertone IS '언더톤 (Warm/Cool/Neutral)';
COMMENT ON COLUMN users.face_image_url IS '얼굴 이미지 URL (PC-1/S-1 공유)';

-- ============================================================
-- 기존 데이터 마이그레이션: 최신 PC-1 결과를 users로 복사
-- ============================================================
UPDATE users u
SET
  latest_pc_assessment_id = pc.id,
  personal_color_season = pc.season,
  personal_color_undertone = pc.undertone,
  face_image_url = pc.face_image_url
FROM (
  SELECT DISTINCT ON (clerk_user_id)
    id, clerk_user_id, season, undertone, face_image_url
  FROM personal_color_assessments
  ORDER BY clerk_user_id, created_at DESC
) pc
WHERE u.clerk_user_id = pc.clerk_user_id;

-- [2/3] personal_color_assessments.wrist_image_url — 20260115_wrist_image_column.sql
-- Migration: PC-1 손목 이미지 URL 추가
-- Purpose: API에서 손목 이미지 분석하지만 저장하지 않는 문제 해결
-- Date: 2026-01-15
-- Issue: api/analyze/personal-color/route.ts에서 wristImageBase64 사용하나 DB 저장 안 됨
-- Related: SDD-MASTER-REFACTORING-PLAN.md Section 5.2

-- 손목 이미지 URL 컬럼 추가
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS wrist_image_url TEXT;

-- 코멘트
COMMENT ON COLUMN personal_color_assessments.wrist_image_url
  IS '손목 이미지 URL (혈관 색상 분석용, 다각도 분석 시 사용)';

-- [3/3] users.gender_preference — 20260202_users_gender_preference.sql
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

COMMIT;
