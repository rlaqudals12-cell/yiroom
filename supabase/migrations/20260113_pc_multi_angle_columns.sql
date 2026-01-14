-- Migration: PC-1 다각도 분석 컬럼 추가
-- Purpose: 다각도 분석을 위한 누락된 컬럼 추가
-- Date: 2026-01-13
-- Issue: API가 존재하지 않는 컬럼에 insert 시도로 500 에러 발생

-- 다각도 이미지 URL 컬럼 추가
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS left_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_image_url TEXT;

-- 분석 메타데이터 컬럼 추가
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS images_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS analysis_reliability TEXT DEFAULT 'medium'
    CHECK (analysis_reliability IN ('high', 'medium', 'low'));

-- 인덱스 추가 (다각도 분석 조회용)
CREATE INDEX IF NOT EXISTS idx_pc_assessments_images_count
  ON personal_color_assessments(images_count);

COMMENT ON COLUMN personal_color_assessments.left_image_url IS '좌측 얼굴 이미지 URL (다각도 분석용)';
COMMENT ON COLUMN personal_color_assessments.right_image_url IS '우측 얼굴 이미지 URL (다각도 분석용)';
COMMENT ON COLUMN personal_color_assessments.images_count IS '분석에 사용된 이미지 수 (1-3)';
COMMENT ON COLUMN personal_color_assessments.analysis_reliability IS '분석 신뢰도 (high/medium/low)';
