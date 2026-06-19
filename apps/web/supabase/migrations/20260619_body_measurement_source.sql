-- Migration: body_analyses.measurement_source (A4)
-- Purpose: 체형 측정 출처 구분 — measured(MediaPipe 실측) vs estimated(Gemini/Mock 추정).
--          통합 분석이 측정값 우선 사용 시 사용자에게 "측정 기반/AI 추정" 배지(A5) 표시 입력.
-- Date: 2026-06-19
-- Author: Claude Code
-- Spec: docs/specs/SDD-BODY-V2-INTEGRATED-ACCURACY.md (A4)
-- Rollback: ALTER TABLE body_analyses DROP COLUMN IF EXISTS measurement_source;

ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS measurement_source TEXT;

COMMENT ON COLUMN body_analyses.measurement_source IS '체형 측정 출처: measured(MediaPipe 실측) | estimated(AI/Mock 추정). NULL=구 분석/미기록. (A4 / ADR-108)';
