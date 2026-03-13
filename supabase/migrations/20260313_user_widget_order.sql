-- Migration: 위젯 순서 Supabase 동기화
-- Purpose: 홈 위젯 순서를 users 테이블 JSONB에 저장하여 디바이스 간 동기화
-- Date: 2026-03-13
-- Author: Claude Code
-- Rollback: ALTER TABLE users DROP COLUMN IF EXISTS widget_order;

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. users 테이블에 widget_order JSONB 컬럼 추가
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS widget_order JSONB;

-- 2. 코멘트
COMMENT ON COLUMN users.widget_order IS '홈 위젯 순서 배열 (예: ["insight","capsule","analysis-summary","activity-bar","recently-viewed"])';
