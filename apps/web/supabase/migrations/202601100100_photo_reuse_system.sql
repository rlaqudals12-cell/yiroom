-- ============================================================================
-- Phase 2: 사진 재사용 시스템
-- Description: 분석 이미지 메타데이터 테이블 및 재사용 기능 지원
-- ============================================================================

-- 이미지 메타데이터 테이블
CREATE TABLE IF NOT EXISTS analysis_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('personal-color', 'skin', 'body', 'hair')),
  source_analysis_id UUID,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  angle TEXT DEFAULT 'front' CHECK (angle IN ('front', 'left', 'right', 'back')),
  lighting_score INTEGER CHECK (lighting_score BETWEEN 0 AND 100),
  consent_given BOOLEAN DEFAULT false,
  retention_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_analysis_images_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- RLS 정책
ALTER TABLE analysis_images ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 이미지만 조회
CREATE POLICY "analysis_images_select_own" ON analysis_images
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

-- INSERT: 본인 이미지만 추가
CREATE POLICY "analysis_images_insert_own" ON analysis_images
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- UPDATE: 본인 이미지만 수정
CREATE POLICY "analysis_images_update_own" ON analysis_images
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- DELETE: 본인 이미지만 삭제
CREATE POLICY "analysis_images_delete_own" ON analysis_images
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_analysis_images_user_type
  ON analysis_images(clerk_user_id, analysis_type, created_at DESC);

CREATE INDEX idx_analysis_images_reuse_eligible
  ON analysis_images(clerk_user_id, analysis_type, consent_given, quality_score, created_at DESC)
  WHERE consent_given = true AND quality_score >= 70;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_analysis_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analysis_images_updated_at
  BEFORE UPDATE ON analysis_images
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_images_updated_at();

-- ============================================================================
-- 코멘트
-- ============================================================================
COMMENT ON TABLE analysis_images IS '분석용 이미지 메타데이터 (사진 재사용 지원)';
COMMENT ON COLUMN analysis_images.analysis_type IS '분석 유형: personal-color, skin, body, hair';
COMMENT ON COLUMN analysis_images.source_analysis_id IS '원본 분석 ID (재사용 추적용)';
COMMENT ON COLUMN analysis_images.storage_path IS 'Supabase Storage 경로';
COMMENT ON COLUMN analysis_images.quality_score IS '이미지 품질 점수 (0-100)';
COMMENT ON COLUMN analysis_images.angle IS '촬영 각도: front, left, right, back';
COMMENT ON COLUMN analysis_images.lighting_score IS '조명 품질 점수 (0-100)';
COMMENT ON COLUMN analysis_images.consent_given IS '이미지 보존 동의 여부';
COMMENT ON COLUMN analysis_images.retention_until IS '이미지 보존 기한';
