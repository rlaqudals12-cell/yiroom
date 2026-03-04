-- Migration: 캡슐 에코시스템 Foundation
-- Purpose: BeautyProfile, 캡슐, Daily Capsule, 로테이션, 크로스 도메인 규칙, Safety 테이블 생성
-- Date: 2026-03-05
-- ADR: ADR-069 (Capsule Ecosystem), ADR-070 (Safety Profile), ADR-071 (Cross-Module Scoring), ADR-073 (One-Button Daily)
-- Rollback: DROP TABLE IF EXISTS (역순)

-- ============================================================
-- 1. beauty_profiles — 9모듈 통합 프로필 (On-Read 마이그레이션 대상)
-- ============================================================
CREATE TABLE IF NOT EXISTS beauty_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  -- 9모듈 분석 요약 (JSONB)
  personal_color JSONB,     -- PCProfileData: season, subType, palette[]
  skin JSONB,               -- SkinProfileData: type, concerns[], scores{}
  body JSONB,               -- BodyProfileData: shape, measurements{}
  workout JSONB,            -- WorkoutProfileData: fitnessLevel, goals[], history[]
  nutrition JSONB,          -- NutritionProfileData: deficiencies[], dietType, allergies[]
  hair JSONB,               -- HairProfileData: type, scalp, concerns[]
  makeup JSONB,             -- MakeupProfileData: preferences{}, skillLevel
  oral JSONB,               -- OralProfileData: conditions[], goals[]
  fashion JSONB,            -- FashionProfileData: style, sizeProfile{}, wardrobe[]
  -- 메타데이터
  completed_modules TEXT[] NOT NULL DEFAULT '{}',
  personalization_level INT NOT NULL DEFAULT 1 CHECK (personalization_level BETWEEN 1 AND 4),
  last_full_update TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beauty_profiles_clerk ON beauty_profiles(clerk_user_id);

ALTER TABLE beauty_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own beauty_profile" ON beauty_profiles;
CREATE POLICY "Users can view own beauty_profile"
  ON beauty_profiles FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own beauty_profile" ON beauty_profiles;
CREATE POLICY "Users can insert own beauty_profile"
  ON beauty_profiles FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own beauty_profile" ON beauty_profiles;
CREATE POLICY "Users can update own beauty_profile"
  ON beauty_profiles FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on beauty_profiles" ON beauty_profiles;
CREATE POLICY "Service role full access on beauty_profiles"
  ON beauty_profiles FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE beauty_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE beauty_profiles TO authenticated;
GRANT ALL ON TABLE beauty_profiles TO service_role;

COMMENT ON TABLE beauty_profiles IS '9모듈 통합 프로필 (BeautyProfile) — ADR-069';

-- ============================================================
-- 2. capsules — 도메인별 캡슐 컬렉션
-- ============================================================
CREATE TABLE IF NOT EXISTS capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,                      -- 'skin', 'fashion', 'nutrition' 등
  ccs REAL NOT NULL DEFAULT 0,                   -- CCS 점수 (0-100)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  last_rotation TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clerk_user_id, domain_id)              -- 사용자당 도메인별 1개
);

