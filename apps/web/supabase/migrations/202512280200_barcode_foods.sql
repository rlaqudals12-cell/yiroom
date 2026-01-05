-- 바코드 식품 테이블
-- Phase I-1: 바코드 스캔 음식 입력 기능

CREATE TABLE IF NOT EXISTS barcode_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  serving_size DECIMAL(10,2),
  serving_unit VARCHAR(20) DEFAULT 'g',
  calories DECIMAL(10,2),
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fat DECIMAL(10,2),
  fiber DECIMAL(10,2),
  sodium DECIMAL(10,2),
  sugar DECIMAL(10,2),
  allergens TEXT[],
  category VARCHAR(50),
  image_url TEXT,
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api', 'crowdsourced'
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_barcode_foods_barcode ON barcode_foods(barcode);
-- Korean text search fallback to simple (Korean config may not exist on all Supabase instances)
CREATE INDEX IF NOT EXISTS idx_barcode_foods_name ON barcode_foods USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_barcode_foods_category ON barcode_foods(category);
CREATE INDEX IF NOT EXISTS idx_barcode_foods_brand ON barcode_foods(brand);

-- 사용자 바코드 스캔 이력
CREATE TABLE IF NOT EXISTS user_barcode_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  barcode_food_id UUID REFERENCES barcode_foods(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_barcode_history_user ON user_barcode_history(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_barcode_history_time ON user_barcode_history(clerk_user_id, scanned_at DESC);

-- RLS 활성화
ALTER TABLE barcode_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_barcode_history ENABLE ROW LEVEL SECURITY;

-- 바코드 식품은 모든 인증 사용자가 읽기 가능
CREATE POLICY "barcode_foods_read_policy" ON barcode_foods
  FOR SELECT USING (auth.jwt() IS NOT NULL);

-- 바코드 식품 등록은 모든 인증 사용자 가능 (크라우드소싱)
CREATE POLICY "barcode_foods_insert_policy" ON barcode_foods
  FOR INSERT WITH CHECK (auth.jwt() IS NOT NULL);

-- 스캔 이력은 본인만 접근
CREATE POLICY "user_barcode_history_select_policy" ON user_barcode_history
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_barcode_history_insert_policy" ON user_barcode_history
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "user_barcode_history_delete_policy" ON user_barcode_history
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 샘플 데이터 (한국 인기 식품)
INSERT INTO barcode_foods (barcode, name, brand, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sodium, sugar, category, verified)
VALUES
  ('8801234567890', '신라면', '농심', 120, 'g', 500, 10, 80, 16, 3, 1790, 4, '라면', true),
  ('8801234567891', '짜파게티', '농심', 140, 'g', 600, 12, 88, 22, 4, 1680, 8, '라면', true),
  ('8801111111111', '바나나맛 우유', '빙그레', 240, 'ml', 225, 6, 38, 5, 0, 130, 32, '유제품', true),
  ('8802222222222', '초코파이', '오리온', 39, 'g', 165, 2, 25, 7, 0.5, 60, 14, '과자', true),
  ('8803333333333', '하이트 진로', '하이트진로', 355, 'ml', 140, 0, 10, 0, 0, 10, 0, '음료', true),
  ('8804444444444', '삼다수', '제주삼다수', 500, 'ml', 0, 0, 0, 0, 0, 4, 0, '음료', true),
  ('8805555555555', '비비고 왕교자', 'CJ제일제당', 168, 'g', 280, 12, 32, 12, 2, 680, 3, '냉동식품', true),
  ('8806666666666', '후라이드 치킨', 'BBQ', 150, 'g', 420, 28, 15, 28, 1, 890, 2, '치킨', true),
  ('8807777777777', '불닭볶음면', '삼양', 140, 'g', 530, 10, 86, 16, 4, 1960, 6, '라면', true),
  ('8808888888888', '진라면 순한맛', '오뚜기', 120, 'g', 490, 9, 82, 14, 3, 1750, 3, '라면', true)
ON CONFLICT (barcode) DO NOTHING;

-- Updated at 트리거
CREATE OR REPLACE FUNCTION update_barcode_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_barcode_foods_updated_at ON barcode_foods;
CREATE TRIGGER trigger_barcode_foods_updated_at
  BEFORE UPDATE ON barcode_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_barcode_foods_updated_at();
