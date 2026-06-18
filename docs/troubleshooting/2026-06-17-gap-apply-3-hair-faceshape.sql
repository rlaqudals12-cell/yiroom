-- ============================================================
-- 갭 적용 3 — hair_analyses.face_shape 컬럼 (복원 prod DB ihlrjhqyopjmhqvjnnnu)
-- 생성: 2026-06-17 by Claude Code
-- 목적: 통합 헤어 어댑터(axis-adapters.ts)가 hair_analyses.face_shape를 쓰는데
--       컬럼이 마이그레이션에 정의된 적 없어 42703으로 통합 헤어 저장 실패 + faceShape 미흐름.
--       추가 시: 통합 헤어 축 저장 성공 + 얼굴형 흐름 → cross-insights 헤어 스타일이
--       얼굴형별로 작동(현재는 빈값이라 모두 '레이어드 컷' 기본값). (ADR-107)
-- 적용: Supabase Dashboard > SQL Editor 붙여넣기 1회 Run.
-- 정본: apps/web/supabase/migrations/20260617_hair_analyses_face_shape.sql
-- ============================================================

BEGIN;

ALTER TABLE hair_analyses
  ADD COLUMN IF NOT EXISTS face_shape TEXT;

COMMENT ON COLUMN hair_analyses.face_shape IS '얼굴형 분류 (H-1). 헤어 스타일·컷 추천 입력. NULL=구 분석/미측정';

COMMIT;
