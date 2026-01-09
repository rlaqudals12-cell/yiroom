-- Phase J: 스마트 매칭 시스템
-- J-1: 인벤토리 확장 + 바코드 + 사용자 설정

-- ============================================
-- 1. 기존 user_inventory 테이블 확장
-- ============================================

-- 제품 DB 연동 컬럼 추가
ALTER TABLE user_inventory
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES affiliate_products(id),
  ADD COLUMN IF NOT EXISTS barcode TEXT;

-- 새 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_product ON user_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON user_inventory(barcode);

-- ============================================
-- 2. 바코드 DB (제품 스캔용)
-- ============================================

CREATE TABLE IF NOT EXISTS product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  barcode TEXT UNIQUE NOT NULL,
  barcode_type TEXT DEFAULT 'EAN13',  -- EAN13, UPC, QR

  -- 제품 연결
  product_id UUID REFERENCES affiliate_products(id),

  -- 제품 정보 (DB에 없는 제품용)
  product_name TEXT,
  brand TEXT,
  category TEXT,
  image_url TEXT,

  -- 메타
  source TEXT,  -- 'user_report', 'api', 'crawl'
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barcode_lookup ON product_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_product ON product_barcodes(product_id);

-- RLS
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;

-- 바코드 DB는 모든 인증 사용자가 조회 가능
CREATE POLICY "Authenticated users can view barcodes"
  ON product_barcodes
  FOR SELECT
  TO authenticated
  USING (true);

-- 바코드 추가는 인증 사용자만
CREATE POLICY "Authenticated users can insert barcodes"
  ON product_barcodes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 3. 사용자 쇼핑 설정 (쇼핑/배송 선호)
-- ============================================

