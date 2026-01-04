-- 화장품 성분 데이터베이스 마이그레이션
-- EWG 안전성 등급, 주의 성분, 알레르기 유발 성분 정보 포함

-- =============================================================================
-- 테이블 1: cosmetic_ingredients (화장품 성분 정보)
-- =============================================================================
CREATE TABLE cosmetic_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 성분 이름 (다국어)
  name_ko TEXT NOT NULL,                    -- 한국어 이름
  name_en TEXT,                             -- 영어 이름
  name_inci TEXT,                           -- INCI 표준명 (International Nomenclature of Cosmetic Ingredients)
  aliases TEXT[],                           -- 별칭/다른 이름들

  -- EWG 안전성 등급 (1: 가장 안전, 10: 가장 위험)
  ewg_score INTEGER CHECK (ewg_score BETWEEN 1 AND 10),
  ewg_data_availability TEXT CHECK (ewg_data_availability IN ('none', 'limited', 'fair', 'good', 'robust')),

  -- 분류
  category TEXT NOT NULL,                   -- 카테고리 (보습제, 계면활성제, 방부제 등)
  functions TEXT[],                         -- 기능 (보습, 세정, 유화 등)

  -- 주의 성분 플래그
  is_caution_20 BOOLEAN DEFAULT FALSE,      -- 20대 주의 성분 여부
  is_allergen BOOLEAN DEFAULT FALSE,        -- 알레르기 유발 성분 여부
  allergen_type TEXT,                       -- 알레르기 유형 (향료, 방부제 등)

  -- 피부 타입별 주의사항 (JSONB)
  -- 예: {"oily": "recommended", "sensitive": "caution"}
  skin_type_caution JSONB DEFAULT '{}',

  -- 상세 정보
  description TEXT,                         -- 성분 설명
  benefits TEXT[],                          -- 효능/장점
  concerns TEXT[],                          -- 우려 사항
  source TEXT,                              -- 출처/참고 자료

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 코멘트
COMMENT ON TABLE cosmetic_ingredients IS '화장품 성분 정보 테이블 - EWG 등급, 주의 성분, 알레르기 정보 포함';
COMMENT ON COLUMN cosmetic_ingredients.ewg_score IS 'EWG 안전성 등급 (1-2: 안전, 3-6: 보통, 7-10: 위험)';
COMMENT ON COLUMN cosmetic_ingredients.is_caution_20 IS '20대 주의 성분 여부';
COMMENT ON COLUMN cosmetic_ingredients.skin_type_caution IS '피부 타입별 주의사항 JSON (oily, dry, sensitive, combination, normal)';

-- =============================================================================
-- 테이블 2: cosmetic_product_ingredients (제품-성분 매핑)
-- =============================================================================
CREATE TABLE cosmetic_product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 외래 키
  product_id UUID NOT NULL REFERENCES cosmetic_products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES cosmetic_ingredients(id) ON DELETE CASCADE,

  -- 성분 정보
  order_index INTEGER,                      -- 성분 순서 (함량 순)
  purpose TEXT,                             -- 이 제품에서의 역할
  concentration_level TEXT,                 -- 농도 수준 (high, medium, low, trace)

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제품당 성분 중복 방지
  UNIQUE(product_id, ingredient_id)
);

-- 테이블 코멘트
COMMENT ON TABLE cosmetic_product_ingredients IS '화장품 제품과 성분 간의 매핑 테이블';
COMMENT ON COLUMN cosmetic_product_ingredients.order_index IS '성분표 순서 (일반적으로 함량 순)';
COMMENT ON COLUMN cosmetic_product_ingredients.concentration_level IS '농도 수준: high(>5%), medium(1-5%), low(<1%), trace(미량)';

-- =============================================================================
-- 인덱스
-- =============================================================================

-- cosmetic_ingredients 인덱스
CREATE INDEX idx_cosmetic_ingredients_name_ko ON cosmetic_ingredients(name_ko);
CREATE INDEX idx_cosmetic_ingredients_name_en ON cosmetic_ingredients(name_en);
CREATE INDEX idx_cosmetic_ingredients_ewg_score ON cosmetic_ingredients(ewg_score);
CREATE INDEX idx_cosmetic_ingredients_category ON cosmetic_ingredients(category);
CREATE INDEX idx_cosmetic_ingredients_is_caution_20 ON cosmetic_ingredients(is_caution_20) WHERE is_caution_20 = TRUE;
CREATE INDEX idx_cosmetic_ingredients_is_allergen ON cosmetic_ingredients(is_allergen) WHERE is_allergen = TRUE;

-- cosmetic_product_ingredients 인덱스
CREATE INDEX idx_cosmetic_product_ingredients_product_id ON cosmetic_product_ingredients(product_id);
CREATE INDEX idx_cosmetic_product_ingredients_ingredient_id ON cosmetic_product_ingredients(ingredient_id);

-- =============================================================================
-- RLS 정책 (Row Level Security)
-- =============================================================================

-- cosmetic_ingredients: 공개 읽기 (성분 정보는 누구나 조회 가능)
ALTER TABLE cosmetic_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cosmetic_ingredients_public_read"
  ON cosmetic_ingredients
  FOR SELECT
  TO public
  USING (true);

-- cosmetic_product_ingredients: 공개 읽기 (제품-성분 매핑도 누구나 조회 가능)
ALTER TABLE cosmetic_product_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cosmetic_product_ingredients_public_read"
  ON cosmetic_product_ingredients
  FOR SELECT
  TO public
  USING (true);

-- =============================================================================
-- 트리거: updated_at 자동 갱신
-- =============================================================================

-- updated_at 자동 갱신 함수 (이미 존재하면 생성 생략)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- cosmetic_ingredients 테이블에 트리거 적용
CREATE TRIGGER trigger_cosmetic_ingredients_updated_at
  BEFORE UPDATE ON cosmetic_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