CREATE INDEX IF NOT EXISTS idx_capsules_clerk ON capsules(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_capsules_clerk_domain ON capsules(clerk_user_id, domain_id);

ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own capsules" ON capsules;
CREATE POLICY "Users can view own capsules"
  ON capsules FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own capsules" ON capsules;
CREATE POLICY "Users can insert own capsules"
  ON capsules FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own capsules" ON capsules;
CREATE POLICY "Users can update own capsules"
  ON capsules FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own capsules" ON capsules;
CREATE POLICY "Users can delete own capsules"
  ON capsules FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on capsules" ON capsules;
CREATE POLICY "Service role full access on capsules"
  ON capsules FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE capsules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE capsules TO authenticated;
GRANT ALL ON TABLE capsules TO service_role;

COMMENT ON TABLE capsules IS '도메인별 캡슐 컬렉션 — ADR-069 C1~C5';

-- ============================================================
-- 3. capsule_items — 캡슐 내 개별 아이템
-- ============================================================
CREATE TABLE IF NOT EXISTS capsule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,                   -- RLS용 비정규화
  item JSONB NOT NULL,                           -- 도메인별 아이템 데이터 (SkinProduct, FashionItem 등)
  profile_fit_score REAL NOT NULL DEFAULT 0,     -- L3 프로필 적합도 (0-100)
  usage_count INT NOT NULL DEFAULT 0,
  last_used TIMESTAMPTZ,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capsule_items_capsule ON capsule_items(capsule_id);
CREATE INDEX IF NOT EXISTS idx_capsule_items_clerk ON capsule_items(clerk_user_id);

ALTER TABLE capsule_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own capsule_items" ON capsule_items;
CREATE POLICY "Users can view own capsule_items"
  ON capsule_items FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own capsule_items" ON capsule_items;
CREATE POLICY "Users can insert own capsule_items"
  ON capsule_items FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own capsule_items" ON capsule_items;
CREATE POLICY "Users can update own capsule_items"
  ON capsule_items FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own capsule_items" ON capsule_items;
CREATE POLICY "Users can delete own capsule_items"
  ON capsule_items FOR DELETE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on capsule_items" ON capsule_items;
CREATE POLICY "Service role full access on capsule_items"
  ON capsule_items FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE capsule_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE capsule_items TO authenticated;
GRANT ALL ON TABLE capsule_items TO service_role;

COMMENT ON TABLE capsule_items IS '캡슐 내 개별 아이템 — JSONB 도메인별 데이터';

-- ============================================================
-- 4. daily_capsules — 오늘의 캡슐 (날짜별 캐싱)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  date DATE NOT NULL,                             -- 날짜 (캐시 키)
  items JSONB NOT NULL DEFAULT '[]',              -- DailyItem[] 배열
  total_ccs REAL NOT NULL DEFAULT 0,              -- 전체 CCS
  estimated_minutes INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clerk_user_id, date)                    -- 사용자+날짜 유니크
);

