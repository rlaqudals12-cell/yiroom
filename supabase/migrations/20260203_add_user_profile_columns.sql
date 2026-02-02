-- Migration: Add user profile columns
-- Purpose: users 테이블에 first_name, last_name, image_url 컬럼 추가 (sync-user API 호환)
-- Date: 2026-02-03
-- Author: Claude Code
-- Issue: PGRST204 에러 해결 - schema cache에서 first_name 컬럼 누락

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- first_name 컬럼 추가 (존재하지 않는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'first_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN first_name TEXT;
        COMMENT ON COLUMN public.users.first_name IS 'Clerk에서 동기화된 사용자 이름';
    END IF;
END $$;

-- last_name 컬럼 추가 (존재하지 않는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'last_name'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_name TEXT;
        COMMENT ON COLUMN public.users.last_name IS 'Clerk에서 동기화된 사용자 성';
    END IF;
END $$;

-- image_url 컬럼 추가 (존재하지 않는 경우에만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN image_url TEXT;
        COMMENT ON COLUMN public.users.image_url IS 'Clerk에서 동기화된 프로필 이미지 URL';
    END IF;
END $$;

-- ============================================
-- 롤백 스크립트 (참고용)
-- ============================================
-- ALTER TABLE public.users DROP COLUMN IF EXISTS first_name;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS last_name;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS image_url;
