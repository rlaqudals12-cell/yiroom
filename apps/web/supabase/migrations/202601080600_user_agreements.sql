-- 서비스 약관동의 테이블
-- SDD-TERMS-AGREEMENT.md §4.1

CREATE TABLE IF NOT EXISTS user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 동의 항목별 상태
  terms_agreed BOOLEAN NOT NULL DEFAULT false,       -- (필수) 이용약관
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,     -- (필수) 개인정보 수집/이용
  marketing_agreed BOOLEAN NOT NULL DEFAULT false,   -- (선택) 마케팅 정보 수신

  -- 동의 버전 (약관 변경 시 재동의 필요)
  terms_version TEXT NOT NULL DEFAULT '1.0',
  privacy_version TEXT NOT NULL DEFAULT '1.0',

  -- 타임스탬프
  terms_agreed_at TIMESTAMPTZ,
  privacy_agreed_at TIMESTAMPTZ,
  marketing_agreed_at TIMESTAMPTZ,
  marketing_withdrawn_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT user_agreements_clerk_user_id_key UNIQUE (clerk_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_agreements_clerk_user_id
ON user_agreements(clerk_user_id);

-- RLS 활성화
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 자신의 동의 정보만 조회 가능
DROP POLICY IF EXISTS "Users can view own agreements" ON user_agreements;
CREATE POLICY "Users can view own agreements"
ON user_agreements FOR SELECT
TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'));

-- RLS 정책: 자신의 동의 정보만 생성 가능
DROP POLICY IF EXISTS "Users can insert own agreements" ON user_agreements;
CREATE POLICY "Users can insert own agreements"
ON user_agreements FOR INSERT
TO authenticated
WITH CHECK (clerk_user_id = (SELECT auth.jwt()->>'sub'));

-- RLS 정책: 자신의 마케팅 동의만 수정 가능
DROP POLICY IF EXISTS "Users can update own agreements" ON user_agreements;
CREATE POLICY "Users can update own agreements"
ON user_agreements FOR UPDATE
TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_user_id = (SELECT auth.jwt()->>'sub'));

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_user_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_agreements_updated_at ON user_agreements;
CREATE TRIGGER user_agreements_updated_at
  BEFORE UPDATE ON user_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_user_agreements_updated_at();
