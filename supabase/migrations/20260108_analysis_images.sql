-- 분석 이미지 테이블 (사진 재사용용)
-- SDD-VISUAL-SKIN-REPORT.md Phase 2 기능

CREATE TABLE IF NOT EXISTS analysis_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('personal-color', 'skin', 'body', 'hair')),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  quality_score INT CHECK (quality_score >= 0 AND quality_score <= 100),
  lighting_score INT CHECK (lighting_score >= 0 AND lighting_score <= 100),
  angle TEXT CHECK (angle IN ('front', 'left', 'right', 'back')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  retention_until TIMESTAMPTZ,
  source_analysis_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analysis_images_clerk_user_id ON analysis_images(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_images_type ON analysis_images(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_images_reuse ON analysis_images(analysis_type, consent_given, angle, quality_score, created_at);

-- RLS 활성화
ALTER TABLE analysis_images ENABLE ROW LEVEL SECURITY;

-- RLS 정책
DROP POLICY IF EXISTS "analysis_images_select_own" ON analysis_images;
DROP POLICY IF EXISTS "analysis_images_insert_own" ON analysis_images;
DROP POLICY IF EXISTS "analysis_images_update_own" ON analysis_images;
DROP POLICY IF EXISTS "analysis_images_delete_own" ON analysis_images;

CREATE POLICY "analysis_images_select_own" ON analysis_images FOR SELECT USING (auth.jwt() ->> 'sub' = clerk_user_id);
CREATE POLICY "analysis_images_insert_own" ON analysis_images FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = clerk_user_id);
CREATE POLICY "analysis_images_update_own" ON analysis_images FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_user_id);
CREATE POLICY "analysis_images_delete_own" ON analysis_images FOR DELETE USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_analysis_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_analysis_images_updated_at ON analysis_images;
CREATE TRIGGER trigger_analysis_images_updated_at
  BEFORE UPDATE ON analysis_images
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_images_updated_at();

-- 코멘트
COMMENT ON TABLE analysis_images IS '분석 이미지 저장 (사진 재사용 기능)';
COMMENT ON COLUMN analysis_images.storage_path IS 'Supabase Storage 경로 (bucket/path/file.jpg)';
COMMENT ON COLUMN analysis_images.source_analysis_id IS '재사용 시 원본 분석 ID';
