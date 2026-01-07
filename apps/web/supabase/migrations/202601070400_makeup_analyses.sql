-- M-1 메이크업 분석 테이블 마이그레이션
-- Date: 2026-01-07

-- =====================================================
-- makeup_analyses 테이블 (M-1)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.makeup_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    image_url TEXT NOT NULL,

    -- 기본 분석 결과
    undertone TEXT NOT NULL CHECK (undertone IN ('warm', 'cool', 'neutral')),
    eye_shape TEXT NOT NULL CHECK (eye_shape IN ('monolid', 'double', 'hooded', 'round', 'almond', 'downturned')),
    lip_shape TEXT NOT NULL CHECK (lip_shape IN ('full', 'thin', 'wide', 'small', 'heart', 'asymmetric')),
    face_shape TEXT NOT NULL CHECK (face_shape IN ('oval', 'round', 'square', 'heart', 'oblong', 'diamond')),

    -- 피부 상태 지표 (0-100)
    skin_texture INT CHECK (skin_texture >= 0 AND skin_texture <= 100),
    skin_tone_uniformity INT CHECK (skin_tone_uniformity >= 0 AND skin_tone_uniformity <= 100),
    hydration INT CHECK (hydration >= 0 AND hydration <= 100),
    pore_visibility INT CHECK (pore_visibility >= 0 AND pore_visibility <= 100),
    oil_balance INT CHECK (oil_balance >= 0 AND oil_balance <= 100),

    -- 전체 점수
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 피부 고민 (JSON 배열)
    concerns JSONB DEFAULT '[]'::jsonb,

    -- 추천 사항 (JSON 객체)
    recommendations JSONB DEFAULT '{}'::jsonb,
    -- recommendations 구조:
    -- {
    --   insight: string,
    --   styles: string[],
    --   colors: ColorRecommendation[],
    --   tips: MakeupTip[],
    --   personalColorConnection: {...}
    -- }

    -- 메타 정보
    analysis_reliability TEXT DEFAULT 'medium' CHECK (analysis_reliability IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_makeup_analyses_clerk_user_id
    ON makeup_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_makeup_analyses_created_at
    ON makeup_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_makeup_analyses_undertone
    ON makeup_analyses(undertone);

-- 권한
GRANT ALL ON TABLE makeup_analyses TO anon;
GRANT ALL ON TABLE makeup_analyses TO authenticated;
GRANT ALL ON TABLE makeup_analyses TO service_role;

-- RLS 활성화
ALTER TABLE makeup_analyses ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 분석만 조회/생성/삭제 가능
CREATE POLICY "makeup_analyses_select_own" ON makeup_analyses
    FOR SELECT
    TO authenticated
    USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "makeup_analyses_insert_own" ON makeup_analyses
    FOR INSERT
    TO authenticated
    WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "makeup_analyses_delete_own" ON makeup_analyses
    FOR DELETE
    TO authenticated
    USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- Service role은 모든 권한
CREATE POLICY "makeup_analyses_service_role" ON makeup_analyses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 코멘트
COMMENT ON TABLE makeup_analyses IS 'M-1 메이크업 분석 결과';
COMMENT ON COLUMN makeup_analyses.undertone IS '피부 언더톤 (warm/cool/neutral)';
COMMENT ON COLUMN makeup_analyses.eye_shape IS '눈 모양';
COMMENT ON COLUMN makeup_analyses.lip_shape IS '입술 모양';
COMMENT ON COLUMN makeup_analyses.face_shape IS '얼굴형';
COMMENT ON COLUMN makeup_analyses.concerns IS '피부 고민 배열 (dark-circles, redness, etc.)';
COMMENT ON COLUMN makeup_analyses.recommendations IS '맞춤 추천 데이터 (색상, 스타일, 팁)';
