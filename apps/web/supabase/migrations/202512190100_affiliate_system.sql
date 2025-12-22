-- Affiliate System
-- Sprint 3: 어필리에이트 연동
-- Created: 2025-12-19

-- ============================================
-- 1. 기존 제품 테이블에 affiliate 필드 추가
-- ============================================

-- 화장품 테이블
ALTER TABLE cosmetic_products
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(5,2);

-- 영양제 테이블
ALTER TABLE supplement_products
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(5,2);

-- 운동기구 테이블 (이미 있을 수 있으므로 IF NOT EXISTS)
ALTER TABLE workout_equipment
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(5,2);

-- 건강식품 테이블 (이미 있을 수 있으므로 IF NOT EXISTS)
ALTER TABLE health_foods
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(5,2);

-- ============================================
-- 2. 클릭 트래킹 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 (비로그인도 가능)
  clerk_user_id TEXT,

  -- 제품 정보
  product_type TEXT NOT NULL CHECK (product_type IN ('cosmetic', 'supplement', 'equipment', 'healthfood')),
  product_id UUID NOT NULL,

  -- 트래킹 정보
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,  -- 개인정보 보호를 위해 해시

  -- 타임스탬프
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_clicks_product ON affiliate_clicks(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_user ON affiliate_clicks(clerk_user_id);

-- ============================================
-- 3. RLS 정책
-- ============================================
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- 삽입은 모든 사용자 가능 (비로그인 포함)
CREATE POLICY "Anyone can track clicks"
  ON affiliate_clicks
  FOR INSERT
  WITH CHECK (true);

-- 읽기는 관리자만 (service_role)
-- SELECT 정책 없음 → 일반 사용자 조회 불가

-- ============================================
-- 4. 일별 통계 뷰 (관리자용)
-- ============================================
CREATE OR REPLACE VIEW affiliate_daily_stats AS
SELECT
  DATE(clicked_at) AS date,
  product_type,
  product_id,
  COUNT(*) AS click_count,
  COUNT(DISTINCT clerk_user_id) AS unique_users
FROM affiliate_clicks
GROUP BY DATE(clicked_at), product_type, product_id
ORDER BY date DESC;

-- 뷰에 RLS 적용 (읽기 전용)
-- 참고: 뷰는 기본 테이블의 RLS를 따름
