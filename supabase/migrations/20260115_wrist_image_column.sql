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
