-- Migration: body_analyses 다각도 이미지 컬럼 추가
-- Purpose: 체형 분석 4각도 확장 (정면/좌측면/우측면/후면)
-- Date: 2026-02-10
-- Author: Claude Code
-- Rollback: ALTER TABLE body_analyses DROP COLUMN IF EXISTS left_side_image_url, right_side_image_url, back_image_url;

-- 기존 image_url (NOT NULL) = 정면 이미지로 유지 (하위 호환)
-- 새 컬럼은 모두 nullable (선택 사항)

ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS left_side_image_url TEXT,
  ADD COLUMN IF NOT EXISTS right_side_image_url TEXT,
  ADD COLUMN IF NOT EXISTS back_image_url TEXT;

COMMENT ON COLUMN body_analyses.left_side_image_url IS '좌측면 이미지 URL (선택)';
COMMENT ON COLUMN body_analyses.right_side_image_url IS '우측면 이미지 URL (선택)';
COMMENT ON COLUMN body_analyses.back_image_url IS '후면 이미지 URL (선택)';
