-- ============================================================
-- 피드백 테이블
-- Sprint D Day 9: 운영 기능
-- ============================================================

-- 1. feedback: 사용자 피드백
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'suggestion', 'question', 'other')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  contact_email VARCHAR(255),
  screenshot_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_feedback_clerk_user_id
  ON feedback(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type
  ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status
  ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at
  ON feedback(created_at DESC);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 피드백만 조회 가능
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 사용자: 피드백 생성 가능
CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- 관리자: 모든 피드백 조회/수정 가능 (service_role 사용)

-- ============================================================
-- Trigger: updated_at 자동 갱신
-- ============================================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- ============================================================
-- 주석
-- ============================================================

COMMENT ON TABLE feedback IS '사용자 피드백 (버그 신고, 기능 제안, 문의)';
COMMENT ON COLUMN feedback.type IS 'bug: 버그, suggestion: 제안, question: 문의, other: 기타';
COMMENT ON COLUMN feedback.status IS 'pending: 대기, in_progress: 처리 중, resolved: 해결, closed: 종료';
COMMENT ON COLUMN feedback.screenshot_url IS '첨부 스크린샷 URL';
COMMENT ON COLUMN feedback.admin_notes IS '관리자 메모';
