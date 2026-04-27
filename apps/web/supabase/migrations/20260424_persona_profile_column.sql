-- Migration: integrated_analysis_sessions.persona JSONB 컬럼 추가
-- Purpose: ADR-104 체크리스트 #1 — "나 프로필" 내러티브를 세션에 영구 저장
-- Date: 2026-04-24
-- Author: Claude Code
-- ADR: docs/adr/ADR-104-yiroom-launch-criteria.md
-- Rollback: supabase/migrations/rollback/20260424_persona_profile_column_rollback.sql

-- ============================================
-- persona JSONB 컬럼 추가 (NULLABLE — 구 세션 호환)
-- ============================================

ALTER TABLE integrated_analysis_sessions
  ADD COLUMN IF NOT EXISTS persona JSONB;

COMMENT ON COLUMN integrated_analysis_sessions.persona IS
  'ADR-104 나 프로필 {oneLine, narrative, keyInsights, usedFallback}. null=성공 축 0개 또는 마이그레이션 전 세션';
