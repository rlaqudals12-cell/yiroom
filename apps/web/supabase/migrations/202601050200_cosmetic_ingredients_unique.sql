-- 화장품 성분 name_inci 유니크 제약 추가
-- upsert 및 중복 방지를 위한 constraint

-- name_inci 유니크 인덱스 추가 (없는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_cosmetic_ingredients_name_inci_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_cosmetic_ingredients_name_inci_unique
    ON cosmetic_ingredients(name_inci);
  END IF;
END $$;

-- 테이블 코멘트 업데이트
COMMENT ON INDEX idx_cosmetic_ingredients_name_inci_unique IS 'INCI 표준명 유니크 인덱스 - 중복 성분 방지';
