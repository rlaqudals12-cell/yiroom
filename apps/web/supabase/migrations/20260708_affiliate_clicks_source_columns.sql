-- Migration: affiliate_clicks 스키마 정합 (Phase 5 전환 실측 준비)
-- Purpose: ① 202512290200 마이그가 "기존 테이블" ALTER 백필 목록에서 source_page/
--          source_component를 누락 → 신 경로(lib/affiliate/clicks.ts) insert가 prod에서
--          42703으로 전멸하던 것 수리. ② product_type NOT NULL 완화 — 신 경로(파트너
--          제품, affiliate_products UUID 참조)는 cosmetic/supplement 구분이 없음.
--          구 경로(lib/products/affiliate.ts)는 계속 product_type을 기록.
-- Date: 2026-07-08
-- Author: Claude Code
-- Rollback:
--   ALTER TABLE affiliate_clicks DROP COLUMN IF EXISTS source_page;
--   ALTER TABLE affiliate_clicks DROP COLUMN IF EXISTS source_component;
--   ALTER TABLE affiliate_clicks ALTER COLUMN product_type SET NOT NULL; -- (NULL 행 없을 때만)

ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS source_page TEXT;
ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS source_component TEXT;
ALTER TABLE affiliate_clicks ALTER COLUMN product_type DROP NOT NULL;

COMMENT ON COLUMN affiliate_clicks.source_page IS '클릭 발생 페이지 경로 (귀속 분석용)';
COMMENT ON COLUMN affiliate_clicks.source_component IS '클릭 발생 컴포넌트 (귀속 분석용)';
COMMENT ON COLUMN affiliate_clicks.product_type IS 'cosmetic|supplement|equipment|healthfood. NULL=파트너 제품(affiliate_products) 경로';
