-- H-1 헤어 분석 테이블
-- Created: 2026-01-10

-- hair_analyses 테이블 생성
CREATE TABLE IF NOT EXISTS hair_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_url TEXT,

  -- 모발 타입
  hair_type TEXT CHECK (hair_type IN ('straight', 'wavy', 'curly', 'coily')),
  hair_thickness TEXT CHECK (hair_thickness IN ('fine', 'medium', 'thick')),
  scalp_type TEXT CHECK (scalp_type IN ('dry', 'normal', 'oily', 'sensitive')),

  -- 분석 지표 (0-100)
  hydration SMALLINT CHECK (hydration >= 0 AND hydration <= 100),
  scalp_health SMALLINT CHECK (scalp_health >= 0 AND scalp_health <= 100),
  damage_level SMALLINT CHECK (damage_level >= 0 AND damage_level <= 100),
  density SMALLINT CHECK (density >= 0 AND density <= 100),
  elasticity SMALLINT CHECK (elasticity >= 0 AND elasticity <= 100),
  shine SMALLINT CHECK (shine >= 0 AND shine <= 100),

  -- 종합 점수
  overall_score SMALLINT CHECK (overall_score >= 0 AND overall_score <= 100),

  -- 고민 목록 (JSON 배열)
  concerns JSONB DEFAULT '[]'::jsonb,

  -- 추천 정보 (JSON)
  recommendations JSONB DEFAULT '{}'::jsonb,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_hair_analyses_clerk_user_id ON hair_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_hair_analyses_created_at ON hair_analyses(created_at DESC);

-- RLS 활성화
ALTER TABLE hair_analyses ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회
CREATE POLICY "Users can view own hair analyses"
  ON hair_analyses
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- RLS 정책: 본인 데이터만 생성
CREATE POLICY "Users can insert own hair analyses"
  ON hair_analyses
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- RLS 정책: 본인 데이터만 수정
CREATE POLICY "Users can update own hair analyses"
  ON hair_analyses
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- RLS 정책: 본인 데이터만 삭제
CREATE POLICY "Users can delete own hair analyses"
  ON hair_analyses
  FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Service Role 정책 (서버 사이드)
CREATE POLICY "Service role has full access to hair analyses"
  ON hair_analyses
  FOR ALL
  USING (auth.role() = 'service_role');

-- 스토리지 버킷 생성 (헤어 이미지용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hair-images', 'hair-images', false)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 정책: 본인 폴더만 업로드
CREATE POLICY "Users can upload own hair images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'hair-images' AND
    (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

-- 스토리지 정책: 본인 이미지만 조회
CREATE POLICY "Users can view own hair images"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'hair-images' AND
    (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

-- Updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_hair_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hair_analyses_updated_at
  BEFORE UPDATE ON hair_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_hair_analyses_updated_at();

COMMENT ON TABLE hair_analyses IS 'H-1 헤어 분석 결과 저장 테이블';
COMMENT ON COLUMN hair_analyses.hair_type IS '모발 타입 (직모, 웨이브, 곱슬, 강한 곱슬)';
COMMENT ON COLUMN hair_analyses.scalp_type IS '두피 타입 (건성, 중성, 지성, 민감성)';
COMMENT ON COLUMN hair_analyses.concerns IS '헤어 고민 목록 (JSON 배열)';
COMMENT ON COLUMN hair_analyses.recommendations IS '추천 정보 (인사이트, 성분, 제품, 케어팁)';
