-- 제품 DB 테이블 (Phase A)
-- cosmetic_products, supplement_products, workout_equipment, health_foods

-- 화장품 테이블
CREATE TABLE IF NOT EXISTS cosmetic_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  price_krw INTEGER,
  original_price_krw INTEGER,
  discount_percent INTEGER,
  image_url TEXT,
  product_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 피부 관련
  skin_types TEXT[] DEFAULT '{}',
  concerns TEXT[] DEFAULT '{}',
  key_ingredients TEXT[] DEFAULT '{}',
  ingredients_full TEXT,

  -- 퍼스널컬러 관련
  personal_color_seasons TEXT[] DEFAULT '{}',

  -- 타겟
  target_age_groups TEXT[] DEFAULT '{}',
  target_gender TEXT,

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  source TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 영양제 테이블
CREATE TABLE IF NOT EXISTS supplement_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  price_krw INTEGER,
  image_url TEXT,
  product_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 영양 관련
  health_goals TEXT[] DEFAULT '{}',
  key_ingredients TEXT[] DEFAULT '{}',
  dosage TEXT,
  serving_size TEXT,

  -- 타겟
  target_age_groups TEXT[] DEFAULT '{}',
  target_gender TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 기구 테이블
CREATE TABLE IF NOT EXISTS workout_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  price_krw INTEGER,
  image_url TEXT,
  product_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 운동 관련
  target_muscles TEXT[] DEFAULT '{}',
  difficulty_level TEXT,
  space_required TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 건강 식품 테이블
CREATE TABLE IF NOT EXISTS health_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  price_krw INTEGER,
  image_url TEXT,
  product_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,

  -- 영양 정보
  calories_per_serving INTEGER,
  protein_per_serving DECIMAL(5,1),
  health_benefits TEXT[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_category ON cosmetic_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_brand ON cosmetic_products(brand);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_active ON cosmetic_products(is_active);
CREATE INDEX IF NOT EXISTS idx_supplement_products_category ON supplement_products(category);
CREATE INDEX IF NOT EXISTS idx_workout_equipment_category ON workout_equipment(category);
CREATE INDEX IF NOT EXISTS idx_health_foods_category ON health_foods(category);

-- RLS (공개 읽기)
ALTER TABLE cosmetic_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cosmetic products" ON cosmetic_products FOR SELECT USING (true);
CREATE POLICY "Anyone can view supplement products" ON supplement_products FOR SELECT USING (true);
CREATE POLICY "Anyone can view workout equipment" ON workout_equipment FOR SELECT USING (true);
CREATE POLICY "Anyone can view health foods" ON health_foods FOR SELECT USING (true);

-- 코멘트
COMMENT ON TABLE cosmetic_products IS '화장품 DB - 500+ 제품';
COMMENT ON TABLE supplement_products IS '영양제 DB - 200+ 제품';
COMMENT ON TABLE workout_equipment IS '운동 기구 DB - 50+ 제품';
COMMENT ON TABLE health_foods IS '건강 식품 DB - 100+ 제품';
