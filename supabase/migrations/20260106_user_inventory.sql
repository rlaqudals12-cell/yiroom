-- Migration: 통합 인벤토리 테이블
-- Purpose: 옷장, 화장대, 운동장비, 영양제, 냉장고 통합 관리
-- Date: 2026-01-05
-- Note: 기존 코드와 호환되는 단일 테이블 구조

-- ============================================================
-- Step 1: 통합 인벤토리 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 카테고리 정보
  category TEXT NOT NULL,  -- closet, beauty, equipment, supplement, pantry
  sub_category TEXT,

  -- 아이템 정보
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  original_image_url TEXT,

  -- 태그 및 즐겨찾기
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,

  -- 사용 통계
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- 유통기한 (식재료, 영양제, 뷰티용)
  expiry_date DATE,

  -- 메타데이터 (카테고리별 추가 정보)
  -- closet: { color: [], season: [], occasion: [], size: '' }
  -- beauty: { usageFrequency: '', openedAt: '' }
  -- equipment: { condition: '' }
  -- supplement: { dosage: '', frequency: '' }
  -- pantry: { quantity: '', unit: '', storageLocation: '' }
  metadata JSONB DEFAULT '{}',

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 카테고리 유효성 검사
  CONSTRAINT valid_category CHECK (
    category IN ('closet', 'beauty', 'equipment', 'supplement', 'pantry')
  )
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_category ON user_inventory(clerk_user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_inventory_sub_category ON user_inventory(clerk_user_id, category, sub_category);
CREATE INDEX IF NOT EXISTS idx_user_inventory_favorite ON user_inventory(clerk_user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_inventory_expiry ON user_inventory(clerk_user_id, expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_inventory_tags ON user_inventory USING GIN(tags);

-- ============================================================
-- Step 2: 저장된 코디 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 코디 정보
  name TEXT,
  description TEXT,
  item_ids UUID[] NOT NULL DEFAULT '{}',
  collage_image_url TEXT,

  -- 상황/계절
  occasion TEXT,  -- casual, formal, sports, home
  season TEXT[] DEFAULT '{}',  -- spring, summer, autumn, winter
  weather_condition TEXT,

  -- 착용 통계
  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user ON saved_outfits(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_occasion ON saved_outfits(clerk_user_id, occasion);

-- ============================================================
-- Step 3: RLS 정책
-- ============================================================

-- User Inventory RLS
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own inventory" ON user_inventory;
CREATE POLICY "Users can manage own inventory"
  ON user_inventory FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Saved Outfits RLS
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own outfits" ON saved_outfits;
CREATE POLICY "Users can manage own outfits"
  ON saved_outfits FOR ALL
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- Step 4: 권한 부여
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE saved_outfits TO authenticated;

GRANT ALL ON TABLE user_inventory TO service_role;
GRANT ALL ON TABLE saved_outfits TO service_role;

-- ============================================================
-- Step 5: 코멘트
-- ============================================================
COMMENT ON TABLE user_inventory IS '통합 인벤토리 - 옷장/화장대/운동장비/영양제/냉장고';
COMMENT ON COLUMN user_inventory.category IS '카테고리: closet, beauty, equipment, supplement, pantry';
COMMENT ON COLUMN user_inventory.metadata IS '카테고리별 추가 정보 (JSONB)';
COMMENT ON TABLE saved_outfits IS '저장된 코디 - 의류 조합';
