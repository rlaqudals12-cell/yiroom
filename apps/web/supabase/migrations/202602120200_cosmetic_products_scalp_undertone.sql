-- Migration: cosmetic_products 두피타입/언더톤 컬럼 + CHECK 제약조건
-- Purpose: H-1 두피 매칭, M-1 언더톤 매칭 지원 + 배열값 유효성 보장
-- Date: 2026-02-12
-- Author: Claude Code
-- ADR: ADR-067-affiliate-partner-api-strategy.md
-- Rollback: 하단 롤백 스크립트 참조

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. cosmetic_products에 scalp_types, undertones 컬럼 추가
ALTER TABLE cosmetic_products
  ADD COLUMN IF NOT EXISTS scalp_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS undertones TEXT[] DEFAULT '{}';

-- 2. 컬럼 코멘트
COMMENT ON COLUMN cosmetic_products.scalp_types IS '적합 두피 타입 (dry, oily, sensitive, normal)';
COMMENT ON COLUMN cosmetic_products.undertones IS '적합 언더톤 (warm, cool, neutral)';

-- 3. GIN 인덱스 (배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_scalp_types
  ON cosmetic_products USING GIN (scalp_types);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_undertones
  ON cosmetic_products USING GIN (undertones);

-- 4. CHECK 제약조건 — 배열값 유효성 보장
-- hair_types: straight, wavy, curly, coily만 허용
ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_hair_types;
ALTER TABLE cosmetic_products ADD CONSTRAINT chk_cosmetic_products_hair_types
  CHECK (hair_types <@ ARRAY['straight', 'wavy', 'curly', 'coily']::TEXT[]);

-- scalp_types: dry, oily, sensitive, normal만 허용
ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_scalp_types;
ALTER TABLE cosmetic_products ADD CONSTRAINT chk_cosmetic_products_scalp_types
  CHECK (scalp_types <@ ARRAY['dry', 'oily', 'sensitive', 'normal']::TEXT[]);

-- face_shapes: oval, round, square, heart, oblong만 허용
ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_face_shapes;
ALTER TABLE cosmetic_products ADD CONSTRAINT chk_cosmetic_products_face_shapes
  CHECK (face_shapes <@ ARRAY['oval', 'round', 'square', 'heart', 'oblong']::TEXT[]);

-- undertones: warm, cool, neutral만 허용
ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_undertones;
ALTER TABLE cosmetic_products ADD CONSTRAINT chk_cosmetic_products_undertones
  CHECK (undertones <@ ARRAY['warm', 'cool', 'neutral']::TEXT[]);

-- ============================================
-- 롤백 스크립트
-- ============================================
-- ALTER TABLE cosmetic_products DROP COLUMN IF EXISTS scalp_types;
-- ALTER TABLE cosmetic_products DROP COLUMN IF EXISTS undertones;
-- DROP INDEX IF EXISTS idx_cosmetic_products_scalp_types;
-- DROP INDEX IF EXISTS idx_cosmetic_products_undertones;
-- ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_hair_types;
-- ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_scalp_types;
-- ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_face_shapes;
-- ALTER TABLE cosmetic_products DROP CONSTRAINT IF EXISTS chk_cosmetic_products_undertones;
