-- Migration: C-1 다각도 체형 분석 컬럼 추가
-- Purpose: 좌측면/우측면/후면 이미지 URL 저장
-- Date: 2026-02-10
-- Issue: API가 존재하지 않는 컬럼에 insert 시도로 500 에러 발생

-- 다각도 이미지 URL 컬럼 추가
ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS left_side_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_side_image_url TEXT,
  ADD COLUMN IF NOT EXISTS back_image_url TEXT;

COMMENT ON COLUMN body_analyses.left_side_image_url IS '좌측면 체형 이미지 URL (다각도 분석용)';
COMMENT ON COLUMN body_analyses.right_side_image_url IS '우측면 체형 이미지 URL (다각도 분석용)';
COMMENT ON COLUMN body_analyses.back_image_url IS '후면 체형 이미지 URL (다각도 분석용)';
