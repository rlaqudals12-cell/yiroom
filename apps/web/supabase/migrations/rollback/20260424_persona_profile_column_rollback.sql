-- Rollback: persona JSONB 컬럼 제거
-- Purpose: 20260424_persona_profile_column.sql 롤백

ALTER TABLE integrated_analysis_sessions DROP COLUMN IF EXISTS persona;
