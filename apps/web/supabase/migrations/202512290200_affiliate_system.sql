-- 어필리에이트 시스템 테이블
-- 버전: 1.0
-- 작성일: 2025-12-29
-- 목적: 제휴 마케팅 시스템 (iHerb, 쿠팡, 무신사 등)

-- ================================================
-- 1. affiliate_partners (파트너 설정)
-- ================================================
CREATE TABLE IF NOT EXISTS affiliate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 파트너 정보
  name TEXT NOT NULL UNIQUE,           -- 'iherb', 'coupang', 'musinsa'
  display_name TEXT NOT NULL,          -- '아이허브', '쿠팡', '무신사'
  logo_url TEXT,

  -- API 설정
  api_type TEXT NOT NULL CHECK (api_type IN ('csv_feed', 'rest_api', 'manual')),
  api_endpoint TEXT,
  api_key_encrypted TEXT,              -- 암호화된 API 키

  -- 수수료 정보
  commission_rate_min DECIMAL(5,2),    -- 최소 수수료율 (%)
  commission_rate_max DECIMAL(5,2),    -- 최대 수수료율 (%)
  cookie_duration_days INTEGER,        -- 쿠키 유효 기간

  -- 동기화 설정
  sync_frequency_hours INTEGER DEFAULT 24,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error_message TEXT,

  -- 상태
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- affiliate_partners 코멘트
COMMENT ON TABLE affiliate_partners IS '어필리에이트 파트너 설정 테이블';
COMMENT ON COLUMN affiliate_partners.name IS '파트너 식별자: iherb, coupang, musinsa';
COMMENT ON COLUMN affiliate_partners.api_type IS 'API 타입: csv_feed, rest_api, manual';
COMMENT ON COLUMN affiliate_partners.commission_rate_min IS '최소 수수료율 (%)';
COMMENT ON COLUMN affiliate_partners.sync_status IS '동기화 상태: pending, syncing, success, error';

-- ================================================
-- 2. affiliate_products (어필리에이트 제품)
-- ================================================
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 파트너 연결
  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  external_product_id TEXT NOT NULL,   -- 파트너사 제품 ID

  -- 제품 정보
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,                       -- 'supplement', 'cosmetic', 'fashion'
  subcategory TEXT,
  description TEXT,

  -- 이미지
  image_url TEXT,                      -- 메인 이미지
  image_urls TEXT[],                   -- 추가 이미지들
  thumbnail_url TEXT,                  -- 썸네일

  -- 가격
  price_krw INTEGER,
  price_original_krw INTEGER,          -- 정가 (할인 전)
  currency TEXT DEFAULT 'KRW',

  -- 어필리에이트 링크
  affiliate_url TEXT NOT NULL,         -- 트래킹 링크
  direct_url TEXT,                     -- 직접 링크 (참고용)

  -- 평점/리뷰
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,

  -- 매칭 정보 (이룸 분석 연동)
  skin_types TEXT[],                   -- 피부 타입 매칭
  skin_concerns TEXT[],                -- 피부 고민 매칭
  personal_colors TEXT[],              -- 퍼스널 컬러 매칭
  body_types TEXT[],                   -- 체형 매칭

  -- 키워드/태그
  keywords TEXT[],
  tags TEXT[],

  -- 재고/상태
  is_in_stock BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  -- 동기화 정보
  last_synced_at TIMESTAMPTZ,
  sync_hash TEXT,                      -- 변경 감지용 해시

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 유니크 (같은 파트너의 같은 제품 중복 방지)
  UNIQUE(partner_id, external_product_id)
);

-- affiliate_products 인덱스
CREATE INDEX IF NOT EXISTS idx_affiliate_products_partner ON affiliate_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_brand ON affiliate_products(brand);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_skin_types ON affiliate_products USING GIN(skin_types);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_skin_concerns ON affiliate_products USING GIN(skin_concerns);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_personal_colors ON affiliate_products USING GIN(personal_colors);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_body_types ON affiliate_products USING GIN(body_types);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_keywords ON affiliate_products USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_active ON affiliate_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_affiliate_products_rating ON affiliate_products(rating DESC NULLS LAST);

-- affiliate_products 코멘트
COMMENT ON TABLE affiliate_products IS '어필리에이트 제품 테이블 (파트너사 제품 데이터)';
COMMENT ON COLUMN affiliate_products.external_product_id IS '파트너사 고유 제품 ID';
COMMENT ON COLUMN affiliate_products.affiliate_url IS '어필리에이트 트래킹 링크';
COMMENT ON COLUMN affiliate_products.skin_types IS '적합한 피부 타입: dry, oily, combination, sensitive, normal';
COMMENT ON COLUMN affiliate_products.personal_colors IS '적합한 퍼스널 컬러: spring_warm, summer_cool, autumn_warm, winter_cool';
COMMENT ON COLUMN affiliate_products.sync_hash IS '데이터 변경 감지용 해시값';

-- ================================================
-- 3. affiliate_clicks (클릭 추적)
-- ================================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관계
  product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  clerk_user_id TEXT,                  -- 로그인 사용자 (옵션)

  -- 컨텍스트
  source_page TEXT,                    -- 클릭 발생 페이지
  source_component TEXT,               -- 클릭 발생 컴포넌트
  recommendation_type TEXT,            -- 'skin_match', 'color_match', 'popular', 'search'

  -- 디바이스 정보
  user_agent TEXT,
  ip_hash TEXT,                        -- IP 해시 (익명화)

  -- 세션 정보
  session_id TEXT,

  -- 시간
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- 전환 추적 (웹훅으로 업데이트)
  converted_at TIMESTAMPTZ,
  conversion_value_krw INTEGER,
  commission_krw INTEGER
);

