-- Migration: body_analyses.body_ratios (AV-3)
-- Purpose: 3D 체형 아바타 입력 밀도 확보 — 클라이언트 MediaPipe 측정 비율(BodyRatios) 전체를
--          JSONB로 축적. 아바타 v1 렌더는 body_type+ratio로 동작하고(저장/소비 분리),
--          데이터가 쌓이면 Tier 'full' 모프 정밀화에 사용.
-- Date: 2026-07-08
-- Author: Claude Code
-- Spec: docs/specs/SDD-BODY-AVATAR-3D.md (AV-3) / ADR-110
-- Rollback: ALTER TABLE body_analyses DROP COLUMN IF EXISTS body_ratios;

ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS body_ratios JSONB;

COMMENT ON COLUMN body_analyses.body_ratios IS 'MediaPipe 측정 비율 전체(BodyRatios — shoulderToWaistRatio, waistToHipRatio 등 무차원 비율). NULL=측정 없음(자가입력/Gemini 추정). 3D 아바타 Tier full 입력. (ADR-110)';
