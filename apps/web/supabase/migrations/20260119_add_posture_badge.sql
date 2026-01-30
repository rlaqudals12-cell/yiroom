-- Migration: 자세 분석 완료 배지 추가
-- Purpose: W-1 자세 분석 전용 배지 추가
-- Date: 2026-01-19
-- Author: Claude Code

-- ============================================================
-- Step 1: posture 분석 완료 배지 추가
-- ============================================================
INSERT INTO badges (code, name, description, icon, category, rarity, requirement, xp_reward, sort_order) VALUES
('analysis_posture_complete', '자세 분석 완료', '자세 분석을 완료했어요!', '🧘', 'analysis', 'common', '{"type": "complete", "domain": "analysis", "module": "posture"}', 20, 43)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Step 2: 전체 분석 완료 배지 (4개 모듈 완료 시)
-- ============================================================
-- 기존 analysis_all_complete 배지가 있다면 업데이트
UPDATE badges
SET requirement = '{"type": "complete", "domain": "analysis", "modules": ["personal-color", "skin", "body", "posture"]}'
WHERE code = 'analysis_all_complete';

-- 없다면 새로 생성
INSERT INTO badges (code, name, description, icon, category, rarity, requirement, xp_reward, sort_order) VALUES
('analysis_all_complete', '완벽한 자기 이해', '모든 분석(퍼스널컬러, 피부, 체형, 자세)을 완료했어요!', '🏅', 'analysis', 'rare', '{"type": "complete", "domain": "analysis", "modules": ["personal-color", "skin", "body", "posture"]}', 100, 44)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 코멘트
-- ============================================================
COMMENT ON COLUMN badges.sort_order IS '표시 정렬 순서 - 분석 배지는 40번대';
