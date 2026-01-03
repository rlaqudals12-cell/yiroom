-- 연령대 필터 지원을 위한 마이그레이션
-- 2026-01-04
-- 조건부 실행: cosmetic_products 테이블이 존재할 때만 적용

DO $$
BEGIN
  -- 테이블 존재 여부 확인
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cosmetic_products') THEN
    -- 1. target_age_groups 컬럼 추가
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'cosmetic_products' AND column_name = 'target_age_groups'
    ) THEN
      ALTER TABLE cosmetic_products
      ADD COLUMN target_age_groups TEXT[] DEFAULT ARRAY['20s', '30s']::TEXT[];
    END IF;

    -- 2. 인덱스 추가 (배열 검색 성능)
    IF NOT EXISTS (
      SELECT FROM pg_indexes WHERE indexname = 'idx_cosmetic_products_age_groups'
    ) THEN
      CREATE INDEX idx_cosmetic_products_age_groups
      ON cosmetic_products USING GIN (target_age_groups);
    END IF;

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

    RAISE NOTICE 'Successfully added target_age_groups to cosmetic_products';
  ELSE
    RAISE NOTICE 'cosmetic_products table does not exist, skipping migration';
  END IF;
END $$;
