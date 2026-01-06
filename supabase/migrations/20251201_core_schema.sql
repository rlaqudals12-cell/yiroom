-- Migration: 코어 스키마 (기본 테이블)
-- Purpose: users 등 핵심 테이블 생성
-- Date: 2025-12-01
-- Note: 기존에 대시보드에서 생성된 테이블들을 마이그레이션으로 정리

-- ============================================================
-- users 테이블 (Clerk 연동)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Service role full access on users" ON users;
CREATE POLICY "Service role full access on users"
  ON users FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- 권한 부여
GRANT SELECT ON TABLE users TO anon;
GRANT SELECT, UPDATE ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

COMMENT ON TABLE users IS 'Clerk 사용자 프로필 (clerk_user_id 기반)';
