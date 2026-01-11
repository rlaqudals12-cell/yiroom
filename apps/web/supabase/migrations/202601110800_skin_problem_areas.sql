-- =====================================================
-- Phase E: 피부 문제 영역 좌표 저장
-- =====================================================

-- skin_analyses 테이블에 problem_areas 컬럼 추가
ALTER TABLE public.skin_analyses
ADD COLUMN IF NOT EXISTS problem_areas JSONB DEFAULT '[]'::jsonb;

-- 코멘트
COMMENT ON COLUMN skin_analyses.problem_areas IS 'AI가 감지한 피부 문제 영역 좌표 배열 (Phase E)';

-- 인덱스 (JSON 배열 검색용)
CREATE INDEX IF NOT EXISTS idx_skin_analyses_problem_areas
    ON skin_analyses USING GIN (problem_areas);
