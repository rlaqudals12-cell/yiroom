-- Migration: ConnectionAwareness 배치 통계 테이블
-- Purpose: per-request 집계를 물리화하여 읽기 성능 10x 개선
-- Date: 2026-03-11
-- Author: Claude Code
-- ADR: ADR-083 ConnectionAwareness
-- Rollback: DROP TABLE IF EXISTS connection_awareness_stats;

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 사용자별 내재화 통계 캐시 테이블
CREATE TABLE IF NOT EXISTS connection_awareness_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  total_connections INTEGER NOT NULL DEFAULT 0,
  exposed_count INTEGER NOT NULL DEFAULT 0,
  recognized_count INTEGER NOT NULL DEFAULT 0,
  internalized_count INTEGER NOT NULL DEFAULT 0,
  independent_count INTEGER NOT NULL DEFAULT 0,
  internalization_rate NUMERIC(5, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ca_stats_user UNIQUE (clerk_user_id)
);

-- RLS 활성화
ALTER TABLE connection_awareness_stats ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 데이터만 조회
CREATE POLICY "ca_stats_select_own" ON connection_awareness_stats
  FOR SELECT
  USING (clerk_user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- 인덱스: clerk_user_id 조회 (UNIQUE 제약이 커버하지만 명시적)
CREATE INDEX IF NOT EXISTS idx_ca_stats_user ON connection_awareness_stats(clerk_user_id);

-- 코멘트
COMMENT ON TABLE connection_awareness_stats IS '사용자별 ConnectionAwareness 집계 캐시 (cron 매시간 갱신)';
COMMENT ON COLUMN connection_awareness_stats.internalization_rate IS '(internalized + independent) / total, 0~1 범위';

-- ============================================
-- 롤백 스크립트
-- ============================================
-- DROP POLICY IF EXISTS "ca_stats_select_own" ON connection_awareness_stats;
-- DROP INDEX IF EXISTS idx_ca_stats_user;
-- DROP TABLE IF EXISTS connection_awareness_stats;
