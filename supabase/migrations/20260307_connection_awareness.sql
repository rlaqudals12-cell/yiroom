-- Migration: ConnectionAwareness
-- Purpose: "A라서 B" 연결의 내재화 추적 테이블
-- Date: 2026-03-07
-- Author: Claude Code
-- Spec: docs/principles/connection-awareness-spec.md
-- Rollback: DROP TABLE IF EXISTS connection_awareness;

-- ============================================
-- 전방 마이그레이션 (Forward Migration)
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS connection_awareness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  source_module TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  connection_rule TEXT NOT NULL,
  exposure_count INTEGER DEFAULT 0,
  confirmed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'exposed'
    CHECK (status IN ('exposed', 'recognized', 'internalized', 'independent')),
  last_exposed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (clerk_user_id, connection_id)
);

COMMENT ON TABLE connection_awareness IS '사용자의 교차 인사이트 연결 내재화 추적';
COMMENT ON COLUMN connection_awareness.connection_id IS '연결 식별자 (예: pc-warm-coral-lip)';
COMMENT ON COLUMN connection_awareness.connection_rule IS '"A라서 B" 형태의 자연어 연결 규칙';
COMMENT ON COLUMN connection_awareness.status IS '내재화 상태: exposed → recognized → internalized → independent';

-- 2. RLS 정책
ALTER TABLE connection_awareness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_connections_select"
  ON connection_awareness FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_connections_insert"
  ON connection_awareness FOR INSERT
  WITH CHECK (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_connections_update"
  ON connection_awareness FOR UPDATE
  USING (clerk_user_id = auth.get_user_id());

-- 3. 인덱스
CREATE INDEX idx_connection_awareness_user
  ON connection_awareness(clerk_user_id);

CREATE INDEX idx_connection_awareness_status
  ON connection_awareness(clerk_user_id, status);

CREATE INDEX idx_connection_awareness_module
  ON connection_awareness(clerk_user_id, source_module);
