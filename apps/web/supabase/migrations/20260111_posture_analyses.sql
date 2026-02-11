-- A-1 자세 분석 테이블 마이그레이션
-- 자세 분석 결과 저장 테이블 + C-1 체형 연동
-- Date: 2026-01-07

-- =====================================================
-- 1. posture_analyses 테이블 (A-1)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posture_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,

    -- 이미지 정보
    front_image_url TEXT NOT NULL,
    side_image_url TEXT,

    -- 자세 타입
    posture_type TEXT NOT NULL CHECK (posture_type IN ('ideal', 'forward_head', 'rounded_shoulders', 'swayback', 'flatback', 'lordosis')),

    -- 전체 점수 및 신뢰도
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),
    confidence INT CHECK (confidence >= 0 AND confidence <= 100),

    -- 정면 분석 결과 (JSONB)
    -- { shoulderSymmetry, pelvisSymmetry, kneeAlignment, footAngle }
    front_analysis JSONB,

    -- 측면 분석 결과 (JSONB)
    -- { headForwardAngle, thoracicKyphosis, lumbarLordosis, pelvicTilt }
    side_analysis JSONB,

    -- 문제점
    concerns JSONB,

    -- 스트레칭 추천
    stretching_recommendations JSONB,

    -- AI 인사이트
    insight TEXT,

    -- 분석 근거
    analysis_evidence JSONB,

    -- 이미지 품질 정보
    image_quality JSONB,

    -- C-1 체형 연동
    body_type TEXT,
    body_type_correlation JSONB,

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posture_analyses_clerk_user_id
    ON posture_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_posture_analyses_created_at
    ON posture_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posture_analyses_posture_type
    ON posture_analyses(posture_type);
CREATE INDEX IF NOT EXISTS idx_posture_analyses_body_type
    ON posture_analyses(body_type);

-- 권한
GRANT ALL ON TABLE posture_analyses TO anon;
GRANT ALL ON TABLE posture_analyses TO authenticated;
GRANT ALL ON TABLE posture_analyses TO service_role;

-- 코멘트
COMMENT ON TABLE posture_analyses IS 'A-1 자세 분석 결과';
COMMENT ON COLUMN posture_analyses.posture_type IS '자세 타입: ideal, forward_head, rounded_shoulders, swayback, flatback, lordosis';
COMMENT ON COLUMN posture_analyses.front_analysis IS '정면 분석: 어깨/골반 대칭, 무릎/발 정렬';
COMMENT ON COLUMN posture_analyses.side_analysis IS '측면 분석: 목 경사, 등 굽음, 허리 만곡, 골반 기울기';
COMMENT ON COLUMN posture_analyses.body_type IS 'C-1 체형 연동 (S, W, N 또는 레거시 8타입)';
COMMENT ON COLUMN posture_analyses.body_type_correlation IS '체형-자세 상관관계 분석';

-- =====================================================
-- 2. RLS 정책
-- =====================================================
ALTER TABLE posture_analyses ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회
DROP POLICY IF EXISTS "Users can view own posture data" ON posture_analyses;
CREATE POLICY "Users can view own posture data"
ON posture_analyses FOR SELECT
USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 본인 데이터만 생성
DROP POLICY IF EXISTS "Users can insert own posture data" ON posture_analyses;
CREATE POLICY "Users can insert own posture data"
ON posture_analyses FOR INSERT
WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 본인 데이터만 수정
DROP POLICY IF EXISTS "Users can update own posture data" ON posture_analyses;
CREATE POLICY "Users can update own posture data"
ON posture_analyses FOR UPDATE
USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 본인 데이터만 삭제
DROP POLICY IF EXISTS "Users can delete own posture data" ON posture_analyses;
CREATE POLICY "Users can delete own posture data"
ON posture_analyses FOR DELETE
USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- service_role 전체 접근 허용
DROP POLICY IF EXISTS "Service role full access on posture_analyses" ON posture_analyses;
CREATE POLICY "Service role full access on posture_analyses"
ON posture_analyses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3. Storage 버킷 (이미지 저장용)
-- =====================================================
-- posture-images 버킷 생성 (별도 실행 필요)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('posture-images', 'posture-images', false)
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. updated_at 트리거
-- =====================================================
CREATE OR REPLACE FUNCTION update_posture_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_posture_analyses_updated_at ON posture_analyses;

CREATE TRIGGER trigger_update_posture_analyses_updated_at
    BEFORE UPDATE ON posture_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_posture_analyses_updated_at();
