-- Product Reviews System
-- Sprint 1: 사용자 리뷰 시스템
-- Created: 2025-12-19

-- ============================================
-- 1. 제품 리뷰 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 제품 참조 (다형성)
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 리뷰 내용
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,

  -- 메타데이터
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 제품별 1개 리뷰 제한
  UNIQUE(clerk_user_id, product_type, product_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON product_reviews(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON product_reviews(created_at DESC);

-- ============================================
-- 2. 리뷰 도움됨 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 사용자당 리뷰별 1번만 도움됨 표시
  UNIQUE(review_id, clerk_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_helpful_review ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_user ON review_helpful(clerk_user_id);

-- ============================================
-- 3. RLS 정책
-- ============================================

-- product_reviews RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "Public can read reviews"
  ON product_reviews
  FOR SELECT
  USING (true);

-- 인증된 사용자 작성
CREATE POLICY "Authenticated users can create reviews"
  ON product_reviews
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인만 수정
CREATE POLICY "Users can update own reviews"
  ON product_reviews
  FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인만 삭제
CREATE POLICY "Users can delete own reviews"
  ON product_reviews
  FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- review_helpful RLS
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "Public can read helpful marks"
  ON review_helpful
  FOR SELECT
  USING (true);

-- 인증된 사용자 작성
CREATE POLICY "Authenticated users can mark helpful"
  ON review_helpful
  FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인만 삭제 (도움됨 취소)
CREATE POLICY "Users can remove own helpful marks"
  ON review_helpful
  FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- 4. 트리거: updated_at 자동 갱신
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 트리거: helpful_count 자동 갱신
-- ============================================
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count - 1
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_helpful_count_on_insert
  AFTER INSERT ON review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

CREATE TRIGGER update_helpful_count_on_delete
  AFTER DELETE ON review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();
