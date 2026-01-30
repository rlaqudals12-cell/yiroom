-- Migration: Audit Logs & Security Extensions
-- Purpose: GDPR/PIPA 감사 로그 테이블 및 사용자 보안 컬럼 추가
-- Date: 2026-01-15
-- Related: ADR-013 에러 처리 전략, P0-6/P0-7 보안 강화

-- ============================================
-- 1. 감사 로그 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 액션 정보
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',

  -- 대상 정보
  target_user_id TEXT,
  target_table TEXT,
  target_record_id UUID,

  -- 실행자 정보
  performed_by TEXT NOT NULL,
  performed_by_type TEXT DEFAULT 'system' CHECK (performed_by_type IN ('user', 'admin', 'system', 'cron')),

  -- IP 및 User-Agent (선택적)
  ip_address INET,
  user_agent TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);

-- 액션 타입 상수
COMMENT ON TABLE audit_logs IS '시스템 감사 로그 - 민감 데이터 접근/변경 기록';
COMMENT ON COLUMN audit_logs.action IS '액션 유형: IMAGE_ANONYMIZATION, COMPLETE_DATA_PURGE, LOGIN_ATTEMPT, DATA_EXPORT, CONSENT_CHANGE 등';
COMMENT ON COLUMN audit_logs.performed_by IS '실행자: clerk_user_id, admin:xxx, system:cron:xxx 형식';

-- ============================================
-- 2. users 테이블 보안 컬럼 추가
-- ============================================

-- 이미지 익명화 상태
ALTER TABLE users
ADD COLUMN IF NOT EXISTS images_anonymized BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS images_anonymized_at TIMESTAMPTZ;

-- 데이터 완전 삭제 상태 (탈퇴 처리 완료)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS data_purged BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS data_purged_at TIMESTAMPTZ;

-- 탈퇴 요청 시간 (soft delete)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 마지막 로그인 시간 (미접속 판정용)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN users.images_anonymized IS '30일 미접속 시 이미지 익명화 여부';
COMMENT ON COLUMN users.data_purged IS '탈퇴 후 72시간 경과 완전 삭제 여부';
COMMENT ON COLUMN users.deleted_at IS '탈퇴 요청 시간 (soft delete)';
COMMENT ON COLUMN users.last_sign_in_at IS '마지막 로그인 시간';

-- 인덱스 (미접속 사용자 조회용)
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in ON users(last_sign_in_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_images_anonymized ON users(images_anonymized) WHERE images_anonymized = FALSE;

-- ============================================
-- 3. 이미지 접근 로그 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS image_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 이미지 정보
  image_url TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT,

  -- 접근자 정보
  accessed_by TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'analyze', 'delete')),

  -- 요청 정보
  ip_address INET,
  user_agent TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_image_access_logs_accessed_by ON image_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_image_access_logs_created_at ON image_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_access_logs_bucket ON image_access_logs(bucket_name);

COMMENT ON TABLE image_access_logs IS '이미지 접근 로그 - 민감 이미지 접근 추적';

-- ============================================
-- 4. Rate Limiting 테이블 (선택적)
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 식별자
  key TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('user', 'ip', 'endpoint')),

  -- 카운터
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),

  -- 메타데이터
  endpoint TEXT,

  UNIQUE(key, key_type, endpoint)
);

-- 인덱스 (만료된 레코드 정리용)
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_records(window_start);

COMMENT ON TABLE rate_limit_records IS 'API Rate Limiting 카운터 (Redis 도입 전 임시)';

-- ============================================
-- 5. RLS 정책
-- ============================================

-- audit_logs: 읽기 전용 (관리자만)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are read-only for admins" ON audit_logs
  FOR SELECT
  USING (
    -- 관리자 역할 확인 또는 서비스 역할
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    OR current_setting('role', true) = 'service_role'
  );

-- image_access_logs: 본인 로그만 조회 가능
ALTER TABLE image_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own image access logs" ON image_access_logs
  FOR SELECT
  USING (
    accessed_by = current_setting('request.jwt.claims', true)::json->>'sub'
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );

-- rate_limit_records: 서비스 역할만 접근
ALTER TABLE rate_limit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rate limit records for service role only" ON rate_limit_records
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 6. 자동 정리 함수 (30일 이상 감사 로그 아카이브)
-- ============================================

CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 90일 이상된 감사 로그 삭제 (필요시 아카이브 테이블로 이동)
  DELETE FROM audit_logs
  WHERE created_at < now() - INTERVAL '90 days';

  -- 30일 이상된 이미지 접근 로그 삭제
  DELETE FROM image_access_logs
  WHERE created_at < now() - INTERVAL '30 days';

  -- 1일 이상된 Rate Limit 레코드 삭제
  DELETE FROM rate_limit_records
  WHERE window_start < now() - INTERVAL '1 day';
END;
$$;

COMMENT ON FUNCTION archive_old_audit_logs() IS '오래된 로그 자동 정리 함수 (Cron에서 호출)';
