-- Migration: user_preference_items 테이블 (도메인 선호/기피)
-- Purpose: lib/preferences/repository.ts가 사용하던 'user_preferences' 테이블명이
--   prod에서는 쇼핑 설정 스키마(budget/favorite_brands/blocked_brands/...)와 충돌했다.
--   도메인 선호/기피(N행/유저: domain·item_type·item_name·is_favorite·avoid_*·priority)를
--   전용 테이블로 분리해 GET 빈배열(컬럼 부재)·POST 실패(스타일 선호 칩·성분 필터 포함)를
--   근본 해소한다. 쇼핑 설정 user_preferences 테이블은 그대로 둔다(별개 시스템).
-- Date: 2026-07-10
-- Author: Claude Code
-- Rollback: DROP TABLE IF EXISTS user_preference_items;

CREATE TABLE IF NOT EXISTS user_preference_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 분류
  domain TEXT NOT NULL,        -- beauty | style | nutrition | workout | color
  item_type TEXT NOT NULL,     -- ingredient | material | fashion_style | food | allergen ...

  -- 항목 정보
  item_id TEXT,                -- DB 참조 ID (옵션)
  item_name TEXT NOT NULL,     -- 한글명
  item_name_en TEXT,           -- 영문명

  -- 선호/기피
  is_favorite BOOLEAN NOT NULL DEFAULT true,  -- true=좋아함, false=기피

  -- 기피 상세 (is_favorite=false)
  avoid_level TEXT,            -- dislike | avoid | cannot | danger
  avoid_reason TEXT,           -- allergy | taste | skin_reaction ...
  avoid_note TEXT,

  -- 메타
  priority INTEGER NOT NULL DEFAULT 3,   -- 1-5 (repository 기본값 `?? 3` 정합)
  source TEXT NOT NULL DEFAULT 'user',   -- user | analysis | recommendation

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- upsert(onConflict: clerk_user_id,domain,item_type,item_name) 정합 + 동일 항목 중복 방지
  CONSTRAINT user_preference_items_unique UNIQUE (clerk_user_id, domain, item_type, item_name)
);

CREATE INDEX IF NOT EXISTS idx_user_preference_items_user_domain
  ON user_preference_items(clerk_user_id, domain);

ALTER TABLE user_preference_items ENABLE ROW LEVEL SECURITY;

-- prod 구패턴(auth.jwt()->>'sub') 정합 — auth.get_user_id() 없음
DROP POLICY IF EXISTS "pref_items_select_own" ON user_preference_items;
CREATE POLICY "pref_items_select_own" ON user_preference_items
  FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "pref_items_insert_own" ON user_preference_items;
CREATE POLICY "pref_items_insert_own" ON user_preference_items
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "pref_items_update_own" ON user_preference_items;
CREATE POLICY "pref_items_update_own" ON user_preference_items
  FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "pref_items_delete_own" ON user_preference_items;
CREATE POLICY "pref_items_delete_own" ON user_preference_items
  FOR DELETE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_user_preference_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_preference_items_updated_at ON user_preference_items;
CREATE TRIGGER trigger_user_preference_items_updated_at
  BEFORE UPDATE ON user_preference_items
  FOR EACH ROW EXECUTE FUNCTION update_user_preference_items_updated_at();

GRANT ALL ON TABLE user_preference_items TO anon, authenticated, service_role;

COMMENT ON TABLE user_preference_items IS
  '도메인 선호/기피 항목 (N행/유저). 쇼핑 설정 user_preferences와 분리(2026-07-10).';
