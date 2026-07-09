-- Migration: beauty_profiles.progressive_data 컬럼 보강
-- Purpose: app/api/user/progressive-profile이 읽고 쓰는 컬럼이 원 마이그레이션
--   (20260304_capsule_foundation)에 누락돼 prod에서 유령 배선 상태였음 — 정합 복구.
-- Date: 2026-07-10
-- Rollback: ALTER TABLE beauty_profiles DROP COLUMN IF EXISTS progressive_data;

ALTER TABLE beauty_profiles
  ADD COLUMN IF NOT EXISTS progressive_data JSONB DEFAULT '{}';

COMMENT ON COLUMN beauty_profiles.progressive_data IS
  'Progressive Profiling 자발 입력 병합 저장 (모듈별 임의 키). 분석 파생값과 분리.';
