-- Migration: H-1/M-1 어필리에이트 제품 매칭 컬럼 추가
-- Purpose: 헤어케어(H-1) 및 메이크업(M-1) 분석 결과 기반 제품 추천 지원
-- Date: 2026-02-10
-- Author: Claude Code
-- ADR: ADR-067-affiliate-partner-api-strategy.md
-- Spec: SDD-AFFILIATE-INTEGRATION.md v2.0
-- Rollback: 하단 롤백 스크립트 참조

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. affiliate_products 테이블에 H-1/M-1 매칭 컬럼 추가
ALTER TABLE affiliate_products
  ADD COLUMN IF NOT EXISTS hair_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scalp_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS face_shapes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS undertones TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS makeup_subcategory TEXT;

-- 2. 컬럼 코멘트
COMMENT ON COLUMN affiliate_products.hair_types IS '매칭 대상 모발 타입 (straight, wavy, curly, coily)';
COMMENT ON COLUMN affiliate_products.scalp_types IS '매칭 대상 두피 타입 (dry, oily, sensitive, normal)';
COMMENT ON COLUMN affiliate_products.face_shapes IS '매칭 대상 얼굴형 (oval, round, square, heart, oblong)';
COMMENT ON COLUMN affiliate_products.undertones IS '매칭 대상 언더톤 (warm, cool, neutral)';
COMMENT ON COLUMN affiliate_products.makeup_subcategory IS '메이크업 세부 카테고리 (foundation, lip, eye, blush, brow, contour)';

-- 3. cosmetic_products 카테고리 CHECK 제약 조건 업데이트 (헤어케어 카테고리 추가)
ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS cosmetic_products_category_check;
ALTER TABLE cosmetic_products ADD CONSTRAINT cosmetic_products_category_check
  CHECK (category IN (
    'cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'mask', 'makeup',
    'shampoo', 'conditioner', 'hair-treatment', 'scalp-care'
  ));

-- 4. 인덱스 (배열 필드 GIN 인덱스로 효율적 검색)
CREATE INDEX IF NOT EXISTS idx_affiliate_products_hair_types
  ON affiliate_products USING GIN (hair_types);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_scalp_types
  ON affiliate_products USING GIN (scalp_types);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_face_shapes
  ON affiliate_products USING GIN (face_shapes);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_undertones
  ON affiliate_products USING GIN (undertones);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_makeup_subcategory
  ON affiliate_products (makeup_subcategory)
  WHERE makeup_subcategory IS NOT NULL;

-- ============================================
-- 롤백 스크립트
-- ============================================
-- ALTER TABLE affiliate_products DROP COLUMN IF EXISTS hair_types;
-- ALTER TABLE affiliate_products DROP COLUMN IF EXISTS scalp_types;
-- ALTER TABLE affiliate_products DROP COLUMN IF EXISTS face_shapes;
-- ALTER TABLE affiliate_products DROP COLUMN IF EXISTS undertones;
-- ALTER TABLE affiliate_products DROP COLUMN IF EXISTS makeup_subcategory;
-- DROP INDEX IF EXISTS idx_affiliate_products_hair_types;
-- DROP INDEX IF EXISTS idx_affiliate_products_scalp_types;
-- DROP INDEX IF EXISTS idx_affiliate_products_face_shapes;
-- DROP INDEX IF EXISTS idx_affiliate_products_undertones;
-- DROP INDEX IF EXISTS idx_affiliate_products_makeup_subcategory;
-- ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS cosmetic_products_category_check;
-- ALTER TABLE cosmetic_products ADD CONSTRAINT cosmetic_products_category_check
--   CHECK (category IN ('cleanser','toner','serum','moisturizer','sunscreen','mask','makeup'));
