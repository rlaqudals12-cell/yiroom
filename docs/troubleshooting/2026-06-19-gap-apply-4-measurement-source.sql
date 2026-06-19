-- ============================================================
-- 갭 적용 4 — body_analyses.measurement_source 컬럼 (복원 prod DB ihlrjhqyopjmhqvjnnnu)
-- 생성: 2026-06-19 by Claude Code
-- 목적: 체형 측정 출처(measured=MediaPipe 실측 / estimated=Gemini·Mock 추정)를 기록 →
--       통합 결과에 "측정 기반/AI 추정" 배지(A5) 표시. (A4 / ADR-108)
-- 배포 안전성: 앱 코드는 best-effort update라 컬럼 없어도 본 저장은 실패하지 않음.
--       이 마이그 적용 후부터 measurement_source가 채워지고 배지가 노출됨.
-- 적용: Supabase Dashboard > SQL Editor 붙여넣기 1회 Run.
-- 정본: apps/web/supabase/migrations/20260619_body_measurement_source.sql
-- ============================================================

BEGIN;

ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS measurement_source TEXT;

COMMENT ON COLUMN body_analyses.measurement_source IS '체형 측정 출처: measured(MediaPipe 실측) | estimated(AI/Mock 추정). NULL=구 분석/미기록. (A4 / ADR-108)';

COMMIT;
