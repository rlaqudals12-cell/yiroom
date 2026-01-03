-- 위시리스트 테이블 생성
-- 사용자가 관심 있는 제품을 저장

CREATE TABLE IF NOT EXISTS user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'workout_equipment', 'health_food')),
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지: 같은 사용자가 같은 제품을 두 번 추가할 수 없음
  UNIQUE(clerk_user_id, product_type, product_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_wishlists_clerk_user_id ON user_wishlists(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON user_wishlists(product_type, product_id);

-- RLS 활성화
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회/수정 가능
CREATE POLICY "Users can view own wishlists"
  ON user_wishlists FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can insert own wishlists"
  ON user_wishlists FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "Users can delete own wishlists"
  ON user_wishlists FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

-- 코멘트
COMMENT ON TABLE user_wishlists IS '사용자 위시리스트 (관심 제품)';
COMMENT ON COLUMN user_wishlists.clerk_user_id IS 'Clerk 사용자 ID';
COMMENT ON COLUMN user_wishlists.product_type IS '제품 타입 (cosmetic, supplement, workout_equipment, health_food)';
COMMENT ON COLUMN user_wishlists.product_id IS '제품 ID';
