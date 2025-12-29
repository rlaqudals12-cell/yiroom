-- 인벤토리 시스템 테이블 (내 옷장, 내 뷰티, 내 냉장고 등)
-- Phase I-2: 내 인벤토리 시스템

-- 통합 인벤토리 테이블
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 카테고리 (closet: 옷장, beauty: 화장품, equipment: 운동장비, supplement: 영양제, pantry: 냉장고)
  category TEXT NOT NULL CHECK (category IN ('closet', 'beauty', 'equipment', 'supplement', 'pantry')),
  sub_category TEXT,

  -- 기본 정보
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  original_image_url TEXT,

  -- 메타데이터 (카테고리별 상이)
  -- closet: {color: [], pattern, material, season: [], occasion: [], size, purchaseDate, price}
  -- beauty: {skinType, ingredients: [], openedAt, expiresInMonths}
  -- equipment: {exerciseType, weight, condition}
  -- supplement: {dosage, frequency, ingredients: []}
  -- pantry: {unit, quantity, storageType}
  metadata JSONB DEFAULT '{}',

  -- 공통 필드
  brand TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expiry_date DATE,  -- 화장품, 식품용

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory"
  ON user_inventory
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own inventory"
  ON user_inventory
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own inventory"
  ON user_inventory
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own inventory"
  ON user_inventory
  FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_inventory_user_category
  ON user_inventory(clerk_user_id, category);
CREATE INDEX idx_inventory_sub_category
  ON user_inventory(clerk_user_id, category, sub_category);
CREATE INDEX idx_inventory_tags
  ON user_inventory USING GIN(tags);
CREATE INDEX idx_inventory_favorite
  ON user_inventory(clerk_user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_inventory_metadata
  ON user_inventory USING GIN(metadata);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- 저장된 코디 테이블
CREATE TABLE IF NOT EXISTS saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  name TEXT,
  description TEXT,

  -- 구성 아이템 ID 배열
  item_ids UUID[] NOT NULL,

  -- 생성된 콜라주 이미지
  collage_image_url TEXT,

  -- 메타데이터
  occasion TEXT CHECK (occasion IN ('casual', 'formal', 'workout', 'date', 'travel')),
  season TEXT[],  -- ['spring', 'summer', 'autumn', 'winter']
  weather_condition TEXT,  -- 어떤 날씨에 적합한지 (예: "cool_dry", "warm_humid")

  -- 통계
  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfits"
  ON saved_outfits
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own outfits"
  ON saved_outfits
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own outfits"
  ON saved_outfits
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own outfits"
  ON saved_outfits
  FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_outfits_user
  ON saved_outfits(clerk_user_id);
CREATE INDEX idx_outfits_occasion
  ON saved_outfits(clerk_user_id, occasion);
CREATE INDEX idx_outfits_item_ids
  ON saved_outfits USING GIN(item_ids);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER outfits_updated_at
  BEFORE UPDATE ON saved_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- Storage 버킷은 Supabase 대시보드에서 수동 생성 필요:
-- 버킷명: inventory-images
-- Public: true
-- MIME types: image/png, image/jpeg, image/webp
