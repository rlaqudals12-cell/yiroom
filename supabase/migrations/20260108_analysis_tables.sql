-- Migration: Phase 1 분석 테이블
-- Purpose: personal_color_assessments, skin_analyses, body_analyses 테이블 생성
-- Date: 2026-01-08

-- ============================================================
-- personal_color_assessments 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_color_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 문진 데이터
  questionnaire_answers JSONB NOT NULL,

  -- 이미지 정보
  face_image_url TEXT,

  -- 분석 결과
  season TEXT NOT NULL CHECK (season IN ('Spring', 'Summer', 'Autumn', 'Winter')),
  undertone TEXT CHECK (undertone IN ('Warm', 'Cool', 'Neutral')),
  confidence INT CHECK (confidence >= 0 AND confidence <= 100),

  -- 문진 점수
  season_scores JSONB,

  -- 이미지 분석 결과
  image_analysis JSONB,

  -- 추천 데이터
  best_colors JSONB,
  worst_colors JSONB,
  makeup_recommendations JSONB,
  fashion_recommendations JSONB,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pc_assessments_clerk_user_id ON personal_color_assessments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_pc_assessments_season ON personal_color_assessments(season);
CREATE INDEX IF NOT EXISTS idx_pc_assessments_created_at ON personal_color_assessments(created_at DESC);

-- RLS
ALTER TABLE personal_color_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pc assessments" ON personal_color_assessments;
CREATE POLICY "Users can view own pc assessments"
  ON personal_color_assessments FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own pc assessments" ON personal_color_assessments;
CREATE POLICY "Users can insert own pc assessments"
  ON personal_color_assessments FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on pc" ON personal_color_assessments;
CREATE POLICY "Service role full access on pc"
  ON personal_color_assessments FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT, INSERT ON TABLE personal_color_assessments TO authenticated;
GRANT ALL ON TABLE personal_color_assessments TO service_role;

COMMENT ON TABLE personal_color_assessments IS 'PC-1 퍼스널 컬러 진단 결과';

-- ============================================================
-- skin_analyses 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS skin_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 이미지 정보
  image_url TEXT,

  -- 분석 결과 (7가지 지표)
  skin_type TEXT NOT NULL,
  hydration INT CHECK (hydration >= 0 AND hydration <= 100),
  oil_level INT CHECK (oil_level >= 0 AND oil_level <= 100),
  pores INT CHECK (pores >= 0 AND pores <= 100),
  pigmentation INT CHECK (pigmentation >= 0 AND pigmentation <= 100),
  wrinkles INT CHECK (wrinkles >= 0 AND wrinkles <= 100),
  sensitivity INT CHECK (sensitivity >= 0 AND sensitivity <= 100),

  -- 전체 점수
  overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 추천 사항
  recommendations JSONB,
  products JSONB,

  -- 성분 분석
  ingredient_warnings JSONB,

  -- 퍼스널 컬러 연동
  personal_color_season TEXT,
  foundation_recommendation TEXT,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_skin_analyses_clerk_user_id ON skin_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_created_at ON skin_analyses(created_at DESC);

-- RLS
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own skin analyses" ON skin_analyses;
CREATE POLICY "Users can view own skin analyses"
  ON skin_analyses FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own skin analyses" ON skin_analyses;
CREATE POLICY "Users can insert own skin analyses"
  ON skin_analyses FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on skin" ON skin_analyses;
CREATE POLICY "Service role full access on skin"
  ON skin_analyses FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT, INSERT ON TABLE skin_analyses TO authenticated;
GRANT ALL ON TABLE skin_analyses TO service_role;

COMMENT ON TABLE skin_analyses IS 'S-1 피부 분석 결과';

-- ============================================================
-- body_analyses 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS body_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  -- 이미지 정보
  image_url TEXT,

  -- 기본 측정값
  height DECIMAL(5,2),
  weight DECIMAL(5,2),

  -- 분석 결과
  body_type TEXT NOT NULL,
  shoulder INT CHECK (shoulder >= 0 AND shoulder <= 100),
  waist INT CHECK (waist >= 0 AND waist <= 100),
  hip INT CHECK (hip >= 0 AND hip <= 100),
  ratio DECIMAL(3,2),

  -- 추천 사항
  strengths JSONB,
  improvements JSONB,
  style_recommendations JSONB,

  -- 퍼스널 컬러 연동
  personal_color_season TEXT,
  color_recommendations JSONB,

  -- 목표 설정
  target_weight DECIMAL(5,2),
  target_date DATE,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_body_analyses_clerk_user_id ON body_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_body_analyses_created_at ON body_analyses(created_at DESC);

-- RLS
ALTER TABLE body_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own body analyses" ON body_analyses;
CREATE POLICY "Users can view own body analyses"
  ON body_analyses FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own body analyses" ON body_analyses;
CREATE POLICY "Users can insert own body analyses"
  ON body_analyses FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on body" ON body_analyses;
CREATE POLICY "Service role full access on body"
  ON body_analyses FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT, INSERT ON TABLE body_analyses TO authenticated;
GRANT ALL ON TABLE body_analyses TO service_role;

COMMENT ON TABLE body_analyses IS 'C-1 체형 분석 결과';
