-- Migration: 인벤토리 테이블 (5개 카테고리)
-- Purpose: 옷장, 화장대, 운동장비, 영양제, 냉장고 인벤토리 관리
-- Date: 2026-01-06

-- ============================================================
-- Step 1: 뷰티 인벤토리 (화장대)
-- ============================================================
CREATE TABLE IF NOT EXISTS beauty_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 제품 정보
  product_id UUID,  -- 기존 제품 연결 (선택)
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,  -- skincare, makeup, haircare, bodycare, fragrance
  image_url TEXT,

  -- 사용 정보
  opened_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  usage_frequency TEXT CHECK (usage_frequency IN ('daily', 'weekly', 'monthly', 'rarely')),
  is_favorite BOOLEAN DEFAULT FALSE,

  -- 메타데이터
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_beauty_inventory_user ON beauty_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_beauty_inventory_category ON beauty_inventory(clerk_user_id, category);
CREATE INDEX IF NOT EXISTS idx_beauty_inventory_expires ON beauty_inventory(clerk_user_id, expires_at);

-- ============================================================
-- Step 2: 식재료 인벤토리 (냉장고)
-- ============================================================
CREATE TABLE IF NOT EXISTS pantry_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 식재료 정보
  name TEXT NOT NULL,
  category TEXT NOT NULL,  -- vegetable, fruit, meat, seafood, dairy, grain, beverage, sauce, other
  image_url TEXT,

  -- 수량 및 유통기한
  quantity NUMERIC,
  unit TEXT,  -- g, kg, ml, L, 개, 팩
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  storage_location TEXT CHECK (storage_location IN ('fridge', 'freezer', 'pantry')),

  -- 메타데이터
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pantry_inventory_user ON pantry_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_inventory_expires ON pantry_inventory(clerk_user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_pantry_inventory_category ON pantry_inventory(clerk_user_id, category);

-- ============================================================
-- Step 3: 운동 장비 인벤토리
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 장비 정보
  product_id UUID,  -- 기존 제품 연결 (선택)
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,  -- cardio, strength, flexibility, recovery, wearable
  image_url TEXT,

  -- 상태 정보
  purchased_at TIMESTAMPTZ,
  condition TEXT CHECK (condition IN ('new', 'good', 'worn', 'broken')),
  last_used_at TIMESTAMPTZ,

  -- 메타데이터
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_user ON equipment_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_category ON equipment_inventory(clerk_user_id, category);

-- ============================================================
-- Step 4: 영양제 인벤토리
-- ============================================================
CREATE TABLE IF NOT EXISTS supplement_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 제품 정보
  product_id UUID,  -- 기존 제품 연결 (선택)
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,  -- vitamin, mineral, protein, omega, probiotic, herbal, other
  image_url TEXT,

  -- 복용 정보
  dosage TEXT,  -- 1정, 2캡슐
  frequency TEXT,  -- daily, twice_daily, weekly
  time_of_day TEXT[],  -- ['morning', 'evening']
  expires_at TIMESTAMPTZ,
  quantity_remaining INTEGER,

  -- 메타데이터
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_supplement_inventory_user ON supplement_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_supplement_inventory_expires ON supplement_inventory(clerk_user_id, expires_at);

-- ============================================================
-- Step 5: 의류 인벤토리 (옷장)
-- ============================================================
CREATE TABLE IF NOT EXISTS closet_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 의류 정보
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,  -- top, bottom, outer, dress, shoes, bag, accessory
  sub_category TEXT,  -- 티셔츠, 셔츠, 니트, 블라우스 등
  image_url TEXT,

  -- 스타일 정보
  colors TEXT[],  -- ['black', 'white']
  season TEXT[],  -- ['spring', 'summer', 'fall', 'winter']
  occasion TEXT[],  -- ['casual', 'formal', 'sports', 'home']
  size TEXT,

  -- 퍼스널컬러 매칭
  personal_color_match BOOLEAN,

  -- 상태 정보
  purchased_at TIMESTAMPTZ,
  condition TEXT CHECK (condition IN ('new', 'good', 'worn', 'damaged')),
  last_worn_at TIMESTAMPTZ,
  wear_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,

  -- 메타데이터
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_closet_inventory_user ON closet_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_closet_inventory_category ON closet_inventory(clerk_user_id, category);
CREATE INDEX IF NOT EXISTS idx_closet_inventory_colors ON closet_inventory USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_closet_inventory_season ON closet_inventory USING GIN(season);

-- ============================================================
-- Step 6: RLS 정책
-- ============================================================

-- Beauty Inventory
ALTER TABLE beauty_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own beauty inventory" ON beauty_inventory;
CREATE POLICY "Users can manage own beauty inventory"
  ON beauty_inventory FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Pantry Inventory
ALTER TABLE pantry_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pantry inventory" ON pantry_inventory;
CREATE POLICY "Users can manage own pantry inventory"
  ON pantry_inventory FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Equipment Inventory
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own equipment inventory" ON equipment_inventory;
CREATE POLICY "Users can manage own equipment inventory"
  ON equipment_inventory FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Supplement Inventory
ALTER TABLE supplement_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own supplement inventory" ON supplement_inventory;
CREATE POLICY "Users can manage own supplement inventory"
  ON supplement_inventory FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Closet Inventory
ALTER TABLE closet_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own closet inventory" ON closet_inventory;
CREATE POLICY "Users can manage own closet inventory"
  ON closet_inventory FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- Step 7: 권한 부여
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE beauty_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pantry_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE equipment_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE supplement_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE closet_inventory TO authenticated;

GRANT ALL ON TABLE beauty_inventory TO service_role;
GRANT ALL ON TABLE pantry_inventory TO service_role;
GRANT ALL ON TABLE equipment_inventory TO service_role;
GRANT ALL ON TABLE supplement_inventory TO service_role;
GRANT ALL ON TABLE closet_inventory TO service_role;

-- ============================================================
-- Step 8: 코멘트
-- ============================================================
COMMENT ON TABLE beauty_inventory IS '화장대 인벤토리 - 스킨케어, 메이크업 등';
COMMENT ON TABLE pantry_inventory IS '냉장고 인벤토리 - 식재료, 유통기한 관리';
COMMENT ON TABLE equipment_inventory IS '운동장비 인벤토리 - 덤벨, 요가매트 등';
COMMENT ON TABLE supplement_inventory IS '영양제 인벤토리 - 비타민, 프로틴 등';
COMMENT ON TABLE closet_inventory IS '옷장 인벤토리 - 의류, 신발, 액세서리';
