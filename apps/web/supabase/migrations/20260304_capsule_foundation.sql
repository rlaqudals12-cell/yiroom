-- Migration: Capsule Foundation
-- Purpose: BeautyProfile + 캡슐 에코시스템 기반 테이블 생성
-- Date: 2026-03-04
-- Author: Claude Code
-- ADR: ADR-069 (캡슐 에코시스템), ADR-071 (CCS 스코어링), ADR-073 (Daily Capsule)
-- Rollback: DROP TABLE IF EXISTS 각 테이블 (기존 테이블 수정 없음)

-- ============================================
-- 1. beauty_profiles — 9모듈 통합 프로필
-- ============================================

CREATE TABLE IF NOT EXISTS beauty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,

  -- 9모듈 분석 결과 (JSONB, 각 ~500B)
  personal_color JSONB,
  skin JSONB,
  body JSONB,
  workout JSONB,
  nutrition JSONB,
  hair JSONB,
  makeup JSONB,
  oral JSONB,
  fashion JSONB,

  -- 메타데이터
  completed_modules TEXT[] DEFAULT '{}',
  personalization_level INT DEFAULT 1 CHECK (personalization_level BETWEEN 1 AND 4),
  last_full_update TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beauty_profiles_user
  ON beauty_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_beauty_profiles_updated
  ON beauty_profiles(updated_at DESC);

COMMENT ON TABLE beauty_profiles IS '9개 분석 모듈 통합 BeautyProfile (ADR-069)';
COMMENT ON COLUMN beauty_profiles.completed_modules IS '완료된 분석 모듈 코드 배열 (PC, S, C, W, N, H, M, OH, Fashion)';
COMMENT ON COLUMN beauty_profiles.personalization_level IS '개인화 레벨 1-4 (C3 원칙)';

-- ============================================
-- 2. capsules — 도메인별 캡슐 컨테이너
-- ============================================