CREATE TABLE IF NOT EXISTS user_shopping_preferences (
  clerk_user_id TEXT PRIMARY KEY,

  -- 예산 설정 (JSONB)
  budget JSONB DEFAULT '{}'::jsonb,
  -- { "clothing": {"min": 0, "max": 100000}, "skincare": {...}, "supplements": {...} }

  -- 브랜드 선호
  favorite_brands TEXT[] DEFAULT '{}',
  blocked_brands TEXT[] DEFAULT '{}',

  -- 쇼핑 선호
  preferred_platforms TEXT[] DEFAULT '{}',
  prioritize_free_delivery BOOLEAN DEFAULT TRUE,
  prioritize_fast_delivery BOOLEAN DEFAULT FALSE,
  prioritize_points BOOLEAN DEFAULT FALSE,

  -- 추천 설정
  show_alternatives BOOLEAN DEFAULT TRUE,
  show_price_comparison BOOLEAN DEFAULT TRUE,
  notify_price_drop BOOLEAN DEFAULT TRUE,
  notify_restock BOOLEAN DEFAULT TRUE,

  -- 알림 설정
  notification_email BOOLEAN DEFAULT TRUE,
  notification_push BOOLEAN DEFAULT TRUE,
  notification_frequency TEXT DEFAULT 'daily',  -- realtime, daily, weekly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_shopping_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shopping preferences"
  ON user_shopping_preferences
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 4. 사용자 신체 치수
-- ============================================

CREATE TABLE IF NOT EXISTS user_body_measurements (
  clerk_user_id TEXT PRIMARY KEY,

  -- 기본 (C-1 연동)
  height NUMERIC,
  weight NUMERIC,
  body_type TEXT,

  -- 상세 치수 (cm)
  chest NUMERIC,
  waist NUMERIC,
  hip NUMERIC,
  shoulder NUMERIC,
  arm_length NUMERIC,
  inseam NUMERIC,
  foot_length NUMERIC,

  -- 선호 핏
  preferred_fit TEXT DEFAULT 'regular',  -- tight, regular, loose

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own measurements"
  ON user_body_measurements
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 5. 브랜드별 사이즈 기록
-- ============================================

CREATE TABLE IF NOT EXISTS user_size_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- top, bottom, shoes 등
  size TEXT NOT NULL,
  fit TEXT,  -- small, perfect, large

  product_id UUID REFERENCES affiliate_products(id),
  purchase_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_size_history_user ON user_size_history(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_size_history_brand ON user_size_history(brand_id);

-- RLS
ALTER TABLE user_size_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own size history"
  ON user_size_history
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 6. 브랜드 사이즈 차트 (공개 데이터)
-- ============================================

CREATE TABLE IF NOT EXISTS brand_size_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  country TEXT,  -- KR, US, EU

  category TEXT NOT NULL,  -- top, bottom, shoes 등
  fit_style TEXT,  -- slim, regular, oversized

  -- 사이즈 매핑 (JSONB)
  size_mappings JSONB NOT NULL,
  -- [{ "label": "M", "minHeight": 165, "maxHeight": 175, "measurements": {...} }]

  -- 메타
  source TEXT,
  last_verified DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_size_unique
  ON brand_size_charts(brand_id, category);

-- RLS (공개 조회)
ALTER TABLE brand_size_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brand size charts"
  ON brand_size_charts
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 7. 제품별 실측 데이터
-- ============================================

CREATE TABLE IF NOT EXISTS product_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,

  -- 사이즈별 실측 (JSONB)
  size_measurements JSONB NOT NULL,
  -- [{ "size": "M", "actualMeasurements": { "totalLength": 70, ... } }]

  -- 데이터 품질
  source TEXT,  -- official, musinsa, user_report, ai_extracted
  reliability NUMERIC DEFAULT 0.5,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_measurements_product
  ON product_measurements(product_id);

-- RLS (공개 조회)
ALTER TABLE product_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product measurements"
  ON product_measurements
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 8. 가격 모니터링
-- ============================================

CREATE TABLE IF NOT EXISTS price_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  product_id UUID NOT NULL,

  -- 조건
  target_price NUMERIC,
  percent_drop NUMERIC,
  platforms TEXT[],

  -- 현재 상태
  current_lowest_price NUMERIC,
  lowest_platform TEXT,

  -- 알림
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_price_watch_user ON price_watches(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_price_watch_product ON price_watches(product_id);

-- RLS
ALTER TABLE price_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price watches"
  ON price_watches
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 9. 가격 히스토리
-- ============================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  platform TEXT NOT NULL,

  price NUMERIC NOT NULL,
  original_price NUMERIC,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
  ON price_history(product_id, recorded_at DESC);

-- RLS (공개 조회)
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON price_history
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 10. 사용자 피드백
-- ============================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  feedback_type TEXT NOT NULL,  -- purchase_review, size_feedback, match_feedback, etc.
  product_id UUID,
  recommendation_id UUID,

  -- 피드백 내용
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  size_fit TEXT,  -- small, perfect, large
  color_accuracy TEXT,  -- different, similar, exact
  would_recommend BOOLEAN,

  comment TEXT,
  pros TEXT[],
  cons TEXT[],
  photos TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_product ON user_feedback(product_id);

-- RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
  ON user_feedback
  FOR ALL
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 11. 알림
-- ============================================

CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  notification_type TEXT NOT NULL,
  -- product_running_low, expiry_approaching, price_drop, back_in_stock, etc.

  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,

  product_id UUID,
  inventory_item_id UUID,
  action_url TEXT,

  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON smart_notifications(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON smart_notifications(clerk_user_id) WHERE read = FALSE;

-- RLS
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON smart_notifications
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own notifications"
  ON smart_notifications
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 12. updated_at 트리거
-- ============================================

-- 트리거 함수 (이미 존재할 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'product_barcodes',
    'user_shopping_preferences',
    'user_body_measurements',
    'brand_size_charts',
    'product_measurements'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS %I_updated_at ON %I;
      CREATE TRIGGER %I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;
