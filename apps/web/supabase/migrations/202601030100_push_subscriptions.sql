-- =============================================
-- Push Subscriptions Table for Web Push
-- Phase L: L-1 Web Push 알림
-- =============================================

-- Push 구독 정보 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- Web Push 구독 정보
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,  -- 암호화 키
  auth TEXT NOT NULL,    -- 인증 키

  -- 메타데이터
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,

  -- 사용자당 동일 엔드포인트 중복 방지
  UNIQUE(clerk_user_id, endpoint)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON push_subscriptions(is_active) WHERE is_active = true;

-- RLS 활성화
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 구독만 조회/수정 가능
CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Service Role은 모든 작업 가능 (서버에서 푸시 발송 시)
CREATE POLICY "Service role full access"
  ON push_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- 코멘트
COMMENT ON TABLE push_subscriptions IS 'Web Push 구독 정보 저장';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push 서비스 엔드포인트 URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'P-256 ECDH 공개 키 (Base64)';
COMMENT ON COLUMN push_subscriptions.auth IS '인증 시크릿 (Base64)';
