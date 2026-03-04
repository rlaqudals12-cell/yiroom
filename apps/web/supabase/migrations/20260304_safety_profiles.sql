-- Migration: Safety Profiles
-- Purpose: 사용자 안전성 프로필 (암호화 건강 데이터, 동의 관리)
-- Date: 2026-03-04
-- Author: Claude Code
-- ADR: docs/adr/ADR-070-safety-profile-architecture.md
-- Spec: docs/specs/SDD-SAFETY-PROFILE.md
-- Rollback: DROP TABLE IF EXISTS safety_profiles;

-- ============================================
-- 1. safety_profiles 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS safety_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- 민감 필드: AES-256-GCM 암호화 (base64 인코딩)
  allergies_encrypted TEXT,
  conditions_encrypted TEXT,
  skin_conditions_encrypted TEXT,
  medications_encrypted TEXT,

  -- 비민감 필드
  age INTEGER CHECK (age IS NULL OR (age >= 0 AND age <= 150)),

  -- 동의 관리
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_given_at TIMESTAMPTZ,
  consent_version TEXT NOT NULL DEFAULT '1.0',

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_safety_profiles_user
  ON safety_profiles(clerk_user_id);

-- 코멘트
COMMENT ON TABLE safety_profiles IS '사용자 안전성 프로필 (건강 데이터 암호화 저장)';
COMMENT ON COLUMN safety_profiles.allergies_encrypted IS 'AES-256-GCM 암호화된 알레르기 목록';
COMMENT ON COLUMN safety_profiles.conditions_encrypted IS 'AES-256-GCM 암호화된 건강 상태 목록';
COMMENT ON COLUMN safety_profiles.skin_conditions_encrypted IS 'AES-256-GCM 암호화된 피부 상태 목록';
COMMENT ON COLUMN safety_profiles.medications_encrypted IS 'AES-256-GCM 암호화된 복용 약물 목록';
COMMENT ON COLUMN safety_profiles.consent_given IS '개인정보 수집 동의 여부';
COMMENT ON COLUMN safety_profiles.consent_version IS '동의서 버전 (변경 시 재동의 필요)';

-- ============================================
-- 2. RLS 정책
-- ============================================

ALTER TABLE safety_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회
CREATE POLICY "safety_profiles_select_own" ON safety_profiles
  FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

-- 본인 데이터만 삽입
CREATE POLICY "safety_profiles_insert_own" ON safety_profiles
  FOR INSERT
  WITH CHECK (clerk_user_id = auth.get_user_id());

-- 본인 데이터만 수정
CREATE POLICY "safety_profiles_update_own" ON safety_profiles
  FOR UPDATE
  USING (clerk_user_id = auth.get_user_id());

-- 삭제 정책 (본인만)
CREATE POLICY "safety_profiles_delete_own" ON safety_profiles
  FOR DELETE
  USING (clerk_user_id = auth.get_user_id());