CREATE TABLE IF NOT EXISTS capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,

  -- 스코어링
  ccs INT DEFAULT 0 CHECK (ccs BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_rotation TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_capsules_user_domain
  ON capsules(clerk_user_id, domain_id);

COMMENT ON TABLE capsules IS '도메인별 캡슐 (ADR-069)';

-- ============================================
-- 3. capsule_items — 캡슐 내 아이템
-- ============================================

CREATE TABLE IF NOT EXISTS capsule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,

  -- 아이템 데이터 (도메인별 구조)
  item JSONB NOT NULL,
  profile_fit_score INT DEFAULT 0 CHECK (profile_fit_score BETWEEN 0 AND 100),
  usage_count INT DEFAULT 0,
  last_used TIMESTAMPTZ,

  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capsule_items_capsule
  ON capsule_items(capsule_id);

COMMENT ON TABLE capsule_items IS '캡슐 내 개별 아이템 (CCS Layer 3 점수 포함)';

-- ============================================
-- 4. daily_capsules — 오늘의 캡슐
-- ============================================

CREATE TABLE IF NOT EXISTS daily_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- 아이템 목록 (JSONB 배열)
  items JSONB NOT NULL DEFAULT '[]',
  total_ccs INT DEFAULT 0,
  estimated_minutes INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- 같은 날 중복 생성 방지
  CONSTRAINT uq_daily_capsule_user_date UNIQUE (clerk_user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_capsules_user_date
  ON daily_capsules(clerk_user_id, date DESC);

COMMENT ON TABLE daily_capsules IS 'Daily Capsule — 6단계 파이프라인 결과 (ADR-073)';

-- ============================================
-- 5. rotation_history — 로테이션 이력
-- ============================================

CREATE TABLE IF NOT EXISTS rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,

  items_removed JSONB DEFAULT '[]',
  items_added JSONB DEFAULT '[]',
  reason TEXT NOT NULL CHECK (reason IN ('time-based', 'trigger-based', 'user-requested')),
  trigger_condition TEXT,

  compatibility_before INT,
  compatibility_after INT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rotation_history_capsule
  ON rotation_history(capsule_id);
CREATE INDEX IF NOT EXISTS idx_rotation_history_user
  ON rotation_history(clerk_user_id, created_at DESC);

COMMENT ON TABLE rotation_history IS '캡슐 로테이션 이력 (C4 원칙)';

-- ============================================
-- 6. cross_domain_rules — 크로스 도메인 규칙 (시드)
-- ============================================

CREATE TABLE IF NOT EXISTS cross_domain_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain1 TEXT NOT NULL,
  domain2 TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  factor INT NOT NULL CHECK (factor BETWEEN 0 AND 100),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('synergy', 'conflict', 'neutral')),
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_domain_rules_domains
  ON cross_domain_rules(domain1, domain2);

COMMENT ON TABLE cross_domain_rules IS 'CCS Layer 2 크로스 도메인 규칙 (ADR-071)';

-- 시드 데이터: 주요 도메인 쌍 호환성 규칙
INSERT INTO cross_domain_rules (domain1, domain2, rule_name, factor, rule_type, description)
VALUES
  ('skin', 'nutrition', '영양소→피부 시너지', 95, 'synergy', '비타민C, 콜라겐 등 피부 영향 영양소'),
  ('fashion', 'personal_color', '색상 조화도', 90, 'synergy', 'Lab ΔE 기반 색상 조화'),
  ('hair', 'skin', '두피-피부 성분 호환', 80, 'synergy', '공통 성분(살리실산 등) 호환성'),
  ('fashion', 'body', '실루엣 적합도', 70, 'synergy', '체형별 추천 실루엣 매칭'),
  ('workout', 'nutrition', '칼로리/단백질 균형', 60, 'synergy', '운동량 대비 영양 균형'),
  ('skin', 'makeup', '피부타입-메이크업 호환', 85, 'synergy', '피부 상태별 메이크업 제품 선택'),
  ('oral', 'nutrition', '구강건강-영양 연계', 65, 'synergy', '잇몸 건강 영양소 보충')
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS 정책 — 모든 테이블
-- ============================================

ALTER TABLE beauty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_domain_rules ENABLE ROW LEVEL SECURITY;

-- beauty_profiles: 본인 데이터만
CREATE POLICY "users_own_beauty_profile" ON beauty_profiles
  FOR ALL USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- capsules: 본인 캡슐만
CREATE POLICY "users_own_capsules" ON capsules
  FOR ALL USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- capsule_items: 본인 캡슐의 아이템만
CREATE POLICY "users_own_capsule_items" ON capsule_items
  FOR ALL USING (
    capsule_id IN (
      SELECT id FROM capsules
      WHERE clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

-- daily_capsules: 본인만
CREATE POLICY "users_own_daily_capsules" ON daily_capsules
  FOR ALL USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- rotation_history: 본인만
CREATE POLICY "users_own_rotation_history" ON rotation_history
  FOR ALL USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- cross_domain_rules: 전체 읽기 (공통 규칙)
CREATE POLICY "public_read_cross_domain_rules" ON cross_domain_rules
  FOR SELECT USING (true);

-- ============================================
-- 롤백 스크립트 (참조용)
-- ============================================
-- DROP POLICY IF EXISTS "users_own_beauty_profile" ON beauty_profiles;
-- DROP POLICY IF EXISTS "users_own_capsules" ON capsules;
-- DROP POLICY IF EXISTS "users_own_capsule_items" ON capsule_items;
-- DROP POLICY IF EXISTS "users_own_daily_capsules" ON daily_capsules;
-- DROP POLICY IF EXISTS "users_own_rotation_history" ON rotation_history;
-- DROP POLICY IF EXISTS "public_read_cross_domain_rules" ON cross_domain_rules;
-- DROP TABLE IF EXISTS cross_domain_rules;
-- DROP TABLE IF EXISTS rotation_history;
-- DROP TABLE IF EXISTS daily_capsules;
-- DROP TABLE IF EXISTS capsule_items;
-- DROP TABLE IF EXISTS capsules;
-- DROP TABLE IF EXISTS beauty_profiles;
