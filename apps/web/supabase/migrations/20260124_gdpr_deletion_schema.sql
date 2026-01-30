-- GDPR 사용자 삭제 시스템 스키마
-- SDD-GDPR-DELETION-CRON.md 기반
-- Created: 2026-01-24

-- ================================================
-- 1. users 테이블 삭제 관련 컬럼 추가
-- ================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 삭제 예정 사용자 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled
  ON users(deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL;

-- Soft Delete 사용자 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN users.deletion_requested_at IS '삭제 요청 일시';
COMMENT ON COLUMN users.deletion_scheduled_at IS '삭제 예정 일시 (요청일 + 30일)';
COMMENT ON COLUMN users.deleted_at IS 'Soft Delete 일시';


-- ================================================
-- 2. 삭제 감사 로그 테이블
-- ================================================

CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'DELETION_REQUESTED',
    'DELETION_CANCELLED',
    'REMINDER_7D_SENT',
    'REMINDER_3D_SENT',
    'REMINDER_1D_SENT',
    'SOFT_DELETED',
    'HARD_DELETED',
    'CLERK_DELETED',
    'HARD_DELETE_FAILED'
  )),
  performed_at TIMESTAMPTZ DEFAULT now(),
  details JSONB,
  is_permanent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_deletion_audit_user
  ON deletion_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_deletion_audit_action
  ON deletion_audit_log(action, performed_at DESC);

-- 코멘트
COMMENT ON TABLE deletion_audit_log IS 'GDPR 삭제 프로세스 감사 로그 (불변)';
COMMENT ON COLUMN deletion_audit_log.is_permanent IS 'true인 경우 수정/삭제 불가 (감사 목적)';


-- ================================================
-- 3. 감사 로그 불변성 트리거
-- ================================================

CREATE OR REPLACE FUNCTION prevent_deletion_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_permanent = true THEN
    RAISE EXCEPTION 'Cannot modify permanent audit log';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.is_permanent = true THEN
    RAISE EXCEPTION 'Cannot delete permanent audit log';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_deletion_audit_update ON deletion_audit_log;
CREATE TRIGGER prevent_deletion_audit_update
  BEFORE UPDATE OR DELETE ON deletion_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_deletion_audit_modification();


-- ================================================
-- 4. RLS 정책
-- ================================================

ALTER TABLE deletion_audit_log ENABLE ROW LEVEL SECURITY;

-- service_role만 전체 접근 (RLS 우회)
-- 일반 사용자는 접근 불가 (정책 없음 = 차단)


-- ================================================
-- 5. cleanup_logs 테이블 확장 (기존 테이블 호환)
-- ================================================

-- job_type에 새 값 추가를 위한 CHECK 제약 갱신
ALTER TABLE cleanup_logs DROP CONSTRAINT IF EXISTS cleanup_logs_job_type_check;
ALTER TABLE cleanup_logs ADD CONSTRAINT cleanup_logs_job_type_check
  CHECK (job_type IN (
    'consent_expiry',
    'manual_delete',
    'account_delete',
    'deletion_reminder',
    'soft_delete',
    'hard_delete'
  ));