-- affiliate_clicks 인덱스
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_converted ON affiliate_clicks(converted_at) WHERE converted_at IS NOT NULL;

-- affiliate_clicks 코멘트
COMMENT ON TABLE affiliate_clicks IS '어필리에이트 클릭 추적 테이블';
COMMENT ON COLUMN affiliate_clicks.ip_hash IS 'IP 주소 SHA256 해시 (개인정보 익명화)';
COMMENT ON COLUMN affiliate_clicks.recommendation_type IS '추천 유형: skin_match, color_match, popular, search';
COMMENT ON COLUMN affiliate_clicks.converted_at IS '전환 발생 시간 (구매 완료)';
COMMENT ON COLUMN affiliate_clicks.commission_krw IS '예상 수수료 (원)';

-- ================================================
-- 4. affiliate_daily_stats (일별 통계)
-- ================================================
CREATE TABLE IF NOT EXISTS affiliate_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  partner_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- 클릭 통계
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,

  -- 전환 통계
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),        -- %

  -- 수익 통계
  total_sales_krw INTEGER DEFAULT 0,
  total_commission_krw INTEGER DEFAULT 0,

  -- 상위 제품
  top_products JSONB,                  -- [{product_id, clicks, conversions}]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(partner_id, date)
);

-- affiliate_daily_stats 인덱스
CREATE INDEX IF NOT EXISTS idx_affiliate_daily_stats_partner ON affiliate_daily_stats(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_daily_stats_date ON affiliate_daily_stats(date DESC);

-- affiliate_daily_stats 코멘트
COMMENT ON TABLE affiliate_daily_stats IS '어필리에이트 일별 통계 테이블';
COMMENT ON COLUMN affiliate_daily_stats.top_products IS 'JSON 형식의 상위 제품 목록';

-- ================================================
-- 5. updated_at 트리거
-- ================================================
-- affiliate_partners 트리거
DROP TRIGGER IF EXISTS update_affiliate_partners_updated_at ON affiliate_partners;
CREATE TRIGGER update_affiliate_partners_updated_at
  BEFORE UPDATE ON affiliate_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- affiliate_products 트리거
DROP TRIGGER IF EXISTS update_affiliate_products_updated_at ON affiliate_products;
CREATE TRIGGER update_affiliate_products_updated_at
  BEFORE UPDATE ON affiliate_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- affiliate_daily_stats 트리거
DROP TRIGGER IF EXISTS update_affiliate_daily_stats_updated_at ON affiliate_daily_stats;
CREATE TRIGGER update_affiliate_daily_stats_updated_at
  BEFORE UPDATE ON affiliate_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. RLS 정책
-- ================================================
ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_daily_stats ENABLE ROW LEVEL SECURITY;

-- affiliate_partners: 공개 읽기 (활성화된 것만)
DROP POLICY IF EXISTS "Public read active affiliate partners" ON affiliate_partners;
CREATE POLICY "Public read active affiliate partners"
  ON affiliate_partners FOR SELECT
  USING (is_active = true);

-- affiliate_partners: Service Role만 쓰기
DROP POLICY IF EXISTS "Service role full access affiliate partners" ON affiliate_partners;
CREATE POLICY "Service role full access affiliate partners"
  ON affiliate_partners FOR ALL
  USING (auth.role() = 'service_role');

-- affiliate_products: 공개 읽기 (활성화된 것만)
DROP POLICY IF EXISTS "Public read active affiliate products" ON affiliate_products;
CREATE POLICY "Public read active affiliate products"
  ON affiliate_products FOR SELECT
  USING (is_active = true);

-- affiliate_products: Service Role만 쓰기
DROP POLICY IF EXISTS "Service role full access affiliate products" ON affiliate_products;
CREATE POLICY "Service role full access affiliate products"
  ON affiliate_products FOR ALL
  USING (auth.role() = 'service_role');

-- affiliate_clicks: 본인 클릭만 읽기 (옵션)
DROP POLICY IF EXISTS "Users can read own clicks" ON affiliate_clicks;
CREATE POLICY "Users can read own clicks"
  ON affiliate_clicks FOR SELECT
  USING (
    clerk_user_id IS NULL
    OR clerk_user_id = (auth.jwt() ->> 'sub')
  );

-- affiliate_clicks: 인증된 사용자 INSERT
DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON affiliate_clicks;
CREATE POLICY "Authenticated users can insert clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- affiliate_clicks: Service Role 전체 접근
DROP POLICY IF EXISTS "Service role full access affiliate clicks" ON affiliate_clicks;
CREATE POLICY "Service role full access affiliate clicks"
  ON affiliate_clicks FOR ALL
  USING (auth.role() = 'service_role');

-- affiliate_daily_stats: Service Role만 접근
DROP POLICY IF EXISTS "Service role full access affiliate daily stats" ON affiliate_daily_stats;
CREATE POLICY "Service role full access affiliate daily stats"
  ON affiliate_daily_stats FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================
-- 7. 초기 파트너 데이터 (시드)
-- ================================================
INSERT INTO affiliate_partners (name, display_name, api_type, commission_rate_min, commission_rate_max, cookie_duration_days)
VALUES
  ('iherb', '아이허브', 'csv_feed', 5.00, 20.00, 7),
  ('coupang', '쿠팡', 'rest_api', 1.00, 3.00, 1),
  ('musinsa', '무신사', 'manual', 5.00, 10.00, NULL)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  api_type = EXCLUDED.api_type,
  commission_rate_min = EXCLUDED.commission_rate_min,
  commission_rate_max = EXCLUDED.commission_rate_max,
  cookie_duration_days = EXCLUDED.cookie_duration_days,
  updated_at = NOW();
