-- Migration: body_analyses 테이블에 user_latest 인덱스 추가
-- Purpose: N-1 BMR 계산 시 최신 체형 분석 조회 최적화
-- Date: 2025-11-28
-- Reference: Database-스키마-v2.5-업데이트-권장.md

-- 최신 분석 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_body_analyses_user_latest
  ON body_analyses(user_id, created_at DESC);

-- 코멘트 추가
COMMENT ON INDEX idx_body_analyses_user_latest IS 'N-1 모듈에서 최신 키/몸무게 조회용';
