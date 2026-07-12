-- Migration: audit_logs 보관기간 90일 → 730일(2년) 정정
-- Purpose: 생체정보(민감정보) 처리 시스템의 접속기록 보관 의무(개인정보의 안전성 확보조치 기준 §8)
--          충족. 기존 archive_old_audit_logs()가 90일 삭제라 법정 2년 보관을 위반했다.
-- Date: 2026-07-12
-- Author: Claude Code
-- Related: 20260115_audit_logs_security.sql (원 함수), app/api/cron/cleanup-audit-logs (앱 계층 730일과 일치)
-- ⚠️ prod 수동 gap-apply 대상 — 대시보드 SQL Editor에서 실행. db push 금지.

-- ============================================
-- archive_old_audit_logs() 재정의 (90일 → 730일)
-- ============================================

CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 감사(접속)기록: 730일(2년) 이상 경과분만 삭제
  -- 생체·민감정보 시스템의 접속기록 최소 2년 보관 의무 준수
  DELETE FROM audit_logs
  WHERE created_at < now() - INTERVAL '730 days';

  -- 30일 이상된 이미지 접근 로그 삭제 (변경 없음)
  DELETE FROM image_access_logs
  WHERE created_at < now() - INTERVAL '30 days';

  -- 1일 이상된 Rate Limit 레코드 삭제 (변경 없음)
  DELETE FROM rate_limit_records
  WHERE window_start < now() - INTERVAL '1 day';
END;
$$;

COMMENT ON FUNCTION archive_old_audit_logs() IS
  '오래된 로그 자동 정리 함수 (Cron 호출). audit_logs 730일(접속기록 2년 보관 의무), image_access_logs 30일, rate_limit 1일.';

-- Rollback:
-- CREATE OR REPLACE FUNCTION archive_old_audit_logs() ... (INTERVAL '90 days' 로 되돌림)
