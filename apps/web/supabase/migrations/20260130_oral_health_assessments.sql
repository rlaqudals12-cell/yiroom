-- ============================================================
-- OH-1 구강 건강 분석 테이블 마이그레이션
-- ============================================================
-- 작성일: 2026-01-30
-- 목적: 구강 건강 분석 결과 저장 테이블 생성
-- 참조: /app/api/analyze/oral-health/route.ts
-- SDD: /docs/specs/SDD-OH-1-ORAL-HEALTH.md
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.oral_health_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,

    -- 이미지
    image_url TEXT NOT NULL DEFAULT '',

    -- 분석 결과 (기본 분류)
    tooth_shade TEXT NOT NULL,              -- 치아 색상 코드 (VITA A1-D4 스케일)
    gum_health TEXT NOT NULL,               -- 'healthy' | 'mild_inflammation' | 'moderate_inflammation' | 'severe'
    oral_hygiene_level TEXT NOT NULL,       -- 'excellent' | 'good' | 'fair' | 'poor'

    -- 지표 점수 (0-100)
    whiteness_score INT CHECK (whiteness_score >= 0 AND whiteness_score <= 100),
    gum_health_score INT CHECK (gum_health_score >= 0 AND gum_health_score <= 100),
    plaque_level INT CHECK (plaque_level >= 0 AND plaque_level <= 100),
    tartar_level INT CHECK (tartar_level >= 0 AND tartar_level <= 100),
    alignment_score INT CHECK (alignment_score >= 0 AND alignment_score <= 100),
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

    -- 미백 목표 (선택적)
    whitening_target TEXT,                  -- 목표 VITA 코드 (A1 등)
    estimated_whitening_sessions INT,       -- 예상 미백 시술 횟수

    -- 결과 데이터 (JSONB)
    concerns JSONB DEFAULT '[]'::jsonb,
    -- 예: [{"area": "lower_front", "issue": "tartar_buildup", "severity": "moderate"}]

    recommendations JSONB DEFAULT '{}'::jsonb,
    -- 예: {"routine": [...], "products": [...], "professional_treatments": [...]}

    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    -- 예: {"model_version": "1.0", "confidence": 0.85, "processing_time_ms": 1200}

    -- 메타 정보
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_oral_health_assessments_clerk_user_id
    ON oral_health_assessments(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_oral_health_assessments_created_at
    ON oral_health_assessments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oral_health_assessments_gum_health
    ON oral_health_assessments(gum_health);

CREATE INDEX IF NOT EXISTS idx_oral_health_assessments_overall_score
    ON oral_health_assessments(overall_score);

-- GIN 인덱스 for JSONB 검색
CREATE INDEX IF NOT EXISTS idx_oral_health_assessments_concerns_gin
    ON oral_health_assessments USING GIN (concerns);

-- 3. 권한 설정
GRANT ALL ON TABLE oral_health_assessments TO anon;
GRANT ALL ON TABLE oral_health_assessments TO authenticated;
GRANT ALL ON TABLE oral_health_assessments TO service_role;

-- 4. RLS 활성화
ALTER TABLE oral_health_assessments ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- JWT sub 클레임에서 clerk_user_id 추출

CREATE POLICY "Users can view own oral health assessments"
    ON oral_health_assessments
    FOR SELECT
    USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own oral health assessments"
    ON oral_health_assessments
    FOR INSERT
    WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own oral health assessments"
    ON oral_health_assessments
    FOR UPDATE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own oral health assessments"
    ON oral_health_assessments
    FOR DELETE
    USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Service role은 모든 작업 허용
CREATE POLICY "Service role has full access to oral health assessments"
    ON oral_health_assessments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. 코멘트
COMMENT ON TABLE oral_health_assessments IS 'OH-1 구강 건강 분석 결과 저장 테이블';
COMMENT ON COLUMN oral_health_assessments.tooth_shade IS '치아 색상 (VITA A1-D4 스케일)';
COMMENT ON COLUMN oral_health_assessments.gum_health IS '잇몸 건강 상태: healthy, mild_inflammation, moderate_inflammation, severe';
COMMENT ON COLUMN oral_health_assessments.oral_hygiene_level IS '구강 위생 수준: excellent, good, fair, poor';
COMMENT ON COLUMN oral_health_assessments.whiteness_score IS '치아 백색도 점수 (0-100)';
COMMENT ON COLUMN oral_health_assessments.gum_health_score IS '잇몸 건강 점수 (0-100)';
COMMENT ON COLUMN oral_health_assessments.plaque_level IS '치태 축적 수준 (0-100, 낮을수록 좋음)';
COMMENT ON COLUMN oral_health_assessments.tartar_level IS '치석 축적 수준 (0-100, 낮을수록 좋음)';
COMMENT ON COLUMN oral_health_assessments.alignment_score IS '치아 배열 점수 (0-100)';
COMMENT ON COLUMN oral_health_assessments.whitening_target IS '미백 목표 VITA 색상 코드';
COMMENT ON COLUMN oral_health_assessments.estimated_whitening_sessions IS '예상 미백 시술 횟수';
COMMENT ON COLUMN oral_health_assessments.concerns IS 'AI 분석된 구강 고민 목록 (JSONB)';
COMMENT ON COLUMN oral_health_assessments.recommendations IS 'AI 추천 케어/시술 정보 (JSONB)';
COMMENT ON COLUMN oral_health_assessments.analysis_metadata IS '분석 메타데이터 (모델 버전, 신뢰도 등)';

-- 7. Updated_at 트리거 (선택적)
CREATE OR REPLACE FUNCTION update_oral_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_oral_health_updated_at
    BEFORE UPDATE ON oral_health_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_oral_health_updated_at();

-- 8. OH-1 뱃지 추가 (gamification_badges 테이블에 추가)
INSERT INTO public.gamification_badges (id, category, name, description, icon, criteria)
VALUES
    ('oral_health_first', 'analysis', '첫 구강 건강 분석', '첫 구강 건강 분석을 완료했습니다', '🦷', '{"type": "count", "target": 1, "table": "oral_health_assessments"}'::jsonb),
    ('oral_health_master', 'analysis', '구강 건강 마스터', '10회 구강 건강 분석을 완료했습니다', '🏆🦷', '{"type": "count", "target": 10, "table": "oral_health_assessments"}'::jsonb),
    ('bright_smile', 'achievement', '밝은 미소', '치아 백색도 점수 90점 이상을 달성했습니다', '✨😁', '{"type": "score", "field": "whiteness_score", "threshold": 90, "table": "oral_health_assessments"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 변경 이력
-- ============================================================
-- v1.0 (2026-01-30): 최초 생성
-- ============================================================
