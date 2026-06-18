-- Migration: hair_analyses.face_shape 컬럼 추가
-- Date: 2026-06-17
-- Author: Claude Code
-- Purpose:
--   통합 분석 헤어 어댑터(lib/analysis/integrated/internal/axis-adapters.ts)가
--   hair_analyses에 face_shape를 저장(upsert)하는데 컬럼이 정의된 적이 없어
--   42703(column does not exist)로 통합 헤어 축 저장이 실패하던 코드-스키마 불일치 해소.
--   face_shape가 채워져야 HairAxisData.faceShape가 흐르고, cross-insights 헤어 스타일
--   인사이트 + recommendHairstyles(얼굴형 기반 컷 추천)가 동작한다. (ADR-107)
-- Rollback: ALTER TABLE hair_analyses DROP COLUMN IF EXISTS face_shape;

ALTER TABLE hair_analyses
  ADD COLUMN IF NOT EXISTS face_shape TEXT;
  -- 값: 'oval'|'round'|'square'|'heart'|'oblong'|'diamond'|'rectangle' (lib/analysis/hair FaceShapeType)

COMMENT ON COLUMN hair_analyses.face_shape IS '얼굴형 분류 (H-1 face-shape-analyzer). 헤어 스타일·컷 추천 입력. NULL=구 분석/미측정';
