-- Migration: Drop OH-1 (구강건강) — ADR-098 정체성 재정의
-- Purpose: OH-1 모듈 완전 제거 — oral_health_assessments 테이블 및 연관 객체 삭제
-- Date: 2026-04-22
-- Author: Claude Code
-- Issue: ADR-098 이룸 정체성 재정의 v2 (5축 모델 확정, OH-1 뷰티 포지셔닝 이질)
-- Rollback: 20260130_oral_health_assessments.sql 재실행 (단, 데이터 유실됨)
--
-- ⚠️ 주의:
-- 이 마이그레이션은 **코드 배포 + 앱 출시 후** 적용해야 합니다.
-- 이유: 기존 사용자가 로컬 캐시된 OH 분석 결과를 가지고 있을 수 있으며,
--       테이블 drop 전에 참조 코드가 완전히 제거되어야 합니다.
-- 적용 시점: Phase 1.5 이후 또는 출시 후 4~8주 (사용자 트래픽 안정화 확인 후)

BEGIN;

-- 1. 트리거 제거
DROP TRIGGER IF EXISTS trigger_oral_health_updated_at ON public.oral_health_assessments;

-- 2. RLS 정책 제거
DROP POLICY IF EXISTS "Users can view own oral health assessments" ON public.oral_health_assessments;
DROP POLICY IF EXISTS "Users can insert own oral health assessments" ON public.oral_health_assessments;
DROP POLICY IF EXISTS "Users can update own oral health assessments" ON public.oral_health_assessments;
DROP POLICY IF EXISTS "Users can delete own oral health assessments" ON public.oral_health_assessments;
DROP POLICY IF EXISTS "Service role has full access to oral health assessments" ON public.oral_health_assessments;

-- 3. 인덱스 제거 (테이블 DROP 시 자동 제거되지만 명시)
DROP INDEX IF EXISTS public.idx_oral_health_assessments_clerk_user_id;
DROP INDEX IF EXISTS public.idx_oral_health_assessments_created_at;
DROP INDEX IF EXISTS public.idx_oral_health_assessments_gum_health;
DROP INDEX IF EXISTS public.idx_oral_health_assessments_overall_score;
DROP INDEX IF EXISTS public.idx_oral_health_assessments_concerns_gin;

-- 4. 테이블 제거 (CASCADE로 의존 객체 함께 제거)
DROP TABLE IF EXISTS public.oral_health_assessments CASCADE;

-- 5. 존재 가능한 보조 테이블 제거 (예방적)
DROP TABLE IF EXISTS public.oral_insights CASCADE;
DROP TABLE IF EXISTS public.oral_analyses CASCADE;

COMMIT;

-- 검증 쿼리 (수동 실행용):
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name LIKE 'oral%';
-- 결과가 비어 있어야 함