CREATE INDEX IF NOT EXISTS idx_daily_capsules_clerk ON daily_capsules(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_daily_capsules_clerk_date ON daily_capsules(clerk_user_id, date DESC);

ALTER TABLE daily_capsules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily_capsules" ON daily_capsules;
CREATE POLICY "Users can view own daily_capsules"
  ON daily_capsules FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own daily_capsules" ON daily_capsules;
CREATE POLICY "Users can insert own daily_capsules"
  ON daily_capsules FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own daily_capsules" ON daily_capsules;
CREATE POLICY "Users can update own daily_capsules"
  ON daily_capsules FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on daily_capsules" ON daily_capsules;
CREATE POLICY "Service role full access on daily_capsules"
  ON daily_capsules FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE daily_capsules TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE daily_capsules TO authenticated;
GRANT ALL ON TABLE daily_capsules TO service_role;

COMMENT ON TABLE daily_capsules IS '오늘의 캡슐 — (userId,date) 키 캐싱 — ADR-073';

-- ============================================================
-- 5. rotation_history — 로테이션 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id UUID NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,                    -- RLS용 비정규화
  items_removed JSONB NOT NULL DEFAULT '[]',
  items_added JSONB NOT NULL DEFAULT '[]',
  reason TEXT NOT NULL CHECK (reason IN ('time-based', 'trigger-based', 'user-requested')),
  trigger_condition TEXT,                          -- 트리거 조건 설명
  compatibility_before REAL NOT NULL DEFAULT 0,
  compatibility_after REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotation_history_capsule ON rotation_history(capsule_id);
CREATE INDEX IF NOT EXISTS idx_rotation_history_clerk ON rotation_history(clerk_user_id);

ALTER TABLE rotation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rotation_history" ON rotation_history;
CREATE POLICY "Users can view own rotation_history"
  ON rotation_history FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own rotation_history" ON rotation_history;
CREATE POLICY "Users can insert own rotation_history"
  ON rotation_history FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on rotation_history" ON rotation_history;
CREATE POLICY "Service role full access on rotation_history"
  ON rotation_history FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE rotation_history TO anon;
GRANT SELECT, INSERT ON TABLE rotation_history TO authenticated;
GRANT ALL ON TABLE rotation_history TO service_role;

COMMENT ON TABLE rotation_history IS '캡슐 로테이션 이력 — 20~40% 교체 기록';

-- ============================================================
-- 6. cross_domain_rules — 크로스 도메인 호환성 규칙
-- ============================================================
CREATE TABLE IF NOT EXISTS cross_domain_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain1 TEXT NOT NULL,
  domain2 TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  factor REAL NOT NULL DEFAULT 1.0,               -- 가중치 보정 계수
  rule_type TEXT NOT NULL DEFAULT 'neutral'
    CHECK (rule_type IN ('synergy', 'conflict', 'neutral')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_domain_rules_domains ON cross_domain_rules(domain1, domain2);

ALTER TABLE cross_domain_rules ENABLE ROW LEVEL SECURITY;

-- 크로스 도메인 규칙은 시스템 데이터 → 모든 인증 사용자 읽기 가능
DROP POLICY IF EXISTS "Authenticated can read cross_domain_rules" ON cross_domain_rules;
CREATE POLICY "Authenticated can read cross_domain_rules"
  ON cross_domain_rules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access on cross_domain_rules" ON cross_domain_rules;
CREATE POLICY "Service role full access on cross_domain_rules"
  ON cross_domain_rules FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE cross_domain_rules TO anon;
GRANT SELECT ON TABLE cross_domain_rules TO authenticated;
GRANT ALL ON TABLE cross_domain_rules TO service_role;

COMMENT ON TABLE cross_domain_rules IS '크로스 도메인 호환성 규칙 — ADR-071 L2 계층';

-- 시드 데이터: 기본 크로스 도메인 규칙
INSERT INTO cross_domain_rules (domain1, domain2, rule_name, factor, rule_type, description) VALUES
  -- 시너지 규칙
  ('skin', 'makeup', '피부-메이크업 시너지', 1.2, 'synergy', '피부 타입에 맞는 메이크업 제품은 호환도 보너스'),
  ('personal-color', 'fashion', '퍼스널컬러-패션 시너지', 1.3, 'synergy', '퍼스널컬러에 맞는 의류 색상은 높은 호환도'),
  ('personal-color', 'makeup', '퍼스널컬러-메이크업 시너지', 1.25, 'synergy', '퍼스널컬러에 맞는 메이크업 색상'),
  ('body', 'fashion', '체형-패션 시너지', 1.2, 'synergy', '체형에 맞는 실루엣 의류는 호환도 보너스'),
  ('body', 'workout', '체형-운동 시너지', 1.15, 'synergy', '체형 목표에 맞는 운동 루틴'),
  ('workout', 'nutrition', '운동-영양 시너지', 1.3, 'synergy', '운동 강도에 맞는 영양 섭취'),
  ('skin', 'hair', '피부-헤어 시너지', 1.1, 'synergy', '두피/피부 타입 일관성 보너스'),
  -- 충돌 규칙
  ('skin', 'nutrition', '피부-영양 충돌', 0.85, 'conflict', '피부 민감도 높으면 일부 영양소 주의'),
  -- 중립 규칙
  ('hair', 'fashion', '헤어-패션 중립', 1.0, 'neutral', '헤어스타일과 패션은 독립적 평가'),
  ('oral', 'nutrition', '구강-영양 연관', 1.05, 'neutral', '구강건강과 식습관 약한 연관')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. safety_profiles — 안전성 프로필 (암호화 저장)
-- ============================================================
CREATE TABLE IF NOT EXISTS safety_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  -- 4개 필드 AES-256-GCM 암호화 (서버에서 encrypt/decrypt)
  allergies_encrypted TEXT,          -- 알레르기 정보 (암호화)
  medications_encrypted TEXT,        -- 복용 약물 (암호화)
  conditions_encrypted TEXT,         -- 건강 상태 (암호화)
  sensitivities_encrypted TEXT,      -- 민감 성분 (암호화)
  -- 평문 필드
  age_group TEXT,                     -- '10s', '20s', '30s', '40s', '50+'
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_profiles_clerk ON safety_profiles(clerk_user_id);

ALTER TABLE safety_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own safety_profile" ON safety_profiles;
CREATE POLICY "Users can view own safety_profile"
  ON safety_profiles FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own safety_profile" ON safety_profiles;
CREATE POLICY "Users can insert own safety_profile"
  ON safety_profiles FOR INSERT
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own safety_profile" ON safety_profiles;
CREATE POLICY "Users can update own safety_profile"
  ON safety_profiles FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on safety_profiles" ON safety_profiles;
CREATE POLICY "Service role full access on safety_profiles"
  ON safety_profiles FOR ALL
  USING (current_setting('role', true) = 'service_role');

GRANT SELECT ON TABLE safety_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE safety_profiles TO authenticated;
GRANT ALL ON TABLE safety_profiles TO service_role;

COMMENT ON TABLE safety_profiles IS '안전성 프로필 — AES-256-GCM 암호화 민감 데이터 — ADR-070';
