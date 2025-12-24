-- ============================================================
-- 친구 시스템 테이블
-- Phase H Sprint 2: 소셜 기능
-- ============================================================

-- 1. friendships 테이블 (친구 관계)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,

  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 요청 방지
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
  -- 자기 자신 친구 추가 방지
  CONSTRAINT no_self_friendship CHECK (requester_id <> addressee_id)
);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- 본인 관련 친구 관계만 조회 가능
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (
    requester_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    addressee_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- 본인만 친구 요청 가능
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (requester_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 본인 관련 친구 관계만 수정 가능
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (
    requester_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    addressee_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
  WITH CHECK (
    requester_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    addressee_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- 본인 관련 친구 관계만 삭제 가능
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (
    requester_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    addressee_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_created ON friendships(created_at DESC);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_friendships_updated_at ON friendships;
CREATE TRIGGER trigger_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendships_updated_at();
