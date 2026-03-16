-- Migration: Review AI Cache
-- Purpose: AI 리뷰 분석 결과 캐싱 테이블
-- Date: 2026-03-16
-- Author: Claude Code
-- Rollback: DROP TABLE IF EXISTS product_review_ai_cache;

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS product_review_ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  summary JSONB NOT NULL,
  analyzed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(product_id, product_type)
);

-- 2. RLS 활성화 (읽기 공개, 쓰기 service_role)
ALTER TABLE product_review_ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_review_cache" ON product_review_ai_cache
  FOR SELECT
  USING (true);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_review_ai_cache_product
  ON product_review_ai_cache(product_id, product_type);

CREATE INDEX IF NOT EXISTS idx_review_ai_cache_expires
  ON product_review_ai_cache(expires_at);

-- 4. 코멘트
COMMENT ON TABLE product_review_ai_cache IS 'AI 리뷰 분석 결과 캐시 (24시간 TTL)';
COMMENT ON COLUMN product_review_ai_cache.product_id IS '제품 ID';
COMMENT ON COLUMN product_review_ai_cache.product_type IS '제품 타입 (cosmetic, supplement, equipment, healthfood)';
COMMENT ON COLUMN product_review_ai_cache.summary IS 'AI 분석 결과 JSON (ReviewAISummary)';
COMMENT ON COLUMN product_review_ai_cache.analyzed_count IS '분석에 사용된 리뷰 수';
COMMENT ON COLUMN product_review_ai_cache.expires_at IS '캐시 만료 시간';
