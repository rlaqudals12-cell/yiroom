-- Migration: 신고/차단 모더레이션 시스템
-- Purpose: 피드 신고(feed_reports) + 사용자 차단(user_blocks) 테이블 생성
-- Date: 2026-03-09
-- Author: Claude Code
-- ADR: ADR-082-report-block-moderation

-- ============================================
-- 1. feed_reports 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS feed_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_clerk_user_id TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'misinformation', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- 동일 사용자가 같은 게시물 중복 신고 방지
  UNIQUE(reporter_clerk_user_id, post_id)
);

COMMENT ON TABLE feed_reports IS '피드 게시물 신고';
COMMENT ON COLUMN feed_reports.reason IS '신고 사유: spam, harassment, inappropriate_content, misinformation, other';
COMMENT ON COLUMN feed_reports.status IS '처리 상태: pending, reviewed, resolved, dismissed';

-- ============================================
-- 2. user_blocks 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_clerk_user_id TEXT NOT NULL,
  blocked_clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- 동일 차단 관계 중복 방지
  UNIQUE(blocker_clerk_user_id, blocked_clerk_user_id),
  -- 자기 자신 차단 방지
  CHECK (blocker_clerk_user_id != blocked_clerk_user_id)
);

COMMENT ON TABLE user_blocks IS '사용자 차단 (양방향 - 서로의 게시물 비표시)';

-- ============================================
-- 3. RLS 정책
-- ============================================

-- feed_reports RLS
ALTER TABLE feed_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_create_own_reports" ON feed_reports
  FOR INSERT
  WITH CHECK (reporter_clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "users_read_own_reports" ON feed_reports
  FOR SELECT
  USING (reporter_clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- user_blocks RLS
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_blocks" ON user_blocks
  FOR ALL
  USING (blocker_clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- 4. 인덱스
-- ============================================

-- 신고: 게시물별 조회
CREATE INDEX idx_feed_reports_post ON feed_reports(post_id);

-- 신고: 미처리 건 관리자 조회
CREATE INDEX idx_feed_reports_pending ON feed_reports(status) WHERE status = 'pending';

-- 차단: 차단한 사용자 기준 조회
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_clerk_user_id);

-- 차단: 차단당한 사용자 기준 조회 (양방향 필터링)
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_clerk_user_id);
