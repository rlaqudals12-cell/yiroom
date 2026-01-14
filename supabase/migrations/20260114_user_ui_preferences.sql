-- Migration: 사용자 UI/접근성 선호도 테이블
-- Purpose: 글로벌 사용자를 위한 접근성 옵션 및 UI 선호도 저장
-- Date: 2026-01-14
-- Related Spec: SDD-GLOBAL-DESIGN-SPECIFICATION.md

-- ============================================
-- 사용자 UI 선호도 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS user_ui_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- ============================================
  -- 접근성 옵션
  -- ============================================

  -- 글꼴 크기 배율 (0.8 ~ 1.5)
  font_size_multiplier FLOAT DEFAULT 1.0
    CHECK (font_size_multiplier BETWEEN 0.8 AND 1.5),

  -- 고대비 모드
  high_contrast_mode BOOLEAN DEFAULT false,

  -- 모션 감소 모드 (prefers-reduced-motion 오버라이드)
  reduced_motion BOOLEAN DEFAULT false,

  -- 색맹 모드
  color_blind_mode TEXT CHECK (color_blind_mode IN (
    'none',         -- 기본 (색맹 없음)
    'protanopia',   -- 적색맹
    'deuteranopia', -- 녹색맹
    'tritanopia'    -- 청색맹
  )) DEFAULT 'none',

  -- ============================================
  -- UI 선호도
  -- ============================================

  -- 테마 설정
  preferred_theme TEXT CHECK (preferred_theme IN (
    'light',  -- 라이트 모드 고정
    'dark',   -- 다크 모드 고정
    'system'  -- 시스템 설정 따름
  )) DEFAULT 'system',

  -- 전문가 모드 (더 상세한 데이터 표시)
  professional_mode BOOLEAN DEFAULT false,

  -- 분석 결과 표시 레벨 (Progressive Disclosure 기본값)
  default_disclosure_level INT DEFAULT 1
    CHECK (default_disclosure_level BETWEEN 1 AND 3),

  -- ============================================
  -- 언어/지역 설정
  -- ============================================

  -- 선호 언어 (i18n)
  preferred_language TEXT DEFAULT 'ko'
    CHECK (preferred_language IN ('ko', 'en', 'ja', 'zh')),

  -- 측정 단위
  measurement_unit TEXT DEFAULT 'metric'
    CHECK (measurement_unit IN ('metric', 'imperial')),

  -- ============================================
  -- 메타데이터
  -- ============================================

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 외래 키
  CONSTRAINT user_ui_preferences_clerk_user_id_fkey
    FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
);

-- ============================================
-- 자동 updated_at 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_user_ui_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_ui_preferences_updated_at
  BEFORE UPDATE ON user_ui_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ui_preferences_updated_at();

-- ============================================
-- 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_ui_preferences_clerk_user_id
  ON user_ui_preferences(clerk_user_id);

-- ============================================
-- RLS 정책
-- ============================================

ALTER TABLE user_ui_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own UI preferences"
  ON user_ui_preferences FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own UI preferences"
  ON user_ui_preferences FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own UI preferences"
  ON user_ui_preferences FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON TABLE user_ui_preferences IS '사용자 UI/접근성 선호도 (글로벌 지원)';
COMMENT ON COLUMN user_ui_preferences.font_size_multiplier IS '글꼴 크기 배율 (0.8=작게, 1.0=기본, 1.5=크게)';
COMMENT ON COLUMN user_ui_preferences.color_blind_mode IS '색맹 친화 모드 (protanopia/deuteranopia/tritanopia)';
COMMENT ON COLUMN user_ui_preferences.professional_mode IS '전문가 모드 (상세 데이터 표시)';
COMMENT ON COLUMN user_ui_preferences.default_disclosure_level IS 'Progressive Disclosure 기본 레벨 (1=요약, 2=중급, 3=전문가)';
