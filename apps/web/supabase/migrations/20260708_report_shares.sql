-- Migration: 스타일 리포트 공개 공유 토큰
-- Purpose: 통합 분석 결과를 비로그인 링크로 공유 (Phase 4 스타일 리포트)
-- Date: 2026-07-08
-- Rollback: DROP TABLE IF EXISTS report_shares;

CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 공유 URL 토큰 — 추측 불가 랜덤값 (UUID). 공개 접근의 유일한 키.
  token TEXT NOT NULL UNIQUE,
  clerk_user_id TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- 소유자가 공유를 끊으면 세팅 (행 삭제 대신 — 감사 추적)
  revoked_at TIMESTAMPTZ
);

COMMENT ON TABLE report_shares IS '스타일 리포트 공개 공유 토큰 (비로그인 열람은 service-role 경유)';

-- RLS: 소유자만 관리. 공개 열람은 서버(service-role)가 token 검증 후 수행 —
-- anon 정책을 열지 않아 토큰 무차별 대입으로 목록을 긁을 수 없다.
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_shares_owner_select" ON report_shares;
CREATE POLICY "report_shares_owner_select" ON report_shares
  FOR SELECT USING (clerk_user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "report_shares_owner_insert" ON report_shares;
CREATE POLICY "report_shares_owner_insert" ON report_shares
  FOR INSERT WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "report_shares_owner_update" ON report_shares;
CREATE POLICY "report_shares_owner_update" ON report_shares
  FOR UPDATE USING (clerk_user_id = (auth.jwt() ->> 'sub'));

CREATE INDEX IF NOT EXISTS idx_report_shares_token ON report_shares(token);
CREATE INDEX IF NOT EXISTS idx_report_shares_session ON report_shares(session_id);
