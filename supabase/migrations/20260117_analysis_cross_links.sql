-- Migration: 분석 모듈간 연결 테이블
-- Purpose: PC-1 ↔ S-1 ↔ C-1 ↔ F-1 크로스 참조 (이미지 재사용, 드레이핑 등)
-- Date: 2026-01-17
-- Related: SDD-MASTER-REFACTORING-PLAN.md Section 5.3

-- 모듈간 연결 테이블 생성
CREATE TABLE IF NOT EXISTS analysis_cross_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 소스 분석 (데이터를 제공하는 쪽)
  source_type TEXT NOT NULL CHECK (source_type IN (
    'personal_color',  -- PC-1 퍼스널 컬러
    'face',            -- F-1 얼굴형
    'skin',            -- S-1 피부
    'body'             -- C-1 체형
  )),
  source_id UUID NOT NULL,

  -- 타겟 분석 (데이터를 받는 쪽)
  target_type TEXT NOT NULL CHECK (target_type IN (
    'personal_color',
    'face',
    'skin',
    'body'
  )),
  target_id UUID NOT NULL,

  -- 연결 유형
  link_type TEXT NOT NULL CHECK (link_type IN (
    'image_reuse',      -- PC-1 이미지를 F-1/S-1에서 재사용
    'draping_source',   -- PC-1 시즌 정보로 드레이핑 제공
    'recommendation'    -- 분석 결과 기반 추천 연동
  )),

  -- 메타데이터 (연결 관련 추가 정보)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- FK: 사용자 테이블 참조
  CONSTRAINT analysis_cross_links_user_fkey
    FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id) ON DELETE CASCADE
);

-- 인덱스: 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_cross_links_user ON analysis_cross_links(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_cross_links_source ON analysis_cross_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_cross_links_target ON analysis_cross_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_cross_links_type ON analysis_cross_links(link_type);

-- RLS: 행 단위 보안 활성화
ALTER TABLE analysis_cross_links ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 연결 정보만 관리 가능
CREATE POLICY "Users can view own cross links"
  ON analysis_cross_links FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own cross links"
  ON analysis_cross_links FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own cross links"
  ON analysis_cross_links FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own cross links"
  ON analysis_cross_links FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 코멘트: 테이블 및 컬럼 설명
COMMENT ON TABLE analysis_cross_links IS '분석 모듈간 연결 정보 (이미지 재사용, 드레이핑 등)';
COMMENT ON COLUMN analysis_cross_links.source_type IS '소스 분석 모듈 타입';
COMMENT ON COLUMN analysis_cross_links.target_type IS '타겟 분석 모듈 타입';
COMMENT ON COLUMN analysis_cross_links.link_type IS '연결 유형 (image_reuse, draping_source, recommendation)';
COMMENT ON COLUMN analysis_cross_links.metadata IS '연결 관련 추가 정보 (JSON)';
