-- Migration: nutrition_settings 테이블에 간헐적 단식 컬럼 추가
-- Purpose: N-1 간헐적 단식 설정 (Task 2.16)
-- Date: 2025-12-02
-- Sprint: Sprint 2

-- Step 1: 간헐적 단식 관련 컬럼 추가
ALTER TABLE nutrition_settings
ADD COLUMN IF NOT EXISTS fasting_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fasting_type TEXT CHECK (fasting_type IS NULL OR fasting_type IN ('16:8', '18:6', '20:4', 'custom')),
ADD COLUMN IF NOT EXISTS fasting_start_time TIME,
ADD COLUMN IF NOT EXISTS eating_window_hours INTEGER CHECK (eating_window_hours IS NULL OR (eating_window_hours >= 1 AND eating_window_hours <= 23));

-- Step 2: 코멘트 추가
COMMENT ON COLUMN nutrition_settings.fasting_enabled IS '간헐적 단식 활성화 여부';
COMMENT ON COLUMN nutrition_settings.fasting_type IS '단식 유형 (16:8/18:6/20:4/custom)';
COMMENT ON COLUMN nutrition_settings.fasting_start_time IS '단식 시작 시간';
COMMENT ON COLUMN nutrition_settings.eating_window_hours IS '식사 가능 시간 (시간 단위, 1~23)';
