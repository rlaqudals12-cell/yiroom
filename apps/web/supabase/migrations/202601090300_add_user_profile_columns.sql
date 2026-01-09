-- users 테이블에 프로필 컬럼 추가
-- 생성일: 2026-01-09

-- first_name 컬럼 추가 (Clerk 연동용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;

-- last_name 컬럼 추가 (Clerk 연동용)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- image_url 컬럼 추가 (Clerk 프로필 이미지)
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 추가 (이름 검색용)
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE 'Added first_name, last_name, image_url columns to users table';
END $$;
