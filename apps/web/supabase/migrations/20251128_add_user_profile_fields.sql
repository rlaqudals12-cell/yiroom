-- Migration: users 테이블에 gender, birth_date 추가
-- Purpose: N-1 BMR/TDEE 계산을 위한 필드 확장
-- Date: 2025-11-28
-- Version: v2.5

-- Step 1: users 테이블에 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Step 2: 코멘트 추가
COMMENT ON COLUMN users.gender IS '성별 (male/female/other) - BMR 계산용';
COMMENT ON COLUMN users.birth_date IS '생년월일 - 나이 계산용';

-- Step 3: 인덱스 추가 (성별 기반 통계용)
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);

-- 확인 쿼리
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users';
