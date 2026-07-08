-- Migration: PC-1 12톤 서브타입 저장 컬럼
-- Purpose: AI가 판정한 12톤 서브타입(bright/light/true/mute/deep)을 저장.
--   기존엔 프롬프트가 seasonSubtype을 요청했으나 API가 저장하지 않아, 결과 페이지가
--   시즌→tone/depth를 하드코딩 파생(예: summer=무조건 라이트)해 여쿨 뮤트 사용자에게
--   "라이트"라고 잘못 표시했다. 이 컬럼으로 실제 서브타입을 보존해 정확히 표시한다.
-- Date: 2026-07-09
-- Author: Claude Code
-- Rollback: ALTER TABLE personal_color_assessments DROP COLUMN IF EXISTS season_subtype;

ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS season_subtype TEXT;

COMMENT ON COLUMN personal_color_assessments.season_subtype IS
  'AI 판정 12톤 서브타입 (bright/light/true/mute/deep). NULL이면 구 데이터 — 시즌 기반 파생으로 폴백.';
