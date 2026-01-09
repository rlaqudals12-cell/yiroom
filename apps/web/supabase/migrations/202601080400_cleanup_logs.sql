-- 자동 삭제 배치 작업 로그 테이블
-- SDD-VISUAL-SKIN-REPORT.md §4.3.4

CREATE TABLE IF NOT EXISTS cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('consent_expiry', 'manual_delete', 'account_delete')),
  processed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running'
);

-- 인덱스 (최근 로그 조회용)
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_started_at
  ON cleanup_logs(started_at DESC);

-- RLS: 관리자만 조회 가능 (service_role만 접근, 일반 사용자 차단)
ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;

-- 일반 사용자는 조회 불가 (service_role은 RLS 우회)
-- 정책 없음 = 모든 일반 사용자 접근 차단

-- 코멘트
COMMENT ON TABLE cleanup_logs IS 'GDPR 자동 삭제 배치 작업 로그';
COMMENT ON COLUMN cleanup_logs.job_type IS '작업 유형: consent_expiry(만료), manual_delete(수동), account_delete(계정삭제)';
