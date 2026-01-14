-- Migration: skin_analyses에 problem_areas 컬럼 추가
-- Purpose: Phase E 문제 영역 좌표 저장을 위한 JSONB 컬럼 추가
-- Date: 2026-01-13

-- ============================================================
-- skin_analyses 테이블에 problem_areas 컬럼 추가
-- ============================================================

-- 문제 영역 좌표를 저장하는 JSONB 컬럼 추가
-- 형식: [{ x: number, y: number, type: string, severity: string }]
ALTER TABLE skin_analyses
ADD COLUMN IF NOT EXISTS problem_areas JSONB DEFAULT '[]'::jsonb;

-- 코멘트 추가
COMMENT ON COLUMN skin_analyses.problem_areas IS 'Phase E: 피부 문제 영역 좌표 및 타입 (JSONB 배열)';
