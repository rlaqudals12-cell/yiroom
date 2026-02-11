-- ============================================================
-- H-1 헤어 분석 테이블 마이그레이션
-- ============================================================
-- 작성일: 2026-01-09
-- 목적: 헤어 분석 결과 저장 테이블 생성
-- 참조: /app/api/analyze/hair/route.ts
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.hair_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,

    -- 이미지
    image_url TEXT NOT NULL DEFAULT '',

    -- 분석 결과 (기본 분류)
    hair_type TEXT NOT NULL,           -- 'straight' | 'wavy' | 'curly' | 'coily'
    hair_thickness TEXT NOT NULL,      -- 'thin' | 'medium' | 'thick'
    scalp_type TEXT NOT NULL,          -- 'dry' | 'normal' | 'oily'

    -- 지표 점수 (0-100)
    hydration INT CHECK (hydration >= 0 AND hydration <= 100),
    scalp_health INT CHECK (scalp_health >= 0 AND scalp_health <= 100),
    damage_level INT CHECK (damage_level >= 0 AND damage_level <= 100),
    density INT CHECK (density >= 0 AND density <= 100),
    elasticity INT CHECK (elasticity >= 0 AND elasticity <= 100),
    shine INT CHECK (shine >= 0 AND shine <= 100),
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 결과 데이터 (JSONB)
    concerns JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '{}'::jsonb,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hair_analyses_clerk_user_id
    ON hair_analyses(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_hair_analyses_created_at
    ON hair_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hair_analyses_hair_type
    ON hair_analyses(hair_type);

-- 3. 권한 설정
GRANT ALL ON TABLE hair_analyses TO anon;
GRANT ALL ON TABLE hair_analyses TO authenticated;
GRANT ALL ON TABLE hair_analyses TO service_role;

-- 4. RLS 활성화
ALTER TABLE hair_analyses ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- JWT sub 클레임에서 clerk_user_id 추출

DROP POLICY IF EXISTS "Users can view own hair analyses" ON hair_analyses;
CREATE POLICY "Users can view own hair analyses"
    ON hair_analyses
    FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can insert own hair analyses" ON hair_analyses;
CREATE POLICY "Users can insert own hair analyses"
    ON hair_analyses
    FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can update own hair analyses" ON hair_analyses;
CREATE POLICY "Users can update own hair analyses"
    ON hair_analyses
    FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can delete own hair analyses" ON hair_analyses;
CREATE POLICY "Users can delete own hair analyses"
    ON hair_analyses
    FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Service role은 모든 작업 허용
DROP POLICY IF EXISTS "Service role has full access to hair analyses" ON hair_analyses;
CREATE POLICY "Service role has full access to hair analyses"
    ON hair_analyses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. 코멘트
COMMENT ON TABLE hair_analyses IS 'H-1 헤어 분석 결과 저장 테이블';
COMMENT ON COLUMN hair_analyses.hair_type IS '헤어 유형: straight, wavy, curly, coily';
COMMENT ON COLUMN hair_analyses.hair_thickness IS '헤어 굵기: thin, medium, thick';
COMMENT ON COLUMN hair_analyses.scalp_type IS '두피 유형: dry, normal, oily';
COMMENT ON COLUMN hair_analyses.concerns IS 'AI 분석된 헤어 고민 목록';
COMMENT ON COLUMN hair_analyses.recommendations IS 'AI 추천 케어 방법';

-- ============================================================
-- 변경 이력
-- ============================================================
-- v1.0 (2026-01-09): 최초 생성
-- ============================================================
