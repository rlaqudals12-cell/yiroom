-- Product DB v1: 화장품 + 영양제 테이블
-- 버전: 1.0
-- 작성일: 2025-12-04
-- 목적: 제품 추천 시스템을 위한 기본 제품 DB

-- ================================================
-- 1. cosmetic_products (화장품 테이블)
-- ================================================
CREATE TABLE IF NOT EXISTS cosmetic_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- cleanser, toner, serum, moisturizer, sunscreen, mask, makeup
  subcategory TEXT, -- 세부 카테고리 (예: lip, eye, foundation)
  price_range TEXT CHECK (price_range IN ('budget', 'mid', 'premium')),
  price_krw INTEGER, -- 실제 가격 (원)

  -- 피부 타입 적합도
  skin_types TEXT[], -- dry, oily, combination, sensitive, normal
  concerns TEXT[], -- acne, aging, whitening, hydration, pore, redness

  -- 성분 정보
  key_ingredients TEXT[],
  avoid_ingredients TEXT[], -- 피해야 할 성분

  -- 퍼스널 컬러 (메이크업용)
  personal_color_seasons TEXT[], -- Spring, Summer, Autumn, Winter

  -- 메타데이터
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,

  -- 활성화 상태
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- cosmetic_products 인덱스
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_category ON cosmetic_products(category);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_brand ON cosmetic_products(brand);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_skin_types ON cosmetic_products USING GIN(skin_types);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_concerns ON cosmetic_products USING GIN(concerns);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_pc_seasons ON cosmetic_products USING GIN(personal_color_seasons);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_is_active ON cosmetic_products(is_active) WHERE is_active = true;

-- cosmetic_products 코멘트
COMMENT ON TABLE cosmetic_products IS '화장품 제품 DB (스킨케어 + 메이크업)';
COMMENT ON COLUMN cosmetic_products.category IS '제품 카테고리: cleanser, toner, serum, moisturizer, sunscreen, mask, makeup';
COMMENT ON COLUMN cosmetic_products.skin_types IS '적합 피부 타입: dry, oily, combination, sensitive, normal';
COMMENT ON COLUMN cosmetic_products.concerns IS '타겟 피부 고민: acne, aging, whitening, hydration, pore, redness';
COMMENT ON COLUMN cosmetic_products.personal_color_seasons IS '적합 퍼스널 컬러 (메이크업): Spring, Summer, Autumn, Winter';

-- ================================================
-- 2. supplement_products (영양제 테이블)
-- ================================================
CREATE TABLE IF NOT EXISTS supplement_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL, -- vitamin, mineral, protein, omega, probiotic, collagen, other

  -- 효능
  benefits TEXT[], -- skin, hair, energy, immunity, digestion, sleep, muscle, bone

  -- 성분 정보
  main_ingredients JSONB, -- [{name: string, amount: number, unit: string}]

  -- 권장 대상
  target_concerns TEXT[], -- 피부건조, 탈모, 피로, 소화불량, 수면장애, 근육통

  -- 메타데이터
  price_krw INTEGER,
  dosage TEXT, -- 예: '1일 1정', '1일 2캡슐'
  serving_size INTEGER, -- 1회 섭취량 (정/캡슐 수)
  total_servings INTEGER, -- 총 제공량
  image_url TEXT,
  purchase_url TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,

  -- 주의사항
  warnings TEXT[], -- 임산부 주의, 알레르기 성분 등

  -- 활성화 상태
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- supplement_products 인덱스
CREATE INDEX IF NOT EXISTS idx_supplement_products_category ON supplement_products(category);
CREATE INDEX IF NOT EXISTS idx_supplement_products_brand ON supplement_products(brand);
CREATE INDEX IF NOT EXISTS idx_supplement_products_benefits ON supplement_products USING GIN(benefits);
CREATE INDEX IF NOT EXISTS idx_supplement_products_target_concerns ON supplement_products USING GIN(target_concerns);
CREATE INDEX IF NOT EXISTS idx_supplement_products_is_active ON supplement_products(is_active) WHERE is_active = true;

-- supplement_products 코멘트
COMMENT ON TABLE supplement_products IS '영양제/건강기능식품 제품 DB';
COMMENT ON COLUMN supplement_products.category IS '제품 카테고리: vitamin, mineral, protein, omega, probiotic, collagen, other';
COMMENT ON COLUMN supplement_products.benefits IS '효능: skin, hair, energy, immunity, digestion, sleep, muscle, bone';
COMMENT ON COLUMN supplement_products.main_ingredients IS '주요 성분 JSON: [{name, amount, unit}]';
COMMENT ON COLUMN supplement_products.target_concerns IS '권장 대상 고민';

-- ================================================
-- 3. updated_at 트리거
-- ================================================
-- 트리거 함수 (이미 존재할 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- cosmetic_products 트리거
DROP TRIGGER IF EXISTS update_cosmetic_products_updated_at ON cosmetic_products;
CREATE TRIGGER update_cosmetic_products_updated_at
  BEFORE UPDATE ON cosmetic_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- supplement_products 트리거
DROP TRIGGER IF EXISTS update_supplement_products_updated_at ON supplement_products;
CREATE TRIGGER update_supplement_products_updated_at
  BEFORE UPDATE ON supplement_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. RLS 정책 (공개 읽기, 관리자만 쓰기)
-- ================================================
ALTER TABLE cosmetic_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_products ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (활성화된 제품만)
DROP POLICY IF EXISTS "Public read active cosmetic products" ON cosmetic_products;
CREATE POLICY "Public read active cosmetic products"
  ON cosmetic_products FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read active supplement products" ON supplement_products;
CREATE POLICY "Public read active supplement products"
  ON supplement_products FOR SELECT
  USING (is_active = true);

-- Service Role만 쓰기 허용 (관리자 작업용)
DROP POLICY IF EXISTS "Service role full access cosmetic" ON cosmetic_products;
CREATE POLICY "Service role full access cosmetic"
  ON cosmetic_products FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access supplement" ON supplement_products;
CREATE POLICY "Service role full access supplement"
  ON supplement_products FOR ALL
  USING (auth.role() = 'service_role');
