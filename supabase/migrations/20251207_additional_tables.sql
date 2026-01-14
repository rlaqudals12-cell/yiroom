-- 추가 기능 테이블
-- affiliate, skin_diary, nutrition_streaks, smart_notifications, etc.

-- 어필리에이트 제품 테이블
CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  image_url TEXT,
  price_krw INTEGER,
  commission_rate DECIMAL(5,2),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 어필리에이트 클릭 테이블
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT,
  product_id UUID REFERENCES affiliate_products(id) ON DELETE SET NULL,
  partner_id TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_amount INTEGER
);

-- 피부 일기 테이블
CREATE TABLE IF NOT EXISTS skin_diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  skin_condition INTEGER CHECK (skin_condition >= 1 AND skin_condition <= 5),
  hydration_level INTEGER CHECK (hydration_level >= 1 AND hydration_level <= 5),
  oiliness_level INTEGER CHECK (oiliness_level >= 1 AND oiliness_level <= 5),
  concerns TEXT[] DEFAULT '{}',
  products_used TEXT[] DEFAULT '{}',
  notes TEXT,
  image_url TEXT,
  weather TEXT,
  sleep_hours DECIMAL(3,1),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 영양 스트릭 테이블
CREATE TABLE IF NOT EXISTS nutrition_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_record_date DATE,
  total_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 스마트 알림 테이블
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메이크업 분석 테이블
CREATE TABLE IF NOT EXISTS makeup_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  personal_color_id UUID,
  skin_analysis_id UUID,
  makeup_style TEXT,
  color_recommendations JSONB DEFAULT '{}',
  product_recommendations JSONB DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 사이즈 히스토리
CREATE TABLE IF NOT EXISTS user_size_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  recorded_date DATE DEFAULT CURRENT_DATE,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hip_cm DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 쇼핑 선호도
CREATE TABLE IF NOT EXISTS user_shopping_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  budget_range TEXT,
  preferred_brands TEXT[] DEFAULT '{}',
  avoided_brands TEXT[] DEFAULT '{}',
  preferred_stores TEXT[] DEFAULT '{}',
  style_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 가격 알림 테이블
CREATE TABLE IF NOT EXISTS price_watches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  target_price INTEGER,
  current_price INTEGER,
  is_active BOOLEAN DEFAULT true,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제품 리뷰 테이블
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  would_recommend BOOLEAN,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_affiliate_products_partner ON affiliate_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_skin_diary_user_date ON skin_diary_entries(clerk_user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_streaks_user ON nutrition_streaks(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_user ON smart_notifications(clerk_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_makeup_analyses_user ON makeup_analyses(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_size_history_user ON user_size_history(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_price_watches_user ON price_watches(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_type, product_id);

-- RLS 정책
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_size_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shopping_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- affiliate_products (공개)
CREATE POLICY "Anyone can view affiliate products" ON affiliate_products FOR SELECT USING (true);

-- affiliate_clicks
CREATE POLICY "Users can view own clicks" ON affiliate_clicks FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert clicks" ON affiliate_clicks FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- skin_diary_entries
CREATE POLICY "Users can view own diary" ON skin_diary_entries FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert diary" ON skin_diary_entries FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update diary" ON skin_diary_entries FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete diary" ON skin_diary_entries FOR DELETE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- nutrition_streaks
CREATE POLICY "Users can view own streaks" ON nutrition_streaks FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert streaks" ON nutrition_streaks FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update streaks" ON nutrition_streaks FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- smart_notifications
CREATE POLICY "Users can view own notifications" ON smart_notifications FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own notifications" ON smart_notifications FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- makeup_analyses
CREATE POLICY "Users can view own makeup analyses" ON makeup_analyses FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert makeup analyses" ON makeup_analyses FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- user_size_history
CREATE POLICY "Users can view own size history" ON user_size_history FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert size history" ON user_size_history FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- user_shopping_preferences
CREATE POLICY "Users can view own shopping prefs" ON user_shopping_preferences FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert shopping prefs" ON user_shopping_preferences FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update shopping prefs" ON user_shopping_preferences FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- price_watches
CREATE POLICY "Users can view own watches" ON price_watches FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert watches" ON price_watches FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update watches" ON price_watches FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete watches" ON price_watches FOR DELETE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- product_reviews
CREATE POLICY "Anyone can view reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON product_reviews FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 코멘트
COMMENT ON TABLE affiliate_products IS '어필리에이트 제품';
COMMENT ON TABLE affiliate_clicks IS '어필리에이트 클릭 추적';
COMMENT ON TABLE skin_diary_entries IS '피부 일기';
COMMENT ON TABLE nutrition_streaks IS '영양 연속 기록';
COMMENT ON TABLE smart_notifications IS '스마트 알림';
COMMENT ON TABLE makeup_analyses IS '메이크업 분석';
COMMENT ON TABLE user_size_history IS '신체 사이즈 기록';
COMMENT ON TABLE user_shopping_preferences IS '쇼핑 선호도';
COMMENT ON TABLE price_watches IS '가격 알림';
COMMENT ON TABLE product_reviews IS '제품 리뷰';
