-- Migration: AI 트윈 (ADR-115)
-- Purpose: 사용자 승인 기반 AI 트윈 메타데이터 + 전용 비공개 Storage 버킷.
--   승인 게이트(pending→approved)가 핵심 — 안 닮은 트윈을 강요하지 않는다.
-- Date: 2026-07-10
-- Author: Claude Code
-- Rollback: DROP TABLE IF EXISTS user_twins; DELETE FROM storage.buckets WHERE id='twins';

CREATE TABLE IF NOT EXISTS user_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  image_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  source_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_twins_user_status ON user_twins(clerk_user_id, status);

ALTER TABLE user_twins ENABLE ROW LEVEL SECURITY;

-- prod 구패턴(auth.jwt()->>'sub') 정합 — auth.get_user_id() 없음
DROP POLICY IF EXISTS "twins_select_own" ON user_twins;
CREATE POLICY "twins_select_own" ON user_twins
  FOR SELECT USING (clerk_user_id = auth.jwt()->>'sub');
DROP POLICY IF EXISTS "twins_insert_own" ON user_twins;
CREATE POLICY "twins_insert_own" ON user_twins
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt()->>'sub');
DROP POLICY IF EXISTS "twins_update_own" ON user_twins;
CREATE POLICY "twins_update_own" ON user_twins
  FOR UPDATE USING (clerk_user_id = auth.jwt()->>'sub');
DROP POLICY IF EXISTS "twins_delete_own" ON user_twins;
CREATE POLICY "twins_delete_own" ON user_twins
  FOR DELETE USING (clerk_user_id = auth.jwt()->>'sub');

COMMENT ON TABLE user_twins IS 'AI 트윈 메타 (ADR-115). 원본 사진은 저장하지 않음. approved는 사용자당 1개 원칙(앱 레벨).';

-- 전용 비공개 Storage 버킷 (분석 이미지와 분리 — ADR-113 표현 레이어)
INSERT INTO storage.buckets (id, name, public)
VALUES ('twins', 'twins', false)
ON CONFLICT (id) DO NOTHING;
