-- 이미지 저장 동의 테이블 (GDPR/PIPA 컴플라이언스)
-- SDD-VISUAL-SKIN-REPORT.md §4.3.1

CREATE TABLE IF NOT EXISTS image_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('skin', 'body', 'personal-color')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  consent_at TIMESTAMPTZ,
  withdrawal_at TIMESTAMPTZ,
  retention_until TIMESTAMPTZ,  -- 동의일로부터 1년 후
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 사용자당 분석 타입별 하나의 동의만 존재
  UNIQUE(clerk_user_id, analysis_type)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_image_consents_clerk_user_id
  ON image_consents(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_image_consents_retention
  ON image_consents(retention_until)
  WHERE consent_given = true;

-- RLS 정책 (CRUD 완전 지원)
ALTER TABLE image_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "image_consents_select_own"
  ON image_consents FOR SELECT
  USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "image_consents_insert_own"
  ON image_consents FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "image_consents_update_own"
  ON image_consents FOR UPDATE
  USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- GDPR 철회권: 본인 동의 삭제 가능
CREATE POLICY "image_consents_delete_own"
  ON image_consents FOR DELETE
  USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_image_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_image_consents_updated_at
  BEFORE UPDATE ON image_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_image_consents_updated_at();

-- 코멘트
COMMENT ON TABLE image_consents IS '이미지 저장 동의 관리 (GDPR/PIPA 컴플라이언스)';
COMMENT ON COLUMN image_consents.consent_version IS '동의서 버전 (변경 시 재동의 필요)';
COMMENT ON COLUMN image_consents.retention_until IS '데이터 보관 만료일 (동의일 + 1년)';
