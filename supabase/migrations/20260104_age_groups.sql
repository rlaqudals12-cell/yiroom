-- 연령대 필터 지원을 위한 마이그레이션
-- 2026-01-04

-- 1. target_age_groups 컬럼 추가
ALTER TABLE cosmetic_products
ADD COLUMN IF NOT EXISTS target_age_groups TEXT[] DEFAULT ARRAY['20s', '30s']::TEXT[];

-- 2. 인덱스 추가 (배열 검색 성능)
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_age_groups
ON cosmetic_products USING GIN (target_age_groups);

-- 3. 기존 제품에 카테고리/성분 기반 연령대 추정값 설정
-- 안티에이징 제품 → 30대 이상
UPDATE cosmetic_products
SET target_age_groups = ARRAY['30s', '40s', '50s']::TEXT[]
WHERE (
  concerns && ARRAY['anti-aging', 'wrinkles', 'elasticity']::TEXT[]
  OR name ILIKE '%안티에이징%'
  OR name ILIKE '%주름%'
  OR name ILIKE '%탄력%'
  OR name ILIKE '%리프팅%'
  OR key_ingredients && ARRAY['retinol', 'peptide', 'collagen']::TEXT[]
);

-- 여드름/피지 관련 제품 → 10대~20대
UPDATE cosmetic_products
SET target_age_groups = ARRAY['10s', '20s']::TEXT[]
WHERE (
  concerns && ARRAY['acne', 'pores', 'sebum']::TEXT[]
  OR name ILIKE '%여드름%'
  OR name ILIKE '%피지%'
  OR name ILIKE '%트러블%'
  OR name ILIKE '%모공%'
  OR key_ingredients && ARRAY['salicylic acid', 'tea tree', 'BHA']::TEXT[]
);

-- 미백/브라이트닝 제품 → 전 연령
UPDATE cosmetic_products
SET target_age_groups = ARRAY['20s', '30s', '40s', '50s']::TEXT[]
WHERE (
  concerns && ARRAY['brightening', 'pigmentation', 'dark spots']::TEXT[]
  OR name ILIKE '%미백%'
  OR name ILIKE '%브라이트닝%'
  OR name ILIKE '%톤업%'
  OR key_ingredients && ARRAY['vitamin c', 'niacinamide', 'arbutin']::TEXT[]
);

-- 선크림은 전 연령
UPDATE cosmetic_products
SET target_age_groups = ARRAY['10s', '20s', '30s', '40s', '50s']::TEXT[]
WHERE category = 'sunscreen';

-- 클렌저는 전 연령
UPDATE cosmetic_products
SET target_age_groups = ARRAY['10s', '20s', '30s', '40s', '50s']::TEXT[]
WHERE category = 'cleanser';

-- 코멘트
COMMENT ON COLUMN cosmetic_products.target_age_groups IS '타겟 연령대 배열 (10s, 20s, 30s, 40s, 50s)';
