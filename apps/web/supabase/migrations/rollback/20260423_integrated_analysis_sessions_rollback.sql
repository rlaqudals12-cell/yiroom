-- Rollback: Integrated Analysis Sessions
-- Purpose: 20260423_integrated_analysis_sessions.sql 롤백
-- Date: 2026-04-23
-- 순서: 인덱스 → FK 컬럼 → RLS 정책 → 테이블 (역순)

-- ============================================
-- 1. 인덱스 제거
-- ============================================

DROP INDEX IF EXISTS idx_makeup_analyses_session;
DROP INDEX IF EXISTS idx_hair_analyses_session;
DROP INDEX IF EXISTS idx_body_analyses_session;
DROP INDEX IF EXISTS idx_skin_analyses_session;
DROP INDEX IF EXISTS idx_pc_assessments_session;
DROP INDEX IF EXISTS idx_integrated_sessions_status;
DROP INDEX IF EXISTS idx_integrated_sessions_user;

-- ============================================
-- 2. FK 컬럼 제거 (각 결과 테이블)
-- ============================================

ALTER TABLE makeup_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE hair_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE body_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE skin_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE personal_color_assessments DROP COLUMN IF EXISTS session_id;

-- ============================================
-- 3. RLS 정책 제거
-- ============================================

DROP POLICY IF EXISTS "integrated_sessions_service_role_all" ON integrated_analysis_sessions;
DROP POLICY IF EXISTS "integrated_sessions_delete_own" ON integrated_analysis_sessions;
DROP POLICY IF EXISTS "integrated_sessions_update_own" ON integrated_analysis_sessions;
DROP POLICY IF EXISTS "integrated_sessions_insert_own" ON integrated_analysis_sessions;
DROP POLICY IF EXISTS "integrated_sessions_select_own" ON integrated_analysis_sessions;

-- ============================================
-- 4. 테이블 제거
-- ============================================

DROP TABLE IF EXISTS integrated_analysis_sessions;
