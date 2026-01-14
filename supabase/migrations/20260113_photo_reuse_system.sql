-- Migration: 사진 재사용 시스템 (Phase 2)
-- Purpose: PC-1 분석 사진을 S-1 분석에 재사용하기 위한 테이블
-- Date: 2026-01-13
-- Spec: SDD-S1-UX-IMPROVEMENT.md §3.1.1

-- ============================================================
-- analysis_images 테이블 - 분석용 이미지 메타데이터 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS analysis_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 분석 유형
  analysis_type TEXT NOT NULL CHECK (
    analysis_type IN ('personal-color', 'skin', 'body', 'hair')
  ),

  -- 원본 분석 참조 (재사용 시)
  source_analysis_id UUID,

  -- Storage 경로
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,

  -- 품질 정보
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  lighting_score INTEGER CHECK (lighting_score BETWEEN 0 AND 100),
  angle TEXT DEFAULT 'front' CHECK (
    angle IN ('front', 'left', 'right', 'back')
  ),

  -- 동의 정보
  consent_given BOOLEAN DEFAULT false,
  retention_until TIMESTAMPTZ,

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 외래 키
  CONSTRAINT fk_user FOREIGN KEY (clerk_user_id)
    REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE analysis_images ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 이미지만 조회 가능
CREATE POLICY "Users can view own images" ON analysis_images
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 사용자는 자신의 이미지만 삽입 가능
CREATE POLICY "Users can insert own images" ON analysis_images
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 사용자는 자신의 이미지만 삭제 가능
CREATE POLICY "Users can delete own images" ON analysis_images
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================================
-- 인덱스
-- ============================================================

-- 사용자별 분석 유형 + 날짜 검색 최적화
CREATE INDEX idx_analysis_images_user_type_date
  ON analysis_images(clerk_user_id, analysis_type, created_at DESC);

-- 재사용 가능 이미지 검색 최적화 (7일 이내, 동의 있음, 품질 70점 이상)
CREATE INDEX idx_analysis_images_reusable
  ON analysis_images(clerk_user_id, analysis_type, consent_given, quality_score, created_at DESC)
  WHERE consent_given = true AND quality_score >= 70;

-- ============================================================
-- 코멘트
-- ============================================================

COMMENT ON TABLE analysis_images IS 'Phase 2: 분석용 이미지 메타데이터 (사진 재사용 시스템)';
COMMENT ON COLUMN analysis_images.clerk_user_id IS 'Clerk 사용자 ID';
COMMENT ON COLUMN analysis_images.analysis_type IS '분석 유형 (personal-color, skin, body, hair)';
COMMENT ON COLUMN analysis_images.source_analysis_id IS '원본 분석 ID (재사용 시 참조)';
COMMENT ON COLUMN analysis_images.storage_path IS 'Supabase Storage 경로 (bucket/path/file.jpg)';
COMMENT ON COLUMN analysis_images.thumbnail_path IS '썸네일 Storage 경로';
COMMENT ON COLUMN analysis_images.quality_score IS '이미지 품질 점수 (0-100)';
COMMENT ON COLUMN analysis_images.lighting_score IS '조명 품질 점수 (0-100)';
COMMENT ON COLUMN analysis_images.angle IS '촬영 각도 (front, left, right, back)';
COMMENT ON COLUMN analysis_images.consent_given IS '이미지 저장 동의 여부';
COMMENT ON COLUMN analysis_images.retention_until IS '보존 기한 (동의 시 1년)';
