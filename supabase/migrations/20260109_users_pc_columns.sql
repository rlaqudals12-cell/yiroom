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
