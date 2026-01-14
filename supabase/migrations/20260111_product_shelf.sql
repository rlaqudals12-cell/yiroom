-- 제품함 테이블 (F-4: 제품 스캔 기능)
-- 사용자가 스캔한 제품을 저장하고 관리

CREATE TABLE user_product_shelf (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,

  -- 제품 정보 (cosmetic_products FK는 프로덕션에서만 적용)
  product_id UUID,
  product_name TEXT NOT NULL,
  product_brand TEXT,
  product_barcode TEXT,
  product_image_url TEXT,
  product_ingredients JSONB DEFAULT '[]',

  -- 스캔 정보
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  scan_method TEXT CHECK (scan_method IN ('barcode', 'ocr', 'search', 'manual')),

  -- 분석 결과
  compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  analysis_result JSONB,

  -- 사용자 관리
  status TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned', 'wishlist', 'used_up', 'archived')),
  user_note TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- 날짜 관리
  purchased_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_user_product_shelf_user ON user_product_shelf(clerk_user_id);
CREATE INDEX idx_user_product_shelf_barcode ON user_product_shelf(product_barcode);
CREATE INDEX idx_user_product_shelf_status ON user_product_shelf(clerk_user_id, status);
CREATE INDEX idx_user_product_shelf_scanned ON user_product_shelf(clerk_user_id, scanned_at DESC);

-- RLS 정책
ALTER TABLE user_product_shelf ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 데이터만 조회 가능
CREATE POLICY "Users can view own shelf items"
  ON user_product_shelf FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 사용자 본인 데이터만 추가 가능
CREATE POLICY "Users can insert own shelf items"
  ON user_product_shelf FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 사용자 본인 데이터만 수정 가능
CREATE POLICY "Users can update own shelf items"
  ON user_product_shelf FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- 사용자 본인 데이터만 삭제 가능
CREATE POLICY "Users can delete own shelf items"
  ON user_product_shelf FOR DELETE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_user_product_shelf_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_product_shelf_updated_at
  BEFORE UPDATE ON user_product_shelf
  FOR EACH ROW
  EXECUTE FUNCTION update_user_product_shelf_updated_at();

-- 코멘트
COMMENT ON TABLE user_product_shelf IS '사용자 제품함 - 스캔한 제품 관리';
COMMENT ON COLUMN user_product_shelf.scan_method IS 'barcode: 바코드 스캔, ocr: 성분 OCR, search: 검색, manual: 수동 입력';
COMMENT ON COLUMN user_product_shelf.status IS 'owned: 보유 중, wishlist: 위시리스트, used_up: 다 씀, archived: 보관';
COMMENT ON COLUMN user_product_shelf.compatibility_score IS '피부 호환성 점수 (0-100)';
