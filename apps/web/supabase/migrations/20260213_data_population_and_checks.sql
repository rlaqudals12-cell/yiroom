-- Migration: 제품 데이터 정비 + CHECK 제약 추가
-- Purpose: hair_care→세분화 카테고리, 빈 배열 데이터 투입, MakeupSubcategory CHECK
-- Date: 2026-02-13
-- Author: Claude Code
-- ADR: ADR-067-affiliate-partner-api-strategy.md
-- Rollback: 하단 롤백 스크립트 참조

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. hair_care 카테고리 세분화 (기존 DB 데이터 대응)
-- shampoo subcategory → shampoo 카테고리
UPDATE cosmetic_products SET category = 'shampoo'
  WHERE category = 'hair_care' AND subcategory = 'shampoo';

-- scalp-care/scalp-oil subcategory → scalp-care 카테고리
UPDATE cosmetic_products SET category = 'scalp-care'
  WHERE category = 'hair_care' AND subcategory IN ('scalp-care', 'scalp-oil');

-- 나머지 hair_care → hair-treatment 카테고리
UPDATE cosmetic_products SET category = 'hair-treatment'
  WHERE category = 'hair_care';

-- 2. 헤어케어 제품에 hair_types/scalp_types 투입 (빈 배열인 경우)
UPDATE cosmetic_products
SET hair_types = ARRAY['straight','wavy','curly','coily']
WHERE category IN ('shampoo','conditioner','hair-treatment','scalp-care')
  AND (hair_types IS NULL OR hair_types = '{}');

-- scalp_types: skin_types가 있으면 유사하게, 없으면 전체
UPDATE cosmetic_products
SET scalp_types = CASE
  WHEN skin_types IS NOT NULL AND skin_types != '{}' THEN skin_types
  ELSE ARRAY['dry','oily','normal','sensitive']
END
WHERE category IN ('shampoo','conditioner','hair-treatment','scalp-care')
  AND (scalp_types IS NULL OR scalp_types = '{}');

-- 3. 메이크업 제품에 undertones 투입 (퍼스널컬러 시즌에서 추론)
-- Spring/Autumn → warm, Summer/Winter → cool
UPDATE cosmetic_products
SET undertones = CASE
  WHEN personal_color_seasons && ARRAY['Spring','Autumn']
    AND NOT personal_color_seasons && ARRAY['Summer','Winter']
    THEN ARRAY['warm']
  WHEN personal_color_seasons && ARRAY['Summer','Winter']
    AND NOT personal_color_seasons && ARRAY['Spring','Autumn']
    THEN ARRAY['cool']
  ELSE ARRAY['warm','cool','neutral']
END
WHERE category = 'makeup'
  AND (undertones IS NULL OR undertones = '{}');

-- 4. 메이크업 제품에 face_shapes 투입 (subcategory별)
-- 베이스 메이크업: 전체 얼굴형
UPDATE cosmetic_products
SET face_shapes = ARRAY['oval','round','square','heart','oblong']
WHERE category = 'makeup'
  AND subcategory IN ('foundation','cushion','primer','powder','concealer')
  AND (face_shapes IS NULL OR face_shapes = '{}');

-- 컨투어: 둥근/각진/긴 얼굴 교정용
UPDATE cosmetic_products
SET face_shapes = ARRAY['round','square','oblong']
WHERE category = 'makeup'
  AND subcategory = 'contour'
  AND (face_shapes IS NULL OR face_shapes = '{}');

-- 블러셔/하이라이터: 볼 형태 관련
UPDATE cosmetic_products
SET face_shapes = ARRAY['oval','heart','round']
WHERE category = 'makeup'
  AND subcategory IN ('blush','highlighter')
  AND (face_shapes IS NULL OR face_shapes = '{}');

-- 5. cosmetic_products 카테고리 CHECK 제약 업데이트 (새 카테고리 포함)
ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS cosmetic_products_category_check;
ALTER TABLE cosmetic_products ADD CONSTRAINT cosmetic_products_category_check
  CHECK (category IN (
    'cleanser', 'toner', 'serum', 'essence', 'moisturizer', 'eye_cream',
    'sunscreen', 'mask', 'makeup',
    'shampoo', 'conditioner', 'hair-treatment', 'scalp-care',
    'body_care', 'lip_care', 'nail_care'
  ));

-- 6. affiliate_products makeup_subcategory CHECK 제약
ALTER TABLE affiliate_products DROP CONSTRAINT IF EXISTS chk_affiliate_makeup_subcategory;
ALTER TABLE affiliate_products ADD CONSTRAINT chk_affiliate_makeup_subcategory
  CHECK (makeup_subcategory IS NULL OR makeup_subcategory IN (
    'primer', 'foundation', 'cushion', 'concealer', 'powder', 'setting-spray',
    'blush', 'contour', 'highlighter',
    'brow',
    'eye', 'eyeshadow', 'eyeliner', 'mascara',
    'lip', 'lip-gloss', 'lip-liner',
    'multi-palette', 'brush'
  ));

-- ============================================
-- 롤백 스크립트
-- ============================================
-- -- 1. 카테고리 원복
-- UPDATE cosmetic_products SET category = 'hair_care'
--   WHERE category IN ('shampoo', 'hair-treatment', 'scalp-care')
--   AND subcategory IS NOT NULL;
--
-- -- 2. 투입 데이터 초기화
-- UPDATE cosmetic_products SET hair_types = '{}', scalp_types = '{}'
--   WHERE category IN ('shampoo','conditioner','hair-treatment','scalp-care');
-- UPDATE cosmetic_products SET undertones = '{}', face_shapes = '{}'
--   WHERE category = 'makeup';
--
-- -- 3. CHECK 제약 원복
-- ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS cosmetic_products_category_check;
-- ALTER TABLE cosmetic_products ADD CONSTRAINT cosmetic_products_category_check
--   CHECK (category IN (
--     'cleanser','toner','serum','moisturizer','sunscreen','mask','makeup',
--     'shampoo','conditioner','hair-treatment','scalp-care'
--   ));
-- ALTER TABLE affiliate_products DROP CONSTRAINT IF EXISTS chk_affiliate_makeup_subcategory;
