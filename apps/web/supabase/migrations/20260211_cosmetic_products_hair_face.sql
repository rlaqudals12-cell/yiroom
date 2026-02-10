-- Migration: cosmetic_products 헤어/얼굴형 컬럼 추가
-- Purpose: Phase 2 데이터 모델 정비 - hairType/faceShape 기반 실매칭 지원
-- Date: 2026-02-11
-- Author: Claude Code
-- ADR: ADR-067-affiliate-partner-api-strategy.md
-- Rollback: 하단 롤백 스크립트 참조

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. cosmetic_products에 hair_types, face_shapes 컬럼 추가
ALTER TABLE cosmetic_products
  ADD COLUMN IF NOT EXISTS hair_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS face_shapes TEXT[] DEFAULT '{}';

-- 2. 컬럼 코멘트
COMMENT ON COLUMN cosmetic_products.hair_types IS '적합 모발 타입 (straight, wavy, curly, coily)';
COMMENT ON COLUMN cosmetic_products.face_shapes IS '적합 얼굴형 (oval, round, square, heart, oblong)';

-- 3. GIN 인덱스 (배열 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_hair_types
  ON cosmetic_products USING GIN (hair_types);
CREATE INDEX IF NOT EXISTS idx_cosmetic_products_face_shapes
  ON cosmetic_products USING GIN (face_shapes);

-- ============================================
-- 롤백 스크립트
-- ============================================
-- ALTER TABLE cosmetic_products DROP COLUMN IF EXISTS hair_types;
-- ALTER TABLE cosmetic_products DROP COLUMN IF EXISTS face_shapes;
-- DROP INDEX IF EXISTS idx_cosmetic_products_hair_types;
-- DROP INDEX IF EXISTS idx_cosmetic_products_face_shapes;
