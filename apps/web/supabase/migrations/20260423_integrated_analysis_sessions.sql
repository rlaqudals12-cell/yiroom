-- Migration: Integrated Analysis Sessions (5축 병렬 분석)
-- Purpose: ADR-099 통합 분석 플로우 — 5축(PC/S/C/H/M) 병렬 분석 세션 관리
-- Date: 2026-04-23
-- Author: Claude Code
-- ADR: docs/adr/ADR-099-integrated-analysis-flow.md
-- Spec: docs/specs/SDD-INTEGRATED-ANALYSIS.md
-- Rollback: supabase/migrations/rollback/20260423_integrated_analysis_sessions_rollback.sql

-- ============================================
-- 1. integrated_analysis_sessions 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS integrated_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,

  -- 이미지 저장 경로 (Supabase Storage)
  face_image_url TEXT,
  body_image_url TEXT,  -- NULL 허용 (C-1 자가입력만 경우)

  -- 축별 자가입력 (JSONB)
  questionnaire JSONB NOT NULL DEFAULT '{}',

  -- 세션 상태
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'completed', 'failed')),

  -- 5축 결과 집계
  axes_completed TEXT[] NOT NULL DEFAULT '{}',
  axes_failed TEXT[] NOT NULL DEFAULT '{}',
  used_fallback TEXT[] NOT NULL DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 코멘트
COMMENT ON TABLE integrated_analysis_sessions IS 'ADR-099 통합 분석 플로우 — 5축 병렬 분석 세션';
COMMENT ON COLUMN integrated_analysis_sessions.face_image_url IS '얼굴 셀카 Storage 경로 (PC/S/H 축 공유)';
COMMENT ON COLUMN integrated_analysis_sessions.body_image_url IS '전신 사진 Storage 경로 (C 축 전용, NULL 시 자가입력 기반 추정)';
COMMENT ON COLUMN integrated_analysis_sessions.questionnaire IS '축별 자가입력 {skin, hair, body}';
COMMENT ON COLUMN integrated_analysis_sessions.status IS 'pending→partial/completed/failed';
COMMENT ON COLUMN integrated_analysis_sessions.axes_completed IS '성공한 축 코드 (personal_color/skin/body/hair/makeup)';
COMMENT ON COLUMN integrated_analysis_sessions.axes_failed IS '실패한 축 코드 배열';
COMMENT ON COLUMN integrated_analysis_sessions.used_fallback IS 'Mock Fallback이 적용된 축 코드 배열';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_integrated_sessions_user
  ON integrated_analysis_sessions(clerk_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integrated_sessions_status
  ON integrated_analysis_sessions(status)
  WHERE status IN ('pending', 'partial');

-- ============================================
-- 2. RLS 정책 (세션 테이블)
-- ============================================

ALTER TABLE integrated_analysis_sessions ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회 ((SELECT ...) 래핑으로 InitPlan 캐싱)
CREATE POLICY "integrated_sessions_select_own" ON integrated_analysis_sessions
  FOR SELECT
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

-- 본인 데이터만 삽입
CREATE POLICY "integrated_sessions_insert_own" ON integrated_analysis_sessions
  FOR INSERT
  WITH CHECK (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

-- 본인 데이터만 수정 (status/axes 업데이트 허용)
CREATE POLICY "integrated_sessions_update_own" ON integrated_analysis_sessions
  FOR UPDATE
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

-- 본인 데이터만 삭제
CREATE POLICY "integrated_sessions_delete_own" ON integrated_analysis_sessions
  FOR DELETE
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

-- 서비스 역할 전체 접근 (API Route가 service role로 DB 저장)
CREATE POLICY "integrated_sessions_service_role_all" ON integrated_analysis_sessions
  FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================
-- 3. 기존 5개 분석 테이블에 session_id FK 추가 (NULLABLE, 하위 호환)
-- ============================================

-- 3.1 PC — personal_color_assessments
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

COMMENT ON COLUMN personal_color_assessments.session_id IS '통합 분석 세션 FK (NULL=개별 분석, 값 있음=통합 분석)';

-- 3.2 S — skin_analyses
ALTER TABLE skin_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

COMMENT ON COLUMN skin_analyses.session_id IS '통합 분석 세션 FK (NULL=개별 분석)';

-- 3.3 C — body_analyses
ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

COMMENT ON COLUMN body_analyses.session_id IS '통합 분석 세션 FK (NULL=개별 분석)';

-- 3.4 H — hair_analyses
ALTER TABLE hair_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

COMMENT ON COLUMN hair_analyses.session_id IS '통합 분석 세션 FK (NULL=개별 분석)';

-- 3.5 M — makeup_analyses
ALTER TABLE makeup_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

COMMENT ON COLUMN makeup_analyses.session_id IS '통합 분석 세션 FK (NULL=개별 분석)';

-- ============================================
-- 4. session_id 조회 성능 인덱스 (부분 인덱스)
-- ============================================

-- 통합 분석 세션에서 결과 조회 시 빠른 lookup
-- 부분 인덱스: session_id IS NOT NULL인 행만 (통합 분석 레코드만)

CREATE INDEX IF NOT EXISTS idx_pc_assessments_session
  ON personal_color_assessments(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_skin_analyses_session
  ON skin_analyses(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_body_analyses_session
  ON body_analyses(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hair_analyses_session
  ON hair_analyses(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_makeup_analyses_session
  ON makeup_analyses(session_id)
  WHERE session_id IS NOT NULL;
