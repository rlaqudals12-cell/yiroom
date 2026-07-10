-- Migration: 옷장/인벤토리 저장 근본 수리 (user_inventory + inventory-images 버킷)
-- Purpose:
--   웹 옷장 "옷 추가하기"·"옷 한 번에 등록하기" 저장 전멸 수리.
--   저장 경로 = POST /api/inventory → createInventoryItem → INSERT user_inventory,
--   이미지 = POST /api/inventory/upload → storage 버킷 'inventory-images'.
--   prod에는 user_inventory 테이블과 inventory-images 버킷이 부재하여
--   업로드 또는 insert가 항상 실패했다(단일=alert "저장 중 오류", 일괄=아이템별 빨간 에러).
-- Date: 2026-07-11
-- Author: Claude Code
-- Note: prod RLS 구패턴(auth.jwt()->>'sub') 정합 — auth.get_user_id() 없음.
--       전 구간 멱등(IF NOT EXISTS / DROP ... IF EXISTS) — 재실행·부분적용 안전.
-- Rollback:
--   DROP TABLE IF EXISTS user_inventory CASCADE;
--   DROP TABLE IF EXISTS saved_outfits CASCADE;
--   DELETE FROM storage.buckets WHERE id = 'inventory-images';

-- ============================================================
-- Step 0: updated_at 자동 갱신 트리거 함수 (멱등)
-- ============================================================
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Step 1: 통합 인벤토리 테이블 (옷장/화장대/운동장비/영양제/냉장고)
--   컬럼 전집 = lib/inventory/repository.ts insert/select + types/inventory.ts InventoryItemDB
-- ============================================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 카테고리 (closet: 옷장, beauty: 화장대, equipment: 운동장비, supplement: 영양제, pantry: 냉장고)
  category TEXT NOT NULL CHECK (category IN ('closet', 'beauty', 'equipment', 'supplement', 'pantry')),
  sub_category TEXT,

  -- 기본 정보 (image_url은 방어적으로 nullable — 업로드는 항상 URL을 반환하지만
  --  향후 호출자가 이미지 없이 등록해도 저장이 막히지 않도록)
  name TEXT NOT NULL,
  image_url TEXT,
  original_image_url TEXT,

  -- 공통 필드
  brand TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expiry_date DATE,

  -- 메타데이터 (카테고리별 상이)
  --   closet: { color: [], season: [], occasion: [], pattern, material, size }
  --   beauty: { skinType, ingredients: [], openedAt, expiresInMonths }
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_inventory_user
  ON user_inventory(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_category
  ON user_inventory(clerk_user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_inventory_sub_category
  ON user_inventory(clerk_user_id, category, sub_category);
CREATE INDEX IF NOT EXISTS idx_user_inventory_favorite
  ON user_inventory(clerk_user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_inventory_expiry
  ON user_inventory(clerk_user_id, expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_inventory_tags
  ON user_inventory USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_inventory_metadata
  ON user_inventory USING GIN(metadata);

-- updated_at 트리거
DROP TRIGGER IF EXISTS inventory_updated_at ON user_inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

-- RLS (prod 구패턴 auth.jwt()->>'sub')
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_select_own" ON user_inventory;
CREATE POLICY "inventory_select_own" ON user_inventory
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "inventory_insert_own" ON user_inventory;
CREATE POLICY "inventory_insert_own" ON user_inventory
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "inventory_update_own" ON user_inventory;
CREATE POLICY "inventory_update_own" ON user_inventory
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "inventory_delete_own" ON user_inventory;
CREATE POLICY "inventory_delete_own" ON user_inventory
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_inventory TO authenticated;
GRANT ALL ON TABLE user_inventory TO service_role;

COMMENT ON TABLE user_inventory IS '통합 인벤토리 - 옷장/화장대/운동장비/영양제/냉장고 (closet=옷장 저장 정본)';
COMMENT ON COLUMN user_inventory.metadata IS '카테고리별 추가 정보 (closet: color/season/occasion/pattern)';

-- ============================================================
-- Step 2: 저장된 코디 테이블 (멱등 — prod에 이미 존재할 수 있음)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  name TEXT,
  description TEXT,
  item_ids UUID[] NOT NULL DEFAULT '{}',
  collage_image_url TEXT,

  occasion TEXT,
  season TEXT[] DEFAULT '{}',
  weather_condition TEXT,

  wear_count INTEGER DEFAULT 0,
  last_worn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_outfits_user
  ON saved_outfits(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_occasion
  ON saved_outfits(clerk_user_id, occasion);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_item_ids
  ON saved_outfits USING GIN(item_ids);

DROP TRIGGER IF EXISTS outfits_updated_at ON saved_outfits;
CREATE TRIGGER outfits_updated_at
  BEFORE UPDATE ON saved_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outfits_select_own" ON saved_outfits;
CREATE POLICY "outfits_select_own" ON saved_outfits
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "outfits_insert_own" ON saved_outfits;
CREATE POLICY "outfits_insert_own" ON saved_outfits
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "outfits_update_own" ON saved_outfits;
CREATE POLICY "outfits_update_own" ON saved_outfits
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "outfits_delete_own" ON saved_outfits;
CREATE POLICY "outfits_delete_own" ON saved_outfits
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE saved_outfits TO authenticated;
GRANT ALL ON TABLE saved_outfits TO service_role;

-- ============================================================
-- Step 3: Storage 버킷 'inventory-images' (공개 — getPublicUrl 사용)
--   경로 규약: ${userId}/${category}/${itemId}_${type}.png
--   (참조: 20260710_user_twins.sql 버킷 패턴, 202601080500 분석 버킷 RLS 패턴)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-images',
  'inventory-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 쓰기(INSERT/UPDATE/DELETE)는 본인 폴더에만. 읽기는 공개 버킷이라 getPublicUrl로 열림.
-- upsert:true 업로드는 INSERT + UPDATE 둘 다 필요.
DROP POLICY IF EXISTS "Users can upload inventory images" ON storage.objects;
CREATE POLICY "Users can upload inventory images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inventory-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
);

DROP POLICY IF EXISTS "Users can update own inventory images" ON storage.objects;
CREATE POLICY "Users can update own inventory images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inventory-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
);

DROP POLICY IF EXISTS "Users can view own inventory images" ON storage.objects;
CREATE POLICY "Users can view own inventory images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inventory-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
);

DROP POLICY IF EXISTS "Users can delete own inventory images" ON storage.objects;
CREATE POLICY "Users can delete own inventory images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inventory-images' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
);
