-- Migration: coupon_promotion
-- Purpose: 쿠폰/프로모션 시스템 테이블 생성
-- Date: 2026-03-16
-- Author: Claude Code
-- Rollback: 하단 롤백 스크립트 참조

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. 프로모션 정의 테이블
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('percentage_off', 'fixed_off', 'free_shipping')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  partner_name TEXT,
  category TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE promotions IS '프로모션 정의 테이블 (할인율, 정액 할인, 무료 배송)';
COMMENT ON COLUMN promotions.promotion_type IS 'percentage_off | fixed_off | free_shipping';
COMMENT ON COLUMN promotions.discount_value IS '할인 값 (%, 원, 또는 배송비)';
COMMENT ON COLUMN promotions.min_purchase_amount IS '최소 구매 금액 (0이면 제한 없음)';
COMMENT ON COLUMN promotions.max_discount_amount IS '최대 할인 금액 (percentage_off 시 상한)';
COMMENT ON COLUMN promotions.partner_name IS '특정 파트너 제한 (null이면 전체 적용)';
COMMENT ON COLUMN promotions.category IS '특정 카테고리 제한 (null이면 전체 적용)';

-- 2. 사용자 쿠폰 테이블
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  promotion_id UUID NOT NULL REFERENCES promotions(id),
  coupon_code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_coupons IS '사용자별 발급된 쿠폰';
COMMENT ON COLUMN user_coupons.coupon_code IS '8자리 고유 쿠폰 코드';

-- 3. RLS 활성화
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- 프로모션: 활성 항목만 공개 읽기
CREATE POLICY "public_read_active_promotions" ON promotions
  FOR SELECT
  USING (is_active = true AND starts_at <= now() AND expires_at > now());

-- 사용자 쿠폰: 본인 것만 조회
CREATE POLICY "user_own_coupons_select" ON user_coupons
  FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

-- 사용자 쿠폰: 본인 것만 수정 (사용 처리)
CREATE POLICY "user_own_coupons_update" ON user_coupons
  FOR UPDATE
  USING (clerk_user_id = auth.get_user_id());

-- 5. 인덱스
CREATE INDEX idx_promotions_active ON promotions(is_active, starts_at, expires_at);
CREATE INDEX idx_user_coupons_user ON user_coupons(clerk_user_id);
CREATE INDEX idx_user_coupons_code ON user_coupons(coupon_code);

-- ============================================
-- 롤백 스크립트
-- ============================================
-- DROP POLICY IF EXISTS "public_read_active_promotions" ON promotions;
-- DROP POLICY IF EXISTS "user_own_coupons_select" ON user_coupons;
-- DROP POLICY IF EXISTS "user_own_coupons_update" ON user_coupons;
-- DROP INDEX IF EXISTS idx_promotions_active;
-- DROP INDEX IF EXISTS idx_user_coupons_user;
-- DROP INDEX IF EXISTS idx_user_coupons_code;
-- DROP TABLE IF EXISTS user_coupons;
-- DROP TABLE IF EXISTS promotions;
